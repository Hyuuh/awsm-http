import { useWorkspaceStore } from "@/stores/workspace-store";
import { SidebarItem } from "./sidebar-item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, FolderPlus, FilePlus, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export function Sidebar() {
  const rootIds = useWorkspaceStore((state) => state.rootIds);
  const addNode = useWorkspaceStore((state) => state.addNode);

  const handleCreateRoot = (type: "workspace" | "collection" | "request") => {
    addNode(
      null,
      type,
      type === "workspace"
        ? "New Workspace"
        : type === "collection"
        ? "New Folder"
        : "New Request"
    );
  };

  return (
    <div className="h-full border-r bg-muted/10 flex flex-col">
      <div className="p-2 flex items-center justify-between group">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Explorer
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <Plus size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleCreateRoot("workspace")}>
              <Box className="mr-2 h-4 w-4" />
              New Workspace
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCreateRoot("collection")}>
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCreateRoot("request")}>
              <FilePlus className="mr-2 h-4 w-4" />
              New Request
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ContextMenu>
        <ContextMenuTrigger className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="pb-4 min-h-[calc(100vh-100px)]">
              {rootIds.map((id) => (
                <SidebarItem key={id} nodeId={id} />
              ))}
            </div>
          </ScrollArea>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => handleCreateRoot("workspace")}>
            <Box className="mr-2 h-4 w-4" />
            New Workspace
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleCreateRoot("collection")}>
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleCreateRoot("request")}>
            <FilePlus className="mr-2 h-4 w-4" />
            New Request
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
