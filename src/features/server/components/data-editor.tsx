import { useState, useEffect } from "react";
import { Table as TableType } from "../store/server-store";
import Database from "@tauri-apps/plugin-sql";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2Icon,
  MoreHorizontalIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  RefreshCwIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface DataEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableType;
}

export function DataEditor({ open, onOpenChange, table }: DataEditorProps) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const {
    data: queryData,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ["table-data", table.name, page],
    queryFn: async () => {
      const db = await Database.load("sqlite:mock_server.db");

      // Count
      const countResult = await db.select<any[]>(
        `SELECT COUNT(*) as count FROM "${table.name}"`
      );
      const total = countResult[0].count as number;

      // Data
      const offset = (page - 1) * pageSize;
      const result = await db.select<any[]>(
        `SELECT rowid as _rowid_, * FROM "${table.name}" LIMIT ${pageSize} OFFSET ${offset}`
      );

      return {
        data: result,
        meta: {
          pagination: {
            page,
            pageSize,
            pageCount: Math.ceil(total / pageSize),
            total,
          },
        },
      };
    },
    placeholderData: keepPreviousData,
    enabled: open,
  });

  const data = queryData?.data || [];
  const meta = queryData?.meta?.pagination;

  const handleDelete = async (row: any) => {
    try {
      const db = await Database.load("sqlite:mock_server.db");
      await db.execute(`DELETE FROM "${table.name}" WHERE rowid = $1`, [
        row._rowid_,
      ]);
      toast.success("Row deleted");
      refetch();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete row");
    }
  };

  const handleSave = async (values: any) => {
    try {
      const db = await Database.load("sqlite:mock_server.db");
      const columns = table.columns.map((c) => c.name);

      if (editingRow) {
        // Update
        const setClause = columns
          .map((c, i) => `"${c}" = $${i + 1}`)
          .join(", ");
        const params = columns.map((c) => values[c]);

        await db.execute(
          `UPDATE "${table.name}" SET ${setClause} WHERE rowid = $${
            columns.length + 1
          }`,
          [...params, editingRow._rowid_]
        );
        toast.success("Row updated");
      } else {
        // Insert
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
        const params = columns.map((c) => values[c]);

        await db.execute(
          `INSERT INTO "${table.name}" (${columns
            .map((c) => `"${c}"`)
            .join(", ")}) VALUES (${placeholders})`,
          params
        );
        toast.success("Row created");
      }
      setIsFormOpen(false);
      setEditingRow(null);
      refetch();
    } catch (e) {
      console.error(e);
      toast.error("Failed to save row");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl sm:max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between px-8">
              <span>{table.name}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetch()}
                  disabled={loading}
                >
                  <RefreshCwIcon
                    className={`size-4 ${loading ? "animate-spin" : ""}`}
                  />
                </Button>
                <Button
                  onClick={() => {
                    setEditingRow(null);
                    setIsFormOpen(true);
                  }}
                >
                  <PlusIcon className="size-4 mr-2" /> Add Row
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              Manage data for {table.name}. Showing first 100 rows.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 border rounded-md overflow-auto relative">
            <table className="w-full caption-bottom text-sm text-left">
              <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                <TableRow className="hover:bg-transparent">
                  {table.columns.map((col) => (
                    <TableHead key={col.id} className="whitespace-nowrap">
                      {col.name}
                      {col.isPk && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (PK)
                        </span>
                      )}
                    </TableHead>
                  ))}
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={table.columns.length + 1}
                      className="h-24 text-center"
                    >
                      <Loader2Icon className="size-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={table.columns.length + 1}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No data found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row, i) => (
                    <TableRow key={row._rowid_ || i}>
                      {table.columns.map((col) => (
                        <TableCell
                          key={col.id}
                          className="max-w-[200px] truncate"
                        >
                          {String(row[col.name] ?? "NULL")}
                        </TableCell>
                      ))}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontalIcon className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingRow(row);
                                setIsFormOpen(true);
                              }}
                            >
                              <PencilIcon className="size-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(row)}
                            >
                              <Trash2Icon className="size-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </table>
          </div>

          {meta && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={
                        page === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  <PaginationItem>
                    <span className="text-sm text-muted-foreground px-4">
                      Page {meta.page} of {meta.pageCount}
                    </span>
                  </PaginationItem>

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setPage((p) => Math.min(meta.pageCount, p + 1))
                      }
                      className={
                        page === meta.pageCount
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DataFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        table={table}
        initialData={editingRow}
        onSave={handleSave}
      />
    </>
  );
}

function DataFormDialog({
  open,
  onOpenChange,
  table,
  initialData,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableType;
  initialData: any | null;
  onSave: (values: any) => Promise<void>;
}) {
  const [values, setValues] = useState<any>({});

  useEffect(() => {
    if (open) {
      if (initialData) {
        setValues({ ...initialData });
      } else {
        // Initialize defaults
        const defaults: any = {};
        table.columns.forEach((col) => {
          defaults[col.name] = "";
        });
        setValues(defaults);
      }
    }
  }, [open, initialData, table]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Row" : "Add Row"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <ScrollArea className="h-[50vh] border rounded-md p-4">
            <div className="grid gap-4">
              {table.columns.map((col) => (
                <div key={col.id} className="space-y-2">
                  <Label>
                    {col.name}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({col.type})
                    </span>
                  </Label>
                  {col.type === "BOOLEAN" ? (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`field-${col.id}`}
                        checked={!!values[col.name]}
                        onCheckedChange={(checked) =>
                          setValues({ ...values, [col.name]: !!checked })
                        }
                      />
                      <label
                        htmlFor={`field-${col.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        True
                      </label>
                    </div>
                  ) : (
                    <Input
                      value={values[col.name] ?? ""}
                      onChange={(e) =>
                        setValues({ ...values, [col.name]: e.target.value })
                      }
                      placeholder={col.type}
                    />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
