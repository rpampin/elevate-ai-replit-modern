import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { PaginationControls } from "@/components/ui/pagination-controls";

interface Column<T> {
  key: keyof T | string;
  title: string;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  onFilter?: () => void;
  onExport?: () => void;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  // Pagination props
  currentPage?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  paginationLabel?: string;
  showPaginationDivider?: boolean;
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder,
  onSearch,
  onFilter,
  onExport,
  onRowClick,
  isLoading = false,
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  paginationLabel,
  showPaginationDivider = true,
}: DataTableProps<T>) {
  const [searchValue, setSearchValue] = useState("");
  const { t } = useLanguage();

  // Debounced search function
  const debouncedSearch = useCallback(
    (value: string) => {
      const timeoutId = setTimeout(() => {
        onSearch?.(value);
      }, 300); // 300ms delay

      return () => clearTimeout(timeoutId);
    },
    [onSearch]
  );

  useEffect(() => {
    const cleanup = debouncedSearch(searchValue);
    return cleanup;
  }, [searchValue, debouncedSearch]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {data.length} {t("results")}
          </h3>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Input
                type="text"
                placeholder={searchPlaceholder || t("search") + "..."}
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 w-64"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
            {onFilter && (
              <Button variant="ghost" size="sm" onClick={onFilter}>
                <Filter className="h-4 w-4" />
              </Button>
            )}
            {onExport && (
              <Button variant="ghost" size="sm" onClick={onExport}>
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.key as string}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  No data available
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr 
                  key={index} 
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => {
                      const value = item[column.key];
                      const displayValue = column.render
                          ? column.render(value, item)
                          : String(value != null ? value : "");

                      return (
                          <td key={column.key as string} className="px-6 py-4 whitespace-nowrap">
                              {displayValue}
                          </td>
                      );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {currentPage && pageSize && totalItems !== undefined && onPageChange && onPageSizeChange && (
        <div className={`px-6 py-4 ${showPaginationDivider ? 'border-t border-gray-200 dark:border-gray-700' : ''}`}>
          <PaginationControls
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            label={paginationLabel || "items"}
          />
        </div>
      )}
    </div>
  );
}