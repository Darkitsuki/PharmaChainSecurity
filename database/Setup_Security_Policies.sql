-- ============================================================================
-- PROJECT: PharmaChainSecurity
-- FILE: Setup_Security_Policies.sql
-- MÔ TẢ: Cài đặt phân tách người dùng CSDL, Application Context, 
--        VPD (Row-Level Security) cô lập chi nhánh chuẩn Fail-Closed và 
--        Bảo mật cấp độ cột (Column-Level Security) ẩn doanh thu cá nhân
-- GOVERNANCE: Rule 01 (Least Privilege), Rule 02 (Fail-Closed), Rule 04, Rule 06
-- ============================================================================

SET FEEDBACK ON;
SET SERVEROUTPUT ON SIZE 1000000;

-- ----------------------------------------------------------------------------
-- BƯỚC 1: PHÂN TÁCH TÀI KHOẢN VÀ CẤP QUYỀN TỐI THIỂU (RULE 01)
-- ----------------------------------------------------------------------------
DECLARE
    v_user_exists NUMBER := 0;
BEGIN
    SELECT COUNT(*) INTO v_user_exists 
    FROM all_users 
    WHERE username = 'PHARMA_APP_USER';

    IF v_user_exists = 0 THEN
        EXECUTE IMMEDIATE 'CREATE USER PHARMA_APP_USER IDENTIFIED BY "AppUser_Secured_2026#" ' ||
                          'DEFAULT TABLESPACE USERS TEMPORARY TABLESPACE TEMP QUOTA 100M ON USERS ACCOUNT UNLOCK';
        DBMS_OUTPUT.PUT_LINE(' [INFO] Đã tạo thành công người dùng runtime PHARMA_APP_USER.');
    ELSE
        EXECUTE IMMEDIATE 'ALTER USER PHARMA_APP_USER IDENTIFIED BY "AppUser_Secured_2026#" ACCOUNT UNLOCK';
        EXECUTE IMMEDIATE 'ALTER USER PHARMA_APP_USER QUOTA 100M ON USERS';
        DBMS_OUTPUT.PUT_LINE(' [INFO] Người dùng PHARMA_APP_USER đã tồn tại. Đã cập nhật mật khẩu và quota.');
    END IF;
END;
/

-- Cấp quyền kết nối, thu hồi quyền DBA và EXEMPT ACCESS POLICY
GRANT CREATE SESSION TO PHARMA_APP_USER;
GRANT CREATE SYNONYM TO PHARMA_APP_USER;

BEGIN EXECUTE IMMEDIATE 'REVOKE DBA FROM PHARMA_APP_USER'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'REVOKE EXEMPT ACCESS POLICY FROM PHARMA_APP_USER'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'REVOKE EXEMPT REDACTION POLICY FROM PHARMA_APP_USER'; EXCEPTION WHEN OTHERS THEN NULL; END;
/

-- Cấp quyền DML trên các bảng nghiệp vụ
GRANT SELECT, INSERT, UPDATE, DELETE ON INVENTORIES TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON INVOICES TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON INVOICE_ITEMS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON GOODS_RECEIPTS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON GOODS_RECEIPT_ITEMS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON INVENTORY_TRANSACTIONS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON CUSTOMERS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON PURCHASE_ORDERS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON PURCHASE_ORDER_ITEMS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON RETURNS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON RETURN_ITEMS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON INVENTORY_AUDITS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON INVENTORY_AUDIT_ITEMS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON STOCK_TRANSFERS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON STOCK_TRANSFER_ITEMS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON DIGITAL_SIGNATURES TO PHARMA_APP_USER;
GRANT SELECT, INSERT ON AUDIT_LOGS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE ON DRUGS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE ON DRUG_BATCHES TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE ON SUPPLIERS TO PHARMA_APP_USER;
GRANT SELECT ON BRANCHES TO PHARMA_APP_USER;
GRANT SELECT ON ROLES TO PHARMA_APP_USER;
GRANT SELECT, UPDATE ON USERS TO PHARMA_APP_USER;

