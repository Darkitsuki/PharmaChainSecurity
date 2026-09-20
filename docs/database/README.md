# PharmaSecure Database Documentation

Complies with `.agents/rules/07-database-integrity.md`.

## Specifications
- Engine: Oracle Database 23ai (PL/SQL & SQL).
- Exact numeric types (`NUMBER(18, 2)`) for financial and quantity values; floating point prohibited.
- UTC timestamps (`TIMESTAMP WITH TIME ZONE` with `SYSTIMESTAMP`).
- Atomic transactions with proper rollback handling for multi-step mutations.
- Always use `NULL` for optional values instead of empty strings.
- String columns should have sufficient precision (e.g., `VARCHAR2(255)` or `VARCHAR2(500)` as needed).