import { useCallback, useEffect, useRef, useState } from 'react';
import { Printer, LoaderCircle, ShieldCheck } from 'lucide-react';
import { InvoicePaymentBadge } from '../components/common/InvoicePaymentBadge';
import { loadAllPages } from '../utils/loadAllPages';
import { SearchToolbar } from '../components/common/SearchToolbar';
import { DateRangeFilter } from '../components/common/DateRangeFilter';
import { money, dateTime } from '../utils/formatters';
import { PageHeader } from '../components/common/PageHeader';
import { ApiError, apiClient } from '../services/apiClient';
import type { Invoice, InvoiceDetail, InvoiceVerificationResult, PageResult, ReturnOrder } from '../types';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ReceiptPrintModal, type ReceiptData } from '../components/invoices/ReceiptPrintModal';
import { InvoiceSignatureState, type VerificationAttempt } from '../components/invoices/InvoiceSignatureState';
import { Modal, DataTable, AlertBanner, type Column } from '../components/common';

const secondary = 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed';
const primary = 'inline-flex items-center justify-center gap-1.5 rounded-lg bg-forest px-3 py-2 text-xs font-semibold text-white hover:bg-forest-dark disabled:opacity-50 disabled:cursor-not-allowed';
const failure = (error: unknown, fallback: string) => error instanceof ApiError ? error.detail || error.message : fallback;
const formattedDate = (date?: string | null) => date ? dateTime.format(new Date(date)) : '—';

