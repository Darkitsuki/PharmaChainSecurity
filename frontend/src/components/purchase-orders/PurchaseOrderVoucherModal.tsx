import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import type { PurchaseOrder } from '../../services/purchaseOrders';
import { dateLabel, money, orderLabel, OrderBadge } from './PurchaseOrderUi';

interface Props { isOpen: boolean; onClose: () => void; order: PurchaseOrder | null; branchName?: string }

const titles: Record<string, { title: string; subtitle: string }> = {
  PENDING: { title: 'Phiếu đề nghị mua thuốc', subtitle: 'Dự toán chờ duyệt' },
  APPROVED: { title: 'Phiếu đề nghị mua thuốc', subtitle: 'Đã duyệt chi phí dự kiến — chưa xác nhận đặt hàng' },
  ORDERED: { title: 'Phiếu đặt mua thuốc', subtitle: 'Đã xác nhận đặt hàng trên hệ thống' },
  RECEIVED: { title: 'Phiếu đặt mua thuốc', subtitle: 'Đã hoàn tất tiếp nhận hàng' },
  REJECTED: { title: 'Phiếu đề nghị mua thuốc', subtitle: 'Đã bị từ chối' },
  CANCELLED: { title: 'Phiếu đề nghị mua thuốc', subtitle: 'Đã hủy' },
};

function amountInWords(value: number) {
  if (!Number.isSafeInteger(value) || value < 0) return 'Không xác định';
  if (value === 0) return 'Không đồng';
  const digit = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const unit = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ'];
  const read = (number: number, full: boolean) => {
    const hundred = Math.floor(number / 100), ten = Math.floor(number % 100 / 10), one = number % 10;
    const words: string[] = [];
    if (hundred || full) words.push(digit[hundred], 'trăm');
    if (ten > 1) words.push(digit[ten], 'mươi'); else if (ten === 1) words.push('mười'); else if (one && (hundred || full)) words.push('lẻ');
    if (one) words.push(ten > 1 && one === 1 ? 'mốt' : ten > 0 && one === 5 ? 'lăm' : digit[one]);
    return words.join(' ');
  };
  const groups: number[] = [];
  for (let number = value; number > 0; number = Math.floor(number / 1000)) groups.push(number % 1000);
  const words: string[] = [];
  for (let index = groups.length - 1; index >= 0; index--) if (groups[index]) {
    words.push(read(groups[index], index < groups.length - 1 && groups[index] < 100), unit[index]);
  }
  const text = words.join(' ').replace(/\s+/g, ' ').trim();
  return `${text.charAt(0).toUpperCase()}${text.slice(1)} đồng.`;
}

