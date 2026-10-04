import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

export function RequireAuth({ allowedRoles }: { allowedRoles?: UserRole[] }) {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas">
        <div className="flex items-center gap-3 text-sm font-medium text-forest">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-forest/20 border-t-forest" />
          Đang khôi phục phiên bảo mật…
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    if (currentUser.role === 'WAREHOUSE') return <Navigate to="/inventory" replace />;
    if (currentUser.role === 'OWNER') return <Navigate to="/reports" replace />;
    return <Navigate to="/checkout" replace />;
  }

  return <Outlet />;
}
