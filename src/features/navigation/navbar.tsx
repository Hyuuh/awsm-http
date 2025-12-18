import { useState } from "react";
import { Button } from "@/components/ui/button";

import {
  GearIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  BookIcon,
  XIcon,
  MinusIcon,
  ArrowSquareInIcon,
} from "@phosphor-icons/react";

import { getCurrentWindow } from "@tauri-apps/api/window";
const appWindow = getCurrentWindow();
import { CommandPalette } from "@/features/command-palette/command-palette";
import { SettingsDialog } from "@/features/settings/settings-dialog";
import { DocumentationDialog } from "@/features/documentation/documentation-dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { ImportExportDialog } from "@/features/workspace/import-export-dialog";
import ServerMock from "../server/server-mock";

export function Navbar() {
  const [openCommand, setOpenCommand] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [openDocumentation, setOpenDocumentation] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 "
        id="tauri-navbar"
        onMouseDown={(e) => {
          // check if is only the header (not on buttons or inputs)
          if (
            e.buttons === 1 &&
            !(e.target as HTMLElement).closest(
              "button, input, select, textarea"
            )
          ) {
            e.detail === 2
              ? appWindow.toggleMaximize()
              : appWindow.startDragging();
          }
        }}
      >
        <div className="flex h-14 items-center px-4 gap-4 justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 font-bold text-lg">
              <div className="bg-primary text-primary-foreground p-1 rounded-md">
                <CubeIcon />
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
                <MagnifyingGlassIcon />
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
                <ArrowSquareInIcon />
                Import/Export
              </Button>
            </ImportExportDialog>
            <ServerMock />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpenDocumentation(true)}
            >
              <BookIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpenSettings(true)}
            >
              <GearIcon />
            </Button>
            <Button
              variant={"outline"}
              size="icon-sm"
              onClick={() => appWindow.minimize()}
            >
              <MinusIcon />
            </Button>
            <Button
              className="bg-primary/50"
              size="icon-sm"
              onClick={() => appWindow.close()}
            >
              <XIcon />
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
