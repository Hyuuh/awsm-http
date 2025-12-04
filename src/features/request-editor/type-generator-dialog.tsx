import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileJsonIcon, CopyIcon, CheckIcon } from "lucide-react";
import { generateTypescriptInterfaces } from "@/features/request-editor/utils/code-generators";
import { Editor, type Monaco } from "@monaco-editor/react";
import { useTheme } from "@/features/theme/theme-provider";
import { VesperTheme } from "./themes/vesper";
import { VesperLightTheme } from "./themes/vesper-light";

const handleEditorDidMount = (monaco: Monaco) => {
  monaco.editor.defineTheme("Vesper", VesperTheme as any);
  monaco.editor.defineTheme("VesperLight", VesperLightTheme as any);
};

interface TypeGeneratorDialogProps {
  json: any;
}

export function TypeGeneratorDialog({ json }: TypeGeneratorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  const code = generateTypescriptInterfaces(json);

  const handleCopy = () => {
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
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs gap- select-none"
        >
          <FileJsonIcon className="h-3 w-3" /> TS Types
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] h-[600px] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <DialogTitle>Generate TypeScript Interfaces</DialogTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="ml-auto mr-8"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 mr-2" />
            ) : (
              <CopyIcon className="h-4 w-4 mr-2" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </DialogHeader>

        <div className="flex-1 min-h-0 border rounded-md overflow-hidden mt-2">
          <Editor
            height="100%"
            language="typescript"
            value={code}
            theme={editorTheme}
            beforeMount={handleEditorDidMount}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "JetBrains Mono",
              scrollBeyondLastLine: false,
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
