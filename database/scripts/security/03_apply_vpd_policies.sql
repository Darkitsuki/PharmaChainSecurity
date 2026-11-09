-- =============================================================================
-- SCRIPT 03: GẮN CHÍNH SÁCH ROW-LEVEL SECURITY (DBMS_RLS / VPD)
-- PROJECT: PharmaChainSecurity — Multi-Branch Pharmacy Management System
-- TARGET DB: Oracle Database 23ai / 21c
-- GOVERNANCE: Rule 03 (Idempotency & Clean Teardown), Rule 06 (Branch Isolation)
-- MÔ TẢ:
--   1. Xóa an toàn tất cả policy POL_VPD_% cũ (Idempotent Teardown).
--   2. Đăng ký policy POL_VPD_<TABLE> cho 8 bảng nghiệp vụ trọng tâm:
--      INVENTORIES, INVOICES, GOODS_RECEIPTS, INVENTORY_TRANSACTIONS,
--      CUSTOMERS, PURCHASE_ORDERS, RETURNS, INVENTORY_AUDITS.
--   3. Đăng ký policy POL_VPD_STOCK_TRANSFERS cho bảng STOCK_TRANSFERS.
--   4. Cấu hình statement_types => 'SELECT, INSERT, UPDATE, DELETE' và update_check => TRUE.
--   5. Thiết lập policy_type => DBMS_RLS.CONTEXT_SENSITIVE tối ưu hiệu năng bộ đệm.
-- =============================================================================

SET FEEDBACK ON;
SET SERVEROUTPUT ON SIZE 1000000;

PROMPT =============================================================================
PROMPT BƯỚC 3.1: DỌN DẸP AN TOÀN POLICY CŨ NẾU ĐÃ TỒN TẠI (IDEMPOTENCY - RULE 03)
PROMPT =============================================================================

DECLARE
    v_dropped_count NUMBER := 0;
BEGIN
    FOR r IN (
        SELECT object_owner, object_name, policy_name 
        FROM all_policies 
        WHERE object_owner = 'PHARMA_ADMIN'
          AND policy_name LIKE 'POL_VPD_%'
    ) LOOP
        BEGIN
            DBMS_RLS.DROP_POLICY(
                object_schema => r.object_owner,
                object_name   => r.object_name,
                policy_name   => r.policy_name
            );
            v_dropped_count := v_dropped_count + 1;
            DBMS_OUTPUT.PUT_LINE(' [DROP] Đã gỡ bỏ policy: ' || r.policy_name || ' trên bảng ' || r.object_name);
        EXCEPTION
            WHEN OTHERS THEN
                DBMS_OUTPUT.PUT_LINE(' [WARN] Không thể drop policy ' || r.policy_name || ': ' || SQLERRM);
        END;
    END LOOP;
    DBMS_OUTPUT.PUT_LINE(' [INFO] Tổng số policy cũ đã được dọn dẹp: ' || v_dropped_count);
END;
/

PROMPT =============================================================================
PROMPT BƯỚC 3.2: ĐĂNG KÝ CHÍNH SÁCH VPD CHO CÁC BẢNG CÓ CỘT BranchId
PROMPT =============================================================================

DECLARE
    TYPE t_table_array IS TABLE OF VARCHAR2(50);
    v_tables t_table_array := t_table_array(
        'INVENTORIES',
        'INVOICES',
        'GOODS_RECEIPTS',
        'INVENTORY_TRANSACTIONS',
        'CUSTOMERS',
        'PURCHASE_ORDERS',
        'RETURNS',
        'INVENTORY_AUDITS'
    );
    v_success_count NUMBER := 0;
BEGIN
    FOR i IN 1..v_tables.COUNT LOOP
        BEGIN
            DBMS_RLS.ADD_POLICY(
                object_schema   => 'PHARMA_ADMIN',
                object_name     => v_tables(i),
                policy_name     => 'POL_VPD_' || v_tables(i),
                function_schema => 'PHARMA_ADMIN',
                policy_function => 'PKG_PHARMA_SECURITY.FN_VPD_BRANCH_ISOLATION',
                statement_types => 'SELECT, INSERT, UPDATE, DELETE',
                update_check    => TRUE,
                policy_type     => DBMS_RLS.CONTEXT_SENSITIVE
            );
            v_success_count := v_success_count + 1;
            DBMS_OUTPUT.PUT_LINE(' [ADD] Thành công gắn policy POL_VPD_' || RPAD(v_tables(i), 25) || ' -> ' || 'PHARMA_ADMIN.' || v_tables(i));
        EXCEPTION
            WHEN OTHERS THEN
                DBMS_OUTPUT.PUT_LINE(' [ERROR] Lỗi khi gắn policy cho bảng ' || v_tables(i) || ': ' || SQLERRM);
        END;
    END LOOP;
    DBMS_OUTPUT.PUT_LINE(' [INFO] Đã cấu hình xong ' || v_success_count || ' chính sách VPD chuẩn Branch Isolation.');
END;
/

PROMPT =============================================================================
PROMPT BƯỚC 3.3: ĐĂNG KÝ CHÍNH SÁCH VPD CHO BẢNG ĐIỀU CHUYỂN KHO (STOCK_TRANSFERS)
PROMPT =============================================================================

BEGIN
    DBMS_RLS.ADD_POLICY(
        object_schema   => 'PHARMA_ADMIN',
        object_name     => 'STOCK_TRANSFERS',
        policy_name     => 'POL_VPD_STOCK_TRANSFERS',
        function_schema => 'PHARMA_ADMIN',
        policy_function => 'PKG_PHARMA_SECURITY.FN_VPD_TRANSFER_ISOLATION',
        statement_types => 'SELECT, INSERT, UPDATE, DELETE',
        update_check    => TRUE,
        policy_type     => DBMS_RLS.CONTEXT_SENSITIVE
    );
    DBMS_OUTPUT.PUT_LINE(' [ADD] Thành công gắn policy POL_VPD_STOCK_TRANSFERS trên bảng STOCK_TRANSFERS.');
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE(' [ERROR] Lỗi khi gắn policy cho STOCK_TRANSFERS: ' || SQLERRM);
END;
/

PROMPT =============================================================================
PROMPT BƯỚC 3.4: XÁC MINH TRẠNG THÁI CHÍNH SÁCH BẢO MẬT (ALL_POLICIES)
PROMPT =============================================================================

COLUMN object_name FORMAT A24 HEADING 'Bảng Mục Tiêu';
COLUMN policy_name FORMAT A26 HEADING 'Tên Policy';
COLUMN sel FORMAT A4 HEADING 'SEL';
COLUMN ins FORMAT A4 HEADING 'INS';
COLUMN upd FORMAT A4 HEADING 'UPD';
COLUMN del FORMAT A4 HEADING 'DEL';
COLUMN chk FORMAT A4 HEADING 'CHK';
COLUMN policy_type FORMAT A18 HEADING 'Loại Policy';
COLUMN enable FORMAT A6 HEADING 'Trạng Thái';

SELECT 
    object_name,
    policy_name,
    sel,
    ins,
    upd,
    del,
    chk,
    policy_type,
    enable
FROM all_policies
WHERE object_owner = 'PHARMA_ADMIN'
  AND policy_name LIKE 'POL_VPD_%'
ORDER BY object_name;

PROMPT =============================================================================
PROMPT HOÀN THÀNH SCRIPT 03: ĐÃ GẮN VÀ KÍCH HOẠT CHÍNH SÁCH VPD CHO CSDL
PROMPT =============================================================================

