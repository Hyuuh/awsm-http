import { Suspense, lazy } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Sidebar } from "@/features/sidebar/sidebar";
import { RocketIcon } from "lucide-react";

const RequestEditor = lazy(() =>
  import("@/features/request-editor/request-editor").then((module) => ({
    default: module.RequestEditor,
  }))
);

function App() {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full w-full rounded-lg border selection:bg-primary/30 border-primary/30 "
    >
      <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
        <Sidebar />
      </ResizablePanel>
      <ResizableHandle withHandle className="bg-primary/30" />
      <ResizablePanel defaultSize={75}>
        <Suspense
          fallback={
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="flex flex-col items-center gap-2 animate-pulse">
                <RocketIcon className="h-8 w-8" />
                <span className="text-sm">Loading editor...</span>
              </div>
            </div>
          }
        >
          <RequestEditor />
        </Suspense>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default App;
