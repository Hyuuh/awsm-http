import React, { useState } from "react";
import { NodeType } from "@/types";
import { useWorkspaceStore } from "@/features/workspace/stores/workspace-store";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  FolderIcon,
  FileJsonIcon,
  MoreHorizontalIcon,
  FolderPlusIcon,
  FilePlusIcon,
  Trash2Icon,
  Edit2Icon,
  BoxIcon,
  PlugIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";

interface SidebarItemProps {
  nodeId: string;
  level?: number;
  isOverlay?: boolean;
}

export const SidebarItem = React.memo(function SidebarItem({
  nodeId,
  level = 0,
  isOverlay = false,
}: SidebarItemProps) {
  const node = useWorkspaceStore((state) => state.nodes[nodeId]);
  const isActive = useWorkspaceStore(
    (state) => state.activeRequestId === nodeId
  );

  const toggleExpand = useWorkspaceStore((state) => state.toggleExpand);
  const setActiveRequest = useWorkspaceStore((state) => state.setActiveRequest);
  const addNode = useWorkspaceStore((state) => state.addNode);
  const deleteNode = useWorkspaceStore((state) => state.deleteNode);
  const updateNodeName = useWorkspaceStore((state) => state.updateNodeName);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node?.name || "");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: nodeId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  if (!node) return null;

  if (isOverlay) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-background border rounded shadow-lg opacity-90 w-max min-w-[150px]">
        {node.type === "collection" ? (
          <FolderIcon className="size-4 text-blue-500" />
        ) : node.type === "request" ? (
          <span className="text-[10px] font-bold w-8">{node.data?.method}</span>
        ) : node.type === "websocket" ? (
          <PlugIcon className="size-4 text-purple-500" />
        ) : (
          <BoxIcon className="size-4" />
        )}
        <span className="text-sm truncate">{node.name}</span>
      </div>
    );
  }

  const isExpanded = node.isExpanded;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === "request" || node.type === "websocket") {
      setActiveRequest(nodeId);
    } else {
      toggleExpand(nodeId);
    }
  };

  const handleCreate = (type: NodeType) => {
    addNode(
      nodeId,
      type,
      type === "collection"
        ? "New Folder"
        : type === "request"
        ? "New Request"
        : "New WebSocket"
    );
    // No need to toggleExpand here, addNode handles it
  };

  const handleRename = () => {
    setEditName(node.name);
    setIsEditing(true);
  };

  const submitRename = () => {
    if (editName.trim()) {
      updateNodeName(nodeId, editName);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") submitRename();
    if (e.key === "Escape") setIsEditing(false);
  };

  const Icon =
    node.type === "workspace"
      ? BoxIcon
      : node.type === "collection"
      ? FolderIcon
      : node.type === "websocket"
      ? PlugIcon
      : FileJsonIcon;

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20";
      case "POST":
        return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20";
      case "PUT":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20";
      case "DELETE":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20";
      case "PATCH":
        return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 border-gray-500/20";
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={cn(
              "group flex items-center gap-1 py-1 px-2 cursor-pointer hover:bg-accent/50 text-sm select-none",
              isActive && "bg-accent text-accent-foreground font-medium"
            )}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={handleClick}
            {...attributes}
            {...listeners}
          >
            <div className="w-4 h-4 flex items-center justify-center shrink-0 text-muted-foreground">
              {node.type !== "request" &&
                node.type !== "websocket" &&
                (isExpanded ? (
                  <ChevronDownIcon size={14} />
                ) : (
                  <ChevronRightIcon size={14} />
                ))}
            </div>

            <Icon
              size={16}
              className={cn(
                "shrink-0",
                node.type === "request"
                  ? "text-blue-500"
                  : node.type === "websocket"
                  ? "text-purple-500"
                  : "text-yellow-500"
              )}
            />

            {isEditing ? (
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={submitRename}
                onKeyDown={handleKeyDown}
                className="h-6 text-xs py-0 px-1"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate flex-1">{node.name}</span>
            )}

            {node.type === "request" && node.data?.method && (
              <Badge
                variant="outline"
                className={cn(
                  "ml-2 text-[10px] px-1 py-0 h-4 font-mono uppercase tracking-tighter",
                  getMethodColor(node.data.method)
                )}
              >
                {node.data.method}
              </Badge>
            )}

            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-1 hover:bg-background rounded-sm">
                    <MoreHorizontalIcon size={14} />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {node.type !== "request" && node.type !== "websocket" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => handleCreate("collection")}
                      >
                        <FolderPlusIcon />
                        New Folder
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCreate("request")}>
                        <FilePlusIcon />
                        New Request
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleCreate("websocket")}
                      >
                        <PlugIcon />
                        New WebSocket
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleRename}>
                    <Edit2Icon />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => deleteNode(nodeId)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2Icon />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          {node.type !== "request" && node.type !== "websocket" && (
            <>
              <ContextMenuItem onClick={() => handleCreate("collection")}>
                <FolderPlusIcon />
                New Folder
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleCreate("request")}>
                <FilePlusIcon />
                New Request
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleCreate("websocket")}>
                <PlugIcon />
                New WebSocket
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem onClick={handleRename}>
            <Edit2Icon />
            Rename
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => deleteNode(nodeId)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2Icon />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {isExpanded && node.children && (
        <div>
          <SortableContext
            items={node.children}
            strategy={verticalListSortingStrategy}
          >
            {node.children.map((childId) => (
              <SidebarItem key={childId} nodeId={childId} level={level + 1} />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
});
