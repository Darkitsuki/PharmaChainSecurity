# Database Migrations

This directory stores deterministic, ordered migration scripts for Oracle Database 23ai.

## Guidelines
- Naming pattern: `V{YYYYMMDD_HHMMSS}__{Description}.sql`
- Scripts must adhere to Oracle SQL & PL/SQL syntax.
- Data modifications (DML) must execute inside explicit transaction blocks ending with `COMMIT;`.
- For idempotent DDL or block execution, wrap statements in `BEGIN ... EXCEPTION WHEN OTHERS THEN ... END; /` blocks.
- No destructive drops without explicit governance sign-off (Rule 07).
