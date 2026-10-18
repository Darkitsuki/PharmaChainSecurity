# Row-Level Security (RLS) / Oracle Virtual Private Database (VPD) Scripts

This directory contains Oracle Database Virtual Private Database (VPD / DBMS_RLS) policies and security context configurations.

## Invariants (Rule 06 — Branch Isolation)
- Evaluates `SYS_CONTEXT('PHARMA_CTX', 'BRANCH_ID') = BranchId` (or `SYS_CONTEXT('USERENV', 'CLIENT_IDENTIFIER') = BranchId`).
- Both query filtering (`statement_types => 'SELECT'`) and mutation blocking (`statement_types => 'INSERT,UPDATE,DELETE'`, with `update_check => TRUE`) are required.
- If `SYS_CONTEXT('PHARMA_CTX', 'BRANCH_ID')` is NULL or uninitialized, the policy function MUST fail-closed by returning `1=2` (return 0 rows / reject mutation).
- Application connections must execute under a least-privileged database role subject to VPD.

## Script Execution Order
1. [`01_create_context_and_package.sql`](./01_create_context_and_package.sql): Creates the `PHARMA_CTX` application context and `PKG_SESSION_CTX` package.
2. [`02_security_predicate_function.sql`](./02_security_predicate_function.sql): Creates the `FN_BRANCH_SECURITY_PREDICATE` policy function implementing fail-closed branch isolation.
3. [`03_apply_vpd_policies.sql`](./03_apply_vpd_policies.sql): Attaches `DBMS_RLS` policies to all branch-scoped operational tables (`INVOICES`, `INVENTORIES`, `INVENTORY_TRANSACTIONS`, `GOODS_RECEIPTS`, `USERS`, `CUSTOMERS`).
4. [`04_test_vpd_isolation.sql`](./04_test_vpd_isolation.sql): Automated PL/SQL verification suite testing fail-closed, read isolation, mutation block option, and global audit view.
5. [`05_remove_vpd_policies.sql`](./05_remove_vpd_policies.sql): Rollback script to cleanly drop VPD policies during schema maintenance.
