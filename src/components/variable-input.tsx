import React, { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useWorkspaceStore } from "@/features/workspace/stores/workspace-store";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface VariableInputProps extends React.ComponentProps<typeof Input> {
  onValueChange?: (value: string) => void;
}

export function VariableInput({
  className,
  value,
  onChange,
  onValueChange,
  ...props
}: VariableInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const environments = useWorkspaceStore((state) => state.environments);
  const activeEnvironmentId = useWorkspaceStore(
    (state) => state.activeEnvironmentId
  );
  const activeEnv = environments.find((e) => e.id === activeEnvironmentId);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const newCursorPosition = e.target.selectionStart || 0;
    setCursorPosition(newCursorPosition);

    if (onChange) onChange(e);
    if (onValueChange) onValueChange(newValue);

    // Check for trigger
    const textBeforeCursor = newValue.slice(0, newCursorPosition);
    const match = textBeforeCursor.match(/\{\{([^}]*)$/);

    if (match && activeEnv) {
      setQuery(match[1]);
      setSelectedIndex(0);
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handleSelect = (variableKey: string) => {
    const currentValue = String(value || "");
    const textBeforeCursor = currentValue.slice(0, cursorPosition);
    const textAfterCursor = currentValue.slice(cursorPosition);

    const match = textBeforeCursor.match(/\{\{([^}]*)$/);
    if (match) {
      const prefix = textBeforeCursor.slice(0, match.index);
      const newValue = `${prefix}{{${variableKey}}}${textAfterCursor}`;

      // Call onChange with a synthetic event
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;

      if (nativeInputValueSetter && inputRef.current) {
        nativeInputValueSetter.call(inputRef.current, newValue);
        const event = new Event("input", { bubbles: true });
        inputRef.current.dispatchEvent(event);
      } else if (onValueChange) {
        onValueChange(newValue);
      }

      setOpen(false);
      // Focus back and set cursor
      setTimeout(() => {
        inputRef.current?.focus();
        // Ideally set cursor position after the inserted variable
      }, 0);
    }
  };

  const filteredVariables =
    activeEnv?.variables.filter((v) =>
      v.key.toLowerCase().includes(query.toLowerCase())
    ) || [];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || filteredVariables.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredVariables.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (filteredVariables[selectedIndex]) {
        handleSelect(filteredVariables[selectedIndex].key);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <Popover open={open && filteredVariables.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative w-full">
          <Input
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className={cn("font-mono", className)}
            autoComplete="off"
            {...props}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="p-0 w-[200px]"
        align="start"
        onOpenAutoFocus={(e: Event) => e.preventDefault()}
      >
        <div className="max-h-[300px] overflow-y-auto p-1">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Environment Variables
          </div>
          {filteredVariables.map((v, index) => (
            <div
              key={v.id}
              onClick={() => handleSelect(v.key)}
              className={cn(
                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                index === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <div className="flex flex-col items-start gap-0.5 w-full">
                <span className="font-medium">{v.key}</span>
                <span className="text-xs text-muted-foreground truncate max-w-full">
                  {v.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
