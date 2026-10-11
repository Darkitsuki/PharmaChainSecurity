import React from 'react';
import { TrendingUp, CreditCard, Banknote } from 'lucide-react';
import type { DailySalesItem } from '../../types';

const money = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export interface HourlyRevenueChartProps {
  dailySales?: DailySalesItem[];
  totalRevenue?: number;
}

export const HourlyRevenueChart: React.FC<HourlyRevenueChartProps> = ({
  dailySales = [],
  totalRevenue = 0,
}) => {
  const maxRevenue = Math.max(...dailySales.map((d) => d.revenue), 1);

  // Simulated split: 65% VietQR, 35% Cash (typical modern retail pharmacy in VN)
  const vietQrShare = Math.round(totalRevenue * 0.65);
  const cashShare = totalRevenue - vietQrShare;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-600" />
            Biểu đồ dòng tiền &amp; Doanh thu theo kỳ
          </h2>
          <p className="text-xs text-slate-500">
            Xu hướng thanh toán qua VietQR và Tiền mặt tại quầy bán
          </p>
        </div>

        {/* Payment breakdown pill */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <CreditCard size={14} className="text-blue-600" />
            <span>VietQR: <strong className="text-slate-900">{money.format(vietQrShare)}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <Banknote size={14} className="text-emerald-600" />
            <span>Tiền mặt: <strong className="text-slate-900">{money.format(cashShare)}</strong></span>
          </div>
        </div>
      </div>

      {/* Chart visualization */}
      <div className="mt-6">
        {dailySales.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-slate-400">
            Chưa có dữ liệu giao dịch trong kỳ được chọn.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-7 gap-2 items-end h-44 pt-4 border-b border-slate-100">
              {dailySales.map((item, idx) => {
                const heightPercent = Math.max(Math.round((item.revenue / maxRevenue) * 100), 6);
                return (
                  <div key={idx} className="group flex flex-col items-center h-full justify-end">
                    {/* Tooltip on hover */}
                    <div className="mb-1 hidden rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white group-hover:block transition-all shadow-md text-center z-10 whitespace-nowrap">
                      {money.format(item.revenue)}
                      <br />
                      <span className="text-slate-300 font-normal">{item.invoiceCount} hóa đơn</span>
                    </div>

                    {/* Bar */}
                    <div className="w-full max-w-[42px] rounded-t-lg bg-emerald-100 group-hover:bg-emerald-200 transition-colors flex flex-col justify-end overflow-hidden" style={{ height: `${heightPercent}%` }}>
                      <div
                        className="w-full bg-linear-to-t from-emerald-600 to-teal-500 rounded-t-md transition-all duration-500"
                        style={{ height: '100%' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Labels */}
            <div className="grid grid-cols-7 gap-2 text-center">
              {dailySales.map((item, idx) => {
                const dateParts = item.date.split('-');
                const label = dateParts.length >= 3 ? `${dateParts[2]}/${dateParts[1]}` : item.date;
                return (
                  <div key={idx} className="text-[11px] font-medium text-slate-500 truncate">
                    {label}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
