import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useWorkspaceStore } from "@/features/workspace/stores/workspace-store";

export function useSidebarDnd() {
  const nodes = useWorkspaceStore((state) => state.nodes);
  const rootIds = useWorkspaceStore((state) => state.rootIds);
  const moveNode = useWorkspaceStore((state) => state.moveNode);

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
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeNode = nodes[activeId];
    const overNode = nodes[overId];

    if (!activeNode || !overNode) return;

    // If dropping over a collection/folder or workspace, move INTO it
    if (
      (overNode.type === "collection" || overNode.type === "workspace") &&
      activeId !== overId
    ) {
      // Prevent workspace from being moved into anything
      if (activeNode.type === "workspace") {
        // Fall through to sibling reordering (only allowed if target is root)
      } else {
        const newParentId = overId;
        const newIndex = overNode.children ? overNode.children.length : 0;
        moveNode(activeId, newParentId, newIndex);
        return;
      }
    }

    // Moving relative to overNode (sibling)
    const newParentId = overNode.parentId;

    // Constraint: Workspaces cannot be moved into a non-root parent
    if (activeNode.type === "workspace" && newParentId) {
      return;
    }

    let newIndex = 0;

    if (newParentId) {
      const parent = nodes[newParentId];
      if (parent && parent.children) {
        newIndex = parent.children.indexOf(overId);
      }
    } else {
      newIndex = rootIds.indexOf(overId);
    }

    moveNode(activeId, newParentId, newIndex);
  };

  return { sensors, handleDragEnd };
}
