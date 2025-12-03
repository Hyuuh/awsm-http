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
import { generateTypescriptInterfaces } from "@/lib/code-generators";
import { Editor } from "@monaco-editor/react";
import { useTheme } from "@/components/theme-provider";

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
      ? "vs-dark"
      : "light";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
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
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "Jetbrains-Mono",
              scrollBeyondLastLine: false,
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
