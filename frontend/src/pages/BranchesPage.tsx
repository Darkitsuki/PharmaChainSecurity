import { PageHeader } from '../components/common/PageHeader';
import { useEffect, useMemo, useState } from 'react';
import {
  Building,
  CheckCircle2,
  Edit2,
  FileText,
  MapPin,
  Plus,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { ApiError, apiClient } from '../services/apiClient';
import type { Branch, CreateBranchPayload, UpdateBranchPayload } from '../types';
import {
  Modal,
  DataTable,
  SearchToolbar,
  AlertBanner,
  StatCard,
  type Column,
} from '../components/common';

export function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formData, setFormData] = useState<{
    id: string;
    branchName: string;
    address: string;
  }>({
    id: '',
    branchName: '',
    address: '',
  });

  useEffect(() => {
    loadBranches();
  }, []);

  async function loadBranches() {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient<Branch[]>('/branches');
      setBranches(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || err.message);
      } else {
        setError('Không thể kết nối đến máy chủ.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreateModal() {
    setEditingBranch(null);
    setFormData({
      id: `br-${Date.now().toString().slice(-4)}`,
      branchName: '',
      address: '',
    });
    setFormError('');
    setShowModal(true);
  }

  function handleOpenEditModal(b: Branch) {
    setEditingBranch(b);
    setFormData({
      id: b.id,
      branchName: b.branchName,
      address: b.address || '',
    });
    setFormError('');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!formData.id.trim()) {
      setFormError('Mã chi nhánh là bắt buộc.');
      return;
    }

    if (!formData.branchName.trim()) {
      setFormError('Tên chi nhánh là bắt buộc.');
      return;
    }

    setSaving(true);
    try {
      if (editingBranch) {
        const payload: UpdateBranchPayload = {
          branchName: formData.branchName.trim(),
          address: formData.address.trim() || undefined,
        };

        const updated = await apiClient<Branch>(`/branches/${editingBranch.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        setBranches(prev => prev.map(b => (b.id === updated.id ? updated : b)));
        setSuccessMsg(`Cập nhật chi nhánh "${updated.branchName}" thành công.`);
      } else {
        const payload: CreateBranchPayload = {
          id: formData.id.trim(),
          branchName: formData.branchName.trim(),
          address: formData.address.trim() || undefined,
        };

        const created = await apiClient<Branch>('/branches', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        setBranches(prev => [...prev, created]);
        setSuccessMsg(`Thêm mới chi nhánh "${created.branchName}" thành công.`);
      }

      setShowModal(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.detail || err.message);
      } else {
        setFormError('Không thể lưu thông tin chi nhánh.');
      }
    } finally {
      setSaving(false);
    }
  }

  // Lọc và Tìm kiếm
  const filteredBranches = useMemo(() => {
    return branches.filter(b => {
      const term = searchTerm.toLowerCase();
      return (
        b.branchName.toLowerCase().includes(term) ||
        b.id.toLowerCase().includes(term) ||
        (b.address && b.address.toLowerCase().includes(term))
      );
    });
  }, [branches, searchTerm]);

  // Phân trang
  const paginatedBranches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBranches.slice(start, start + pageSize);
  }, [filteredBranches, currentPage]);

  const totalPages = Math.ceil(filteredBranches.length / pageSize) || 1;
  useEffect(() => setCurrentPage(value => Math.min(value, totalPages)), [totalPages]);

  // Thống kê
  const stats = useMemo(() => {
    const total = branches.length;
    const totalStaff = branches.reduce((acc, b) => acc + (b.activeUsersCount || 0), 0);
    const totalInvoices = branches.reduce((acc, b) => acc + (b.totalInvoicesCount || 0), 0);

    return { total, totalStaff, totalInvoices };
  }, [branches]);

  const columns: Column<Branch>[] = [
    {
      header: 'Mã & Tên Chi nhánh',
      cell: b => (
        <div>
          <div className="flex items-center gap-2">

            <span className="font-semibold text-ink">{b.branchName}</span>
          </div>
          {b.address && (
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
              <MapPin size={12} className="shrink-0 text-slate-400" />
              <span className="truncate max-w-[320px]">{b.address}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Nhân viên trực thuộc',
      cell: b => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <Users size={14} className="text-slate-400" />
          <span className="font-semibold">{b.activeUsersCount}</span>
          <span className="text-slate-400 text-xs">nhân sự</span>
        </div>
      ),
    },
    {
      header: 'Giao dịch hóa đơn',
      cell: b => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <FileText size={14} className="text-slate-400" />
          <span className="font-semibold">{b.totalInvoicesCount}</span>
          <span className="text-slate-400 text-xs">hóa đơn</span>
        </div>
      ),
    },
    {
      header: 'Trạng thái',
      cell: () => (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} /> Hoạt động
        </span>
      ),
    },
    {
      header: 'Thao tác',
      cell: b => (
        <button
          onClick={() => handleOpenEditModal(b)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-mint hover:text-forest cursor-pointer"
          title="Chỉnh sửa thông tin chi nhánh"
        >
          <Edit2 size={15} /> Chỉnh sửa
        </button>
      ),
    },
  ];

  return (
    <div className="ui-page">
      {/* Header */}
      <PageHeader title="Chi nhánh" actions={<>
<button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-forest hover:bg-forest/90 text-white px-4 py-2 rounded-lg font-medium text-xs shadow-sm transition-colors cursor-pointer"
        >
          <Plus size={16} />
          <span>Thêm chi nhánh mới</span>
        </button>
</>} />

      {/* Thông báo */}
      {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}
      {successMsg && <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* Thống kê KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          loading={loading} unavailable={Boolean(error)}
          icon={Building}
          title="Tổng số chi nhánh"
          value={stats.total}
          subValue="Mạng lưới cơ sở nhà thuốc đang vận hành"
        />
        <StatCard
          loading={loading} unavailable={Boolean(error)}
          icon={Users}
          title="Tổng nhân sự chuỗi"
          value={stats.totalStaff}
          subValue="Nhân viên đang kích hoạt tại các chi nhánh"
          colorTheme="emerald"
        />
        <StatCard
          loading={loading} unavailable={Boolean(error)}
          icon={ShieldCheck}
          title="Hóa đơn đã ghi nhận"
          value={stats.totalInvoices.toLocaleString('vi-VN')}
          subValue="Theo dữ liệu chi nhánh được trả về"
          colorTheme="amber"
        />
      </div>

      {/* Bộ lọc và Tìm kiếm */}
        <SearchToolbar
          searchValue={searchTerm}
          onSearchChange={t => {
            setSearchTerm(t);
            setCurrentPage(1);
          }}
          searchPlaceholder="Tìm theo tên chi nhánh, mã cơ sở, địa chỉ..."
          onRefresh={loadBranches}
          loading={loading}
        />

      {/* Bảng danh sách Chi nhánh */}
      <DataTable<Branch>
        columns={columns}
        data={paginatedBranches}
        keyExtractor={b => b.id}
        loading={loading}
        emptyMessage="Không tìm thấy chi nhánh nào phù compliance."
        pagination={{
          page: currentPage,
          totalPages,
          totalCount: filteredBranches.length,
          pageSize,
          onPageChange: setCurrentPage,
        }}
      />

      {/* Modal Thêm mới / Chỉnh sửa */}
      <Modal
        isOpen={showModal}
        title={editingBranch ? 'Chỉnh sửa Chi nhánh' : 'Thêm Chi nhánh mới'}
        onClose={() => setShowModal(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <AlertBanner type="error" message={formError} />}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mã chi nhánh (ID) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.id}
              onChange={e => setFormData({ ...formData, id: e.target.value })}
              disabled={Boolean(editingBranch)}
              placeholder="Ví dụ: br-01 hoặc br-quan-1"
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-forest disabled:bg-slate-50 font-mono"
              required
            />
            {!editingBranch && (
              <p className="text-xs text-slate-400 mt-1">
                Mã định danh duy nhất dùng cho Oracle Virtual Private Database (VPD Context).
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên cơ sở / Chi nhánh <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.branchName}
              onChange={e => setFormData({ ...formData, branchName: e.target.value })}
              placeholder="Ví dụ: Nhà thuốc PharmaSecure - Cơ sở Quận 1"
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-forest"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Địa chỉ chi nhánh
            </label>
            <textarea
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
              rows={3}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-forest resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-medium bg-forest hover:bg-forest/90 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {saving ? 'Đang lưu...' : editingBranch ? 'Lưu thay đổi' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
