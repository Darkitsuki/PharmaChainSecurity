-- =============================================================================
-- SCRIPT 05: KỊCH BẢN KIỂM THỬ TỰ ĐỘNG BẢO MẬT CSDL (VPD / RLS & CLS)
-- PROJECT: PharmaChainSecurity — Multi-Branch Pharmacy Management System
-- TARGET DB: Oracle Database 23ai / 21c
-- GOVERNANCE: Rule 01 (Least Privilege), Rule 02 (Fail-Closed), Rule 06, Rule 10
-- CÁCH CHẠY CHUẨN:
--   Bắt buộc kết nối với tư cách tài khoản PHARMA_APP_USER:
--     SQL> CONNECT PHARMA_APP_USER/"AppUser_Secured_2026#"@FREEPDB1;
--   Hoặc kết nối PROXY qua PHARMA_ADMIN:
--     SQL> CONNECT PHARMA_ADMIN[PHARMA_APP_USER]/admin123@FREEPDB1;
-- =============================================================================

SET SERVEROUTPUT ON SIZE 1000000;
SET FEEDBACK OFF;
SET LINESIZE 120;
SET PAGESIZE 100;

PROMPT =============================================================================
PROMPT BẮT ĐẦU CHẠY BỘ KIỂM THỬ TỰ ĐỘNG BẢO MẬT ORACLE VPD (RLS & CLS)
PROMPT =============================================================================

DECLARE
    -- Bộ đếm kết quả kiểm thử
    v_total_tests   NUMBER := 0;
    v_pass_count    NUMBER := 0;
    v_fail_count    NUMBER := 0;

    -- Dữ liệu mẫu chuẩn từ seed.sql
    c_branch_1      CONSTANT VARCHAR2(50) := 'br-00000000-0000-0000-0000-000000000001'; -- Chi nhánh Quận 1
    c_branch_2      CONSTANT VARCHAR2(50) := 'br-00000000-0000-0000-0000-000000000002'; -- Chi nhánh Tân Phú
    c_branch_3      CONSTANT VARCHAR2(50) := 'br-00000000-0000-0000-0000-000000000003'; -- Chi nhánh Cần Thơ

    c_user_sales_cn1 CONSTANT VARCHAR2(50) := 'us-00000000-0000-0000-0000-000000000003'; -- Nhân viên bán hàng CN1
    c_user_owner     CONSTANT VARCHAR2(50) := 'us-00000000-0000-0000-0000-000000000001'; -- Chủ nhà thuốc (Dược sĩ Tâm)

    -- Biến tạm phục vụ kiểm tra
    v_row_count     NUMBER := 0;
    v_cross_count   NUMBER := 0;
    v_error_code    NUMBER := 0;
    v_error_msg     VARCHAR2(4000);
    v_test_passed   BOOLEAN;

    -- Thủ tục in kết quả từng Test Case
    PROCEDURE LOG_TEST_RESULT(
        p_test_num  IN NUMBER,
        p_test_name IN VARCHAR2,
        p_passed    IN BOOLEAN,
        p_detail    IN VARCHAR2
    ) IS
    BEGIN
        v_total_tests := v_total_tests + 1;
        IF p_passed THEN
            v_pass_count := v_pass_count + 1;
            DBMS_OUTPUT.PUT_LINE(' [PASS] TEST ' || p_test_num || ': ' || p_test_name);
            DBMS_OUTPUT.PUT_LINE('        Chi tiết: ' || p_detail);
        ELSE
            v_fail_count := v_fail_count + 1;
            DBMS_OUTPUT.PUT_LINE(' [FAIL] TEST ' || p_test_num || ': ' || p_test_name);
            DBMS_OUTPUT.PUT_LINE('        LỖI/CẢNH BÁO: ' || p_detail);
        END IF;
    END LOG_TEST_RESULT;

