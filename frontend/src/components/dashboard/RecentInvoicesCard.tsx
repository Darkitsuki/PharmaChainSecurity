import { InvoicePaymentBadge } from '../common/InvoicePaymentBadge';
import { money, dateTime } from '../../utils/formatters';
import React from 'react';
import { FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Invoice } from '../../types';





export interface RecentInvoicesCardProps {
  invoices: Invoice[];
  loading?: boolean;
}

export const RecentInvoicesCard: React.FC<RecentInvoicesCardProps> = ({
  invoices = [],
  loading = false,
}) => {
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
              Hóa đơn gần đây
            </h2>
            <p className="text-xs text-slate-500">
              Các giao dịch bán hàng mới nhất của chi nhánh
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
            Chưa có hóa đơn nào trong danh sách gần đây.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayInvoices.map((inv) => (
              <Link to="/invoices" key={inv.invoiceId} className="grid gap-2 py-3 text-xs transition-colors hover:bg-slate-50/80 sm:grid-cols-[minmax(0,1.4fr)_auto] sm:items-center sm:gap-x-4">
                <div className="min-w-0"><p className="truncate font-mono font-bold text-slate-900" title={inv.invoiceNumber}>{inv.invoiceNumber}</p><p className="mt-1 text-slate-500">{inv.createdDate ? dateTime.format(new Date(inv.createdDate)) : '—'}</p></div>
                <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end"><span className="whitespace-nowrap font-bold text-slate-900">{money.format(inv.totalAmount)}</span><InvoicePaymentBadge status={inv.status} paymentStatus={inv.paymentStatus} /></div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
