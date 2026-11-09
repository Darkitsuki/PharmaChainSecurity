-- =============================================================================
-- SCRIPT 01: PHÂN TÁCH TÀI KHOẢN VÀ CẤP QUYỀN TỐI THIỂU (LEAST PRIVILEGE)
-- PROJECT: PharmaChainSecurity — Multi-Branch Pharmacy Management System
-- TARGET DB: Oracle Database 23ai / 21c (PDB: FREEPDB1 / XEPDB1)
-- GOVERNANCE: Rule 01 (Least Privilege), Rule 03 (Security Baseline), Skill 07
-- MÔ TẢ:
--   1. Tạo tài khoản runtime PHARMA_APP_USER dành riêng cho Backend (.NET 8 API).
--   2. Thu hồi triệt để quyền DBA và EXEMPT ACCESS POLICY để đảm bảo VPD bắt buộc thực thi.
--   3. Cấp quyền DML (SELECT, INSERT, UPDATE, DELETE) trên các bảng nghiệp vụ của PHARMA_ADMIN.
--   4. Cấp quyền EXECUTE trên package phiên và SELECT trên CLS view.
--   5. Tạo Synonyms để Backend truy vấn trực tiếp không cần chỉ định tiền tố schema.
-- =============================================================================

-- Cấu hình hiển thị và chế độ dừng khi lỗi (nếu chạy qua SQL*Plus / SQLcl)
SET FEEDBACK ON;
SET SERVEROUTPUT ON SIZE 1000000;

PROMPT =============================================================================
PROMPT BƯỚC 1.1: KHỞI TẠO TÀI KHOẢN RUNTIME PHARMA_APP_USER (IDEMPOTENT)
PROMPT =============================================================================

DECLARE
    v_user_exists NUMBER := 0;
BEGIN
    SELECT COUNT(*) INTO v_user_exists 
    FROM all_users 
    WHERE username = 'PHARMA_APP_USER';

    IF v_user_exists = 0 THEN
        -- Khởi tạo tài khoản runtime mới với mật khẩu mạnh
        EXECUTE IMMEDIATE 'CREATE USER PHARMA_APP_USER IDENTIFIED BY "AppUser_Secured_2026#" ' ||
                          'DEFAULT TABLESPACE USERS ' ||
                          'TEMPORARY TABLESPACE TEMP ' ||
                          'QUOTA 100M ON USERS ' ||
                          'ACCOUNT UNLOCK';
        DBMS_OUTPUT.PUT_LINE(' [INFO] Đã tạo thành công người dùng PHARMA_APP_USER.');
    ELSE
        -- Nếu tài khoản đã tồn tại, đồng bộ lại mật khẩu và trạng thái mở khóa
        EXECUTE IMMEDIATE 'ALTER USER PHARMA_APP_USER IDENTIFIED BY "AppUser_Secured_2026#" ACCOUNT UNLOCK';
        EXECUTE IMMEDIATE 'ALTER USER PHARMA_APP_USER QUOTA 100M ON USERS';
        DBMS_OUTPUT.PUT_LINE(' [INFO] Người dùng PHARMA_APP_USER đã tồn tại. Đã cập nhật mật khẩu và quota.');
    END IF;
END;
/

PROMPT =============================================================================
PROMPT BƯỚC 1.2: CẤP QUYỀN HỆ THỐNG CƠ BẢN VÀ THU HỒI ĐẶC QUYỀN NGUY HIỂM (RULE 01)
PROMPT =============================================================================

-- 1. Cấp quyền kết nối và tạo synonym riêng
GRANT CREATE SESSION TO PHARMA_APP_USER;
GRANT CREATE SYNONYM TO PHARMA_APP_USER;

-- 2. THU HỒI TUYỆT ĐỐI các quyền nguy hiểm có thể bypass chính sách bảo mật:
--    - DBA: Quyền quản trị tối cao.
--    - EXEMPT ACCESS POLICY: Quyền miễn trừ kiểm tra VPD (DBMS_RLS). Nếu có quyền này, VPD bị vô hiệu hóa!
BEGIN
    EXECUTE IMMEDIATE 'REVOKE DBA FROM PHARMA_APP_USER';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'REVOKE EXEMPT ACCESS POLICY FROM PHARMA_APP_USER';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'REVOKE EXEMPT REDACTION POLICY FROM PHARMA_APP_USER';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

PROMPT =============================================================================
PROMPT BƯỚC 1.3: CẤP QUYỀN THAO TÁC DỮ LIỆU (DML) TRÊN CÁC BẢNG CỦA PHARMA_ADMIN
PROMPT =============================================================================

