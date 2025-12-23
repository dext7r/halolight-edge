import * as React from "react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

export interface Column<T> {
  key: string;
  title: string;
  sortable?: boolean;
  width?: string | number;
  className?: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: keyof T | ((record: T) => string);
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  defaultSort?: { key: string; order: 'asc' | 'desc' };
  onSort?: (key: string, order: 'asc' | 'desc') => void;
  emptyText?: string;
  className?: string;
  rowClassName?: string | ((record: T, index: number) => string);
  onRowClick?: (record: T, index: number) => void;
}

type SortOrder = 'asc' | 'desc' | null;

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  loading = false,
  pagination,
  defaultSort,
  onSort,
  emptyText = "暂无数据",
  className,
  rowClassName,
  onRowClick,
}: DataTableProps<T>) {
  const [sortState, setSortState] = useState<{ key: string; order: SortOrder }>({
    key: defaultSort?.key || '',
    order: defaultSort?.order || null,
  });

  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return String(record[rowKey] ?? index);
  };

  const handleSort = (key: string) => {
    let newOrder: SortOrder = 'asc';
    if (sortState.key === key) {
      if (sortState.order === 'asc') {
        newOrder = 'desc';
      } else if (sortState.order === 'desc') {
        newOrder = null;
      }
    }

    setSortState({ key: newOrder ? key : '', order: newOrder });
    if (onSort && newOrder) {
      onSort(key, newOrder);
    }
  };

  const sortedData = useMemo(() => {
    if (!sortState.key || !sortState.order || onSort) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aVal = a[sortState.key];
      const bVal = b[sortState.key];
      
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortState.order === 'asc' ? comparison : -comparison;
    });
  }, [data, sortState, onSort]);

  const renderSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;

    const isSorted = sortState.key === column.key;
    
    return (
      <span className="ml-1 inline-flex">
        {!isSorted && <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />}
        {isSorted && sortState.order === 'asc' && <ChevronUp className="h-4 w-4 text-primary" />}
        {isSorted && sortState.order === 'desc' && <ChevronDown className="h-4 w-4 text-primary" />}
      </span>
    );
  };

  const pageSizes = [10, 20, 50, 100];
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 0;

  const handlePageChange = (page: number) => {
    if (pagination) {
      pagination.onChange(page, pagination.pageSize);
    }
  };

  const handlePageSizeChange = (size: string) => {
    if (pagination) {
      pagination.onChange(1, parseInt(size));
    }
  };

  return (
    <div className={cn("rounded-lg border border-border/50 overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-left font-medium text-foreground",
                    column.sortable && "cursor-pointer select-none hover:bg-muted/50 transition-colors",
                    column.className
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.title}
                    {renderSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <tr key="loading">
                  <td colSpan={columns.length} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr key="empty">
                  <td colSpan={columns.length} className="text-center py-12 text-muted-foreground">
                    {emptyText}
                  </td>
                </tr>
              ) : (
                sortedData.map((record, index) => {
                  const key = getRowKey(record, index);
                  const rowClass = typeof rowClassName === 'function' 
                    ? rowClassName(record, index) 
                    : rowClassName;

                  return (
                    <motion.tr
                      key={key}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.02, duration: 0.15 }}
                      className={cn(
                        "hover:bg-muted/50 transition-colors",
                        onRowClick && "cursor-pointer",
                        rowClass
                      )}
                      onClick={() => onRowClick?.(record, index)}
                    >
                      {columns.map((column) => (
                        <td key={column.key} className={cn("px-4 py-3", column.className)}>
                          {column.render
                            ? column.render(record[column.key], record, index)
                            : record[column.key]}
                        </td>
                      ))}
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border/50 bg-muted/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>共 {pagination.total} 条</span>
            <span className="hidden sm:inline">·</span>
            <div className="hidden sm:flex items-center gap-2">
              <span>每页</span>
              <Select value={String(pagination.pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizes.map((size) => (
                    <SelectItem key={size} value={String(size)}>{size} 条</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={pagination.current <= 1}
              onClick={() => handlePageChange(pagination.current - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (pagination.current <= 3) {
                  page = i + 1;
                } else if (pagination.current >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = pagination.current - 2 + i;
                }

                if (page < 1 || page > totalPages) return null;

                return (
                  <Button
                    key={page}
                    variant={pagination.current === page ? "default" : "outline"}
                    size="icon"
                    className={cn(
                      "h-8 w-8",
                      pagination.current === page && "pointer-events-none"
                    )}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={pagination.current >= totalPages}
              onClick={() => handlePageChange(pagination.current + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
