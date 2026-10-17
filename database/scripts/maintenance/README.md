# Database Maintenance Scripts

This directory contains routine operational maintenance scripts for Oracle Database:
- Index maintenance and rebuilds (`ALTER INDEX ... REBUILD ONLINE`)
- Optimizer statistics collection via `DBMS_STATS.GATHER_SCHEMA_STATS`
- Database integrity checks via Oracle Health Monitor (`DBMS_HM.RUN_CHECK`) (Rule 09, Section 15)
