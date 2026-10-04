import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, Boxes, FileText, LogOut, Menu, PackagePlus, Pill, ShoppingCart, Users } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const navigation = [
  { label: 'Point of Sale', to: '/checkout', icon: ShoppingCart },
  { label: 'Invoices', to: '/invoices', icon: FileText },
  { label: 'Inventory', to: '/inventory', icon: Boxes },
  { label: 'Goods Receipts', to: '/goods-receipts', icon: PackagePlus, roles: ['OWNER', 'WAREHOUSE'] },
  { label: 'Drug Catalog', to: '/drugs', icon: Pill, roles: ['OWNER'] },
  { label: 'Staff Management', to: '/users', icon: Users, roles: ['OWNER'] },
  { label: 'Sales Reports', to: '/reports', icon: BarChart3, roles: ['OWNER'] },
];

const roleLabels: Record<string, string> = {
  OWNER: 'Owner',
  SALES: 'Sales staff',
  WAREHOUSE: 'Warehouse',
};

export function AppShell() {
  const { currentUser, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const accessibleNav = navigation.filter(
    item => !item.roles || (currentUser && item.roles.includes(currentUser.role))
  );

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden border-r border-line bg-white lg:flex lg:flex-col">
        <div className="flex h-[76px] items-center gap-3 border-b border-line px-6">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-forest text-white">
            <Pill size={19} strokeWidth={2.2} />
          </div>
          <div>
            <p className="font-display text-[15px] font-extrabold leading-none text-ink">PharmaSecure</p>
            <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Branch operations</p>
          </div>
        </div>

        <div className="px-4 pt-7">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Workspace</p>
          <nav className="mt-3 space-y-1" aria-label="Main navigation">
            {accessibleNav.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `group flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-semibold transition-colors ${isActive ? 'bg-mint text-forest' : 'text-slate-500 hover:bg-slate-50 hover:text-ink'}`}
              >
                <Icon size={17} strokeWidth={1.9} />
                <span>{label}</span>
                {label === 'Point of Sale' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-coral" />}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto border-t border-line p-4">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e9efec] font-display text-xs font-bold text-forest">
              {currentUser?.username.slice(0, 2).toUpperCase() ?? 'PS'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-ink">{currentUser?.username}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">{currentUser ? roleLabels[currentUser.role] ?? currentUser.role : ''}</p>
            </div>
            <button onClick={signOut} className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-700" aria-label="Sign out" title="Sign out">
              <LogOut size={16} />
            </button>
          </div>
          <p className="px-2 text-[10px] text-slate-400">Branch <span className="font-mono text-slate-500">{currentUser?.branchId}</span></p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-[64px] items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur lg:h-[76px] lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <button className="grid h-9 w-9 place-items-center rounded-md border border-line text-ink" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation" aria-expanded={menuOpen}>
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              <Pill className="text-forest" size={19} />
              <span className="font-display text-sm font-extrabold text-ink">PharmaSecure</span>
            </div>
          </div>
          <p className="hidden text-xs font-medium text-slate-500 lg:block">Branch <span className="ml-1 font-mono text-ink">{currentUser?.branchId}</span></p>
          <div className="flex items-center gap-2 lg:hidden">
            <span className="max-w-[120px] truncate text-xs font-semibold text-ink">{currentUser?.username}</span>
            <button onClick={signOut} className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100" aria-label="Sign out" title="Sign out">
              <LogOut size={17} />
            </button>
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <div className="text-right">
              <p className="text-[13px] font-bold text-ink">{currentUser?.username}</p>
              <p className="text-[11px] text-slate-500">{currentUser ? roleLabels[currentUser.role] ?? currentUser.role : ''}</p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-mint font-display text-xs font-bold text-forest">
              {currentUser?.username.slice(0, 2).toUpperCase() ?? 'PS'}
            </span>
          </div>
        </header>

        {menuOpen && (
          <nav className="flex flex-wrap gap-1 border-b border-line bg-white p-2 lg:hidden" aria-label="Mobile navigation">
            {accessibleNav.map(({ label, to, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={() => setMenuOpen(false)} className={({ isActive }) => `flex flex-1 min-w-[80px] flex-col items-center gap-1 rounded-md py-2 text-[11px] font-semibold ${isActive ? 'bg-mint text-forest' : 'text-slate-500'}`}>
                <Icon size={17} />{label}
              </NavLink>
            ))}
          </nav>
        )}

        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-9 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
