import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  Calendar,
  CircleAlert,
  Coins,
  FileSpreadsheet,
  FileText,
  LoaderCircle,
  Package,
  Pill,
  RefreshCw,
  TrendingUp,
  X
} from 'lucide-react';
import { ApiError, apiClient } from '../services/apiClient';
import type { SalesSummaryReport } from '../types';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

export function ReportsPage() {
  const [days, setDays] = useState<number>(7);
  const [report, setReport] = useState<SalesSummaryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReport(days);
  }, [days]);

  async function loadReport(selectedDays: number) {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient<SalesSummaryReport>(`/reports/sales-summary?days=${selectedDays}`);
      setReport(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || err.message);
      } else {
        setError('Failed to load branch sales report.');
      }
    } finally {
      setLoading(false);
    }
  }

  // Calculate maximum daily revenue for bar scaling
  const maxDailyRevenue = report?.dailySales?.length
    ? Math.max(...report.dailySales.map(d => d.revenue), 1)
    : 1;

  const averageOrderValue = report && report.totalInvoices > 0
    ? report.totalRevenue / report.totalInvoices
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-forest text-white shadow-sm">
              <BarChart3 size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Sales & Revenue Analytics
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Authoritative branch revenue insights, retail invoices, and top-selling drug statistics.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-line bg-white p-1 shadow-sm">
            {[7, 14, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  days === d
                    ? 'bg-forest text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>

          <button
            onClick={() => loadReport(days)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-ink disabled:opacity-60"
            title="Refresh analytics data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <CircleAlert size={18} className="mt-0.5 shrink-0 text-rose-600" />
          <div className="flex-1 font-medium">{error}</div>
          <button onClick={() => setError('')} className="text-rose-600 hover:text-rose-800">
            <X size={16} />
          </button>
        </div>
      )}

      {loading && !report ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <LoaderCircle size={40} className="animate-spin text-forest" />
          <p className="mt-4 text-xs font-semibold">Aggregating branch financial transactions...</p>
        </div>
      ) : report ? (
        <div className="mt-8 space-y-8">
          {/* Key KPI Metric Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Window Revenue */}
            <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {days}-Day Revenue
                </span>
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-mint text-forest">
                  <Coins size={17} />
                </div>
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-ink">
                {money.format(report.totalRevenue)}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <FileText size={14} className="text-slate-400" />
                <span>{report.totalInvoices} completed invoices</span>
              </div>
            </div>

            {/* Today Revenue */}
            <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Today's Sales
                </span>
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                  <TrendingUp size={17} />
                </div>
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-ink">
                {money.format(report.todayRevenue)}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar size={14} className="text-slate-400" />
                <span>{report.todayInvoices} invoices today</span>
              </div>
            </div>

            {/* Month-to-date Revenue */}
            <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Month-to-Date
                </span>
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-700">
                  <FileSpreadsheet size={17} />
                </div>
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-ink">
                {money.format(report.monthRevenue)}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <ArrowUpRight size={14} className="text-blue-500" />
                <span>{report.monthInvoices} invoices this month</span>
              </div>
            </div>

            {/* Average Order Value (AOV) */}
            <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Average Order Value
                </span>
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-purple-50 text-purple-700">
                  <Package size={17} />
                </div>
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-ink">
                {money.format(averageOrderValue)}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <span>Per completed checkout transaction</span>
              </div>
            </div>
          </div>

          {/* Grid Layout: Top Selling Drugs & Daily Breakdown */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Top Selling Drugs */}
            <div className="rounded-2xl border border-line bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-700">
                    <Pill size={17} />
                  </div>
                  <div>
                    <h2 className="font-display text-sm font-bold text-ink">Top 5 Selling Drugs</h2>
                    <p className="text-xs text-slate-500">Highest revenue drivers for the past {days} days.</p>
                  </div>
                </div>
              </div>

              {report.topSellingDrugs.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No sales recorded in this timeframe.
                </div>
              ) : (
                <div className="mt-4 divide-y divide-line/60">
                  {report.topSellingDrugs.map((item, index) => {
                    const percent = report.totalRevenue > 0
                      ? Math.round((item.totalRevenue / report.totalRevenue) * 100)
                      : 0;

                    return (
                      <div key={item.drugId} className="py-3.5 first:pt-2 last:pb-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 font-display text-xs font-bold text-slate-600">
                              #{index + 1}
                            </span>
                            <div>
                              <p className="text-xs font-bold text-ink">{item.drugName}</p>
                              <p className="text-[11px] font-mono text-slate-400">{item.drugCode}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-ink">{money.format(item.totalRevenue)}</p>
                            <p className="text-[11px] text-slate-500">{item.totalQuantitySold} units sold</p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-2.5 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-forest transition-all duration-500"
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400 w-8 text-right">
                            {percent}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Daily Revenue Distribution */}
            <div className="rounded-2xl border border-line bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-mint text-forest">
                    <BarChart3 size={17} />
                  </div>
                  <div>
                    <h2 className="font-display text-sm font-bold text-ink">Daily Sales Trajectory</h2>
                    <p className="text-xs text-slate-500">Day-by-day sales revenue and volume.</p>
                  </div>
                </div>
              </div>

              {report.dailySales.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No sales recorded in this timeframe.
                </div>
              ) : (
                <div className="mt-4 space-y-3.5">
                  {report.dailySales.slice(-7).map(item => {
                    const ratio = Math.max(Math.round((item.revenue / maxDailyRevenue) * 100), 4);
                    return (
                      <div key={item.date} className="flex items-center gap-3">
                        <span className="w-20 shrink-0 font-mono text-[11px] font-medium text-slate-500">
                          {item.date}
                        </span>
                        <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-slate-50 p-1">
                          <div
                            className="h-full rounded-md bg-forest/85 transition-all duration-500 flex items-center justify-end px-2"
                            style={{ width: `${ratio}%` }}
                          >
                            {ratio > 30 && (
                              <span className="text-[10px] font-bold text-white">
                                {money.format(item.revenue)}
                              </span>
                            )}
                          </div>
                        </div>
                        {ratio <= 30 && (
                          <span className="w-24 shrink-0 text-right text-xs font-semibold text-ink">
                            {money.format(item.revenue)}
                          </span>
                        )}
                        <span className="w-14 shrink-0 text-right text-[11px] text-slate-400">
                          {item.invoiceCount} inv
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
