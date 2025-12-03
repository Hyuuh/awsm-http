import { useWorkspaceStore } from "@/features/workspace/stores/workspace-store";
import { cn } from "@/lib/utils";
import { CheckIcon, XIcon, BeakerIcon } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function TestResultsSidebar() {
  const activeRequestId = useWorkspaceStore((state) => state.activeRequestId);
  const responses = useWorkspaceStore((state) => state.responses);

  const response = activeRequestId ? responses[activeRequestId] : null;
  const testResults = response?.testResults;
  const logs = response?.logs || [];

  if (!activeRequestId) {
    return (
      <div className="h-full flex items-center justify-center p-4 text-center">
        <div className="text-muted-foreground text-sm">
          Select a request to view test results.
        </div>
      </div>
    );
  }

  if ((!testResults || testResults.length === 0) && logs.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <Empty>
          <EmptyMedia>
            <BeakerIcon className="text-muted-foreground" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No Tests Run</EmptyTitle>
            <EmptyDescription>
              Run the request to see test results here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const passedCount =
    testResults?.filter((r) => r.status === "passed").length || 0;
  const failedCount =
    testResults?.filter((r) => r.status === "failed").length || 0;

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b text-xs font-medium flex items-center justify-between bg-muted/5">
        <span>Summary</span>
        <div className="flex gap-2">
          <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
            <CheckIcon className="w-3 h-3" /> {passedCount}
          </span>
          <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
            <XIcon className="w-3 h-3" /> {failedCount}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-2 space-y-4">
        {testResults && testResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Test Results
            </h3>
            {testResults.map((result, i) => (
              <div
                key={i}
                className={cn(
                  "p-2 rounded-md border text-sm",
                  result.status === "passed"
                    ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
                    : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                )}
              >
                <div className="flex items-center gap-2 font-medium">
                  {result.status === "passed" ? (
                    <CheckIcon className="w-4 h-4 shrink-0" />
                  ) : (
                    <XIcon className="w-4 h-4 shrink-0" />
                  )}
                  <span className="break-all select-text">{result.name}</span>
                </div>
                {result.description && (
                  <div className="mt-1 text-xs opacity-80 break-all pl-6 text-muted-foreground select-text">
                    {result.description}
                  </div>
                )}
                {result.error && (
                  <div className="mt-1 text-xs opacity-80 break-all pl-6 text-red-500 select-text">
                    {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {logs.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Console Logs
            </h3>
            <div className="bg-muted/30 rounded-md border p-2 space-y-1">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className="text-xs font-mono break-all select-text"
                >
                  <span className="text-muted-foreground select-none mr-2">
                    {i + 1}
                  </span>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
