import React, { useState } from "react";
import { TreeNode, NodeType } from "@/types";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FileJson,
  MoreHorizontal,
  FolderPlus,
  FilePlus,
  Trash2,
  Edit2,
  Box,
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

interface SidebarItemProps {
  nodeId: string;
  level?: number;
}

export function SidebarItem({ nodeId, level = 0 }: SidebarItemProps) {
  const node = useWorkspaceStore((state) => state.nodes[nodeId]);
  const activeRequestId = useWorkspaceStore((state) => state.activeRequestId);
  const {
    toggleExpand,
    setActiveRequest,
    addNode,
    deleteNode,
    updateNodeName,
  } = useWorkspaceStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node?.name || "");

  if (!node) return null;

  const isExpanded = node.isExpanded;
  const isActive = activeRequestId === nodeId;
  const hasChildren = node.children && node.children.length > 0;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === "request") {
      setActiveRequest(nodeId);
    } else {
      toggleExpand(nodeId);
    }
  };

  const handleCreate = (type: NodeType) => {
    addNode(nodeId, type, type === "collection" ? "New Folder" : "New Request");
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
      ? Box
      : node.type === "collection"
      ? Folder
      : FileJson;

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={cn(
              "group flex items-center gap-1 py-1 px-2 cursor-pointer hover:bg-accent/50 text-sm select-none",
              isActive && "bg-accent text-accent-foreground font-medium"
            )}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={handleClick}
          >
            <div className="w-4 h-4 flex items-center justify-center shrink-0 text-muted-foreground">
              {node.type !== "request" &&
                (isExpanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                ))}
            </div>

            <Icon
              size={16}
              className={cn(
                "shrink-0",
                node.type === "request" ? "text-blue-500" : "text-yellow-500"
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

            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-1 hover:bg-background rounded-sm">
                    <MoreHorizontal size={14} />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {node.type !== "request" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => handleCreate("collection")}
                      >
                        <FolderPlus className="mr-2 h-4 w-4" />
                        New Folder
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCreate("request")}>
                        <FilePlus className="mr-2 h-4 w-4" />
                        New Request
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleRename}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => deleteNode(nodeId)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          {node.type !== "request" && (
            <>
              <ContextMenuItem onClick={() => handleCreate("collection")}>
                <FolderPlus className="mr-2 h-4 w-4" />
                New Folder
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleCreate("request")}>
                <FilePlus className="mr-2 h-4 w-4" />
                New Request
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem onClick={handleRename}>
            <Edit2 className="mr-2 h-4 w-4" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => deleteNode(nodeId)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {isExpanded && node.children && (
        <div>
          {node.children.map((childId) => (
            <SidebarItem key={childId} nodeId={childId} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
