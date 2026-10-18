-- =============================================================================
-- SCRIPT 01: CREATE APPLICATION CONTEXT AND SESSION PACKAGE
-- PROJECT: PharmaSecure — Multi-Branch Pharmacy Management System
-- GOVERNANCE: Rule 03 (Security), Rule 06 (Branch Isolation), Skill 07 (Oracle)
-- =============================================================================

-- 1. Create or Replace Context
-- Note: Creating a context requires CREATE ANY CONTEXT privilege (typically run by DBA or schema owner with privilege).
BEGIN
    EXECUTE IMMEDIATE 'CREATE OR REPLACE CONTEXT PHARMA_CTX USING PKG_SESSION_CTX';
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Notice: If CREATE CONTEXT fails, verify user has CREATE ANY CONTEXT privilege.');
        RAISE;
END;
/

-- 2. Package Specification
CREATE OR REPLACE PACKAGE PKG_SESSION_CTX AS
    -- Initializes branch context for the current session
    PROCEDURE SET_BRANCH_CONTEXT(p_branch_id IN VARCHAR2);

    -- Enables or disables global branch visibility (e.g. for System Administrator / Central Auditor)
    PROCEDURE SET_GLOBAL_CONTEXT(p_is_global IN VARCHAR2 DEFAULT 'TRUE');

    -- Clears session context on connection pool release
    PROCEDURE CLEAR_CONTEXT;

    -- Gets current active branch ID from context
    FUNCTION GET_CURRENT_BRANCH_ID RETURN VARCHAR2;
END PKG_SESSION_CTX;
/

-- 3. Package Body
CREATE OR REPLACE PACKAGE BODY PKG_SESSION_CTX AS

    PROCEDURE SET_BRANCH_CONTEXT(p_branch_id IN VARCHAR2) IS
        v_clean_branch_id VARCHAR2(50);
    BEGIN
        IF p_branch_id IS NULL OR TRIM(p_branch_id) IS NULL THEN
            RAISE_APPLICATION_ERROR(-20001, 'Branch ID cannot be null or empty.');
        END IF;

        v_clean_branch_id := TRIM(p_branch_id);

        -- Set custom namespace context
        DBMS_SESSION.SET_CONTEXT('PHARMA_CTX', 'BRANCH_ID', v_clean_branch_id);
        DBMS_SESSION.SET_CONTEXT('PHARMA_CTX', 'IS_GLOBAL', 'FALSE');

        -- Set standard Oracle client identifier (used by connection factory & audit)
        DBMS_SESSION.SET_IDENTIFIER(v_clean_branch_id);
    END SET_BRANCH_CONTEXT;

    PROCEDURE SET_GLOBAL_CONTEXT(p_is_global IN VARCHAR2 DEFAULT 'TRUE') IS
    BEGIN
        IF UPPER(TRIM(p_is_global)) = 'TRUE' THEN
            DBMS_SESSION.SET_CONTEXT('PHARMA_CTX', 'IS_GLOBAL', 'TRUE');
        ELSE
            DBMS_SESSION.SET_CONTEXT('PHARMA_CTX', 'IS_GLOBAL', 'FALSE');
        END IF;
    END SET_GLOBAL_CONTEXT;

    PROCEDURE CLEAR_CONTEXT IS
    BEGIN
        DBMS_SESSION.CLEAR_CONTEXT('PHARMA_CTX');
        DBMS_SESSION.CLEAR_IDENTIFIER;
    END CLEAR_CONTEXT;

    FUNCTION GET_CURRENT_BRANCH_ID RETURN VARCHAR2 IS
        v_branch_id VARCHAR2(50);
    BEGIN
        v_branch_id := SYS_CONTEXT('PHARMA_CTX', 'BRANCH_ID');
        IF v_branch_id IS NULL THEN
            v_branch_id := SYS_CONTEXT('USERENV', 'CLIENT_IDENTIFIER');
        END IF;
        RETURN v_branch_id;
    END GET_CURRENT_BRANCH_ID;

END PKG_SESSION_CTX;
/
