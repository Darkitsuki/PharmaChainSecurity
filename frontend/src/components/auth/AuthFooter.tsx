interface AuthFooterProps {
  appName?: string;
}

export function AuthFooter({ appName = 'PharmaSecure ERP' }: AuthFooterProps) {
  return (
    <footer className="w-full border-t border-line/60 bg-white/50 px-4 py-3 backdrop-blur-sm sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-[11px] text-slate-500 sm:flex-row font-medium">
        {/* App Title */}
        <div className="font-semibold text-slate-700">
          {appName}
        </div>

        {/* Security Invariants & Compliance Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-slate-500 font-mono text-[10.5px]">
          <span className="hover:text-emerald-700 transition-colors">SHA-256 Auth</span>
          <span className="text-slate-300">•</span>
          <span className="text-emerald-700 font-medium hover:underline">Row-Level Security Active</span>
          <span className="text-slate-300">•</span>
          <span className="hover:text-slate-700 transition-colors">ISO/IEC 27001</span>
        </div>
      </div>
    </footer>
  );
}
