export interface AccountProfile {
  userId: string; username: string; fullName: string; phoneNumber: string | null;
  email: string | null; role: string; branchId: string; branchName: string; isActive: boolean;
}
export interface AuditEntry {
  id: string; userId: string | null; username: string; branchId: string; eventType: string;
  ipAddress: string | null; userAgent: string | null; failureReason: string | null;
  createdDate: string; outcome: string;
}
export interface AuditStatistics { loginSuccess: number; loginFailure: number; accessDenied: number; importantActions: number; totalCount: number }
export interface AuditChallenge { challengeId: string; expiresAt: string; maskedEmail: string }
export interface AuditGrant { accessToken: string; expiresAt: string }
export const roleLabels: Record<string, string> = { OWNER: 'Chủ nhà thuốc', WAREHOUSE: 'Thủ kho', SALES: 'Nhân viên bán hàng' };
export const auditLabels: Record<string, string> = {
  LOGIN_SUCCESS: 'Đăng nhập thành công', AUTH_LOGIN_SUCCESS: 'Đăng nhập thành công',
  LOGIN_FAILED: 'Đăng nhập thất bại', AUTH_LOGIN_FAILED: 'Đăng nhập thất bại', AUTH_LOGIN_FAILURE: 'Đăng nhập thất bại',
  LOGOUT: 'Đăng xuất', AUTH_LOGOUT: 'Đăng xuất', AUTHORIZATION_DENIED: 'Truy cập bị từ chối', CROSS_BRANCH_DENIED: 'Truy cập chéo chi nhánh bị chặn',
  PROFILE_UPDATED: 'Cập nhật hồ sơ cá nhân', PASSWORD_CHANGED: 'Đổi mật khẩu', PASSWORD_CHANGE_FAILED: 'Đổi mật khẩu thất bại',
  USER_CREATED: 'Tạo nhân viên', USER_ACTIVATED: 'Kích hoạt nhân viên', USER_DEACTIVATED: 'Vô hiệu hóa nhân viên',
  PURCHASE_ORDER_CREATED: 'Tạo đơn mua', PURCHASE_ORDER_APPROVED: 'Duyệt đơn mua', PURCHASE_ORDER_REJECTED: 'Từ chối đơn mua', PURCHASE_ORDER_ORDERED: 'Đặt hàng nhà cung cấp',
  AUDIT_REAUTH_FAILED: 'Xác minh lại mật khẩu thất bại', AUDIT_OTP_UNAVAILABLE: 'Dịch vụ OTP email không khả dụng',
  AUDIT_OTP_EMAIL_MISSING: 'Không tìm thấy email tài khoản hợp lệ',
  AUDIT_OTP_DELIVERY_FAILED: 'Gửi OTP thất bại',
  AUDIT_OTP_FAILED: 'Xác minh OTP thất bại', AUDIT_ACCESS_GRANTED: 'Cấp quyền đọc nhật ký tạm thời',
};
export const securityField = 'mt-1.5 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-ink focus:border-forest focus:ring-2 focus:ring-forest/15 disabled:bg-slate-50';
export const securityButton = 'inline-flex items-center justify-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-xs font-semibold text-white hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-50';
