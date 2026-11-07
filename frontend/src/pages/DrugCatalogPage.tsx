import { loadAllPages } from '../utils/loadAllPages';
import { money } from '../utils/formatters';
import { PageHeader } from '../components/common/PageHeader';
import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  LoaderCircle,
  Pill,
  Plus,
  PowerOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError, apiClient } from '../services/apiClient';
import type { CreateDrugPayload, Drug, PageResult, UpdateDrugPayload } from '../types';
import {
  Modal,
  DataTable,
  SearchToolbar,
  AlertBanner,
  StatCard,
  type Column,
} from '../components/common';



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
    price: 0,
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
    isActive: true,
  });

  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  useEffect(() => {
    loadDrugs();
  }, []);

  useEffect(() => setPage(1), [searchTerm, statusFilter]);

  async function loadDrugs() {
    setLoading(true);
    setError('');
    try {
      const data = await loadAllPages<Drug>('/drugs');
      setResult({ items: data, page: 1, pageSize: 100, totalCount: data.length, totalPages: 1 });
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
          price: Number(newDrug.price),
        }),
      });

      setShowCreateModal(false);
      setNewDrug({ drugCode: '', name: '', activeIngredient: '', unit: 'Hộp', price: 0 });
      setSuccessMsg(`Đã thêm mới biệt dược '${newDrug.name}' vào hệ thống.`);
      await loadDrugs();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.detail || err.message : 'Không thể tạo mới thuốc.');
    } finally {
      setCreating(false);
    }
  }

  function handleOpenEdit(drug: Drug) {
    setEditingDrug(drug);
    setEditError('');
    setEditForm({
      name: drug.name,
      activeIngredient: drug.activeIngredient || '',
      unit: drug.unit,
      price: drug.price,
      isActive: drug.isActive ?? true,
    });
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

    if ((editingDrug.isActive ?? true) && !editForm.isActive) {
      setConfirmDeactivate(true);
      return;
    }

    await saveDrug();
  }

  async function saveDrug() {
    if (!editingDrug) return;

    setUpdating(true);
    try {
      await apiClient(`/drugs/${encodeURIComponent(editingDrug.drugId)}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editForm.name.trim(),
          activeIngredient: editForm.activeIngredient?.trim() || null,
          unit: editForm.unit.trim(),
          price: Number(editForm.price),
          isActive: editForm.isActive,
        }),
      });

      setEditingDrug(null);
      setConfirmDeactivate(false);
      setSuccessMsg(`Đã cập nhật thông tin thuốc '${editForm.name}'.`);
      await loadDrugs();
    } catch (err) {
      setEditError(err instanceof ApiError ? err.detail || err.message : 'Cập nhật thuốc thất bại.');
    } finally {
      setUpdating(false);
    }
  }

  const items = result?.items || [];
  const filteredItems = items.filter((d) => {
    const term = searchTerm.trim().toLocaleLowerCase('vi');
    if (![d.drugCode, d.name, d.activeIngredient ?? ''].some(value => value.toLocaleLowerCase('vi').includes(term))) return false;
    if (statusFilter === 'ACTIVE') return d.isActive ?? true;
    if (statusFilter === 'INACTIVE') return !(d.isActive ?? true);
    return true;
  });

  const totalCount = result?.totalCount ?? 0;
  const activeCount = items.filter((d) => d.isActive ?? true).length;
  const inactiveCount = items.filter((d) => !(d.isActive ?? true)).length;

  const columns: Column<Drug>[] = [
    {
      header: 'Tên Biệt Dược',
      cell: (d) => <span className="font-semibold text-slate-900">{d.name}</span>,
    },
    {
      header: 'Hoạt Chất Chính',
      cell: (d) => <span className="text-slate-500">{d.activeIngredient || '—'}</span>,
    },
    {
      header: 'Đơn Vị',
      accessorKey: 'unit',
      className: 'text-slate-600',
    },
    {
      header: 'Giá Bán Niêm Yết',
      align: 'right',
      cell: (d) => (
        <span className="font-display text-[13px] font-bold text-forest">
          {money.format(d.price)}
        </span>
      ),
    },
    {
      header: 'Trạng Thái',
      align: 'center',
      cell: (d) => {
        const active = d.isActive ?? true;
        return (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {active ? 'Đang kinh doanh' : 'Tạm ngưng'}
          </span>
        );
      },
    },
  ];

  return (
    <div className="ui-page">
      {/* Page Header */}
      <PageHeader title="Danh mục thuốc" actions={<>
{isOwner && (
          <button
            type="button"
            onClick={() => {
              setCreateError('');
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-forest/90 cursor-pointer"
          >
            <Plus size={16} />
            <span>Thêm Thuốc Mới</span>
          </button>
        )}
</>} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          loading={loading} unavailable={Boolean(error)}
          title="Tổng danh mục"
          value={`${totalCount} loại`}
          icon={Pill}
          badge={{ text: 'Toàn chuỗi', variant: 'info' }}
        />
        <StatCard
          loading={loading} unavailable={Boolean(error)}
          title="Đang kinh doanh"
          value={activeCount}
          icon={CheckCircle2}
          badge={{ text: 'Khả dụng', variant: 'success' }}
        />
        <StatCard
          loading={loading} unavailable={Boolean(error)}
          title="Tạm ngưng"
          value={inactiveCount}
          icon={PowerOff}
          badge={{ text: 'Dừng bán', variant: 'warning' }}
        />
      </div>

      {/* Alerts */}
      <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg('')} />
      <AlertBanner type="error" message={error} onClose={() => setError('')} />

      {/* Search & Filter Toolbar */}
      <SearchToolbar
        searchValue={searchTerm}
        onSearchChange={(v) => {
          setSearchTerm(v);
          setPage(1);
        }}
        searchPlaceholder="Tìm theo tên thuốc, mã thuốc, hoạt chất..."
        onRefresh={loadDrugs}
        loading={loading}
        filterSlot={
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-2xs">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                  statusFilter === filter
                    ? 'bg-mint text-forest font-bold'
                    : 'text-slate-500 hover:text-ink'
                }`}
              >
                {filter === 'ALL' ? 'Tất cả' : filter === 'ACTIVE' ? 'Đang bán' : 'Tạm ngưng'}
              </button>
            ))}
          </div>
        }
      />

      {/* Drugs DataTable */}
      <DataTable
        columns={columns}
        data={filteredItems.slice((page - 1) * pageSize, page * pageSize)}
        keyExtractor={(item) => item.drugId}
        loading={loading}
        loadingText="Đang tải danh mục thuốc..."
        emptyMessage="Không tìm thấy thuốc nào phù hợp với điều kiện tìm kiếm."
        onRowClick={handleOpenEdit}
        rowLabel={(item) => `${isOwner ? 'Chỉnh sửa' : 'Xem'} thuốc ${item.name}`}
        pagination={{
          page,
          totalPages: Math.max(1, Math.ceil(filteredItems.length / pageSize)),
          totalCount: filteredItems.length,
          onPageChange: setPage,
          itemLabel: 'loại thuốc',
        }}
      />

      {/* Create Drug Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Thêm Biệt Dược Mới"
        subtitle="Khai báo thuốc mới vào danh mục tiêu chuẩn toàn chuỗi."
        icon={Pill}
        maxWidth="lg"
      >
        <form onSubmit={handleCreateDrug} className="space-y-4">
          <AlertBanner type="error" message={createError} onClose={() => setCreateError('')} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Mã Thuốc <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newDrug.drugCode}
                onChange={(e) => setNewDrug((p) => ({ ...p, drugCode: e.target.value.toUpperCase() }))}
                placeholder="ví dụ: THUOC099"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono uppercase focus:border-forest focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Đơn Vị Tính <span className="text-rose-500">*</span>
              </label>
              <select
                value={newDrug.unit}
                onChange={(e) => setNewDrug((p) => ({ ...p, unit: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-forest focus:outline-hidden"
              >
                <option value="Hộp">Hộp</option>
                <option value="Vỉ">Vỉ</option>
                <option value="Viên">Viên</option>
                <option value="Chai">Chai</option>
                <option value="Ống">Ống</option>
                <option value="Gói">Gói</option>
                <option value="Tuýp">Tuýp</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Tên Biệt Dược <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newDrug.name}
              onChange={(e) => setNewDrug((p) => ({ ...p, name: e.target.value }))}
              placeholder="ví dụ: Panadol Extra Đỏ"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-forest focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Hoạt Chất & Hàm Lượng</label>
            <input
              type="text"
              value={newDrug.activeIngredient || ''}
              onChange={(e) => setNewDrug((p) => ({ ...p, activeIngredient: e.target.value }))}
              placeholder="ví dụ: Paracetamol 500mg, Caffeine 65mg"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-forest focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Giá Bán Niêm Yết (VNĐ) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="500"
              required
              value={newDrug.price || ''}
              onChange={(e) => setNewDrug((p) => ({ ...p, price: Number(e.target.value) }))}
              placeholder="45000"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-display font-bold text-forest focus:border-forest focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-forest/90 disabled:opacity-50"
            >
              {creating ? <LoaderCircle size={14} className="animate-spin" /> : <Plus size={14} />}
              <span>{creating ? 'Đang thêm...' : 'Lưu Danh Mục'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Drug Modal */}
      <Modal
        isOpen={editingDrug !== null}
        onClose={() => { if (!confirmDeactivate) setEditingDrug(null); }}
        closeOnOverlayClick={!confirmDeactivate}
        title={`Chỉnh Sửa: ${editingDrug?.name || ''}`}
        subtitle={`Mã thuốc: ${editingDrug?.drugCode || ''}`}
        icon={Edit3}
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateDrug} className="space-y-4">
          <AlertBanner type="error" message={editError} onClose={() => setEditError('')} />

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Tên Biệt Dược <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={editForm.name}
              disabled={!isOwner}
              onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-forest focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Đơn Vị Tính <span className="text-rose-500">*</span>
              </label>
              <select
                value={editForm.unit}
                disabled={!isOwner}
                onChange={(e) => setEditForm((p) => ({ ...p, unit: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-forest focus:outline-hidden"
              >
                <option value="Hộp">Hộp</option>
                <option value="Vỉ">Vỉ</option>
                <option value="Viên">Viên</option>
                <option value="Chai">Chai</option>
                <option value="Ống">Ống</option>
                <option value="Gói">Gói</option>
                <option value="Tuýp">Tuýp</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Giá Bán Niêm Yết (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="500"
                required
                value={editForm.price}
                disabled={!isOwner}
                onChange={(e) => setEditForm((p) => ({ ...p, price: Number(e.target.value) }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-display font-bold text-forest focus:border-forest focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Hoạt Chất Chính</label>
            <input
              type="text"
              value={editForm.activeIngredient || ''}
              disabled={!isOwner}
              onChange={(e) => setEditForm((p) => ({ ...p, activeIngredient: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-forest focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActiveToggle"
              checked={editForm.isActive ?? true}
              disabled={!isOwner}
              onChange={(e) => setEditForm((p) => ({ ...p, isActive: e.target.checked }))}
              className="rounded text-forest focus:ring-forest cursor-pointer"
            />
            <label htmlFor="isActiveToggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Đang kinh doanh (Bỏ chọn nếu muốn tạm ngưng bán)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingDrug(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            {isOwner && <button
              type="submit"
              disabled={updating}
              className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-forest/90 disabled:opacity-50"
            >
              {updating ? <LoaderCircle size={14} className="animate-spin" /> : <Edit3 size={14} />}
              <span>{updating ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
            </button>}
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={confirmDeactivate}
        onClose={() => { if (!updating) setConfirmDeactivate(false); }}
        title="Tạm ngừng kinh doanh thuốc?"
        maxWidth="sm"
        closeOnOverlayClick={!updating}
      >
        {editError && <AlertBanner type="error" message={editError} onClose={() => setEditError('')} />}
        <p className="text-sm text-slate-600">Thuốc “{editingDrug?.name}” sẽ không còn được chọn cho bán hàng hoặc đơn mua mới. Hóa đơn, lô và dữ liệu lịch sử vẫn được giữ nguyên.</p>
        <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" disabled={updating} onClick={() => setConfirmDeactivate(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50">Quay lại</button>
          <button type="button" disabled={updating} onClick={() => void saveDrug()} className="rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{updating ? 'Đang cập nhật...' : 'Xác nhận'}</button>
        </div>
      </Modal>
    </div>
  );
}
