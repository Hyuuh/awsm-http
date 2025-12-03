import { WebSocketMessage } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { io, Socket } from "socket.io-client";

type MessageCallback = (message: WebSocketMessage) => void;
type StatusCallback = (isConnected: boolean) => void;

interface Connection {
  ws?: WebSocket;
  socket?: Socket;
  type: "raw" | "socket.io";
  onMessage: MessageCallback;
  onStatus: StatusCallback;
}

export class WebSocketClient {
  private static connections: Record<string, Connection> = {};

  static connect(
    id: string,
    url: string,
    type: "raw" | "socket.io" = "raw",
    onMessage: MessageCallback,
    onStatus: StatusCallback
  ) {
    this.disconnect(id); // Close existing if any

    if (type === "socket.io") {
      this.connectSocketIO(id, url, onMessage, onStatus);
    } else {
      this.connectRaw(id, url, onMessage, onStatus);
    }
  }

  private static connectSocketIO(
    id: string,
    url: string,
    onMessage: MessageCallback,
    onStatus: StatusCallback
  ) {
    try {
      const socket = io(url, {
        transports: ["websocket"], // Force websocket transport
      });

      socket.on("connect", () => {
        onStatus(true);
        onMessage({
          id: uuidv4(),
          type: "system",
          data: `Connected to ${url} (Socket.IO)`,
          timestamp: Date.now(),
        });
      });

      socket.on("disconnect", (reason) => {
        onStatus(false);
        onMessage({
          id: uuidv4(),
          type: "system",
          data: `Disconnected: ${reason}`,
          timestamp: Date.now(),
        });
      });

      socket.on("connect_error", (error) => {
        onMessage({
          id: uuidv4(),
          type: "error",
          data: `Connection Error: ${error.message}`,
          timestamp: Date.now(),
        });
      });

      socket.onAny((event, ...args) => {
        onMessage({
          id: uuidv4(),
          type: "received",
          data: JSON.stringify({ event, args }, null, 2),
          timestamp: Date.now(),
        });
      });

      this.connections[id] = { socket, type: "socket.io", onMessage, onStatus };
    } catch (e: any) {
      onMessage({
        id: uuidv4(),
        type: "error",
        data: `Connection failed: ${e.message}`,
        timestamp: Date.now(),
      });
    }
  }

  private static connectRaw(
    id: string,
    url: string,
    onMessage: MessageCallback,
    onStatus: StatusCallback
  ) {
    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        onStatus(true);
        onMessage({
          id: uuidv4(),
          type: "system",
          data: `Connected to ${url}`,
          timestamp: Date.now(),
        });
      };

      ws.onclose = (event) => {
        onStatus(false);
        onMessage({
          id: uuidv4(),
          type: "system",
          data: `Disconnected (Code: ${event.code}${
            event.reason ? `: ${event.reason}` : ""
          })`,
          timestamp: Date.now(),
        });
      };

      ws.onerror = () => {
        onMessage({
          id: uuidv4(),
          type: "error",
          data: "WebSocket Error",
          timestamp: Date.now(),
        });
      };

      ws.onmessage = (event) => {
        onMessage({
          id: uuidv4(),
          type: "received",
          data: typeof event.data === "string" ? event.data : "Binary data",
          timestamp: Date.now(),
        });
      };

      this.connections[id] = { ws, type: "raw", onMessage, onStatus };
    } catch (e: any) {
      onMessage({
        id: uuidv4(),
        type: "error",
        data: `Connection failed: ${e.message}`,
        timestamp: Date.now(),
      });
    }
  }

  static disconnect(id: string) {
    const conn = this.connections[id];
    if (conn) {
      if (conn.type === "socket.io" && conn.socket) {
        conn.socket.disconnect();
      } else if (conn.type === "raw" && conn.ws) {
        conn.ws.close();
      }
      delete this.connections[id];
    }
  }

  static send(id: string, message: string) {
    const conn = this.connections[id];
    if (!conn) {
      throw new Error("WebSocket is not connected");
    }

    if (conn.type === "socket.io" && conn.socket) {
      if (conn.socket.connected) {
        try {
          const parsed = JSON.parse(message);
          if (parsed.event && parsed.data) {
            conn.socket.emit(parsed.event, parsed.data);
          } else {
            conn.socket.emit("message", parsed);
          }
        } catch {
          conn.socket.emit("message", message);
        }
        conn.onMessage({
          id: uuidv4(),
          type: "sent",
          data: message,
          timestamp: Date.now(),
        });
      } else {
        throw new Error("Socket.IO is not connected");
      }
    } else if (conn.type === "raw" && conn.ws) {
      if (conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(message);
        conn.onMessage({
          id: uuidv4(),
          type: "sent",
          data: message,
          timestamp: Date.now(),
        });
      } else {
        throw new Error("WebSocket is not connected");
      }
    }
  }

  static isConnected(id: string): boolean {
    const conn = this.connections[id];
    if (!conn) return false;
    if (conn.type === "socket.io") return conn.socket?.connected ?? false;
    return conn.ws?.readyState === WebSocket.OPEN;
  }
}
