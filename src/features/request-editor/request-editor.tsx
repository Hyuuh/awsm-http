import { useState, useEffect } from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { HttpClient } from "@/services/http-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlayIcon,
  PlusIcon,
  Trash2Icon,
  RocketIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";

import { RequestTabs } from "./request-tabs";
import { ResponseViewer } from "./response-viewer";
import { HttpMethod, RequestAuth } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Editor, type Monaco } from "@monaco-editor/react";
import { VesperTheme } from "./themes/vesper";
import { VesperLightTheme } from "./themes/vesper-light";
import { useTheme } from "@/components/theme-provider";

const handleEditorDidMount = (monaco: Monaco) => {
  monaco.editor.defineTheme("Vesper", VesperTheme as any);
  monaco.editor.defineTheme("VesperLight", VesperLightTheme as any);

  // Register completion provider for JSON
  monaco.languages.registerCompletionItemProvider("json", {
    triggerCharacters: ["{"],
    provideCompletionItems: (model, position) => {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      if (textUntilPosition.endsWith("{{")) {
        const state = useWorkspaceStore.getState();
        const activeEnv = state.environments.find(
          (e) => e.id === state.activeEnvironmentId
        );
        if (!activeEnv) return { suggestions: [] };

        const suggestions = activeEnv.variables.map((v) => ({
          label: v.key,
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: v.key + "}}",
          detail: v.value,
        }));
        return { suggestions };
      }
      return { suggestions: [] };
    },
  });
};

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
import { substituteVariables } from "@/lib/utils";
import { VariableInput } from "@/components/variable-input";
import { CodeGeneratorDialog } from "./code-generator-dialog";

// --- Helper Components ---

function KeyValueTable({
  items,
  onUpdate,
  onAdd,
  onRemove,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
}: {
  items: {
    id: string;
    key: string;
    value: string;
    enabled: boolean;
    description?: string;
  }[];
  onUpdate: (id: string, field: string, value: any) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Key / Value List
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAdd}
          className="h-6 text-xs"
        >
          <PlusIcon size={12} className="mr-1" /> Add
        </Button>
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-2 group">
            <Checkbox
              checked={item.enabled}
              onCheckedChange={(c) => onUpdate(item.id, "enabled", c)}
              className="mt-2.5"
            />
            <div className="flex-1 grid grid-cols-2 gap-2">
              <VariableInput
                placeholder={keyPlaceholder}
                value={item.key}
                onChange={(e) => onUpdate(item.id, "key", e.target.value)}
                className="h-8 text-sm font-mono"
              />
              <VariableInput
                placeholder={valuePlaceholder}
                value={item.value}
                onChange={(e) => onUpdate(item.id, "value", e.target.value)}
                className="h-8 text-sm font-mono"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemove(item.id)}
            >
              <Trash2Icon
                size={14}
                className="text-muted-foreground hover:text-red-500"
              />
            </Button>
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-md bg-muted/5">
          No items.{" "}
          <span
            className="text-primary cursor-pointer hover:underline"
            onClick={onAdd}
          >
            Add one
          </span>
        </div>
      )}
    </div>
  );
}

