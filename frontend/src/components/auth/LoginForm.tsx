import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, KeyRound, Loader2, User } from 'lucide-react';

interface LoginFormProps {
  username: string;
  password: string;
  error?: string;
  isSubmitting?: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function LoginForm({
  username, password, error, isSubmitting = false,
  onUsernameChange, onPasswordChange, onSubmit,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-7" aria-labelledby="login-title">
      <div className="text-center">
        <h1 id="login-title" className="font-display text-2xl font-extrabold tracking-tight text-ink">
          Đăng nhập
        </h1>
        <p className="mt-1.5 text-sm leading-6 text-slate-500">
          Đăng nhập bằng tài khoản được cấp
        </p>
      </div>

      {error && (
        <div id="login-error" role="alert" aria-live="assertive" className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-medium leading-5 text-rose-800">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-5 space-y-4" aria-describedby={error ? 'login-error' : undefined}>
        <div>
          <label htmlFor="username" className="block text-sm font-semibold text-slate-700">Tên đăng nhập</label>
          <div className="relative mt-2">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="username" name="username" type="text" autoComplete="username" autoCapitalize="none"
              spellCheck={false} required autoFocus disabled={isSubmitting} value={username}
              onChange={(event) => onUsernameChange(event.target.value)}
              className="login-input w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-ink transition-colors placeholder:text-slate-400 focus:border-forest focus:ring-2 focus:ring-forest/15 disabled:cursor-not-allowed disabled:bg-slate-50"
              placeholder="Nhập tên đăng nhập"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-slate-700">Mật khẩu</label>
          <div className="relative mt-2">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="password" name="password" type={showPassword ? 'text' : 'password'}
              autoComplete="current-password" required disabled={isSubmitting} value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              className="login-input login-password-input w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-11 text-sm text-ink transition-colors placeholder:text-slate-400 focus:border-forest focus:ring-2 focus:ring-forest/15 disabled:cursor-not-allowed disabled:bg-slate-50"
              placeholder="Nhập mật khẩu"
            />
            <button
              type="button" onClick={() => setShowPassword((visible) => !visible)} disabled={isSubmitting}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-slate-400 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-forest/40 disabled:cursor-not-allowed"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </div>
        </div>

        <p className="text-xs leading-5 text-slate-500">
          Quên mật khẩu? Liên hệ quản trị viên để được hỗ trợ.
        </p>

        <button
          type="submit" disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#0b765f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30 focus-visible:ring-offset-2 active:bg-[#095f4d] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          <span>{isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
        </button>
      </form>
    </section>
  );
}
