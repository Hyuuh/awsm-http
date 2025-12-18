import { useMemo, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  ReactFlowProvider,
  NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import {
  ServerIcon,
  PlayIcon,
  Loader2Icon,
  StopCircleIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useServerStore } from "./store/server-store";
import { useWorkspaceStore } from "@/features/workspace/stores/workspace-store";
import { SchemaSidebar } from "./components/schema-sidebar";
import { TableNode } from "./components/table-node";
import Database from "@tauri-apps/plugin-sql";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";
import { loadSchemaFromDb, syncSchema } from "./lib/schema-sync";
import { useTheme } from "../theme/theme-provider";

const nodeTypes: NodeTypes = {
  table: TableNode as any,
};

function ServerMockContent() {
  const tables = useServerStore((state) => state.tables);
  const setTables = useServerStore((state) => state.setTables);
  const onNodesChange = useServerStore((state) => state.onNodesChange);
  const setActiveTable = useServerStore((state) => state.setActiveTable);
  const activeTableId = useServerStore((state) => state.activeTableId);
  const defaultPageSize = useWorkspaceStore((state) => state.defaultPageSize);
  const isProvisioning = useServerStore((state) => state.isProvisioning);
  const setIsProvisioning = useServerStore((state) => state.setIsProvisioning);
  const isRunning = useServerStore((state) => state.isRunning);
  const setIsRunning = useServerStore((state) => state.setIsRunning);
  const port = useWorkspaceStore((state) => state.serverPort);

  // Initialize from DB
  useEffect(() => {
    const init = async () => {
      try {
        const db = await Database.load("sqlite:mock_server.db");
        const loadedTables = await loadSchemaFromDb(db);
        if (loadedTables.length > 0 && tables.length === 0) {
          setTables(loadedTables);
        }
      } catch (e) {
        console.error("Failed to load initial schema", e);
      }
    };
    init();
  }, []);

  // Convert tables to nodes
  const nodes: Node[] = useMemo(() => {
    return tables.map((table) => ({
      id: table.id,
      type: "table",
      position: table.position,
      data: table as unknown as Record<string, unknown>,
      selected: table.id === activeTableId,
      dragHandle: ".drag-handle",
    }));
  }, [tables, activeTableId]);

  // Convert FKs to edges
  const edges: Edge[] = useMemo(() => {
    const newEdges: Edge[] = [];
    tables.forEach((table) => {
      table.columns.forEach((col) => {
        if (col.fkTargetTableId) {
          const edge: Edge = {
            id: `e-${table.id}-${col.id}-${col.fkTargetTableId}`,
            source: table.id,
            target: col.fkTargetTableId,
            sourceHandle: `source-${col.id}`,
            animated: true,
            style: { stroke: "#3b82f6" },
          };

          // If we have the target column ID, link to it specifically
          if (col.fkTargetColumnId) {
            edge.targetHandle = `target-${col.fkTargetColumnId}`;
          } else {
            // Fallback: try to find the PK of the target table
            const targetTable = tables.find(
              (t) => t.id === col.fkTargetTableId
            );
            const pkCol = targetTable?.columns.find((c) => c.isPk);
            if (pkCol) {
              edge.targetHandle = `target-${pkCol.id}`;
            }
          }

          newEdges.push(edge);
        }
      });
    });
    return newEdges;
  }, [tables]);

  const onNodeClick = useCallback(
    (_: any, node: Node) => {
      setActiveTable(node.id);
    },
    [setActiveTable]
  );

  const onPaneClick = useCallback(() => {
    setActiveTable(null);
  }, [setActiveTable]);

  const handleProvisionAndStart = async () => {
    const currentTables = useServerStore.getState().tables;
    if (currentTables.length === 0) {
      toast.error("No tables to provision");
      return;
    }

    setIsProvisioning(true);
    try {
      // 1. Connect to DB (create file)
      const db = await Database.load("sqlite:mock_server.db");

      // 2. Sync Schema (Smart Update)
      await syncSchema(db, currentTables);

      // 3. Start/Restart Rust Server
      const routes = currentTables.map((t) => {
        let path = t.path || `/${t.name.toLowerCase()}`;
        if (!path.startsWith("/")) path = "/" + path;
        return {
          path,
          table_name: t.name,
        };
      });

      const msg = await invoke("restart_mock_server", {
        port,
        dbPath: "mock_server.db",
        routes,
        defaultPageSize,
      });

      toast.success("Server started/restarted!", {
        description: String(msg),
      });
      setIsRunning(true);
    } catch (error) {
      console.error("Provisioning failed:", error);
      toast.error("Failed to start server", {
        description: String(error),
      });
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleStop = async () => {
    try {
      await invoke("stop_mock_server");
      setIsRunning(false);
      toast.success("Server stopped");
    } catch (e) {
      toast.error("Failed to stop server");
    }
  };
  const { theme } = useTheme();
  const editorTheme =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
      ? "dark"
      : "light";
  return (
    <div className="flex h-full w-full overflow-hidden">
      <SchemaSidebar onSave={handleProvisionAndStart} />
      <div className="flex-1 h-full relative bg-muted/5">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
          colorMode={editorTheme}
        >
          <Background gap={12} size={1} />
          <Controls />
        </ReactFlow>

        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-background/80 backdrop-blur p-2 rounded-md border shadow-sm">
          {!isRunning ? (
            <Button
              onClick={handleProvisionAndStart}
              size="sm"
              disabled={isProvisioning}
            >
              {isProvisioning ? (
                <Loader2Icon className="size-3 mr-2 animate-spin" />
              ) : (
                <PlayIcon className="size-3 mr-2" />
              )}
              Start Server
            </Button>
          ) : (
            <Button onClick={handleStop} size="sm" variant="destructive">
              <StopCircleIcon className="size-3 mr-2" />
              Stop Server
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ServerMock() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size={"icon"} variant={"link"}>
          <ServerIcon className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-7xl h-[80vh] overflow-hidden p-4"
        aria-describedby="server mock"
      >
        <DialogHeader className="hidden" title="Server mock" />

        <ReactFlowProvider>
          <ServerMockContent />
        </ReactFlowProvider>
      </DialogContent>
    </Dialog>
  );
}
