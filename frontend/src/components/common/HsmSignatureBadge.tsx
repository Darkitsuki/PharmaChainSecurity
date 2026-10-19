import React from 'react';
import { CheckCircle2, AlertCircle, Clock, ShieldCheck, Loader2 } from 'lucide-react';

export interface HsmSignatureBadgeProps {
  status?: 'valid' | 'pending' | 'invalid' | 'unknown' | 'revoked';
  hashSha256?: string;
  signerName?: string;
  showHashPreview?: boolean;
  onVerifyClick?: () => void;
  isVerifying?: boolean;
  className?: string;
}

export const HsmSignatureBadge: React.FC<HsmSignatureBadgeProps> = ({
  status = 'valid',
  hashSha256,
  signerName,
  showHashPreview = false,
  onVerifyClick,
  isVerifying = false,
  className = '',
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'valid':
        return {
          icon: ShieldCheck,
          text: 'Ký số HSM PKCS#11',
          containerClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/60',
          dotClass: 'bg-emerald-500',
        };
      case 'pending':
        return {
          icon: Clock,
          text: 'Đang ký HSM',
          containerClass: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/60',
          dotClass: 'bg-amber-500',
        };
      case 'invalid':
        return {
          icon: AlertCircle,
          text: 'Sai lệch chữ ký',
          containerClass: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/60',
          dotClass: 'bg-rose-500',
        };
      case 'revoked':
        return {
          icon: AlertCircle,
          text: 'Đã thu hồi chữ ký',
          containerClass: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/60',
          dotClass: 'bg-rose-500',
        };
      default:
        return {
          icon: CheckCircle2,
          text: 'Chưa xác thực',
          containerClass: 'bg-slate-50 text-slate-600 border-slate-200',
          dotClass: 'bg-slate-400',
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const truncatedHash = hashSha256
    ? `${hashSha256.slice(0, 8)}...${hashSha256.slice(-8)}`
    : null;

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <div className="inline-flex items-center gap-1.5">
        <button
          type="button"
          onClick={onVerifyClick}
          disabled={!onVerifyClick || isVerifying}
          title={
            hashSha256
              ? `Mã băm SHA-256: ${hashSha256} (Nhấn để kiểm tra tính toàn vẹn)`
              : 'Xác thực chữ ký số HSM'
          }
          className={`group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all ${
            config.containerClass
          } ${onVerifyClick ? 'cursor-pointer shadow-xs active:scale-95' : 'cursor-default'}`}
        >
          {isVerifying ? (
            <Loader2 size={13} className="animate-spin text-emerald-600" />
          ) : (
            <Icon size={13} strokeWidth={2.4} />
          )}
          <span>{config.text}</span>
          {signerName && (
            <span className="opacity-75 font-normal text-[11px] hidden sm:inline">
              • {signerName}
            </span>
          )}
        </button>
      </div>

      {showHashPreview && truncatedHash && (
        <span
          className="font-mono text-[10px] text-slate-400 tracking-wider hover:text-slate-600 transition-colors"
          title={`SHA-256 Ledger: ${hashSha256}`}
        >
          Hash: {truncatedHash}
        </span>
      )}
    </div>
  );
};
