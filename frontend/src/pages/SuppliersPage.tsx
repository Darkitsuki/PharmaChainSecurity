import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Edit2,
  FileText,
  Mail,
  MapPin,
  Phone,
  PowerOff,
  Plus,
  UserCheck,
} from 'lucide-react';
import { ApiError, apiClient } from '../services/apiClient';
import type { Supplier, CreateSupplierPayload } from '../types';
import {
  Modal,
  DataTable,
  SearchToolbar,
  AlertBanner,
  StatCard,
  type Column,
} from '../components/common';

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formData, setFormData] = useState<{
    supplierCode: string;
    supplierName: string;
    contactPerson: string;
    phoneNumber: string;
    email: string;
    address: string;
    taxCode: string;
    isActive: boolean;
  }>({
    supplierCode: '',
    supplierName: '',
    contactPerson: '',
    phoneNumber: '',
    email: '',
    address: '',
    taxCode: '',
    isActive: true,
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  async function loadSuppliers() {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient<Supplier[]>('/suppliers');
      setSuppliers(data);
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
    setEditingSupplier(null);
    setFormData({
      supplierCode: `NCC-${Date.now().toString().slice(-4)}`,
      supplierName: '',
      contactPerson: '',
      phoneNumber: '',
      email: '',
      address: '',
      taxCode: '',
      isActive: true,
    });
    setFormError('');
    setShowModal(true);
  }

  function handleOpenEditModal(s: Supplier) {
    setEditingSupplier(s);
    setFormData({
      supplierCode: s.supplierCode,
      supplierName: s.supplierName,
      contactPerson: s.contactPerson || '',
      phoneNumber: s.phoneNumber || '',
      email: s.email || '',
      address: s.address || '',
      taxCode: s.taxCode || '',
      isActive: s.isActive,
    });
    setFormError('');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!formData.supplierCode.trim()) {
      setFormError('Vui lòng nhập mã nhà cung cấp.');
      return;
    }

    if (!formData.supplierName.trim()) {
      setFormError('Vui lòng nhập tên nhà cung cấp.');
      return;
    }

    setSaving(true);
    try {
      if (editingSupplier) {
        setSuccessMsg('Tính năng chỉnh sửa nhà cung cấp đang được hoàn thiện.');
      } else {
        const payload: CreateSupplierPayload = {
          supplierCode: formData.supplierCode.trim().toUpperCase(),
          supplierName: formData.supplierName.trim(),
          contactPerson: formData.contactPerson.trim() || undefined,
          phoneNumber: formData.phoneNumber.trim() || undefined,
          email: formData.email.trim() || undefined,
          address: formData.address.trim() || undefined,
          taxCode: formData.taxCode.trim() || undefined,
        };

        const created = await apiClient<Supplier>('/suppliers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        setSuppliers(prev => [created, ...prev]);
        setSuccessMsg(`Thêm nhà cung cấp "${created.supplierName}" thành công.`);
      }

      setShowModal(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.detail || err.message);
      } else {
        setFormError('Không thể lưu thông tin nhà cung cấp.');
      }
    } finally {
      setSaving(false);
    }
  }

  // Lọc và Tìm kiếm
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const matchSearch =
        s.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.supplierCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.phoneNumber && s.phoneNumber.includes(searchTerm)) ||
        (s.taxCode && s.taxCode.includes(searchTerm));

      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'ACTIVE'
          ? s.isActive
          : !s.isActive;

      return matchSearch && matchStatus;
    });
  }, [suppliers, searchTerm, statusFilter]);

  // Phân trang
  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSuppliers.slice(start, start + pageSize);
  }, [filteredSuppliers, currentPage]);

  const totalPages = Math.ceil(filteredSuppliers.length / pageSize) || 1;

  // Thống kê
  const stats = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter(s => s.isActive).length;
    const hasTaxCode = suppliers.filter(s => Boolean(s.taxCode)).length;

    return { total, active, hasTaxCode };
  }, [suppliers]);

  const columns: Column<Supplier>[] = [
    {
      header: 'Mã & Tên nhà cung cấp',
      cell: s => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-slate-500">{s.supplierCode}</span>
            <span className="font-semibold text-ink">{s.supplierName}</span>
          </div>
          {s.address && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
              <MapPin size={12} className="shrink-0" />
              <span className="truncate max-w-[280px]">{s.address}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Người liên hệ',
      cell: s => (
        <div>
          <div className="font-medium text-ink text-xs">{s.contactPerson || '—'}</div>
          {s.phoneNumber && (
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
              <Phone size={11} className="shrink-0 text-slate-400" />
              <span>{s.phoneNumber}</span>
            </div>
          )}
          {s.email && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Mail size={11} className="shrink-0" />
              <span>{s.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Mã số thuế',
      cell: s => (
        <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
          {s.taxCode || '—'}
        </span>
      ),
    },
    {
      header: 'Trạng thái',
      cell: s => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
            s.isActive
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}
        >
          {s.isActive ? (
            <>
              <CheckCircle2 size={12} /> Hoạt động
            </>
          ) : (
            <>
              <PowerOff size={12} /> Tạm ngừng
            </>
          )}
        </span>
      ),
    },
    {
      header: 'Thao tác',
      cell: s => (
        <button
          onClick={() => handleOpenEditModal(s)}
          className="p-1.5 text-slate-400 hover:text-forest hover:bg-mint/40 rounded-md transition-colors"
          title="Xem / Chỉnh sửa"
        >
          <Edit2 size={15} />
        </button>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-display text-ink">Quản lý Nhà cung cấp</h1>
            <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
              {suppliers.length} đối tác
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý mạng lưới đối tác phân phối dược phẩm và vật tư y tế toàn hệ thống
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-forest hover:bg-forest-dark text-white px-4 py-2 rounded-lg font-medium text-xs shadow-sm transition-colors cursor-pointer"
        >
          <Plus size={16} />
          <span>Thêm nhà cung cấp</span>
        </button>
      </div>

      {/* Thông báo */}
      {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}
      {successMsg && <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* Thống kê KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Building2}
          title="Tổng nhà cung cấp"
          value={stats.total}
          subValue="Đối tác đã đăng ký trong hệ thống"
        />
        <StatCard
          icon={UserCheck}
          title="Đang giao dịch"
          value={stats.active}
          subValue="Nhà cung cấp đang hoạt động"
          colorTheme="emerald"
        />
        <StatCard
          icon={FileText}
          title="Đầy đủ mã số thuế"
          value={stats.hasTaxCode}
          subValue="Đối tác có thông tin MST doanh nghiệp"
          colorTheme="amber"
        />
      </div>

      {/* Bộ lọc và Tìm kiếm */}
      <div className="bg-white p-4 rounded-xl border border-line shadow-sm space-y-3">
        <SearchToolbar
          searchValue={searchTerm}
          onSearchChange={t => {
            setSearchTerm(t);
            setCurrentPage(1);
          }}
          searchPlaceholder="Tìm theo tên, mã NCC, người liên hệ, SĐT, mã số thuế..."
          onRefresh={loadSuppliers}
          loading={loading}
        />

        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium">Trạng thái:</span>
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map(st => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'ALL' ? 'Tất cả' : st === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm ngừng'}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách Nhà cung cấp */}
      <DataTable<Supplier>
        columns={columns}
        data={paginatedSuppliers}
        keyExtractor={s => s.id}
        loading={loading}
        emptyMessage="Không tìm thấy nhà cung cấp nào phù hợp."
        pagination={{
          page: currentPage,
          totalPages,
          totalCount: filteredSuppliers.length,
          pageSize,
          onPageChange: setCurrentPage,
        }}
      />

      {/* Modal Thêm mới / Chỉnh sửa */}
      <Modal
        isOpen={showModal}
        title={editingSupplier ? 'Thông tin Nhà cung cấp' : 'Thêm Nhà cung cấp mới'}
        onClose={() => setShowModal(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <AlertBanner type="error" message={formError} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mã nhà cung cấp <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.supplierCode}
                onChange={e => setFormData({ ...formData, supplierCode: e.target.value })}
                disabled={Boolean(editingSupplier)}
                placeholder="Ví dụ: NCC-001"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-forest disabled:bg-slate-50 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mã số thuế
              </label>
              <input
                type="text"
                value={formData.taxCode}
                onChange={e => setFormData({ ...formData, taxCode: e.target.value })}
                placeholder="Ví dụ: 0101234567"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-forest font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên công ty / Nhà cung cấp <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.supplierName}
              onChange={e => setFormData({ ...formData, supplierName: e.target.value })}
              placeholder="Ví dụ: Dược phẩm Hậu Giang (DHG Pharma)"
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-forest"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Người liên hệ / Đại diện
              </label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="Ví dụ: Nguyễn Văn A"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="Ví dụ: 0912345678"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-forest"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email liên hệ
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@nhacungcap.vn"
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-forest"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Địa chỉ trụ sở
            </label>
            <textarea
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="Địa chỉ số nhà, đường, quận/huyện, tỉnh/thành phố..."
              rows={2}
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
              className="px-4 py-2 text-xs font-medium bg-forest hover:bg-forest-dark text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {saving ? 'Đang lưu...' : editingSupplier ? 'Lưu thay đổi' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
