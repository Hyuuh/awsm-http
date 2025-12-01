import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { FileJson, Folder, Box, Settings } from "lucide-react";
import { TreeNode } from "@/types";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenSettings: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  onOpenSettings,
}: CommandPaletteProps) {
  const nodes = useWorkspaceStore((state) => state.nodes);
  const setActiveRequest = useWorkspaceStore((state) => state.setActiveRequest);
  const toggleExpand = useWorkspaceStore((state) => state.toggleExpand);

  const [search, setSearch] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const handleSelect = (node: TreeNode) => {
    if (node.type === "request") {
      setActiveRequest(node.id);
    } else {
      toggleExpand(node.id);
    }
    onOpenChange(false);
  };

  const workspaces = Object.values(nodes).filter((n) => n.type === "workspace");
  const collections = Object.values(nodes).filter(
    (n) => n.type === "collection"
  );
  const requests = Object.values(nodes).filter((n) => n.type === "request");

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Requests">
          {requests.map((node) => (
            <CommandItem key={node.id} onSelect={() => handleSelect(node)}>
              <FileJson className="mr-2 h-4 w-4" />
              <span>{node.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Folders">
          {collections.map((node) => (
            <CommandItem key={node.id} onSelect={() => handleSelect(node)}>
              <Folder className="mr-2 h-4 w-4" />
              <span>{node.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Workspaces">
          {workspaces.map((node) => (
            <CommandItem key={node.id} onSelect={() => handleSelect(node)}>
              <Box className="mr-2 h-4 w-4" />
              <span>{node.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem
            onSelect={() => {
              onOpenSettings();
              onOpenChange(false);
            }}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
