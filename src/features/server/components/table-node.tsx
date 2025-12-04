import { memo } from "react";
import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { Table } from "../store/server-store";
import { cn } from "@/lib/utils";
import {
  KeyIcon,
  FingerprintIcon,
  LinkIcon,
  GripVerticalIcon,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useServerStore } from "../store/server-store";

// Define the custom node type
// We intersect with Record<string, unknown> to satisfy React Flow's constraint
type TableNodeType = Node<Table & Record<string, unknown>, "table">;

const SortableColumnRow = ({ col }: { col: any }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: col.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : "auto",
    position: "relative" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative px-3 py-1.5 text-xs flex items-center justify-between hover:bg-muted/50 group bg-card",
        isDragging && "opacity-50"
      )}
    >
      {/* Target Handle (Left) - For incoming FKs (this column is a PK) */}
      <Handle
        type="target"
        position={Position.Left}
        id={`target-${col.id}`}
        className="w-1! h-1! bg-transparent! border-none! -ml-3 opacity-0"
      />

      <div className="flex items-center gap-2 overflow-hidden">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
          onPointerDown={(e) => {
            e.stopPropagation();
            listeners?.onPointerDown?.(e);
          }}
        >
          <GripVerticalIcon className="size-3 text-muted-foreground" />
        </div>
        <div className="w-4 flex justify-center shrink-0">
          {col.isPk && <KeyIcon className="size-3 text-yellow-500" />}
          {col.fkTargetTableId && <LinkIcon className="size-3 text-blue-500" />}
        </div>
        <span className={cn("font-mono truncate", col.isPk && "font-bold")}>
          {col.name}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] text-muted-foreground">{col.type}</span>
        {col.isUnique && !col.isPk && (
          <FingerprintIcon className="size-3 text-green-500" />
        )}
      </div>

      {/* Source Handle (Right) - For outgoing FKs (this column points to another) */}
      <Handle
        type="source"
        position={Position.Right}
        id={`source-${col.id}`}
        className="w-1! h-1! bg-transparent! border-none! -mr-3 opacity-0"
      />
    </div>
  );
};

export const TableNode = memo(
  ({ id, data, selected }: NodeProps<TableNodeType>) => {
    const reorderColumns = useServerStore((state) => state.reorderColumns);

    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 5,
        },
      })
    );

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (active.id !== over?.id) {
        const oldIndex = data.columns.findIndex((c) => c.id === active.id);
        const newIndex = data.columns.findIndex((c) => c.id === over?.id);
        reorderColumns(id, oldIndex, newIndex);
      }
    };

    return (
      <div
        className={cn(
          "min-w-[200px] bg-card border rounded-md shadow-sm transition-all",
          selected
            ? "border-primary ring-1 ring-primary shadow-md"
            : "border-border"
        )}
      >
        <div className="px-3 py-2 border-b bg-muted/30 font-medium text-sm flex items-center justify-between drag-handle">
          <span>{data.name}</span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {data.columns.length} cols
          </span>
        </div>

        <div className="py-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={data.columns.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {data.columns.map((col) => (
                <SortableColumnRow key={col.id} col={col} />
              ))}
            </SortableContext>
          </DndContext>

          {data.columns.length === 0 && (
            <div className="px-3 py-2 text-[10px] text-muted-foreground italic text-center">
              No columns
            </div>
          )}
        </div>
      </div>
    );
  }
);
