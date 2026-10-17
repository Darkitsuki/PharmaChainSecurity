import { useEffect, useState } from 'react';
import {
  BadgeCheck,
  Eye,
  FileText,
  LoaderCircle,
  Printer,
  ShieldCheck,
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

  // Print Receipt State
  const [printData, setPrintData] = useState<ReceiptData | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    apiClient<PageResult<Invoice>>(`/invoices?page=${page}&pageSize=20`)
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError instanceof ApiError ? requestError.detail || requestError.message : 'Không thể tải danh sách hóa đơn.'
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
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
      header: 'Chứng Thực HSM',
      cell: () => <HsmSignatureBadge status="valid" />,
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
              <p className="font-bold">{notice.isValid ? 'Chữ ký số hợp lệ — Chứng từ nguyên vẹn' : 'Cảnh báo: Kiểm tra chữ ký số thất bại'}</p>
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
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => handleOpenPrint(selectedInvoice.invoiceId)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Printer size={15} />
                <span>In Bản Sao (K80)</span>
              </button>
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
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-xs">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <BadgeCheck size={16} className="text-emerald-600" />
                  <span>Chứng Thư Số Điện Tử Gốc (SHA-256 HSM)</span>
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
                </div>
              </div>
            )}
          </div>
        )}
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
