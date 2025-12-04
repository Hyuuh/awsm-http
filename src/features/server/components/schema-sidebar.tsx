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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useServerStore } from "../store/server-store";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PlusIcon,
  Trash2Icon,
  TableIcon,
  ColumnsIcon,
  SaveIcon,
  DicesIcon,
  GripVerticalIcon,
  DatabaseIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FakerPicker } from "./faker-picker";
import { DataEditor } from "./data-editor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Database from "@tauri-apps/plugin-sql";
import { generateInsertSql } from "../lib/sql-generator";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SchemaSidebar({ onSave }: { onSave?: () => void }) {
  const tables = useServerStore((state) => state.tables);
  const activeTableId = useServerStore((state) => state.activeTableId);
  const addTable = useServerStore((state) => state.addTable);
  const setActiveTable = useServerStore((state) => state.setActiveTable);
  const deleteTable = useServerStore((state) => state.deleteTable);
  const updateTable = useServerStore((state) => state.updateTable);
  const reorderTables = useServerStore((state) => state.reorderTables);
  const reorderColumns = useServerStore((state) => state.reorderColumns);

  const activeTable = tables.find((t) => t.id === activeTableId);
  const [tableName, setTableName] = useState("");
  const [tablePath, setTablePath] = useState("");

  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [dataEditorOpen, setDataEditorOpen] = useState(false);
  const [generateCount, setGenerateCount] = useState(10);

  const [tableToDelete, setTableToDelete] = useState<any>(null);
  const [destructiveSaveOpen, setDestructiveSaveOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (activeTable) {
      setTableName(activeTable.name);
      setTablePath(activeTable.path || `/${activeTable.name.toLowerCase()}`);
    }
  }, [activeTable?.id, activeTable?.name, activeTable?.path]);

  const handleSave = async () => {
    if (activeTable) {
      const updates: any = {};
      if (tableName !== activeTable.name) updates.name = tableName;
      if (tablePath !== activeTable.path) updates.path = tablePath;

      if (Object.keys(updates).length > 0) {
        updateTable(activeTable.id, updates);
      }

      try {
        const db = await Database.load("sqlite:mock_server.db");
        // Check if table exists
        const existing = await db.select<any[]>(
          `SELECT name FROM sqlite_master WHERE type='table' AND name = '${activeTable.name}'`
        );

        if (existing.length === 0) {
          onSave?.();
          return;
        }

        // Check columns
        const dbCols = await db.select<any[]>(
          `PRAGMA table_info("${activeTable.name}")`
        );

        let hasChanges = false;
        if (dbCols.length !== activeTable.columns.length) {
          hasChanges = true;
        } else {
          for (const col of activeTable.columns) {
            const dbCol = dbCols.find((c) => c.name === col.name);
            if (!dbCol) {
              hasChanges = true;
              break;
            }
            if (dbCol.type !== col.type) {
              hasChanges = true;
              break;
            }
            if (!!dbCol.pk !== col.isPk) {
              hasChanges = true;
              break;
            }
            if (!!dbCol.notnull !== col.isNotNull) {
              hasChanges = true;
              break;
            }
          }
        }

        if (hasChanges) {
          setDestructiveSaveOpen(true);
        } else {
          onSave?.();
        }
      } catch (e) {
        console.error(e);
        onSave?.();
      }
    }
  };

  const confirmDestructiveSave = async () => {
    if (!activeTable) return;
    try {
      const db = await Database.load("sqlite:mock_server.db");
      await db.execute(`DROP TABLE IF EXISTS "${activeTable.name}"`);
      onSave?.();
      setDestructiveSaveOpen(false);
      toast.success("Table recreated with new schema");
    } catch (e) {
      console.error(e);
      toast.error("Failed to recreate table");
    }
  };

  const handleGenerateData = async () => {
    if (!activeTable) return;
    try {
      const db = await Database.load("sqlite:mock_server.db");
      const inserts = generateInsertSql(activeTable, generateCount);
      for (const sql of inserts) {
        await db.execute(sql);
      }
      toast.success(`Generated ${generateCount} rows for ${activeTable.name}`);
      setGenerateDialogOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate data");
    }
  };

  const handleDragEndTables = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = tables.findIndex((t) => t.id === active.id);
      const newIndex = tables.findIndex((t) => t.id === over?.id);
      reorderTables(oldIndex, newIndex);
    }
  };

  const handleDragEndColumns = (event: DragEndEvent) => {
    const { active, over } = event;
    if (activeTable && active.id !== over?.id) {
      const oldIndex = activeTable.columns.findIndex((c) => c.id === active.id);
      const newIndex = activeTable.columns.findIndex((c) => c.id === over?.id);
      reorderColumns(activeTable.id, oldIndex, newIndex);
    }
  };

  const handleDeleteTable = (table: any) => {
    setTableToDelete(table);
  };

  const confirmDelete = async () => {
    if (!tableToDelete) return;
    try {
      // 1. Drop from DB
      const db = await Database.load("sqlite:mock_server.db");
      await db.execute(`DROP TABLE IF EXISTS "${tableToDelete.name}"`);
      await db.execute(
        `DELETE FROM _awsm_meta WHERE table_name = '${tableToDelete.name}'`
      );

      // 2. Remove from store
      deleteTable(tableToDelete.id);

      // 3. Restart server
      onSave?.();

      toast.success(`Table ${tableToDelete.name} deleted`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete table");
    }
    setTableToDelete(null);
  };

  return (
    <div className="h-full flex flex-col border-r w-xl bg-muted/10">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <TableIcon className="size-4" /> Tables
        </h3>
        <Button size="sm" variant="outline" onClick={addTable}>
          <PlusIcon className="size-3 mr-1" /> Add
        </Button>
      </div>

      <ScrollArea className="h-[200px] border-b shrink-0">
        <div className="p-2 space-y-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEndTables}
          >
            <SortableContext
              items={tables.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {tables.map((table) => (
                <SortableTableItem
                  key={table.id}
                  table={table}
                  activeTableId={activeTableId}
                  setActiveTable={setActiveTable}
                  onDelete={handleDeleteTable}
                />
              ))}
            </SortableContext>
          </DndContext>
          {tables.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-xs">
              No tables created.
            </div>
          )}
        </div>
      </ScrollArea>

      {activeTable ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-4 border-b space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Table Name</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="h-8"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={handleSave}
                  disabled={!activeTable}
                  title="Save Changes"
                >
                  <SaveIcon className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setGenerateDialogOpen(true)}
                  disabled={!activeTable || activeTable.name !== tableName}
                  title="Generate Fake Data"
                >
                  <DicesIcon className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setDataEditorOpen(true)}
                  disabled={!activeTable || activeTable.name !== tableName}
                  title="Manage Data"
                >
                  <DatabaseIcon className="size-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">API Path</Label>
              <Input
                value={tablePath}
                onChange={(e) => setTablePath(e.target.value)}
                className="h-8 font-mono text-xs"
                placeholder={`/${activeTable.name.toLowerCase()}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
              />
            </div>
          </div>
          <div className="p-2 border-b bg-muted/20 flex items-center justify-between">
            <span className="text-xs font-medium flex items-center gap-2">
              <ColumnsIcon className="size-3" /> Columns
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs"
              onClick={() =>
                useServerStore.getState().addColumn(activeTable.id)
              }
            >
              <PlusIcon className="size-3 mr-1" /> Add Column
            </Button>
          </div>
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-2">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEndColumns}
                >
                  <SortableContext
                    items={activeTable.columns.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {activeTable.columns.map((col) => (
                      <SortableColumnItem
                        key={col.id}
                        tableId={activeTable.id}
                        column={col}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </ScrollArea>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-4 text-center">
          Select a table to edit its columns
        </div>
      )}

      {activeTable && (
        <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">
                Generate Data
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Generate fake data for the table{" "}
                <span className="font-medium">{activeTable.name}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Rows to Generate</Label>
                  <Input
                    type="number"
                    value={generateCount}
                    onChange={(e) => setGenerateCount(+e.target.value)}
                    className="h-8 w-full"
                    min={1}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setGenerateDialogOpen(false)}
                className="w-[100px]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateData}
                className="w-[100px]"
                disabled={generateCount < 1}
              >
                Generate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {tableToDelete && (
        <AlertDialog
          open={!!tableToDelete}
          onOpenChange={(open) => {
            if (!open) setTableToDelete(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-sm font-semibold">
                Confirm Delete
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground">
                Are you sure you want to delete the table{" "}
                <span className="font-medium">{tableToDelete.name}</span>? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button
                variant="outline"
                onClick={() => setTableToDelete(null)}
                className="w-[100px]"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="w-[100px]"
                variant="destructive"
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <AlertDialog
        open={destructiveSaveOpen}
        onOpenChange={setDestructiveSaveOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold">
              Schema Changed
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              The table schema has changed. To apply these changes, the table
              must be dropped and recreated.{" "}
              <span className="font-bold text-red-500">
                All existing data in this table will be lost.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setDestructiveSaveOpen(false)}
              className="w-[100px]"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDestructiveSave}
              className="w-[100px]"
              variant="destructive"
            >
              Recreate
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {activeTable && (
        <DataEditor
          open={dataEditorOpen}
          onOpenChange={setDataEditorOpen}
          table={activeTable}
        />
      )}
    </div>
  );
}

function SortableTableItem({
  table,
  activeTableId,
  setActiveTable,
  onDelete,
}: {
  table: any;
  activeTableId: string | null;
  setActiveTable: (id: string) => void;
  onDelete: (table: any) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: table.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-2 rounded-md cursor-pointer text-sm hover:bg-muted/50 transition-colors group",
        activeTableId === table.id && "bg-muted font-medium"
      )}
      onClick={() => setActiveTable(table.id)}
    >
      <div className="flex items-center gap-2 truncate">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVerticalIcon className="size-3 text-muted-foreground" />
        </div>
        <TableIcon className="size-3 text-muted-foreground" />
        <span>{table.name}</span>
      </div>
      {activeTableId === table.id && (
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-muted-foreground hover:text-red-500"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(table);
          }}
        >
          <Trash2Icon className="size-3" />
        </Button>
      )}
    </div>
  );
}

function SortableColumnItem({
  tableId,
  column,
}: {
  tableId: string;
  column: any;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-4 z-10 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVerticalIcon className="size-3 text-muted-foreground" />
      </div>
      <div className="pl-4">
        <ColumnEditor tableId={tableId} column={column} />
      </div>
    </div>
  );
}

function ColumnEditor({ tableId, column }: { tableId: string; column: any }) {
  const updateColumn = useServerStore((state) => state.updateColumn);
  const deleteColumn = useServerStore((state) => state.deleteColumn);

  return (
    <div className="border rounded-md p-3 space-y-3 bg-background">
      <div className="flex items-center gap-2">
        <Input
          value={column.name}
          onChange={(e) =>
            updateColumn(tableId, column.id, { name: e.target.value })
          }
          className="h-7 text-xs font-mono flex-1"
          placeholder="col_name"
        />
        <Select
          value={column.type}
          onValueChange={(v: any) =>
            updateColumn(tableId, column.id, { type: v })
          }
        >
          <SelectTrigger className="h-7 w-[90px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INTEGER">INT</SelectItem>
            <SelectItem value="TEXT">TEXT</SelectItem>
            <SelectItem value="REAL">REAL</SelectItem>
            <SelectItem value="BOOLEAN">BOOL</SelectItem>
            <SelectItem value="BLOB">BLOB</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-red-500"
          onClick={() => deleteColumn(tableId, column.id)}
        >
          <Trash2Icon className="size-3" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`pk-${column.id}`}
            checked={column.isPk}
            onCheckedChange={(c) =>
              updateColumn(tableId, column.id, { isPk: !!c })
            }
          />
          <label
            htmlFor={`pk-${column.id}`}
            className="text-[10px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            PK
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`nn-${column.id}`}
            checked={column.isNotNull}
            onCheckedChange={(c) =>
              updateColumn(tableId, column.id, { isNotNull: !!c })
            }
          />
          <label
            htmlFor={`nn-${column.id}`}
            className="text-[10px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Not Null
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`uq-${column.id}`}
            checked={column.isUnique}
            onCheckedChange={(c) =>
              updateColumn(tableId, column.id, { isUnique: !!c })
            }
          />
          <label
            htmlFor={`uq-${column.id}`}
            className="text-[10px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Unique
          </label>
        </div>
      </div>

      <div className="space-y-2 pt-1 border-t">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">
              Default (Faker)
            </Label>
            <FakerPicker
              value={column.fakerExpression}
              onChange={(val) =>
                updateColumn(tableId, column.id, { fakerExpression: val })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Foreign Key</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size={"sm"} className="bg-primary/50">
                  Select FK
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Coming soon</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
