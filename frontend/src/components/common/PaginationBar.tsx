import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationBarProps {
  page: number;
  totalPages: number;
  totalCount?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  page,
  totalPages,
  totalCount,
  onPageChange,
  itemLabel = 'bản ghi',
}) => {
  if (totalPages <= 1 && (totalCount === undefined || totalCount === 0)) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-5 py-3 bg-slate-50/50 text-xs text-slate-500">
      <div>
        {totalCount !== undefined && (
          <p>
            Tổng cộng: <strong className="font-semibold text-slate-700">{totalCount.toLocaleString('vi-VN')}</strong> {itemLabel}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <span className="font-medium text-slate-600">
          Trang <strong className="text-ink">{page}</strong> / {Math.max(totalPages, 1)}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Trang trước"
            aria-label="Trang trước"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Trang tiếp theo"
            aria-label="Trang tiếp theo"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
