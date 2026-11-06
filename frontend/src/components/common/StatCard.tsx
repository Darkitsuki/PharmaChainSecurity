import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  badge?: {
    text: string;
    variant?: 'success' | 'warning' | 'info' | 'danger';
  };
  subValue?: string;
  colorTheme?: 'emerald' | 'blue' | 'amber' | 'purple' | 'slate';
  className?: string;
  loading?: boolean;
  unavailable?: boolean;
}

const badgeStyles = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  badge,
  subValue,
  className = '',
  loading = false,
  unavailable = false,
}) => {


  return (
    <div
      className={`rounded-xl border border-line bg-white p-4 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-500">
          {title}
        </span>
        <div className={"grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-400"}>
          <Icon size={17} strokeWidth={2.2} />
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-baseline gap-2">
        <span className="font-display text-2xl font-bold tracking-tight text-ink tabular-nums">
          {loading ? <span role="status" aria-label="Đang tải" className="inline-block h-7 w-20 animate-pulse rounded bg-slate-100" /> : unavailable ? '—' : value}
        </span>
        {badge && !loading && !unavailable && (
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
              badgeStyles[badge.variant || 'info']
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {(trend || subValue) && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          {trend && (
            <span
              className={`font-medium ${
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
              {trend.label && (
                <span className="ml-1 text-slate-400 font-normal">{trend.label}</span>
              )}
            </span>
          )}
          {subValue && <span className="text-slate-500">{subValue}</span>}
        </div>
      )}
    </div>
  );
};
