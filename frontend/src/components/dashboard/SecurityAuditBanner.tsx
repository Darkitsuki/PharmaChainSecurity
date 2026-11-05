import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface SecurityAuditBannerProps {
  className?: string;
}

export function SecurityAuditBanner({ className = '' }: SecurityAuditBannerProps) {
  return (
    <div className={`flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-2xs sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700"><ShieldCheck size={18} /></span>
        <div><h2 className="font-display text-sm font-bold text-slate-900">Nhật ký hoạt động</h2><p className="mt-1 text-xs text-slate-500">Tra cứu các sự kiện đã được hệ thống ghi nhận cho tài khoản và chi nhánh.</p></div>
      </div>
      <Link to="/security/audit-logs" className="inline-flex items-center gap-1.5 self-start text-xs font-semibold text-forest hover:underline sm:self-auto">Xem nhật ký <ArrowRight size={14} /></Link>
    </div>
  );
}
