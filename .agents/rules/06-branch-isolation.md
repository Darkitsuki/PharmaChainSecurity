---
trigger: always_on
---

# Branch Data Isolation

## 1. Purpose

This rule establishes `CHI_NHANH` (Branch) as the authoritative data isolation boundary for PharmaBranch.

A principal authenticated for Branch A MUST NOT access, query, create, modify, delete, or infer data belonging to Branch B, directly or via relational traversal.

This rule governs branch isolation across API, Application, Persistence, and Database layers.

## 2. Branch as Data Security Boundary

Branch isolation is a mandatory tenant boundary. Operational records belong to a branch context. Protected entities include `CHI_NHANH`, `NGUOI_DUNG`, `TON_KHO`, `GIAO_DICH_KHO`, `DON_DAT_THUOC`, `DON_NHAP_HANG`, `PHIEU_NHAP`, `HOA_DON`, `DON_TRA_HANG`, `YEU_CAU_CHI`, and `NHAT_KY_KIEM_TOAN`.

Branch A users MUST NOT view or alter operational records of Branch B.

## 3. Authoritative Branch Context

Branch context MUST originate from validated server-side identity:
- The backend MUST derive active branch scope from verified authentication context.
- Client identifiers in bodies, query strings, headers, or state MUST NOT be trusted.
- Route/query `branchId` parameters MUST be treated as resource IDs and validated against authoritative scope.
- Client input MUST NEVER override server-side branch context.

## 4. Branch Context Propagation

Branch identity MUST propagate reliably through every application layer:

```text
Identity → Branch Context → API Authorization → Application Service → Persistence → Session Context (SYS_CONTEXT) → Oracle VPD → Scoped Result
```

The persistence layer MUST initialize database branch context before executing branch SQL commands.

## 5. Branch-Owned Data Model

Branch ownership MUST be explicit and verifiable:
- Branch-owned tables MUST include a foreign key referencing `CHI_NHANH`.
- Child tables without direct `branch_id` (e.g., line items) MUST maintain a deterministic FK path to a branch-owned parent.
- Schemas MUST NOT permit cross-branch hybrid records.
- Global catalog tables (e.g., medicine catalog) SHOULD NOT include `branch_id`.

## 6. Database Row-Level Security (Oracle Virtual Private Database - VPD)

Oracle Virtual Private Database (VPD / DBMS_RLS) provides defense-in-depth database enforcement:
- Predicates MUST evaluate `SYS_CONTEXT('PHARMA_CTX', 'BranchId') = chi_nhanh_id`.
- Policies MUST define function predicates for read (`SELECT`) and mutation (`INSERT`, `UPDATE`, `DELETE`).
- Missing or uninitialized session context MUST evaluate to false (fail-closed, e.g. returning `1=2`).
- Application connections MUST execute under least-privileged users subject to VPD.

## 7. Cross-Branch Read Isolation

Principals in Branch A MUST NOT receive rows or metadata belonging to Branch B.

Isolation applies to collections, get-by-ID (`GET /api/resource/{id}`), search, filtering, pagination, sorting, dashboard counters, and reports.

Accessing another branch's resource MUST yield `404 Not Found` or `403 Forbidden` without leaking resource existence or state.

## 8. Cross-Branch Mutation Isolation

Principals in Branch A MUST NOT mutate Branch B resources:
- **INSERT:** Creating records linked to another branch MUST be rejected.
- **UPDATE:** Modifying or reassigning another branch's records MUST be rejected.
- **DELETE:** Deleting another branch's records MUST be rejected.

Cross-branch mutations MUST fail atomically, rollback, and log an audit event.

## 9. Client-Supplied branchId Protection

The system MUST defend against client parameter manipulation:
- Sending `?branchId=B` or `{"branchId": "B"}` when authenticated for Branch A MUST be rejected or ignored.
- The server MUST enforce authenticated context (Branch A) as sole authority; client parameters cannot switch tenant scope.

## 10. Indirect Relationship Isolation

Branch isolation MUST survive multi-hop relational traversal:

```text
CHI_NHANH (Branch A) → HOA_DON (Invoice A) → HOA_DON_ITEM → TON_KHO (Stock A)
```

Child references and stock records MUST belong to the same branch; an invoice in Branch A MUST NOT deduct inventory from Branch B.

## 11. Aggregation, Reporting, and Export Isolation

