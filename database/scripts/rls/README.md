# Row-Level Security (RLS) Scripts

This directory contains Microsoft SQL Server Row-Level Security predicates and policies.

## Invariants (Rule 06 — Branch Isolation)
- Evaluates `SESSION_CONTEXT(N'BranchId') = chi_nhanh_id`.
- Both `FILTER PREDICATE` (read protection) and `BLOCK PREDICATE` (mutation protection) are required.
- If `SESSION_CONTEXT(N'BranchId')` is NULL, access MUST fail-closed (return 0 rows / reject mutation).
- Application connections must execute under a least-privileged database role subject to RLS.
