# PharmaSecure — Multi-Branch Pharmacy Management System
Hệ Thống Quản Lý Chuỗi Bán Thuốc Đa Chi Nhánh

## 1. Project Purpose
PharmaSecure (PharmaBranch) is an enterprise-grade multi-branch pharmacy management system designed to support secure retail sales (POS), procurement, inventory tracking, electronic invoicing, digital signatures, returns, and branch-isolated operational management.

> **Trạng thái dự án (Project Status)**: Dự án đã hoàn thiện 100% đầy đủ các phân hệ nghiệp vụ & kiểm soát an ninh đa tầng theo báo cáo khóa luận:
> - **Phân quyền & Kiểm soát truy cập (RBAC)**: 3 vai trò chuẩn `OWNER` (Chủ nhà thuốc), `SALES` (Nhân viên bán hàng), `WAREHOUSE` (Nhân viên kho) với thẩm định bảo mật tại API / Server-side.
> - **Cô lập dữ liệu đa chi nhánh (Oracle VPD / Row-Level Security)**: Đóng gói trong `PKG_PHARMA_SECURITY`, tự động cô lập dữ liệu theo `BranchId` trên các bảng giao dịch trọng yếu (`INVENTORIES`, `INVOICES`, `GOODS_RECEIPTS`, `INVENTORY_TRANSACTIONS`, `CUSTOMERS`, `PURCHASE_ORDERS`, `RETURNS`, `INVENTORY_AUDITS`).
> - **Bảo mật cấp độ cột (Column-Level Security - CLS)**: View `VW_STAFF_REVENUE_SECURITY` che giấu doanh thu cá nhân của nhân viên đối với các vai trò không phải Chủ nhà thuốc.
> - **Chữ ký số hóa đơn điện tử**: Thuật toán RSA/SHA-256 kết hợp mã băm chống giả mạo `DIGITAL_SIGNATURES`, xác minh tính toàn vẹn hóa đơn tức thời.
> - **Đồng thời & Khóa dòng (Row-Level Locking)**: Cơ chế `SELECT FOR UPDATE` bảo vệ toàn vẹn giao dịch bán hàng, trừ kho FEFO và hoàn trả/đổi thuốc.
> - **Sao lưu & Phục hồi CSDL**: Kịch bản Oracle Data Pump Logical Backup (`EXPDP`/`IMPDP`) với kiểm tra tính toàn vẹn CSDL.
> - **Client Applications**: Ứng dụng Web POS ReactJS (TypeScript, Tailwind CSS) và ứng dụng Mobile Flutter (Dart) cho cả nhân viên và bệnh nhân đặt thuốc.

---

## 2. Target Architecture
The system follows an N-Tier Client-Server Architecture adhering to Clean Architecture principles:

```text
ReactJS Web (Vite + TypeScript)        Flutter Mobile (Dart)
                  \                      /
                   \                    /
                    ▼                  ▼
             HTTPS REST API (ASP.NET Core 8 WebApi)
                           │
                           ▼
             Application Layer (PharmaSecure.Application)
                           │
                           ▼
             Domain Layer (PharmaSecure.Domain)
                           ▲
                           │
             Infrastructure Layer (PharmaSecure.Infrastructure)
                           │
                           ▼
             Oracle Database 23ai (PL/SQL, RLS, CLS)
```

### Dependency Invariants
- `PharmaSecure.Domain`: Core entity bases, aggregate root interfaces, value objects, domain enums. Strictly zero external dependencies.
- `PharmaSecure.Application`: DTOs, use case abstractions, Result pattern, ICurrentUserContext. References `Domain`.
- `PharmaSecure.Infrastructure`: Persistence, claims extraction, security implementations. References `Application` and `Domain`.
- `PharmaSecure.WebApi`: Presentation layer, controllers, middleware (`CorrelationIdMiddleware`, `BranchContextMiddleware`). References `Application` and `Infrastructure`.

---

## 3. Frontend Web Foundation
- **Location**: `frontend/`
- **Stack**: React 18, TypeScript, Vite, React Router v6.
- **Security Principle**: Frontend route guards and RBAC menus serve strictly as presentation/UX boundaries. Authoritative authorization decisions are made exclusively server-side.

---

## 4. Mobile App Foundation
- **Location**: `mobile/`
- **Stack**: Flutter / Dart.
- **Rule Compliance**: Direct database connections from mobile devices are strictly prohibited. Mobile communicates exclusively with the backend via HTTPS REST APIs.

---

## 5. Database Architecture
- **Location**: `database/`
- **Target Engine**: Oracle Database 23ai.
- **Isolation**: Tenant isolation backed by database-level Oracle Virtual Private Database (VPD / DBMS_RLS) policies evaluating `SYS_CONTEXT('PHARMA_CTX', 'BRANCH_ID')`.

---

## 6. Security Principles & Governance
- **Canonical RBAC Roles**:
  1. `OWNER`: Pharmacy Owner / Branch Owner
  2. `SALES`: Sales Staff
  3. `WAREHOUSE`: Warehouse Staff
- **Branch Isolation**: Operations are strictly scoped to the authenticated user's branch context. Client-supplied branch IDs in query strings, headers, or request bodies are untrusted and rejected if mismatched.
- **Traceability**: All API requests carry or are assigned an `X-Correlation-ID` header for end-to-end operational tracing.
- **Credential Hygiene**: Zero plaintext passwords, API keys, or private signing keys in source code or configuration files.

---

## 7. Development Prerequisites
- **Node.js**: v18+ (tested with v24.16.0) & npm
- **.NET SDK**: .NET 8.0 SDK (required for building and running `backend/PharmaSecure.sln`)
- **Flutter SDK**: Flutter 3.x / Dart SDK (required for building `mobile/`)
- **Oracle Database**: Oracle Database 23ai