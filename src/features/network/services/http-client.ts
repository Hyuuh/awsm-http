import { RequestData, ResponseData } from "@/types";
import { invoke } from "@tauri-apps/api/core";

interface RustResponse {
  status: number;
  status_text: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: number;
}

export class HttpClient {
  static async send(request: RequestData): Promise<ResponseData> {
    try {
      const headers: Record<string, string> = {};
      request.headers.forEach((h) => {
        if (h.enabled && h.key) {
          headers[h.key] = h.value;
        }
      });

      // Handle Auth
      if (request.auth) {
        if (request.auth.type === "basic" && request.auth.basic) {
          const { username, password } = request.auth.basic;
          if (username || password) {
            const token = btoa(`${username || ""}:${password || ""}`);
            headers["Authorization"] = `Basic ${token}`;
          }
        } else if (request.auth.type === "bearer" && request.auth.bearer) {
          const { token } = request.auth.bearer;
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }
        } else if (request.auth.type === "apikey" && request.auth.apikey) {
          const { key, value, addTo } = request.auth.apikey;
          if (key && value) {
            if (addTo === "header") {
              headers[key] = value;
            } else if (addTo === "query") {
              const separator = request.url.includes("?") ? "&" : "?";
              request.url += `${separator}${key}=${encodeURIComponent(value)}`;
            }
          }
        } else if (request.auth.type === "oauth2" && request.auth.oauth2) {
          const { token } = request.auth.oauth2;
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }
        }
      }

      let body: string | null = null;
      if (request.method !== "GET" && request.body.type !== "none") {
        body = request.body.content;
      }

      const response = await invoke<RustResponse>("make_request", {
        method: request.method,
        url: request.url,
        headers,
        body,
      });

      let parsedBody: unknown = response.body;
      try {
        parsedBody = JSON.parse(response.body);
      } catch {
        // Not JSON
      }

      return {
        status: response.status,
        statusText: response.status_text,
        time: response.time,
        size: response.size,
        headers: response.headers,
        body: parsedBody,
        rawBody: response.body,
      };
    } catch (error: any) {
      return {
        status: 0,
        statusText: "Error",
        time: 0,
        size: 0,
        headers: {},
        body: { error: error.message || String(error) },
        rawBody: error.message || String(error),
      };
    }
  }
}
