import { useEffect, useState } from 'react';
import { BadgeCheck, ChevronLeft, ChevronRight, CircleAlert, LoaderCircle, ShieldCheck } from 'lucide-react';
import { ApiError, apiClient } from '../services/apiClient';
import type { Invoice, InvoiceVerificationResult, PageResult } from '../types';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });

export function InvoicesPage() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PageResult<Invoice> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<InvoiceVerificationResult | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    apiClient<PageResult<Invoice>>(`/invoices?page=${page}&pageSize=20`)
      .then((data) => { if (active) setResult(data); })
      .catch((requestError) => { if (active) setError(requestError instanceof ApiError ? requestError.detail || requestError.message : 'Could not load invoices.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page]);

  async function verify(invoice: Invoice) {
    setVerifyingId(invoice.invoiceId);
    setNotice(null);
    try {
      const verification = await apiClient<InvoiceVerificationResult>(`/invoices/${encodeURIComponent(invoice.invoiceId)}/verify-signature`, { method: 'POST' });
      setNotice(verification);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.detail || requestError.message : 'Signature verification failed.');
    } finally {
      setVerifyingId(null);
    }
  }

  return (
    <div className="animate-enter">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.13em] text-forest">Sales records</p><h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink">Invoices</h1><p className="mt-1.5 text-sm text-slate-500">Review transactions and verify invoice integrity.</p></div>
        <div className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-600"><ShieldCheck size={15} className="text-forest" /> Signed records</div>
      </div>

      {notice && <div role="status" className={`mb-5 flex items-start gap-3 rounded-md border p-4 ${notice.isValid ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900'}`}>
        {notice.isValid ? <BadgeCheck size={18} className="mt-0.5 shrink-0" /> : <CircleAlert size={18} className="mt-0.5 shrink-0" />}
        <div className="min-w-0 flex-1"><p className="text-sm font-bold">{notice.isValid ? 'Signature verified' : 'Signature check failed'}</p><p className="mt-1 text-xs">{notice.message}</p></div>
        <button onClick={() => setNotice(null)} className="text-xs font-bold opacity-70 hover:opacity-100">Dismiss</button>
      </div>}
      {error && <div role="alert" className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}

      <section className="overflow-hidden rounded-md border border-line bg-white shadow-panel">
        <div className="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 className="font-display text-sm font-extrabold text-ink">Recent invoices</h2><p className="mt-1 text-[11px] text-slate-500">{result?.totalCount ?? 0} records in this branch</p></div><span className="rounded bg-[#f0f7f3] px-2 py-1 font-mono text-[10px] text-forest">Page {page}</span></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead><tr className="bg-[#f8faf9] text-[10px] uppercase tracking-[0.1em] text-slate-500"><th className="px-5 py-3 font-bold">Invoice</th><th className="px-4 py-3 font-bold">Created</th><th className="px-4 py-3 font-bold">Cashier</th><th className="px-4 py-3 text-right font-bold">Total</th><th className="px-5 py-3 text-right font-bold">Integrity</th></tr></thead>
            <tbody className="divide-y divide-line">
              {loading ? <tr><td colSpan={5} className="h-36 text-center text-sm text-slate-500"><span className="inline-flex items-center gap-2"><LoaderCircle size={16} className="animate-spin" /> Loading invoices</span></td></tr> : !result?.items.length ? <tr><td colSpan={5} className="h-36 text-center text-sm text-slate-500">No invoices found for this branch.</td></tr> : result.items.map((invoice) => (
                <tr key={invoice.invoiceId} className="hover:bg-[#fbfcfb]">
                  <td className="px-5 py-4"><p className="font-mono text-xs font-semibold text-ink">{invoice.invoiceNumber}</p><p className="mt-1 font-mono text-[9px] text-slate-400">{invoice.invoiceId}</p></td>
                  <td className="px-4 py-4 text-xs text-slate-600">{dateTime.format(new Date(invoice.createdDate))}</td>
                  <td className="px-4 py-4 font-mono text-[11px] text-slate-600">{invoice.cashierId}</td>
                  <td className="px-4 py-4 text-right font-mono text-xs font-semibold text-ink">{money.format(invoice.totalAmount)}</td>
                  <td className="px-5 py-4 text-right"><button onClick={() => verify(invoice)} disabled={verifyingId === invoice.invoiceId} className="inline-flex h-8 items-center gap-1.5 rounded border border-line px-2.5 text-[11px] font-bold text-forest hover:border-forest hover:bg-mint disabled:opacity-50">{verifyingId === invoice.invoiceId ? <LoaderCircle size={13} className="animate-spin" /> : <ShieldCheck size={13} />} Verify</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-line px-5 py-3">
          <p className="text-[11px] text-slate-500">{result?.totalCount ? `Showing ${(page - 1) * (result.pageSize || 20) + 1}–${Math.min(page * (result.pageSize || 20), result.totalCount)} of ${result.totalCount}` : 'No records'}</p>
          <div className="flex gap-1"><button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || loading} className="grid h-8 w-8 place-items-center rounded border border-line text-slate-600 hover:bg-slate-50 disabled:opacity-40" aria-label="Previous page"><ChevronLeft size={16} /></button><button onClick={() => setPage((value) => Math.min(result?.totalPages || 1, value + 1))} disabled={loading || page >= (result?.totalPages || 1)} className="grid h-8 w-8 place-items-center rounded border border-line text-slate-600 hover:bg-slate-50 disabled:opacity-40" aria-label="Next page"><ChevronRight size={16} /></button></div>
        </div>
      </section>
    </div>
  );
}
