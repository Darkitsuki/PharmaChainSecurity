import {
  ArrowLeftRight, Boxes, Building, Check, ChevronDown, ClipboardCheck,
  FileText, HeartHandshake, KeyRound, LayoutDashboard, LogOut, Menu, PackagePlus, Pill,
  LoaderCircle, PanelLeftClose, PanelLeftOpen, ReceiptText, RotateCcw, Settings, ShieldCheck, Truck, Users, X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import type { Branch } from '../types';
import { NotificationBell } from './notifications/NotificationBell';

type Role = 'OWNER' | 'SALES' | 'WAREHOUSE';

const navigationGroups = [
  { id: 'overview', label: 'Tổng quan', roles: ['OWNER'], items: [
    { label: 'Tổng quan chi nhánh', to: '/reports', icon: LayoutDashboard, roles: ['OWNER'] },
  ] },
  { id: 'sales', label: 'Bán hàng', roles: ['OWNER', 'SALES'], items: [
    { label: 'Bán hàng tại quầy', to: '/checkout', icon: ReceiptText, roles: ['OWNER', 'SALES'] },
    { label: 'Hóa đơn bán hàng', to: '/invoices', icon: FileText, roles: ['OWNER', 'SALES'] },
    { label: 'Đổi trả & Hoàn tiền', to: '/returns', icon: RotateCcw, roles: ['OWNER', 'SALES'] },
    { label: 'Khách hàng & Tích điểm', to: '/customers', icon: HeartHandshake, roles: ['OWNER', 'SALES'] },
  ] },
  { id: 'inventory', label: 'Kho & Mua hàng', roles: ['OWNER', 'SALES', 'WAREHOUSE'], items: [
    { label: 'Tồn kho chi nhánh', to: '/inventory', icon: Boxes, roles: ['OWNER', 'SALES', 'WAREHOUSE'] },
    { label: 'Đơn mua thuốc', to: '/purchase-orders', icon: ClipboardCheck, roles: ['OWNER', 'WAREHOUSE'] },
    { label: 'Nhập kho thuốc', to: '/goods-receipts', icon: PackagePlus, roles: ['OWNER', 'WAREHOUSE'] },
    { label: 'Kiểm kê kho', to: '/inventory-audits', icon: ClipboardCheck, roles: ['OWNER', 'WAREHOUSE'] },
    { label: 'Điều chuyển kho', to: '/stock-transfers', icon: ArrowLeftRight, roles: ['OWNER', 'WAREHOUSE'] },
    { label: 'Nhà cung cấp', to: '/suppliers', icon: Truck, roles: ['OWNER', 'WAREHOUSE'] },
    { label: 'Danh mục thuốc', to: '/drugs', icon: Pill, roles: ['OWNER'] },
  ] },
  { id: 'administration', label: 'Quản trị', roles: ['OWNER'], items: [
    { label: 'Mạng lưới chi nhánh', to: '/branches', icon: Building, roles: ['OWNER'] },
    { label: 'Quản lý nhân viên', to: '/users', icon: Users, roles: ['OWNER'] },
  ] },
  { id: 'security', label: 'Bảo mật', roles: ['OWNER'], items: [
    { label: 'Bảo mật & Nhật ký', to: '/security/audit-logs', icon: ShieldCheck, roles: ['OWNER'] },
  ] },
] as const;

const roleLabels: Record<string, string> = {
  OWNER: 'Chủ nhà thuốc', SALES: 'Dược sĩ bán hàng', WAREHOUSE: 'Thủ kho',
};

function getInitials(name?: string, fallback = 'PS') {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AppShell() {
  const { currentUser, signOut, switchBranch } = useAuth();
  const location = useLocation();
  const role = currentUser?.role as Role | undefined;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.localStorage.getItem('pharmasecure.sidebar.collapsed') === 'true');
  const [accountOpen, setAccountOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [switchingBranchId, setSwitchingBranchId] = useState<string | null>(null);
  const [branchError, setBranchError] = useState('');
  const accountMenu = useRef<HTMLDivElement>(null);
  const branchMenu = useRef<HTMLDivElement>(null);
  const groups = useMemo(() => navigationGroups
    .filter(group => role && (group.roles as readonly Role[]).includes(role))
    .map(group => ({ ...group, items: group.items.filter(item => role && (item.roles as readonly Role[]).includes(role)) }))
    .filter(group => group.items.length > 0), [role]);
  const activeGroup = groups.find(group => group.items.some(item => location.pathname.startsWith(item.to)))?.id;
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (activeGroup) setOpenGroups(current => ({ ...current, [activeGroup]: true }));
    setMobileOpen(false);
  }, [activeGroup, location.pathname]);

  useEffect(() => {
    window.localStorage.setItem('pharmasecure.sidebar.collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    function closeAccount(event: PointerEvent) {
      if (!accountMenu.current?.contains(event.target as Node)) setAccountOpen(false);
      if (!branchMenu.current?.contains(event.target as Node)) setBranchOpen(false);
    }
    function closeMenus(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setAccountOpen(false);
        setBranchOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener('pointerdown', closeAccount);
    document.addEventListener('keydown', closeMenus);
    return () => {
      document.removeEventListener('pointerdown', closeAccount);
      document.removeEventListener('keydown', closeMenus);
    };
  }, []);

  function toggleGroup(id: string) {
    setOpenGroups(current => ({ ...current, [id]: !(current[id] ?? id === activeGroup) }));
  }

  async function toggleBranchMenu() {
    const nextOpen = !branchOpen;
    setBranchOpen(nextOpen);
    setBranchError('');
    if (!nextOpen || branches.length > 0 || branchesLoading) return;
    setBranchesLoading(true);
    try {
      setBranches(await apiClient<Branch[]>('/branches'));
    } catch (error) {
      setBranchError(error instanceof Error ? error.message : 'Không thể tải danh sách chi nhánh.');
    } finally {
      setBranchesLoading(false);
    }
  }

  async function selectBranch(branch: Branch) {
    if (!currentUser || branch.id === currentUser.branchId || switchingBranchId) return;
    setBranchError('');
    setSwitchingBranchId(branch.id);
    try {
      await switchBranch(branch.id);
    } catch (error) {
      setBranchError(error instanceof Error ? error.message : 'Không thể chuyển chi nhánh.');
      setSwitchingBranchId(null);
    }
  }

  const navigation = (mobile = false) => (
    <nav className="space-y-2.5" aria-label={mobile ? 'Điều hướng di động' : 'Điều hướng chính'}>
      {groups.map(group => {
        const collapsed = sidebarCollapsed && !mobile;
        const expanded = mobile || collapsed || (openGroups[group.id] ?? group.id === activeGroup);
        return <section key={group.id}>
          {!collapsed && <button type="button" onClick={() => toggleGroup(group.id)} className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400 hover:bg-slate-50 hover:text-slate-600" aria-expanded={expanded} aria-controls={`nav-group-${group.id}`}>
            <span>{group.label}</span><ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>}
          {expanded && <div id={`nav-group-${group.id}`} className={collapsed ? 'space-y-1' : 'mt-1 space-y-1'}>
            {group.items.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} title={collapsed ? label : undefined} aria-label={collapsed ? label : undefined} className={({ isActive }) => `flex items-center rounded-lg py-2.5 text-[13px] font-semibold transition-colors ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} ${isActive ? 'bg-mint text-forest' : 'text-slate-500 hover:bg-slate-50 hover:text-ink'}`}>
              <Icon size={18} strokeWidth={1.9} className="shrink-0" />{!collapsed && <span>{label}</span>}
            </NavLink>)}
          </div>}
        </section>;
      })}
    </nav>
  );

  return <div className={`min-h-screen bg-canvas lg:grid lg:transition-[grid-template-columns] lg:duration-200 lg:ease-out ${sidebarCollapsed ? 'lg:grid-cols-[76px_minmax(0,1fr)]' : 'lg:grid-cols-[264px_minmax(0,1fr)]'}`}>
    <aside className="hidden min-w-0 border-r border-line bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
      <div className={`flex h-[76px] items-center border-b border-line ${sidebarCollapsed ? 'justify-center px-3' : 'gap-3 px-6'}`}>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-forest text-white"><Pill size={19} strokeWidth={2.2} /></div>
        {!sidebarCollapsed && <div><p className="font-display text-[15px] font-extrabold leading-none text-ink">PharmaSecure</p><p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Quản trị nhà thuốc</p></div>}
      </div>
      <div className="scrollbar-hidden flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">{navigation()}</div>
      <div className="border-t border-line p-3">
        <button type="button" onClick={() => setSidebarCollapsed(value => !value)} title={sidebarCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'} className={`flex w-full items-center rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-500 transition-colors duration-150 hover:bg-slate-50 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`} aria-label={sidebarCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'} aria-pressed={sidebarCollapsed}>
          {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <><PanelLeftClose size={18} /><span>Thu gọn</span></>}
        </button>
      </div>
    </aside>

    {mobileOpen && <button type="button" className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Đóng điều hướng" />}
    <aside className={`fixed inset-y-0 left-0 z-50 w-[min(84vw,320px)] transform bg-white shadow-2xl transition-transform lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`} aria-hidden={!mobileOpen}>
      <div className="flex h-16 items-center justify-between border-b border-line px-5">
        <div className="flex items-center gap-2"><Pill className="text-forest" size={20} /><span className="font-display text-sm font-extrabold text-ink">PharmaSecure</span></div>
        <button type="button" onClick={() => setMobileOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Đóng điều hướng"><X size={19} /></button>
      </div>
      <div className="h-[calc(100vh-4rem)] overflow-y-auto p-4">{navigation(true)}</div>
    </aside>

    <div className="min-w-0">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur lg:h-[76px] lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-line text-ink lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Mở điều hướng" aria-expanded={mobileOpen}><Menu size={18} /></button>
          <div ref={branchMenu} className="relative min-w-0">
            {role === 'OWNER' ? <button type="button" onClick={() => void toggleBranchMenu()} disabled={Boolean(switchingBranchId)} aria-expanded={branchOpen} aria-controls="branch-menu" className="group flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:cursor-wait disabled:opacity-70">
              <span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Chi nh&#225;nh l&#224;m vi&#7879;c</span><span className="block truncate text-sm font-semibold text-ink">{currentUser?.branchName || currentUser?.branchId || 'Chưa xác định'}</span></span>
              {switchingBranchId ? <LoaderCircle size={15} className="shrink-0 animate-spin text-forest" /> : <ChevronDown size={15} className={`shrink-0 text-slate-400 transition-transform duration-200 ${branchOpen ? 'rotate-180' : ''}`} />}
            </button> : <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Chi nh&#225;nh l&#224;m vi&#7879;c</p><p className="truncate text-sm font-semibold text-ink">{currentUser?.branchName || currentUser?.branchId || 'Chưa xác định'}</p></div>}
            {role === 'OWNER' && <div id="branch-menu" aria-hidden={!branchOpen} className={`absolute left-0 top-full z-40 mt-2 w-[min(88vw,320px)] origin-top-left rounded-xl border border-slate-200 bg-white p-2 shadow-panel transition-[opacity,transform,visibility] duration-200 ${branchOpen ? 'visible translate-y-0 opacity-100' : 'invisible pointer-events-none -translate-y-1 opacity-0'}`}>
              <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Ch&#7885;n chi nh&#225;nh</p>
              {branchesLoading && <div className="flex items-center gap-2 px-3 py-3 text-xs text-slate-500"><LoaderCircle size={15} className="animate-spin" />&#272;ang t&#7843;i danh s&#225;ch...</div>}
              {!branchesLoading && branches.map(branch => {
                const active = branch.id === currentUser?.branchId;
                const switching = branch.id === switchingBranchId;
                return <button key={branch.id} type="button" onClick={() => void selectBranch(branch)} disabled={active || Boolean(switchingBranchId)} className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition-colors ${active ? 'bg-mint font-semibold text-forest' : 'text-slate-600 hover:bg-slate-50 hover:text-ink'} disabled:cursor-default`}>
                  <span className="min-w-0"><span className="block truncate font-semibold">{branch.branchName}</span>{branch.address && <span className="mt-0.5 block truncate text-[11px] font-normal text-slate-400">{branch.address}</span>}</span>
                  {switching ? <LoaderCircle size={15} className="shrink-0 animate-spin" /> : active ? <Check size={15} className="shrink-0" /> : null}
                </button>;
              })}
              {!branchesLoading && branches.length === 0 && !branchError && <p className="px-3 py-3 text-xs text-slate-500">Kh&#244;ng c&#243; chi nh&#225;nh kh&#7843; d&#7909;ng.</p>}
              {branchError && <p role="alert" className="mx-1 mt-1 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{branchError}</p>}
            </div>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />

          <div ref={accountMenu} className="relative">
            <button type="button" onClick={() => setAccountOpen(open => !open)} aria-label="Menu tài khoản" aria-expanded={accountOpen} aria-controls="account-menu" className={`flex items-center gap-2 rounded-lg p-1.5 transition-colors duration-150 hover:bg-slate-50 active:bg-slate-100 sm:gap-3 ${accountOpen ? 'bg-slate-50' : ''}`}>
            <span className="hidden text-right sm:block"><span className="block max-w-[220px] truncate text-[13px] font-bold text-ink">{currentUser?.fullName || currentUser?.username}</span><span className="block text-[11px] text-slate-500">{currentUser ? roleLabels[currentUser.role] ?? currentUser.role : ''}</span></span>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mint font-display text-xs font-bold text-forest">{getInitials(currentUser?.fullName || currentUser?.username)}</span><ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ease-out ${accountOpen ? 'rotate-180' : ''}`} />
          </button>
          <nav id="account-menu" aria-label="Tài khoản" aria-hidden={!accountOpen} className={`absolute right-0 top-full z-30 mt-2 w-60 origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-panel transition-[opacity,transform,visibility] duration-200 ease-out ${accountOpen ? 'visible translate-y-0 scale-100 opacity-100' : 'invisible pointer-events-none -translate-y-1 scale-95 opacity-0'}`}>
            <Link tabIndex={accountOpen ? undefined : -1} to="/settings" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-600 transition-colors duration-150 hover:bg-mint hover:text-forest active:bg-mint/80"><Settings size={16} />Hồ sơ & Cài đặt</Link>
            <Link tabIndex={accountOpen ? undefined : -1} to="/settings#password" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-600 transition-colors duration-150 hover:bg-mint hover:text-forest active:bg-mint/80"><KeyRound size={16} />Đổi mật khẩu</Link>
            <button tabIndex={accountOpen ? undefined : -1} type="button" onClick={() => { setAccountOpen(false); void signOut(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold text-rose-700 transition-colors duration-150 hover:bg-rose-50 active:bg-rose-100"><LogOut size={16} />Đăng xuất</button>
          </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-9 lg:py-8"><Outlet /></main>
    </div>
  </div>;
}
