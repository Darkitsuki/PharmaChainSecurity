const states: Record<string, { label: string; tone: string }> = {
  PAID: { label: 'Đã thanh toán', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  PENDING: { label: 'Chờ thanh toán', tone: 'border-amber-200 bg-amber-50 text-amber-800' },
  FAILED: { label: 'Thanh toán thất bại', tone: 'border-rose-200 bg-rose-50 text-rose-700' },
  REFUNDED: { label: 'Đã hoàn tiền', tone: 'border-blue-200 bg-blue-50 text-blue-700' },
  CANCELLED: { label: 'Đã hủy', tone: 'border-slate-200 bg-slate-100 text-slate-600' },
};

export function InvoicePaymentBadge({ status, paymentStatus }: { status?: string; paymentStatus?: string }) {
  const state = states[status === 'CANCELLED' ? status : paymentStatus || '']
    || { label: 'Chưa xác định', tone: 'border-slate-200 bg-slate-50 text-slate-600' };
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${state.tone}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />{state.label}
  </span>;
}