function AuthEditor({
  auth,
  onChange,
}: {
  auth: RequestAuth;
  onChange: (a: RequestAuth) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-6 p-1">
      <div className="space-y-2">
        <Label>Authorization Type</Label>
        <Select
          value={auth.type}
          onValueChange={(v: any) => onChange({ ...auth, type: v })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Auth Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Auth</SelectItem>
            <SelectItem value="basic">Basic Auth</SelectItem>
            <SelectItem value="bearer">Bearer Token</SelectItem>
            <SelectItem value="apikey">API Key</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {auth.type === "basic" && (
        <div className="grid gap-4 max-w-md animate-in fade-in slide-in-from-top-2">
          <div className="space-y-2">
            <Label>Username</Label>
            <Input
              value={auth.basic?.username || ""}
              onChange={(e) =>
                onChange({
                  ...auth,
                  basic: { ...auth.basic, username: e.target.value },
                })
              }
              placeholder="Username"
            />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={auth.basic?.password || ""}
                onChange={(e) =>
                  onChange({
                    ...auth,
                    basic: { ...auth.basic, password: e.target.value },
                  })
                }
                placeholder="Password"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOffIcon size={14} />
                ) : (
                  <EyeIcon size={14} />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {auth.type === "bearer" && (
        <div className="space-y-2 max-w-md animate-in fade-in slide-in-from-top-2">
          <Label>Token</Label>
          <Input
            value={auth.bearer?.token || ""}
            onChange={(e) =>
              onChange({
                ...auth,
                bearer: { ...auth.bearer, token: e.target.value },
              })
            }
            placeholder="Bearer Token"
          />
        </div>
      )}

      {auth.type === "apikey" && (
        <div className="grid gap-4 max-w-md animate-in fade-in slide-in-from-top-2">
          <div className="space-y-2">
            <Label>Key</Label>
            <Input
              value={auth.apikey?.key || ""}
              onChange={(e) =>
                onChange({
                  ...auth,
                  apikey: { ...auth.apikey, key: e.target.value },
                })
              }
              placeholder="Key"
            />
          </div>
          <div className="space-y-2">
            <Label>Value</Label>
            <Input
              value={auth.apikey?.value || ""}
              onChange={(e) =>
                onChange({
                  ...auth,
                  apikey: { ...auth.apikey, value: e.target.value },
                })
              }
              placeholder="Value"
            />
          </div>
          <div className="space-y-2">
            <Label>Add To</Label>
            <Select
              value={auth.apikey?.addTo || "header"}
              onValueChange={(v: any) =>
                onChange({ ...auth, apikey: { ...auth.apikey, addTo: v } })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="header">Header</SelectItem>
                <SelectItem value="query">Query Params</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {auth.type === "none" && (
        <div className="text-muted-foreground text-sm italic">
          This request does not use any authorization.
        </div>
      )}
    </div>
  );
}

export function RequestEditor() {
  const [is2XL, setIs2XL] = useState(false);

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
  const setResponse = useWorkspaceStore((state) => state.setResponse);
  const response = useWorkspaceStore((state) =>
    activeRequestId ? state.responses[activeRequestId] : null
  );

  const environments = useWorkspaceStore((state) => state.environments);
  const activeEnvironmentId = useWorkspaceStore(
    (state) => state.activeEnvironmentId
  );

  const [isLoading, setIsLoading] = useState(false);

  // Prepare variables for substitution
  const activeEnv = environments.find((e) => e.id === activeEnvironmentId);
  const variables: Record<string, string> = {};
  if (activeEnv) {
    activeEnv.variables.forEach((v) => {
      if (v.enabled) {
        variables[v.key] = v.value;
      }
    });
  }

  if (!activeRequestId || !node || node.type !== "request" || !node.data) {
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

  // Destructure with defaults for backward compatibility
  const {
    url,
    method,
    headers,
    body,
    auth = { type: "none" },
    params = [],
  } = node.data;

  const handleSend = async () => {
    if (!node.data) return;
    setIsLoading(true);

    // Ensure we pass the full data structure including defaults if missing
    const rawRequestData = {
      ...node.data,
      auth: node.data.auth || { type: "none" },
      params: node.data.params || [],
    };

    // Substitute variables
    const requestData = {
      ...rawRequestData,
      url: substituteVariables(rawRequestData.url, variables),
      headers: rawRequestData.headers.map((h) => ({
        ...h,
        key: substituteVariables(h.key, variables),
        value: substituteVariables(h.value, variables),
      })),
      params: rawRequestData.params.map((p) => ({
        ...p,
        key: substituteVariables(p.key, variables),
        value: substituteVariables(p.value, variables),
      })),
      body: {
        ...rawRequestData.body,
        content: substituteVariables(rawRequestData.body.content, variables),
        formData: rawRequestData.body.formData?.map((f) => ({
          ...f,
          key: substituteVariables(f.key, variables),
          value: substituteVariables(f.value, variables),
        })),
        formUrlEncoded: rawRequestData.body.formUrlEncoded?.map((f) => ({
          ...f,
          key: substituteVariables(f.key, variables),
          value: substituteVariables(f.value, variables),
        })),
      },
      auth: {
        ...rawRequestData.auth,
        basic: rawRequestData.auth.basic
          ? {
              username: substituteVariables(
                rawRequestData.auth.basic.username || "",
                variables
              ),
              password: substituteVariables(
                rawRequestData.auth.basic.password || "",
                variables
              ),
            }
          : undefined,
        bearer: rawRequestData.auth.bearer
          ? {
              token: substituteVariables(
                rawRequestData.auth.bearer.token || "",
                variables
              ),
            }
          : undefined,
        apikey: rawRequestData.auth.apikey
          ? {
              ...rawRequestData.auth.apikey,
              key: substituteVariables(
                rawRequestData.auth.apikey.key || "",
                variables
              ),
              value: substituteVariables(
                rawRequestData.auth.apikey.value || "",
                variables
              ),
            }
          : undefined,
      },
    };

    const res = await HttpClient.send(requestData);
    setResponse(activeRequestId, res);
    setIsLoading(false);
  };

  // --- Handlers ---

  const updateParams = (id: string, field: string, value: any) => {
    const newParams = params.map((p) =>
      p.id === id ? { ...p, [field]: value } : p
    );
    updateRequestData(activeRequestId, { params: newParams });
    // TODO: Sync with URL
  };

  const addParam = () => {
    const newParams = [
      ...params,
      { id: uuidv4(), key: "", value: "", enabled: true },
    ];
    updateRequestData(activeRequestId, { params: newParams });
  };

  const removeParam = (id: string) => {
    const newParams = params.filter((p) => p.id !== id);
    updateRequestData(activeRequestId, { params: newParams });
  };

  const updateHeader = (id: string, field: string, value: any) => {
    const newHeaders = headers.map((h) =>
      h.id === id ? { ...h, [field]: value } : h
    );
    updateRequestData(activeRequestId, { headers: newHeaders });
  };

  const addHeader = () => {
    const newHeaders = [
      ...headers,
      { id: uuidv4(), key: "", value: "", enabled: true },
    ];
    updateRequestData(activeRequestId, { headers: newHeaders });
  };

  const removeHeader = (id: string) => {
    const newHeaders = headers.filter((h) => h.id !== id);
    updateRequestData(activeRequestId, { headers: newHeaders });
  };

  const updateFormData = (id: string, field: string, value: any) => {
    const currentFormData = body.formData || [];
    const newFormData = currentFormData.map((f) =>
      f.id === id ? { ...f, [field]: value } : f
    );
    updateRequestData(activeRequestId, {
      body: { ...body, formData: newFormData },
    });
  };

  const addFormData = () => {
    const currentFormData = body.formData || [];
    const newFormData = [
      ...currentFormData,
      {
        id: uuidv4(),
        key: "",
        value: "",
        type: "text" as const,
        enabled: true,
      },
    ];
    updateRequestData(activeRequestId, {
      body: { ...body, formData: newFormData },
    });
  };

  const removeFormData = (id: string) => {
    const currentFormData = body.formData || [];
    const newFormData = currentFormData.filter((f) => f.id !== id);
    updateRequestData(activeRequestId, {
      body: { ...body, formData: newFormData },
    });
  };

  const updateFormUrlEncoded = (id: string, field: string, value: any) => {
    const currentForm = body.formUrlEncoded || [];
    const newForm = currentForm.map((f) =>
      f.id === id ? { ...f, [field]: value } : f
    );
    updateRequestData(activeRequestId, {
      body: { ...body, formUrlEncoded: newForm },
    });
  };

  const addFormUrlEncoded = () => {
    const currentForm = body.formUrlEncoded || [];
    const newForm = [
      ...currentForm,
      { id: uuidv4(), key: "", value: "", enabled: true },
    ];
    updateRequestData(activeRequestId, {
      body: { ...body, formUrlEncoded: newForm },
    });
  };

  const removeFormUrlEncoded = (id: string) => {
    const currentForm = body.formUrlEncoded || [];
    const newForm = currentForm.filter((f) => f.id !== id);
    updateRequestData(activeRequestId, {
      body: { ...body, formUrlEncoded: newForm },
    });
  };

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

        <Button onClick={handleSend} disabled={isLoading} className="w-24">
          {isLoading ? (
            "Sending..."
          ) : (
            <>
              <PlayIcon size={16} className="mr-2" /> Send
            </>
          )}
        </Button>

        <CodeGeneratorDialog request={node.data} variables={variables} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup
          direction={is2XL ? "horizontal" : "vertical"}
          className="h-full w-full"
        >
          <ResizablePanel defaultSize={50} minSize={30}>
            <Tabs defaultValue="params" className="h-full flex flex-col">
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
                />
              </TabsContent>

              <TabsContent
                value="body"
                className="flex-1 min-h-0 m-0 p-0 flex flex-col"
              >
                <div className="p-2 border-b bg-muted/10 flex items-center gap-2">
                  <RadioGroup
                    value={body.type}
                    onValueChange={(v: any) =>
                      updateRequestData(activeRequestId, {
                        body: { ...body, type: v },
                      })
                    }
                    className="flex items-center gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="none" />
                      <Label htmlFor="none" className="text-xs cursor-pointer">
                        None
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="json" id="json" />
                      <Label htmlFor="json" className="text-xs cursor-pointer">
                        JSON
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="form-data" id="form-data" />
                      <Label
                        htmlFor="form-data"
                        className="text-xs cursor-pointer"
                      >
                        Form Data
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="x-www-form-urlencoded"
                        id="x-www-form-urlencoded"
                      />
                      <Label
                        htmlFor="x-www-form-urlencoded"
                        className="text-xs cursor-pointer"
                      >
                        x-www-form
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="text" id="text" />
                      <Label htmlFor="text" className="text-xs cursor-pointer">
                        Raw
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex-1 relative overflow-hidden">
                  {body.type === "json" && (
                    <Editor
                      width="100%"
                      height="100%"
                      language="json"
                      value={body.content}
                      onChange={(val) =>
                        updateRequestData(activeRequestId, {
                          body: { ...body, content: val! },
                        })
                      }
                      theme={theme === "dark" ? "Vesper" : "VesperLight"}
                      beforeMount={handleEditorDidMount}
                      options={{
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
                  )}
                  {body.type === "text" && (
                    <Editor
                      width="100%"
                      height="100%"
                      language="plaintext"
                      value={body.content}
                      onChange={(val) =>
                        updateRequestData(activeRequestId, {
                          body: { ...body, content: val || "" },
                        })
                      }
                      theme={theme === "dark" ? "Vesper" : "VesperLight"}
                      beforeMount={handleEditorDidMount}
                      options={{
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
                  )}
                  {body.type === "form-data" && (
                    <div className="p-4">
                      <KeyValueTable
                        items={body.formData || []}
                        onUpdate={updateFormData}
                        onAdd={addFormData}
                        onRemove={removeFormData}
                      />
                    </div>
                  )}
                  {body.type === "x-www-form-urlencoded" && (
                    <div className="p-4">
                      <KeyValueTable
                        items={body.formUrlEncoded || []}
                        onUpdate={updateFormUrlEncoded}
                        onAdd={addFormUrlEncoded}
                        onRemove={removeFormUrlEncoded}
                      />
                    </div>
                  )}
                  {body.type === "none" && (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      This request has no body
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </ResizablePanel>

          <ResizableHandle withHandle />

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
    </div>
  );
}
