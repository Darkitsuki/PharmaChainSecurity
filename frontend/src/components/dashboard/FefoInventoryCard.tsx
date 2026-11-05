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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="pb-2.5">Mã &amp; Tên thuốc</th>
                  <th className="pb-2.5">Số Lô</th>
                  <th className="pb-2.5">Tồn kho</th>
                  <th className="pb-2.5">Hạn dùng (FEFO)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayAlerts.map((item) => (
                  <tr key={`${item.drugId}-${item.batchId}`} className="group hover:bg-slate-50/80">
                    <td className="py-3">
                      <p className="font-bold text-slate-900">{item.drugName}</p>
                      <p className="font-mono text-[10px] text-slate-400">{item.drugCode}</p>
                    </td>
                    <td className="py-3 font-mono text-slate-600 font-semibold">{item.batchNo}</td>
                    <td className="py-3">
                      <span className="font-bold text-slate-900">{item.quantity}</span>
                      <span className="ml-1 text-[10px] text-slate-500">đơn vị</span>
                    </td>
                    <td className="py-3">
                      <FefoExpiryBadge expiryDate={item.expiryDate} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
