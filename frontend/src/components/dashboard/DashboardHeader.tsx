import React from 'react';
import { RefreshCw, FileSpreadsheet } from 'lucide-react';
import { PageHeader } from '../common/PageHeader';

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
  days,
  onDaysChange,
  onRefresh,
  onExport,
  loading = false,
}) => {
  return (
    <div className="space-y-3">
      <PageHeader title="Tổng quan chi nhánh" />
      <section className="flex flex-col gap-3 rounded-xl border border-line bg-white p-3 shadow-2xs sm:p-4 lg:flex-row lg:items-center lg:justify-between" aria-label="Bộ lọc báo cáo tổng quan">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Phạm vi báo cáo</p>
          <p className="mt-1 truncate text-sm font-semibold text-ink">{branchName || 'Chi nhánh đang làm việc'}</p>
          <p className="mt-0.5 text-xs text-slate-500">Doanh thu và hóa đơn thay đổi theo kỳ; tồn kho và đơn chờ duyệt là dữ liệu hiện tại.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-xs font-semibold text-slate-500">Kỳ báo cáo</span>
            <div className="inline-flex flex-1 rounded-lg border border-slate-200 bg-slate-50 p-1 sm:flex-none" role="group" aria-label="Chọn kỳ báo cáo">
          {[
            { label: 'Hôm nay', value: 1 },
            { label: '7 ngày', value: 7 },
            { label: '30 ngày', value: 30 },
          ].map((period) => (
            <button
              key={period.value}
              type="button"
              onClick={() => onDaysChange(period.value)}
              disabled={loading}
              aria-pressed={days === period.value}
              className={`min-h-9 flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors sm:flex-none ${
                days === period.value
                  ? 'bg-forest text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              } disabled:cursor-wait disabled:opacity-60`}
            >
              {period.label}
            </button>
          ))}
            </div>
        </div>
          <div className="flex items-center gap-2 sm:border-l sm:border-line sm:pl-2">
            <button type="button" onClick={onRefresh} disabled={loading} aria-label="Làm mới dữ liệu tổng quan" className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-wait disabled:opacity-60 sm:flex-none">
              <RefreshCw size={16} aria-hidden="true" className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Đang tải' : 'Làm mới'}</span>
            </button>
            <button type="button" onClick={onExport} disabled={loading} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none">
              <FileSpreadsheet size={16} aria-hidden="true" /><span>Xuất CSV</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
