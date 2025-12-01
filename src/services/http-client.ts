import { RequestData, ResponseData } from "../types";

export class HttpClient {
  static async send(request: RequestData): Promise<ResponseData> {
    const startTime = performance.now();

    try {
      const headers: Record<string, string> = {};
      request.headers.forEach((h) => {
        if (h.enabled && h.key) {
          headers[h.key] = h.value;
        }
      });

      const options: RequestInit = {
        method: request.method,
        headers,
      };

      if (request.method !== "GET" && request.body.type !== "none") {
        options.body = request.body.content;
      }

      const response = await fetch(request.url, options);
      const endTime = performance.now();

      const responseBlob = await response.blob();
      const responseText = await responseBlob.text();
      const size = responseBlob.size;

      let body: unknown = responseText;
      try {
        body = JSON.parse(responseText);
      } catch {
        // Not JSON
      }

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        status: response.status,
        statusText: response.statusText,
        time: Math.round(endTime - startTime),
        size,
        headers: responseHeaders,
        body,
        rawBody: responseText,
      };
    } catch (error: any) {
      const endTime = performance.now();
      return {
        status: 0,
        statusText: "Error",
        time: Math.round(endTime - startTime),
        size: 0,
        headers: {},
        body: { error: error.message },
        rawBody: error.message || "Unknown error",
      };
    }
  }
}
