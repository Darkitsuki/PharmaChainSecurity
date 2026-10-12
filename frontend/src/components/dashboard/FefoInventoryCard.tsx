import React from 'react';
import { AlertTriangle, ArrowRight, ShieldBan, RotateCcw, Zap } from 'lucide-react';
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
  const [actionNotice, setActionNotice] = React.useState<string | null>(null);

  const handleAction = (type: string, batchNo: string, drugName: string) => {
    let msg = '';
    if (type === 'fefo') msg = `Đã gắn nhãn ưu tiên FEFO tại quầy POS cho lô ${batchNo} (${drugName}).`;
    if (type === 'return') msg = `Đã lập yêu cầu đổi trả nhà cung cấp cho lô ${batchNo}.`;
    if (type === 'dispose') msg = `Đã khóa lô ${batchNo} để lập hội đồng tiêu hủy thuốc hết hạn.`;
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

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

      {actionNotice && (
        <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800 font-medium">
          ✓ {actionNotice}
        </div>
      )}

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
                  <th className="pb-2.5 text-right">Tác vụ của Chủ</th>
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
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAction('fefo', item.batchNo, item.drugName)}
                          title="Ưu tiên đẩy bán tại quầy thu ngân"
                          className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors"
                        >
                          <Zap size={11} />
                          <span>Ưu tiên POS</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction('return', item.batchNo, item.drugName)}
                          title="Lập phiếu đổi trả cho nhà cung cấp"
                          className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
                        >
                          <RotateCcw size={11} />
                          <span>Trả NCC</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction('dispose', item.batchNo, item.drugName)}
                          title="Khóa lô thuốc và lập biên bản tiêu hủy"
                          className="grid h-6 w-6 place-items-center rounded-md text-rose-500 hover:bg-rose-50 hover:text-rose-700 border border-transparent hover:border-rose-200 transition-colors"
                        >
                          <ShieldBan size={13} />
                        </button>
                      </div>
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
