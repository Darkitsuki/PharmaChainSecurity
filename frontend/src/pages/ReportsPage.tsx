import { money } from '../utils/formatters';
import { useEffect, useRef, useState } from 'react';
import { CircleAlert, LoaderCircle, X, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError, apiClient } from '../services/apiClient';
import type { Invoice, InventoryAlert, PageResult, SalesSummaryReport } from '../types';
import type { PurchaseOrder } from '../services/purchaseOrders';

// Dashboard components
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { DashboardKpiCards } from '../components/dashboard/DashboardKpiCards';
import { HourlyRevenueChart } from '../components/dashboard/HourlyRevenueChart';
import { FefoInventoryCard } from '../components/dashboard/FefoInventoryCard';
import { RecentInvoicesCard } from '../components/dashboard/RecentInvoicesCard';
import { PendingExpensesCard } from '../components/dashboard/PendingExpensesCard';
import { SecurityAuditBanner } from '../components/dashboard/SecurityAuditBanner';



export function ReportsPage() {
  const { currentUser } = useAuth();
  const [days, setDays] = useState<number>(7);
  const [report, setReport] = useState<SalesSummaryReport | null>(null);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestVersion = useRef(0);

  useEffect(() => {
    loadAllDashboardData(days);
  }, [days]);

  async function loadAllDashboardData(selectedDays: number) {
    const version = ++requestVersion.current;
    setLoading(true);
    setError('');
    try {
      const [reportData, alertsData, invoicesData, pendingOrdersData] = await Promise.allSettled([
        apiClient<SalesSummaryReport>(`/reports/sales-summary?days=${selectedDays}`),
        apiClient<InventoryAlert[]>('/inventory/expiring-soon?days=90'),
        apiClient<PageResult<Invoice>>('/invoices?page=1&pageSize=6'),
        apiClient<PageResult<PurchaseOrder>>('/purchase-orders?status=PENDING&page=1&pageSize=5'),
      ]);
      if (version !== requestVersion.current) return;

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
      setPendingOrdersCount(pendingOrdersData.status === 'fulfilled' ? pendingOrdersData.value.totalCount : null);
    } catch (err) {
      if (version !== requestVersion.current) return;
      setError('Lỗi khi tải dữ liệu tổng quan chi nhánh.');
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }

  function handleExportCsv() {
    if (!report) return;
    const csvCell = (value: string | number) => {
      let text = String(value ?? '');
      if (/^[=+\-@]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const periodLabel = days === 1 ? 'H\u00f4m nay' : `${days} ng\u00e0y`;
    const rows: Array<Array<string | number>> = [
      ['B\u00e1o c\u00e1o', 'Doanh thu h\u00f3a \u0111\u01a1n \u0111\u00e3 thanh to\u00e1n tr\u01b0\u1edbc \u0111i\u1ec1u ch\u1ec9nh'],
      ['Chi nh\u00e1nh', currentUser?.branchName || 'Ch\u01b0a x\u00e1c \u0111\u1ecbnh'],
      ['K\u1ef3 b\u00e1o c\u00e1o', periodLabel],
      ['Th\u1eddi \u0111i\u1ec3m xu\u1ea5t', new Date().toLocaleString('vi-VN')],
      ['\u0110\u01a1n v\u1ecb ti\u1ec1n', 'VND'],
      [],
      ['T\u1ed5ng doanh thu trong k\u1ef3', report.totalRevenue],
      ['S\u1ed1 h\u00f3a \u0111\u01a1n trong k\u1ef3', report.totalInvoices],
      [],
      ['Ng\u00e0y', 'Doanh thu', 'S\u1ed1 h\u00f3a \u0111\u01a1n'],
      ...(report.dailySales || []).map(item => [item.date, item.revenue, item.invoiceCount]),
    ];
    const content = rows.map(row => row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const branchFileName = (currentUser?.branchName || 'chi-nhanh').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-');
    link.setAttribute('download', `BaoCao_${branchFileName}_${days}ngay.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* 1. Header with RLS Scope & Time Selector */}
      <DashboardHeader
        branchName={currentUser?.branchName}
        branchId={currentUser?.branchId}
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
            expiringBatchesCount={alerts.length}
            pendingOrdersCount={pendingOrdersCount}
          />

          {/* 3. Middle Section: Revenue Trend & Top Selling Drugs */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Revenue Trend Chart (2 cols) */}
            <div className="lg:col-span-2">
              <HourlyRevenueChart
                dailySales={report.dailySales}
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
                          <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-bold ${
                            idx === 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{drug.drugName}</p>
                            <p className="text-xs text-slate-400">
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
          <SecurityAuditBanner />
        </>
      ) : null}
    </div>
  );
}
