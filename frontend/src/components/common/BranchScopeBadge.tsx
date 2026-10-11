import React from 'react';
import { ShieldCheck, MapPin } from 'lucide-react';

export interface BranchScopeBadgeProps {
  branchName?: string;
  branchId?: string;
  showVpdStatus?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const BranchScopeBadge: React.FC<BranchScopeBadgeProps> = ({
  branchName = 'Chi nhánh 01',
  branchId = 'CN01',
  showVpdStatus = true,
  size = 'md',
  className = '',
}) => {
  const isSm = size === 'sm';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/90 px-3 py-1.5 shadow-2xs backdrop-blur-xs ${className}`}
    >
      <div className="flex items-center gap-1.5 text-slate-700">
        <MapPin size={isSm ? 13 : 15} className="text-forest" />
        <span className={`font-semibold text-slate-800 ${isSm ? 'text-xs' : 'text-sm'}`}>
          {branchName}
        </span>
        {branchId && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-600">
            {branchId}
          </span>
        )}
      </div>

      {showVpdStatus && (
        <>
          <div className="h-3 w-px bg-slate-200" />
          <div
            className="flex items-center gap-1 text-[11px] font-medium text-emerald-700"
            title="Dữ liệu được cách ly độc quyền bằng Oracle Virtual Private Database (VPD / Row-Level Security)"
          >
            <ShieldCheck size={13} className="text-emerald-600" strokeWidth={2.4} />
            <span className="hidden sm:inline">Cô lập RLS</span>
          </div>
        </>
      )}
    </div>
  );
};
