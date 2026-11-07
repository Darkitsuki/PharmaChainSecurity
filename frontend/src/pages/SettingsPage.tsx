import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Building2, Eye, EyeOff, KeyRound, LoaderCircle, Mail, Save, ShieldCheck, UserRound } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertBanner } from '../components/common';
import { PageHeader } from '../components/common/PageHeader';
import { useAuth } from '../context/AuthContext';
import { apiClient, ApiError } from '../services/apiClient';
import { roleLabels, securityButton, securityField, type AccountProfile } from '../services/accountSecurity';

type SettingsTab = 'profile' | 'security';
type PasswordField = 'current' | 'new' | 'confirm';

interface PasswordInputProps {
  field: PasswordField;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  visible: boolean;
  error: string;
  onToggleVisibility: () => void;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PS';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function PasswordInput({ field, label, value, onChange, autoComplete, visible, error, onToggleVisibility }: PasswordInputProps) {
  const inputId = `password-${field}`;
  const errorId = `${inputId}-error`;

  return <div>
    <label htmlFor={inputId} className="block text-xs font-semibold text-slate-600">{label}</label>
    <div className="relative">
      <input id={inputId} type={visible ? 'text' : 'password'} required className={`${securityField} account-password-input pr-12`} value={value} onChange={event => onChange(event.target.value)} autoComplete={autoComplete} maxLength={64} aria-invalid={Boolean(value && error)} aria-describedby={errorId} />
      <button type="button" onClick={onToggleVisibility} className="absolute inset-y-0 right-0 mt-1.5 grid w-11 place-items-center rounded-r-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-forest" aria-label={`${visible ? 'Ẩn' : 'Hiện'} ${label.toLowerCase()}`} aria-controls={inputId}>
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
    {value && error && <p id={errorId} className="mt-1.5 text-xs text-rose-600">{error}</p>}
  </div>;
}

