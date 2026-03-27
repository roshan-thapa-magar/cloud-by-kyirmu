"use client";

import { useState, useMemo, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Export the interface
export interface ColumnDefinition<T> {
  id: string;
  name: string;
  align?: "center" | "left" | "right";
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T extends Record<string, any>> {
  data: T[];
  columns: ColumnDefinition<T>[];
  initialColumnVisibility: Record<string, boolean>;
  searchPlaceholder: string;
  addLabel?: string;
  onAddClick: () => void;
  searchKey: keyof T;
  loading?: boolean; // <- add this
  pagination?: {
    currentPage: number;
    rowsPerPage: number;
    totalCount: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (limit: number) => void;
  };
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  initialColumnVisibility,
  searchPlaceholder,
  addLabel,
  onAddClick,
  searchKey,
  pagination,
  loading // Add this if needed
}: DataTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(initialColumnVisibility);
  const [searchTerm, setSearchTerm] = useState("");

  // Remove local pagination state
  // const [currentPage, setCurrentPage] = useState(1);
  // const [rowsPerPage, setRowsPerPage] = useState(10);

  // Use the pagination prop values
  const currentPage = pagination?.currentPage || 1;
  const rowsPerPage = pagination?.rowsPerPage || 10;
  const totalCount = pagination?.totalCount || data.length;

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((item) =>
      String(item[searchKey]).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm, searchKey]);

  // Calculate total pages based on totalCount
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  
  // For client-side search, we need to filter and then paginate
  // But since we're using server-side pagination, we should handle search differently
  const displayData = useMemo(() => {
    if (searchTerm) {
      // If search term exists, filter client-side
      return filteredData.slice(0, rowsPerPage);
    }
    return data;
  }, [data, filteredData, searchTerm, rowsPerPage]);

  const startIndex = (currentPage - 1) * rowsPerPage;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set(displayData.map((_, index) => index));
      setSelectedRows(newSelected);
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (rowIndex: number, checked: boolean) => {
    setSelectedRows((prev) => {
      const newSelected = new Set(prev);
      if (checked) newSelected.add(rowIndex);
      else newSelected.delete(rowIndex);
      return newSelected;
    });
  };

  const handleColumnVisibilityChange = (columnId: string, checked: boolean) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: checked,
    }));
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    if (pagination?.onPageChange) {
      pagination.onPageChange(1); // Reset to first page on search
    }
  };

  const allRowsSelected = displayData.length > 0 && 
    displayData.every((_, index) => selectedRows.has(index));
  const someRowsSelected = displayData.length > 0 && 
    displayData.some((_, index) => selectedRows.has(index)) && !allRowsSelected;

  return (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="flex-shrink-0 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-1/2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              className="pl-8 pr-4 py-2 h-10 w-full rounded-md"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 px-4 bg-transparent">
                  <Settings2 className="w-4 h-4 mr-2" />
                  Customize Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {columns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={columnVisibility[column.id]}
                    onCheckedChange={(checked) =>
                      handleColumnVisibilityChange(column.id, checked)
                    }
                  >
                    {column.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {addLabel && onAddClick && (
              <Button
                variant="outline"
                className="h-10 px-4"
                onClick={onAddClick}
              >
                <Plus className="w-4 h-4 mr-2" />
                {addLabel}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 overflow-auto px-4 hide-scrollbar">
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={allRowsSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    className="translate-y-[2px]"
                  />
                </TableHead>
                <TableHead className="w-[50px] text-center">SN</TableHead>
                {columns
                  .filter((col) => columnVisibility[col.id])
                  .map((column) => (
                    <TableHead
                      key={column.id}
                      className={column.align === "center" ? "text-center" : ""}
                    >
                      {column.name}
                    </TableHead>
                  ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.filter(col => columnVisibility[col.id]).length + 2} className="text-center py-4">
                    No Data found
                  </TableCell>
                </TableRow>
              ) : (
                displayData.map((item, index) => {
                  return (
                    <TableRow key={item._id || index}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.has(index)}
                          onCheckedChange={(checked) =>
                            handleSelectRow(index, checked as boolean)
                          }
                          aria-label={`Select row ${index + 1}`}
                          className="translate-y-[2px]"
                        />
                      </TableCell>
                      <TableCell className="text-center">{startIndex + index + 1}</TableCell>
                      {columns
                        .filter((col) => columnVisibility[col.id])
                        .map((column) => (
                          <TableCell
                            key={column.id}
                            className={column.align === "center" ? "text-center" : ""}
                          >
                            {column.render ? column.render(item) : item[column.id]}
                          </TableCell>
                        ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer Section */}
      <div className="flex-shrink-0 border-t bg-background p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm">
            {selectedRows.size} of {totalCount} row(s) selected.
          </div>

          <div className="flex items-center gap-6">
            {/* Rows per page */}
            <div className="flex items-center gap-2">
              <span className="text-sm">Rows per page</span>
              <Select
                value={String(rowsPerPage)}
                onValueChange={(value) => {
                  if (pagination?.onRowsPerPageChange) {
                    pagination.onRowsPerPageChange(Number(value));
                  }
                }}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Page info */}
            <div className="text-sm">
              Page {currentPage} of {totalPages}
            </div>

            {/* Pagination buttons */}
            <div className="flex items-center gap-2">
              {/* First */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-transparent"
                onClick={() => pagination?.onPageChange(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>

              {/* Prev */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-transparent"
                onClick={() => pagination?.onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Next */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-transparent"
                onClick={() => pagination?.onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Last */}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-transparent"
                onClick={() => pagination?.onPageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}