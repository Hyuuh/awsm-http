import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { NodeChange } from "@xyflow/react";

export type ColumnType = "INTEGER" | "TEXT" | "REAL" | "BLOB" | "BOOLEAN";

export interface Column {
  id: string;
  name: string;
  type: ColumnType;
  isPk: boolean;
  isNotNull: boolean;
  isUnique: boolean;
  defaultValue?: string;
  fakerExpression?: string;
  fkTargetTableId?: string; // If it's a FK
  fkTargetColumnId?: string;
}

export interface Table {
  id: string;
  name: string;
  path?: string;
  columns: Column[];
  position: { x: number; y: number };
}

interface ServerState {
  tables: Table[];
  activeTableId: string | null;
  isRunning: boolean;
  isProvisioning: boolean;

  // Actions
  setTables: (tables: Table[]) => void;
  setIsRunning: (isRunning: boolean) => void;
  setIsProvisioning: (isProvisioning: boolean) => void;
  addTable: () => void;
  updateTable: (id: string, data: Partial<Table>) => void;
  deleteTable: (id: string) => void;
  setActiveTable: (id: string | null) => void;

  addColumn: (tableId: string) => void;
  updateColumn: (
    tableId: string,
    columnId: string,
    data: Partial<Column>
  ) => void;
  deleteColumn: (tableId: string, columnId: string) => void;

  // React Flow specific
  onNodesChange: (changes: NodeChange[]) => void;
  updateTablePosition: (id: string, position: { x: number; y: number }) => void;

  reorderTables: (oldIndex: number, newIndex: number) => void;
  reorderColumns: (tableId: string, oldIndex: number, newIndex: number) => void;
}

export const useServerStore = create<ServerState>((set, get) => ({
  tables: [],
  activeTableId: null,
  isRunning: false,
  isProvisioning: false,

  setTables: (tables) => set({ tables }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setIsProvisioning: (isProvisioning) => set({ isProvisioning }),

  addTable: () => {
    const id = uuidv4();
    const newTable: Table = {
      id,
      name: `Table_${get().tables.length + 1}`,
      columns: [
        {
          id: uuidv4(),
          name: "id",
          type: "INTEGER",
          isPk: true,
          isNotNull: true,
          isUnique: true,
        },
      ],
      position: { x: 100, y: 100 + get().tables.length * 50 },
    };
    set((state) => ({
      tables: [...state.tables, newTable],
      activeTableId: id,
    }));
  },

  updateTable: (id, data) => {
    set((state) => ({
      tables: state.tables.map((t) => (t.id === id ? { ...t, ...data } : t)),
    }));
  },

  deleteTable: (id) => {
    set((state) => ({
      tables: state.tables.filter((t) => t.id !== id),
      activeTableId: state.activeTableId === id ? null : state.activeTableId,
    }));
  },

  setActiveTable: (id) => set({ activeTableId: id }),

  reorderTables: (oldIndex, newIndex) => {
    set((state) => {
      const newTables = [...state.tables];
      const [moved] = newTables.splice(oldIndex, 1);
      newTables.splice(newIndex, 0, moved);
      return { tables: newTables };
    });
  },

  reorderColumns: (tableId, oldIndex, newIndex) => {
    set((state) => ({
      tables: state.tables.map((t) => {
        if (t.id !== tableId) return t;
        const newCols = [...t.columns];
        const [moved] = newCols.splice(oldIndex, 1);
        newCols.splice(newIndex, 0, moved);
        return { ...t, columns: newCols };
      }),
    }));
  },

  addColumn: (tableId) => {
    set((state) => ({
      tables: state.tables.map((t) => {
        if (t.id !== tableId) return t;
        return {
          ...t,
          columns: [
            ...t.columns,
            {
              id: uuidv4(),
              name: `col_${t.columns.length + 1}`,
              type: "TEXT",
              isPk: false,
              isNotNull: false,
              isUnique: false,
            },
          ],
        };
      }),
    }));
  },

  updateColumn: (tableId, columnId, data) => {
    set((state) => ({
      tables: state.tables.map((t) => {
        if (t.id !== tableId) return t;
        return {
          ...t,
          columns: t.columns.map((c) =>
            c.id === columnId ? { ...c, ...data } : c
          ),
        };
      }),
    }));
  },

  deleteColumn: (tableId, columnId) => {
    set((state) => ({
      tables: state.tables.map((t) => {
        if (t.id !== tableId) return t;
        return {
          ...t,
          columns: t.columns.filter((c) => c.id !== columnId),
        };
      }),
    }));
  },

  onNodesChange: (changes) => {
    // This is a bit tricky because we store tables, not nodes directly.
    // We'll sync position changes back to tables.
    changes.forEach((change) => {
      if (change.type === "position" && change.position) {
        get().updateTablePosition(change.id, change.position);
      }
    });
  },

  updateTablePosition: (id, position) => {
    set((state) => ({
      tables: state.tables.map((t) => (t.id === id ? { ...t, position } : t)),
    }));
  },
}));
