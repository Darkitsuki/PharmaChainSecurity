import { Pill } from 'lucide-react';

export function AuthHeader() {
  return (
    <header className="border-b border-line bg-white px-4 py-4 sm:px-8">
      <div className="mx-auto flex max-w-6xl items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-forest text-white">
          <Pill size={19} strokeWidth={2.2} aria-hidden="true" />
        </span>
        <div>
          <p className="font-display text-sm font-extrabold text-ink">PharmaSecure</p>
          <p className="text-xs text-slate-500">Quản lý nhà thuốc</p>
        </div>
      </div>
    </header>
  );
}
