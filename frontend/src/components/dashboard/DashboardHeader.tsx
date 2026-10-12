import React from 'react';
import { RefreshCw, FileSpreadsheet } from 'lucide-react';
import { BranchScopeBadge } from '../common/BranchScopeBadge';

export interface DashboardHeaderProps {
  branchName?: string;
  branchId?: string;
  days: number;
  onDaysChange: (days: number) => void;
  onRefresh: () => void;
  onExport: () => void;
  loading?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  branchName,
  branchId,
  days,
  onDaysChange,
  onRefresh,
  onExport,
  loading = false,
}) => {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Tổng quan chi nhánh
          </h1>
          <BranchScopeBadge branchName={branchName} branchId={branchId} />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Trung tâm điều hành kinh doanh, an toàn kho vận &amp; giám sát pháp lý hóa đơn điện tử HSM
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
        {/* Time period selector */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-2xs">
          {[
            { label: 'Hôm nay', value: 1 },
            { label: '7 ngày', value: 7 },
            { label: '30 ngày', value: 30 },
          ].map((period) => (
            <button
              key={period.value}
              type="button"
              onClick={() => onDaysChange(period.value)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                days === period.value
                  ? 'bg-forest text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          title="Làm mới dữ liệu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>

        {/* Export Excel button */}
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-600 bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-emerald-700 active:scale-98"
        >
          <FileSpreadsheet size={15} />
          <span>Xuất Excel (.XLSX)</span>
        </button>
      </div>
    </div>
  );
};
