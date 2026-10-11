import React from 'react';
import { AlertTriangle, Clock, ShieldAlert, CheckCircle, LucideIcon } from 'lucide-react';

export interface FefoExpiryBadgeProps {
  expiryDate: string;
  daysRemaining?: number;
  showDays?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const FefoExpiryBadge: React.FC<FefoExpiryBadgeProps> = ({
  expiryDate,
  daysRemaining: propDays,
  showDays = true,
  size = 'md',
  className = '',
}) => {
  // Calculate days remaining if not provided
  const days = React.useMemo(() => {
    if (typeof propDays === 'number') return propDays;
    try {
      const exp = new Date(expiryDate).getTime();
      const now = new Date().getTime();
      return Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    } catch {
      return 999;
    }
  }, [expiryDate, propDays]);

  let statusConfig: {
    icon: LucideIcon;
    label: string;
    badgeStyle: string;
    advice: string;
  };

  if (days <= 0) {
    statusConfig = {
      icon: ShieldAlert,
      label: 'Đã hết hạn',
      badgeStyle: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
      advice: 'Khóa xuất - Lập biên bản tiêu hủy',
    };
  } else if (days <= 30) {
    statusConfig = {
      icon: AlertTriangle,
      label: `Cận hạn khẩn cấp (${days} ngày)`,
      badgeStyle: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse font-bold',
      advice: 'Ưu tiên xuất bán FEFO ngay',
    };
  } else if (days <= 90) {
    statusConfig = {
      icon: Clock,
      label: `Cận hạn (${days} ngày)`,
      badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold',
      advice: 'Khuyến nghị đẩy quầy bán trước',
    };
  } else {
    statusConfig = {
      icon: CheckCircle,
      label: `An toàn (${days} ngày)`,
      badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      advice: 'Hạn dùng đạt chuẩn',
    };
  }

  const Icon = statusConfig.icon;
  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      title={`Hạn dùng: ${expiryDate} | ${statusConfig.advice}`}
      className={`inline-flex items-center gap-1.5 rounded-full border ${paddingClass} ${statusConfig.badgeStyle} ${className}`}
    >
      <Icon size={size === 'sm' ? 11 : 13} strokeWidth={2.2} />
      <span>{showDays ? statusConfig.label : (days <= 0 ? 'Hết hạn' : 'Cận hạn')}</span>
    </span>
  );
};
