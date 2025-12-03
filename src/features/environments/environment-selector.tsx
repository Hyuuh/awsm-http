import { useWorkspaceStore } from "@/features/workspace/stores/workspace-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EnvironmentManager } from "./environment-manager";

export function EnvironmentSelector() {
  const environments = useWorkspaceStore((state) => state.environments);
  const activeEnvironmentId = useWorkspaceStore(
    (state) => state.activeEnvironmentId
  );
  const setActiveEnvironment = useWorkspaceStore(
    (state) => state.setActiveEnvironment
  );

  return (
    <div className="flex items-center gap-2">
      <Select
        value={activeEnvironmentId || "none"}
        onValueChange={(val) =>
          setActiveEnvironment(val === "none" ? null : val)
        }
      >
        <SelectTrigger className="w-[180px] h-8 text-xs">
          <SelectValue placeholder="No Environment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Environment</SelectItem>
          {environments.map((env) => (
            <SelectItem key={env.id} value={env.id}>
              {env.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <EnvironmentManager />
    </div>
  );
}
