import { useEffect, useState } from 'react';
import { CircleAlert, LoaderCircle, X, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError, apiClient } from '../services/apiClient';
import type { Invoice, InventoryAlert, PageResult, SalesSummaryReport } from '../types';

// Dashboard components
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { DashboardKpiCards } from '../components/dashboard/DashboardKpiCards';
import { HourlyRevenueChart } from '../components/dashboard/HourlyRevenueChart';
import { FefoInventoryCard } from '../components/dashboard/FefoInventoryCard';
import { RecentInvoicesCard } from '../components/dashboard/RecentInvoicesCard';
import { PendingExpensesCard } from '../components/dashboard/PendingExpensesCard';
import { SecurityAuditBanner } from '../components/dashboard/SecurityAuditBanner';

const money = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export function ReportsPage() {
  const { currentUser } = useAuth();
  const [days, setDays] = useState<number>(7);
  const [report, setReport] = useState<SalesSummaryReport | null>(null);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAllDashboardData(days);
  }, [days]);

  async function loadAllDashboardData(selectedDays: number) {
    setLoading(true);
    setError('');
    try {
      const [reportData, alertsData, invoicesData] = await Promise.allSettled([
        apiClient<SalesSummaryReport>(`/reports/sales-summary?days=${selectedDays}`),
        apiClient<InventoryAlert[]>('/inventory/expiring-soon?days=90'),
        apiClient<PageResult<Invoice>>('/invoices?page=1&pageSize=6'),
      ]);

      if (reportData.status === 'fulfilled') {
        setReport(reportData.value);
      } else {
        const err = reportData.reason;
        setError(err instanceof ApiError ? err.detail || err.message : 'Không thể tải báo cáo doanh thu.');
      }

      if (alertsData.status === 'fulfilled') {
        setAlerts(alertsData.value || []);
      }

      if (invoicesData.status === 'fulfilled') {
        setInvoices(invoicesData.value?.items || []);
      }
    } catch (err) {
      setError('Lỗi khi tải dữ liệu tổng quan chi nhánh.');
    } finally {
      setLoading(false);
    }
  }

  function handleExportCsv() {
    if (!report) return;
    const header = 'Ngay,DoanhThu,SoHoaDon\n';
    const rows = (report.dailySales || [])
      .map((d) => `${d.date},${d.revenue},${d.invoiceCount}`)
      .join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BaoCao_ChiNhanh_${currentUser?.branchId || 'CN01'}_${days}ngay.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* 1. Header with RLS Scope & Time Selector */}
      <DashboardHeader
        branchName={currentUser?.branchName || 'Chi nhánh 01'}
        branchId={currentUser?.branchId || 'CN01'}
        days={days}
        onDaysChange={setDays}
        onRefresh={() => loadAllDashboardData(days)}
        onExport={handleExportCsv}
        loading={loading}
      />

      {/* Error alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
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
          <p className="mt-3 text-xs font-medium text-slate-500">
            Đang tổng hợp dữ liệu doanh thu &amp; kiểm tra cô lập an toàn chi nhánh...
          </p>
        </div>
      ) : report ? (
        <>
          {/* 2. Top 4 KPI Cards */}
          <DashboardKpiCards
            totalRevenue={report.totalRevenue}
            totalInvoices={report.totalInvoices}
            hsmCompliantPercent={100}
            expiringBatchesCount={alerts.length}
            cashDrawerAmount={4500000}
            pendingExpensesCount={2}
          />

          {/* 3. Middle Section: Revenue Trend & Top Selling Drugs */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Revenue Trend Chart (2 cols) */}
            <div className="lg:col-span-2">
              <HourlyRevenueChart
                dailySales={report.dailySales}
                totalRevenue={report.totalRevenue}
              />
            </div>

            {/* Top Selling Drugs (1 col) */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Trophy size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900">
                    Thuốc bán chạy hàng đầu
                  </h2>
                  <p className="text-xs text-slate-500">Doanh số cao nhất theo số lượng</p>
                </div>
              </div>

              <div className="mt-4 flex-1">
                {report.topSellingDrugs.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Chưa có giao dịch thuốc trong kỳ này.
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {report.topSellingDrugs.slice(0, 5).map((drug, idx) => (
                      <div key={drug.drugId} className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                            idx === 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{drug.drugName}</p>
                            <p className="text-[11px] text-slate-400">
                              Đã bán: <strong className="text-slate-700">{drug.totalQuantitySold}</strong> đơn vị
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 font-display font-semibold text-slate-800">
                          {money.format(drug.totalRevenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Lower Grid: FEFO Expiry Management & Recent Invoices */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <FefoInventoryCard alerts={alerts} loading={loading} />
            <RecentInvoicesCard invoices={invoices} loading={loading} />
          </div>

          {/* 5. Owner Petty Cash Approval */}
          <PendingExpensesCard />

          {/* 6. Security Assurance & Legal Compliance Banner */}
          <SecurityAuditBanner branchId={currentUser?.branchId || 'CN01'} />
        </>
      ) : null}
    </div>
  );
}
