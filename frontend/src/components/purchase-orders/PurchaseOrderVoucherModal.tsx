import React from 'react';
import { Printer, X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { PurchaseOrder } from '../../services/purchaseOrders';
import { dateLabel, money, orderLabel } from './PurchaseOrderUi';

interface PurchaseOrderVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrder | null;
  branchName?: string;
}

// Chuyển đổi số tiền thành chữ tiếng Việt
function numberToVietnameseWords(amount: number): string {
  if (!amount || amount === 0) return 'Không đồng chẵn';
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readGroup(n: number, showZeroHundred: boolean): string {
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const d = n % 10;
    let res = '';

    if (h > 0 || showZeroHundred) {
      res += `${digits[h]} trăm `;
    }

    if (t === 0 && d > 0 && (h > 0 || showZeroHundred)) {
      res += 'lẻ ';
    } else if (t === 1) {
      res += 'mười ';
    } else if (t > 1) {
      res += `${digits[t]} mươi `;
    }

    if (t > 0 && d === 1) {
      res += t > 1 ? 'mốt' : 'một';
    } else if (t > 0 && d === 5) {
      res += 'lăm';
    } else if (d > 0) {
      res += digits[d];
    }

    return res.trim();
  }

  const rounded = Math.round(Math.abs(amount));
  let numStr = rounded.toString();
  const groups: number[] = [];
  while (numStr.length > 0) {
    const start = Math.max(0, numStr.length - 3);
    groups.push(parseInt(numStr.substring(start), 10));
    numStr = numStr.substring(0, start);
  }

  let words = '';
  for (let i = groups.length - 1; i >= 0; i--) {
    const grp = groups[i];
    if (grp > 0) {
      const showZero = i < groups.length - 1;
      const text = readGroup(grp, showZero);
      words += `${text} ${units[i]} `;
    }
  }

  const result = words.trim().replace(/\s+/g, ' ');
  const capitalized = result.charAt(0).toUpperCase() + result.slice(1);
  return `${capitalized} đồng chẵn.`;
}

