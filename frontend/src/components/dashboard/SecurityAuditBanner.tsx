import React from 'react';
import { ShieldCheck, Lock, Database, FileKey } from 'lucide-react';

export interface SecurityAuditBannerProps {
  branchId?: string;
  className?: string;
}

export const SecurityAuditBanner: React.FC<SecurityAuditBannerProps> = ({
  branchId = 'CN01',
  className = '',
}) => {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-linear-to-r from-slate-900 via-slate-800 to-forest p-5 text-white shadow-sm ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-400" strokeWidth={2.4} />
            <h3 className="font-display text-sm font-bold tracking-wide uppercase text-emerald-400">
              PharmaChain Security — Giám sát An ninh &amp; Pháp lý Chi nhánh
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-300">
            Mọi thao tác của Chủ nhà thuốc được bảo vệ bởi kiến trúc đa lớp: Cô lập dữ liệu CSDL Oracle, Mã hóa phần cứng HSM và Nhật ký kiểm toán bất biến.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Badge 1: VPD / RLS */}
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 backdrop-blur-xs border border-white/10 text-slate-200">
            <Database size={13} className="text-emerald-400" />
            <span>Oracle VPD: <strong className="text-white">SYS_CONTEXT({branchId})</strong></span>
          </div>

          {/* Badge 2: PKCS#11 */}
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 backdrop-blur-xs border border-white/10 text-slate-200">
            <FileKey size={13} className="text-cyan-400" />
            <span>HSM Ký số: <strong className="text-white">PKCS#11 Sẵn sàng</strong></span>
          </div>

          {/* Badge 3: Audit Trail */}
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 backdrop-blur-xs border border-white/10 text-slate-200">
            <Lock size={13} className="text-amber-400" />
            <span>Ledger: <strong className="text-white">SHA-256 Chuỗi băm</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