-- ----------------------------------------------------------------------------
-- BƯỚC 2: KHỞI TẠO APPLICATION CONTEXT VÀ PACKAGE QUẢN LÝ PHIÊN
-- ----------------------------------------------------------------------------
CREATE OR REPLACE CONTEXT PHARMA_CTX USING PKG_PHARMA_SECURITY;
/

CREATE OR REPLACE PACKAGE PKG_PHARMA_SECURITY AS
    PROCEDURE SET_USER_CONTEXT(
        p_user_id   IN VARCHAR2,
        p_role_code IN VARCHAR2,
        p_branch_id IN VARCHAR2
    );

    PROCEDURE CLEAR_USER_CONTEXT;

    FUNCTION FN_VPD_BRANCH_ISOLATION(
        p_schema IN VARCHAR2,
        p_object IN VARCHAR2
    ) RETURN VARCHAR2;

    FUNCTION FN_VPD_TRANSFER_ISOLATION(
        p_schema IN VARCHAR2,
        p_object IN VARCHAR2
    ) RETURN VARCHAR2;

    FUNCTION GET_USER_ID   RETURN VARCHAR2;
    FUNCTION GET_ROLE_CODE RETURN VARCHAR2;
    FUNCTION GET_BRANCH_ID RETURN VARCHAR2;
END PKG_PHARMA_SECURITY;
/

CREATE OR REPLACE PACKAGE BODY PKG_PHARMA_SECURITY AS

    PROCEDURE SET_USER_CONTEXT(
        p_user_id   IN VARCHAR2,
        p_role_code IN VARCHAR2,
        p_branch_id IN VARCHAR2
    ) IS
        v_clean_user_id   VARCHAR2(50)  := TRIM(p_user_id);
        v_clean_role_code VARCHAR2(100) := UPPER(TRIM(p_role_code));
        v_clean_branch_id VARCHAR2(50)  := TRIM(p_branch_id);
    BEGIN
        DBMS_SESSION.SET_CONTEXT('PHARMA_CTX', 'USER_ID', v_clean_user_id);
        DBMS_SESSION.SET_CONTEXT('PHARMA_CTX', 'ROLE_CODE', v_clean_role_code);
        DBMS_SESSION.SET_CONTEXT('PHARMA_CTX', 'BRANCH_ID', v_clean_branch_id);

        IF v_clean_branch_id IS NOT NULL THEN
            DBMS_SESSION.SET_IDENTIFIER(v_clean_branch_id);
        ELSE
            DBMS_SESSION.CLEAR_IDENTIFIER;
        END IF;
    END SET_USER_CONTEXT;

    PROCEDURE CLEAR_USER_CONTEXT IS
    BEGIN
        DBMS_SESSION.CLEAR_ALL_CONTEXT('PHARMA_CTX');
        DBMS_SESSION.CLEAR_IDENTIFIER;
    END CLEAR_USER_CONTEXT;

    FUNCTION FN_VPD_BRANCH_ISOLATION(
        p_schema IN VARCHAR2,
        p_object IN VARCHAR2
    ) RETURN VARCHAR2 IS
        v_role_code VARCHAR2(100);
        v_branch_id VARCHAR2(50);
    BEGIN
        v_role_code := SYS_CONTEXT('PHARMA_CTX', 'ROLE_CODE');
        v_branch_id := SYS_CONTEXT('PHARMA_CTX', 'BRANCH_ID');

        -- Chủ nhà thuốc / Admin có quyền xem toàn hệ thống
        IF UPPER(TRIM(v_role_code)) IN ('OWNER', 'CHU_NHA_THUOC', 'ADMIN') THEN
            RETURN '1 = 1';
        END IF;

        -- Fail-Closed: Nếu chưa khởi tạo ngữ cảnh chi nhánh -> Chặn hoàn toàn
        IF v_branch_id IS NULL OR TRIM(v_branch_id) IS NULL THEN
            RETURN '1 = 2';
        END IF;

        -- Dùng SYS_CONTEXT trực tiếp trong chuỗi predicate để tối ưu Shared Pool (Rule 04)
        RETURN 'BranchId = SYS_CONTEXT(''PHARMA_CTX'', ''BRANCH_ID'')';
    EXCEPTION
        WHEN OTHERS THEN
            RETURN '1 = 2';
    END FN_VPD_BRANCH_ISOLATION;

    FUNCTION FN_VPD_TRANSFER_ISOLATION(
        p_schema IN VARCHAR2,
        p_object IN VARCHAR2
    ) RETURN VARCHAR2 IS
        v_role_code VARCHAR2(100);
        v_branch_id VARCHAR2(50);
    BEGIN
        v_role_code := SYS_CONTEXT('PHARMA_CTX', 'ROLE_CODE');
        v_branch_id := SYS_CONTEXT('PHARMA_CTX', 'BRANCH_ID');

        IF UPPER(TRIM(v_role_code)) IN ('OWNER', 'CHU_NHA_THUOC', 'ADMIN') THEN
            RETURN '1 = 1';
        END IF;

        IF v_branch_id IS NULL OR TRIM(v_branch_id) IS NULL THEN
            RETURN '1 = 2';
        END IF;

        RETURN '(FromBranchId = SYS_CONTEXT(''PHARMA_CTX'', ''BRANCH_ID'') OR ToBranchId = SYS_CONTEXT(''PHARMA_CTX'', ''BRANCH_ID''))';
    EXCEPTION
        WHEN OTHERS THEN
            RETURN '1 = 2';
    END FN_VPD_TRANSFER_ISOLATION;

    FUNCTION GET_USER_ID RETURN VARCHAR2 IS BEGIN RETURN SYS_CONTEXT('PHARMA_CTX', 'USER_ID'); END;
    FUNCTION GET_ROLE_CODE RETURN VARCHAR2 IS BEGIN RETURN SYS_CONTEXT('PHARMA_CTX', 'ROLE_CODE'); END;
    FUNCTION GET_BRANCH_ID RETURN VARCHAR2 IS BEGIN RETURN SYS_CONTEXT('PHARMA_CTX', 'BRANCH_ID'); END;

