import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
} from "@/components/ui/item";
import {
  DownloadIcon,
  UploadIcon,
  FileJsonIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { v4 as uuidv4 } from "uuid";
import { RequestData } from "@/types";
import { toast } from "sonner";
import { Separator } from "./ui/separator";

interface ImportExportDialogProps {
  children: React.ReactNode;
}

export function ImportExportDialog({ children }: ImportExportDialogProps) {
  const [open, setOpen] = useState(false);
  const nodes = useWorkspaceStore((state) => state.nodes);
  const rootIds = useWorkspaceStore((state) => state.rootIds);
  const importWorkspace = useWorkspaceStore((state) => state.importWorkspace);
  const addNode = useWorkspaceStore((state) => state.addNode);
  const updateRequestData = useWorkspaceStore(
    (state) => state.updateRequestData
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const postmanInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = {
      nodes,
      rootIds,
      version: "1.0",
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `awsm-http-workspace-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setOpen(false);
    toast.success("Workspace exported successfully in your downloads folder");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handlePostmanImportClick = () => {
    postmanInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.nodes && data.rootIds) {
          importWorkspace({ nodes: data.nodes, rootIds: data.rootIds });
          setOpen(false);
          toast.success("Workspace imported successfully");
        } else {
          toast.error("Invalid workspace file format");
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
        toast.error("Error parsing JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handlePostmanFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        importPostmanCollection(data);
        toast.success("Workspace from postman imported successfully");
        setOpen(false);
      } catch (error) {
        console.error("Error parsing Postman JSON:", error);
        toast.error("Error parsing Postman JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const importPostmanCollection = (data: any) => {
    // Create a root folder for the collection
    const collectionName = data.info?.name || "Imported Collection";
    const collectionId = addNode(null, "workspace", collectionName);

    if (data.item && Array.isArray(data.item)) {
      processPostmanItems(data.item, collectionId);
    }
  };

  const processPostmanItems = (items: any[], parentId: string) => {
    items.forEach((item) => {
      if (item.item) {
        const folderId = addNode(parentId, "collection", item.name);
        processPostmanItems(item.item, folderId);
      } else if (item.request) {
        const requestId = addNode(parentId, "request", item.name);
        const requestData = convertPostmanRequest(item.request);
        updateRequestData(requestId, requestData);
      }
    });
  };

  const convertPostmanRequest = (postmanReq: any): Partial<RequestData> => {
    const url =
      typeof postmanReq.url === "string"
        ? postmanReq.url
        : postmanReq.url?.raw || "";

    const method = postmanReq.method || "GET";

    const headers = (postmanReq.header || []).map((h: any) => ({
      id: uuidv4(),
      key: h.key,
      value: h.value,
      enabled: !h.disabled,
    }));

    const params = (postmanReq.url?.query || []).map((p: any) => ({
      id: uuidv4(),
      key: p.key,
      value: p.value,
      enabled: !p.disabled,
    }));

    let body: any = { type: "none", content: "" };
    if (postmanReq.body) {
      const mode = postmanReq.body.mode;
      if (mode === "raw") {
        body = {
          type: "json",
          content: postmanReq.body.raw || "",
        };

        try {
          JSON.parse(postmanReq.body.raw);
        } catch {
          body.type = "text";
        }
      } else if (mode === "formdata") {
        body = {
          type: "form-data",
          formData: (postmanReq.body.formdata || []).map((f: any) => ({
            id: uuidv4(),
            key: f.key,
            value: f.value,
            type: f.type || "text",
            enabled: !f.disabled,
          })),
        };
      } else if (mode === "urlencoded") {
        body = {
          type: "x-www-form-urlencoded",
          formUrlEncoded: (postmanReq.body.urlencoded || []).map((f: any) => ({
            id: uuidv4(),
            key: f.key,
            value: f.value,
            enabled: !f.disabled,
          })),
        };
      }
    }

    let auth: any = { type: "none" };
    if (postmanReq.auth) {
      if (postmanReq.auth.type === "bearer") {
        auth = {
          type: "bearer",
          bearer: {
            token: postmanReq.auth.bearer?.[0]?.value || "",
          },
        };
      } else if (postmanReq.auth.type === "basic") {
        auth = {
          type: "basic",
          basic: {
            username:
              postmanReq.auth.basic?.find((x: any) => x.key === "username")
                ?.value || "",
            password:
              postmanReq.auth.basic?.find((x: any) => x.key === "password")
                ?.value || "",
          },
        };
      } else if (postmanReq.auth.type === "apikey") {
        auth = {
          type: "apikey",
          apikey: {
            key:
              postmanReq.auth.apikey?.find((x: any) => x.key === "key")
                ?.value || "",
            value:
              postmanReq.auth.apikey?.find((x: any) => x.key === "value")
                ?.value || "",
            addTo:
              postmanReq.auth.apikey?.find((x: any) => x.key === "in")?.value ||
              "header",
          },
        };
      }
    }

    return {
      url,
      method,
      headers,
      params,
      body,
      auth,
    };
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] gap-0 p-0 overflow-hidden border-primary/30">
        <DialogHeader className="px-4 py-3 border-b bg-muted/30">
          <DialogTitle>Import / Export</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 p-2">
          <Item variant={"outline"} asChild>
            <button onClick={handleImportClick}>
              <ItemMedia>
                <UploadIcon className="text-muted-foreground" />
              </ItemMedia>
              <ItemContent>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">Import Workspace</span>
                  <span className="text-xs text-muted-foreground">
                    Restore from a JSON file
                  </span>
                </div>
              </ItemContent>
              <ItemActions>
                <ChevronRightIcon className="size-4" />
              </ItemActions>
            </button>
          </Item>
          <Item variant={"outline"} asChild>
            <button onClick={handleExport}>
              <ItemMedia>
                <DownloadIcon className="text-muted-foreground" />
              </ItemMedia>
              <ItemContent>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">Export Workspace</span>
                  <span className="text-xs text-muted-foreground">
                    Save current workspace to a JSON file
                  </span>
                </div>
              </ItemContent>
              <ItemActions>
                <ChevronRightIcon className="size-4" />
              </ItemActions>
            </button>
          </Item>
          <Separator orientation="horizontal" className="bg-primary/30" />
          <Item variant={"outline"} asChild>
            <button onClick={handlePostmanImportClick}>
              <ItemMedia>
                <FileJsonIcon className="text-orange-500" />
              </ItemMedia>
              <ItemContent>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">Import from Postman</span>
                  <span className="text-xs text-muted-foreground">
                    Import a Postman Collection (v2.1)
                  </span>
                </div>
              </ItemContent>
              <ItemActions>
                <ChevronRightIcon className="size-4" />
              </ItemActions>
            </button>
          </Item>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".json"
          onChange={handleFileChange}
        />
        <input
          type="file"
          ref={postmanInputRef}
          className="hidden"
          accept=".json"
          onChange={handlePostmanFileChange}
        />
      </DialogContent>
    </Dialog>
  );
}
