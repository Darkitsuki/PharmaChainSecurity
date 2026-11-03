import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { KeyRound, LoaderCircle, Save, Settings, ShieldCheck, Users } from 'lucide-react';
import { AlertBanner } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { apiClient, ApiError } from '../services/apiClient';
import { roleLabels, securityButton, securityField, type AccountProfile } from '../services/accountSecurity';

export function SettingsPage() {
  const location = useLocation();
  const { currentUser, refreshCurrentUser, clearSession } = useAuth();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [fullName, setFullName] = useState(''); const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  const [currentPassword, setCurrentPassword] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const inFlight = useRef(false);
  useEffect(() => { if (profile && location.hash === '#password') document.getElementById('password')?.scrollIntoView({ block: 'center' }); }, [profile, location.hash]);
  useEffect(() => {
    const abort = new AbortController();
    apiClient<AccountProfile>('/account/profile', { signal: abort.signal }).then(value => {
      if (!abort.signal.aborted) { setProfile(value); setFullName(value.fullName); setPhone(value.phoneNumber || ''); }
    }).catch(e => { if (!abort.signal.aborted) setError(e instanceof Error ? e.message : 'Không tải được hồ sơ.'); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, []);
  async function saveProfile(event: FormEvent) {
    event.preventDefault(); if (inFlight.current) return;
    setError(''); setSuccess('');
    if (!fullName.trim() || new TextEncoder().encode(fullName.trim()).length > 255) { setError('Họ tên không được trống và tối đa 255 byte.'); return; }
    inFlight.current = true; setBusy(true);
    try {
      const result = await apiClient<AccountProfile>('/account/profile', { method: 'PUT', body: JSON.stringify({ fullName: fullName.trim(), phoneNumber: phone.trim() || null }) });
      setProfile(result); setFullName(result.fullName); setPhone(result.phoneNumber || '');
      setSuccess('Đã lưu hồ sơ cá nhân.');
      try { await refreshCurrentUser(); } catch { setError('Hồ sơ đã lưu; chưa tải lại được thông tin ở header. Vui lòng tải lại trang.'); }
    } catch (e) { setError(e instanceof ApiError ? e.detail || e.message : 'Chưa xác nhận được kết quả. Tải lại hồ sơ trước khi thử lưu lại.'); }
    finally { inFlight.current = false; setBusy(false); }
  }
  async function changePassword(event: FormEvent) {
    event.preventDefault(); if (inFlight.current) return;
    setError(''); setSuccess('');
    if (password.length < 12 || password.length > 64 || new TextEncoder().encode(password).length > 72 || password !== confirm) { setError('Mật khẩu mới cần 12–64 ký tự, tối đa 72 byte UTF-8; xác nhận phải trùng khớp.'); return; }
    inFlight.current = true; setBusy(true);
    try {
      await apiClient('/account/password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword: password, confirmPassword: confirm }) });
      setCurrentPassword(''); setPassword(''); setConfirm('');
      clearSession('Đổi mật khẩu thành công. Các phiên cũ đã mất hiệu lực; vui lòng đăng nhập lại.');
    } catch (e) { setCurrentPassword(''); setError(e instanceof ApiError ? e.detail || e.message : 'Không xác nhận được kết quả. Vui lòng đăng nhập lại trước khi thử tiếp.'); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return <div className="space-y-5">
    <header className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-forest text-white"><Settings size={21} /></span><div><h1 className="font-display text-2xl font-bold tracking-tight text-ink">Tài khoản & Cài đặt</h1><p className="mt-1 text-sm text-slate-500">Quản lý hồ sơ cá nhân và bảo vệ tài khoản của bạn.</p></div></header>
    <AlertBanner message={error} onClose={() => setError('')} /><AlertBanner type="success" message={success} onClose={() => setSuccess('')} />
    {loading ? <p role="status" className="flex items-center gap-2 p-8 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} />Đang tải hồ sơ…</p> : !profile ? <p className="text-sm text-slate-500">Không tải được hồ sơ. Vui lòng tải lại trang.</p> : <div className="grid items-start gap-5 xl:grid-cols-2">
      <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-display text-base font-bold text-ink">Hồ sơ cá nhân</h2><p className="mt-1 text-xs text-slate-500">Chỉ họ tên và số điện thoại được phép cập nhật.</p>
        <form aria-label="Cập nhật hồ sơ" onSubmit={saveProfile} className="mt-5 space-y-4"><fieldset disabled={busy} className="min-w-0 space-y-4">
          <label className="block text-xs font-semibold text-slate-600">Họ và tên<input aria-label="Họ và tên" required className={securityField} value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" /></label>
          <label className="block text-xs font-semibold text-slate-600">Số điện thoại<input aria-label="Số điện thoại" type="tel" className={securityField} value={phone} onChange={e => setPhone(e.target.value)} maxLength={20} autoComplete="tel" /></label>
          <dl className="grid gap-4 rounded-lg bg-slate-50 p-4 text-xs sm:grid-cols-2">{[['Tên đăng nhập', profile.username], ['Vai trò', roleLabels[profile.role] || profile.role], ['Chi nhánh', profile.branchName], ['Trạng thái', profile.isActive ? 'Đang hoạt động' : 'Đã vô hiệu hóa']].map(([label, value]) => <div className="min-w-0" key={label}><dt className="text-slate-500">{label}</dt><dd className="mt-1 break-words font-semibold text-ink">{value}</dd></div>)}</dl>
          <div className="text-xs"><p className="font-semibold text-slate-600">Email tài khoản</p><p className="mt-1 break-all text-ink">{profile.email || 'Chưa có email'}</p><p className="mt-2 leading-relaxed text-slate-500">{profile.role === 'OWNER'
            ? 'Email chỉ đọc và là địa chỉ nhận OTP Audit Log. Nếu email thiếu hoặc không đúng, hãy liên hệ quản trị viên tài khoản.'
            : 'Email chỉ đọc và không thể thay đổi tại đây.'}</p></div>
        </fieldset><button disabled={busy} className={securityButton}>{busy ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}Lưu hồ sơ</button></form>
      </section>
      <div className="space-y-5"><section id="password" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 font-display text-base font-bold text-ink"><KeyRound size={18} />Bảo mật tài khoản</h2><p className="mt-1 text-xs leading-relaxed text-slate-500">Sau khi đổi mật khẩu, các token cũ sẽ không còn hợp lệ. Bạn cần đăng nhập lại trên các thiết bị.</p>
        <form aria-label="Đổi mật khẩu" onSubmit={changePassword} className="mt-5 space-y-4"><fieldset disabled={busy} className="space-y-4">{[
          { label: 'Mật khẩu hiện tại', value: currentPassword, set: setCurrentPassword, auto: 'current-password' },
          { label: 'Mật khẩu mới', value: password, set: setPassword, auto: 'new-password' },
          { label: 'Xác nhận mật khẩu mới', value: confirm, set: setConfirm, auto: 'new-password' },
        ].map(field => <label key={field.label} className="block text-xs font-semibold text-slate-600">{field.label}<input aria-label={field.label} type="password" required className={securityField} value={field.value} onChange={e => field.set(e.target.value)} autoComplete={field.auto} maxLength={64} /></label>)}</fieldset><p className="text-xs text-slate-400">12–64 ký tự, tối đa 72 byte UTF-8. Không dùng lại mật khẩu hiện tại.</p><button className={securityButton} disabled={busy}>{busy ? <LoaderCircle size={15} className="animate-spin" /> : <KeyRound size={15} />}Đổi mật khẩu</button></form>
      </section>{currentUser?.role === 'OWNER' && <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-display text-sm font-bold text-ink">Quản trị chi nhánh</h2><Link className="flex items-center gap-2 text-xs font-semibold text-forest hover:underline" to="/users"><Users size={16} />Quản lý nhân viên</Link><Link className="flex items-center gap-2 text-xs font-semibold text-forest hover:underline" to="/security/audit-logs"><ShieldCheck size={16} />Bảo mật & Nhật ký</Link></section>}</div>
    </div>}
  </div>;
}
