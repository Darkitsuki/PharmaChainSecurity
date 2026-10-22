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
      setSuccessMsg(`Đã cập nhật thông tin thuốc '${editForm.name}'.`);
      await loadDrugs();
    } catch (err) {
      setEditError(err instanceof ApiError ? err.detail || err.message : 'Cập nhật thuốc thất bại.');
    } finally {
      setUpdating(false);
    }
  }

  async function handleDeactivate(drugId: string) {
    if (!window.confirm('Bạn có chắc chắn muốn tạm ngừng kinh doanh loại thuốc này?')) return;
    setDeactivatingId(drugId);
    setError('');
    try {
      await apiClient(`/drugs/${encodeURIComponent(drugId)}`, {
        method: 'DELETE'
      });
      setSuccessMsg('Đã chuyển trạng thái thuốc sang Tạm ngưng kinh doanh.');
      await loadDrugs();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail || err.message : 'Không thể ngừng kinh doanh thuốc.');
    } finally {
      setDeactivatingId(null);
    }
  }

  const items = result?.items || [];
  const filteredItems = items.filter((d) => {
    if (statusFilter === 'ACTIVE') return d.isActive ?? true;
    if (statusFilter === 'INACTIVE') return !(d.isActive ?? true);
    return true;
  });

  const totalCount = result?.totalCount ?? 0;
  const activeCount = items.filter((d) => d.isActive ?? true).length;
  const inactiveCount = items.filter((d) => !(d.isActive ?? true)).length;

  const columns: Column<Drug>[] = [
    {
      header: 'Mã Thuốc',
      cell: (d) => <span className="font-mono font-bold text-ink">{d.drugCode}</span>,
    },
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
            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {active ? 'Đang kinh doanh' : 'Tạm ngưng'}
          </span>
        );
      },
    },
    ...(isOwner
      ? [
          {
            header: 'Hành Động',
            align: 'right' as const,
            cell: (d: Drug) => {
              const active = d.isActive ?? true;
              return (
                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(d)}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-ink cursor-pointer"
                    title="Chỉnh sửa thông tin & giá bán"
                  >
                    <Edit3 size={13} />
                    <span>Sửa</span>
                  </button>
                  {active && (
                    <button
                      type="button"
                      onClick={() => handleDeactivate(d.drugId)}
                      disabled={deactivatingId === d.drugId}
                      className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-2.5 py-1.5 font-medium text-rose-600 shadow-2xs hover:bg-rose-50 disabled:opacity-50 cursor-pointer"
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
              );
            },
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Tổng danh mục"
          value={`${totalCount} loại`}
          icon={Pill}
          badge={{ text: 'Toàn chuỗi', variant: 'info' }}
        />
        <StatCard
          title="Đang kinh doanh"
          value={activeCount}
          icon={CheckCircle2}
          badge={{ text: 'Khả dụng', variant: 'success' }}
        />
        <StatCard
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
        data={filteredItems}
        keyExtractor={(item) => item.drugId}
        loading={loading}
        loadingText="Đang tải danh mục thuốc..."
        emptyMessage="Không tìm thấy thuốc nào phù hợp với điều kiện tìm kiếm."
        pagination={{
          page,
          totalPages: result?.totalPages ?? 1,
          totalCount: result?.totalCount,
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
        onClose={() => setEditingDrug(null)}
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
              onChange={(e) => setEditForm((p) => ({ ...p, activeIngredient: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-forest focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActiveToggle"
              checked={editForm.isActive ?? true}
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
            <button
              type="submit"
              disabled={updating}
              className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-forest/90 disabled:opacity-50"
            >
              {updating ? <LoaderCircle size={14} className="animate-spin" /> : <Edit3 size={14} />}
              <span>{updating ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
