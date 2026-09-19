# PharmaSecure — Database Architecture Foundation

## 1. Database Engine
- **Target Database**: Microsoft SQL Server (2019+ or Azure SQL).
- **Relational Integrity**: Enforces Primary Keys, Foreign Keys (`NO ACTION`/`RESTRICT`), `CHECK` constraints, and composite unique keys per `07-database-integrity.md`.
- **Dialect**: T-SQL (Transact-SQL). Strictly no PostgreSQL or MySQL syntax.

## 2. Directory Layout
- `migrations/`: Deterministic, version-controlled incremental schema evolution scripts.
- `scripts/security/`: Column-level encryption, least-privileged database users, and roles.
- `scripts/rls/`: SQL Server Row-Level Security (RLS) security predicates and policies evaluating `SESSION_CONTEXT(N'BranchId')`.
- `scripts/seed/`: Idempotent seed data for system roles, permissions, and initial reference catalogs.
- `scripts/maintenance/`: Index defragmentation, consistency checks (`DBCC CHECKDB`), and maintenance jobs.
- `backups/`: Destination directory and verification procedures for automated backup drills.

## 3. Governance Rules
- All schema changes must be versioned, transactional, and backward-compatible (`07-database-integrity.md`).
- Branch isolation is enforced server-side and backed by database RLS (`06-branch-isolation.md`).
- Absolutely zero hardcoded credentials in scripts (`03-security.md`).
