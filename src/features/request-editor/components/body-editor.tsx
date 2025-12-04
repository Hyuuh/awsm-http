import React, { useCallback } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RequestBody } from "@/types";
import { Editor } from "@monaco-editor/react";
import { KeyValueTable } from "./key-value-table";
import { v4 as uuidv4 } from "uuid";

interface BodyEditorProps {
  body: RequestBody;
  onChange: (body: RequestBody) => void;
  editorTheme: string;
  handleEditorDidMount: any;
  handleEditorMount: any;
}

export const BodyEditor = React.memo(function BodyEditor({
  body,
  onChange,
  editorTheme,
  handleEditorDidMount,
  handleEditorMount,
}: BodyEditorProps) {
  const updateFormData = useCallback(
    (id: string, field: string, value: any) => {
      const currentFormData = body.formData || [];
      const newFormData = currentFormData.map((f) =>
        f.id === id ? { ...f, [field]: value } : f
      );
      onChange({ ...body, formData: newFormData });
    },
    [body, onChange]
  );

  const addFormData = useCallback(() => {
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
    onChange({ ...body, formData: newFormData });
  }, [body, onChange]);

  const removeFormData = useCallback(
    (id: string) => {
      const currentFormData = body.formData || [];
      const newFormData = currentFormData.filter((f) => f.id !== id);
      onChange({ ...body, formData: newFormData });
    },
    [body, onChange]
  );

  const updateFormUrlEncoded = (id: string, field: string, value: any) => {
    const currentForm = body.formUrlEncoded || [];
    const newForm = currentForm.map((f) =>
      f.id === id ? { ...f, [field]: value } : f
    );
    onChange({ ...body, formUrlEncoded: newForm });
  };

  const addFormUrlEncoded = () => {
    const currentForm = body.formUrlEncoded || [];
    const newForm = [
      ...currentForm,
      { id: uuidv4(), key: "", value: "", enabled: true },
    ];
    onChange({ ...body, formUrlEncoded: newForm });
  };

  const removeFormUrlEncoded = (id: string) => {
    const currentForm = body.formUrlEncoded || [];
    const newForm = currentForm.filter((f) => f.id !== id);
    onChange({ ...body, formUrlEncoded: newForm });
  };

  return (
    <div className="flex-1 min-h-0 m-0 p-0 flex flex-col h-full">
      <div className="p-2 border-b bg-muted/10 flex items-center gap-2">
        <RadioGroup
          value={body.type}
          onValueChange={(v: any) => onChange({ ...body, type: v })}
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
            <Label htmlFor="form-data" className="text-xs cursor-pointer">
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
            onChange={(val) => onChange({ ...body, content: val! })}
            theme={editorTheme}
            beforeMount={handleEditorDidMount}
            onMount={handleEditorMount}
            options={{
              fontSize: 14,
              fontFamily: "JetBrains Mono",
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
            onChange={(val) => onChange({ ...body, content: val || "" })}
            theme={editorTheme}
            beforeMount={handleEditorDidMount}
            onMount={handleEditorMount}
            options={{
              fontSize: 14,
              fontFamily: "JetBrains Mono",
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
              onReorder={(newItems) =>
                onChange({ ...body, formData: newItems })
              }
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
              onReorder={(newItems) =>
                onChange({ ...body, formUrlEncoded: newItems })
              }
            />
          </div>
        )}
        {body.type === "none" && (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            This request has no body
          </div>
        )}
      </div>
    </div>
  );
});
