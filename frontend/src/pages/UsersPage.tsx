import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Phone,
  PowerOff,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError, apiClient } from '../services/apiClient';
import type { CreateStaffPayload, StaffUser } from '../types';

export function UsersPage() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SALES' | 'WAREHOUSE' | 'OWNER'>('ALL');

  // Create Staff Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<CreateStaffPayload>({
    username: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    role: 'SALES'
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
        body: JSON.stringify({ isActive: newStatus })
      });

      setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
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
          role: formData.role
        })
      });

      setUsers(prev => [...prev, created]);
      setShowCreateModal(false);
      setFormData({
        username: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        role: 'SALES'
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

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phoneNumber && u.phoneNumber.includes(searchTerm));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleBadge = (role: string) => {
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-forest text-white shadow-sm">
              <Users size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Quản Lý Nhân Viên
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Quản lý tài khoản nhân sự chi nhánh, vai trò nghiệp vụ và trạng thái hoạt động.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-ink disabled:opacity-60"
            title="Làm mới danh sách nhân viên"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={() => {
              setShowCreateModal(true);
              setCreateError('');
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-forest/90 focus:outline-none focus:ring-2 focus:ring-forest/30"
          >
            <UserPlus size={16} />
            <span>Thêm Nhân Viên Mới</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <CircleAlert size={18} className="mt-0.5 shrink-0 text-rose-600" />
          <div className="flex-1 font-medium">{error}</div>
          <button onClick={() => setError('')} className="text-rose-600 hover:text-rose-800">
            <X size={16} />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
          <div className="flex-1 font-medium">{successMsg}</div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Control Bar: Search & Role Filters */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-line bg-white p-4 shadow-sm">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, tên đăng nhập hoặc số điện thoại..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-line bg-slate-50/50 py-2 pl-10 pr-4 text-xs text-ink placeholder:text-slate-400 focus:border-forest focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Lọc vai trò:</span>
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'SALES', label: 'Dược sĩ bán hàng' },
            { key: 'WAREHOUSE', label: 'Thủ kho' },
            { key: 'OWNER', label: 'Chủ nhà thuốc' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRoleFilter(key as any)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                roleFilter === key
                  ? 'bg-forest text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <LoaderCircle size={36} className="animate-spin text-forest" />
            <p className="mt-3 text-xs font-medium">Đang tải danh sách nhân sự chi nhánh...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
              <Users size={24} />
            </div>
            <h3 className="mt-3 font-display text-sm font-bold text-ink">Không tìm thấy nhân viên nào</h3>
            <p className="mt-1 text-xs text-slate-500">
              {searchTerm || roleFilter !== 'ALL'
                ? 'Thử điều chỉnh lại từ khóa tìm kiếm hoặc bộ lọc vai trò.'
                : 'Bắt đầu bằng cách thêm nhân viên bán hàng hoặc thủ kho đầu tiên cho chi nhánh.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 pl-6 pr-4">Nhân Viên</th>
                  <th className="px-4 py-3.5">Tên Đăng Nhập</th>
                  <th className="px-4 py-3.5">Vai Trò Nghiệp Vụ</th>
                  <th className="px-4 py-3.5">Số Điện Thoại</th>
                  <th className="px-4 py-3.5">Trạng Thái</th>
                  <th className="px-4 py-3.5">Ngày Tham Gia</th>
                  <th className="py-3.5 pl-4 pr-6 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {filteredUsers.map(user => {
                  const isCurrent = user.id === currentUser?.userId;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 font-display text-xs font-bold text-slate-700">
                            {user.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-ink">{user.fullName}</span>
                              {isCurrent && (
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">Mã: {user.id.slice(0, 10)}...</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-600 font-medium">
                        @{user.username}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {roleBadge(user.role)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {user.phoneNumber ? (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Phone size={13} className="text-slate-400" />
                            <span>{user.phoneNumber}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 italic">Chưa cập nhật</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-400/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Tạm ngưng
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">
                        {new Date(user.createdDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3.5 pl-4 pr-6 text-right whitespace-nowrap">
                        {isCurrent ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 cursor-not-allowed"
                            title="Nguyên tắc an toàn chống tự khóa tài khoản"
                          >
                            <ShieldAlert size={13} />
                            Khóa (Chính bạn)
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={updatingId === user.id}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
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
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Staff Member Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-line">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-mint text-forest">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-ink">Thêm Nhân Viên Mới</h3>
                  <p className="text-xs text-slate-500">Cấp tài khoản đăng nhập cho nhân sự làm việc tại chi nhánh.</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <CircleAlert size={16} className="mt-0.5 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={formData.fullName}
                  onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-xs text-ink focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Tên đăng nhập <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: nvbanhang_an"
                    value={formData.username}
                    onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-xs text-ink font-mono focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 0912345678"
                    value={formData.phoneNumber}
                    onChange={e => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-xs text-ink focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Mật khẩu <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Ít nhất 6 ký tự"
                    value={formData.password}
                    onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full rounded-lg border border-line px-3 py-2 pr-10 text-xs text-ink focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">Được mã hóa băm an toàn trên máy chủ bằng thuật toán BCrypt.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Vai trò nghiệp vụ <span className="text-rose-500">*</span>
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: 'SALES' }))}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition ${
                      formData.role === 'SALES'
                        ? 'border-forest bg-mint/40 text-forest ring-2 ring-forest/20'
                        : 'border-line bg-slate-50/50 text-slate-600 hover:bg-slate-100/70'
                    }`}
                  >
                    <UserCheck size={18} />
                    <span>Dược sĩ bán hàng</span>
                    <span className="text-[10px] font-normal text-slate-500">Bán hàng tại quầy &amp; xuất hóa đơn</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: 'WAREHOUSE' }))}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition ${
                      formData.role === 'WAREHOUSE'
                        ? 'border-amber-600 bg-amber-50 text-amber-800 ring-2 ring-amber-600/20'
                        : 'border-line bg-slate-50/50 text-slate-600 hover:bg-slate-100/70'
                    }`}
                  >
                    <KeyRound size={18} />
                    <span>Thủ kho</span>
                    <span className="text-[10px] font-normal text-slate-500">Nhập kho &amp; kiểm soát tồn kho</span>
                  </button>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="rounded-lg border border-line px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-forest/90 disabled:opacity-60"
                >
                  {creating && <LoaderCircle size={14} className="animate-spin" />}
                  <span>{creating ? 'Đang tạo tài khoản...' : 'Tạo Tài Khoản'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
