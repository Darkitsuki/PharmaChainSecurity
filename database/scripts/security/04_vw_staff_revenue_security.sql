-- =============================================================================
-- SCRIPT 04: BẢO MẬT CẤP ĐỘ CỘT (COLUMN-LEVEL SECURITY - CLS VIEW)
-- PROJECT: PharmaChainSecurity — Multi-Branch Pharmacy Management System
-- TARGET DB: Oracle Database 23ai / 21c
-- GOVERNANCE: Rule 03 (CLS), Rule 04 (RBAC Matrix), Rule 06 (Branch Isolation)
-- MÔ TẢ:
--   1. Tạo hoặc cập nhật View VW_STAFF_REVENUE_SECURITY kết hợp USERS, ROLES, INVOICES.
--   2. Kiểm soát hiển thị cột PersonalRevenue dựa trên ngữ cảnh phiên:
--      - Vai trò OWNER / CHU_NHA_THUOC / ADMIN: nhìn thấy tổng doanh thu thực tế.
--      - Vai trò khác (SALES, WAREHOUSE): trường PersonalRevenue bị ẩn (trả về NULL).
--   3. Cấp quyền SELECT và tạo Synonym cho PHARMA_APP_USER.
-- =============================================================================

SET FEEDBACK ON;
SET SERVEROUTPUT ON SIZE 1000000;

PROMPT =============================================================================
PROMPT BƯỚC 4.1: XÂY DỰNG VIEW BẢO MẬT DOANH THU NHÂN VIÊN (CLS VIEW)
PROMPT =============================================================================

CREATE OR REPLACE VIEW PHARMA_ADMIN.VW_STAFF_REVENUE_SECURITY AS
SELECT 
    u.Id           AS UserId,
    u.Username     AS Username,
    u.FullName     AS FullName,
    u.PhoneNumber  AS PhoneNumber,
    u.BranchId     AS BranchId,
    r.RoleName     AS RoleName,
    -- Column-Level Security (CLS):
    -- Chỉ cho phép vai trò Chủ nhà thuốc / Quản trị viên (OWNER, CHU_NHA_THUOC, ADMIN)
    -- được phép nhìn thấy doanh thu thực tế của nhân viên. Các vai trò khác nhận giá trị NULL.
    CASE 
        WHEN UPPER(TRIM(SYS_CONTEXT('PHARMA_CTX', 'ROLE_CODE'))) IN ('OWNER', 'CHU_NHA_THUOC', 'CHỦ NHÀ THUỐC', 'ADMIN') 
        THEN NVL(SUM(i.TotalAmount), 0)
        ELSE NULL 
    END AS PersonalRevenue
FROM PHARMA_ADMIN.USERS u
JOIN PHARMA_ADMIN.ROLES r 
    ON u.RoleId = r.Id
LEFT JOIN PHARMA_ADMIN.INVOICES i 
    ON u.Id = i.CashierId
   AND i.Status = 'COMPLETED'
   AND i.PaymentStatus = 'PAID'
GROUP BY 
    u.Id, 
    u.Username, 
    u.FullName, 
    u.PhoneNumber, 
    u.BranchId, 
    r.RoleName;
/

PROMPT =============================================================================
PROMPT BƯỚC 4.2: CẤP QUYỀN TRUY VẤN VÀ TẠO SYNONYM CHO PHARMA_APP_USER
PROMPT =============================================================================

-- Cấp quyền SELECT trên View cho tài khoản runtime
GRANT SELECT ON PHARMA_ADMIN.VW_STAFF_REVENUE_SECURITY TO PHARMA_APP_USER;

-- Đăng ký Private Synonym hoặc Public Synonym
BEGIN
    EXECUTE IMMEDIATE 'CREATE OR REPLACE SYNONYM PHARMA_APP_USER.VW_STAFF_REVENUE_SECURITY FOR PHARMA_ADMIN.VW_STAFF_REVENUE_SECURITY';
    DBMS_OUTPUT.PUT_LINE(' [INFO] Đã tạo Private Synonym VW_STAFF_REVENUE_SECURITY cho PHARMA_APP_USER.');
EXCEPTION
    WHEN OTHERS THEN
        EXECUTE IMMEDIATE 'CREATE OR REPLACE PUBLIC SYNONYM VW_STAFF_REVENUE_SECURITY FOR PHARMA_ADMIN.VW_STAFF_REVENUE_SECURITY';
        DBMS_OUTPUT.PUT_LINE(' [INFO] Đã tạo Public Synonym VW_STAFF_REVENUE_SECURITY.');
END;
/

PROMPT =============================================================================
PROMPT HOÀN THÀNH SCRIPT 04: KHỞI TẠO XONG CLS VIEW VW_STAFF_REVENUE_SECURITY
PROMPT =============================================================================

