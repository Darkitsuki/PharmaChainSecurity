import { useEffect, useMemo, useState } from 'react';
import { Building2, CheckCircle2, FileText, Mail, MapPin, Phone, Plus, PowerOff, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError, apiClient } from '../services/apiClient';
import type { CreateSupplierPayload, Supplier, UpdateSupplierPayload } from '../types';
import { AlertBanner, DataTable, Modal, PageHeader, SearchToolbar, StatCard, type Column } from '../components/common';

const emptyForm = { supplierCode: '', supplierName: '', contactPerson: '', phoneNumber: '', email: '', address: '', taxCode: '' };
type SupplierForm = typeof emptyForm;

export function SuppliersPage() {
  const { currentUser } = useAuth();
  const isOwner = currentUser?.role === 'OWNER';
  const canCreate = currentUser?.role === 'OWNER' || currentUser?.role === 'WAREHOUSE';
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Supplier | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const pageSize = 10;

  async function loadSuppliers() {
    setLoading(true); setError('');
    try { setSuppliers(await apiClient<Supplier[]>('/suppliers')); }
    catch (e) { setError(e instanceof ApiError ? e.detail || e.message : 'Không thể tải danh sách nhà cung cấp.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadSuppliers(); }, []);

  function openCreate() {
    setCreating(true); setEditing(null); setFormError('');
    setForm({ ...emptyForm, supplierCode: `NCC-${Date.now().toString().slice(-4)}` });
  }
  function openSupplier(item: Supplier) {
    setCreating(false); setEditing(item); setFormError('');
    setForm({ supplierCode: item.supplierCode, supplierName: item.supplierName, contactPerson: item.contactPerson || '', phoneNumber: item.phoneNumber || '', email: item.email || '', address: item.address || '', taxCode: item.taxCode || '' });
  }
  function closeForm() { if (!saving) { setCreating(false); setEditing(null); } }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!isOwner && editing) return;
    if (!form.supplierCode.trim() || !form.supplierName.trim()) { setFormError('Mã và tên nhà cung cấp là bắt buộc.'); return; }
    setSaving(true); setFormError('');
    try {
      let saved: Supplier;
      if (editing) {
        const payload: UpdateSupplierPayload = { supplierName: form.supplierName.trim(), contactPerson: form.contactPerson.trim() || undefined, phoneNumber: form.phoneNumber.trim() || undefined, email: form.email.trim() || undefined, address: form.address.trim() || undefined, taxCode: form.taxCode.trim() || undefined };
        saved = await apiClient<Supplier>(`/suppliers/${encodeURIComponent(editing.id)}`, { method: 'PUT', body: JSON.stringify(payload) });
        setSuppliers(items => items.map(item => item.id === saved.id ? saved : item));
        setSuccess(`Đã cập nhật nhà cung cấp “${saved.supplierName}”.`);
      } else {
        const payload: CreateSupplierPayload = { supplierCode: form.supplierCode.trim().toUpperCase(), supplierName: form.supplierName.trim(), contactPerson: form.contactPerson.trim() || undefined, phoneNumber: form.phoneNumber.trim() || undefined, email: form.email.trim() || undefined, address: form.address.trim() || undefined, taxCode: form.taxCode.trim() || undefined };
        saved = await apiClient<Supplier>('/suppliers', { method: 'POST', body: JSON.stringify(payload) });
        setSuppliers(items => [saved, ...items]);
        setSuccess(`Đã thêm nhà cung cấp “${saved.supplierName}”.`);
      }
      closeForm();
    } catch (e) { setFormError(e instanceof ApiError ? e.detail || e.message : 'Không thể lưu thông tin nhà cung cấp.'); }
    finally { setSaving(false); }
  }

  async function updateStatus() {
    if (!statusTarget || !isOwner) return;
    setStatusSaving(true);
    try {
      const saved = await apiClient<Supplier>(`/suppliers/${encodeURIComponent(statusTarget.id)}/status`, { method: 'PUT', body: JSON.stringify({ isActive: !statusTarget.isActive }) });
      setSuppliers(items => items.map(item => item.id === saved.id ? saved : item));
      setEditing(saved); setStatusTarget(null);
      setSuccess(saved.isActive ? `Đã kích hoạt lại “${saved.supplierName}”.` : `Đã tạm ngừng “${saved.supplierName}”.`);
    } catch (e) { setFormError(e instanceof ApiError ? e.detail || e.message : 'Không thể cập nhật trạng thái.'); setStatusTarget(null); }
    finally { setStatusSaving(false); }
  }

  const filtered = useMemo(() => suppliers.filter(item => {
    const term = search.trim().toLocaleLowerCase('vi');
    const matchesText = [item.supplierCode, item.supplierName, item.contactPerson || '', item.phoneNumber || '', item.taxCode || ''].some(value => value.toLocaleLowerCase('vi').includes(term));
    return matchesText && (status === 'ALL' || (status === 'ACTIVE' ? item.isActive : !item.isActive));
  }), [suppliers, search, status]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => setPage(current => Math.min(current, totalPages)), [totalPages]);

  const columns: Column<Supplier>[] = [
    { header: 'Nhà cung cấp', cell: item => <div><p className="font-semibold text-ink break-words">{item.supplierName}</p>{item.address && <p className="mt-1 flex items-start gap-1 text-xs text-slate-500"><MapPin size={12} className="mt-0.5 shrink-0"/><span className="break-words">{item.address}</span></p>}</div> },
    { header: 'Người liên hệ', cell: item => <div className="space-y-1 text-xs"><p className="font-medium text-ink">{item.contactPerson || '—'}</p>{item.phoneNumber && <p className="flex items-center gap-1 text-slate-500"><Phone size={11}/>{item.phoneNumber}</p>}{item.email && <p className="flex items-center gap-1 break-all text-slate-500"><Mail size={11} className="shrink-0"/>{item.email}</p>}</div> },
    { header: 'Mã số thuế', cell: item => <span className="text-xs text-slate-600 break-words">{item.taxCode || '—'}</span> },
    { header: 'Trạng thái', cell: item => <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{item.isActive ? <CheckCircle2 size={12}/> : <PowerOff size={12}/>} {item.isActive ? 'Hoạt động' : 'Tạm ngừng'}</span> },
  ];
  const modalOpen = creating || editing !== null;
  const readOnly = Boolean(editing) && !isOwner;
  const inputClass = 'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-forest focus:outline-none disabled:bg-slate-50 disabled:text-slate-500';

  return <div className="ui-page">
    <PageHeader title="Nhà cung cấp" actions={canCreate ? <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-white"><Plus size={16}/>Thêm nhà cung cấp</button> : undefined}/>
    {error && <AlertBanner type="error" message={error} onClose={() => setError('')}/>} {success && <AlertBanner type="success" message={success} onClose={() => setSuccess('')}/>}
    <div className="grid gap-4 sm:grid-cols-3"><StatCard loading={loading} unavailable={Boolean(error)} icon={Building2} title="Tổng nhà cung cấp" value={suppliers.length}/><StatCard loading={loading} unavailable={Boolean(error)} icon={UserCheck} title="Đang giao dịch" value={suppliers.filter(x => x.isActive).length} colorTheme="emerald"/><StatCard loading={loading} unavailable={Boolean(error)} icon={FileText} title="Đầy đủ mã số thuế" value={suppliers.filter(x => Boolean(x.taxCode)).length} colorTheme="amber"/></div>
    <SearchToolbar searchValue={search} onSearchChange={value => { setSearch(value); setPage(1); }} searchPlaceholder="Tìm theo tên, mã NCC, người liên hệ, SĐT, mã số thuế..." onRefresh={loadSuppliers} loading={loading} filterSlot={<div className="flex gap-1">{(['ALL','ACTIVE','INACTIVE'] as const).map(value => <button type="button" key={value} onClick={() => { setStatus(value); setPage(1); }} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${status === value ? 'bg-forest text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{value === 'ALL' ? 'Tất cả' : value === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngừng'}</button>)}</div>}/>
    <DataTable columns={columns} data={filtered.slice((page-1)*pageSize,page*pageSize)} keyExtractor={item => item.id} loading={loading} emptyMessage="Không tìm thấy nhà cung cấp phù hợp." onRowClick={openSupplier} rowLabel={item => `${isOwner ? 'Chỉnh sửa' : 'Xem'} nhà cung cấp ${item.supplierName}`} pagination={{ page, totalPages, totalCount: filtered.length, pageSize, onPageChange: setPage }}/>

    <Modal isOpen={modalOpen} title={creating ? 'Thêm nhà cung cấp mới' : isOwner ? 'Cập nhật nhà cung cấp' : 'Thông tin nhà cung cấp'} subtitle={editing ? `Mã nhà cung cấp: ${editing.supplierCode}` : undefined} onClose={() => { if (!statusTarget) closeForm(); }} closeOnOverlayClick={!statusTarget} maxWidth="xl">
      <form onSubmit={submit} className="space-y-4">{formError && <AlertBanner type="error" message={formError}/>}<div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-700">Mã nhà cung cấp <span className="text-rose-500" aria-hidden="true">*</span><input className={inputClass} value={form.supplierCode} onChange={e => setForm({...form,supplierCode:e.target.value})} disabled={Boolean(editing)} required/></label>
        <label className="text-xs font-semibold text-slate-700">Mã số thuế<input className={inputClass} value={form.taxCode} onChange={e => setForm({...form,taxCode:e.target.value})} disabled={readOnly}/></label>
        <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Tên nhà cung cấp <span className="text-rose-500" aria-hidden="true">*</span><input className={inputClass} value={form.supplierName} onChange={e => setForm({...form,supplierName:e.target.value})} disabled={readOnly} required/></label>
        <label className="text-xs font-semibold text-slate-700">Người liên hệ<input className={inputClass} value={form.contactPerson} onChange={e => setForm({...form,contactPerson:e.target.value})} disabled={readOnly}/></label>
        <label className="text-xs font-semibold text-slate-700">Số điện thoại<input className={inputClass} value={form.phoneNumber} onChange={e => setForm({...form,phoneNumber:e.target.value})} disabled={readOnly}/></label>
        <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Email<input type="email" className={inputClass} value={form.email} onChange={e => setForm({...form,email:e.target.value})} disabled={readOnly}/></label>
        <label className="text-xs font-semibold text-slate-700 sm:col-span-2">Địa chỉ<textarea rows={3} className={inputClass} value={form.address} onChange={e => setForm({...form,address:e.target.value})} disabled={readOnly}/></label>
      </div><div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">{editing && isOwner && <button type="button" disabled={saving} onClick={() => setStatusTarget(editing)} className={`mr-auto rounded-lg border px-4 py-2 text-xs font-semibold ${editing.isActive ? 'border-rose-200 text-rose-700' : 'border-emerald-200 text-emerald-700'}`}>{editing.isActive ? 'Tạm ngừng' : 'Kích hoạt lại'}</button>}<button type="button" onClick={closeForm} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">{readOnly ? 'Đóng' : 'Hủy'}</button>{!readOnly && <button type="submit" disabled={saving} className="rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{saving ? 'Đang lưu...' : creating ? 'Thêm mới' : 'Lưu thay đổi'}</button>}</div></form>
    </Modal>
    <Modal isOpen={statusTarget !== null} title={statusTarget?.isActive ? 'Tạm ngừng nhà cung cấp?' : 'Kích hoạt lại nhà cung cấp?'} onClose={() => { if (!statusSaving) setStatusTarget(null); }} maxWidth="sm" closeOnOverlayClick={!statusSaving}><p className="text-sm text-slate-600">{statusTarget?.isActive ? `“${statusTarget.supplierName}” sẽ không thể được chọn cho đơn mua mới. Đơn đã đặt và dữ liệu lịch sử vẫn được giữ nguyên.` : `“${statusTarget?.supplierName ?? ''}” sẽ có thể được chọn lại cho đơn mua mới.`}</p><div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" disabled={statusSaving} onClick={() => setStatusTarget(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold">Quay lại</button><button type="button" disabled={statusSaving} onClick={() => void updateStatus()} className="rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{statusSaving ? 'Đang cập nhật...' : 'Xác nhận'}</button></div></Modal>
  </div>;
}
