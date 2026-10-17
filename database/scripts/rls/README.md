# Row-Level Security (RLS) / Oracle Virtual Private Database (VPD) Scripts

This directory contains Oracle Database Virtual Private Database (VPD / DBMS_RLS) policies and security context configurations.

## Invariants (Rule 06 — Branch Isolation)
- Evaluates `SYS_CONTEXT('PHARMA_CTX', 'BRANCH_ID') = BranchId` (or `SYS_CONTEXT('USERENV', 'CLIENT_IDENTIFIER') = BranchId`).
- Both query filtering (`statement_types => 'SELECT'`) and mutation blocking (`statement_types => 'INSERT,UPDATE,DELETE'`, with `update_check => TRUE`) are required.
- If `SYS_CONTEXT('PHARMA_CTX', 'BRANCH_ID')` is NULL or uninitialized, the policy function MUST fail-closed by returning `1=2` (return 0 rows / reject mutation).
- Application connections must execute under a least-privileged database role subject to VPD.
