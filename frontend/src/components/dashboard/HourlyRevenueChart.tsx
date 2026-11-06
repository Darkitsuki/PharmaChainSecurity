import { money } from '../../utils/formatters';
import React from 'react';
import { TrendingUp } from 'lucide-react';
import type { DailySalesItem } from '../../types';



export interface HourlyRevenueChartProps {
  dailySales?: DailySalesItem[];
}

export const HourlyRevenueChart: React.FC<HourlyRevenueChartProps> = ({
  dailySales = [],
}) => {
  const maxRevenue = Math.max(...dailySales.map((d) => d.revenue), 1);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-600" />
            Doanh thu theo ngày
          </h2>
          <p className="text-xs text-slate-500">
            Dữ liệu hóa đơn trong khoảng thời gian đã chọn
          </p>
        </div>

      </div>

      {/* Chart visualization */}
      <div className="mt-6 overflow-x-auto">
        {dailySales.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-slate-400">
            Chưa có dữ liệu giao dịch trong kỳ được chọn.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-2 items-end h-44 pt-4 border-b border-slate-100" style={{ gridTemplateColumns: `repeat(${dailySales.length}, minmax(0, 1fr))` }}>
              {dailySales.map((item, idx) => {
                const heightPercent = Math.max((item.revenue / maxRevenue) * 100, item.revenue > 0 ? 1 : 0);
                return (
                  <div key={idx} className="group relative flex flex-col items-center h-full justify-end" tabIndex={0} role="img" aria-label={`${item.date}: ${money.format(item.revenue)}, ${item.invoiceCount} hóa đơn`}>
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-1 hidden rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white group-hover:block group-focus:block transition-all shadow-md text-center z-10 whitespace-nowrap">
                      {money.format(item.revenue)}
                      <br />
                      <span className="text-slate-300 font-normal">{item.invoiceCount} hóa đơn</span>
                    </div>

                    {/* Bar */}
                    <div className="w-full max-w-[42px] rounded-t-lg bg-emerald-100 group-hover:bg-emerald-200 transition-colors flex flex-col justify-end overflow-hidden" style={{ height: `${heightPercent}%` }}>
                      <div
                        className="w-full bg-forest rounded-t-md transition-all duration-500"
                        style={{ height: '100%' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Labels */}
            <div className="grid gap-2 text-center" style={{ gridTemplateColumns: `repeat(${dailySales.length}, minmax(0, 1fr))` }}>
              {dailySales.map((item, idx) => {
                const dateParts = item.date.split('-');
                const label = dateParts.length >= 3 ? `${dateParts[2].slice(0,2)}/${dateParts[1]}` : item.date;
                return (
                  <div key={idx} className="text-xs font-medium text-slate-500 truncate">
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
