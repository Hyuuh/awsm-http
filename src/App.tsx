import { useEffect } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Sidebar } from "@/features/sidebar/sidebar";
import { RequestEditor } from "@/features/request-editor/request-editor";
import { useWorkspaceStore } from "@/stores/workspace-store";

function App() {
  const initializeMockData = useWorkspaceStore(
    (state) => state.initializeMockData
  );

  useEffect(() => {
    initializeMockData();
  }, [initializeMockData]);

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full w-full rounded-lg border"
    >
      <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
        <Sidebar />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={75}>
        <RequestEditor />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default App;