export const PurchaseOrderVoucherModal: React.FC<PurchaseOrderVoucherModalProps> = ({
  isOpen,
  onClose,
  order,
  branchName,
}) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const isApproved = order.status === 'APPROVED' || order.status === 'ORDERED' || order.status === 'RECEIVED';
  const isPending = order.status === 'PENDING';

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col my-auto border border-slate-200 print:border-none print:shadow-none print:max-w-none print:w-full print:m-0"
      >
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3.5 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2 text-ink font-bold text-sm">
            <Printer size={18} className="text-forest" />
            <span>Xem trước &amp; In Phiếu Đặt Hàng Mua Thuốc</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-forest hover:bg-forest/90 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Printer size={15} />
              <span>In Phiếu (A4)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Voucher Document */}
        <div className="p-8 sm:p-12 text-slate-800 font-sans leading-relaxed print:p-0">
          {/* Header Organization & Voucher Metadata */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-forest pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-forest flex items-center justify-center text-white font-bold text-base">
                  PC
                </div>
                <div>
                  <h2 className="font-extrabold text-base tracking-tight text-forest uppercase">
                    HỆ THỐNG NHÀ THUỐC PHARMACHAIN
                  </h2>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Chuỗi Nhà Thuốc Đạt Chuẩn Thực Hành Tốt (GPP)
                  </p>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-600 space-y-0.5">
                <p>
                  <strong>Chi nhánh:</strong> {branchName}
                </p>
              </div>
            </div>

            <div className="sm:text-right text-xs text-slate-600 space-y-1">
              <p className="font-mono font-bold text-slate-800 text-sm">
                MẪU SỐ: 01-PO/GPP
              </p>
              <p>
                <strong>Mã đơn mua:</strong>{' '}
                <span className="font-mono font-semibold text-forest">{orderLabel(order.orderNo)}</span>
              </p>
              <p>
                <strong>Ngày lập:</strong> {dateLabel(order.createdDate)}
              </p>
              <div className="pt-1">
                {isApproved ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    <CheckCircle2 size={12} /> ĐÃ PHÊ DUYỆT BỞI CHỦ
                  </span>
                ) : isPending ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300">
                    <Clock size={12} /> CHỜ CHỦ PHÊ DUYỆT
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-300">
                    <AlertCircle size={12} /> {order.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center my-6">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
              ĐƠN ĐẶT HÀNG MUA THUỐC &amp; DỰ TOÁN KHO
            </h1>
            <p className="text-xs text-slate-500 italic mt-1">
              (Dự toán chi phí nhập hàng gửi Chủ nhà thuốc phê duyệt và đặt hàng Nhà cung ứng)
            </p>
          </div>

          {/* General Information Box */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 text-xs mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-slate-500">Đơn vị cung ứng (Nhà cung cấp):</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{order.supplierName}</p>
            </div>
            <div>
              <p className="text-slate-500">Người lập yêu cầu (Kho dược):</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{order.creatorName}</p>
            </div>
            <div>
              <p className="text-slate-500">Ngày giao hàng dự kiến:</p>
              <p className="font-semibold text-slate-800 mt-0.5">
                {order.expectedDeliveryDate ? dateLabel(order.expectedDeliveryDate) : 'Theo thỏa thuận đơn vị'}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Ghi chú &amp; Điều kiện giao hàng:</p>
              <p className="font-medium text-slate-700 mt-0.5 italic">
                {order.notes || 'Thuốc nhập kho phải có hóa đơn GTGT, CO/CQ, hạn dùng trên 12 tháng theo chuẩn GPP.'}
              </p>
            </div>
          </div>

          {/* Drug Items Table */}
          <div className="mb-6 overflow-hidden rounded-lg border border-slate-300">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px] uppercase">
                  <th className="py-2.5 px-3 text-center w-12 border-r border-slate-300">STT</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Tên thuốc &amp; Hoạt chất</th>
                  <th className="py-2.5 px-3 text-right w-24 border-r border-slate-300">SL Đặt</th>
                  <th className="py-2.5 px-3 text-right w-32 border-r border-slate-300">Đơn giá dự kiến</th>
                  <th className="py-2.5 px-3 text-right w-36">Thành tiền dự kiến</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items.map((item, index) => (
                  <tr key={item.drugId} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-center text-slate-500 border-r border-slate-200">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-200">
                      {item.drugName}
                      {item.notes && <span className="block text-[10px] text-slate-400 font-normal">{item.notes}</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 border-r border-slate-200">
                      {item.quantity.toLocaleString('vi-VN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 border-r border-slate-200">
                      {money(item.estimatedUnitPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {money(item.subTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50/90 font-bold text-xs">
                  <td colSpan={4} className="py-3 px-4 text-right text-slate-700 uppercase">
                    Tổng chi phí dự kiến:
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-sm text-forest font-extrabold">
                    {money(order.totalEstimatedAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Amount in words */}
          <div className="mb-8 p-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs">
            <span className="font-semibold text-slate-700">Số tiền bằng chữ: </span>
            <span className="italic font-bold text-slate-900">
              {numberToVietnameseWords(order.totalEstimatedAmount)}
            </span>
          </div>

          {/* Signatures Section */}
          <div className="grid grid-cols-3 gap-4 text-center text-xs pt-4 border-t border-slate-200 break-inside-avoid">
            <div>
              <p className="font-bold text-slate-800 uppercase">Người Lập Phiếu</p>
              <p className="text-[10px] text-slate-500 italic">(Ký, ghi rõ họ tên)</p>
              <div className="h-20 flex items-center justify-center">
                <span className="font-serif italic text-slate-400 font-semibold">{order.creatorName}</span>
              </div>
              <p className="font-semibold text-slate-800">{order.creatorName}</p>
              <p className="text-[10px] text-slate-400">Thủ kho dược chi nhánh</p>
            </div>

            <div>
              <p className="font-bold text-slate-800 uppercase">Chủ Nhà Thuốc Phê Duyệt</p>
              <p className="text-[10px] text-slate-500 italic">(Ký duyệt dự toán)</p>
              <div className="h-20 flex flex-col items-center justify-center">
                {isApproved ? (
                  <div className="rounded border border-emerald-500 bg-emerald-50/70 p-1.5 text-center">
                    <span className="text-[10px] font-extrabold text-emerald-800 tracking-wider uppercase block">
                      ✓ ĐÃ PHÊ DUYỆT
                    </span>
                    <span className="text-[9px] font-mono text-emerald-700">
                      {order.approverName || 'Chủ nhà thuốc'}
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-amber-600 font-semibold italic">
                    (Chờ duyệt chi phí)
                  </span>
                )}
              </div>
              <p className="font-semibold text-slate-800">
                {order.approverName || 'Chủ nhà thuốc'}
              </p>
              <p className="text-[10px] text-slate-400">
                {order.approvedDate ? `Đã duyệt ngày ${dateLabel(order.approvedDate)}` : 'Ban Quản trị / Giám đốc'}
              </p>
            </div>

            <div>
              <p className="font-bold text-slate-800 uppercase">Đại Diện Nhà Cung Cấp</p>
              <p className="text-[10px] text-slate-500 italic">(Ký, xác nhận nhận đơn)</p>
              <div className="h-20 flex items-center justify-center">
                <span className="text-[11px] text-slate-300 italic">(Ký khi giao nhận)</span>
              </div>
              <p className="font-semibold text-slate-800">{order.supplierName}</p>
              <p className="text-[10px] text-slate-400">Đơn vị tiếp nhận đơn</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

