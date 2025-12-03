import { useState } from "react";
import { Button } from "@/components/ui/button";

import { SettingsIcon, BoxIcon, SearchIcon, BookIcon } from "lucide-react";

import { CommandPalette } from "@/features/command-palette/command-palette";
import { SettingsDialog } from "@/features/settings/settings-dialog";
import { DocumentationDialog } from "@/features/documentation/documentation-dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { ImportExportDialog } from "@/features/workspace/import-export-dialog";

export function Navbar() {
  const [openCommand, setOpenCommand] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [openDocumentation, setOpenDocumentation] = useState(false);

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
              <Button size={"sm"}>
                <BoxIcon size={18} />
                Import/Export
              </Button>
            </ImportExportDialog>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setOpenDocumentation(true)}
            >
              <BookIcon size={18} />
            </Button>
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
      <DocumentationDialog
        open={openDocumentation}
        onOpenChange={setOpenDocumentation}
      />
    </>
  );
}
