# PharmaSecure Database Documentation

Complies with `.agents/rules/07-database-integrity.md`.

## Specifications
- Engine: Microsoft SQL Server (T-SQL).
- Exact numeric types (`DECIMAL(18, 2)`) for financial and quantity values; floating point prohibited.
- UTC timestamps (`DATETIME2` with `SYSUTCDATETIME()`).
- Atomic transactions with proper rollback handling for multi-step mutations.
