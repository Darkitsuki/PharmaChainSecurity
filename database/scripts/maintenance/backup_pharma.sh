#!/usr/bin/env bash
# ==============================================================================
# PROJECT: PharmaChainSecurity
# SCRIPT: database/scripts/maintenance/backup_pharma.sh
# DESCRIPTION: Automated backup & recovery utility for Oracle Database 23ai / 21c
#              Adheres to Governance Rules 00, 02, 03, 07, 09 (Section 14 & 15).
# ==============================================================================

set -euo pipefail

# ------------------------------------------------------------------------------
# 1. Oracle Environment Configuration
# ------------------------------------------------------------------------------
export ORACLE_HOME="${ORACLE_HOME:-/opt/oracle/product/23ai/dbhomeFree}"
export ORACLE_SID="${ORACLE_SID:-FREE}"
export NLS_LANG="AMERICAN_AMERICA.AL32UTF8"
export PATH="${ORACLE_HOME}/bin:${PATH}"
if [[ -d "${ORACLE_HOME}/lib" ]]; then
    export LD_LIBRARY_PATH="${ORACLE_HOME}/lib:${LD_LIBRARY_PATH:-}"
fi

# ------------------------------------------------------------------------------
# 2. Parameters & Security Secret Configuration
# ------------------------------------------------------------------------------
ENV_SECRET_FILE="${ENV_SECRET_FILE:-/etc/pharma_secure/db_backup.env}"
RETENTION_DAYS=7
DATA_PUMP_DIR="${DATA_PUMP_DIR:-DATA_PUMP_DIR}"
ORACLE_CONNECT_STRING="${ORACLE_CONNECT_STRING:-localhost:1521/FREEPDB1}"
ORACLE_SCHEMA="${ORACLE_SCHEMA:-PHARMA_ADMIN}"
BACKUP_STORAGE_DIR="${BACKUP_STORAGE_DIR:-/opt/oracle/admin/${ORACLE_SID}/dpdump}"

# Script directory to locate Setup_Security_Policies.sql
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SETUP_POLICIES_SQL="${SCRIPT_DIR}/../../Setup_Security_Policies.sql"

# ------------------------------------------------------------------------------
# 3. Secret Validation: Ensure No Hardcoded Passwords
# ------------------------------------------------------------------------------
load_credentials() {
    if [[ ! -f "${ENV_SECRET_FILE}" ]]; then
        echo "[ERROR] Security secret file '${ENV_SECRET_FILE}' does not exist." >&2
        echo "Please create '${ENV_SECRET_FILE}' with restricted permissions (chmod 600) containing:" >&2
        echo "  ORACLE_BACKUP_USER=<backup_user>" >&2
        echo "  ORACLE_BACKUP_PASSWORD=<backup_password>" >&2
        exit 1
    fi

    # Read credentials securely
    set -a
    # shellcheck disable=SC1090
    . "${ENV_SECRET_FILE}"
    set +a

    if [[ -z "${ORACLE_BACKUP_USER:-}" || -z "${ORACLE_BACKUP_PASSWORD:-}" ]]; then
        echo "[ERROR] 'ORACLE_BACKUP_USER' or 'ORACLE_BACKUP_PASSWORD' is missing in '${ENV_SECRET_FILE}'." >&2
        exit 1
    fi
}

