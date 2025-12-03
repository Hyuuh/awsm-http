import { useState } from "react";
import { useWorkspaceStore } from "@/features/workspace/stores/workspace-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PlusIcon,
  Trash2Icon,
  Settings2Icon,
  GripVerticalIcon,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function EnvironmentManager() {
  const environments = useWorkspaceStore((state) => state.environments);
  const globalVariables = useWorkspaceStore((state) => state.globalVariables);
  const addEnvironment = useWorkspaceStore((state) => state.addEnvironment);
  const updateEnvironment = useWorkspaceStore(
    (state) => state.updateEnvironment
  );
  const updateGlobalVariables = useWorkspaceStore(
    (state) => state.updateGlobalVariables
  );
  const deleteEnvironment = useWorkspaceStore(
    (state) => state.deleteEnvironment
  );

  const [selectedEnvId, setSelectedEnvId] = useState<string | null>("globals");

  const selectedEnv =
    selectedEnvId === "globals"
      ? { id: "globals", name: "Global Variables", variables: globalVariables }
      : environments.find((e) => e.id === selectedEnvId);

  const handleAddVariable = () => {
    if (!selectedEnv) return;
    const newVars = [
      ...selectedEnv.variables,
      { id: uuidv4(), key: "", value: "", enabled: true },
    ];
    if (selectedEnvId === "globals") {
      updateGlobalVariables(newVars);
    } else {
      updateEnvironment(selectedEnv.id, selectedEnv.name, newVars);
    }
  };

  const handleUpdateVariable = (id: string, field: string, value: any) => {
    if (!selectedEnv) return;
    const newVars = selectedEnv.variables.map((v) =>
      v.id === id ? { ...v, [field]: value } : v
    );
    if (selectedEnvId === "globals") {
      updateGlobalVariables(newVars);
    } else {
      updateEnvironment(selectedEnv.id, selectedEnv.name, newVars);
    }
  };

  const handleDeleteVariable = (id: string) => {
    if (!selectedEnv) return;
    const newVars = selectedEnv.variables.filter((v) => v.id !== id);
    if (selectedEnvId === "globals") {
      updateGlobalVariables(newVars);
    } else {
      updateEnvironment(selectedEnv.id, selectedEnv.name, newVars);
    }
  };

  // DnD kit sensors and handler for reordering variables
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = selectedEnv?.variables.findIndex(
      (v) => v.id === active.id
    );
    const newIndex = selectedEnv?.variables.findIndex((v) => v.id === over.id);
    if (
      selectedEnv &&
      typeof oldIndex === "number" &&
      oldIndex !== -1 &&
      typeof newIndex === "number" &&
      newIndex !== -1
    ) {
      const newVars = arrayMove(selectedEnv.variables, oldIndex, newIndex);
      if (selectedEnvId === "globals") {
        updateGlobalVariables(newVars);
      } else {
        updateEnvironment(selectedEnv.id, selectedEnv.name, newVars);
      }
    }
  };

  function SortableVarRow({ variable }: { variable: any }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: variable.id });
    const style: any = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <TableRow ref={setNodeRef} style={style} key={variable.id}>
        <TableCell>
          <div className="flex items-center gap-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground"
            >
              <GripVerticalIcon size={14} />
            </div>
            <Checkbox
              checked={variable.enabled}
              onCheckedChange={(c) =>
                handleUpdateVariable(variable.id, "enabled", c)
              }
            />
          </div>
        </TableCell>
        <TableCell>
          <Input
            value={variable.key}
            onChange={(e) =>
              handleUpdateVariable(variable.id, "key", e.target.value)
            }
            className="h-8 font-mono text-xs"
            placeholder="VARIABLE_NAME"
          />
        </TableCell>
        <TableCell>
          <Input
            value={variable.value}
            onChange={(e) =>
              handleUpdateVariable(variable.id, "value", e.target.value)
            }
            className="h-8 font-mono text-xs"
            placeholder="Value"
          />
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => handleDeleteVariable(variable.id)}
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings2Icon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col max-h-[60vh] h-full w-full sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Environments</DialogTitle>
        </DialogHeader>
        <div className="flex flex-1 gap-4 min-h-0">
          {/* Sidebar: List of Environments */}
          <div className="border-r pr-4 flex flex-col gap-2">
            <div className="flex items-center justify-between mb-2 gap-4">
              <span className="text-sm font-medium text-muted-foreground">
                Environments
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => addEnvironment("New Environment")}
              >
                <PlusIcon />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-1">
                <div
                  className={`flex items-center justify-between px-2 py-1.5 rounded-md text-sm cursor-pointer ${
                    selectedEnvId === "globals"
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setSelectedEnvId("globals")}
                >
                  <span className="truncate font-medium">Global Variables</span>
                </div>
                <div className="h-px bg-border my-1" />
                {environments.map((env) => (
                  <div
                    key={env.id}
                    className={`group flex items-center justify-between px-2 py-1.5 rounded-md text-sm cursor-pointer ${
                      selectedEnvId === env.id
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedEnvId(env.id)}
                  >
                    <span className="truncate">{env.name}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content: Variables Editor */}
          <div className="flex-1 flex flex-col min-h-0">
            {selectedEnv ? (
              <>
                <div className="flex items-center gap-4 mb-4">
                  {selectedEnvId === "globals" ? (
                    <div className="text-lg font-semibold">
                      Global Variables
                    </div>
                  ) : (
                    <>
                      <Input
                        value={selectedEnv.name}
                        onChange={(e) =>
                          updateEnvironment(
                            selectedEnv.id,
                            e.target.value,
                            selectedEnv.variables
                          )
                        }
                        className="max-w-xs font-semibold"
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Environment?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete the "{selectedEnv.name}"
                              environment and all its variables.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                deleteEnvironment(selectedEnv.id);
                                setSelectedEnvId(null);
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
                <div className="flex-1 border rounded-md overflow-hidden flex flex-col">
                  <div className="bg-muted/50 border-b px-4 py-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      Variables
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAddVariable}
                      className="h-6 text-xs"
                    >
                      <PlusIcon className="h-3 w-3 mr-1" /> Add Variable
                    </Button>
                  </div>
                  <ScrollArea className="flex-1 min-h-0">
                    <div className="p-0 min-h-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[30px]"></TableHead>
                            <TableHead>Variable</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                          >
                            <SortableContext
                              items={selectedEnv.variables.map(
                                (v: any) => v.id
                              )}
                              strategy={verticalListSortingStrategy}
                            >
                              {selectedEnv.variables.map((variable: any) => (
                                <SortableVarRow
                                  key={variable.id}
                                  variable={variable}
                                />
                              ))}
                            </SortableContext>
                          </DndContext>
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select an environment to edit
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
