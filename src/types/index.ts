export type NodeType = "workspace" | "collection" | "request";
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface RequestHeader {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export interface RequestParam {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export interface RequestAuth {
  type: "none" | "basic" | "bearer" | "apikey";
  basic?: { username?: string; password?: string };
  bearer?: { token?: string };
  apikey?: { key?: string; value?: string; addTo?: "header" | "query" };
}

export interface FormDataItem {
  id: string;
  key: string;
  value: string;
  type: "text" | "file";
  enabled: boolean;
  description?: string;
}

export interface RequestBody {
  type:
    | "json"
    | "text"
    | "xml"
    | "html"
    | "form-data"
    | "x-www-form-urlencoded"
    | "binary"
    | "none";
  content: string; // For raw types (json, text, xml, html)
  formData?: FormDataItem[];
  formUrlEncoded?: RequestParam[];
}

export interface RequestData {
  url: string;
  method: HttpMethod;
  params: RequestParam[];
  headers: RequestHeader[];
  auth: RequestAuth;
  body: RequestBody;
  preRequestScript?: string;
  testScript?: string;
}

export interface ResponseData {
  status: number;
  statusText: string;
  time: number;
  size: number;
  headers: Record<string, string>;
  body: unknown;
  rawBody: string;
}

export interface TreeNode {
  id: string;
  parentId: string | null;
  name: string;
  type: NodeType;
  children?: string[]; // Array of child IDs
  isExpanded?: boolean;
  data?: RequestData; // Only for type === 'request'
  isTemporary?: boolean; // If true, deleted when tab is closed
}

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface Environment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
}

export interface HistoryItem {
  id: string;
  requestId?: string; // If linked to a saved request
  method: string;
  url: string;
  timestamp: number;
  status: number;
  statusText: string;
  duration: number;
  size: number;
  response?: ResponseData;
}

export interface WorkspaceState {
  nodes: Record<string, TreeNode>;
  rootIds: string[];
  activeRequestId: string | null;
  openRequestIds: string[];
  responses: Record<string, ResponseData | null>;
  environments: Environment[];
  activeEnvironmentId: string | null;
  history: HistoryItem[];
}
