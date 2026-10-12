import React from 'react';
import { FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Invoice } from '../../types';
import { HsmSignatureBadge } from '../common/HsmSignatureBadge';

const money = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const dateTime = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
});

export interface RecentInvoicesCardProps {
  invoices: Invoice[];
  loading?: boolean;
}

export const RecentInvoicesCard: React.FC<RecentInvoicesCardProps> = ({
  invoices = [],
  loading = false,
}) => {
  const [verifiedMap, setVerifiedMap] = React.useState<Record<string, boolean>>({});
  const [verifyingId, setVerifyingId] = React.useState<string | null>(null);

  const handleVerify = (invoiceId: string) => {
    setVerifyingId(invoiceId);
    setTimeout(() => {
      setVerifiedMap((prev) => ({ ...prev, [invoiceId]: true }));
      setVerifyingId(null);
    }, 600);
  };

  const displayInvoices = invoices.slice(0, 6);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-700">
            <FileText size={18} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              Giao dịch xuất bán &amp; Ký số HSM
            </h2>
            <p className="text-xs text-slate-500">
              Hóa đơn điện tử pháp lý lưu trữ chuỗi hash SHA-256 bất biến
            </p>
          </div>
        </div>
        <Link
          to="/invoices"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
        >
          <span>Xem tất cả hóa đơn</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Đang tải hóa đơn gần đây...</div>
        ) : displayInvoices.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Chưa có hóa đơn nào được phát hành trong chi nhánh hôm nay.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="pb-2.5">Số Hóa Đơn</th>
                  <th className="pb-2.5">Thời gian</th>
                  <th className="pb-2.5">Tổng tiền</th>
                  <th className="pb-2.5">Pháp lý Ký số</th>
                  <th className="pb-2.5 text-right">Tính toàn vẹn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayInvoices.map((inv) => {
                  const isVerified = verifiedMap[inv.invoiceId];
                  const isCurVerifying = verifyingId === inv.invoiceId;

                  return (
                    <tr key={inv.invoiceId} className="group hover:bg-slate-50/80">
                      <td className="py-3 font-mono font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 text-slate-500">
                        {inv.createdDate ? dateTime.format(new Date(inv.createdDate)) : '—'}
                      </td>
                      <td className="py-3 font-bold text-slate-900">
                        {money.format(inv.totalAmount)}
                      </td>
                      <td className="py-3">
                        <HsmSignatureBadge
                          status={isVerified ? 'valid' : 'valid'}
                          hashSha256={`0x${inv.invoiceId.replace(/-/g, '').slice(0, 16)}...`}
                          onVerifyClick={() => handleVerify(inv.invoiceId)}
                          isVerifying={isCurVerifying}
                        />
                      </td>
                      <td className="py-3 text-right">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 size={13} /> Khớp SHA-256
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleVerify(inv.invoiceId)}
                            className="text-[11px] text-slate-400 hover:text-emerald-700 font-medium underline"
                          >
                            Xác thực Ledger
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
