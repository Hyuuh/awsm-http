import { RequestData, ResponseData, TestResult } from "@/types";
import { getFaker } from "@/features/scripting/services/faker-service";

interface ScriptContext {
  request?: RequestData;
  response?: ResponseData;
  variables: Record<string, string>;
  fakerLocale?: string;
}

interface ScriptResult {
  variables: Record<string, string>;
  logs: string[];
  error?: string;
  testResults: TestResult[];
}

export class ScriptExecutor {
  static execute(script: string, context: ScriptContext): ScriptResult {
    if (!script || script.trim() === "") {
      return { variables: context.variables, logs: [], testResults: [] };
    }

    const logs: string[] = [];
    const testResults: TestResult[] = [];
    const variables = { ...context.variables };
    const faker = getFaker(context.fakerLocale || "en");

    const awsm = {
      variables: {
        get: (key: string) => variables[key],
        set: (key: string, value: string) => {
          variables[key] = value;
        },
      },
      log: (...args: any[]) => {
        logs.push(args.map((a) => String(a)).join(" "));
      },
      test: (name: string, callback: (log: (msg: string) => void) => void) => {
        let description: string | undefined;
        const logFn = (msg: string) => {
          description = msg;
        };

        try {
          callback(logFn);
          testResults.push({ name, status: "passed", description });
        } catch (e: any) {
          testResults.push({
            name,
            status: "failed",
            error: e.message,
            description,
          });
        }
      },
      faker: faker,
      request: context.request,
      response: context.response,
    };

    try {
      // Wrap in an async function to allow await if needed (though we run it synchronously here mostly)
      // We use new Function to create a sandbox-like scope
      const func = new Function("awsm", script);
      func(awsm);
    } catch (err: any) {
      return {
        variables,
        logs,
        testResults,
        error: err.message || "Unknown script error",
      };
    }

    return { variables, logs, testResults };
  }
}
