import React from 'react';
import { LoaderCircle, Inbox } from 'lucide-react';
import { PaginationBar, type PaginationBarProps } from './PaginationBar';

export interface Column<T> {
  header: React.ReactNode;
  accessorKey?: keyof T;
  cell?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  loading?: boolean;
  loadingText?: string;
  emptyMessage?: React.ReactNode;
  pagination?: PaginationBarProps;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  loadingText = 'Đang tải dữ liệu...',
  emptyMessage = 'Không có bản ghi nào để hiển thị.',
  pagination,
}: DataTableProps<T>) {
  const getAlignClass = (align?: 'left' | 'center' | 'right') => {
    if (align === 'right') return 'text-right justify-end';
    if (align === 'center') return 'text-center justify-center';
    return 'text-left justify-start';
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-[10.5px] uppercase font-bold tracking-wider text-slate-500">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-5 py-3.5 ${getAlignClass(col.align)} ${col.headerClassName || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="h-44 text-center">
                  <div className="inline-flex flex-col items-center justify-center gap-2 text-slate-400">
                    <LoaderCircle size={24} className="animate-spin text-forest" />
                    <span className="text-xs font-medium text-slate-500">{loadingText}</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="h-44 text-center">
                  <div className="inline-flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Inbox size={28} strokeWidth={1.5} className="text-slate-300" />
                    <span className="text-xs text-slate-500">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, rowIdx) => (
                <tr
                  key={keyExtractor(item, rowIdx)}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`px-5 py-3.5 text-slate-700 ${getAlignClass(col.align)} ${col.className || ''}`}
                    >
                      {col.cell
                        ? col.cell(item, rowIdx)
                        : col.accessorKey
                        ? String(item[col.accessorKey] ?? '')
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && <PaginationBar {...pagination} />}
    </div>
  );
}
