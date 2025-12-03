import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import {
  TreeNode,
  ResponseData,
  Environment,
  HistoryItem,
  NodeType,
  RequestData,
  EnvironmentVariable,
  WebSocketRequestData,
} from "@/types";

export interface WorkspaceState {
  nodes: Record<string, TreeNode>;
  rootIds: string[];
  activeRequestId: string | null;
  openRequestIds: string[];
  responses: Record<string, ResponseData | null>;
  environments: Environment[];
  activeEnvironmentId: string | null;
  globalVariables: EnvironmentVariable[];
  history: HistoryItem[];
  fakerLocale: string;
}

interface WorkspaceActions {
  addNode: (parentId: string | null, type: NodeType, name: string) => string;
  deleteNode: (id: string) => void;
  updateNodeName: (id: string, name: string) => void;
  updateRequestData: (id: string, data: Partial<RequestData>) => void;
  updateWebSocketData: (
    id: string,
    data: Partial<WebSocketRequestData>
  ) => void;
  toggleExpand: (id: string) => void;
  setActiveRequest: (id: string | null) => void;
  closeTab: (id: string) => void;
  closeOtherTabs: (id: string) => void;
  closeAllTabs: () => void;
  setResponse: (requestId: string, response: ResponseData) => void;
  moveNode: (
    nodeId: string,
    newParentId: string | null,
    newIndex: number
  ) => void;

  // Environment actions
  addEnvironment: (name: string) => void;
  updateEnvironment: (
    id: string,
    name: string,
    variables: EnvironmentVariable[]
  ) => void;
  updateGlobalVariables: (variables: EnvironmentVariable[]) => void;
  deleteEnvironment: (id: string) => void;
  setActiveEnvironment: (id: string | null) => void;

  // History actions
  addToHistory: (item: Omit<HistoryItem, "id">) => void;
  clearHistory: () => void;
  openHistoryItem: (item: HistoryItem) => void;

  // Settings actions
  setFakerLocale: (locale: string) => void;

  initializeMockData: (force?: boolean) => void;
  importWorkspace: (data: {
    nodes: Record<string, TreeNode>;
    rootIds: string[];
    environments?: Environment[];
  }) => void;
}

const DEFAULT_REQUEST_DATA: RequestData = {
  url: "",
  method: "POST",
  params: [],
  headers: [
    {
      id: uuidv4(),
      key: "Content-Type",
      value: "application/json",
      enabled: true,
    },
  ],
  auth: { type: "none" },
  body: {
    type: "json",
    content: '{\n  "key": "value"\n}',
    formData: [],
    formUrlEncoded: [],
  },
  preRequestScript: `// Example: Set a timestamp variable
// awsm.variables.set("timestamp", Date.now());
// awsm.log("Timestamp set!");`,
  testScript: `// Example: Check status code
// awsm.test("Status code is 200", (log) => {
//   if (awsm.response.status !== 200) {
//     throw new Error("Expected 200 OK");
//   }
//   log("Server responded with " + awsm.response.status);
// });`,
};

