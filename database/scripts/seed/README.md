# Seed Scripts

This directory contains idempotent seed data scripts.

## Rules (Rule 07 — Database Integrity)
- Scripts must be idempotent (using `MERGE` or `IF NOT EXISTS`), permitting safe re-execution.
- Zero hardcoded production credentials or private keys.
- Seed data defines canonical roles (`OWNER`, `SALES`, `WAREHOUSE`) and core permissions.
