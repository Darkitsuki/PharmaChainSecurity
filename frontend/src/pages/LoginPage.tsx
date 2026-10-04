import { useState, type FormEvent } from 'react';
import { ArrowRight, Boxes, Crown, Eye, EyeOff, LockKeyhole, Pill, ShieldCheck, ShoppingCart, UserCheck } from 'lucide-react';
import { ApiError } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

interface DemoAccount {
  label: string;
  role: string;
  username: string;
  description: string;
  icon: typeof Crown;
  badgeClass: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: 'Chủ nhà thuốc',
    role: 'OWNER',
    username: 'chunhathuoc',
    description: 'Toàn quyền chi nhánh, nhân sự & báo cáo doanh thu',
    icon: Crown,
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    label: 'Dược sĩ bán lẻ',
    role: 'SALES',
    username: 'nvbanhang_cn1',
    description: 'Quầy bán lẻ POS, tra cứu thuốc & xuất hóa đơn',
    icon: ShoppingCart,
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    label: 'Thủ kho chi nhánh',
    role: 'WAREHOUSE',
    username: 'nvkho_cn1',
    description: 'Quản lý tồn kho dược phẩm & lập phiếu nhập hàng',
    icon: Boxes,
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
  },
];

export function LoginPage() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function mapErrorMessage(rawError: string): string {
    if (rawError.includes('Invalid username or password')) {
      return 'Tên đăng nhập hoặc mật khẩu không chính xác.';
    }
    if (rawError.includes('User account is deactivated')) {
      return 'Tài khoản người dùng đã bị vô hiệu hóa. Vui lòng liên hệ Chủ nhà thuốc.';
    }
    if (rawError.includes('Username and password are required')) {
      return 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.';
    }
    return rawError || 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối.';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await signIn(username.trim(), password);
    } catch (requestError) {
      const raw = requestError instanceof ApiError ? (requestError.detail || requestError.message) : '';
      setError(mapErrorMessage(raw));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleQuickLogin(account: DemoAccount) {
    setUsername(account.username);
    setPassword('Admin@123');
    setError('');
    setIsSubmitting(true);
    try {
      await signIn(account.username, 'Admin@123');
    } catch (requestError) {
      const raw = requestError instanceof ApiError ? (requestError.detail || requestError.message) : '';
      setError(mapErrorMessage(raw));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f4f7f5] lg:grid-cols-[minmax(0,1.1fr)_minmax(460px,0.9fr)]">
      {/* Brand & Background Showcase */}
      <section className="relative hidden overflow-hidden bg-ink px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div
          className="absolute inset-0 opacity-20"
          aria-hidden="true"
          style={{
            backgroundImage:
              'linear-gradient(135deg, transparent 0 47%, rgba(190,229,215,.18) 47.2% 47.5%, transparent 47.7%), radial-gradient(circle at 15% 85%, rgba(54,126,104,.65), transparent 40%)',
            backgroundSize: '44px 44px, auto',
          }}
        />
        <div className="relative flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/10">
            <Pill size={20} />
          </span>
          <span className="font-display text-lg font-extrabold tracking-wide">PharmaSecure</span>
        </div>
        <div className="relative max-w-xl pb-8">
          <p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#9dd4c1]">
            <span className="h-px w-7 bg-[#9dd4c1]" />
            Hệ Thống Quản Lý Chuỗi Nhà Thuốc
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-[1.12] xl:text-[52px]">
            Chuẩn hóa nghiệp vụ,<br />an toàn tuyệt đối.
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-7 text-white/70">
            Nền tảng kiểm soát an ninh đa chi nhánh: phân quyền RBAC chặt chẽ, cô lập dữ liệu chi nhánh và mã hóa hóa đơn điện tử.
          </p>
          <div className="mt-8 flex flex-wrap gap-2 text-xs text-white/80">
            <span className="rounded-md bg-white/10 px-3 py-1.5 font-medium">Bán lẻ POS</span>
            <span className="rounded-md bg-white/10 px-3 py-1.5 font-medium">Quản lý kho & Lô hạn</span>
            <span className="rounded-md bg-white/10 px-3 py-1.5 font-medium">Quản trị nhân sự</span>
            <span className="rounded-md bg-white/10 px-3 py-1.5 font-medium">Báo cáo doanh thu</span>
          </div>
        </div>
        <div className="relative flex items-center gap-2 border-t border-white/15 pt-5 text-xs text-white/60">
          <ShieldCheck size={16} className="text-[#9dd4c1]" />
          Virtual Private Database (VPD) · Mã hóa JWT · Ghi nhận nhật ký an ninh (Audit Logs)
        </div>
      </section>

      {/* Login & Demo Form */}
      <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-10">
        <div className="animate-enter w-full max-w-[440px]">
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-forest text-white">
              <Pill size={20} />
            </span>
            <span className="font-display text-lg font-extrabold text-ink">PharmaSecure</span>
          </div>

          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-forest">Đăng nhập hệ thống</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold text-ink">Chào mừng trở lại</h2>
            <p className="mt-1 text-sm text-slate-500">Đăng nhập tài khoản chi nhánh để bắt đầu phiên làm việc.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">Tên đăng nhập</span>
              <input
                autoComplete="username"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="h-11 w-full rounded-md border border-line bg-white px-3.5 text-sm text-ink placeholder:text-slate-400 focus:border-forest focus:outline-none"
                placeholder="Ví dụ: chunhathuoc, nvbanhang_cn1"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">Mật khẩu</span>
              <div className="relative">
                <LockKeyhole size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  autoComplete="current-password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 w-full rounded-md border border-line bg-white pl-10 pr-11 text-sm text-ink placeholder:text-slate-400 focus:border-forest focus:outline-none"
                  placeholder="Nhập mật khẩu của bạn"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {error && (
              <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-forest text-sm font-bold text-white transition-colors hover:bg-[#1c594b] disabled:cursor-wait disabled:opacity-60 shadow-sm"
            >
              {isSubmitting ? 'Đang xác thực…' : 'Đăng nhập'} {!isSubmitting && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-7 border-t border-slate-200/80 pt-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <UserCheck size={14} className="text-forest" /> Tài khoản thử nghiệm (1-chạm)
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Pass: Admin@123</span>
            </div>

            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((account) => {
                const Icon = account.icon;
                return (
                  <button
                    key={account.username}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleQuickLogin(account)}
                    className="group flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 text-left transition-all hover:border-forest/50 hover:bg-mint/30 hover:shadow-sm"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-700 group-hover:bg-forest group-hover:text-white transition-colors">
                      <Icon size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-ink">{account.label}</span>
                        <span className={`rounded border px-1.5 py-0.2 text-[10px] font-semibold ${account.badgeClass}`}>
                          {account.role}
                        </span>
                      </div>
                      <p className="truncate text-[11px] text-slate-500">{account.description}</p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-forest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                      Vào <ArrowRight size={12} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck size={14} /> Bảo vệ bởi chính sách an ninh PharmaSecure & VPD
          </p>
        </div>
      </section>
    </main>
  );
}
