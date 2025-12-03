import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { VariableInput } from "@/components/variable-input";
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
import { GripVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react";

export const KeyValueTable = React.memo(function KeyValueTable({
  items,
  onUpdate,
  onAdd,
  onRemove,
  onReorder,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
}: {
  items: {
    id: string;
    key: string;
    value: string;
    enabled: boolean;
    description?: string;
  }[];
  onUpdate: (id: string, field: string, value: any) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onReorder?: (newItems: any[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Key / Value List
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAdd}
          className="h-6 text-xs"
        >
          <PlusIcon size={12} className="mr-1" /> Add
        </Button>
      </div>
      <div className="space-y-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {items.map((item) => (
              <SortableRow
                key={item.id}
                item={item}
                onUpdate={onUpdate}
                onRemove={onRemove}
                keyPlaceholder={keyPlaceholder}
                valuePlaceholder={valuePlaceholder}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-md bg-muted/5">
          No items.{" "}
          <span
            className="text-primary cursor-pointer hover:underline"
            onClick={onAdd}
          >
            Add one
          </span>
        </div>
      )}
    </div>
  );
});

const SortableRow = React.memo(function SortableRow({
  item,
  onUpdate,
  onRemove,
  keyPlaceholder,
  valuePlaceholder,
}: {
  item: {
    id: string;
    key: string;
    value: string;
    enabled: boolean;
    description?: string;
  };
  onUpdate: (id: string, field: string, value: any) => void;
  onRemove: (id: string) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 group"
    >
      <div
        {...attributes}
        {...listeners}
        className="mt-2.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVerticalIcon size={14} />
      </div>
      <Checkbox
        checked={item.enabled}
        onCheckedChange={(c) => onUpdate(item.id, "enabled", c)}
        className="mt-2.5"
      />
      <div className="flex-1 grid grid-cols-2 gap-2">
        <VariableInput
          placeholder={keyPlaceholder}
          value={item.key}
          onChange={(e) => onUpdate(item.id, "key", e.target.value)}
          className="h-8 text-sm font-mono"
        />
        <VariableInput
          placeholder={valuePlaceholder}
          value={item.value}
          onChange={(e) => onUpdate(item.id, "value", e.target.value)}
          className="h-8 text-sm font-mono"
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onRemove(item.id)}
      >
        <Trash2Icon
          size={14}
          className="text-muted-foreground hover:text-red-500"
        />
      </Button>
    </div>
  );
});
