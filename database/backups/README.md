# Database Backups

Destination folder and procedures for Microsoft SQL Server backups.

## Governance Standards (Rule 02, 09)
- Backup routine: Full, Differential, and Transaction Log.
- Verification: An untested backup is NOT considered recoverable. Routine periodic test restorations must execute in an isolated environment and pass `DBCC CHECKDB`.
- Security: Backup files must be stored in access-controlled storage and encrypted.
