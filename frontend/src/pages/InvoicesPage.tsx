import { useEffect, useState } from 'react';
import { BadgeCheck, ChevronLeft, ChevronRight, CircleAlert, Eye, FileText, LoaderCircle, Printer, ShieldCheck, X } from 'lucide-react';
import { ApiError, apiClient } from '../services/apiClient';
import type { Invoice, InvoiceDetail, InvoiceVerificationResult, PageResult } from '../types';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });

export function InvoicesPage() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PageResult<Invoice> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<InvoiceVerificationResult | null>(null);

  // Detail Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');

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

  async function handleViewDetail(invoiceId: string) {
    setLoadingDetail(true);
    setDetailError('');
    setSelectedInvoice(null);
    try {
      const data = await apiClient<InvoiceDetail>(`/invoices/${encodeURIComponent(invoiceId)}`);
      setSelectedInvoice(data);
    } catch (err) {
      setDetailError(err instanceof ApiError ? err.detail || err.message : 'Không thể tải chi tiết hóa đơn.');
    } finally {
      setLoadingDetail(false);
    }
  }

  async function verify(invoice: Invoice | InvoiceDetail) {
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

  function handlePrint() {
    window.print();
  }

  return (
    <div className="animate-enter">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-forest">Hóa đơn & Bán hàng</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink">Hóa Đơn Điện Tử</h1>
          <p className="mt-1.5 text-sm text-slate-500">Tra cứu chứng từ bán hàng và xác thực toàn vẹn chữ ký số.</p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-600">
          <ShieldCheck size={15} className="text-forest" /> Chữ ký số SHA256 & RSA
        </div>
      </div>

      {notice && (
        <div role="status" className={`mb-5 flex items-start gap-3 rounded-md border p-4 ${notice.isValid ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900'}`}>
          {notice.isValid ? <BadgeCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" /> : <CircleAlert size={18} className="mt-0.5 shrink-0 text-rose-600" />}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{notice.isValid ? 'Chữ ký số hợp lệ — Chứng từ nguyên vẹn' : 'Cảnh báo: Kiểm tra chữ ký số thất bại'}</p>
            <p className="mt-1 text-xs opacity-90">{notice.message}</p>
            <p className="mt-1 font-mono text-[10px] text-slate-500">Cert: {notice.certificateSerial} | Ký lúc: {dateTime.format(new Date(notice.signedAt))}</p>
          </div>
          <button onClick={() => setNotice(null)} className="text-xs font-bold opacity-70 hover:opacity-100">Đóng</button>
        </div>
      )}

      {error && <div role="alert" className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}

      <section className="overflow-hidden rounded-md border border-line bg-white shadow-panel">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="font-display text-sm font-extrabold text-ink">Lịch sử hóa đơn chi nhánh</h2>
            <p className="mt-1 text-[11px] text-slate-500">{result?.totalCount ?? 0} hóa đơn được lưu trữ</p>
          </div>
          <span className="rounded bg-[#f0f7f3] px-2 py-1 font-mono text-[10px] text-forest">Trang {page}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="bg-[#f8faf9] text-[10px] uppercase tracking-[0.1em] text-slate-500">
                <th className="px-5 py-3 font-bold">Số Hóa Đơn</th>
                <th className="px-4 py-3 font-bold">Thời Gian</th>
                <th className="px-4 py-3 font-bold">Thu Ngân</th>
                <th className="px-4 py-3 text-right font-bold">Tổng Tiền</th>
                <th className="px-5 py-3 text-right font-bold">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr>
                  <td colSpan={5} className="h-36 text-center text-sm text-slate-500">
                    <span className="inline-flex items-center gap-2"><LoaderCircle size={16} className="animate-spin" /> Đang tải danh sách hóa đơn...</span>
                  </td>
                </tr>
              ) : !result?.items.length ? (
                <tr>
                  <td colSpan={5} className="h-36 text-center text-sm text-slate-500">Chưa có hóa đơn nào tại chi nhánh này.</td>
                </tr>
              ) : (
                result.items.map((invoice) => (
                  <tr key={invoice.invoiceId} className="hover:bg-[#fbfcfb]">
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs font-semibold text-ink">{invoice.invoiceNumber}</p>
                      <p className="mt-1 font-mono text-[9px] text-slate-400">{invoice.invoiceId}</p>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600">{dateTime.format(new Date(invoice.createdDate))}</td>
                    <td className="px-4 py-4 font-mono text-[11px] text-slate-600">{invoice.cashierId}</td>
                    <td className="px-4 py-4 text-right font-mono text-xs font-semibold text-ink">{money.format(invoice.totalAmount)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetail(invoice.invoiceId)}
                          className="inline-flex h-8 items-center gap-1.5 rounded border border-line px-2.5 text-[11px] font-bold text-slate-700 hover:border-forest hover:bg-slate-50"
                        >
                          <Eye size={13} /> Chi tiết
                        </button>
                        <button
                          onClick={() => verify(invoice)}
                          disabled={verifyingId === invoice.invoiceId}
                          className="inline-flex h-8 items-center gap-1.5 rounded border border-line px-2.5 text-[11px] font-bold text-forest hover:border-forest hover:bg-mint disabled:opacity-50"
                        >
                          {verifyingId === invoice.invoiceId ? <LoaderCircle size={13} className="animate-spin" /> : <ShieldCheck size={13} />} Xác thực
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-line px-5 py-3">
          <p className="text-[11px] text-slate-500">
            {result?.totalCount ? `Hiển thị ${(page - 1) * (result.pageSize || 20) + 1}–${Math.min(page * (result.pageSize || 20), result.totalCount)} trong tổng ${result.totalCount}` : 'Không có bản ghi'}
          </p>
          <div className="flex gap-1">
            <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || loading} className="grid h-8 w-8 place-items-center rounded border border-line text-slate-600 hover:bg-slate-50 disabled:opacity-40" aria-label="Previous page">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setPage((value) => Math.min(result?.totalPages || 1, value + 1))} disabled={loading || page >= (result?.totalPages || 1)} className="grid h-8 w-8 place-items-center rounded border border-line text-slate-600 hover:bg-slate-50 disabled:opacity-40" aria-label="Next page">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* MODAL CHI TIẾT HÓA ĐƠN & CHỮ KÝ SỐ */}
      {(loadingDetail || selectedInvoice || detailError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="animate-enter w-full max-w-2xl rounded-lg border border-line bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-forest" />
                <h3 className="font-display text-base font-extrabold text-ink">Chi Tiết Hóa Đơn Bán Hàng</h3>
              </div>
              <button
                onClick={() => { setSelectedInvoice(null); setDetailError(''); }}
                className="grid h-8 w-8 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            {loadingDetail && (
              <div className="py-12 text-center text-sm text-slate-500">
                <LoaderCircle size={24} className="mx-auto mb-2 animate-spin text-forest" />
                Đang tải chi tiết hóa đơn...
              </div>
            )}

            {detailError && (
              <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
                {detailError}
              </div>
            )}

            {selectedInvoice && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-[#f8faf9] p-3 rounded border border-line text-xs">
                  <div>
                    <span className="block text-slate-400 font-bold uppercase text-[9px]">Số hóa đơn</span>
                    <span className="font-mono font-bold text-ink">{selectedInvoice.invoiceNumber}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-bold uppercase text-[9px]">Khách hàng</span>
                    <span className="font-bold text-ink">{selectedInvoice.customerName || 'Khách lẻ vãng lai'}</span>
                    {selectedInvoice.customerPhone && (
                      <span className="block text-[10px] text-slate-500 font-mono">{selectedInvoice.customerPhone}</span>
                    )}
                  </div>
                  <div>
                    <span className="block text-slate-400 font-bold uppercase text-[9px]">Thời gian</span>
                    <span className="text-slate-700">{dateTime.format(new Date(selectedInvoice.createdDate))}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-bold uppercase text-[9px]">Thu ngân</span>
                    <span className="font-mono text-slate-700">{selectedInvoice.cashierId}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-bold uppercase text-[9px]">Chi nhánh</span>
                    <span className="font-mono text-slate-700">{selectedInvoice.branchId}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Danh sách mặt hàng</h4>
                  <div className="overflow-x-auto rounded border border-line">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#f3f6f4] text-slate-500 uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">Tên Thuốc</th>
                          <th className="p-2.5">Số Lô</th>
                          <th className="p-2.5 text-center">Số Lượng</th>
                          <th className="p-2.5 text-right">Đơn Giá</th>
                          <th className="p-2.5 text-right">Thành Tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {selectedInvoice.items?.map((item, idx) => (
                          <tr key={`${item.drugId}-${item.batchId}-${idx}`}>
                            <td className="p-2.5 font-bold text-ink">
                              {item.drugName}
                              <span className="block font-mono text-[9px] text-slate-400">{item.drugCode}</span>
                            </td>
                            <td className="p-2.5 font-mono text-slate-600">{item.batchId}</td>
                            <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                            <td className="p-2.5 text-right font-mono">{money.format(item.unitPrice)}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-ink">{money.format(item.subTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[#f8faf9] border-t border-line font-bold">
                          <td colSpan={4} className="p-2.5 text-right uppercase text-[11px] text-slate-600">Tổng thanh toán:</td>
                          <td className="p-2.5 text-right font-mono text-sm text-forest">{money.format(selectedInvoice.totalAmount)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {selectedInvoice.signature && (
                  <div className="rounded border border-line bg-[#fbfcfb] p-3 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-forest mb-2">
                      <ShieldCheck size={15} />
                      <span>Thông tin chứng thư & chữ ký số điện tử</span>
                    </div>
                    <div className="space-y-1 font-mono text-[10px] text-slate-600">
                      <p><span className="text-slate-400">Cert Serial:</span> {selectedInvoice.signature.certificateSerial}</p>
                      <p className="truncate"><span className="text-slate-400">SHA-256:</span> {selectedInvoice.signature.hashValueSha256}</p>
                      <p><span className="text-slate-400">Ký lúc:</span> {new Date(selectedInvoice.signature.signedAt).toISOString()}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-line pt-4">
                  <button
                    onClick={() => verify(selectedInvoice)}
                    disabled={verifyingId === selectedInvoice.invoiceId}
                    className="inline-flex items-center gap-1.5 rounded border border-line px-3 py-2 text-xs font-bold text-forest hover:bg-mint"
                  >
                    {verifyingId === selectedInvoice.invoiceId ? <LoaderCircle size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Kiểm tra tính toàn vẹn
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1.5 rounded border border-line px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <Printer size={14} /> In hóa đơn
                    </button>
                    <button
                      onClick={() => setSelectedInvoice(null)}
                      className="rounded bg-forest px-4 py-2 text-xs font-bold text-white hover:bg-[#1c594b]"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
