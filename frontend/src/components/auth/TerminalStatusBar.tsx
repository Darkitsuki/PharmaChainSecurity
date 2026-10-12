import { Monitor, KeyRound } from 'lucide-react';

interface TerminalStatusBarProps {
  terminalId?: string;
  signatureStatus?: string;
}

export function TerminalStatusBar({
  terminalId = 'POS-TERMINAL-01',
  signatureStatus = 'Chữ ký số: Sẵn sàng',
}: TerminalStatusBarProps) {
  return (
    <aside
      aria-label="Thông tin thiết bị và chữ ký số"
      className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500"
    >
      <div className="flex items-center gap-1.5 rounded-md bg-white/80 px-2.5 py-1 border border-slate-200/60 shadow-xs">
        <Monitor className="h-3.5 w-3.5 text-emerald-600" />
        <span>Thiết bị quầy:</span>
        <span className="font-mono font-semibold text-slate-700">{terminalId}</span>
      </div>

      <div className="flex items-center gap-1.5 rounded-md bg-white/80 px-2.5 py-1 border border-slate-200/60 shadow-xs">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <KeyRound className="h-3 w-3 text-emerald-600" />
        <span className="text-slate-700">{signatureStatus}</span>
      </div>
    </aside>
  );
}