const DEFAULT_WEBSOCKET_DATA: WebSocketRequestData = {
  url: "wss://echo.websocket.org",
};

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>()(
  persist(
    (set, get) => ({
      nodes: {},
      rootIds: [],
      activeRequestId: null,
      openRequestIds: [],
      responses: {},
      environments: [],
      activeEnvironmentId: null,
      globalVariables: [],
      history: [],
      fakerLocale: "en",

      setFakerLocale: (locale) => {
        set({ fakerLocale: locale });
      },

      addToHistory: (item) => {
        set((state) => ({
          history: [{ ...item, id: uuidv4() }, ...state.history].slice(0, 50), // Keep last 50 items
        }));
      },

      clearHistory: () => {
        set({ history: [] });
      },

      addNode: (parentId, type, name) => {
        const id = uuidv4();
        const newNode: TreeNode = {
          id,
          parentId,
          name,
          type,
          children:
            type === "workspace" || type === "collection" ? [] : undefined,
          isExpanded: true,
          data: type === "request" ? { ...DEFAULT_REQUEST_DATA } : undefined,
          wsData:
            type === "websocket" ? { ...DEFAULT_WEBSOCKET_DATA } : undefined,
        };

        set((state) => {
          const newNodes = { ...state.nodes, [id]: newNode };
          let newRootIds = [...state.rootIds];

          if (parentId) {
            // IMPORTANT: We must use state.nodes[parentId] to get the current parent state
            // NOT newNodes[parentId] because newNodes is just a shallow copy of the map so far
            const parent = state.nodes[parentId];
            if (parent) {
              newNodes[parentId] = {
                ...parent,
                children: parent.children ? [...parent.children, id] : [id],
                isExpanded: true, // Force expand
              };
            }
          } else {
            newRootIds.push(id);
          }

          return { nodes: newNodes, rootIds: newRootIds };
        });

        return id;
      },

      deleteNode: (id) => {
        set((state) => {
          const nodeToDelete = state.nodes[id];
          if (!nodeToDelete) return state;

          // 1. Identify all IDs to delete (target + descendants)
          const idsToDelete = new Set<string>();
          const markForDeletion = (nodeId: string) => {
            idsToDelete.add(nodeId);
            const node = state.nodes[nodeId];
            if (node && node.children) {
              node.children.forEach(markForDeletion);
            }
          };
          markForDeletion(id);

          // 2. Create new nodes object excluding deleted ones
          const newNodes: Record<string, TreeNode> = {};
          Object.keys(state.nodes).forEach((key) => {
            if (!idsToDelete.has(key)) {
              newNodes[key] = state.nodes[key];
            }
          });

          // 3. Update parent's children list
          let newRootIds = [...state.rootIds];
          if (nodeToDelete.parentId) {
            // Check if parent still exists (it should, unless we are deleting root)
            // Use newNodes to get the parent because we want to keep other changes if any
            // But wait, parent is NOT in idsToDelete, so it is in newNodes.
            const parent = newNodes[nodeToDelete.parentId];
            if (parent) {
              newNodes[nodeToDelete.parentId] = {
                ...parent,
                children: parent.children
                  ? parent.children.filter((childId) => childId !== id)
                  : [],
              };
            }
          } else {
            newRootIds = newRootIds.filter((rootId) => rootId !== id);
          }

          // 4. Update active request and open tabs
          // Only deselect if the active request is actually being deleted
          let newActiveRequestId = state.activeRequestId;
          let newOpenRequestIds = [...state.openRequestIds];

          // Remove deleted nodes from open tabs
          newOpenRequestIds = newOpenRequestIds.filter(
            (id) => !idsToDelete.has(id)
          );

          if (newActiveRequestId && idsToDelete.has(newActiveRequestId)) {
            // If active request is deleted, try to switch to another open tab
            newActiveRequestId =
              newOpenRequestIds.length > 0
                ? newOpenRequestIds[newOpenRequestIds.length - 1]
                : null;
          }

          return {
            nodes: newNodes,
            rootIds: newRootIds,
            activeRequestId: newActiveRequestId,
            openRequestIds: newOpenRequestIds,
          };
        });
      },

      updateNodeName: (id, name) => {
        set((state) => ({
          nodes: {
            ...state.nodes,
            [id]: { ...state.nodes[id], name },
          },
        }));
      },

      updateRequestData: (id, data) => {
        set((state) => {
          const node = state.nodes[id];
          if (!node || node.type !== "request" || !node.data) return state;

          return {
            nodes: {
              ...state.nodes,
              [id]: {
                ...node,
                data: { ...node.data, ...data },
              },
            },
          };
        });
      },

      updateWebSocketData: (id, data) => {
        set((state) => {
          const node = state.nodes[id];
          if (!node || !node.wsData) return state;

          return {
            nodes: {
              ...state.nodes,
              [id]: {
                ...node,
                wsData: { ...node.wsData, ...data },
              },
            },
          };
        });
      },

      moveNode: (nodeId, newParentId, newIndex) => {
        set((state) => {
          const node = state.nodes[nodeId];
          if (!node) return state;

          const oldParentId = node.parentId;
          if (oldParentId === newParentId && newIndex < 0) return state;

          const newNodes = { ...state.nodes };
          let newRootIds = [...state.rootIds];

          // 1. Remove from old parent
          if (oldParentId) {
            const oldParent = newNodes[oldParentId];
            if (oldParent && oldParent.children) {
              newNodes[oldParentId] = {
                ...oldParent,
                children: oldParent.children.filter((id) => id !== nodeId),
              };
            }
          } else {
            newRootIds = newRootIds.filter((id) => id !== nodeId);
          }

          // 2. Add to new parent
          if (newParentId) {
            const newParent = newNodes[newParentId];
            if (newParent) {
              const newChildren = newParent.children
                ? [...newParent.children]
                : [];

              if (newIndex < 0) newIndex = 0;
              if (newIndex > newChildren.length) newIndex = newChildren.length;

              newChildren.splice(newIndex, 0, nodeId);

              newNodes[newParentId] = {
                ...newParent,
                children: newChildren,
                isExpanded: true,
              };
            }
          } else {
            if (newIndex < 0) newIndex = 0;
            if (newIndex > newRootIds.length) newIndex = newRootIds.length;
            newRootIds.splice(newIndex, 0, nodeId);
          }

          // 3. Update node
          newNodes[nodeId] = { ...node, parentId: newParentId };

          return { nodes: newNodes, rootIds: newRootIds };
        });
      },

      toggleExpand: (id) => {
        set((state) => {
          const node = state.nodes[id];
          if (!node) return state;
          return {
            nodes: {
              ...state.nodes,
              [id]: { ...node, isExpanded: !node.isExpanded },
            },
          };
        });
      },

      setActiveRequest: (id) => {
        set((state) => {
          if (!id) return { activeRequestId: null };

          const newOpenRequestIds = [...state.openRequestIds];
          if (!newOpenRequestIds.includes(id)) {
            newOpenRequestIds.push(id);
          }

          return {
            activeRequestId: id,
            openRequestIds: newOpenRequestIds,
          };
        });
      },

      closeTab: (id) => {
        set((state) => {
          const newOpenRequestIds = state.openRequestIds.filter(
            (tabId) => tabId !== id
          );
          let newActiveRequestId = state.activeRequestId;

          if (state.activeRequestId === id) {
            // If closing the active tab, switch to the next available one (or previous)
            // Logic: try to go to the one to the right, if not, the one to the left
            // Actually, standard browser behavior is usually to go to the right, unless it was the last one, then left.
            // But simpler logic: just pick the last one in the new list for now, or maintain index.
            // Let's try to be smart: find index of closed tab
            const closedIndex = state.openRequestIds.indexOf(id);

            if (newOpenRequestIds.length === 0) {
              newActiveRequestId = null;
            } else if (closedIndex >= newOpenRequestIds.length) {
              // It was the last one, so pick the new last one
              newActiveRequestId =
                newOpenRequestIds[newOpenRequestIds.length - 1];
            } else {
              // Pick the one that is now at the same index (which was to the right)
              newActiveRequestId = newOpenRequestIds[closedIndex];
            }
          }

          return {
            openRequestIds: newOpenRequestIds,
            activeRequestId: newActiveRequestId,
          };
        });

        // Cleanup temporary nodes
        const state = get();
        const node = state.nodes[id];
        if (node && node.isTemporary) {
          set((state) => {
            const { [id]: deleted, ...remainingNodes } = state.nodes;
            const { [id]: deletedResponse, ...remainingResponses } =
              state.responses;
            return {
              nodes: remainingNodes,
              responses: remainingResponses,
            };
          });
        }
      },

      closeOtherTabs: (id) => {
        set((state) => {
          if (!state.openRequestIds.includes(id)) return state;
          return {
            openRequestIds: [id],
            activeRequestId: id,
          };
        });
      },

      closeAllTabs: () => {
        set({
          openRequestIds: [],
          activeRequestId: null,
        });
      },

      setResponse: (requestId, response) => {
        set((state) => ({
          responses: {
            ...state.responses,
            [requestId]: response,
          },
        }));
      },

      addEnvironment: (name) => {
        const newEnv: Environment = {
          id: uuidv4(),
          name,
          variables: [],
        };
        set((state) => ({
          environments: [...state.environments, newEnv],
          activeEnvironmentId: state.activeEnvironmentId || newEnv.id,
        }));
      },

      updateEnvironment: (id, name, variables) => {
        set((state) => ({
          environments: state.environments.map((env) =>
            env.id === id ? { ...env, name, variables } : env
          ),
        }));
      },

      updateGlobalVariables: (variables) => {
        set({ globalVariables: variables });
      },

      deleteEnvironment: (id) => {
        set((state) => ({
          environments: state.environments.filter((env) => env.id !== id),
          activeEnvironmentId:
            state.activeEnvironmentId === id ? null : state.activeEnvironmentId,
        }));
      },

      setActiveEnvironment: (id) => {
        set({ activeEnvironmentId: id });
      },

      importWorkspace: (data) => {
        set({
          nodes: data.nodes,
          rootIds: data.rootIds,
          activeRequestId: null,
          openRequestIds: [],
          responses: {},
          environments: data.environments || [],
          activeEnvironmentId: data.environments?.[0]?.id || null,
        });
      },

      openHistoryItem: (item) => {
        const id = uuidv4();
        const newNode: TreeNode = {
          id,
          parentId: null,
          name: `${item.method} ${item.url}`,
          type: "request",
          isTemporary: true,
          data: {
            ...DEFAULT_REQUEST_DATA,
            method: item.method as any,
            url: item.url,
          },
        };

        set((state) => ({
          nodes: { ...state.nodes, [id]: newNode },
          openRequestIds: [...state.openRequestIds, id],
          activeRequestId: id,
          responses: { ...state.responses, [id]: item.response || null },
        }));
      },

      initializeMockData: (force = false) => {
        const { nodes } = get();
        if (!force && Object.keys(nodes).length > 0) return;

        const { addNode, addEnvironment } = get();

        // Clear existing
        set({
          nodes: {},
          rootIds: [],
          activeRequestId: null,
          openRequestIds: [],
          responses: {},
          environments: [],
          activeEnvironmentId: null,
        });

        // Add Mock Environment
        addEnvironment("Local Development");
        const envs = get().environments;
        if (envs.length > 0) {
          get().updateEnvironment(envs[0].id, "Local Development", [
            {
              id: uuidv4(),
              key: "base_url",
              value: "https://jsonplaceholder.typicode.com",
              enabled: true,
            },
            {
              id: uuidv4(),
              key: "token",
              value: "secret-token-123",
              enabled: true,
            },
          ]);
        }

        const wsId = addNode(null, "workspace", "My Workspace");

        const authFolderId = addNode(wsId, "collection", "Auth");
        const loginReqId = addNode(authFolderId, "request", "Login User");
        get().updateRequestData(loginReqId, {
          url: "https://jsonplaceholder.typicode.com/posts",
          method: "POST",
          body: {
            type: "json",
            content:
              '{\n  "username": "admin",\n  "password": "password123"\n}',
          },
          preRequestScript: `awsm.log("Attempting to login as admin...");
// In a real app, you might hash the password here
// awsm.variables.set("password_hash", hash(password));`,
          testScript: `awsm.test("Login Successful (201 Created)", (log) => {
  if (awsm.response.status !== 201) {
    throw new Error("Expected 201 Created, got " + awsm.response.status);
  }
  log("Login successful");
});

awsm.test("Extract and set Auth Token", (log) => {
  // JSONPlaceholder doesn't return a real token, so we simulate one
  const mockToken = "eyJhGciOiJIUzI1Ni..." + Date.now();
  
  awsm.variables.set("token", mockToken);
  log("Token extracted and saved to environment variables");
});`,
        });

        const usersFolderId = addNode(wsId, "collection", "Users");
        const listUsersId = addNode(usersFolderId, "request", "List Users");
        get().updateRequestData(listUsersId, {
          url: "https://jsonplaceholder.typicode.com/users",
          method: "GET",
          body: { type: "none", content: "" },
          preRequestScript: `const token = awsm.variables.get("token");
if (!token) {
  awsm.log("Warning: No auth token found. Request might fail if auth was required.");
} else {
  awsm.log("Using cached auth token.");
}`,
          testScript: `awsm.test("Status code is 200", (log) => {
  if (awsm.response.status !== 200) {
    throw new Error("Expected 200 OK");
  }
  log("Status: " + awsm.response.status);
});

awsm.test("Response time < 500ms", (log) => {
  if (awsm.response.time > 500) {
    throw new Error("Response too slow: " + awsm.response.time + "ms");
  }
  log("Time: " + awsm.response.time + "ms");
});

awsm.test("Validate User Data Structure", (log) => {
  const users = awsm.response.body;
  if (!Array.isArray(users)) throw new Error("Body is not an array");
  
  if (users.length > 0) {
    const user = users[0];
    if (!user.email || !user.name) throw new Error("User object missing required fields");
  }
  log("Validated " + users.length + " users");
});`,
        });

        const createUserReqId = addNode(
          usersFolderId,
          "request",
          "Create User"
        );
        get().updateRequestData(createUserReqId, {
          url: "https://jsonplaceholder.typicode.com/users",
          method: "POST",
          body: {
            type: "json",
            content:
              '{\n  "name": "{{randomName}}",\n  "email": "{{randomEmail}}",\n  "company": {\n    "name": "{{randomCompany}}"\n  }\n}',
          },
          preRequestScript: `// Generate random data for the request
const name = awsm.faker.person.fullName();
const email = awsm.faker.internet.email();
const company = awsm.faker.company.name();

awsm.variables.set("randomName", name);
awsm.variables.set("randomEmail", email);
awsm.variables.set("randomCompany", company);

awsm.log("Generated user: " + name + " (" + email + ")");`,
          testScript: `awsm.test("User Created Successfully", (log) => {
  if (awsm.response.status !== 201) throw new Error("Failed to create user");
  log("User created with ID: " + awsm.response.body.id);
});

awsm.test("Verify Created Data", (log) => {
  const sentName = awsm.variables.get("randomName");
  const receivedName = awsm.response.body.name; // JSONPlaceholder echoes back data (mostly)
  
  // Note: JSONPlaceholder might not echo back variables exactly if they aren't in its schema, 
  // but for this mock we assume it does or we check what we can.
  if (receivedName && receivedName !== sentName) {
     throw new Error("Name mismatch! Sent: " + sentName + ", Got: " + receivedName);
  }
  log("Verified name matches: " + sentName);
});`,
        });
      },
    }),
    {
      name: "workspace-storage",
      partialize: (state) => ({
        nodes: state.nodes,
        rootIds: state.rootIds,
        activeRequestId: state.activeRequestId,
        openRequestIds: state.openRequestIds,
        environments: state.environments,
        activeEnvironmentId: state.activeEnvironmentId,
      }),
    }
  )
);
