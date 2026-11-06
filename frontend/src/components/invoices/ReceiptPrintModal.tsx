import React, { useLayoutEffect, useRef, useState } from 'react';
import { Printer } from 'lucide-react';
import { Modal } from '../common/Modal';
import { money, dateTime } from '../../utils/formatters';

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
  status?: string;
  paymentStatus?: string;
  signatureHash?: string | null;
  certSerial?: string | null;
}

interface ReceiptPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReceiptData | null;
}



export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({ isOpen, onClose, data }) => {
  const [paper, setPaper] = useState<'A4' | 'K80'>('A4');
  const [paperHeight, setPaperHeight] = useState(160);
  const receiptRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!isOpen || paper !== 'K80' || !receiptRef.current) return;
    const receipt = receiptRef.current;
    const measure = () => setPaperHeight(Math.max(50, Math.ceil(receipt.scrollHeight * 25.4 / 96 + 6)));
    const observer = new ResizeObserver(measure);
    observer.observe(receipt);
    void document.fonts.ready.then(measure);
    measure();
    return () => observer.disconnect();
  }, [isOpen, paper, data]);
  if (!data) return null;
  return <Modal isOpen={isOpen} onClose={onClose} title="In hóa đơn" subtitle={paper === 'A4' ? 'A4 / PDF · Bố cục đầy đủ, dễ đọc' : 'K80 · Chọn máy in nhiệt và khổ giấy 80 mm'} maxWidth={paper === 'A4' ? '3xl' : 'md'} printable
    footer={<><button type="button" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50" onClick={onClose}>Quay lại</button>
      <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-forest px-3 py-2 text-sm font-semibold text-white hover:bg-forest-dark" onClick={() => window.print()}><Printer size={16} /> In hóa đơn</button></>}>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4" data-print-controls>
      <label className="flex items-center gap-3 text-sm font-medium">Khổ giấy
        <select aria-label="Khổ giấy in" value={paper} onChange={event => setPaper(event.target.value as 'A4' | 'K80')} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <option value="A4">A4 / Lưu PDF</option><option value="K80">K80 — Máy in nhiệt</option>
        </select>
      </label>
      <p className="text-xs text-slate-500">{paper === 'A4' ? 'Chọn giấy A4 khi lưu PDF.' : 'Chọn giấy 80 mm, tỷ lệ 100% trong hộp thoại in.'}</p>
    </div>
    <div ref={receiptRef} id="printable-receipt" className={`receipt-sheet receipt-${paper.toLowerCase()}`}>
      <header className="receipt-heading">
        {data.branchName && <p className="receipt-branch">{data.branchName}</p>}
        {data.branchAddress && <p className="receipt-address">{data.branchAddress}</p>}
        <h3>HÓA ĐƠN BÁN HÀNG</h3>
        {data.status === 'CANCELLED' && <p className="receipt-state">HÓA ĐƠN ĐÃ HỦY</p>}
        {data.status !== 'CANCELLED' && data.paymentStatus === 'PENDING' && <p className="receipt-state">CHỜ THANH TOÁN</p>}
        <p className="receipt-number">{data.invoiceNumber}</p>
      </header>
      <div className="receipt-information">
        <p><span>Ngày lập:</span> {data.createdDate ? dateTime.format(new Date(data.createdDate)) : 'Chưa có thông tin'}</p>
        <p><span>Thu ngân:</span> {data.cashierName || 'Chưa có thông tin thu ngân'}</p>
        <p><span>Khách hàng:</span> {data.customerName || 'Khách lẻ'}</p>
        {data.customerPhone && <p><span>Điện thoại:</span> {data.customerPhone}</p>}
      </div>
      <div className="receipt-items">
        {data.items.map((item, index) => <div key={index} className="receipt-item">
          <div className="receipt-drug"><p className="receipt-drug-name">{item.drugName}</p><p className="receipt-drug-meta">{item.drugCode}{item.batchNo ? ` · Lô ${item.batchNo}` : ''}</p></div>
          <div className="receipt-amounts"><span>{item.quantity} {item.unit || ''} × {money.format(item.unitPrice)}</span><strong>{money.format(item.subTotal)}</strong></div>
        </div>)}
      </div>
      <div className="receipt-total"><span>Tổng thanh toán</span><strong>{money.format(data.totalAmount)}</strong></div>
    </div>
    <style>{`
      .receipt-sheet { color: #172f2b; background: white; font-family: inherit; line-height: 1.5; margin: 0 auto; overflow-wrap: anywhere; }
      .receipt-a4 { width: 100%; font-size: 14px; }
      .receipt-k80 { width: 74mm; max-width: 100%; font-size: 12px; }
      .receipt-heading { text-align: center; border-bottom: 1px solid #cbd5e1; padding-bottom: 14px; }
      .receipt-branch { font-weight: 700; font-size: 1.15em; }
      .receipt-address { margin-top: 3px; font-size: .9em; }
      .receipt-heading h3 { font-size: 1.35em; font-weight: 750; margin-top: 14px; }
      .receipt-number { margin-top: 5px; font-weight: 600; }
      .receipt-state { font-weight: 700; margin-top: 6px; }
      .receipt-information { display: grid; gap: 6px 20px; padding: 14px 0; border-bottom: 1px solid #cbd5e1; }
      .receipt-a4 .receipt-information { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .receipt-information span { color: #475569; }
      .receipt-item { padding: 12px 0; border-bottom: 1px solid #e2e8f0; break-inside: avoid; }
      .receipt-drug-name { font-weight: 600; }
      .receipt-drug-meta { margin-top: 2px; font-size: .85em; color: #475569; }
      .receipt-amounts { display: flex; justify-content: space-between; gap: 12px; margin-top: 6px; font-variant-numeric: tabular-nums; }
      .receipt-amounts strong { white-space: nowrap; }
      .receipt-a4 .receipt-item { display: grid; grid-template-columns: minmax(0, 1fr) minmax(180px, .8fr); gap: 20px; }
      .receipt-total { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px 12px; border-top: 1px solid #64748b; padding-top: 14px; margin-top: 8px; font-weight: 700; font-size: 1.15em; font-variant-numeric: tabular-nums; }
      .receipt-total strong { white-space: nowrap; }
      @media screen and (max-width: 600px) {
        .receipt-a4 .receipt-information, .receipt-a4 .receipt-item { grid-template-columns: minmax(0, 1fr); gap: 6px; }
      }
      @media print {
        @page { size: ${paper === 'A4' ? 'A4' : `80mm ${paperHeight}mm`}; margin: ${paper === 'A4' ? '12mm' : '3mm'}; }
        html, body { height: auto !important; min-height: 0 !important; overflow: visible !important; background: white !important; }
        body > *:not([data-print-modal]) { display: none !important; }
        [data-print-modal] { display: block !important; position: static !important; padding: 0 !important; background: white !important; backdrop-filter: none !important; animation: none !important; }
        [data-print-modal] [role=dialog] { display: block !important; width: 100% !important; max-width: none !important; max-height: none !important; overflow: visible !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; animation: none !important; }
        [data-print-modal] [role=dialog] > :first-child, [data-print-modal] [role=dialog] > :last-child, [data-print-controls] { display: none !important; }
        [data-print-modal] [role=dialog] > :nth-child(2) { display: block !important; padding: 0 !important; overflow: visible !important; }
        #printable-receipt { padding: 0 !important; margin: 0 auto !important; }
        .receipt-a4 { width: 100% !important; max-width: none !important; font-size: 11pt; }
        .receipt-k80 { width: 74mm !important; max-width: 74mm !important; font-size: 12px; }
      }
    `}</style>
  </Modal>;
};
