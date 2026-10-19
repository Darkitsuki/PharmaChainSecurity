import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  Eye,
  FileText,
  LoaderCircle,
  Printer,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { ApiError, apiClient } from '../services/apiClient';
import type { Invoice, InvoiceDetail, InvoiceVerificationResult, PageResult } from '../types';
import { useAuth } from '../context/AuthContext';
import { ReceiptPrintModal, type ReceiptData } from '../components/invoices/ReceiptPrintModal';
import {
  Modal,
  DataTable,
  AlertBanner,
  HsmSignatureBadge,
  type Column,
} from '../components/common';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });

export function InvoicesPage() {
  const { currentUser } = useAuth();
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

  // Cancel Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  // Print Receipt State
  const [printData, setPrintData] = useState<ReceiptData | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const fetchInvoices = useCallback((pageNum: number) => {
    setLoading(true);
    setError('');
    apiClient<PageResult<Invoice>>(`/invoices?page=${pageNum}&pageSize=20`)
      .then((data) => {
        setResult(data);
      })
      .catch((requestError) => {
        setError(
          requestError instanceof ApiError ? requestError.detail || requestError.message : 'Không thể tải danh sách hóa đơn.'
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchInvoices(page);
  }, [page, fetchInvoices]);

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
      const verification = await apiClient<InvoiceVerificationResult>(
        `/invoices/${encodeURIComponent(invoice.invoiceId)}/verify-signature`,
        { method: 'POST' }
      );
      setNotice(verification);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.detail || requestError.message : 'Xác thực chữ ký số thất bại.');
    } finally {
      setVerifyingId(null);
    }
  }

  async function handleOpenPrint(invoiceId: string) {
    try {
      const detail = await apiClient<InvoiceDetail>(`/invoices/${encodeURIComponent(invoiceId)}`);
      setPrintData({
        invoiceNumber: detail.invoiceNumber,
        invoiceId: detail.invoiceId,
        createdDate: detail.createdDate,
        branchName: currentUser?.branchName,
        cashierName: detail.cashierId,
        customerName: detail.customerName,
        customerPhone: detail.customerPhone,
        items: detail.items.map(it => ({
          drugName: it.drugName,
          drugCode: it.drugCode,
          batchNo: it.batchId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          subTotal: it.subTotal,
        })),
        totalAmount: detail.totalAmount,
        signatureHash: detail.signature?.hashValueSha256,
        certSerial: detail.signature?.certificateSerial,
      });
      setShowPrintModal(true);
    } catch {
      setError('Không thể lấy dữ liệu để in hóa đơn.');
    }
  }

  async function handleCancelInvoice() {
    if (!selectedInvoice) return;
    if (cancelReason.trim().length < 5) {
      setCancelError('Lý do hủy phải có ít nhất 5 ký tự.');
      return;
    }

    setCancelling(true);
    setCancelError('');
    try {
      const res = await apiClient<{ message: string; invoiceId: string }>(
        `/invoices/${encodeURIComponent(selectedInvoice.invoiceId)}/cancel`,
        {
          method: 'POST',
          body: JSON.stringify({ reason: cancelReason.trim() }),
        }
      );

      // Update local state of detail
      setSelectedInvoice((prev) =>
        prev
          ? {
              ...prev,
              status: 'CANCELLED',
              cancelReason: cancelReason.trim(),
              cancelledByName: currentUser?.fullName || currentUser?.username,
              cancelledDate: new Date().toISOString(),
              signature: prev.signature
                ? {
                    ...prev.signature,
                    status: 'REVOKED',
                    revokedAt: new Date().toISOString(),
                    revokedReason: cancelReason.trim(),
                  }
                : null,
            }
          : null
      );

      setShowCancelModal(false);
      setCancelReason('');
      fetchInvoices(page);
      setNotice({
        isValid: false,
        message: res.message || 'Hóa đơn đã được hủy bỏ thành công. Toàn bộ số lượng thuốc đã được hoàn tồn kho.',
        invoiceId: selectedInvoice.invoiceId,
        invoiceNumber: selectedInvoice.invoiceNumber,
        signedAt: selectedInvoice.createdDate,
        certificateSerial: selectedInvoice.signature?.certificateSerial || 'HSM-REVOKED',
        storedHashSha256: selectedInvoice.signature?.hashValueSha256 || 'REVOKED',
        calculatedHashSha256: selectedInvoice.signature?.hashValueSha256 || 'REVOKED',
      });
    } catch (err) {
      setCancelError(err instanceof ApiError ? err.detail || err.message : 'Hủy hóa đơn thất bại.');
    } finally {
      setCancelling(false);
    }
  }

  const columns: Column<Invoice>[] = [
    {
      header: 'Số Hóa Đơn',
      cell: (invoice) => (
        <div>
          <p className="font-mono text-xs font-bold text-ink">{invoice.invoiceNumber}</p>
          <p className="mt-0.5 font-mono text-[9px] text-slate-400 truncate max-w-[150px]">{invoice.invoiceId}</p>
        </div>
      ),
    },
    {
      header: 'Thời Gian',
      cell: (invoice) => (
        <span className="text-slate-600 font-medium">
          {dateTime.format(new Date(invoice.createdDate))}
        </span>
      ),
    },
    {
      header: 'Thu Ngân',
      cell: (invoice) => <span className="font-mono text-slate-600">{invoice.cashierId}</span>,
    },
    {
      header: 'Trạng Thái',
      cell: (invoice) => {
        const isCancelled = invoice.status === 'CANCELLED';
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              isCancelled
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isCancelled ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            {isCancelled ? 'Đã hủy' : 'Đã thanh toán'}
          </span>
        );
      },
    },
    {
      header: 'Chứng Thực HSM',
      cell: (invoice) => (
        <HsmSignatureBadge status={invoice.status === 'CANCELLED' ? 'revoked' : 'valid'} />
      ),
    },
    {
      header: 'Tổng Tiền',
      align: 'right',
      cell: (invoice) => (
        <span className="font-display text-xs font-bold text-forest">
          {money.format(invoice.totalAmount)}
        </span>
      ),
    },
    {
      header: 'Thao Tác',
      align: 'right',
      cell: (invoice) => (
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenPrint(invoice.invoiceId)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
            title="In hóa đơn bán lẻ K80"
          >
            <Printer size={13} className="text-forest" />
            <span>In K80</span>
          </button>
          <button
            type="button"
            onClick={() => handleViewDetail(invoice.invoiceId)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <Eye size={13} />
            <span>Chi tiết</span>
          </button>
          <button
            type="button"
            onClick={() => verify(invoice)}
            disabled={verifyingId === invoice.invoiceId}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-forest/30 bg-mint px-2.5 text-xs font-semibold text-forest hover:bg-forest/15 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {verifyingId === invoice.invoiceId ? (
              <LoaderCircle size={13} className="animate-spin" />
            ) : (
              <ShieldCheck size={13} />
            )}
            <span>Xác thực</span>
          </button>
        </div>
      ),
    },
  ];

  const isOwner = currentUser?.role === 'OWNER';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-forest">Hóa đơn &amp; Bán hàng</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Hóa Đơn Điện Tử
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tra cứu chứng từ bán hàng và xác thực toàn vẹn chữ ký số HSM/SHA256.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs">
          <ShieldCheck size={16} className="text-forest" />
          <span>Chữ ký số SHA-256 &amp; RSA PKCS#1 v1.5</span>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <AlertBanner
          type={notice.isValid ? 'success' : 'error'}
          message={
            <div>
              <p className="font-bold">{notice.isValid ? 'Chữ ký số hợp lệ — Chứng từ nguyên vẹn' : 'Cảnh báo: Kiểm tra chữ ký số / Trạng thái hóa đơn'}</p>
              <p className="mt-0.5 opacity-90">{notice.message}</p>
              <p className="mt-1 font-mono text-[10px] text-slate-500">Cert: {notice.certificateSerial} | Ký lúc: {dateTime.format(new Date(notice.signedAt))}</p>
            </div>
          }
          onClose={() => setNotice(null)}
        />
      )}

      {/* Error alert */}
      <AlertBanner type="error" message={error} onClose={() => setError('')} />

      {/* Invoices DataTable */}
      <DataTable
        columns={columns}
        data={result?.items || []}
        keyExtractor={(invoice) => invoice.invoiceId}
        loading={loading}
        loadingText="Đang tải danh sách hóa đơn chi nhánh..."
        emptyMessage="Chưa có hóa đơn nào được lưu trữ tại chi nhánh này."
        pagination={{
          page,
          totalPages: result?.totalPages ?? 1,
          totalCount: result?.totalCount,
          onPageChange: setPage,
          itemLabel: 'hóa đơn',
        }}
      />

      {/* MODAL CHI TIẾT HÓA ĐƠN & CHỮ KÝ SỐ */}
      <Modal
        isOpen={Boolean(loadingDetail || selectedInvoice || detailError)}
        onClose={() => {
          setSelectedInvoice(null);
          setDetailError('');
        }}
        title="Chi Tiết Hóa Đơn Bán Hàng"
        subtitle={selectedInvoice ? `Mã chứng từ: ${selectedInvoice.invoiceNumber}` : undefined}
        icon={FileText}
        maxWidth="2xl"
        footer={
          selectedInvoice && (
            <div className="flex flex-wrap items-center justify-between w-full gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenPrint(selectedInvoice.invoiceId)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Printer size={15} />
                  <span>In Bản Sao (K80)</span>
                </button>
                {isOwner && selectedInvoice.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    onClick={() => {
                      setCancelReason('');
                      setCancelError('');
                      setShowCancelModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer transition-colors"
                  >
                    <XCircle size={15} />
                    <span>Hủy Hóa Đơn &amp; Hoàn Kho</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => verify(selectedInvoice)}
                  disabled={verifyingId === selectedInvoice.invoiceId}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-forest/30 bg-mint px-3.5 py-2 text-xs font-semibold text-forest hover:bg-forest/15 cursor-pointer disabled:opacity-50"
                >
                  {verifyingId === selectedInvoice.invoiceId ? (
                    <LoaderCircle size={15} className="animate-spin" />
                  ) : (
                    <ShieldCheck size={15} />
                  )}
                  <span>Xác Thực Chữ Ký</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          )
        }
      >
        {loadingDetail && (
          <div className="py-12 text-center text-xs font-medium text-slate-500">
            <LoaderCircle size={24} className="mx-auto mb-2 animate-spin text-forest" />
            Đang tải dữ liệu chi tiết hóa đơn...
          </div>
        )}

        <AlertBanner type="error" message={detailError} onClose={() => setDetailError('')} />

        {selectedInvoice && (
          <div className="space-y-5">
            {/* Banner Cảnh Báo Nếu Hóa Đơn Bị Hủy */}
            {selectedInvoice.status === 'CANCELLED' && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-xs">
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <XCircle size={16} className="text-rose-600" />
                  <span>HÓA ĐƠN ĐÃ HỦY BỎ — TOÀN BỘ SỐ LƯỢNG THUỐC ĐÃ HOÀN TỒN KHO</span>
                </div>
                <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] text-rose-700">
                  <div>
                    <span className="font-bold">Người thực hiện hủy: </span>
                    <span>{selectedInvoice.cancelledByName || selectedInvoice.cancelledById || 'Chủ nhà thuốc'}</span>
                  </div>
                  <div>
                    <span className="font-bold">Thời gian hủy: </span>
                    <span>{selectedInvoice.cancelledDate ? dateTime.format(new Date(selectedInvoice.cancelledDate)) : '—'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-bold">Lý do hủy: </span>
                    <span className="font-sans italic">{selectedInvoice.cancelReason || 'Không ghi rõ lý do'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Metadata Summary */}
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs sm:grid-cols-4">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Số hóa đơn</span>
                <span className="font-mono font-bold text-ink">{selectedInvoice.invoiceNumber}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Khách hàng</span>
                <span className="font-bold text-ink">{selectedInvoice.customerName || 'Khách lẻ vãng lai'}</span>
                {selectedInvoice.customerPhone && (
                  <span className="block font-mono text-[11px] text-slate-500">{selectedInvoice.customerPhone}</span>
                )}
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Thời gian lập</span>
                <span className="text-slate-700 font-medium">{dateTime.format(new Date(selectedInvoice.createdDate))}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Thu ngân</span>
                <span className="font-mono text-slate-700">@{selectedInvoice.cashierId}</span>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">Danh mục thuốc thanh toán</h4>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="p-3">Tên Thuốc</th>
                      <th className="p-3">Số Lô</th>
                      <th className="p-3 text-center">Số Lượng</th>
                      <th className="p-3 text-right">Đơn Giá</th>
                      <th className="p-3 text-right">Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.items?.map((item, idx) => (
                      <tr key={`${item.drugId}-${item.batchId}-${idx}`} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-ink">
                          {item.drugName}
                          <span className="block font-mono text-[10px] text-slate-400">{item.drugCode}</span>
                        </td>
                        <td className="p-3 font-mono text-slate-600">{item.batchId}</td>
                        <td className="p-3 text-center font-bold text-ink">{item.quantity}</td>
                        <td className="p-3 text-right font-mono text-slate-700">{money.format(item.unitPrice)}</td>
                        <td className="p-3 text-right font-mono font-bold text-forest">{money.format(item.subTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-slate-200 bg-slate-50/50 font-bold">
                    <tr>
                      <td colSpan={4} className="p-3 text-right text-slate-700">
                        Tổng cộng thanh toán:
                      </td>
                      <td className="p-3 text-right font-display text-sm text-forest">
                        {money.format(selectedInvoice.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Digital Signature Card */}
            {selectedInvoice.signature && (
              <div
                className={`rounded-xl border p-4 text-xs ${
                  selectedInvoice.signature.status === 'REVOKED' || selectedInvoice.status === 'CANCELLED'
                    ? 'border-rose-200 bg-rose-50/50'
                    : 'border-emerald-200 bg-emerald-50/50'
                }`}
              >
                <div
                  className={`flex items-center gap-2 font-bold ${
                    selectedInvoice.signature.status === 'REVOKED' || selectedInvoice.status === 'CANCELLED'
                      ? 'text-rose-800'
                      : 'text-emerald-800'
                  }`}
                >
                  {selectedInvoice.signature.status === 'REVOKED' || selectedInvoice.status === 'CANCELLED' ? (
                    <>
                      <Ban size={16} className="text-rose-600" />
                      <span>Chữ Ký Số Đã Bị Thu Hồi (Revoked HSM Signature)</span>
                    </>
                  ) : (
                    <>
                      <BadgeCheck size={16} className="text-emerald-600" />
                      <span>Chứng Thư Số Điện Tử Gốc (SHA-256 HSM)</span>
                    </>
                  )}
                </div>
                <div className="mt-2.5 space-y-1.5 font-mono text-[11px] text-slate-600">
                  <p>
                    <span className="font-bold text-slate-700">Cert Serial:</span> {selectedInvoice.signature.certificateSerial}
                  </p>
                  <p className="truncate">
                    <span className="font-bold text-slate-700">Mã Băm SHA256:</span> {selectedInvoice.signature.hashValueSha256}
                  </p>
                  <p>
                    <span className="font-bold text-slate-700">Thời điểm ký:</span> {dateTime.format(new Date(selectedInvoice.signature.signedAt))}
                  </p>
                  {(selectedInvoice.signature.revokedAt || selectedInvoice.status === 'CANCELLED') && (
                    <p className="text-rose-700 font-semibold">
                      <span className="font-bold">Thời điểm thu hồi:</span>{' '}
                      {selectedInvoice.signature.revokedAt
                        ? dateTime.format(new Date(selectedInvoice.signature.revokedAt))
                        : (selectedInvoice.cancelledDate ? dateTime.format(new Date(selectedInvoice.cancelledDate)) : '—')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL XÁC NHẬN HỦY HÓA ĐƠN & HOÀN TỒN KHO */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => !cancelling && setShowCancelModal(false)}
        title="Xác Nhận Hủy Hóa Đơn Bán Hàng"
        subtitle={selectedInvoice ? `Chứng từ: ${selectedInvoice.invoiceNumber}` : undefined}
        icon={AlertTriangle}
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              disabled={cancelling}
              onClick={() => setShowCancelModal(false)}
              className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer disabled:opacity-50"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              disabled={cancelling || cancelReason.trim().length < 5}
              onClick={handleCancelInvoice}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 cursor-pointer disabled:opacity-50"
            >
              {cancelling ? <LoaderCircle size={15} className="animate-spin" /> : <XCircle size={15} />}
              <span>Xác Nhận Hủy &amp; Hoàn Tồn</span>
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <AlertBanner type="error" message={cancelError} onClose={() => setCancelError('')} />

          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-amber-900 space-y-1.5">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle size={15} className="text-amber-600 shrink-0" />
              Cảnh báo quan trọng về pháp lý &amp; số liệu kho:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800/90 pl-1">
              <li>Hóa đơn sẽ chuyển sang trạng thái <strong>Đã hủy (CANCELLED)</strong> vĩnh viễn.</li>
              <li>Chữ ký số HSM tương ứng sẽ bị <strong>Thu hồi (REVOKED)</strong>.</li>
              <li>Toàn bộ số lượng thuốc trong hóa đơn sẽ được <strong>tự động hoàn trả về tồn kho</strong>.</li>
              <li>Lịch sử thẻ kho sẽ ghi nhận giao dịch <code>HOAN_HUY</code> phục vụ thanh tra.</li>
            </ul>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1.5">
              Lý do hủy hóa đơn <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do chi tiết (ví dụ: Khách trả lại ngay sau khi xuất đơn, quét nhầm thuốc... tối thiểu 5 ký tự)"
              className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-ink placeholder:text-slate-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Độ dài: {cancelReason.trim().length}/5 ký tự tối thiểu.
            </p>
          </div>
        </div>
      </Modal>

      {/* Modal In hóa đơn bán lẻ K80 */}
      <ReceiptPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        data={printData}
      />
    </div>
  );
}
