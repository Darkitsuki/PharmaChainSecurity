# Database Backups

Destination folder and procedures for Oracle Database 23ai backups.

## Governance Standards (Rule 02, 09)
- Backup routine:
  - Logical: Oracle Data Pump (`expdp`) schema backups with compression and metadata verification.
  - Physical: Oracle Recovery Manager (RMAN) Full and Incremental backups including Archive Logs.
- Verification: An untested backup is NOT considered recoverable. Routine periodic test restorations must execute in an isolated environment and pass Oracle Health Monitor checks (`DBMS_HM.RUN_CHECK`).
- Security: Backup dump files and RMAN backup pieces must be stored in access-controlled storage and encrypted.
