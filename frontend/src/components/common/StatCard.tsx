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
}

const themeStyles = {
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    accentBorder: 'border-l-emerald-500',
  },
  blue: {
    iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    accentBorder: 'border-l-blue-500',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
    accentBorder: 'border-l-amber-500',
  },
  purple: {
    iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
    accentBorder: 'border-l-purple-500',
  },
  slate: {
    iconBg: 'bg-slate-100 text-slate-600 border-slate-200',
    accentBorder: 'border-l-slate-400',
  },
};

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
  colorTheme = 'slate',
  className = '',
}) => {
  const theme = themeStyles[colorTheme];

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border ${theme.iconBg}`}>
          <Icon size={20} strokeWidth={2.2} />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-display text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </span>
        {badge && (
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
          {subValue && <span className="text-slate-400 ml-auto">{subValue}</span>}
        </div>
      )}
    </div>
  );
};
