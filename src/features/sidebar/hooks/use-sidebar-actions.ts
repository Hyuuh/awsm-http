import { useWorkspaceStore } from "@/features/workspace/stores/workspace-store";

export function useSidebarActions() {
  const addNode = useWorkspaceStore((state) => state.addNode);

  const handleCreateRoot = (
    type: "workspace" | "collection" | "request" | "websocket"
  ) => {
    addNode(
      null,
      type,
      type === "workspace"
        ? "New Workspace"
        : type === "collection"
        ? "New Folder"
        : type === "request"
        ? "New Request"
        : "New WebSocket"
    );
  };

  return { handleCreateRoot };
}
