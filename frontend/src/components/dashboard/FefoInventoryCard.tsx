import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { InventoryAlert } from '../../types';
import { FefoExpiryBadge } from '../common/FefoExpiryBadge';

export interface FefoInventoryCardProps {
  alerts: InventoryAlert[];
  loading?: boolean;
}

export const FefoInventoryCard: React.FC<FefoInventoryCardProps> = ({
  alerts = [],
  loading = false,
}) => {
  const displayAlerts = alerts.slice(0, 5);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-700">
            <AlertTriangle size={18} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              Kiểm soát Lô cận hạn (FEFO)
            </h2>
            <p className="text-xs text-slate-500">
              Xuất trước thuốc hết hạn trước — Ngăn ngừa rủi ro tồn kho hư hao
            </p>
          </div>
        </div>
        <Link
          to="/inventory"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
        >
          <span>Xem tất cả kho</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Đang quét dữ liệu lô cận hạn...</div>
        ) : displayAlerts.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Tuyệt vời! Không có lô thuốc nào cận hạn dưới 90 ngày trong chi nhánh.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayAlerts.map((item) => (
              <div key={`${item.drugId}-${item.batchId}`} className="grid gap-2 py-3 text-xs transition-colors hover:bg-slate-50/80 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] sm:items-center sm:gap-x-4">
                <div className="min-w-0"><p className="font-bold text-slate-900">{item.drugName}</p><p className="mt-1 truncate font-mono text-slate-500" title={item.batchNo}>Lô {item.batchNo}</p></div>
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 sm:justify-end"><span className="whitespace-nowrap text-slate-500"><strong className="text-slate-900">{item.quantity}</strong> đơn vị</span><FefoExpiryBadge expiryDate={item.expiryDate} size="sm" /></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