export function SettingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, refreshCurrentUser, clearSession } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>(location.hash === '#password' ? 'security' : 'profile');
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<PasswordField, boolean>>({ current: false, new: false, confirm: false });
  const profileInFlight = useRef(false);
  const passwordInFlight = useRef(false);

  useEffect(() => setActiveTab(location.hash === '#password' ? 'security' : 'profile'), [location.hash]);

  useEffect(() => {
    const abort = new AbortController();
    apiClient<AccountProfile>('/account/profile', { signal: abort.signal }).then(value => {
      if (!abort.signal.aborted) {
        setProfile(value);
        setFullName(value.fullName);
        setPhone(value.phoneNumber || '');
      }
    }).catch(error => {
      if (!abort.signal.aborted) setProfileError(error instanceof Error ? error.message : 'Không tải được hồ sơ.');
    }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, []);

  const normalizedName = fullName.trim();
  const normalizedPhone = phone.trim();
  const nameError = !normalizedName ? 'Họ và tên không được để trống.'
    : new TextEncoder().encode(normalizedName).length > 255 ? 'Họ và tên tối đa 255 byte.' : '';
  const phoneError = normalizedPhone && !/^[+0-9 ()-]{6,20}$/.test(normalizedPhone)
    ? 'Số điện thoại chỉ gồm 6–20 ký tự số, +, khoảng trắng, () hoặc -.' : '';
  const profileChanged = Boolean(profile) && (normalizedName !== profile?.fullName || normalizedPhone !== (profile?.phoneNumber || ''));
  const canSaveProfile = profileChanged && !nameError && !phoneError && !profileBusy;

  function selectTab(tab: SettingsTab) {
    setActiveTab(tab);
    navigate({ pathname: location.pathname, hash: tab === 'security' ? '#password' : '' }, { replace: true });
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!canSaveProfile || profileInFlight.current) return;
    setProfileError('');
    setProfileSuccess('');
    profileInFlight.current = true;
    setProfileBusy(true);
    try {
      const result = await apiClient<AccountProfile>('/account/profile', {
        method: 'PUT',
        body: JSON.stringify({ fullName: normalizedName, phoneNumber: normalizedPhone || null }),
      });
      setProfile(result);
      setFullName(result.fullName);
      setPhone(result.phoneNumber || '');
      setProfileSuccess('Đã lưu thay đổi hồ sơ.');
      try { await refreshCurrentUser(); }
      catch { setProfileError('Hồ sơ đã lưu; chưa đồng bộ được tên ở header. Vui lòng tải lại trang.'); }
    } catch (error) {
      setProfileError(error instanceof ApiError ? error.detail || error.message : 'Chưa thể lưu hồ sơ. Dữ liệu bạn đã nhập vẫn được giữ nguyên.');
    } finally {
      profileInFlight.current = false;
      setProfileBusy(false);
    }
  }

  const passwordFieldErrors: Record<PasswordField, string> = {
    current: currentPassword ? '' : 'Nhập mật khẩu hiện tại.',
    new: !password ? 'Nhập mật khẩu mới.'
      : password.length < 12 || password.length > 64 || new TextEncoder().encode(password).length > 72
        ? 'Mật khẩu cần 12–64 ký tự và tối đa 72 byte UTF-8.' : '',
    confirm: !confirm ? 'Xác nhận mật khẩu mới.' : confirm !== password ? 'Mật khẩu xác nhận chưa trùng khớp.' : '',
  };
  const canChangePassword = !passwordBusy && Object.values(passwordFieldErrors).every(value => !value);

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordError('');
    if (!canChangePassword || passwordInFlight.current) return;
    passwordInFlight.current = true;
    setPasswordBusy(true);
    try {
      await apiClient('/account/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword: password, confirmPassword: confirm }),
      });
      setCurrentPassword('');
      setPassword('');
      setConfirm('');
      clearSession('Đổi mật khẩu thành công. Các phiên cũ đã mất hiệu lực; vui lòng đăng nhập lại.');
    } catch (error) {
      setPasswordError(error instanceof ApiError ? error.detail || error.message : 'Không thể cập nhật mật khẩu. Vui lòng kiểm tra và thử lại.');
    } finally {
      passwordInFlight.current = false;
      setPasswordBusy(false);
    }
  }

  return <div className="space-y-5">
    <PageHeader title="Tài khoản của tôi" description="Quản lý thông tin cá nhân và bảo mật tài khoản." />
    <div className="inline-flex w-full rounded-xl border border-slate-200 bg-white p-1 sm:w-auto" role="tablist" aria-label="Cài đặt tài khoản">
      <button type="button" role="tab" aria-selected={activeTab === 'profile'} aria-controls="profile-panel" onClick={() => selectTab('profile')} className={'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest sm:flex-none ' + (activeTab === 'profile' ? 'bg-forest text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-ink')}><UserRound size={17} />Hồ sơ cá nhân</button>
      <button type="button" role="tab" aria-selected={activeTab === 'security'} aria-controls="security-panel" onClick={() => selectTab('security')} className={'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest sm:flex-none ' + (activeTab === 'security' ? 'bg-forest text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-ink')}><ShieldCheck size={17} />Bảo mật tài khoản</button>
    </div>

    {loading ? <p role="status" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} />Đang tải hồ sơ…</p>
      : !profile ? <AlertBanner message={profileError || 'Không tải được hồ sơ. Vui lòng tải lại trang.'} />
      : <>
        <section id="profile-panel" role="tabpanel" hidden={activeTab !== 'profile'} className="max-w-4xl rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex min-w-0 items-center gap-4 border-b border-slate-100 p-5 sm:p-6">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-mint font-display text-base font-bold text-forest">{getInitials(profile.fullName)}</span>
            <div className="min-w-0"><h2 className="truncate font-display text-lg font-bold text-ink">{profile.fullName}</h2><p className="mt-1 truncate text-sm text-slate-500">@{profile.username}</p><p className="mt-1 text-xs font-semibold text-forest">{roleLabels[profile.role] || profile.role}</p></div>
          </div>
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
            <form aria-label="Cập nhật hồ sơ" onSubmit={saveProfile} className="min-w-0 space-y-4">
              <div><h3 className="font-display text-base font-bold text-ink">Thông tin cá nhân</h3><p className="mt-1 text-xs text-slate-500">Chỉ họ tên và số điện thoại có thể cập nhật.</p></div>
              <fieldset disabled={profileBusy} className="space-y-4">
                <div><label htmlFor="profile-full-name" className="block text-xs font-semibold text-slate-600">Họ và tên</label><input id="profile-full-name" required className={securityField} value={fullName} onChange={event => { setFullName(event.target.value); setProfileSuccess(''); }} autoComplete="name" aria-invalid={Boolean(nameError)} aria-describedby="profile-name-error" />{nameError && <p id="profile-name-error" className="mt-1.5 text-xs text-rose-600">{nameError}</p>}</div>
                <div><label htmlFor="profile-phone" className="block text-xs font-semibold text-slate-600">Số điện thoại</label><input id="profile-phone" type="tel" className={securityField} value={phone} onChange={event => { setPhone(event.target.value); setProfileSuccess(''); }} maxLength={20} autoComplete="tel" aria-invalid={Boolean(phoneError)} aria-describedby="profile-phone-error" />{phoneError && <p id="profile-phone-error" className="mt-1.5 text-xs text-rose-600">{phoneError}</p>}</div>
              </fieldset>
              <AlertBanner message={profileError} onClose={() => setProfileError('')} />
              <AlertBanner type="success" message={profileSuccess} onClose={() => setProfileSuccess('')} />
              <button type="submit" disabled={!canSaveProfile} className={securityButton}>{profileBusy ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}Lưu hồ sơ</button>
            </form>
            <div className="min-w-0 lg:border-l lg:border-slate-100 lg:pl-6">
              <h3 className="font-display text-base font-bold text-ink">Thông tin tài khoản</h3>
              <dl className="mt-4 space-y-4 text-sm">
                <div className="flex min-w-0 gap-3"><UserRound size={17} className="mt-0.5 shrink-0 text-slate-400" /><div className="min-w-0"><dt className="text-xs text-slate-500">Tên đăng nhập</dt><dd className="mt-1 break-words font-semibold text-ink">{profile.username}</dd></div></div>
                <div className="flex min-w-0 gap-3"><Mail size={17} className="mt-0.5 shrink-0 text-slate-400" /><div className="min-w-0"><dt className="text-xs text-slate-500">Email tài khoản</dt><dd className="mt-1 break-all font-semibold text-ink">{profile.email || 'Chưa có email'}</dd>{profile.role === 'OWNER' && <p className="mt-1.5 text-xs leading-relaxed text-slate-500">Email này được dùng để nhận OTP khi mở Nhật ký bảo mật.</p>}</div></div>
                <div className="flex min-w-0 gap-3"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-slate-400" /><div><dt className="text-xs text-slate-500">Trạng thái</dt><dd className={'mt-1 font-semibold ' + (profile.isActive ? 'text-emerald-700' : 'text-rose-700')}>{profile.isActive ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}</dd></div></div>
                <div className="flex min-w-0 gap-3"><Building2 size={17} className="mt-0.5 shrink-0 text-slate-400" /><div className="min-w-0"><dt className="text-xs text-slate-500">{profile.role === 'OWNER' ? 'Chi nhánh gốc' : 'Chi nhánh được phân công'}</dt><dd className="mt-1 break-words font-semibold text-ink">{profile.branchName}</dd>{profile.role === 'OWNER' && <p className="mt-1.5 text-xs leading-relaxed text-slate-500">Chi nhánh đang làm việc: <strong className="text-slate-600">{currentUser?.branchName || 'Chưa xác định'}</strong></p>}</div></div>
              </dl>
            </div>
          </div>
        </section>

        <section id="security-panel" role="tabpanel" hidden={activeTab !== 'security'} className="max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-mint text-forest"><KeyRound size={19} /></span><div><h2 className="font-display text-lg font-bold text-ink">Đổi mật khẩu</h2><p className="mt-1 text-xs leading-relaxed text-slate-500">Sau khi cập nhật, các phiên cũ sẽ mất hiệu lực và bạn cần đăng nhập lại.</p></div></div>
          <form aria-label="Đổi mật khẩu" onSubmit={changePassword} className="mt-6 space-y-4">
            <fieldset disabled={passwordBusy} className="space-y-4">
              <PasswordInput field="current" label="Mật khẩu hiện tại" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" visible={visiblePasswords.current} error={passwordFieldErrors.current} onToggleVisibility={() => setVisiblePasswords(current => ({ ...current, current: !current.current }))} />
              <PasswordInput field="new" label="Mật khẩu mới" value={password} onChange={setPassword} autoComplete="new-password" visible={visiblePasswords.new} error={passwordFieldErrors.new} onToggleVisibility={() => setVisiblePasswords(current => ({ ...current, new: !current.new }))} />
              <PasswordInput field="confirm" label="Xác nhận mật khẩu mới" value={confirm} onChange={setConfirm} autoComplete="new-password" visible={visiblePasswords.confirm} error={passwordFieldErrors.confirm} onToggleVisibility={() => setVisiblePasswords(current => ({ ...current, confirm: !current.confirm }))} />
            </fieldset>
            <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-500">Mật khẩu gồm 12–64 ký tự, tối đa 72 byte UTF-8 và phải khác mật khẩu hiện tại.</p>
            <AlertBanner message={passwordError} onClose={() => setPasswordError('')} />
            <button type="submit" className={securityButton} disabled={!canChangePassword}>{passwordBusy ? <LoaderCircle size={15} className="animate-spin" /> : <KeyRound size={15} />}Cập nhật mật khẩu</button>
          </form>
        </section>
      </>}
  </div>;
}