export function PurchaseOrderVoucherModal({ isOpen, onClose, order, branchName }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    dialogRef.current?.focus();
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);
  if (!isOpen || !order) return null;
  const heading = titles[order.status] ?? { title: 'Phiếu đơn mua thuốc', subtitle: order.status };
  const approved = Boolean(order.approvedBy && order.approvedDate);

  const modal = <div data-purchase-order-print className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-3 backdrop-blur-xs" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={heading.title} tabIndex={-1} className="mx-auto my-4 w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl outline-none print:m-0 print:max-w-none print:overflow-visible print:rounded-none print:shadow-none">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-4 py-3 print:hidden">
        <strong className="text-sm text-ink">Xem trước phiếu đơn mua</strong>
        <div className="flex gap-2"><button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-white"><Printer size={15} />In A4</button><button type="button" onClick={onClose} aria-label="Đóng" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div>
      </div>
      <article id="purchase-order-voucher" className="mx-auto min-h-[270mm] w-full bg-white p-6 text-sm leading-relaxed text-slate-800 sm:p-10">
        <header className="border-b-2 border-forest pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-display text-lg font-bold text-forest">PharmaSecure</p><p className="mt-1 max-w-[440px] break-words text-slate-600"><strong>Chi nhánh:</strong> {branchName || 'Chưa xác định'}</p></div><div className="text-right"><p><strong>Số đơn:</strong> <span className="font-mono">{orderLabel(order.orderNo)}</span></p><p><strong>Ngày lập:</strong> {dateLabel(order.createdDate)}</p><div className="mt-2"><OrderBadge status={order.status} /></div></div></div>
          <div className="mt-5 text-center"><h1 className="font-display text-xl font-black uppercase text-ink">{heading.title}</h1><p className="mt-1 font-semibold text-slate-600">{heading.subtitle}</p></div>
        </header>

        <section className="grid grid-cols-1 gap-x-8 gap-y-3 border-b border-line py-5 sm:grid-cols-2">
          <p className="break-words"><span className="text-slate-500">Nhà cung cấp:</span><br/><strong>{order.supplierName}</strong></p>
          <p className="break-words"><span className="text-slate-500">Người lập:</span><br/><strong>{order.creatorName}</strong></p>
          <p><span className="text-slate-500">Ngày giao dự kiến:</span><br/><strong>{order.expectedDeliveryDate ? dateLabel(order.expectedDeliveryDate) : 'Chưa xác định'}</strong></p>
          <p className="break-words whitespace-pre-wrap"><span className="text-slate-500">Ghi chú:</span><br/><strong>{order.notes || 'Không có'}</strong></p>
        </section>

        <div className="my-5 overflow-x-auto print:overflow-visible"><table className="w-full table-fixed border-collapse text-left"><thead className="print:table-header-group"><tr className="bg-slate-100"><th className="w-10 border border-slate-300 p-2 text-center">STT</th><th className="border border-slate-300 p-2">Tên thuốc</th><th className="w-20 border border-slate-300 p-2 text-right">Số lượng</th><th className="w-32 border border-slate-300 p-2 text-right">Đơn giá dự kiến</th><th className="w-36 border border-slate-300 p-2 text-right">Thành tiền</th></tr></thead><tbody>{order.items.map((item, index) => <tr key={item.drugId} className="break-inside-avoid"><td className="border border-slate-300 p-2 text-center">{index + 1}</td><td className="break-words border border-slate-300 p-2"><strong>{item.drugName}</strong>{item.notes && <span className="mt-1 block whitespace-pre-wrap text-[10px] text-slate-500">{item.notes}</span>}</td><td className="border border-slate-300 p-2 text-right">{item.quantity.toLocaleString('vi-VN')}</td><td className="border border-slate-300 p-2 text-right">{money(item.estimatedUnitPrice)}</td><td className="border border-slate-300 p-2 text-right font-semibold">{money(item.subTotal)}</td></tr>)}</tbody><tfoot className="break-inside-avoid"><tr><td colSpan={4} className="border border-slate-300 p-3 text-right font-bold">Tổng dự toán</td><td className="border border-slate-300 p-3 text-right font-bold text-forest">{money(order.totalEstimatedAmount)}</td></tr></tfoot></table></div>

        <p className="break-inside-avoid rounded-lg bg-slate-50 p-3"><strong>Số tiền bằng chữ:</strong> {amountInWords(order.totalEstimatedAmount)}</p>
        <footer className="voucher-responsibility mt-8 grid break-inside-avoid grid-cols-1 gap-6 border-t border-line pt-6 sm:grid-cols-2">
          <section className="voucher-signature text-center"><p className="font-bold uppercase">Người lập phiếu</p><p className="text-xs text-slate-500">Ký và ghi rõ họ tên</p><div className="voucher-signature-space"/><p className="font-semibold">{order.creatorName}</p><p className="text-xs text-slate-500">Ghi nhận trên hệ thống: {dateLabel(order.createdDate)}</p></section>
          <section className="voucher-signature text-center"><p className="font-bold uppercase">Người phê duyệt chi phí</p><p className="text-xs text-slate-500">Ký và ghi rõ họ tên</p><div className="voucher-signature-space"/>{approved ? <><p className="font-semibold">{order.approverName || order.approvedBy}</p><p className="text-xs font-semibold text-emerald-700">Đã phê duyệt trên hệ thống</p><p className="text-xs text-slate-500">Thời gian: {dateLabel(order.approvedDate)}</p></> : <><p className="font-semibold text-slate-500">Chưa phê duyệt</p><p className="text-xs text-slate-500">Chưa có dữ liệu người phê duyệt.</p></>}</section>
        </footer>
      </article>
    </div>
    <style>{`
      .voucher-signature-space { min-height: 28mm; }
      @media print {
        @page { size: A4 portrait; margin: 12mm; }
        html, body { width: auto !important; height: auto !important; min-height: 0 !important; overflow: visible !important; background: #fff !important; }
        body > *:not([data-purchase-order-print]) { display: none !important; }
        [data-purchase-order-print] { display: block !important; position: static !important; inset: auto !important; overflow: visible !important; padding: 0 !important; background: #fff !important; backdrop-filter: none !important; }
        [data-purchase-order-print] > [role=dialog] { width: 100% !important; max-width: none !important; margin: 0 !important; overflow: visible !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
        [data-purchase-order-print] > [role=dialog] > :first-child { display: none !important; }
        #purchase-order-voucher { width: 100% !important; min-height: 0 !important; padding: 0 !important; font-size: 11pt !important; line-height: 1.45 !important; color: #111827 !important; }
        #purchase-order-voucher header { break-inside: avoid; }
        #purchase-order-voucher thead { display: table-header-group; }
        #purchase-order-voucher tfoot { display: table-row-group; }
        #purchase-order-voucher tr, #purchase-order-voucher .voucher-responsibility { break-inside: avoid; page-break-inside: avoid; }
        #purchase-order-voucher th, #purchase-order-voucher td { padding: 7px !important; }
        #purchase-order-voucher .voucher-signature-space { min-height: 30mm; }
      }
    `}</style>
  </div>;
  return createPortal(modal, document.body);
}
