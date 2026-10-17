import React, { useRef } from 'react';
import { Printer, QrCode, ShieldCheck, X } from 'lucide-react';

export interface ReceiptItem {
  drugName: string;
  drugCode?: string;
  batchNo: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

export interface ReceiptData {
  invoiceNumber: string;
  invoiceId?: string;
  createdDate?: string;
  branchName?: string;
  branchAddress?: string;
  cashierName?: string;
  customerName?: string | null;
  customerPhone?: string | null;
  items: ReceiptItem[];
  totalAmount: number;
  signatureHash?: string | null;
  certSerial?: string | null;
}

interface ReceiptPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReceiptData | null;
}

const moneyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const createdDateFormatted = data.createdDate
    ? new Date(data.createdDate).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleString('vi-VN');

  const verifyUrl = `${window.location.origin}/invoices?search=${encodeURIComponent(data.invoiceNumber)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(verifyUrl)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-xs overflow-y-auto"
      role="presentation"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[460px] rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col my-auto"
      >
        {/* Modal Top Actions */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2 text-ink font-semibold text-xs">
            <Printer size={16} className="text-forest" />
            <span>Xem trước & In hóa đơn bán lẻ</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-forest hover:bg-forest-dark text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Printer size={14} />
              <span>In ngay (K80)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-70px)] bg-slate-100/60 print:bg-white print:p-0 print:max-h-none">
          <div
            ref={printRef}
            id="printable-receipt"
            className="receipt-content bg-white p-6 rounded-xl shadow-xs border border-slate-200 mx-auto max-w-[380px] text-ink font-sans print:shadow-none print:border-none print:p-0 print:max-w-full"
          >
            {/* Header Nhà thuốc */}
            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <h2 className="font-extrabold text-base tracking-wider uppercase text-forest font-display">
                PharmaSecure
              </h2>
              <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide mt-0.5">
                {data.branchName || 'Nhà thuốc PharmaSecure'}
              </p>
              {data.branchAddress && (
                <p className="text-[10px] text-slate-500 mt-1 max-w-[280px] mx-auto leading-tight">
                  {data.branchAddress}
                </p>
              )}
              <p className="text-[10px] text-slate-500 mt-0.5">Hotline: 1900 6868 · CSKH 24/7</p>

              <div className="mt-3 inline-block bg-slate-100 text-slate-800 px-3 py-1 rounded text-[11px] font-extrabold tracking-wider uppercase">
                Hóa đơn bán lẻ
              </div>
            </div>

            {/* Thông tin hóa đơn */}
            <div className="py-3 text-[11px] space-y-1 border-b border-dashed border-slate-300 text-slate-600">
              <div className="flex justify-between">
                <span>Số HĐ:</span>
                <span className="font-mono font-bold text-ink">{data.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Ngày in:</span>
                <span>{createdDateFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span>Dược sĩ bán:</span>
                <span className="font-medium text-ink">{data.cashierName || 'Dược sĩ quầy'}</span>
              </div>
              <div className="flex justify-between">
                <span>Khách hàng:</span>
                <span className="font-semibold text-ink">
                  {data.customerName ? `${data.customerName} (${data.customerPhone || ''})` : 'Khách lẻ vãng lai'}
                </span>
              </div>
            </div>

            {/* Danh sách mặt hàng */}
            <div className="py-3 border-b border-dashed border-slate-300">
              <div className="grid grid-cols-[minmax(0,1fr)_50px_70px] text-[10px] font-bold text-slate-500 uppercase pb-1.5 border-b border-slate-200">
                <span>Tên thuốc / Số lô</span>
                <span className="text-center">SL</span>
                <span className="text-right">T.Tiền</span>
              </div>

              <div className="divide-y divide-slate-100">
                {data.items.map((item, index) => (
                  <div key={index} className="py-2 text-[11px]">
                    <div className="font-semibold text-ink leading-tight">{item.drugName}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                      <span>Lô: {item.batchNo}</span>
                      <span className="text-slate-600">
                        {item.quantity} x {moneyFormatter.format(item.unitPrice)}
                      </span>
                      <span className="font-mono font-bold text-ink text-right">
                        {moneyFormatter.format(item.subTotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tổng kết tiền */}
            <div className="py-3 space-y-1.5 border-b border-dashed border-slate-300 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Tổng tiền hàng:</span>
                <span className="font-mono">{moneyFormatter.format(data.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Chiết khấu:</span>
                <span className="font-mono">0 đ</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-ink pt-1 border-t border-slate-200">
                <span>Tổng thanh toán:</span>
                <span className="font-mono text-forest text-base">
                  {moneyFormatter.format(data.totalAmount)}
                </span>
              </div>
            </div>

            {/* Xác thực Chữ ký số & QR Code */}
            <div className="pt-4 pb-2 text-center space-y-3">
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-forest bg-mint/50 py-1.5 px-3 rounded-lg border border-forest/20">
                <ShieldCheck size={14} className="shrink-0" />
                <span>Đã ký số điện tử bảo mật (HSM PKCS#11)</span>
              </div>

              {data.signatureHash && (
                <div className="text-left bg-slate-50 p-2.5 rounded border border-slate-200 text-[9.5px] font-mono leading-tight break-all text-slate-600">
                  <span className="font-bold block text-slate-500 uppercase text-[9px] mb-0.5">
                    Hash SHA-256 (Ledger Invariant):
                  </span>
                  {data.signatureHash}
                </div>
              )}

              {/* QR Code đối soát */}
              <div className="flex flex-col items-center justify-center pt-1">
                <img
                  src={qrCodeUrl}
                  alt="Mã QR tra cứu hóa đơn"
                  className="w-24 h-24 rounded border border-slate-200 p-1 bg-white shadow-2xs"
                  loading="lazy"
                />
                <span className="text-[9.5px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <QrCode size={11} /> Quét mã QR để đối soát tính toàn vẹn hóa đơn
                </span>
              </div>

              {/* Lời cảm ơn */}
              <div className="pt-2 text-[10.5px] text-slate-500 italic">
                Cảm ơn Quý khách &amp; Chúc Quý khách nhiều sức khỏe!
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Print Button */}
        <div className="p-4 border-t border-line bg-slate-50 flex justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 bg-forest hover:bg-forest-dark text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Printer size={15} />
            <span>In hóa đơn (K80 / Máy in nhiệt)</span>
          </button>
        </div>
      </div>

      {/* Global CSS for Print Mode */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible !important;
          }
          #printable-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 8px !important;
            border: none !important;
            box-shadow: none !important;
            font-size: 11px !important;
            line-height: 1.3 !important;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};
