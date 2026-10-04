import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { RequireAuth } from '../components/RequireAuth';
import { useAuth } from '../context/AuthContext';
import { CheckoutPage } from '../pages/CheckoutPage';
import { DrugCatalogPage } from '../pages/DrugCatalogPage';
import { GoodsReceiptPage } from '../pages/GoodsReceiptPage';
import { InventoryPage } from '../pages/InventoryPage';
import { InvoicesPage } from '../pages/InvoicesPage';
import { LoginPage } from '../pages/LoginPage';
import { UsersPage } from '../pages/UsersPage';
import { ReportsPage } from '../pages/ReportsPage';

function LoginRoute() {
  const { currentUser, isLoading } = useAuth();
  if (isLoading) return <div className="grid min-h-screen place-items-center bg-canvas text-sm text-slate-500">Restoring secure session…</div>;
  return currentUser ? <Navigate to="/checkout" replace /> : <LoginPage />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/checkout" replace />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="goods-receipts" element={<GoodsReceiptPage />} />
          <Route path="drugs" element={<DrugCatalogPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