Branch boundaries apply strictly to analytics and bulk operations:
- Aggregates (`COUNT`, `SUM`, `AVG`) MUST compute exclusively from authorized branch data.
- Financial, sales, and inventory reports MUST remain branch-scoped.
- Data exports (CSV, Excel, PDF) MUST NEVER include cross-branch rows.
- Users MUST NOT infer other branches' metrics through aggregate differences.

## 12. Database Session Context (Application Context)

Where database session context is utilized:
- The persistence layer MUST set application context (e.g. via PL/SQL package `DBMS_SESSION.SET_IDENTIFIER` or custom context package setting `SYS_CONTEXT('PHARMA_CTX', 'BranchId')`) upon acquiring a connection via parameterized commands.
- Client input MUST NEVER be passed directly to session context.
- Session context MUST be cleared before returning connections to the pool.

## 13. Connection Pool Safety

Connections reused from pools MUST NOT leak branch state:
- Reused connections MUST explicitly reinitialize `BranchId` before executing queries for a new request.
- Stale session state MUST NOT persist across request boundaries.
- If context setup fails, the connection MUST be discarded and the request aborted.

## 14. Multi-Branch and System-Level Scope

Broader visibility MUST be explicitly modeled and authorized:
- `OWNER / MANAGER` roles MUST NOT implicitly bypass branch isolation.
- Supported scopes: `SINGLE_BRANCH`, `ASSIGNED_BRANCHES`, and authorized `GLOBAL` oversight.
- Multi-branch queries MUST pass explicit branch lists to application context and VPD policies.
- Global bypasses without audit logging are strictly prohibited.

## 15. Fail-Closed Behavior

Any failure or ambiguity in branch context MUST fail closed:
- Missing, expired, or invalid branch claims → **DENY**.
- Inactive branches or mismatched assignments → **DENY**.
- Failed session context initialization → **DENY**.

The system MUST NEVER fall back to all branches (`ALL`), `NULL`, default branch, or client-specified branch.

## 16. Testing and Verification

Branch isolation MUST be verified through test suites:

| Test Scenario | Condition | Expected |
|---|---|---|
| Same-branch READ / UPDATE | User Branch A accesses own branch record | **ALLOW** |
| Cross-branch READ / UPDATE | User Branch A accesses Branch B record | **DENY** |
| Cross-branch DELETE / INSERT | User Branch A mutates Branch B record | **DENY** |
| Client `branchId` Injection | User sends `branchId = B` in request | **DENY** |
| Missing / Invalid Context | Request lacks valid branch context | **DENY** |
| Aggregate / Report Leakage | `COUNT` / `SUM` / reports across branches | Branch-scoped |
| Export Leakage | Export CSV / Excel files | Branch-scoped |
| Relational Traversal | Order in Branch A references Stock in Branch B | **DENY** |
| Pool Reuse | Connection reuse across branches | Context refreshed |
| Database VPD Enforcement | Direct SQL query under app user | VPD enforced |

## 17. Evidence-First Verification

Implementation claims require physical evidence:
- Documentation or ERDs do not prove branch isolation is active.
- Verification requires inspecting server context extraction, endpoint authorization, repository queries, and Oracle VPD scripts.
- Without physical evidence, features MUST be marked `NOT VERIFIED`, never assumed secure.

## 18. Rule Boundaries

- **`04-rbac.md`:** WHO has business capabilities (Roles, Permissions, Actions).
- **`05-authorization.md`:** HOW runtime authorization is enforced (API gating, ownership, IDOR/BOLA).
- **`06-branch-isolation.md`:** WHICH branch data is accessible and how tenant isolation is maintained end-to-end.
- **`03-security.md`:** Global security standards, authentication, and threat mitigations.
- **`01-architecture.md` & `02-architecture-quality.md`:** Layering, transactions, concurrency, and operational quality.

## 19. Security Invariants

Mandatory invariants across all layers:
1. Client input is NEVER authoritative for branch identity.
2. Branch context MUST originate from verified server identity.
3. Operations MUST execute within authorized branch scope.
4. Cross-branch reads MUST be denied.
5. Cross-branch writes MUST be denied.
6. Relational traversal MUST NOT cross branch boundaries.
7. Aggregates, reports, and exports MUST remain branch-scoped.
8. Database Oracle VPD MUST provide defense-in-depth where implemented.
9. Missing or invalid branch context MUST fail closed.
10. Connection pool reuse MUST NOT leak session context.
11. Multi-branch visibility MUST be explicit, authorized, and audited.
12. No implementation claim without physical evidence.
