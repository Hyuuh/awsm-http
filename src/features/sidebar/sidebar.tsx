import { useWorkspaceStore } from "@/stores/workspace-store";
import { SidebarItem } from "./sidebar-item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusIcon, FolderPlusIcon, FilePlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EnvironmentSelector } from "../environments/environment-selector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HistorySidebar } from "./history-sidebar";
import { TestResultsSidebar } from "./test-results-sidebar";
import { HistoryIcon, FolderIcon, BeakerIcon } from "lucide-react";

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
      <div className="p-2 border-b">
        <EnvironmentSelector />
      </div>

      <Tabs defaultValue="explorer" className="flex-1 flex flex-col min-h-0">
        <div className="px-2 pt-2">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="explorer" className="text-xs px-0">
              <FolderIcon className="w-3 h-3 mr-2" /> Explorer
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs px-0">
              <HistoryIcon className="w-3 h-3 mr-2" /> History
            </TabsTrigger>
            <TabsTrigger value="tests" className="text-xs px-0">
              <BeakerIcon className="w-3 h-3 mr-2" /> Tests
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="explorer"
          className="flex-1 flex flex-col min-h-0 m-0 mt-2"
        >
          <div className="px-2 pb-2 flex items-center justify-between group">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Collections
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <PlusIcon size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleCreateRoot("collection")}
                >
                  <FolderPlusIcon className="mr-2 h-4 w-4" /> New Collection
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCreateRoot("request")}>
                  <FilePlusIcon className="mr-2 h-4 w-4" /> New Request
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {rootIds.map((id) => (
                <SidebarItem key={id} nodeId={id} level={0} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="history" className="flex-1 min-h-0 m-0">
          <HistorySidebar />
        </TabsContent>

        <TabsContent value="tests" className="flex-1 min-h-0 m-0">
          <TestResultsSidebar />
        </TabsContent>
      </Tabs>
    </div>
  );
}
