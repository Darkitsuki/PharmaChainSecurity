import { useState, type FormEvent } from 'react';
import { ArrowRight, LockKeyhole, Pill, ShieldCheck } from 'lucide-react';
import { ApiError } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await signIn(username.trim(), password);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.detail || requestError.message : 'Unable to connect to the service. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f4f7f5] lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
      <section className="relative hidden overflow-hidden bg-ink px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div className="absolute inset-0 opacity-20" aria-hidden="true" style={{ backgroundImage: 'linear-gradient(135deg, transparent 0 47%, rgba(190,229,215,.18) 47.2% 47.5%, transparent 47.7%), radial-gradient(circle at 15% 85%, rgba(54,126,104,.65), transparent 40%)', backgroundSize: '44px 44px, auto' }} />
        <div className="relative flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/10"><Pill size={20} /></span>
          <span className="font-display text-lg font-extrabold">PharmaSecure</span>
        </div>
        <div className="relative max-w-xl pb-8">
          <p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#9dd4c1]"><span className="h-px w-7 bg-[#9dd4c1]" />Branch operations</p>
          <h1 className="font-display text-5xl font-extrabold leading-[1.08] xl:text-[58px]">Care, stocked<br />and accounted for.</h1>
          <p className="mt-6 max-w-md text-[15px] leading-7 text-white/65">A secure workspace for pharmacy sales, inventory, and verifiable invoices.</p>
        </div>
        <div className="relative flex items-center gap-2 border-t border-white/15 pt-5 text-xs text-white/55">
          <ShieldCheck size={15} className="text-[#9dd4c1]" /> Branch-scoped access · Encrypted API session
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="animate-enter w-full max-w-[420px]">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-forest text-white"><Pill size={20} /></span>
            <span className="font-display text-lg font-extrabold text-ink">PharmaSecure</span>
          </div>
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-forest">Secure sign in</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-ink">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500">Use your branch account to continue.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-700">Username</span>
              <input autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} className="h-12 w-full rounded-md border border-line bg-white px-3.5 text-sm text-ink placeholder:text-slate-400 focus:border-forest focus:outline-none" placeholder="e.g. nvbanhang_cn1" />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-700">Password</span>
              <span className="relative block">
                <LockKeyhole size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input autoComplete="current-password" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full rounded-md border border-line bg-white pl-10 pr-3.5 text-sm text-ink placeholder:text-slate-400 focus:border-forest focus:outline-none" placeholder="Enter your password" />
              </span>
            </label>

            {error && <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800">{error}</div>}

            <button type="submit" disabled={isSubmitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-forest text-sm font-bold text-white transition-colors hover:bg-[#1c594b] disabled:cursor-wait disabled:opacity-60">
              {isSubmitting ? 'Signing in…' : 'Sign in'} {!isSubmitting && <ArrowRight size={16} />}
            </button>
          </form>
          <p className="mt-7 flex items-center justify-center gap-2 text-[11px] text-slate-400"><ShieldCheck size={14} /> Protected by PharmaSecure access controls</p>
        </div>
      </section>
    </main>
  );
}
