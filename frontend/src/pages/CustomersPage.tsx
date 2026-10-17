import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Coins,
  Edit2,
  HeartHandshake,
  LoaderCircle,
  MapPin,
  Phone,
  PowerOff,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { ApiError, apiClient } from '../services/apiClient';
import type { Customer, CreateCustomerPayload, UpdateCustomerPayload } from '../types';
import {
  Modal,
  DataTable,
  SearchToolbar,
  AlertBanner,
  StatCard,
  type Column,
} from '../components/common';

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formData, setFormData] = useState<{
    fullName: string;
    phoneNumber: string;
    customerCode: string;
    email: string;
    address: string;
    isActive: boolean;
  }>({
    fullName: '',
    phoneNumber: '',
    customerCode: '',
    email: '',
    address: '',
    isActive: true,
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient<Customer[]>('/customers');
      setCustomers(data);
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
    setEditingCustomer(null);
    setFormData({
      fullName: '',
      phoneNumber: '',
      customerCode: '',
      email: '',
      address: '',
      isActive: true,
    });
    setFormError('');
    setShowModal(true);
  }

  function handleOpenEditModal(c: Customer) {
    setEditingCustomer(c);
    setFormData({
      fullName: c.fullName,
      phoneNumber: c.phoneNumber,
      customerCode: c.customerCode,
      email: c.email || '',
      address: c.address || '',
      isActive: c.isActive,
    });
    setFormError('');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!formData.fullName.trim()) {
      setFormError('Vui lòng nhập họ và tên khách hàng.');
      return;
    }

    const cleanPhone = formData.phoneNumber.trim();
    if (!cleanPhone) {
      setFormError('Vui lòng nhập số điện thoại.');
      return;
    }

    if (!/^[0-9]{9,11}$/.test(cleanPhone)) {
      setFormError('Số điện thoại không hợp lệ (cần từ 9 đến 11 chữ số).');
      return;
    }

    setSaving(true);
    try {
      if (editingCustomer) {
        const payload: UpdateCustomerPayload = {
          fullName: formData.fullName.trim(),
          phoneNumber: cleanPhone,
          email: formData.email.trim() || undefined,
          address: formData.address.trim() || undefined,
          isActive: formData.isActive,
        };
        const updated = await apiClient<Customer>(`/customers/${editingCustomer.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setCustomers(prev => prev.map(c => (c.id === updated.id ? updated : c)));
        setSuccessMsg(`Cập nhật thành công khách hàng "${updated.fullName}".`);
      } else {
        const payload: CreateCustomerPayload = {
          fullName: formData.fullName.trim(),
          phoneNumber: cleanPhone,
          customerCode: formData.customerCode.trim() || undefined,
          email: formData.email.trim() || undefined,
          address: formData.address.trim() || undefined,
        };
        const created = await apiClient<Customer>('/customers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setCustomers(prev => [created, ...prev]);
        setSuccessMsg(`Đã tạo mới khách hàng "${created.fullName}" (Mã: ${created.customerCode}).`);
      }
      setShowModal(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.detail || err.message);
      } else {
        setFormError('Có lỗi xảy ra khi lưu thông tin khách hàng.');
      }
    } finally {
      setSaving(false);
    }
  }

  // Filtered list
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchSearch =
        c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phoneNumber.includes(searchTerm) ||
        c.customerCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && c.isActive) ||
        (statusFilter === 'INACTIVE' && !c.isActive);

      return matchSearch && matchStatus;
    });
  }, [customers, searchTerm, statusFilter]);

  // Quick stats
  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter(c => c.isActive).length;
    const totalPoints = customers.reduce((sum, c) => sum + (c.points || 0), 0);
    const totalSpent = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    return { total, active, totalPoints, totalSpent };
  }, [customers]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const pagedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  const columns: Column<Customer>[] = [
    {
      header: 'Mã KH',
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-forest">
          {row.customerCode}
        </span>
      ),
      className: 'whitespace-nowrap',
    },
    {
      header: 'Họ và tên',
      cell: (row) => (
        <div>
          <p className="font-semibold text-ink">{row.fullName}</p>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
            <Phone size={12} />
            <span>{row.phoneNumber}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Địa chỉ / Liên hệ',
      cell: (row) => (
        <div className="max-w-xs text-xs text-slate-600">
          {row.address ? (
            <p className="flex items-start gap-1">
              <MapPin size={13} className="shrink-0 text-slate-400 mt-0.5" />
              <span className="truncate">{row.address}</span>
            </p>
          ) : (
            <span className="text-slate-400 italic">Chưa cập nhật</span>
          )}
          {row.email && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{row.email}</p>}
        </div>
      ),
    },
    {
      header: 'Điểm tích lũy',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Award size={15} className="text-amber-500" />
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
            {row.points.toLocaleString('vi-VN')} điểm
          </span>
        </div>
      ),
    },
    {
      header: 'Tổng chi tiêu',
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-ink">
          {row.totalSpent.toLocaleString('vi-VN')} ₫
        </span>
      ),
    },
    {
      header: 'Trạng thái',
      cell: (row) =>
        row.isActive ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} /> Hoạt động
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 border border-slate-200">
            <PowerOff size={12} /> Tạm ngưng
          </span>
        ),
    },
    {
      header: 'Thao tác',
      cell: (row) => (
        <button
          onClick={() => handleOpenEditModal(row)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-forest"
          title="Chỉnh sửa thông tin"
        >
          <Edit2 size={13} /> Sửa
        </button>
      ),
      align: 'right',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Quản lý Khách hàng & Tích điểm
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Hồ sơ khách hàng thân thiết, điểm thưởng tích lũy và doanh số mua sắm tại chi nhánh.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-forest/90 focus:outline-hidden focus:ring-2 focus:ring-forest/20"
          >
            <UserPlus size={16} /> Thêm khách hàng
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}
      {successMsg && <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          title="Tổng khách hàng"
          value={stats.total.toLocaleString('vi-VN')}
          subValue="Hồ sơ đăng ký"
          colorTheme="slate"
        />
        <StatCard
          icon={UserCheck}
          title="Đang hoạt động"
          value={stats.active.toLocaleString('vi-VN')}
          subValue={`${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% tổng số`}
          colorTheme="emerald"
        />
        <StatCard
          icon={Coins}
          title="Tổng điểm tích lũy"
          value={stats.totalPoints.toLocaleString('vi-VN')}
          subValue="Điểm khả dụng toàn hệ thống"
          colorTheme="amber"
        />
        <StatCard
          icon={HeartHandshake}
          title="Tổng doanh thu thành viên"
          value={`${stats.totalSpent.toLocaleString('vi-VN')} ₫`}
          subValue="Chi tiêu tích lũy"
          colorTheme="blue"
        />
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50">
          <SearchToolbar
            searchValue={searchTerm}
            onSearchChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            searchPlaceholder="Tìm theo tên khách hàng, số điện thoại, mã KH…"
            onRefresh={loadCustomers}
            loading={loading}
            filterSlot={
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:border-forest focus:outline-hidden focus:ring-1 focus:ring-forest"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Chỉ đang hoạt động</option>
                <option value="INACTIVE">Tạm ngưng</option>
              </select>
            }
          />
        </div>

        {/* Data Table */}
        <div className="p-4 sm:p-5">
          <DataTable<Customer>
            data={pagedCustomers}
            columns={columns}
            keyExtractor={(item) => item.id}
            loading={loading}
            emptyMessage="Không tìm thấy khách hàng nào phù hợp với bộ lọc."
            pagination={{
              page: currentPage,
              totalPages,
              pageSize,
              totalCount: filteredCustomers.length,
              onPageChange: setCurrentPage,
              itemLabel: 'khách hàng',
            }}
          />
        </div>
      </div>

      {/* Modal Thêm / Sửa khách hàng */}
      <Modal
        isOpen={showModal}
        onClose={() => !saving && setShowModal(false)}
        title={editingCustomer ? 'Cập nhật thông tin khách hàng' : 'Thêm mới khách hàng thân thiết'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <AlertBanner type="error" message={formError} onClose={() => setFormError('')} />}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Họ và tên khách hàng <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="VD: Nguyễn Văn An"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-forest focus:outline-hidden focus:ring-1 focus:ring-forest"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số điện thoại <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="VD: 0912345678"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-forest focus:outline-hidden focus:ring-1 focus:ring-forest"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mã khách hàng {editingCustomer ? '(Cố định)' : '(Tùy chọn)'}
              </label>
              <input
                type="text"
                disabled={!!editingCustomer}
                value={formData.customerCode}
                onChange={(e) => setFormData({ ...formData, customerCode: e.target.value })}
                placeholder={editingCustomer ? formData.customerCode : 'Tự động tạo nếu để trống'}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-forest focus:outline-hidden focus:ring-1 focus:ring-forest disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email liên hệ (Tùy chọn)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="VD: customer@example.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-forest focus:outline-hidden focus:ring-1 focus:ring-forest"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Địa chỉ cư trú
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="VD: 123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-ink placeholder:text-slate-400 focus:border-forest focus:outline-hidden focus:ring-1 focus:ring-forest"
            />
          </div>

          {editingCustomer && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-forest focus:ring-forest"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Tài khoản khách hàng đang hoạt động
                </span>
              </label>
              <p className="mt-1 text-[11px] text-slate-500 pl-6">
                Khi bỏ chọn, khách hàng sẽ tạm ngưng tích điểm tại quầy bán thuốc.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              disabled={saving}
              onClick={() => setShowModal(false)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-forest/90 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <LoaderCircle size={14} className="animate-spin" />
                  Đang lưu…
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  {editingCustomer ? 'Cập nhật khách hàng' : 'Tạo mới hồ sơ'}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
