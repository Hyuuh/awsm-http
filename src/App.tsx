import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Sidebar } from "@/features/sidebar/sidebar";
import { RequestEditor } from "@/features/request-editor/request-editor";

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
        <RequestEditor />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default App;
