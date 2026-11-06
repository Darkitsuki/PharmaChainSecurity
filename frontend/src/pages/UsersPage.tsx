import { calendarDate } from '../utils/formatters';
import { PageHeader } from '../components/common/PageHeader';
import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Phone,
  PowerOff,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError, apiClient } from '../services/apiClient';
import type { CreateStaffPayload, StaffUser } from '../types';
import {
  Modal,
  DataTable,
  SearchToolbar,
  AlertBanner,
  type Column,
} from '../components/common';

export function UsersPage() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SALES' | 'WAREHOUSE' | 'OWNER'>('ALL');

  // Create Staff Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<CreateStaffPayload>({
    username: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    role: 'SALES',
  });

  // Toggle status state
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient<StaffUser[]>('/users');
      setUsers(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || err.message);
      } else {
        setError('Không thể tải danh sách nhân viên chi nhánh.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(user: StaffUser) {
    if (user.id === currentUser?.userId) {
      setError('Bạn không thể tự vô hiệu hóa tài khoản của chính mình (Nguyên tắc an toàn chống tự khóa tài khoản).');
      return;
    }

    setUpdatingId(user.id);
    setError('');
    setSuccessMsg('');
    try {
      const newStatus = !user.isActive;
      const updated = await apiClient<StaffUser>(`/users/${user.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: newStatus }),
      });

      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setSuccessMsg(`Tài khoản nhân viên '${updated.username}' hiện đã ${newStatus ? 'kích hoạt hoạt động' : 'tạm ngưng hoạt động'}.`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || err.message);
      } else {
        setError('Không thể cập nhật trạng thái nhân viên.');
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.username.trim() || !formData.password.trim() || !formData.fullName.trim()) {
      setCreateError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    if (formData.password.length < 6) {
      setCreateError('Mật khẩu phải có độ dài ít nhất 6 ký tự.');
      return;
    }

    setCreating(true);
    setCreateError('');
    try {
      const created = await apiClient<StaffUser>('/users', {
        method: 'POST',
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password,
          fullName: formData.fullName.trim(),
          phoneNumber: formData.phoneNumber?.trim() || null,
          role: formData.role,
        }),
      });

      setUsers((prev) => [...prev, created]);
      setShowCreateModal(false);
      setFormData({
        username: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        role: 'SALES',
      });
      setSuccessMsg(`Đã tạo thành công tài khoản nhân viên: ${created.username} (${created.fullName})`);
    } catch (err) {
      if (err instanceof ApiError) {
        setCreateError(err.detail || err.message);
      } else {
        setCreateError('Không thể tạo tài khoản nhân viên.');
      }
    } finally {
      setCreating(false);
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phoneNumber && u.phoneNumber.includes(searchTerm));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole && (statusFilter === 'ALL' || u.isActive === (statusFilter === 'ACTIVE'));
  });

  const renderRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-600/20">
            <ShieldCheck size={13} className="text-purple-600" />
            Chủ nhà thuốc
          </span>
        );
      case 'SALES':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-2.5 py-1 text-xs font-semibold text-forest ring-1 ring-inset ring-forest/20">
            <UserCheck size={13} className="text-forest" />
            Dược sĩ bán hàng
          </span>
        );
      case 'WAREHOUSE':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
            <KeyRound size={13} className="text-amber-600" />
            Thủ kho
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {role}
          </span>
        );
    }
  };

  const columns: Column<StaffUser>[] = [
    {
      header: 'Nhân Viên',
      cell: (user) => {
        const isCurrent = user.id === currentUser?.userId;
        return (
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 font-display text-xs font-bold text-slate-700">
              {user.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink">{user.fullName}</span>
                {isCurrent && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-600">
                    Bạn
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 font-mono">Mã: {user.id.slice(0, 10)}...</span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Tên Đăng Nhập',
      cell: (user) => <span className="font-mono text-slate-600 font-medium">@{user.username}</span>,
    },
    {
      header: 'Vai Trò Nghiệp Vụ',
      cell: (user) => renderRoleBadge(user.role),
    },
    {
      header: 'Số Điện Thoại',
      cell: (user) =>
        user.phoneNumber ? (
          <div className="flex items-center gap-1.5 text-slate-600">
            <Phone size={13} className="text-slate-400" />
            <span>{user.phoneNumber}</span>
          </div>
        ) : (
          <span className="text-slate-300 italic">Chưa cập nhật</span>
        ),
    },
    {
      header: 'Trạng Thái',
      cell: (user) =>
        user.isActive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Đang hoạt động
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-400/20">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Tạm ngưng
          </span>
        ),
    },
    {
      header: 'Ngày Tham Gia',
      cell: (user) => <span className="text-slate-500">{calendarDate.format(new Date(user.createdDate))}</span>,
    },
    {
      header: 'Thao Tác',
      align: 'right',
      cell: (user) => {
        const isCurrent = user.id === currentUser?.userId;
        if (isCurrent) {
          return (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 cursor-not-allowed"
              title="Nguyên tắc an toàn chống tự khóa tài khoản"
            >
              <ShieldAlert size={13} />
              Khóa (Chính bạn)
            </span>
          );
        }
        return (
          <button
            type="button"
            onClick={() => handleToggleStatus(user)}
            disabled={updatingId === user.id}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
              user.isActive
                ? 'border border-rose-200 text-rose-700 hover:bg-rose-50'
                : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
            }`}
            title={user.isActive ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt lại tài khoản'}
          >
            {updatingId === user.id ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : user.isActive ? (
              <>
                <PowerOff size={13} />
                <span>Vô hiệu hóa</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={13} />
                <span>Kích hoạt</span>
              </>
            )}
          </button>
        );
      },
    },
  ];

  return (
    <div className="ui-page">
      {/* Page Header */}
      <PageHeader title="Nhân viên" actions={<>
<button
          type="button"
          onClick={() => {
            setShowCreateModal(true);
            setCreateError('');
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-forest/90 focus:outline-hidden focus:ring-2 focus:ring-forest/30 cursor-pointer"
        >
          <UserPlus size={16} />
          <span>Thêm Nhân Viên Mới</span>
        </button>
</>} />

      {/* Alerts */}
      <AlertBanner type="error" message={error} onClose={() => setError('')} />
      <AlertBanner type="success" message={successMsg} onClose={() => setSuccessMsg('')} />

      {/* Search & Filters Toolbar */}
      <SearchToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo họ tên, tên đăng nhập, số điện thoại..."
        onRefresh={loadUsers}
        loading={loading}
        filterSlot={<>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-400 whitespace-nowrap mr-1">Lọc:</span>
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'SALES', label: 'Dược sĩ' },
              { key: 'WAREHOUSE', label: 'Thủ kho' },
              { key: 'OWNER', label: 'Chủ nhà thuốc' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setRoleFilter(key as any)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  roleFilter === key
                    ? 'bg-forest text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <select aria-label="Trạng thái nhân viên" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-line bg-white px-3 text-sm"><option value="ALL">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Đã vô hiệu hóa</option></select>
        </>
        }
      />

      {/* Staff DataTable */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        loading={loading}
        loadingText="Đang tải danh sách nhân sự chi nhánh..."
        emptyMessage={
          searchTerm || roleFilter !== 'ALL'
            ? 'Không tìm thấy nhân viên phù hợp với bộ lọc tìm kiếm.'
            : 'Chưa có nhân viên nào trong chi nhánh này. Bắt đầu bằng cách thêm nhân viên mới.'
        }
      />

      {/* Create Staff Member Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Thêm Nhân Viên Mới"
        subtitle="Cấp tài khoản đăng nhập cho nhân sự làm việc tại chi nhánh."
        icon={UserPlus}
        maxWidth="lg"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <AlertBanner type="error" message={createError} onClose={() => setCreateError('')} />

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Tên Đăng Nhập <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s+/g, '') }))}
              placeholder="ví dụ: nvdung_q1"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-ink placeholder:text-slate-400 focus:border-forest focus:outline-hidden focus:ring-2 focus:ring-forest/20"
            />
            <p className="mt-1 text-xs text-slate-400">Tên viết liền không dấu, dùng khi đăng nhập vào hệ thống.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Mật Khẩu Khởi Tạo <span className="text-rose-500">*</span>
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Tối thiểu 6 ký tự..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-xs text-ink placeholder:text-slate-400 focus:border-forest focus:outline-hidden focus:ring-2 focus:ring-forest/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Họ Và Tên Đầy Đủ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
              placeholder="ví dụ: Nguyễn Văn Dũng"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-ink placeholder:text-slate-400 focus:border-forest focus:outline-hidden focus:ring-2 focus:ring-forest/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Số Điện Thoại</label>
            <input
              type="tel"
              value={formData.phoneNumber || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
              placeholder="ví dụ: 0912345678"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-ink placeholder:text-slate-400 focus:border-forest focus:outline-hidden focus:ring-2 focus:ring-forest/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Vai Trò Nghiệp Vụ <span className="text-rose-500">*</span>
            </label>
            <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                  formData.role === 'SALES' ? 'border-forest bg-forest/5 shadow-2xs' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="SALES"
                  checked={formData.role === 'SALES'}
                  onChange={() => setFormData((prev) => ({ ...prev, role: 'SALES' }))}
                  className="mt-0.5 text-forest focus:ring-forest"
                />
                <div>
                  <p className="text-xs font-bold text-ink">Dược sĩ bán hàng</p>
                  <p className="mt-0.5 text-xs text-slate-500">Bán thuốc tại quầy, xuất hóa đơn điện tử.</p>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                  formData.role === 'WAREHOUSE' ? 'border-amber-600 bg-amber-500/5 shadow-2xs' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="WAREHOUSE"
                  checked={formData.role === 'WAREHOUSE'}
                  onChange={() => setFormData((prev) => ({ ...prev, role: 'WAREHOUSE' }))}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <p className="text-xs font-bold text-ink">Thủ kho</p>
                  <p className="mt-0.5 text-xs text-slate-500">Quản lý lô hạn FEFO, lập phiếu nhập kho.</p>
                </div>
              </label>
            </div>
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
              {creating ? <LoaderCircle size={14} className="animate-spin" /> : <UserPlus size={14} />}
              <span>{creating ? 'Đang tạo...' : 'Tạo Tài Khoản'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
