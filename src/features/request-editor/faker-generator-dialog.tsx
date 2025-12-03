import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getFaker } from "@/services/faker-service";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { SearchIcon } from "lucide-react";

interface FakerGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (text: string) => void;
}

export function FakerGeneratorDialog({
  open,
  onOpenChange,
  onInsert,
}: FakerGeneratorDialogProps) {
  const fakerLocale = useWorkspaceStore((state) => state.fakerLocale);
  const faker = useMemo(() => getFaker(fakerLocale || "en"), [fakerLocale]);

  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [options, setOptions] = useState<string>("");
  const [preview, setPreview] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Extract modules
  const modules = useMemo(() => {
    return Object.keys(faker)
      .filter(
        (k) => typeof (faker as any)[k] === "object" && !k.startsWith("_")
      )
      .sort();
  }, [faker]);

  // Extract methods for selected module
  const methods = useMemo(() => {
    if (!selectedModule) return [];
    const moduleObj = (faker as any)[selectedModule];
    return Object.keys(moduleObj)
      .filter((k) => typeof moduleObj[k] === "function" && !k.startsWith("_"))
      .sort();
  }, [faker, selectedModule]);

  // Filtered methods for search
  const filteredItems = useMemo(() => {
    if (!searchQuery) return [];
    const items: { module: string; method: string }[] = [];

    modules.forEach((mod) => {
      const modObj = (faker as any)[mod];
      Object.keys(modObj).forEach((meth) => {
        if (typeof modObj[meth] === "function" && !meth.startsWith("_")) {
          if (
            meth.toLowerCase().includes(searchQuery.toLowerCase()) ||
            mod.toLowerCase().includes(searchQuery.toLowerCase())
          ) {
            items.push({ module: mod, method: meth });
          }
        }
      });
    });
    return items;
  }, [faker, modules, searchQuery]);

  // Update preview
  useEffect(() => {
    if (!selectedModule || !selectedMethod) {
      setPreview("");
      return;
    }

    try {
      const fn = (faker as any)[selectedModule][selectedMethod];
      let args = undefined;
      if (options.trim()) {
        // Try to parse options as JSON, if it looks like an object
        // Or just pass as string if it doesn't?
        // The user example was { firstName: 'Jeanne' }, which is JS object notation, not strict JSON.
        // But for safety/simplicity let's try JSON.parse first, or eval (risky but local).
        // Let's stick to JSON.parse for now, or maybe just new Function return...
        // Since this is a developer tool, maybe new Function is acceptable for flexibility?
        // "return " + options
        try {
          // eslint-disable-next-line no-new-func
          const getArgs = new Function(`return ${options}`);
          args = getArgs();
        } catch (e) {
          // If invalid JS, ignore args for preview or show error?
          // console.error(e);
        }
      }

      const result = args !== undefined ? fn(args) : fn();
      setPreview(String(result));
    } catch (e) {
      setPreview("Error generating preview");
    }
  }, [faker, selectedModule, selectedMethod, options]);

  const handleInsert = () => {
    if (!selectedModule || !selectedMethod) return;

    let text = `{{faker.${selectedModule}.${selectedMethod}`;
    if (options.trim()) {
      text += `(${options})`;
    } else {
      text += `()`;
    }
    text += `}}`;

    onInsert(text);
    onOpenChange(false);
  };

  const selectItem = (module: string, method: string) => {
    setSelectedModule(module);
    setSelectedMethod(method);
    setSearchQuery(""); // Clear search on selection? Or keep it?
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Insert Faker Data</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Search / Selection */}
          <div className="space-y-2">
            <Label>Search Method</Label>
            <div className="relative">
              <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search (e.g. email, name)..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {searchQuery && (
              <ScrollArea className="h-[200px] border rounded-md p-2">
                {filteredItems.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-2">
                    No results found.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredItems.map((item) => (
                      <div
                        key={`${item.module}.${item.method}`}
                        className="text-sm p-2 hover:bg-accent rounded-md cursor-pointer flex justify-between"
                        onClick={() => selectItem(item.module, item.method)}
                      >
                        <span>{item.method}</span>
                        <span className="text-muted-foreground text-xs">
                          {item.module}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            )}
          </div>

          {!searchQuery && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Module</Label>
                <Select
                  value={selectedModule}
                  onValueChange={(v) => {
                    setSelectedModule(v);
                    setSelectedMethod("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent className="h-[300px]">
                    {modules.map((mod) => (
                      <SelectItem key={mod} value={mod}>
                        {mod}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Method</Label>
                <Select
                  value={selectedMethod}
                  onValueChange={setSelectedMethod}
                  disabled={!selectedModule}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent className="h-[300px]">
                    {methods.map((meth) => (
                      <SelectItem key={meth} value={meth}>
                        {meth}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {selectedModule && selectedMethod && (
            <>
              <div className="space-y-2">
                <Label>Options (JSON Object)</Label>
                <Input
                  placeholder="{ firstName: 'Jeanne' }"
                  value={options}
                  onChange={(e) => setOptions(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Optional arguments to pass to the function.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                  {preview || "..."}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleInsert}
            disabled={!selectedModule || !selectedMethod}
          >
            Insert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
