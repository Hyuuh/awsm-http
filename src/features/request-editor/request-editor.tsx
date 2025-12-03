import { useState, useEffect, useCallback } from "react";
import { useWorkspaceStore } from "@/features/workspace/stores/workspace-store";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayIcon, RocketIcon } from "lucide-react";

import { RequestTabs } from "./request-tabs";
import { ResponseViewer } from "./response-viewer";
import { HttpMethod, RequestBody } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { Editor } from "@monaco-editor/react";
import { useTheme } from "@/features/theme/theme-provider";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { VariableInput } from "@/components/variable-input";
import { CodeGeneratorDialog } from "./code-generator-dialog";
import { FakerGeneratorDialog } from "./faker-generator-dialog";
import { WebSocketEditor } from "./websocket-editor";
import { KeyValueTable } from "./components/key-value-table";
import { AuthEditor } from "./components/auth-editor";
import { BodyEditor } from "./components/body-editor";
import { useRequestExecution } from "./hooks/use-request-execution";
import { handleEditorDidMount } from "./utils/monaco-config";

export function RequestEditor() {
  const [is2XL, setIs2XL] = useState(false);
  const [isFakerDialogOpen, setIsFakerDialogOpen] = useState(false);
  const [activeEditor, setActiveEditor] = useState<any>(null);

  const { theme } = useTheme();

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1536px)");
    const onChange = () => setIs2XL(mql.matches);
    mql.addEventListener("change", onChange);
    setIs2XL(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const activeRequestId = useWorkspaceStore((state) => state.activeRequestId);
  const node = useWorkspaceStore((state) =>
    activeRequestId ? state.nodes[activeRequestId] : null
  );
  const updateRequestData = useWorkspaceStore(
    (state) => state.updateRequestData
  );
  const response = useWorkspaceStore((state) =>
    activeRequestId ? state.responses[activeRequestId] : null
  );

  const { isLoading, executeRequest, variables, fakerLocale } =
    useRequestExecution(activeRequestId, node?.data);

  const isValidRequest = node?.type === "request" && !!node.data;
  const isValidWebSocket = node?.type === "websocket" && !!node.wsData;

  if (!activeRequestId || !node || (!isValidRequest && !isValidWebSocket)) {
    return (
      <div className="h-full flex flex-col">
        <RequestTabs />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <Empty>
            <EmptyMedia>
              <RocketIcon className="text-muted-foreground" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No Request Selected</EmptyTitle>
              <EmptyDescription>
                Select a request from the sidebar to start editing.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </div>
    );
  }

  if (node.type === "websocket") {
    return (
      <div className="flex flex-col h-full">
        <WebSocketEditor requestId={activeRequestId} />
      </div>
    );
  }

  // Destructure with defaults for backward compatibility
  const {
    url = "",
    method = "GET",
    headers = [],
    body = { type: "none", content: "" } as RequestBody,
    auth = { type: "none" },
    params = [],
  } = node.data || {}; // Handle case where data might be missing if type mismatch

  if (!node.data) return null; // Should not happen if type check passes, but safe guard

  // --- Handlers ---

  const updateParams = useCallback(
    (id: string, field: string, value: any) => {
      const newParams = params.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      );
      updateRequestData(activeRequestId, { params: newParams });
      // TODO: Sync with URL
    },
    [params, activeRequestId, updateRequestData]
  );

  const addParam = useCallback(() => {
    const newParams = [
      ...params,
      { id: uuidv4(), key: "", value: "", enabled: true },
    ];
    updateRequestData(activeRequestId, { params: newParams });
  }, [params, activeRequestId, updateRequestData]);

  const removeParam = useCallback(
    (id: string) => {
      const newParams = params.filter((p) => p.id !== id);
      updateRequestData(activeRequestId, { params: newParams });
    },
    [params, activeRequestId, updateRequestData]
  );

  const updateHeader = useCallback(
    (id: string, field: string, value: any) => {
      const newHeaders = headers.map((h) =>
        h.id === id ? { ...h, [field]: value } : h
      );
      updateRequestData(activeRequestId, { headers: newHeaders });
    },
    [headers, activeRequestId, updateRequestData]
  );

  const addHeader = useCallback(() => {
    const newHeaders = [
      ...headers,
      { id: uuidv4(), key: "", value: "", enabled: true },
    ];
    updateRequestData(activeRequestId, { headers: newHeaders });
  }, [headers, activeRequestId, updateRequestData]);

  const removeHeader = useCallback(
    (id: string) => {
      const newHeaders = headers.filter((h) => h.id !== id);
      updateRequestData(activeRequestId, { headers: newHeaders });
    },
    [headers, activeRequestId, updateRequestData]
  );

  const handleEditorMount = useCallback((editor: any, monaco: any) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      setActiveEditor(editor);
      setIsFakerDialogOpen(true);
    });
  }, []);

  const handleFakerInsert = (text: string) => {
    if (activeEditor) {
      const position = activeEditor.getPosition();
      if (position) {
        activeEditor.executeEdits("faker-generator", [
          {
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            },
            text: text,
            forceMoveMarkers: true,
          },
        ]);
        activeEditor.focus();
      }
    }
  };
  const editorTheme =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
      ? "Vesper"
      : "VesperLight";
  return (
    <div className="h-full flex flex-col">
      <RequestTabs />
      {/* Top Bar: Method, URL, Send */}
      <div className="p-4 border-b flex gap-2 items-center bg-background">
        <Select
          value={method}
          onValueChange={(v) =>
            updateRequestData(activeRequestId, { method: v as HttpMethod })
          }
        >
          <SelectTrigger className="w-[100px] font-bold">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET" className="text-green-500 font-bold">
              GET
            </SelectItem>
            <SelectItem value="POST" className="text-yellow-500 font-bold">
              POST
            </SelectItem>
            <SelectItem value="PUT" className="text-blue-500 font-bold">
              PUT
            </SelectItem>
            <SelectItem value="DELETE" className="text-red-500 font-bold">
              DELETE
            </SelectItem>
            <SelectItem value="PATCH" className="text-purple-500 font-bold">
              PATCH
            </SelectItem>
          </SelectContent>
        </Select>

        <VariableInput
          className="flex-1 font-mono text-sm"
          placeholder="Enter request URL"
          value={url}
          onChange={(e) =>
            updateRequestData(activeRequestId, { url: e.target.value })
          }
        />

        <Button onClick={executeRequest} disabled={isLoading} className="w-24">
          {isLoading ? (
            "Sending..."
          ) : (
            <>
              <PlayIcon size={16} className="mr-2" /> Send
            </>
          )}
        </Button>

        <CodeGeneratorDialog
          request={node.data}
          variables={variables}
          fakerLocale={fakerLocale}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup
          direction={is2XL ? "horizontal" : "vertical"}
          className="h-full w-full"
        >
          <ResizablePanel defaultSize={50} minSize={35}>
            <Tabs defaultValue="tests" className="h-full flex flex-col">
              <div className="flex items-center px-4 border-b bg-muted/5 min-h-10">
                <TabsList className="h-full bg-transparent p-0 w-full justify-start overflow-x-auto ">
                  <TabsTrigger
                    value="params"
                    className="h-[39px] border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs px-4"
                  >
                    Params {params.length > 0 && `(${params.length})`}
                  </TabsTrigger>
                  <TabsTrigger
                    value="auth"
                    className="h-[39px] border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs px-4"
                  >
                    Auth {auth.type !== "none" && "•"}
                  </TabsTrigger>
                  <TabsTrigger
                    value="headers"
                    className="h-[39px] border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs px-4"
                  >
                    Headers {headers.length > 0 && `(${headers.length})`}
                  </TabsTrigger>
                  <TabsTrigger
                    value="body"
                    className="h-[39px] border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs px-4"
                  >
                    Body {body.type !== "none" && "•"}
                  </TabsTrigger>
                  <TabsTrigger
                    value="pre-request"
                    className="h-[39px] border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs px-4"
                  >
                    Pre-request
                  </TabsTrigger>
                  <TabsTrigger
                    value="tests"
                    className="h-[39px] border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs px-4"
                  >
                    Tests
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="params"
                className="flex-1 min-h-0 m-0 p-4 overflow-auto"
              >
                <KeyValueTable
                  items={params}
                  onUpdate={updateParams}
                  onAdd={addParam}
                  onRemove={removeParam}
                  onReorder={(newItems) =>
                    updateRequestData(activeRequestId, { params: newItems })
                  }
                />
              </TabsContent>

              <TabsContent
                value="auth"
                className="flex-1 min-h-0 m-0 p-4 overflow-auto"
              >
                <AuthEditor
                  auth={auth}
                  onChange={(newAuth) =>
                    updateRequestData(activeRequestId, { auth: newAuth })
                  }
                />
              </TabsContent>

              <TabsContent
                value="headers"
                className="flex-1 min-h-0 m-0 p-4 overflow-auto"
              >
                <KeyValueTable
                  items={headers}
                  onUpdate={updateHeader}
                  onAdd={addHeader}
                  onRemove={removeHeader}
                  onReorder={(newItems) =>
                    updateRequestData(activeRequestId, { headers: newItems })
                  }
                />
              </TabsContent>

              <TabsContent
                value="body"
                className="flex-1 min-h-0 m-0 p-0 flex flex-col"
              >
                <BodyEditor
                  body={body}
                  onChange={(newBody) =>
                    updateRequestData(activeRequestId, { body: newBody })
                  }
                  editorTheme={editorTheme}
                  handleEditorDidMount={handleEditorDidMount}
                  handleEditorMount={handleEditorMount}
                />
              </TabsContent>

              <TabsContent value="pre-request" className="flex-1 min-h-0 m-0">
                <Editor
                  width="100%"
                  height="100%"
                  language="javascript"
                  value={node.data.preRequestScript || ""}
                  onChange={(val) =>
                    updateRequestData(activeRequestId, {
                      preRequestScript: val || "",
                    })
                  }
                  theme={editorTheme}
                  beforeMount={handleEditorDidMount}
                  options={{
                    fontSize: 14,
                    fontFamily: "Jetbrains-Mono",
                    minimap: { enabled: false },
                  }}
                />
              </TabsContent>
              <TabsContent value="tests" className="flex-1 min-h-0 m-0">
                <Editor
                  width="100%"
                  height="100%"
                  language="javascript"
                  value={node.data.testScript || ""}
                  onChange={(val) =>
                    updateRequestData(activeRequestId, {
                      testScript: val || "",
                    })
                  }
                  theme={editorTheme}
                  beforeMount={handleEditorDidMount}
                  options={{
                    fontSize: 14,
                    fontFamily: "Jetbrains-Mono",
                    minimap: { enabled: false },
                  }}
                />
              </TabsContent>
            </Tabs>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-primary/30" />

          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col bg-muted/5">
              {response ? (
                <ResponseViewer response={response} />
              ) : (
                <div className="h-full flex items-center justify-center p-8">
                  <Empty>
                    <EmptyMedia>
                      <RocketIcon className="text-muted-foreground" />
                    </EmptyMedia>
                    <EmptyHeader>
                      <EmptyTitle>No Response Yet</EmptyTitle>
                      <EmptyDescription>
                        Send a request to see the response here.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <FakerGeneratorDialog
        open={isFakerDialogOpen}
        onOpenChange={setIsFakerDialogOpen}
        onInsert={handleFakerInsert}
      />
    </div>
  );
}
