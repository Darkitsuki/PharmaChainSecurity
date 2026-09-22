# Row-Level Security (RLS) / Oracle Virtual Private Database (VPD) Scripts

This directory contains Oracle Database Virtual Private Database (VPD / DBMS_RLS) policies and security context configurations.

## Invariants (Rule 06 — Branch Isolation)
- Evaluates `SESSION_CONTEXT(N'BranchId') = chi_nhanh_id`.
- Both `FILTER PREDICATE` (read protection) and `BLOCK PREDICATE` (mutation protection) are required.
- If `SESSION_CONTEXT(N'BranchId')` is NULL, access MUST fail-closed (return 0 rows / reject mutation).
- Application connections must execute under a least-privileged database role subject to RLS.
