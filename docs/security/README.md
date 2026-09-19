# PharmaSecure Security Documentation

Complies with:
- `.agents/rules/03-security.md` (Security Baseline)
- `.agents/rules/04-rbac.md` (RBAC Model)
- `.agents/rules/05-authorization.md` (Runtime Authorization)
- `.agents/rules/06-branch-isolation.md` (Branch Isolation)

## Key Principles
1. **Server-Side Authority**: Frontend UI and route guards are strictly UX mechanisms; authorization is evaluated server-side.
2. **Canonical RBAC Roles**:
   - `OWNER` (Chủ nhà thuốc / Branch Owner)
   - `SALES` (Nhân viên bán hàng / Sales Staff)
   - `WAREHOUSE` (Nhân viên kho / Warehouse Staff)
3. **Tenant & Branch Isolation**: Operations strictly scoped to authenticated user's branch context (`SESSION_CONTEXT(N'BranchId')` + RLS).
4. **Zero Trust**: Client-supplied `userId` or `branchId` must never override authoritative server context.
