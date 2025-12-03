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
} from "@/lib/code-generators";
import { Editor } from "@monaco-editor/react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/components/theme-provider";
import { substituteVariables } from "@/lib/utils";

interface CodeGeneratorDialogProps {
  request: RequestData;
  variables?: Record<string, string>;
}

export function CodeGeneratorDialog({
  request: rawRequest,
  variables = {},
}: CodeGeneratorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("curl");
  const { theme } = useTheme();

  // Substitute variables in the request data
  const request: RequestData = {
    ...rawRequest,
    url: substituteVariables(rawRequest.url, variables),
    headers: rawRequest.headers.map((h) => ({
      ...h,
      key: substituteVariables(h.key, variables),
      value: substituteVariables(h.value, variables),
    })),
    params: rawRequest.params.map((p) => ({
      ...p,
      key: substituteVariables(p.key, variables),
      value: substituteVariables(p.value, variables),
    })),
    body: {
      ...rawRequest.body,
      content: substituteVariables(rawRequest.body.content, variables),
      formData: rawRequest.body.formData?.map((f) => ({
        ...f,
        key: substituteVariables(f.key, variables),
        value: substituteVariables(f.value, variables),
      })),
      formUrlEncoded: rawRequest.body.formUrlEncoded?.map((f) => ({
        ...f,
        key: substituteVariables(f.key, variables),
        value: substituteVariables(f.value, variables),
      })),
    },
    auth: {
      ...rawRequest.auth,
      basic: rawRequest.auth.basic
        ? {
            username: substituteVariables(
              rawRequest.auth.basic.username || "",
              variables
            ),
            password: substituteVariables(
              rawRequest.auth.basic.password || "",
              variables
            ),
          }
        : undefined,
      bearer: rawRequest.auth.bearer
        ? {
            token: substituteVariables(
              rawRequest.auth.bearer.token || "",
              variables
            ),
          }
        : undefined,
      apikey: rawRequest.auth.apikey
        ? {
            ...rawRequest.auth.apikey,
            key: substituteVariables(
              rawRequest.auth.apikey.key || "",
              variables
            ),
            value: substituteVariables(
              rawRequest.auth.apikey.value || "",
              variables
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
      ? "vs-dark"
      : "light";

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
