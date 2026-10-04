import { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  CircleAlert, 
  Edit3, 
  LoaderCircle, 
  Pill, 
  Plus, 
  PowerOff, 
  RefreshCw, 
  Search, 
  Tag, 
  X 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError, apiClient } from '../services/apiClient';
import type { CreateDrugPayload, Drug, PageResult, UpdateDrugPayload } from '../types';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

export function DrugCatalogPage() {
  const { currentUser } = useAuth();
  const isOwner = currentUser?.role === 'OWNER';

  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [result, setResult] = useState<PageResult<Drug> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newDrug, setNewDrug] = useState<CreateDrugPayload>({
    drugCode: '',
    name: '',
    activeIngredient: '',
    unit: 'Hộp',
    price: 0
  });

  // Edit Modal
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState<UpdateDrugPayload>({
    name: '',
    activeIngredient: '',
    unit: 'Hộp',
    price: 0,
    isActive: true
  });

  // Deactivate
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  useEffect(() => {
    loadDrugs();
  }, [page, searchTerm]);

  async function loadDrugs() {
    setLoading(true);
    setError('');
    try {
      const searchParam = searchTerm.trim() ? `&search=${encodeURIComponent(searchTerm.trim())}` : '';
      const data = await apiClient<PageResult<Drug>>(`/drugs?page=${page}&pageSize=${pageSize}${searchParam}`);
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail || err.message : 'Không thể tải danh mục thuốc.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDrug(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');

    if (!newDrug.drugCode.trim() || !newDrug.name.trim() || !newDrug.unit.trim()) {
      setCreateError('Mã thuốc, tên thuốc và đơn vị tính là bắt buộc.');
      return;
    }
    if (newDrug.price < 0) {
      setCreateError('Giá thuốc không thể âm.');
      return;
    }

    setCreating(true);
    try {
      await apiClient('/drugs', {
        method: 'POST',
        body: JSON.stringify({
          drugCode: newDrug.drugCode.trim().toUpperCase(),
          name: newDrug.name.trim(),
          activeIngredient: newDrug.activeIngredient?.trim() || null,
          unit: newDrug.unit.trim(),
          price: Number(newDrug.price)
        })
      });

      setShowCreateModal(false);
      setNewDrug({ drugCode: '', name: '', activeIngredient: '', unit: 'Hộp', price: 0 });
      setSuccessMsg('Thêm thuốc mới vào danh mục thành công!');
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadDrugs();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.detail || err.message : 'Thêm thuốc thất bại.');
    } finally {
      setCreating(false);
    }
  }

  function handleOpenEdit(drug: Drug) {
    setEditingDrug(drug);
    setEditForm({
      name: drug.name,
      activeIngredient: drug.activeIngredient || '',
      unit: drug.unit,
      price: drug.price,
      isActive: drug.isActive ?? true
    });
    setEditError('');
  }

  async function handleUpdateDrug(e: React.FormEvent) {
    e.preventDefault();
    if (!editingDrug) return;
    setEditError('');

    if (!editForm.name.trim() || !editForm.unit.trim()) {
      setEditError('Tên thuốc và đơn vị tính là bắt buộc.');
      return;
    }
    if (editForm.price < 0) {
      setEditError('Giá thuốc không thể âm.');
      return;
    }

    setUpdating(true);
    try {
      await apiClient(`/drugs/${encodeURIComponent(editingDrug.drugId)}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editForm.name.trim(),
          activeIngredient: editForm.activeIngredient?.trim() || null,
          unit: editForm.unit.trim(),
          price: Number(editForm.price),
          isActive: editForm.isActive
        })
      });

      setEditingDrug(null);
      setSuccessMsg('Cập nhật thông tin thuốc và giá niêm yết thành công!');
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadDrugs();
    } catch (err) {
      setEditError(err instanceof ApiError ? err.detail || err.message : 'Cập nhật thất bại.');
    } finally {
      setUpdating(false);
    }
  }

  async function handleDeactivate(drugId: string) {
    if (!confirm('Bạn có chắc muốn tạm ngừng kinh doanh thuốc này?')) return;
    setDeactivatingId(drugId);
    try {
      await apiClient(`/drugs/${encodeURIComponent(drugId)}`, { method: 'DELETE' });
      setSuccessMsg('Đã tạm ngừng kinh doanh thuốc.');
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadDrugs();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail || err.message : 'Không thể tạm ngừng thuốc.');
    } finally {
      setDeactivatingId(null);
    }
  }

  const items = result?.items || [];
  const filteredItems = items.filter(drug => {
    const active = drug.isActive ?? true;
    if (statusFilter === 'ACTIVE') return active;
    if (statusFilter === 'INACTIVE') return !active;
    return true;
  });

  const totalCount = result?.totalCount || 0;
  const activeCount = items.filter(d => (d.isActive ?? true)).length;
  const inactiveCount = items.filter(d => (d.isActive ?? true) === false).length;

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Danh Mục Thuốc
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý danh mục biệt dược, hoạt chất và bảng giá bán niêm yết cho toàn hệ thống chuỗi.
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => {
              setCreateError('');
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-forest/90"
          >
            <Plus size={16} />
            <span>Thêm Thuốc Mới</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tổng danh mục</span>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-mint text-forest">
              <Pill size={17} />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-ink">{totalCount} loại</p>
        </div>

        <div className="rounded-xl border border-line bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Đang kinh doanh</span>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={17} />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-700">{activeCount}</p>
        </div>

        <div className="rounded-xl border border-line bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tạm ngưng</span>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500">
              <PowerOff size={17} />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-slate-600">{inactiveCount}</p>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="mt-6 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="ml-auto text-emerald-500 hover:text-emerald-700">
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="mt-6 flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
          <CircleAlert size={16} className="shrink-0 text-rose-600" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-rose-500 hover:text-rose-700">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo tên thuốc, mã thuốc, hoạt chất..."
            className="w-full rounded-lg border border-line bg-white pl-9 pr-3.5 py-2 text-xs text-ink placeholder:text-slate-400 focus:border-forest focus:outline-hidden focus:ring-1 focus:ring-forest"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter buttons */}
          <div className="inline-flex rounded-lg border border-line bg-white p-1 shadow-2xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${statusFilter === 'ALL' ? 'bg-mint text-forest font-bold' : 'text-slate-500 hover:text-ink'}`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${statusFilter === 'ACTIVE' ? 'bg-mint text-forest font-bold' : 'text-slate-500 hover:text-ink'}`}
            >
              Đang bán
            </button>
            <button
              onClick={() => setStatusFilter('INACTIVE')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${statusFilter === 'INACTIVE' ? 'bg-mint text-forest font-bold' : 'text-slate-500 hover:text-ink'}`}
            >
              Tạm ngưng
            </button>
          </div>

          <button
            onClick={loadDrugs}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Drugs Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-white shadow-xs">
        {loading ? (
          <div className="flex h-64 items-center justify-center gap-2 text-xs font-medium text-slate-500">
            <LoaderCircle size={18} className="animate-spin text-forest" />
            <span>Đang tải danh mục thuốc...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center p-6 text-center">
            <Pill size={36} className="text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-ink">Không tìm thấy thuốc nào</p>
            <p className="mt-1 text-xs text-slate-400">Thử thay đổi từ khóa tìm kiếm hoặc bấm Thêm Thuốc Mới.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-slate-50/80 font-semibold text-slate-600">
                  <th className="px-4 py-3.5">Mã Thuốc</th>
                  <th className="px-4 py-3.5">Tên Biệt Dược</th>
                  <th className="px-4 py-3.5">Hoạt Chất Chính</th>
                  <th className="px-4 py-3.5">Đơn Vị</th>
                  <th className="px-4 py-3.5 text-right">Giá Bán Niêm Yết</th>
                  <th className="px-4 py-3.5 text-center">Trạng Thái</th>
                  {isOwner && <th className="px-4 py-3.5 text-right">Hành Động</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredItems.map(d => {
                  const active = d.isActive ?? true;
                  return (
                    <tr key={d.drugId} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-mono font-bold text-ink">{d.drugCode}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{d.name}</td>
                      <td className="px-4 py-3 text-slate-500">{d.activeIngredient || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{d.unit}</td>
                      <td className="px-4 py-3 text-right font-display text-[13px] font-bold text-forest">
                        {money.format(d.price)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {active ? 'Đang kinh doanh' : 'Tạm ngưng'}
                        </span>
                      </td>
                      {isOwner && (
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(d)}
                              className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2.5 py-1.5 font-medium text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-ink"
                              title="Chỉnh sửa thông tin & giá bán"
                            >
                              <Edit3 size={13} />
                              <span>Sửa</span>
                            </button>
                            {active && (
                              <button
                                onClick={() => handleDeactivate(d.drugId)}
                                disabled={deactivatingId === d.drugId}
                                className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-2.5 py-1.5 font-medium text-rose-600 shadow-2xs hover:bg-rose-50 disabled:opacity-50"
                                title="Tạm ngừng kinh doanh"
                              >
                                {deactivatingId === d.drugId ? (
                                  <LoaderCircle size={13} className="animate-spin" />
                                ) : (
                                  <PowerOff size={13} />
                                )}
                                <span>Ngừng</span>
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {result && result.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-slate-500">
            <span>
              Hiển thị trang <strong className="text-ink">{result.page}</strong> / {result.totalPages} ({result.totalCount} thuốc)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                <span>Trước</span>
              </button>
              <button
                onClick={() => setPage(p => Math.min(result.totalPages, p + 1))}
                disabled={page >= result.totalPages || loading}
                className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 hover:bg-slate-50 disabled:opacity-40"
              >
                <span>Sau</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: THÊM THUỐC MỚI (CHO CHỦ NHÀ THUỐC)                                */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-6 py-4.5">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-mint text-forest">
                  <Pill size={17} />
                </div>
                <div>
                  <h2 className="font-display text-sm font-bold text-ink">Thêm Thuốc Mới Vào Danh Mục</h2>
                  <p className="text-[11px] text-slate-500">Thuốc mới sẽ được cập nhật niêm yết cho toàn hệ thống.</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-ink"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleCreateDrug} className="p-6">
              {createError && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800">
                  {createError}
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700">Mã Thuốc <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={newDrug.drugCode}
                      onChange={e => setNewDrug(prev => ({ ...prev, drugCode: e.target.value }))}
                      placeholder="VD: THUOC005"
                      className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 uppercase text-ink focus:border-forest focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700">Đơn Vị Tính <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={newDrug.unit}
                      onChange={e => setNewDrug(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="Hộp, Chai, Vỉ, Tuýp"
                      className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink focus:border-forest focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">Tên Biệt Dược <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newDrug.name}
                    onChange={e => setNewDrug(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="VD: Kháng sinh Cefixim 200mg"
                    className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink focus:border-forest focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">Hoạt Chất Chính</label>
                  <input
                    type="text"
                    value={newDrug.activeIngredient || ''}
                    onChange={e => setNewDrug(prev => ({ ...prev, activeIngredient: e.target.value }))}
                    placeholder="VD: Cefixime trihydrate"
                    className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink focus:border-forest focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">Giá Bán Niêm Yết (VND) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={newDrug.price}
                    onChange={e => setNewDrug(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 font-display text-sm font-bold text-forest focus:border-forest focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="rounded-lg border border-line px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-white hover:bg-forest/90 disabled:opacity-50"
                >
                  {creating && <LoaderCircle size={14} className="animate-spin" />}
                  <span>Lưu Thuốc Mới</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHỈNH SỬA THUỐC VÀ CẬP NHẬT GIÁ                                    */}
      {/* ========================================================================= */}
      {editingDrug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-6 py-4.5">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-700">
                  <Tag size={17} />
                </div>
                <div>
                  <h2 className="font-display text-sm font-bold text-ink">Chỉnh Sửa Thuốc & Giá Bán</h2>
                  <p className="font-mono text-[11px] text-slate-500">{editingDrug.drugCode}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingDrug(null)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-ink"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleUpdateDrug} className="p-6">
              {editError && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800">
                  {editError}
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700">Tên Biệt Dược <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink focus:border-forest focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700">Hoạt Chất Chính</label>
                  <input
                    type="text"
                    value={editForm.activeIngredient || ''}
                    onChange={e => setEditForm(prev => ({ ...prev, activeIngredient: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink focus:border-forest focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700">Đơn Vị Tính <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={editForm.unit}
                      onChange={e => setEditForm(prev => ({ ...prev, unit: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink focus:border-forest focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700">Giá Bán Niêm Yết (VND) <span className="text-rose-500">*</span></label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      required
                      value={editForm.price}
                      onChange={e => setEditForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 font-display text-sm font-bold text-forest focus:border-forest focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={e => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="h-4 w-4 rounded border-line text-forest focus:ring-forest"
                    />
                    <span className="font-semibold text-slate-800">Đang kinh doanh (Kích hoạt bán tại quầy POS)</span>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingDrug(null)}
                  disabled={updating}
                  className="rounded-lg border border-line px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-white hover:bg-forest/90 disabled:opacity-50"
                >
                  {updating && <LoaderCircle size={14} className="animate-spin" />}
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
