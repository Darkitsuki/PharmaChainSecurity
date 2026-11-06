import { money } from '../../utils/formatters';
import React from 'react';
import { AlertTriangle, ClipboardCheck, FileText, Wallet } from 'lucide-react';
import { StatCard } from '../common/StatCard';



export interface DashboardKpiCardsProps {
  totalRevenue: number;
  totalInvoices: number;
  expiringBatchesCount?: number;
  pendingOrdersCount?: number | null;
}

export const DashboardKpiCards: React.FC<DashboardKpiCardsProps> = ({
  totalRevenue,
  totalInvoices,
  expiringBatchesCount = 0,
  pendingOrdersCount = null,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Doanh thu thực thu */}
      <StatCard
        title="Doanh thu chi nhánh"
        value={money.format(totalRevenue)}
        icon={Wallet}
        colorTheme="emerald"
        subValue={`${totalInvoices} hóa đơn hoàn tất`}
      />

      {/* 2. Tuân thủ Ký số HSM PKCS#11 */}
      <StatCard
        title="Hóa đơn trong kỳ"
        value={totalInvoices.toLocaleString('vi-VN')}
        icon={FileText}
        colorTheme="blue"
        subValue="Theo dữ liệu bán hàng hiện có"
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
        subValue="Cảnh báo trong 90 ngày, độc lập kỳ doanh thu"
      />

      {/* 4. Quỹ tiền mặt & Duyệt chi */}
      <StatCard
        title="Đơn mua chờ duyệt"
        value={pendingOrdersCount === null ? 'Chưa có dữ liệu' : pendingOrdersCount.toLocaleString('vi-VN')}
        icon={ClipboardCheck}
        colorTheme="purple"
        subValue="Đơn mua của chi nhánh"
      />
    </div>
  );
};