END PKG_PHARMA_SECURITY;
/

-- Cấp quyền thực thi package cho PHARMA_APP_USER
GRANT EXECUTE ON PKG_PHARMA_SECURITY TO PHARMA_APP_USER;

-- ----------------------------------------------------------------------------
-- BƯỚC 3: GẮN CHÍNH SÁCH VPD (RLS) VÀO CÁC BẢNG NGHIỆP VỤ (RULE 06)
-- ----------------------------------------------------------------------------
BEGIN
    FOR r IN (
        SELECT object_owner, object_name, policy_name 
        FROM all_policies 
        WHERE object_owner = USER
          AND policy_name LIKE 'POL_VPD_%'
    ) LOOP
        DBMS_RLS.DROP_POLICY(r.object_owner, r.object_name, r.policy_name);
    END LOOP;

    -- Bảng nghiệp vụ có cột BranchId
    FOR t IN (
        SELECT column_value AS table_name 
        FROM TABLE(sys.odcivarchar2list(
            'INVENTORIES', 'INVOICES', 'GOODS_RECEIPTS', 'INVENTORY_TRANSACTIONS',
            'CUSTOMERS', 'PURCHASE_ORDERS', 'RETURNS', 'INVENTORY_AUDITS'
        ))
    ) LOOP
        DBMS_RLS.ADD_POLICY(
            object_schema   => USER,
            object_name     => t.table_name,
            policy_name     => 'POL_VPD_' || t.table_name,
            function_schema => USER,
            policy_function => 'PKG_PHARMA_SECURITY.FN_VPD_BRANCH_ISOLATION',
            statement_types => 'SELECT, INSERT, UPDATE, DELETE',
            update_check    => TRUE,
            policy_type     => DBMS_RLS.CONTEXT_SENSITIVE
        );
    END LOOP;

    -- Bảng STOCK_TRANSFERS
    DBMS_RLS.ADD_POLICY(
        object_schema   => USER,
        object_name     => 'STOCK_TRANSFERS',
        policy_name     => 'POL_VPD_STOCK_TRANSFERS',
        function_schema => USER,
        policy_function => 'PKG_PHARMA_SECURITY.FN_VPD_TRANSFER_ISOLATION',
        statement_types => 'SELECT, INSERT, UPDATE, DELETE',
        update_check    => TRUE,
        policy_type     => DBMS_RLS.CONTEXT_SENSITIVE
    );