export function InvoicesPage() {
  const { currentUser } = useAuth();
  const [result, setResult] = useState<PageResult<Invoice> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortOrder, setSortOrder] = useState('NEWEST');
  const filteredInvoices = (result?.items ?? []).filter(invoice => {
    const day = new Date(invoice.createdDate).toLocaleDateString('sv-SE');
    return invoice.invoiceNumber.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi'))
      && (statusFilter === 'ALL' || (statusFilter === 'CANCELLED' ? invoice.status === 'CANCELLED'
        : invoice.status !== 'CANCELLED' && invoice.paymentStatus === statusFilter))
      && (!fromDate || day >= fromDate) && (!toDate || day <= toDate);
  }).sort((a, b) => sortOrder === 'AMOUNT_DESC' ? b.totalAmount - a.totalAmount
    : sortOrder === 'AMOUNT_ASC' ? a.totalAmount - b.totalAmount
    : sortOrder === 'OLDEST' ? new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
    : new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
  const filteredPages = Math.max(1, Math.ceil(filteredInvoices.length / 20));
  useEffect(() => setPage(1), [search, statusFilter, fromDate, toDate, sortOrder]);
  useEffect(() => setPage(value => Math.min(value, filteredPages)), [filteredPages]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');
  const detailRequest = useRef(0);
  const detailInFlight = useRef(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<Record<string, VerificationAttempt>>({});
  const verifyInFlight = useRef(false);
  const mutationInFlight = useRef(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [printData, setPrintData] = useState<ReceiptData | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const printInFlight = useRef(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const busy = Boolean(verifyingId || payingId || printingId || cancelling);
  const isOwner = currentUser?.role === 'OWNER';

  const listInFlight = useRef<Promise<void> | null>(null);
  const fetchInvoices = useCallback(() => {
    if (listInFlight.current) return listInFlight.current;
    setLoading(true);
    setError('');
    const request = loadAllPages<Invoice>('/invoices')
      .then(items => setResult({ items, page: 1, pageSize: 100, totalCount: items.length, totalPages: 1 }))
      .catch(err => setError(failure(err, 'Không thể tải danh sách hóa đơn.')))
      .finally(() => { listInFlight.current = null; setLoading(false); });
    listInFlight.current = request;
    return request;
  }, []);
  useEffect(() => { void fetchInvoices(); }, [fetchInvoices]);

  function closeDetail() {
    if (busy) return;
    detailRequest.current++;
    detailInFlight.current = false;
    setSelectedInvoice(null); setLoadingDetail(false); setDetailError('');
  }
  async function handleViewDetail(invoiceId: string) {
    if (busy || detailInFlight.current) return;
    detailInFlight.current = true;
    const request = ++detailRequest.current;
    setLoadingDetail(true); setDetailError(''); setSelectedInvoice(null);
    try {
      const data = await readInvoiceDetail(invoiceId);
      if (request === detailRequest.current) setSelectedInvoice(data);
    } catch (err) {
      if (request === detailRequest.current) setDetailError(failure(err, 'Không thể tải chi tiết hóa đơn.'));
    } finally { if (request === detailRequest.current) { setLoadingDetail(false); detailInFlight.current = false; } }
  }
  async function readInvoiceDetail(invoiceId: string): Promise<InvoiceDetail> {
    const detail = await apiClient<InvoiceDetail>(`/invoices/${encodeURIComponent(invoiceId)}`);
    // Reuse the existing OWNER/SALES-protected API, preserving its branch scope.
    try {
      const returns = await apiClient<ReturnOrder[]>('/returns');
      return { ...detail, returnHistory: returns.filter(item => item.invoiceId === detail.invoiceId && item.branchId === detail.branchId)
        .map(item => ({ returnId: item.id, returnNo: item.returnNo, createdDate: item.createdDate,
          recordedRefundAmount: item.totalRefundAmount, status: item.status })) };
    } catch {
      return { ...detail, returnHistoryError: 'Không tải được lịch sử đổi trả. Chưa thể kết luận hóa đơn chưa có đổi trả.' };
    }
  }
  async function reloadDetail(invoiceId: string) {
    const data = await readInvoiceDetail(invoiceId);
    setSelectedInvoice(previous => previous?.invoiceId === invoiceId ? data : previous);
  }
  async function verify(invoice: InvoiceDetail) {
    if (verifyInFlight.current) return;
    verifyInFlight.current = true; setVerifyingId(invoice.invoiceId);
    setAttempts(previous => ({ ...previous, [invoice.invoiceId]: {} }));
    try {
      const result = await apiClient<InvoiceVerificationResult>(`/invoices/${encodeURIComponent(invoice.invoiceId)}/verify-signature`, { method: 'POST' });
      setAttempts(previous => ({ ...previous, [invoice.invoiceId]: { result } }));
      // Re-read persisted history. Never manufacture a server timestamp or verifier.
      await Promise.all([fetchInvoices(), reloadDetail(invoice.invoiceId)]);
    } catch (err) {
      setAttempts(previous => ({ ...previous, [invoice.invoiceId]: { error: failure(err, 'Không thể kiểm tra chữ ký. Vui lòng thử lại sau.') } }));
    } finally { verifyInFlight.current = false; setVerifyingId(null); }
  }
  async function handleOpenPrint(invoiceId: string) {
    if (printInFlight.current) return;
    printInFlight.current = true; setPrintingId(invoiceId);
    try {
      const detail = await apiClient<InvoiceDetail>(`/invoices/${encodeURIComponent(invoiceId)}`);
      setPrintData({ invoiceNumber: detail.invoiceNumber, createdDate: detail.createdDate,
        branchName: currentUser?.branchName, cashierName: detail.cashierName || undefined,
        customerName: detail.customerName, customerPhone: detail.customerPhone,
        items: detail.items.map(item => ({ drugName: item.drugName, drugCode: item.drugCode,
          batchNo: item.batchNo || '', quantity: item.quantity, unitPrice: item.unitPrice, subTotal: item.subTotal })),
        totalAmount: detail.totalAmount, status: detail.status, paymentStatus: detail.paymentStatus });
      setShowPrintModal(true);
    } catch (err) { setError(failure(err, 'Không thể lấy dữ liệu để in hóa đơn.')); }
    finally { printInFlight.current = false; setPrintingId(null); }
  }
  async function handleConfirmPayment(invoiceId: string) {
    if (mutationInFlight.current) return;
    mutationInFlight.current = true; setPayingId(invoiceId); setSuccess('');
    try {
      await apiClient(`/invoices/${encodeURIComponent(invoiceId)}/confirm-payment`, { method: 'POST' });
      setSuccess('Đã xác nhận thanh toán.');
      await Promise.all([fetchInvoices(), selectedInvoice?.invoiceId === invoiceId ? reloadDetail(invoiceId) : Promise.resolve()]);
    } catch (err) { setError(failure(err, 'Không thể xác nhận thanh toán.')); }
    finally { mutationInFlight.current = false; setPayingId(null); }
  }
  async function handleCancelInvoice() {
    if (!selectedInvoice || mutationInFlight.current || cancelReason.trim().length < 5) return;
    const id = selectedInvoice.invoiceId;
    mutationInFlight.current = true; setCancelling(true); setCancelError(''); setSuccess('');
    try {
      const detail = await apiClient<InvoiceDetail>(`/invoices/${encodeURIComponent(id)}/cancel`, {
        method: 'POST', body: JSON.stringify({ reason: cancelReason.trim() }),
      });
      setSelectedInvoice(detail); setShowCancelModal(false); setCancelReason('');
      setAttempts(previous => { const next = { ...previous }; delete next[id]; return next; });
      setSuccess('Đã hủy hóa đơn theo kết quả Backend.');
      await fetchInvoices();
    } catch (err) { setCancelError(failure(err, 'Hủy hóa đơn thất bại.')); }
    finally { mutationInFlight.current = false; setCancelling(false); }
  }

  const columns: Column<Invoice>[] = [
    { header: 'Số hóa đơn', cell: invoice => <span className="break-words font-mono text-xs font-semibold text-ink">{invoice.invoiceNumber}</span> },
    { header: 'Ngày giờ', cell: invoice => <span className="text-slate-600">{formattedDate(invoice.createdDate)}</span> },
    { header: 'Thu ngân', cell: invoice => invoice.cashierName || 'Chưa có thông tin thu ngân' },
    { header: 'Thanh toán', cell: invoice => <InvoicePaymentBadge status={invoice.status} paymentStatus={invoice.paymentStatus} /> },
    { header: 'Tổng tiền', align: 'right', cell: invoice => <span className="whitespace-nowrap font-semibold tabular-nums text-forest">{money.format(invoice.totalAmount)}</span> },
    { header: 'Chữ ký số', cell: invoice => <InvoiceSignatureState invoice={invoice} attempt={attempts[invoice.invoiceId]} /> },

  ];
  const attempt = selectedInvoice ? attempts[selectedInvoice.invoiceId] : undefined;
  return <div className="ui-page">
    <PageHeader title="Hóa đơn bán hàng" />
    <AlertBanner type="error" message={error} onClose={() => setError('')} />
    <AlertBanner type="success" message={success} onClose={() => setSuccess('')} />
      <SearchToolbar searchValue={search} onSearchChange={setSearch}
        searchPlaceholder="Tìm theo số hóa đơn…" onRefresh={fetchInvoices} loading={loading}
        filterSlot={<>
          <select aria-label="Trạng thái hóa đơn" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-line bg-white px-3 text-sm">
            <option value="ALL">Tất cả trạng thái</option><option value="PAID">Đã thanh toán</option><option value="CANCELLED">Đã hủy</option>
          </select>
          <DateRangeFilter value={{ from: fromDate, to: toDate }} onChange={value => {
            if (value.from && value.to && value.from > value.to) {
              if (value.from !== fromDate) value.to = value.from; else value.from = value.to;
            }
            setFromDate(value.from); setToDate(value.to);
          }} />
          <select aria-label="Sắp xếp hóa đơn" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="rounded-lg border border-line bg-white px-3 text-sm">
            <option value="NEWEST">Mới nhất</option><option value="OLDEST">Cũ nhất</option><option value="AMOUNT_DESC">Tổng tiền giảm dần</option><option value="AMOUNT_ASC">Tổng tiền tăng dần</option>
          </select>
          {(statusFilter !== 'ALL' || fromDate || toDate) && <button type="button" className="px-2 text-sm font-semibold text-forest" onClick={() => { setStatusFilter('ALL'); setFromDate(''); setToDate(''); }}>Xóa bộ lọc</button>}
        </>} />
      {/* Invoices DataTable */}
      <DataTable
        columns={columns}
        onRowClick={invoice => void handleViewDetail(invoice.invoiceId)}
        rowLabel={invoice => `Xem hóa đơn ${invoice.invoiceNumber}`}
        data={filteredInvoices.slice((page - 1) * 20, page * 20)}
        keyExtractor={(invoice) => invoice.invoiceId}
        loading={loading}
        loadingText="Đang tải danh sách hóa đơn chi nhánh..."
        emptyMessage="Chưa có hóa đơn nào được lưu trữ tại chi nhánh này."
        pagination={{
          page,
          totalPages: filteredPages,
          totalCount: filteredInvoices.length,
          onPageChange: setPage,
          itemLabel: 'hóa đơn',
        }}
      />


    <Modal isOpen={Boolean(loadingDetail || selectedInvoice || detailError) && !showPrintModal && !showCancelModal} onClose={closeDetail}
      title="Chi tiết hóa đơn" subtitle={selectedInvoice?.invoiceNumber} maxWidth="3xl"
      footer={<><button type="button" className={secondary} disabled={busy} onClick={closeDetail}>Đóng</button>
        {selectedInvoice && <button type="button" className={primary} disabled={busy} onClick={() => handleOpenPrint(selectedInvoice.invoiceId)}>{printingId ? <LoaderCircle size={15} className="animate-spin" /> : <Printer size={15} />}In hóa đơn</button>}</>}>
      {loadingDetail && <p role="status" className="py-8 text-center text-sm text-slate-500">Đang tải chi tiết hóa đơn…</p>}
      <AlertBanner type="error" message={detailError} />
      {selectedInvoice && <div className="space-y-5 text-sm">
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><dt className="text-xs text-slate-500">Ngày lập</dt><dd className="mt-1">{formattedDate(selectedInvoice.createdDate)}</dd></div>
          <div><dt className="text-xs text-slate-500">Chi nhánh</dt><dd className="mt-1">{currentUser?.branchName || 'Chưa có tên chi nhánh'}</dd></div>
          <div><dt className="text-xs text-slate-500">Thu ngân</dt><dd className="mt-1">{selectedInvoice.cashierName || 'Chưa có tên thu ngân'}</dd></div>
          <div><dt className="text-xs text-slate-500">Khách hàng</dt><dd className="mt-1">{selectedInvoice.customerName || 'Khách lẻ'}{selectedInvoice.customerPhone && ` · ${selectedInvoice.customerPhone}`}</dd></div>
          <div><dt className="mb-1 text-xs text-slate-500">Thanh toán</dt><dd><InvoicePaymentBadge status={selectedInvoice.status} paymentStatus={selectedInvoice.paymentStatus} /></dd></div>
        </dl>
        <section aria-label="Danh sách thuốc" className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-3">
          {selectedInvoice.items.map((item, index) => <article key={index} className="grid grid-cols-1 gap-2 py-3 sm:grid-cols-[1fr_auto]">
            <div className="min-w-0"><p className="break-words font-semibold">{item.drugName}</p><p className="mt-1 break-words text-xs text-slate-500">{item.drugCode} · Lô: {item.batchNo || 'Chưa có số lô'}</p></div>
            <div className="text-right tabular-nums"><p className="text-xs text-slate-500">{item.quantity} × {money.format(item.unitPrice)}</p><p className="mt-1 whitespace-nowrap font-semibold">{money.format(item.subTotal)}</p></div>
          </article>)}
        </section>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 font-semibold"><span>Tổng thanh toán</span><span className="whitespace-nowrap text-lg tabular-nums text-forest">{money.format(selectedInvoice.totalAmount)}</span></div>
        <AlertBanner type="warning" message={selectedInvoice.returnHistoryError} />
        {selectedInvoice.returnHistory && selectedInvoice.returnHistory.length > 0 && <section className="space-y-3 rounded-xl border border-slate-200 p-3" aria-label="Lịch sử đổi trả">
          <h3 className="font-semibold">Lịch sử đổi trả</h3>
          <p className="text-xs text-slate-600">Giá trị ghi nhận từ phiếu hoàn tất: <strong>{money.format(selectedInvoice.returnHistory.filter(item => item.status === 'COMPLETED').reduce((sum, item) => sum + item.recordedRefundAmount, 0))}</strong>. Không thay đổi tổng tiền hóa đơn gốc; đây không phải xác nhận chi trả qua ngân hàng.</p>
          <ul className="divide-y divide-slate-100">{selectedInvoice.returnHistory.map(item => <li key={item.returnId} className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
            <div><Link className="font-semibold text-forest underline underline-offset-2" to={`/returns?returnId=${encodeURIComponent(item.returnId)}`}>Xem phiếu {item.returnNo}</Link><p className="mt-1 text-slate-500">{formattedDate(item.createdDate)} · {item.status === 'COMPLETED' ? 'Hoàn tất' : item.status === 'REJECTED' ? 'Từ chối' : item.status === 'CANCELLED' ? 'Đã hủy' : item.status}</p></div>
            <span className="whitespace-nowrap tabular-nums">{money.format(item.recordedRefundAmount)}</span>
          </li>)}</ul>
        </section>}
        <section className="space-y-3 rounded-xl border border-slate-200 p-3" aria-label="Chữ ký số">
          <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Chữ ký số</h3><InvoiceSignatureState invoice={selectedInvoice} attempt={attempt} /></div>
          {selectedInvoice.signature?.signedAt && <p className="text-xs text-slate-500">Ký lúc: {formattedDate(selectedInvoice.signature.signedAt)}</p>}
          {attempt?.error && <AlertBanner type="warning" message={attempt.error} />}
          {attempt?.result && <AlertBanner type={attempt.result.isValid ? 'success' : 'warning'} message={attempt.result.isValid ? 'Lần kiểm tra vừa thực hiện: hợp lệ.' : 'Lần kiểm tra vừa thực hiện không xác nhận được chữ ký hợp lệ. Xem thông tin kỹ thuật để truy vết.'} />}
          {selectedInvoice.lastVerifiedAt && <p className="text-xs leading-relaxed text-slate-600">Lần kiểm tra thành công gần nhất: {formattedDate(selectedInvoice.lastVerifiedAt)}{selectedInvoice.verifiedByName && ` · ${selectedInvoice.verifiedByName}`}. Đây là kết quả lịch sử, không thay thế lần kiểm tra mới.</p>}
          {selectedInvoice.signature && selectedInvoice.signature.status !== 'REVOKED' && selectedInvoice.status !== 'CANCELLED' && <button type="button" className={secondary} disabled={busy} onClick={() => verify(selectedInvoice)}>{verifyingId ? <LoaderCircle size={14} className="animate-spin" /> : <ShieldCheck size={14} />}{verifyingId ? 'Đang kiểm tra…' : selectedInvoice.lastVerifiedAt || attempt ? 'Kiểm tra lại' : 'Kiểm tra chữ ký'}</button>}
          <details className="text-xs text-slate-600"><summary className="cursor-pointer rounded py-1 font-medium focus-visible:outline-forest">Thông tin kỹ thuật</summary>
            <dl className="mt-3 space-y-2 break-all"><div><dt>Mã nội bộ</dt><dd className="font-mono">{selectedInvoice.invoiceId}</dd></div>
              <div><dt>SHA-256 đã lưu</dt><dd className="font-mono">{selectedInvoice.signature?.hashValueSha256 || '—'}</dd></div>
              <div><dt>Định danh chứng thư / khóa</dt><dd>{selectedInvoice.signature?.certificateSerial || '—'}</dd></div>
              <div><dt>Thời gian ký</dt><dd>{formattedDate(selectedInvoice.signature?.signedAt)}</dd></div>
              {attempt?.result && <div><dt>Kết quả Backend</dt><dd>{attempt.result.message}</dd><dt>SHA-256 tính lại</dt><dd className="font-mono">{attempt.result.calculatedHashSha256 || '—'}</dd></div>}
            </dl>
          </details>
        </section>
        {selectedInvoice.status === 'CANCELLED' && <AlertBanner type="warning" message={`Đã hủy: ${selectedInvoice.cancelReason || 'Chưa có lý do'} · ${formattedDate(selectedInvoice.cancelledDate)}`} />}
        {selectedInvoice.status !== 'CANCELLED' && selectedInvoice.paymentStatus === 'PENDING' && <button type="button" className={secondary} disabled={busy} onClick={() => handleConfirmPayment(selectedInvoice.invoiceId)}>{payingId ? 'Đang thu tiền…' : 'Thu tiền mặt'}</button>}
        {isOwner && selectedInvoice.status !== 'CANCELLED' && <details className="border-t border-slate-100 pt-3"><summary className="cursor-pointer rounded py-1 text-xs font-medium text-slate-600">Thao tác quản lý</summary><button type="button" className="mt-3 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50" disabled={busy} onClick={() => { setCancelError(''); setShowCancelModal(true); }}>Hủy hóa đơn &amp; hoàn kho</button></details>}
      </div>}
    </Modal>
    <Modal isOpen={showCancelModal} onClose={() => !cancelling && setShowCancelModal(false)} title="Xác nhận hủy hóa đơn" subtitle={selectedInvoice?.invoiceNumber} maxWidth="md"
      footer={<><button type="button" className={secondary} disabled={cancelling} onClick={() => setShowCancelModal(false)}>Quay lại</button><button type="button" className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50" disabled={cancelling || cancelReason.trim().length < 5} onClick={handleCancelInvoice}>{cancelling ? 'Đang xử lý…' : 'Xác nhận hủy & hoàn tồn'}</button></>}>
      <div className="space-y-4"><AlertBanner type="error" message={cancelError} /><AlertBanner type="warning" message="Hóa đơn sẽ bị hủy, chữ ký bị thu hồi và thuốc được hoàn tồn theo xử lý Backend. Thao tác này không thể hoàn tác." />
        <label className="block text-sm font-medium">Lý do hủy hóa đơn<textarea rows={3} value={cancelReason} disabled={cancelling} onChange={event => setCancelReason(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 p-3 text-sm" placeholder="Nhập lý do, tối thiểu 5 ký tự" /></label></div>
    </Modal>
    <ReceiptPrintModal isOpen={showPrintModal} onClose={() => setShowPrintModal(false)} data={printData} />
  </div>;
}
