-- =============================================================================
-- SCRIPT 02: CREATE ORACLE VPD SECURITY PREDICATE FUNCTION
-- PROJECT: PharmaSecure — Multi-Branch Pharmacy Management System
-- GOVERNANCE: Rule 03 (Security), Rule 06 (Branch Isolation), Skill 07 (Oracle)
-- =============================================================================

CREATE OR REPLACE FUNCTION FN_BRANCH_SECURITY_PREDICATE (
    p_schema IN VARCHAR2,
    p_object IN VARCHAR2
) RETURN VARCHAR2
AS
    v_is_global VARCHAR2(10);
    v_branch_id VARCHAR2(50);
BEGIN
    -- 1. Check if session has authorized global oversight (Owner / Super-admin)
    v_is_global := SYS_CONTEXT('PHARMA_CTX', 'IS_GLOBAL');
    IF UPPER(TRIM(v_is_global)) = 'TRUE' THEN
        -- Returning NULL in Oracle VPD means no predicate is appended (unrestricted read/write)
        RETURN NULL;
    END IF;

    -- 2. Retrieve authenticated BranchId from PHARMA_CTX (primary) or CLIENT_IDENTIFIER (fallback)
    v_branch_id := SYS_CONTEXT('PHARMA_CTX', 'BRANCH_ID');
    IF v_branch_id IS NULL THEN
        v_branch_id := SYS_CONTEXT('USERENV', 'CLIENT_IDENTIFIER');
    END IF;

    -- 3. Fail-Closed Invariant (Rule 06, Section 15):
    -- If branch context is missing, empty, or uninitialized, return '1=2'
    -- to immediately deny all access and return 0 rows without exception.
    IF v_branch_id IS NULL OR TRIM(v_branch_id) IS NULL THEN
        RETURN '1=2';
    END IF;

    -- 4. Dynamic Predicate for Branch Isolation:
    -- Appends condition ensuring only rows matching the active branch can be read or modified.
    -- NVL allows seamless interop whether backend sets PHARMA_CTX or DBMS_SESSION.SET_IDENTIFIER.
    RETURN 'BranchId = NVL(SYS_CONTEXT(''PHARMA_CTX'', ''BRANCH_ID''), SYS_CONTEXT(''USERENV'', ''CLIENT_IDENTIFIER''))';

EXCEPTION
    WHEN OTHERS THEN
        -- Defense-in-depth: Any unexpected error must fail closed
        RETURN '1=2';
END FN_BRANCH_SECURITY_PREDICATE;
/

-- 5. Predicate Function cho Điều chuyển kho liên chi nhánh (STOCK_TRANSFERS)
-- Cho phép truy cập nếu chi nhánh của phiên làm việc là Chi nhánh Gửi (FromBranchId) HOẶC Chi nhánh Nhận (ToBranchId)
CREATE OR REPLACE FUNCTION FN_TRANSFER_SECURITY_PREDICATE (
    p_schema IN VARCHAR2,
    p_object IN VARCHAR2
) RETURN VARCHAR2
AS
    v_is_global VARCHAR2(10);
    v_branch_id VARCHAR2(50);
BEGIN
    v_is_global := SYS_CONTEXT('PHARMA_CTX', 'IS_GLOBAL');
    IF UPPER(TRIM(v_is_global)) = 'TRUE' THEN
        RETURN NULL;
    END IF;

    v_branch_id := SYS_CONTEXT('PHARMA_CTX', 'BRANCH_ID');
    IF v_branch_id IS NULL THEN
        v_branch_id := SYS_CONTEXT('USERENV', 'CLIENT_IDENTIFIER');
    END IF;

    IF v_branch_id IS NULL OR TRIM(v_branch_id) IS NULL THEN
        RETURN '1=2';
    END IF;

    RETURN '(FromBranchId = NVL(SYS_CONTEXT(''PHARMA_CTX'', ''BRANCH_ID''), SYS_CONTEXT(''USERENV'', ''CLIENT_IDENTIFIER'')) OR ToBranchId = NVL(SYS_CONTEXT(''PHARMA_CTX'', ''BRANCH_ID''), SYS_CONTEXT(''USERENV'', ''CLIENT_IDENTIFIER'')))';

EXCEPTION
    WHEN OTHERS THEN
        RETURN '1=2';
END FN_TRANSFER_SECURITY_PREDICATE;
/

