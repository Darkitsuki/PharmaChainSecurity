import { dateTime } from '../utils/formatters';
import { PageHeader } from '../components/common/PageHeader';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Clock3, KeyRound, LoaderCircle, LockKeyhole, LogIn, Mail, ShieldCheck, ShieldX } from 'lucide-react';
import { AlertBanner, DataTable, Modal, SearchToolbar, StatCard, type Column } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { apiClient, ApiError } from '../services/apiClient';
import { auditLabels, securityButton, securityField, type AuditChallenge, type AuditEntry, type AuditGrant, type AuditStatistics } from '../services/accountSecurity';
import type { PageResult } from '../types';

const timestamp = (value: string) => dateTime.format(new Date(value));
function localDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function daysAgo(days: number) { const date = new Date(); date.setDate(date.getDate() - days); return localDate(date); }
const outcomes: Record<string, { label: string; tone: string }> = {
  SUCCESS: { label: 'Thành công', tone: 'bg-emerald-50 text-emerald-700' },
  FAILURE: { label: 'Thất bại', tone: 'bg-rose-50 text-rose-700' },
  DENIED: { label: 'Bị từ chối', tone: 'bg-amber-50 text-amber-700' },
  RECORDED: { label: 'Đã ghi nhận', tone: 'bg-slate-100 text-slate-600' },
};
function Outcome({ value }: { value: string }) { const info = outcomes[value] || outcomes.RECORDED; return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${info.tone}`}>{info.label}</span>; }

export function AuditLogsPage() {
  const { currentUser } = useAuth();
  const [password, setPassword] = useState(''); const [otp, setOtp] = useState('');
  const [challenge, setChallenge] = useState<AuditChallenge | null>(null);
  // Sensitive grant is intentionally kept only in component memory, never localStorage/URL.
  const [grant, setGrant] = useState<AuditGrant | null>(null);
  const [busy, setBusy] = useState(false);
  const [passwordError, setPasswordError] = useState(''); const [otpError, setOtpError] = useState(''); const [listError, setListError] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [otpUnavailable, setOtpUnavailable] = useState(false);
  const [result, setResult] = useState<PageResult<AuditEntry> | null>(null);
  const [statistics, setStatistics] = useState<AuditStatistics | null>(null);
  const [loading, setLoading] = useState(false); const [detail, setDetail] = useState<AuditEntry | null>(null);
  const [preset, setPreset] = useState('7'); const [from, setFrom] = useState(daysAgo(6)); const [to, setTo] = useState(daysAgo(0));
  const [username, setUsername] = useState(''); const [eventType, setEventType] = useState(''); const [outcome, setOutcome] = useState(''); const [search, setSearch] = useState('');
  const [page, setPage] = useState(1); const [revision, setRevision] = useState(0);
  const inFlight = useRef(false);
  function message(e: unknown) { return e instanceof ApiError ? e.detail || e.message : 'Không kết nối được máy chủ. Vui lòng thử lại.'; }
  async function start(event: FormEvent) {
    event.preventDefault(); if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setPasswordError(''); setOtpUnavailable(false);
    try { setChallenge(await apiClient<AuditChallenge>('/security/audit-access/challenges', { method: 'POST', body: JSON.stringify({ password }) })); }
    catch (e) { setPasswordError(message(e)); setOtpUnavailable(e instanceof ApiError && e.status === 503); }
    finally { setPassword(''); setBusy(false); inFlight.current = false; }
  }
  async function verify(event: FormEvent) {
    event.preventDefault(); if (!challenge || inFlight.current) return;
    inFlight.current = true; setBusy(true); setOtpError('');
    try { setGrant(await apiClient<AuditGrant>('/security/audit-access/verify', { method: 'POST', body: JSON.stringify({ challengeId: challenge.challengeId, code: otp }) })); setChallenge(null); }
    catch (e) { setOtpError(message(e)); }
    finally { setOtp(''); setBusy(false); inFlight.current = false; }
  }
  useEffect(() => {
    if (!grant) return;
    const expiresAt = new Date(grant.expiresAt).getTime();
    const update = () => setRemainingSeconds(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    update();
    const countdown = window.setInterval(update, 1000);
    const timer = window.setTimeout(() => { setGrant(null); setDetail(null); setResult(null); setStatistics(null); setPasswordError('Phiên xem nhật ký đã hết hạn. Vui lòng xác minh lại.'); }, Math.max(0, expiresAt - Date.now()));
    return () => { window.clearInterval(countdown); window.clearTimeout(timer); };
  }, [grant]);
  useEffect(() => {
    if (!grant) return;
    const abort = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true); setListError('');
      try {
        const startDate = new Date(from + 'T00:00:00'); const endDate = new Date(to + 'T00:00:00'); endDate.setDate(endDate.getDate() + 1);
        if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || endDate <= startDate || (endDate.getTime() - startDate.getTime()) / 86400000 > 93) throw new Error('Chọn khoảng thời gian hợp lệ, tối đa 93 ngày.');
        const params = new URLSearchParams({ startDate: startDate.toISOString(), endDate: endDate.toISOString(), page: String(page), pageSize: '20' });
        if (username.trim()) params.set('username', username.trim()); if (eventType) params.set('eventType', eventType); if (outcome) params.set('outcome', outcome); if (search.trim()) params.set('search', search.trim());
        const options = { headers: { 'X-Audit-Access': grant.accessToken }, signal: abort.signal };
        const [logs, summary] = await Promise.all([apiClient<PageResult<AuditEntry>>(`/security/audit-logs?${params}`, options), apiClient<AuditStatistics>(`/security/audit-logs/statistics?${params}`, options)]);
        if (!abort.signal.aborted) { setResult(logs); setStatistics(summary); }
      } catch (e) {
        if (!abort.signal.aborted) {
          setListError(e instanceof Error ? e.message : message(e)); setResult(null); setStatistics(null);
          if (e instanceof ApiError && e.status === 403) { setGrant(null); setDetail(null); }
        }
      } finally { if (!abort.signal.aborted) setLoading(false); }
    }, 250);
    return () => { window.clearTimeout(timer); abort.abort(); };
  }, [grant, from, to, username, eventType, outcome, search, page, revision]);
  async function inspect(id: string) {
    if (!grant) return; setBusy(true); setListError('');
    try { setDetail(await apiClient<AuditEntry>(`/security/audit-logs/${encodeURIComponent(id)}`, { headers: { 'X-Audit-Access': grant.accessToken } })); }
    catch (e) { setListError(message(e)); if (e instanceof ApiError && e.status === 403) setGrant(null); }
    finally { setBusy(false); }
  }
  async function lock() {
    if (!grant) return; setBusy(true);
    try { await apiClient('/security/audit-access', { method: 'DELETE', headers: { 'X-Audit-Access': grant.accessToken } }); }
    catch (e) { setListError(message(e)); }
    finally { setGrant(null); setResult(null); setStatistics(null); setDetail(null); setBusy(false); }
  }
  const columns: Column<AuditEntry>[] = [
    { header: 'Thời gian', cell: row => <span className="whitespace-nowrap text-xs">{timestamp(row.createdDate)}</span> },
    { header: 'Tài khoản', cell: row => <span className="break-all font-semibold text-ink">{row.username}</span> },
    { header: 'Hoạt động', cell: row => <span>{auditLabels[row.eventType] || row.eventType}</span> },
    { header: 'Kết quả', cell: row => <Outcome value={row.outcome} /> },
  ];
  return <div className="space-y-5">
    <PageHeader title="Bảo mật & Nhật ký" actions={grant ? <button className={securityButton} disabled={busy} onClick={() => void lock()}><LockKeyhole size={15} />Khóa nhật ký</button> : undefined} />
    {!grant ? <section className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-line bg-slate-50/70 px-5 py-5 sm:px-7"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mint text-forest"><LockKeyhole size={21} /></span><div><h2 className="font-display text-base font-bold text-ink">Xác minh để xem nhật ký</h2><p className="mt-1 text-xs leading-5 text-slate-500">Hoàn thành tuần tự hai bước bên dưới. Quyền có hiệu lực tối đa 10 phút và tự khóa sau 5 phút không hoạt động.</p></div></div>
      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7"><form aria-label="Xác minh mật khẩu" onSubmit={start} className={`space-y-4 rounded-xl border p-4 ${challenge ? 'border-emerald-200 bg-emerald-50/40' : 'border-line bg-white'}`}><div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-semibold text-ink"><span className="grid h-6 w-6 place-items-center rounded-full bg-forest text-[11px] text-white">1</span><KeyRound size={16} />Mật khẩu</h3>{challenge && <span className="text-xs font-semibold text-emerald-700">Đã xác minh</span>}</div><label className="block text-xs font-semibold text-slate-600">Mật khẩu đăng nhập<input aria-label="Mật khẩu xác minh" type="password" required autoComplete="current-password" value={password} onChange={e => { setPassword(e.target.value); setPasswordError(''); }} className={securityField} maxLength={72} disabled={busy || !!challenge} /></label><AlertBanner message={passwordError} onClose={() => setPasswordError('')} /><button disabled={busy || !!challenge} className={securityButton}>{busy && <LoaderCircle size={14} className="animate-spin" />}{challenge ? 'Đã xác minh' : 'Xác minh mật khẩu'}</button></form>
        <form aria-label="Xác minh OTP" onSubmit={verify} className={`space-y-4 rounded-xl border p-4 transition-colors ${challenge ? 'border-forest/30 bg-white' : 'border-line bg-slate-50/60'}`}><h3 className="flex items-center gap-2 text-sm font-semibold text-ink"><span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] ${challenge ? 'bg-forest text-white' : 'bg-slate-200 text-slate-500'}`}>2</span><Mail size={16} />OTP email</h3>{challenge ? <p className="text-xs text-slate-500">Mã đã được gửi đến <strong>{challenge.maskedEmail}</strong>.</p> : <p className="text-xs leading-5 text-slate-400">Bước này được mở sau khi mật khẩu hợp lệ.</p>}<label className="block text-xs font-semibold text-slate-600">Mã OTP<input aria-label="Mã OTP" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={otp} onChange={e => { setOtp(e.target.value); setOtpError(''); }} className={securityField} disabled={!challenge || busy} /></label><AlertBanner message={otpError} onClose={() => setOtpError('')} /><button className={securityButton} disabled={!challenge || busy || otp.length !== 6}>Mở nhật ký</button>{challenge && <p className="text-xs text-slate-500">Mã có hiệu lực đến {timestamp(challenge.expiresAt)}. Tối đa 5 lần thử.</p>}</form></div>
      <div className="border-t border-line px-5 py-4 sm:px-7"><AlertBanner type={otpUnavailable ? 'warning' : 'info'} message={otpUnavailable
        ? 'Không thể gửi OTP. Kiểm tra cấu hình Gmail hệ thống hoặc email của tài khoản.'
        : 'OTP được gửi tự động đến email gắn với tài khoản. Bạn không cần nhập địa chỉ email.'} /></div>
    </section> : <>
      <p className={`flex items-center gap-2 text-xs ${remainingSeconds <= 60 ? 'font-semibold text-amber-700' : 'text-slate-500'}`}><Clock3 size={14} />Còn {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')} (tối đa đến {timestamp(grant.expiresAt)}). Chỉ dữ liệu chi nhánh của bạn.</p>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[
        { title: 'Đăng nhập thành công', value: statistics?.loginSuccess, icon: LogIn }, { title: 'Đăng nhập thất bại', value: statistics?.loginFailure, icon: KeyRound },
        { title: 'Truy cập bị từ chối', value: statistics?.accessDenied, icon: ShieldX }, { title: 'Thao tác quan trọng', value: statistics?.importantActions, icon: ShieldCheck },
      ].map(card => <StatCard key={card.title} title={card.title} value={loading || !statistics ? '—' : card.value ?? '—'} icon={card.icon} colorTheme="slate" className="!p-4" />)}</div>
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-end gap-3">
        <div><span className="mb-1.5 block text-xs font-semibold text-slate-600">Khoảng thời gian</span><div className="inline-flex rounded-lg border border-line bg-slate-50 p-1" role="group" aria-label="Khoảng thời gian">{[['1','Hôm nay'],['7','7 ngày'],['30','30 ngày'],['custom','Tùy chọn']].map(([value,label]) => <button key={value} type="button" aria-pressed={preset === value} onClick={() => { setPreset(value); setPage(1); if (value !== 'custom') { setFrom(daysAgo(Number(value) - 1)); setTo(daysAgo(0)); } }} className={`min-h-9 rounded-md px-3 text-xs font-semibold transition-colors ${preset === value ? 'bg-forest text-white shadow-2xs' : 'text-slate-600 hover:bg-white hover:text-ink'}`}>{label}</button>)}</div></div>
        {preset === 'custom' && <><label className="text-xs font-semibold text-slate-600">Từ ngày<input aria-label="Từ ngày" type="date" className={securityField} value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} /></label><label className="text-xs font-semibold text-slate-600">Đến ngày<input aria-label="Đến ngày" type="date" className={securityField} value={to} onChange={e => { setTo(e.target.value); setPage(1); }} /></label></>}
        <label className="min-w-0 flex-1 text-xs font-semibold text-slate-600">Tài khoản<input aria-label="Lọc tài khoản" className={securityField} value={username} maxLength={100} onChange={e => { setUsername(e.target.value); setPage(1); }} placeholder="Nhập username" /></label>
        <details className="w-full rounded-lg border border-line bg-slate-50 p-3"><summary className="cursor-pointer text-sm font-semibold text-slate-600">Bộ lọc nâng cao</summary><div className="mt-3 flex flex-wrap gap-3"><label className="min-w-0 text-xs font-semibold text-slate-600">Loại sự kiện<select aria-label="Loại sự kiện" className={`${securityField} max-w-[260px]`} value={eventType} onChange={e => { setEventType(e.target.value); setPage(1); }}><option value="">Tất cả loại sự kiện</option>{Object.entries(auditLabels).map(([key, label]) => <option key={key} value={key}>{label} ({key})</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-600">Kết quả<select aria-label="Kết quả" className={securityField} value={outcome} onChange={e => { setOutcome(e.target.value); setPage(1); }}><option value="">Tất cả</option>{Object.entries(outcomes).map(([value, info]) => <option key={value} value={value}>{info.label}</option>)}</select></label>
      </div></details></div><SearchToolbar searchValue={search} searchLabel="Tìm nhật ký" onSearchChange={value => { setSearch(value); setPage(1); }} searchPlaceholder="Tìm tài khoản hoặc mã loại sự kiện…" onRefresh={() => setRevision(v => v + 1)} loading={loading} /></section>
      <AlertBanner message={listError} onClose={() => setListError('')} />
      <DataTable columns={columns} data={result?.items || []} keyExtractor={row => row.id} loading={loading} onRowClick={row => void inspect(row.id)} rowLabel={row => `Xem chi tiết sự kiện ${row.id}`} emptyMessage={listError ? 'Không tải được nhật ký. Kiểm tra bộ lọc hoặc tải lại.' : 'Không có sự kiện phù hợp trong khoảng thời gian đã chọn.'} pagination={{ page, totalPages: result?.totalPages || 1, totalCount: result?.totalCount || 0, onPageChange: setPage, itemLabel: 'sự kiện' }} />
      <p className="text-xs leading-relaxed text-slate-400">Chỉ hiển thị thông tin thực sự được lưu. Nhật ký không cung cấp lịch sử đầy đủ giá trị trước/sau thay đổi. Không thể sửa hoặc xóa bản ghi tại đây.</p>
    </>}
    <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="Chi tiết sự kiện" icon={ShieldCheck} maxWidth="2xl">{detail && <dl className="grid gap-4 text-xs sm:grid-cols-2">{[
      ['Mã sự kiện', detail.id], ['Thời gian', timestamp(detail.createdDate)], ['Tài khoản', detail.username], ['Chi nhánh', currentUser?.branchName || detail.branchId],
      ['Loại sự kiện', `${auditLabels[detail.eventType] || detail.eventType} (${detail.eventType})`], ['Kết quả', (outcomes[detail.outcome] || outcomes.RECORDED).label],
      ['Địa chỉ IP', detail.ipAddress || 'Không được lưu'], ['User-Agent', detail.userAgent || 'Không được lưu'], ['Nội dung / lý do', detail.failureReason || 'Không có'],
    ].map(([label, value]) => <div className="min-w-0" key={label}><dt className="mb-1.5 text-slate-500">{label}</dt><dd className="whitespace-pre-wrap break-words font-medium leading-relaxed text-ink">{value}</dd></div>)}</dl>}</Modal>
  </div>;
}