END;
/

-- ----------------------------------------------------------------------------
-- BƯỚC 4: BẢO MẬT CẤP ĐỘ CỘT (CLS) - ẨN DOANH THU CÁ NHÂN CỦA NHÂN VIÊN
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW VW_STAFF_REVENUE_SECURITY AS
SELECT 
    u.Id AS UserId,
    u.Username,
    u.FullName,
    u.PhoneNumber,
    u.BranchId,
    r.RoleName,
    CASE 
        WHEN UPPER(TRIM(SYS_CONTEXT('PHARMA_CTX', 'ROLE_CODE'))) IN ('OWNER', 'CHU_NHA_THUOC', 'ADMIN') 
        THEN NVL(SUM(i.TotalAmount), 0)
        ELSE NULL 
    END AS PersonalRevenue
FROM USERS u
JOIN ROLES r ON u.RoleId = r.Id
LEFT JOIN INVOICES i ON u.Id = i.CashierId
                     AND i.Status = 'COMPLETED'
                     AND i.PaymentStatus = 'PAID'
GROUP BY u.Id, u.Username, u.FullName, u.PhoneNumber, u.BranchId, r.RoleName;
/

GRANT SELECT ON VW_STAFF_REVENUE_SECURITY TO PHARMA_APP_USER;

-- ----------------------------------------------------------------------------
-- BƯỚC 5: TẠO SYNONYMS CHO PHARMA_APP_USER
-- ----------------------------------------------------------------------------
DECLARE
    TYPE t_name_list IS TABLE OF VARCHAR2(100);
    v_objects t_name_list := t_name_list(
        'INVENTORIES', 'INVOICES', 'INVOICE_ITEMS', 'GOODS_RECEIPTS', 'GOODS_RECEIPT_ITEMS',
        'INVENTORY_TRANSACTIONS', 'CUSTOMERS', 'PURCHASE_ORDERS', 'PURCHASE_ORDER_ITEMS',
        'RETURNS', 'RETURN_ITEMS', 'INVENTORY_AUDITS', 'INVENTORY_AUDIT_ITEMS',
        'STOCK_TRANSFERS', 'STOCK_TRANSFER_ITEMS', 'DIGITAL_SIGNATURES', 'AUDIT_LOGS',
        'DRUGS', 'DRUG_BATCHES', 'SUPPLIERS', 'BRANCHES', 'ROLES', 'USERS',
        'PKG_PHARMA_SECURITY', 'VW_STAFF_REVENUE_SECURITY'
    );
BEGIN
    FOR i IN 1..v_objects.COUNT LOOP
        BEGIN
            EXECUTE IMMEDIATE 'CREATE OR REPLACE SYNONYM PHARMA_APP_USER.' || v_objects(i) || ' FOR ' || USER || '.' || v_objects(i);
        EXCEPTION
            WHEN OTHERS THEN
                BEGIN
                    EXECUTE IMMEDIATE 'CREATE OR REPLACE PUBLIC SYNONYM ' || v_objects(i) || ' FOR ' || USER || '.' || v_objects(i);
                EXCEPTION WHEN OTHERS THEN NULL;
                END;
        END;
    END LOOP;
END;
/
