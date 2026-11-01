-- =============================================================================
-- MIGRATION: V20261101_01__align_security_roles.sql
-- DESCRIPTION: Chuẩn hóa Role Code 'OWNER' giữa Backend .NET 8 và Oracle Database
-- GOVERNANCE: Rule 03 (Security), Rule 04 (RBAC), Rule 06 (Branch Isolation)
-- =============================================================================

ALTER SESSION SET CURRENT_SCHEMA = PHARMA_ADMIN;

-- 1. CẬP NHẬT PACKAGE BODY PKG_PHARMA_SECURITY
CREATE OR REPLACE PACKAGE BODY PKG_PHARMA_SECURITY AS

    PROCEDURE SET_USER_CONTEXT(
        p_user_id   IN VARCHAR2,
        p_role_code IN VARCHAR2,
        p_branch_id IN VARCHAR2
    ) IS
    BEGIN
        DBMS_SESSION.SET_CONTEXT('PHARMA_CTX', 'USER_ID', p_user_id);
        DBMS_SESSION.SET_CONTEXT('PHARMA_CTX', 'ROLE_CODE', p_role_code);
        DBMS_SESSION.SET_CONTEXT('PHARMA_CTX', 'BRANCH_ID', p_branch_id);
    END SET_USER_CONTEXT;

    PROCEDURE CLEAR_USER_CONTEXT IS
    BEGIN
        DBMS_SESSION.CLEAR_ALL_CONTEXT('PHARMA_CTX');
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

        -- Hỗ trợ cả mã chuẩn từ Backend .NET ('OWNER') lẫn tên tiếng Việt lịch sử ('CHU_NHA_THUOC', 'Chủ nhà thuốc', 'ADMIN')
        IF UPPER(TRIM(v_role_code)) IN ('OWNER', 'CHU_NHA_THUOC', 'CHỦ NHÀ THUỐC', 'ADMIN') THEN
            RETURN '1 = 1';
        END IF;

        -- Nếu kết nối không có ngữ cảnh chi nhánh hợp lệ -> Chặn truy xuất (Fail-closed)
        IF v_branch_id IS NULL OR TRIM(v_branch_id) IS NULL THEN
            RETURN '1 = 0';
        END IF;

        -- Cô lập dữ liệu: Nhân viên thuộc chi nhánh nào chỉ thấy dữ liệu chi nhánh đó
        RETURN 'BranchId = ''' || v_branch_id || '''';
    END FN_VPD_BRANCH_ISOLATION;

END PKG_PHARMA_SECURITY;
/

-- 2. CẬP NHẬT VIEW BẢO MẬT CẤP ĐỘ CỘT (CLS) - HIỂN THỊ DOANH THU CHO ROLE 'OWNER'
CREATE OR REPLACE VIEW VW_STAFF_REVENUE_SECURITY AS
SELECT 
    u.Id AS UserId,
    u.Username,
    u.FullName,
    u.PhoneNumber,
    u.BranchId,
    r.RoleName,
    -- Nếu là Chủ nhà thuốc (OWNER / CHU_NHA_THUOC) thì hiển thị tổng doanh thu thực tế, ngược lại ẩn thành NULL
    CASE 
        WHEN UPPER(TRIM(SYS_CONTEXT('PHARMA_CTX', 'ROLE_CODE'))) IN ('OWNER', 'CHU_NHA_THUOC', 'CHỦ NHÀ THUỐC', 'ADMIN') 
        THEN NVL(SUM(i.TotalAmount), 0)
        ELSE NULL 
    END AS PersonalRevenue
FROM USERS u
JOIN ROLES r ON u.RoleId = r.Id
LEFT JOIN INVOICES i ON u.Id = i.CashierId
GROUP BY u.Id, u.Username, u.FullName, u.PhoneNumber, u.BranchId, r.RoleName;
/

