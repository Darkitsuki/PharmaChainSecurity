import React from 'react';
import { CircleAlert, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface AlertBannerProps {
  type?: 'error' | 'success' | 'warning' | 'info';
  message: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type = 'error',
  message,
  onClose,
  className = '',
}) => {
  if (!message) return null;

  const styleMap = {
    error: {
      wrapper: 'border-rose-200 bg-rose-50 text-rose-800',
      icon: CircleAlert,
      iconColor: 'text-rose-600',
    },
    success: {
      wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
    },
    warning: {
      wrapper: 'border-amber-200 bg-amber-50 text-amber-800',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    },
    info: {
      wrapper: 'border-sky-200 bg-sky-50 text-sky-800',
      icon: Info,
      iconColor: 'text-sky-600',
    },
  }[type];

  const Icon = styleMap.icon;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border p-4 text-xs font-medium leading-relaxed transition-all ${styleMap.wrapper} ${className}`}
    >
      <Icon size={18} className={`mt-0.5 shrink-0 ${styleMap.iconColor}`} />
      <div className="flex-1 min-w-0">{message}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-slate-400 hover:text-slate-600 cursor-pointer"
          aria-label="Đóng thông báo"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
