import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';

/**
 * Placeholder navigation dashboard showcasing the architecture feature modules.
 * Note: Frontend guards are strictly UX mechanisms; authoritative security is enforced by Backend API (Rule 03, 05).
 */
const DashboardHome: React.FC = () => {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: '#0f766e', margin: 0 }}>PharmaSecure — Foundation Architecture V1.0</h1>
        <p style={{ color: '#475569' }}>
          Hệ thống quản lý chuỗi bán thuốc đa chi nhánh | Multi-Branch Pharmacy Management System
        </p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
        {[
          { name: 'Xác thực (Auth)', path: '/auth', status: 'Foundation Ready' },
          { name: 'Bán hàng (POS)', path: '/pos', status: 'Phase 2 Target' },
          { name: 'Hóa đơn (Invoices)', path: '/invoices', status: 'Phase 2 Target' },
          { name: 'Kho & Tồn kho (Inventory)', path: '/inventory', status: 'Phase 2 Target' },
          { name: 'Đơn đặt hàng (Orders)', path: '/orders', status: 'Phase 2 Target' },
          { name: 'Trả hàng (Returns)', path: '/returns', status: 'Phase 2 Target' },
          { name: 'Khách hàng (Customers)', path: '/customers', status: 'Phase 2 Target' },
          { name: 'Chi phí (Expenses)', path: '/expenses', status: 'Phase 2 Target' },
          { name: 'Báo cáo (Reports)', path: '/reports', status: 'Phase 2 Target' },
          { name: 'Nhật ký kiểm toán (Audit)', path: '/audit', status: 'Phase 2 Target' },
        ].map((item) => (
          <div
            key={item.path}
            style={{
              padding: '1.25rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#1e293b' }}>{item.name}</h3>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{item.status}</span>
          </div>
        ))}
      </section>

      <footer style={{ marginTop: '3rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', color: '#94a3b8', fontSize: '0.875rem' }}>
        PharmaSecure Architecture Foundation — Rule Compliance Checked
      </footer>
    </div>
  );
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardHome />} />
      <Route
        path="*"
        element={
          <div style={{ padding: '2rem' }}>
            <h2>404 — Không tìm thấy trang</h2>
            <Link to="/">Quay về trang chủ</Link>
          </div>
        }
      />
    </Routes>
  );
};