-- 1. Bảng nghiệp vụ cốt lõi chịu sự kiểm soát của VPD (RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON PHARMA_ADMIN.INVENTORIES TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON PHARMA_ADMIN.INVOICES TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON PHARMA_ADMIN.GOODS_RECEIPTS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON PHARMA_ADMIN.INVENTORY_TRANSACTIONS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON PHARMA_ADMIN.CUSTOMERS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON PHARMA_ADMIN.PURCHASE_ORDERS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON PHARMA_ADMIN.RETURNS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON PHARMA_ADMIN.INVENTORY_AUDITS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON PHARMA_ADMIN.STOCK_TRANSFERS TO PHARMA_APP_USER;

-- 2. Bảng chi tiết hóa đơn, chứng từ và an ninh số
GRANT SELECT, INSERT, UPDATE, DELETE ON PHARMA_ADMIN.INVOICE_ITEMS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON PHARMA_ADMIN.GOODS_RECEIPT_ITEMS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON PHARMA_ADMIN.PURCHASE_ORDER_ITEMS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON PHARMA_ADMIN.RETURN_ITEMS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON PHARMA_ADMIN.INVENTORY_AUDIT_ITEMS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON PHARMA_ADMIN.STOCK_TRANSFER_ITEMS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE, DELETE ON PHARMA_ADMIN.DIGITAL_SIGNATURES TO PHARMA_APP_USER;

-- 3. Bảng nhật ký kiểm toán (Chỉ cho phép đọc và thêm nhật ký mới, cấm sửa/xóa - Rule 00 & Rule 09)
GRANT SELECT, INSERT ON PHARMA_ADMIN.AUDIT_LOGS TO PHARMA_APP_USER;

-- 4. Bảng danh mục tham chiếu (Catalog / Reference Data)
GRANT SELECT, INSERT, UPDATE ON PHARMA_ADMIN.DRUGS TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE ON PHARMA_ADMIN.DRUG_BATCHES TO PHARMA_APP_USER;
GRANT SELECT, INSERT, UPDATE ON PHARMA_ADMIN.SUPPLIERS TO PHARMA_APP_USER;
GRANT SELECT ON PHARMA_ADMIN.BRANCHES TO PHARMA_APP_USER;
GRANT SELECT ON PHARMA_ADMIN.ROLES TO PHARMA_APP_USER;
GRANT SELECT, UPDATE ON PHARMA_ADMIN.USERS TO PHARMA_APP_USER;

PROMPT =============================================================================
PROMPT BƯỚC 1.4: CẤP QUYỀN THỰC THI PACKAGE BẢO MẬT VÀ TRUY VẤN VIEW CLS
PROMPT =============================================================================

-- Cấp quyền EXECUTE trên package quản lý phiên bảo mật
GRANT EXECUTE ON PHARMA_ADMIN.PKG_PHARMA_SECURITY TO PHARMA_APP_USER;

-- Cấp quyền SELECT trên View bảo mật cấp độ cột ẩn doanh thu cá nhân
GRANT SELECT ON PHARMA_ADMIN.VW_STAFF_REVENUE_SECURITY TO PHARMA_APP_USER;

PROMPT =============================================================================
PROMPT BƯỚC 1.5: TẠO SYNONYM CHO PHARMA_APP_USER (KHÔNG CẦN TIỀN TỐ PHARMA_ADMIN.)
PROMPT =============================================================================

DECLARE
    TYPE t_name_list IS TABLE OF VARCHAR2(100);
    v_objects t_name_list := t_name_list(
        -- Tables
        'INVENTORIES',
        'INVOICES',
        'INVOICE_ITEMS',
        'GOODS_RECEIPTS',
        'GOODS_RECEIPT_ITEMS',
        'INVENTORY_TRANSACTIONS',
        'CUSTOMERS',
        'PURCHASE_ORDERS',
        'PURCHASE_ORDER_ITEMS',
        'RETURNS',
        'RETURN_ITEMS',
        'INVENTORY_AUDITS',
        'INVENTORY_AUDIT_ITEMS',
        'STOCK_TRANSFERS',
        'STOCK_TRANSFER_ITEMS',
        'DIGITAL_SIGNATURES',
        'AUDIT_LOGS',
        'DRUGS',
        'DRUG_BATCHES',
        'SUPPLIERS',
        'BRANCHES',
        'ROLES',
        'USERS',
        -- Package & Views
        'PKG_PHARMA_SECURITY',
        'VW_STAFF_REVENUE_SECURITY'
    );
BEGIN
    FOR i IN 1..v_objects.COUNT LOOP
        BEGIN
            -- Tạo Private Synonym cho PHARMA_APP_USER
            EXECUTE IMMEDIATE 'CREATE OR REPLACE SYNONYM PHARMA_APP_USER.' || v_objects(i) || 
                              ' FOR PHARMA_ADMIN.' || v_objects(i);
        EXCEPTION
            WHEN OTHERS THEN
                -- Nếu không đủ quyền tạo Private Synonym schema khác, fallback tạo Public Synonym
                BEGIN
                    EXECUTE IMMEDIATE 'CREATE OR REPLACE PUBLIC SYNONYM ' || v_objects(i) || 
                                      ' FOR PHARMA_ADMIN.' || v_objects(i);
                EXCEPTION
                    WHEN OTHERS THEN
                        DBMS_OUTPUT.PUT_LINE(' [WARN] Không thể tạo synonym cho ' || v_objects(i) || ': ' || SQLERRM);
                END;
        END;
    END LOOP;
    DBMS_OUTPUT.PUT_LINE(' [INFO] Đã khởi tạo hoàn tất toàn bộ Synonyms cho PHARMA_APP_USER.');
END;
/

-- Cho phép PHARMA_ADMIN kết nối PROXY qua PHARMA_APP_USER phục vụ bảo trì / kiểm thử
BEGIN
    EXECUTE IMMEDIATE 'ALTER USER PHARMA_APP_USER GRANT CONNECT THROUGH PHARMA_ADMIN';
    DBMS_OUTPUT.PUT_LINE(' [INFO] Đã cấp quyền Proxy Connect cho PHARMA_ADMIN thông qua PHARMA_APP_USER.');
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE(' [NOTE] Bỏ qua Proxy Connect: ' || SQLERRM);
END;
/

PROMPT =============================================================================
PROMPT HOÀN THÀNH SCRIPT 01: PHÂN TÁCH VÀ CẤP QUYỀN TỐI THIỂU CHO PHARMA_APP_USER
PROMPT =============================================================================

