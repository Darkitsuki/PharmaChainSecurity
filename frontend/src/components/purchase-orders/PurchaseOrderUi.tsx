import type { ReactNode } from 'react';
import { money as currency, calendarDate } from '../../utils/formatters';
import { purchaseOrderStatuses } from '../../services/purchaseOrders';

export const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-forest/90 focus:ring-2 focus:ring-forest/30 disabled:cursor-not-allowed disabled:opacity-50';
export const secondaryButton = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50';
export const fieldClass = 'mt-1.5 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink focus:border-forest focus:ring-2 focus:ring-forest/15 disabled:bg-slate-50';
export const money = (value: number) => currency.format(value);
export const dateLabel = (value: string | null) => value ? calendarDate.format(new Date(value)) : 'Chưa có';

// A display alias only. Full order number remains available in detail and search.
export function orderLabel(orderNo: string) {
  const match = /^(PO-\d{8})-([a-f0-9]{32})$/i.exec(orderNo);
  return match ? `${match[1]} · ${match[2].slice(-8).toUpperCase()}` : orderNo;
}

const tones: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  APPROVED: 'bg-mint text-forest ring-forest/20',
  ORDERED: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  RECEIVED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  REJECTED: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  CANCELLED: 'bg-slate-100 text-slate-600 ring-slate-400/20',
};
export function OrderBadge({ status }: { status: string }) {
  return <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tones[status] || tones.CANCELLED}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{purchaseOrderStatuses[status] || status}</span>;
}
export function OrderSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm"><h2 className="border-b border-slate-100 px-5 py-4 font-display text-sm font-bold text-ink">{title}</h2><div className="p-5">{children}</div></section>;
}
