# Database Migrations

This directory stores deterministic, ordered migration scripts for Microsoft SQL Server.

## Guidelines
- Naming pattern: `V{YYYYMMDD_HHMMSS}__{Description}.sql`
- Scripts must execute inside explicit transactions:
  ```sql
  BEGIN TRANSACTION;
  -- DDL statements
  COMMIT TRANSACTION;
  ```
- No destructive drops without explicit governance sign-off (Rule 07).