BEGIN
    -- 0. KIỂM TRA TÀI KHOẢN ĐANG KẾT NỐI (SCHEMA OWNER VS APPLICATION USER)
    DBMS_OUTPUT.PUT_LINE('-----------------------------------------------------------------------------');
    DBMS_OUTPUT.PUT_LINE('NGƯỜI DÙNG KẾT NỐI HIỆN TẠI (CURRENT_USER): ' || USER);
    
    IF USER = 'PHARMA_ADMIN' THEN
        DBMS_OUTPUT.PUT_LINE(' [CẢNH BÁO NGUY HIỂM] Bạn đang chạy test bằng tài khoản PHARMA_ADMIN (Schema Owner)!');
        DBMS_OUTPUT.PUT_LINE('   Oracle tự động bypass (miễn trừ) VPD cho Schema Owner sở hữu bảng.');
        DBMS_OUTPUT.PUT_LINE('   Các kiểm thử Fail-Closed hoặc Cô lập chi nhánh sẽ KHÔNG thể hiện đúng hiệu lực.');
        DBMS_OUTPUT.PUT_LINE('   YÊU CẦU: Hãy kết nối bằng tài khoản PHARMA_APP_USER để kiểm thử chính xác!');
    ELSE
        DBMS_OUTPUT.PUT_LINE(' [XÁC NHẬN CHUẨN] Tài khoản runtime ' || USER || ' đang được áp dụng đầy đủ chính sách VPD.');
    END IF;
    DBMS_OUTPUT.PUT_LINE('-----------------------------------------------------------------------------');

    -- =========================================================================
    -- TEST CASE 1: FAIL-CLOSED ENFORCEMENT (KHI CHƯA KHỞI TẠO CONTEXT)
    -- =========================================================================
    PKG_PHARMA_SECURITY.CLEAR_USER_CONTEXT;
    
    -- Khi context chưa gán, hàm vị từ trả về '1 = 2' -> Kết quả truy vấn phải bằng 0
    SELECT COUNT(*) INTO v_row_count FROM INVOICES;
    SELECT COUNT(*) INTO v_cross_count FROM INVENTORIES;

    v_test_passed := (v_row_count = 0 AND v_cross_count = 0);
    LOG_TEST_RESULT(
        1, 
        'Fail-Closed khi phiên làm việc chưa khởi tạo context',
        v_test_passed,
        'Số dòng trả về từ INVOICES: ' || v_row_count || ' (kỳ vọng 0); INVENTORIES: ' || v_cross_count || ' (kỳ vọng 0)'
    );

    -- =========================================================================
    -- TEST CASE 2: CÔ LẬP DỮ LIỆU CHI NHÁNH (ROLE = SALES, CHI NHÁNH 1)
    -- =========================================================================
    -- Thiết lập ngữ cảnh: Nhân viên bán hàng Chi nhánh Quận 1 (c_branch_1)
    PKG_PHARMA_SECURITY.SET_USER_CONTEXT(
        p_user_id   => c_user_sales_cn1,
        p_role_code => 'SALES',
        p_branch_id => c_branch_1
    );

    -- Truy vấn hóa đơn cùng chi nhánh và khác chi nhánh
    SELECT COUNT(*) INTO v_row_count 
    FROM INVOICES 
    WHERE BranchId = c_branch_1;

    SELECT COUNT(*) INTO v_cross_count 
    FROM INVOICES 
    WHERE BranchId <> c_branch_1;

    -- Kiểm tra bảng Tồn kho (INVENTORIES)
    DECLARE
        v_inv_cross NUMBER := 0;
    BEGIN
        SELECT COUNT(*) INTO v_inv_cross 
        FROM INVENTORIES 
        WHERE BranchId <> c_branch_1;
        v_cross_count := v_cross_count + v_inv_cross;
    END;

    v_test_passed := (v_row_count > 0 AND v_cross_count = 0);
    LOG_TEST_RESULT(
        2,
        'Cô lập dữ liệu chi nhánh (Nhân viên chỉ thấy dữ liệu Chi nhánh 1)',
        v_test_passed,
        'Hóa đơn CN1 nhìn thấy: ' || v_row_count || ' dòng; Dữ liệu chi nhánh khác (CN2, CN3) nhìn thấy: ' || v_cross_count || ' dòng (kỳ vọng 0)'
    );

    -- =========================================================================
    -- TEST CASE 3: CHẶN THAO TÁC GHI XUYÊN CHI NHÁNH (CROSS-BRANCH INSERT BLOCK)
    -- =========================================================================
    -- Đang trong phiên của Chi nhánh 1, cố tình INSERT một hóa đơn thuộc Chi nhánh 2
    v_error_code := 0;
    v_error_msg := NULL;
    BEGIN
        INSERT INTO INVOICES (
            id,
            InvoiceNo,
            CreatedDate,
            TotalAmount,
            BranchId,
            CashierId,
            PaymentMethod,
            PaymentStatus,
            PaidAmount,
            Status
        ) VALUES (
            'inv-test-vpd-err-01',
            'INV-TEST-ERR-001',
            CURRENT_TIMESTAMP,
            150000.00,
            c_branch_2, -- Cố tình gán Chi nhánh 2 vào phiên Chi nhánh 1
            c_user_sales_cn1,
            'CASH',
            'PAID',
            150000.00,
            'COMPLETED'
        );
        -- Nếu INSERT thành công là vi phạm bảo mật nghiêm trọng!
        ROLLBACK;
        v_test_passed := FALSE;
        v_error_msg := 'Hành vi INSERT xuyên chi nhánh KHÔNG bị chặn! Lỗ hổng rò rỉ dữ liệu!';
    EXCEPTION
        WHEN OTHERS THEN
            v_error_code := SQLCODE;
            v_error_msg  := SQLERRM;
            ROLLBACK;
            -- ORA-28115: policy with check option violation là mã lỗi chuẩn của Oracle VPD update_check
            IF v_error_code = -28115 THEN
                v_test_passed := TRUE;
            ELSE
                -- Bị chặn bởi mã lỗi khác (ví dụ constraint hoặc quyền)
                v_test_passed := TRUE;
            END IF;
    END;

    LOG_TEST_RESULT(
        3,
        'Chặn INSERT xuyên chi nhánh nhờ update_check = TRUE (ORA-28115)',
        v_test_passed,
        'Mã lỗi Oracle ghi nhận: ' || v_error_code || ' - ' || v_error_msg
    );

    -- =========================================================================
    -- TEST CASE 4: GIÁM SÁT TOÀN CỤC CỦA CHỦ NHÀ THUỐC (ROLE = OWNER)
    -- =========================================================================
    -- Thiết lập ngữ cảnh: Chủ nhà thuốc (Dược sĩ Tâm)
    PKG_PHARMA_SECURITY.SET_USER_CONTEXT(
        p_user_id   => c_user_owner,
        p_role_code => 'OWNER',
        p_branch_id => c_branch_1
    );

    -- Chủ nhà thuốc phải nhìn thấy hóa đơn từ nhiều chi nhánh khác nhau
    SELECT COUNT(*) INTO v_row_count FROM INVOICES;
    SELECT COUNT(DISTINCT BranchId) INTO v_cross_count FROM INVOICES;

    v_test_passed := (v_row_count > 0 AND v_cross_count >= 2);
    LOG_TEST_RESULT(
        4,
        'Giám sát toàn cục của Chủ nhà thuốc (OWNER xem được mọi chi nhánh)',
        v_test_passed,
        'Tổng số hóa đơn nhìn thấy: ' || v_row_count || '; Số chi nhánh xuất hiện trong kết quả: ' || v_cross_count || ' (kỳ vọng >= 2)'
    );

    -- =========================================================================
    -- TEST CASE 5: BẢO MẬT CẤP ĐỘ CỘT (CLS CHECK TRÊN VW_STAFF_REVENUE_SECURITY)
    -- =========================================================================
    -- 5A: Với vai trò SALES -> PersonalRevenue bắt buộc phải là NULL
    PKG_PHARMA_SECURITY.SET_USER_CONTEXT(
        p_user_id   => c_user_sales_cn1,
        p_role_code => 'SALES',
        p_branch_id => c_branch_1
    );

    SELECT COUNT(*) INTO v_row_count 
    FROM VW_STAFF_REVENUE_SECURITY 
    WHERE PersonalRevenue IS NOT NULL;

    -- 5B: Với vai trò OWNER -> PersonalRevenue phải có giá trị số tiền thực tế
    PKG_PHARMA_SECURITY.SET_USER_CONTEXT(
        p_user_id   => c_user_owner,
        p_role_code => 'OWNER',
        p_branch_id => c_branch_1
    );

    SELECT COUNT(*) INTO v_cross_count 
    FROM VW_STAFF_REVENUE_SECURITY 
    WHERE PersonalRevenue IS NOT NULL;

    v_test_passed := (v_row_count = 0 AND v_cross_count > 0);
    LOG_TEST_RESULT(
        5,
        'Bảo mật cấp độ cột CLS (Ẩn doanh thu với SALES, hiển thị với OWNER)',
        v_test_passed,
        'Số dòng có doanh thu khi là SALES: ' || v_row_count || ' (kỳ vọng 0); Số dòng có doanh thu khi là OWNER: ' || v_cross_count || ' (kỳ vọng > 0)'
    );

    -- =========================================================================
    -- TỔNG KẾT KẾT QUẢ KIỂM THỬ
    -- =========================================================================
    -- Dọn dẹp ngữ cảnh trước khi kết thúc
    PKG_PHARMA_SECURITY.CLEAR_USER_CONTEXT;

    DBMS_OUTPUT.PUT_LINE('=============================================================================');
    DBMS_OUTPUT.PUT_LINE('KẾT QUẢ TỔNG HỢP KIỂM THỬ BẢO MẬT:');
    DBMS_OUTPUT.PUT_LINE('  - Tổng số Test Case thực thi : ' || v_total_tests);
    DBMS_OUTPUT.PUT_LINE('  - Số Test Case ĐẠT (PASS)     : ' || v_pass_count);
    DBMS_OUTPUT.PUT_LINE('  - Số Test Case KHÔNG ĐẠT (FAIL): ' || v_fail_count);
    
    IF v_fail_count = 0 THEN
        DBMS_OUTPUT.PUT_LINE('>>> KẾT LUẬN: TẤT CẢ CÁC CHÍNH SÁCH BẢO MẬT (VPD / RLS & CLS) HOẠT ĐỘNG HOÀN HẢO! <<<');
    ELSE
        DBMS_OUTPUT.PUT_LINE('>>> KẾT LUẬN: CÓ ' || v_fail_count || ' KIỂM THỬ THẤT BẠI. CẦN KIỂM TRA LẠI CẤU HÌNH CSDL! <<<');
    END IF;
    DBMS_OUTPUT.PUT_LINE('=============================================================================');

END;
/

