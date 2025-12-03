import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CodeIcon, CopyIcon, CheckIcon } from "lucide-react";
import { RequestData } from "@/types";
import {
  generateCurl,
  generateJsFetch,
  generatePythonRequests,
} from "@/features/request-editor/utils/code-generators";
import { Editor } from "@monaco-editor/react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/features/theme/theme-provider";
import { substituteVariables } from "@/features/scripting/utils/variable-substitution";
import { VesperTheme } from "./themes/vesper";
import { VesperLightTheme } from "./themes/vesper-light";
import { type Monaco } from "@monaco-editor/react";

const handleEditorDidMount = (monaco: Monaco) => {
  monaco.editor.defineTheme("Vesper", VesperTheme as any);
  monaco.editor.defineTheme("VesperLight", VesperLightTheme as any);
};

interface CodeGeneratorDialogProps {
  request: RequestData;
  variables?: Record<string, string>;
  fakerLocale?: string;
}

export function CodeGeneratorDialog({
  request: rawRequest,
  variables = {},
  fakerLocale = "en",
}: CodeGeneratorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("curl");
  const { theme } = useTheme();

  // Substitute variables in the request data
  const request: RequestData = {
    ...rawRequest,
    url: substituteVariables(rawRequest.url, variables, fakerLocale),
    headers: rawRequest.headers.map((h) => ({
      ...h,
      key: substituteVariables(h.key, variables, fakerLocale),
      value: substituteVariables(h.value, variables, fakerLocale),
    })),
    params: rawRequest.params.map((p) => ({
      ...p,
      key: substituteVariables(p.key, variables, fakerLocale),
      value: substituteVariables(p.value, variables, fakerLocale),
    })),
    body: {
      ...rawRequest.body,
      content: substituteVariables(
        rawRequest.body.content,
        variables,
        fakerLocale
      ),
      formData: rawRequest.body.formData?.map((f) => ({
        ...f,
        key: substituteVariables(f.key, variables, fakerLocale),
        value: substituteVariables(f.value, variables, fakerLocale),
      })),
      formUrlEncoded: rawRequest.body.formUrlEncoded?.map((f) => ({
        ...f,
        key: substituteVariables(f.key, variables, fakerLocale),
        value: substituteVariables(f.value, variables, fakerLocale),
      })),
    },
    auth: {
      ...rawRequest.auth,
      basic: rawRequest.auth.basic
        ? {
            username: substituteVariables(
              rawRequest.auth.basic.username || "",
              variables,
              fakerLocale
            ),
            password: substituteVariables(
              rawRequest.auth.basic.password || "",
              variables,
              fakerLocale
            ),
          }
        : undefined,
      bearer: rawRequest.auth.bearer
        ? {
            token: substituteVariables(
              rawRequest.auth.bearer.token || "",
              variables,
              fakerLocale
            ),
          }
        : undefined,
      apikey: rawRequest.auth.apikey
        ? {
            ...rawRequest.auth.apikey,
            key: substituteVariables(
              rawRequest.auth.apikey.key || "",
              variables,
              fakerLocale
            ),
            value: substituteVariables(
              rawRequest.auth.apikey.value || "",
              variables,
              fakerLocale
            ),
          }
        : undefined,
    },
  };

  const getCode = (lang: string) => {
    switch (lang) {
      case "curl":
        return generateCurl(request);
      case "javascript":
        return generateJsFetch(request);
      case "python":
        return generatePythonRequests(request);
      default:
        return "";
    }
  };

  const handleCopy = () => {
    const code = getCode(activeTab);
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const editorTheme =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
      ? "Vesper"
      : "VesperLight";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Generate Code">
          <CodeIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Generate Code</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="flex items-center justify-between border-b pb-2 mb-2">
            <TabsList>
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript (Fetch)</TabsTrigger>
              <TabsTrigger value="python">Python (Requests)</TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <CheckIcon className="h-4 w-4 mr-2" />
              ) : (
                <CopyIcon className="h-4 w-4 mr-2" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <div className="flex-1 min-h-0 border rounded-md overflow-hidden">
            <Editor
              height="100%"
              language={activeTab === "curl" ? "shell" : activeTab}
              value={getCode(activeTab)}
              theme={editorTheme}
              beforeMount={handleEditorDidMount}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "Jetbrains-Mono",
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
