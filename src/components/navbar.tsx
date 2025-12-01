import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FolderOpen, Settings, Box, Search } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { CommandPalette } from "./command-palette";
import { SettingsDialog } from "./settings-dialog";

export function Navbar() {
  const [openCommand, setOpenCommand] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);

  const activeRequestId = useWorkspaceStore((state) => state.activeRequestId);
  const nodes = useWorkspaceStore((state) => state.nodes);

  // Calculate breadcrumbs and current workspace name
  const getPath = (nodeId: string | null) => {
    const path = [];
    let currentId = nodeId;
    while (currentId) {
      const node = nodes[currentId];
      if (node) {
        path.unshift(node);
        currentId = node.parentId;
      } else {
        break;
      }
    }
    return path;
  };

  const path = getPath(activeRequestId);

  return (
    <>
      <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 items-center px-4 gap-4">
          <div className="flex items-center gap-2 font-bold text-lg">
            <div className="bg-primary text-primary-foreground p-1 rounded-md">
              <Box size={20} />
            </div>
            <span>awsm-http</span>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex-1 flex justify-between items-center">
            <div className="flex items-center gap-4 ">
              <Breadcrumb className="hidden md:flex">
                <BreadcrumbList>
                  {path.length > 0 ? (
                    path.map((node, index) => (
                      <BreadcrumbItem key={node.id}>
                        {index < path.length - 1 ? (
                          <>
                            <BreadcrumbLink className="cursor-pointer">
                              {node.name}
                            </BreadcrumbLink>
                            <BreadcrumbSeparator />
                          </>
                        ) : (
                          <BreadcrumbPage>{node.name}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                    ))
                  ) : (
                    <BreadcrumbItem>
                      <BreadcrumbPage>Select a request</BreadcrumbPage>
                    </BreadcrumbItem>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center flex-1 justify-center">
              <Button
                variant="outline"
                className="lg:w-96 justify-start text-muted-foreground text-sm font-normal"
                onClick={() => setOpenCommand(true)}
              >
                <Search size={14} className="mr-2" />
                Search...
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 ml-auto">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpenSettings(true)}
              >
                <Settings size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CommandPalette
        open={openCommand}
        onOpenChange={setOpenCommand}
        onOpenSettings={() => setOpenSettings(true)}
      />

      <SettingsDialog open={openSettings} onOpenChange={setOpenSettings} />
    </>
  );
}
