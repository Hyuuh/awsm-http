import { useState, useEffect, useRef } from "react";
import { useWorkspaceStore } from "@/features/workspace/stores/workspace-store";
import { WebSocketClient } from "@/features/network/services/websocket-client";
import { WebSocketMessage } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { substituteVariables } from "@/features/scripting/utils/variable-substitution";
import { SendIcon, PlugIcon, PlugZapIcon, Trash2Icon } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RequestTabs } from "./request-tabs";

interface WebSocketEditorProps {
  requestId: string;
}

export function WebSocketEditor({ requestId }: WebSocketEditorProps) {
  const node = useWorkspaceStore((state) => state.nodes[requestId]);
  const updateWebSocketData = useWorkspaceStore(
    (state) => state.updateWebSocketData
  );
  const environments = useWorkspaceStore((state) => state.environments);
  const globalVariables = useWorkspaceStore(
    (state) => state.globalVariables || []
  );
  const activeEnvironmentId = useWorkspaceStore(
    (state) => state.activeEnvironmentId
  );
  const fakerLocale = useWorkspaceStore((state) => state.fakerLocale);

  const [isConnected, setIsConnected] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = node?.wsData?.messages || [];

  // Prepare variables
  const activeEnv = environments.find((e) => e.id === activeEnvironmentId);
  const variables: Record<string, string> = {};
  globalVariables.forEach((v) => {
    if (v.enabled) variables[v.key] = v.value;
  });
  if (activeEnv) {
    activeEnv.variables.forEach((v) => {
      if (v.enabled) variables[v.key] = v.value;
    });
  }

  const addMessage = (msg: WebSocketMessage) => {
    const currentMessages =
      useWorkspaceStore.getState().nodes[requestId]?.wsData?.messages || [];
    updateWebSocketData(requestId, { messages: [...currentMessages, msg] });
  };

  // Check initial connection status
  useEffect(() => {
    setIsConnected(WebSocketClient.isConnected(requestId));
  }, [requestId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const handleConnect = () => {
    if (isConnected) {
      WebSocketClient.disconnect(requestId);
      // Status update will come from callback
    } else {
      if (!node.wsData?.url) return;
      const url = substituteVariables(node.wsData.url, variables, fakerLocale);
      WebSocketClient.connect(
        requestId,
        url,
        node.wsData.type || "raw",
        (msg) => addMessage(msg),
        (status) => setIsConnected(status)
      );
    }
  };

  const handleSend = () => {
    if (!messageInput) return;
    try {
      const substitutedInput = substituteVariables(
        messageInput,
        variables,
        fakerLocale
      );
      let messageToSend = substitutedInput;

      if (node.wsData?.type === "socket.io") {
        const eventName = node.wsData.eventName || "message";
        let data = substitutedInput;
        try {
          data = JSON.parse(substitutedInput);
        } catch {
          // keep as string
        }

        const payload = {
          event: eventName,
          data: data,
        };
        messageToSend = JSON.stringify(payload);
      }

      WebSocketClient.send(requestId, messageToSend);
      setMessageInput("");
    } catch (e) {
      // Error handled in client or ignored
    }
  };

  const handleClearLogs = () => {
    updateWebSocketData(requestId, { messages: [] });
  };

  const handleDeleteMessage = (messageId: string) => {
    const newMessages = messages.filter((m) => m.id !== messageId);
    updateWebSocketData(requestId, { messages: newMessages });
  };

  if (!node || !node.wsData) return null;

  return (
    <div className="flex flex-col h-full">
      <RequestTabs />
      {/* Header / URL Bar */}
      <div className="p-4 border-b flex gap-2 items-center">
        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-xs font-bold text-purple-500">
          WS
        </div>
        <Select
          value={node.wsData.type || "raw"}
          onValueChange={(v: any) =>
            updateWebSocketData(requestId, { type: v })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="raw">WebSocket</SelectItem>
            <SelectItem value="socket.io">Socket.IO</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={node.wsData.url}
          onChange={(e) =>
            updateWebSocketData(requestId, { url: e.target.value })
          }
          placeholder="wss://echo.websocket.org"
          className="flex-1 font-mono text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConnect();
          }}
        />
        <Button
          onClick={handleConnect}
          variant={isConnected ? "destructive" : "default"}
          className="w-32 gap-2"
        >
          {isConnected ? (
            <>
              <PlugZapIcon className="h-4 w-4" /> Disconnect
            </>
          ) : (
            <>
              <PlugIcon className="h-4 w-4" /> Connect
            </>
          )}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Messages Log */}
        <div className="flex-1 flex flex-col min-h-0 bg-muted/5">
          <div className="p-2 border-b flex justify-between items-center bg-background/50">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Messages
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleClearLogs}
              title="Clear Logs"
            >
              <Trash2Icon className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 min-h-0 relative">
            <ScrollArea className="h-full w-full p-4">
              <div className="flex flex-col gap-2 pb-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-10">
                    No messages yet. Connect and send a message to start.
                  </div>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "group relative flex flex-col gap-1 p-2 rounded-md text-sm font-mono border max-w-[80%]",
                      msg.type === "sent"
                        ? "bg-blue-500/10 border-blue-500/20 self-end ml-auto"
                        : msg.type === "received"
                        ? "bg-green-500/10 border-green-500/20 self-start mr-auto"
                        : msg.type === "error"
                        ? "bg-red-500/10 border-red-500/20 w-full max-w-full"
                        : "bg-muted border-transparent text-muted-foreground text-xs text-center w-full max-w-full"
                    )}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 hover:bg-background"
                      onClick={() => handleDeleteMessage(msg.id)}
                    >
                      <Trash2Icon className="h-3 w-3" />
                    </Button>
                    <div className="flex justify-between items-center gap-4 opacity-70 text-[10px]">
                      <span className="uppercase font-bold">{msg.type}</span>
                      <span>{format(msg.timestamp, "HH:mm:ss.SSS")}</span>
                    </div>
                    <div className="whitespace-pre-wrap break-all">
                      {msg.data}
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Message Input */}
        <div className="p-4 border-t bg-background">
          <div className="flex gap-2">
            {node.wsData?.type === "socket.io" && (
              <Input
                value={node.wsData.eventName || ""}
                onChange={(e) =>
                  updateWebSocketData(requestId, { eventName: e.target.value })
                }
                placeholder="Event (default: message)"
                className="w-48 font-mono"
                disabled={!isConnected}
              />
            )}
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Message (JSON, text...)"
              className="flex-1 font-mono"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={!isConnected}
            />
            <Button
              onClick={handleSend}
              disabled={!isConnected || !messageInput}
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
