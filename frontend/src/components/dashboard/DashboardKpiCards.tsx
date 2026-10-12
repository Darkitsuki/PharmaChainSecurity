import React from 'react';
import { DollarSign, ShieldCheck, AlertTriangle, Wallet } from 'lucide-react';
import { StatCard } from '../common/StatCard';

const money = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export interface DashboardKpiCardsProps {
  totalRevenue: number;
  totalInvoices: number;
  hsmCompliantPercent?: number;
  expiringBatchesCount?: number;
  cashDrawerAmount?: number;
  pendingExpensesCount?: number;
}

export const DashboardKpiCards: React.FC<DashboardKpiCardsProps> = ({
  totalRevenue,
  totalInvoices,
  hsmCompliantPercent = 100,
  expiringBatchesCount = 0,
  cashDrawerAmount = 4500000,
  pendingExpensesCount = 1,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Doanh thu thực thu */}
      <StatCard
        title="Doanh thu chi nhánh"
        value={money.format(totalRevenue)}
        icon={DollarSign}
        colorTheme="emerald"
        trend={{
          value: '12.4%',
          isPositive: true,
          label: 'so với kỳ trước',
        }}
        subValue={`${totalInvoices} hóa đơn hoàn tất`}
      />

      {/* 2. Tuân thủ Ký số HSM PKCS#11 */}
      <StatCard
        title="Tuân thủ Ký số HSM"
        value={`${hsmCompliantPercent}%`}
        icon={ShieldCheck}
        colorTheme="blue"
        badge={{
          text: 'Chuẩn pháp lý',
          variant: 'success',
        }}
        subValue="Mã hóa phần cứng PKCS#11"
      />

      {/* 3. Cảnh báo Lô cận hạn FEFO */}
      <StatCard
        title="Cảnh báo lô cận hạn"
        value={`${expiringBatchesCount} lô`}
        icon={AlertTriangle}
        colorTheme={expiringBatchesCount > 0 ? 'amber' : 'emerald'}
        badge={{
          text: expiringBatchesCount > 0 ? 'Cần xử lý FEFO' : 'An toàn',
          variant: expiringBatchesCount > 0 ? 'warning' : 'success',
        }}
        subValue="Ưu tiên bán trước hạn"
      />

      {/* 4. Quỹ tiền mặt & Duyệt chi */}
      <StatCard
        title="Két tiền mặt & Duyệt chi"
        value={money.format(cashDrawerAmount)}
        icon={Wallet}
        colorTheme="purple"
        badge={{
          text: pendingExpensesCount > 0 ? `${pendingExpensesCount} phiếu chờ duyệt` : 'Cân quỹ',
          variant: pendingExpensesCount > 0 ? 'warning' : 'info',
        }}
        subValue="Quỹ đối soát trực tiếp"
      />
    </div>
  );
};
