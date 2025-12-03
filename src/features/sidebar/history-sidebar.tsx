import React, { useRef } from "react";
import { useWorkspaceStore } from "@/features/workspace/stores/workspace-store";
import { Button } from "@/components/ui/button";
import { Trash2Icon, SaveIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { HistoryItem, HttpMethod } from "@/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { toast } from "sonner";

const HistoryItemRow = React.memo(function HistoryItemRow({
  item,
  onLoad,
  onSave,
}: {
  item: HistoryItem;
  onLoad: (item: HistoryItem) => void;
  onSave: (item: HistoryItem) => void;
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <button
          className="flex flex-col gap-1 p-3 border-b hover:bg-muted/50 text-left transition-colors w-full"
          onClick={() => onLoad(item)}
        >
          <div className="flex items-center justify-between w-full">
            <span
              className={cn(
                "text-[10px] font-bold w-12",
                item.method === "GET" && "text-green-500",
                item.method === "POST" && "text-yellow-500",
                item.method === "PUT" && "text-blue-500",
                item.method === "DELETE" && "text-red-500",
                item.method === "PATCH" && "text-purple-500"
              )}
            >
              {item.method}
            </span>
            <span
              className={cn(
                "text-[10px]",
                item.status >= 200 && item.status < 300
                  ? "text-green-500"
                  : "text-red-500"
              )}
            >
              {item.status}
            </span>
          </div>
          <div
            className="text-xs truncate w-full font-mono opacity-80"
            title={item.url}
          >
            {item.url}
          </div>
          <div className="flex items-center justify-between w-full mt-1">
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(item.timestamp, { addSuffix: true })}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {item.duration}ms
            </span>
          </div>
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onSave(item)}>
          <SaveIcon /> Save as Request
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});

export function HistorySidebar() {
  const history = useWorkspaceStore((state) => state.history);
  const clearHistory = useWorkspaceStore((state) => state.clearHistory);
  const updateRequestData = useWorkspaceStore(
    (state) => state.updateRequestData
  );
  const setActiveRequest = useWorkspaceStore((state) => state.setActiveRequest);
  const addNode = useWorkspaceStore((state) => state.addNode);
  const setResponse = useWorkspaceStore((state) => state.setResponse);
  const openHistoryItem = useWorkspaceStore((state) => state.openHistoryItem);

  const handleLoad = (item: HistoryItem) => {
    openHistoryItem(item);
  };

  const handleSaveAsFile = (item: HistoryItem) => {
    const id = addNode(
      null,
      "request",
      `${item.method} ${item.url.slice(0, 20)}...`
    );
    updateRequestData(id, {
      method: item.method as HttpMethod,
      url: item.url,
    });

    if (item.response) {
      setResponse(id, item.response);
    }

    setActiveRequest(id);
    toast.success("Request saved from history");
  };

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: history.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 73, // Approximate height of a history item
    overscan: 5,
  });

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 border-b flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          History
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          className=""
          onClick={clearHistory}
          title="Clear History"
        >
          <Trash2Icon />
        </Button>
      </div>
      <div ref={parentRef} className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-xs">
            No history yet.
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = history[virtualRow.index];
              return (
                <div
                  key={item.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <HistoryItemRow
                    item={item}
                    onLoad={handleLoad}
                    onSave={handleSaveAsFile}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