# ------------------------------------------------------------------------------
# 4. Action: Backup (Oracle Data Pump expdp with FLASHBACK_TIME)
# ------------------------------------------------------------------------------
do_backup() {
    load_credentials

    local timestamp
    timestamp="$(date +"%Y%m%d_%H%M%S")"
    local dumpfile="pharma_backup_${timestamp}.dmp"
    local logfile="pharma_backup_${timestamp}.log"

    echo "=============================================================================="
    echo "Starting automated Oracle Data Pump backup for schema: ${ORACLE_SCHEMA}"
    echo "Timestamp       : ${timestamp}"
    echo "Dumpfile        : ${dumpfile}"
    echo "Directory Object: ${DATA_PUMP_DIR}"
    echo "Connect Target  : ${ORACLE_CONNECT_STRING}"
    echo "=============================================================================="

    local conn_str="${ORACLE_BACKUP_USER}/${ORACLE_BACKUP_PASSWORD}@${ORACLE_CONNECT_STRING}"

    # Execute expdp with FLASHBACK_TIME=SYSTIMESTAMP for transaction-consistent state
    expdp "${conn_str}" \
        DIRECTORY="${DATA_PUMP_DIR}" \
        DUMPFILE="${dumpfile}" \
        LOGFILE="${logfile}" \
        SCHEMAS="${ORACLE_SCHEMA}" \
        FLASHBACK_TIME=SYSTIMESTAMP \
        COMPRESSION=ALL

    echo "[SUCCESS] Backup completed successfully: ${dumpfile}"

    # Auto-cleanup: purge backup dump and log files older than RETENTION_DAYS
    echo "Cleaning up backup artifacts older than ${RETENTION_DAYS} days in ${BACKUP_STORAGE_DIR}..."
    if [[ -d "${BACKUP_STORAGE_DIR}" ]]; then
        find "${BACKUP_STORAGE_DIR}" -type f -name "pharma_backup_*.dmp" -mtime "+${RETENTION_DAYS}" -exec rm -f {} + 2>/dev/null || true
        find "${BACKUP_STORAGE_DIR}" -type f -name "pharma_backup_*.log" -mtime "+${RETENTION_DAYS}" -exec rm -f {} + 2>/dev/null || true
        echo "[SUCCESS] Retention cleanup completed."
    else
        echo "[NOTICE] Backup storage directory '${BACKUP_STORAGE_DIR}' not locally accessible for file purge (managed on database server)."
    fi
}

# ------------------------------------------------------------------------------
# 5. Action: Restore (Oracle Data Pump impdp with TABLE_EXISTS_ACTION=REPLACE)
# ------------------------------------------------------------------------------
do_restore() {
    local dumpfile="${1:-}"
    if [[ -z "${dumpfile}" ]]; then
        echo "[ERROR] Missing dump file parameter for restore." >&2
        echo "Usage: $0 restore <dump_file.dmp>" >&2
        exit 1
    fi

    load_credentials

    local timestamp
    timestamp="$(date +"%Y%m%d_%H%M%S")"
    local logfile="pharma_restore_${timestamp}.log"
    local conn_str="${ORACLE_BACKUP_USER}/${ORACLE_BACKUP_PASSWORD}@${ORACLE_CONNECT_STRING}"

    echo "=============================================================================="
    echo "Starting Oracle Data Pump restore for schema: ${ORACLE_SCHEMA}"
    echo "Timestamp          : ${timestamp}"
    echo "Dumpfile           : ${dumpfile}"
    echo "Directory Object   : ${DATA_PUMP_DIR}"
    echo "Table Exists Action: REPLACE"
    echo "=============================================================================="

    # Execute impdp with TABLE_EXISTS_ACTION=REPLACE
    impdp "${conn_str}" \
        DIRECTORY="${DATA_PUMP_DIR}" \
        DUMPFILE="${dumpfile}" \
        LOGFILE="${logfile}" \
        SCHEMAS="${ORACLE_SCHEMA}" \
        TABLE_EXISTS_ACTION=REPLACE

    echo "[SUCCESS] Data restore completed from ${dumpfile}."

    # Post-restore step: Re-apply VPD policies and CLS views
    echo "------------------------------------------------------------------------------"
    echo "Re-applying Oracle VPD policies and CLS views from: ${SETUP_POLICIES_SQL}"
    echo "------------------------------------------------------------------------------"
    if [[ -f "${SETUP_POLICIES_SQL}" ]]; then
        sqlplus -s "${conn_str}" @"${SETUP_POLICIES_SQL}"
        echo "[SUCCESS] Oracle VPD and CLS security policies re-applied successfully."
    else
        echo "[WARNING] Security policy script '${SETUP_POLICIES_SQL}' not found. Please re-apply policies manually." >&2
    fi
}

# ------------------------------------------------------------------------------
# 6. Command Dispatcher
# ------------------------------------------------------------------------------
case "${1:-}" in
    backup)
        do_backup
        ;;
    restore)
        shift
        do_restore "${1:-}"
        ;;
    *)
        echo "Usage: $0 {backup|restore <dump_file.dmp>}" >&2
        exit 1
        ;;
esac

