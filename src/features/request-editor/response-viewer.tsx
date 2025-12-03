import { ResponseData } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Editor, type Monaco } from "@monaco-editor/react";
import { VesperTheme } from "./themes/vesper";
import { VesperLightTheme } from "./themes/vesper-light";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { useState, useEffect } from "react";
import { TypeGeneratorDialog } from "./type-generator-dialog";

interface ResponseViewerProps {
  response: ResponseData;
}

const handleEditorDidMount = (monaco: Monaco) => {
  monaco.editor.defineTheme("Vesper", VesperTheme as any);
  monaco.editor.defineTheme("VesperLight", VesperLightTheme as any);
};

export function ResponseViewer({ response }: ResponseViewerProps) {
  const { theme } = useTheme();

  const isSuccess = response.status >= 200 && response.status < 300;
  const isError = response.status >= 400;

  const isJson = typeof response.body === "object" && response.body !== null;

  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="body" className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between px-4 border-b bg-muted/5 min-h-10">
          <TabsList className="h-full bg-transparent p-0">
            <TabsTrigger
              value="body"
              className="h-[39px] rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs px-4"
            >
              Body
            </TabsTrigger>
            <TabsTrigger
              value="headers"
              className="h-[39px] rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs px-4"
            >
              Headers
            </TabsTrigger>
            <TabsTrigger
              value="raw"
              className="h-[39px] rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs px-4"
            >
              Raw
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4 text-xs">
            {isJson && <TypeGeneratorDialog json={response.body} />}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Status:</span>
              <span
                className={cn(
                  "font-bold",
                  isSuccess
                    ? "text-green-500"
                    : isError
                    ? "text-red-500"
                    : "text-yellow-500"
                )}
              >
                {response.status} {response.statusText}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Time:</span>
              <span className="font-mono">{response.time}ms</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Size:</span>
              <span className="font-mono">
                {(response.size / 1024).toFixed(2)} KB
              </span>
            </div>
          </div>
        </div>

        <TabsContent value="body" className="flex-1 min-h-0 m-0 p-0 relative">
          <div className="absolute inset-0 overflow-auto">
            <Editor
              width="100%"
              height="100%"
              language="json"
              value={
                typeof response.body === "string"
                  ? response.body
                  : JSON.stringify(response.body, null, 2)
              }
              theme={theme === "dark" ? "Vesper" : "VesperLight"}
              beforeMount={handleEditorDidMount}
              options={{
                readOnly: true,
                fontSize: 14,
                fontFamily: "Jetbrains-Mono",
                fontLigatures: true,
                wordWrap: "on",
                minimap: {
                  enabled: false,
                },
                bracketPairColorization: {
                  enabled: true,
                },
                cursorBlinking: "expand",
                formatOnPaste: true,
                suggest: {
                  showFields: false,
                  showFunctions: false,
                },
              }}
              className="h-full text-sm"
            />
          </div>
        </TabsContent>

        <TabsContent
          value="headers"
          className="flex-1 min-h-0 m-0 p-4 overflow-auto"
        >
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm font-mono">
            {Object.entries(response.headers).map(([key, value]) => (
              <div key={key} className="contents">
                <span className="text-muted-foreground text-right">{key}:</span>
                <span className="break-all">{value}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent
          value="raw"
          className="flex-1 min-h-0 m-0 p-4 overflow-auto"
        >
          <pre className="text-xs font-mono whitespace-pre-wrap break-all">
            {response.rawBody}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
}
