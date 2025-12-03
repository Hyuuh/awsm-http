import { useWorkspaceStore } from "@/features/workspace/stores/workspace-store";
import { getFaker } from "@/features/scripting/services/faker-service";
import { VesperTheme } from "../themes/vesper";
import { VesperLightTheme } from "../themes/vesper-light";
import { type Monaco } from "@monaco-editor/react";

export const handleEditorDidMount = (monaco: Monaco) => {
  monaco.editor.defineTheme("Vesper", VesperTheme as any);
  monaco.editor.defineTheme("VesperLight", VesperLightTheme as any);

  // Generate Faker type definition
  const faker = getFaker("en");
  let fakerTypeProps = "";

  try {
    const modules = Object.keys(faker).filter(
      (k) => typeof (faker as any)[k] === "object"
    );

    modules.forEach((moduleName) => {
      const moduleObj = (faker as any)[moduleName];
      let methods = "";
      Object.keys(moduleObj).forEach((methodName) => {
        if (typeof moduleObj[methodName] === "function") {
          methods += `      ${methodName}(): string;\n`;
        }
      });
      if (methods) {
        fakerTypeProps += `    ${moduleName}: {\n${methods}    };\n`;
      }
    });
  } catch (e) {
    console.error("Failed to generate faker types", e);
  }

  // Add type definitions for 'awsm' global in JavaScript
  monaco.languages.typescript.javascriptDefaults.addExtraLib(
    `
    /**
     * The global object available in Pre-request and Test scripts.
     */
    declare const awsm: {
      variables: {
        /** Get an environment variable */
        get(key: string): string | undefined;
        /** Set an environment variable */
        set(key: string, value: string): void;
      };
      /** Log messages to the console and toast */
      log(...args: any[]): void;
      /** The current request object */
      request?: {
        url: string;
        method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
        headers: Array<{ key: string; value: string; enabled: boolean }>;
        body: {
          type: "json" | "text" | "xml" | "html" | "form-data" | "x-www-form-urlencoded" | "binary" | "none";
          content: string;
        };
      };
      /** The response object (only available in Test scripts) */
      response?: {
        status: number;
        statusText: string;
        time: number;
        size: number;
        headers: Record<string, string>;
        body: any;
        rawBody: string;
      };
      /**
       * Define a test case.
       * @param name The name of the test
       * @param callback The function to execute. Receives a log function to set a description.
       */
      test(name: string, callback: (log: (message: string) => void) => void): void;
      /** Faker instance for generating random data */
      faker: {
${fakerTypeProps}
      };
    };
    `,
    "ts:filename/awsm.d.ts"
  );

  // Register completion provider for JSON
  monaco.languages.registerCompletionItemProvider("json", {
    triggerCharacters: ["{", "."],
    provideCompletionItems: (model: any, position: any) => {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      // Environment variables
      if (textUntilPosition.endsWith("{{")) {
        const state = useWorkspaceStore.getState();
        const activeEnv = state.environments.find(
          (e) => e.id === state.activeEnvironmentId
        );
        const globalVariables = state.globalVariables || [];

        const suggestions: any[] = [];

        // Add global variables
        suggestions.push(
          ...globalVariables.map((v) => ({
            label: v.key,
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: v.key + "}}",
            detail: `Global: ${v.value}`,
          }))
        );

        if (activeEnv) {
          suggestions.push(
            ...activeEnv.variables.map((v) => ({
              label: v.key,
              kind: monaco.languages.CompletionItemKind.Variable,
              insertText: v.key + "}}",
              detail: `Env: ${v.value}`,
            }))
          );
        }

        return { suggestions };
      }

      return { suggestions: [] };
    },
  });
};
