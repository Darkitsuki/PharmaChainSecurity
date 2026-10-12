import { ShieldCheck } from 'lucide-react';

interface AuthHeaderProps {
  nodeName?: string;
  version?: string;
}

export function AuthHeader({
  nodeName = 'Node CN01 - HCM',
  version = 'v1.2.0-Prod',
}: AuthHeaderProps) {
  return (
    <header className="w-full border-b border-line/60 bg-white/70 px-4 py-3 backdrop-blur-sm sm:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between text-xs">
        {/* Node & System Status */}
        <div className="flex items-center gap-2 font-medium text-slate-700">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="font-semibold uppercase tracking-wider text-slate-800">
            Hệ thống trực tuyến
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">{nodeName}</span>
        </div>

        {/* Compliance & Version Badges */}
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/70 px-3 py-1 font-medium text-emerald-800 sm:inline-flex">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Tuân thủ GPP &amp; PKCS#11</span>
          </div>
          <span className="rounded-full border border-emerald-300/80 bg-emerald-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-700">
            {version}
          </span>
        </div>
      </div>
    </header>
  );
}
