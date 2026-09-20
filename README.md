# PharmaSecure — Multi-Branch Pharmacy Management System
Hệ Thống Quản Lý Chuỗi Bán Thuốc Đa Chi Nhánh

## 1. Project Purpose
PharmaSecure (PharmaBranch) is an enterprise-grade multi-branch pharmacy management system designed to support secure retail sales (POS), procurement, inventory tracking, electronic invoicing, digital signatures, returns, and branch-isolated operational management.

> **Status Notice**: The project is currently at **Phase 1: Foundation Architecture**. Core architectural boundaries, solution layout, baseline abstractions, and dependency directions are established. Business workflows (POS, inventory movements, payment processing, full RBAC policies) are planned for subsequent phases and are **not yet implemented**.

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
- **Integrity**: Enforces Primary Keys, Foreign Keys (`NO ACTION`/`RESTRICT`), `CHECK` constraints for monetary and quantity domains, and composite unique keys.
- **Isolation**: Tenant isolation backed by database-level Row-Level Security (RLS) policies evaluating `SESSION_CONTEXT(N'BranchId')`.

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