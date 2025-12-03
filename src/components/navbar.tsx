import { useState } from "react";
import { Button } from "@/components/ui/button";

import { SettingsIcon, BoxIcon, SearchIcon } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";

import { CommandPalette } from "./command-palette";
import { SettingsDialog } from "./settings-dialog";
import { Kbd, KbdGroup } from "./ui/kbd";
import { ImportExportDialog } from "./import-export-dialog";

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
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 items-center px-4 gap-4 justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 font-bold text-lg">
              <div className="bg-primary text-primary-foreground p-1 rounded-md">
                <BoxIcon size={20} />
              </div>
              <span>awsm-http</span>
            </div>
          </div>

          <div className="flex items-center justify-center ">
            <Button
              variant="outline"
              className="lg:w-96 text-muted-foreground text-sm font-normal justify-between items-center"
              onClick={() => setOpenCommand(true)}
            >
              <span className="flex gap-2 items-center">
                <SearchIcon size={14} />
                Search...
              </span>
              <KbdGroup className="items-center">
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <ImportExportDialog>
              <Button>
                <BoxIcon size={18} className="mr-2" />
                Import/Export
              </Button>
            </ImportExportDialog>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpenSettings(true)}
            >
              <SettingsIcon size={18} />
            </Button>
          </div>
        </div>
      </header>

      <CommandPalette
        open={openCommand}
        onOpenChange={setOpenCommand}
        onOpenSettings={() => setOpenSettings(true)}
      />

      <SettingsDialog open={openSettings} onOpenChange={setOpenSettings} />
    </>
  );
}
