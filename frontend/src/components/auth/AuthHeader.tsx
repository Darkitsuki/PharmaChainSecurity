import { Pill } from 'lucide-react';

export function AuthHeader() {
  return (
    <header className="border-b border-line bg-white px-5 py-4 sm:px-8">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-forest text-white">
          <Pill size={19} strokeWidth={2.2} aria-hidden="true" />
        </span>
        <div>
          <p className="font-display text-[15px] font-extrabold leading-none text-ink">PharmaSecure</p>
          <p className="mt-1.5 text-[11px] font-medium text-slate-500">Quản lý nhà thuốc</p>
        </div>
      </div>
    </header>
  );
}
