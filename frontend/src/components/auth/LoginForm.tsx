import { useState, type FormEvent, type ReactNode } from 'react';
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck, User } from 'lucide-react';

interface LoginFormProps {
  username: string;
  password: string;
  error?: string;
  isSubmitting?: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  children?: ReactNode;
}

export function LoginForm({
  username,
  password,
  error,
  isSubmitting = false,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  children,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);

  return (
    <div className="w-full max-w-[440px] rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
      {/* 1. Header Badge & Logo */}
      <div className="flex flex-col items-center text-center">
        <span className="inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-0.5 text-[10.5px] font-bold tracking-wider text-emerald-800 uppercase">
          Cổng xác thực nội bộ
        </span>

        <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-200/80 bg-emerald-50/80 text-emerald-600 shadow-2xs">
          <ShieldCheck className="h-7 w-7 text-emerald-600" strokeWidth={2.2} />
        </div>

        <h1 className="mt-3 font-display text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
          PharmaSecure ERP
        </h1>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Hệ thống Quản trị Chuỗi Nhà thuốc &amp; An toàn Dữ liệu
        </p>
      </div>

      {/* 2. Error Alert */}
      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-800 font-medium leading-relaxed"
        >
          {error}
        </div>
      )}

      {/* 3. Form Inputs */}
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        {/* Username field */}
        <div>
          <label
            htmlFor="username"
            className="block text-xs font-semibold text-slate-700"
          >
            Tên đăng nhập / Mã nhân viên
          </label>
          <div className="relative mt-1.5">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <User className="h-4 w-4" />
            </div>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              disabled={isSubmitting}
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              placeholder="Ví dụ: chunhathuoc, nvbanhang_cn1"
              className="w-full rounded-lg border border-slate-300/90 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 disabled:text-slate-500 transition-colors"
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Tài khoản nội bộ do Quản trị viên chi nhánh cấp
          </p>
        </div>

        {/* Password field */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-slate-700"
          >
            Mật khẩu
          </label>
          <div className="relative mt-1.5">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <KeyRound className="h-4 w-4" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              disabled={isSubmitting}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Nhập mật khẩu..."
              className="w-full rounded-lg border border-slate-300/90 bg-white py-2 pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 disabled:text-slate-500 transition-colors"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Options: Remember device & Forgot password */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
            />
            <span className="text-slate-600 font-medium">Ghi nhớ thiết bị quầy</span>
          </label>

          <span
            className="text-slate-500 hover:text-emerald-700 cursor-help transition-colors"
            title="Vui lòng liên hệ Chủ nhà thuốc hoặc Quản trị viên để đặt lại mật khẩu"
          >
            Quên mật khẩu?
          </span>
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0d9475] py-2.5 px-4 font-semibold text-sm text-white shadow-xs hover:bg-[#0b7d63] active:bg-[#096953] focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang xác thực thông tin...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Đăng nhập ca làm việc <span className="opacity-80 font-normal text-xs">[Enter]</span></span>
              </>
            )}
          </button>
        </div>

        {/* Security Notice Banner */}
        <div className="rounded-md border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-center text-[11px] font-medium text-emerald-800">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 align-middle" />
          Kênh TLS 1.3 | Mọi phiên truy cập được ghi nhận tự động vào Nhật ký kiểm toán
        </div>

        {/* Role Quick Selector slot */}
        {children}
      </form>
    </div>
  );
}
