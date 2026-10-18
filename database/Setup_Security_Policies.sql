-- ============================================================================
-- PROJECT: PharmaChainSecurity
-- FILE: 02_Setup_Security_Policies.sql
-- MÔ TẢ: Cài đặt Application Context, VPD (Row-Level Security) cô lập chi nhánh
--        và Bảo mật cấp độ cột (Column-Level Security) ẩn doanh thu cá nhân
-- ============================================================================

-- ----------------------------------------------------------------------------
-- BƯỚC 1: KHỞI TẠO APPLICATION CONTEXT LƯU TRỮ PHIÊN LÀM VIỆC TỪ JWT
-- ----------------------------------------------------------------------------
CREATE OR REPLACE CONTEXT PHARMA_CTX USING PKG_PHARMA_SECURITY;
/

-- ----------------------------------------------------------------------------
-- BƯỚC 2: XÂY DỰNG PACKAGE QUẢN LÝ NGỮ CẢNH VÀ HÀM CHÍNH SÁCH VPD
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PACKAGE PKG_PHARMA_SECURITY AS
    -- Thủ tục nhận thông tin từ Backend API (.NET 8) truyền xuống
    PROCEDURE SET_USER_CONTEXT(
        p_user_id   IN VARCHAR2,
        p_role_code IN VARCHAR2,
        p_branch_id IN VARCHAR2
    );

    -- Thủ tục xóa ngữ cảnh khi trả kết nối về Connection Pool
    PROCEDURE CLEAR_USER_CONTEXT;

    -- Hàm sinh điều kiện lọc cấp độ dòng (VPD Predicate Function)
    FUNCTION FN_VPD_BRANCH_ISOLATION(
        p_schema IN VARCHAR2,
        p_object IN VARCHAR2
    ) RETURN VARCHAR2;
END PKG_PHARMA_SECURITY;
/

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

        -- Chủ nhà thuốc được toàn quyền xem và thao tác trên tất cả chi nhánh
        IF v_role_code IN ('CHU_NHA_THUOC', 'Chủ nhà thuốc', 'ADMIN') THEN
            RETURN '1 = 1';
        END IF;

        -- Nếu kết nối không có ngữ cảnh chi nhánh hợp lệ -> Chặn truy xuất
        IF v_branch_id IS NULL THEN
            RETURN '1 = 0';
        END IF;

        -- Cô lập dữ liệu: Nhân viên thuộc chi nhánh nào chỉ thấy dữ liệu chi nhánh đó
        RETURN 'BranchId = ''' || v_branch_id || '''';
    END FN_VPD_BRANCH_ISOLATION;

END PKG_PHARMA_SECURITY;
/

-- ----------------------------------------------------------------------------
-- BƯỚC 3: GẮN CHÍNH SÁCH VPD (RLS) VÀO 5 BẢNG NGHIỆP VỤ TRỌNG TÂM
-- ----------------------------------------------------------------------------
BEGIN
    -- Xóa policy cũ nếu đã tồn tại (để script có thể chạy lại nhiều lần không lỗi)
    FOR r IN (
        SELECT object_name, policy_name 
        FROM user_policies 
        WHERE policy_name LIKE 'POL_VPD_%'
    ) LOOP
        DBMS_RLS.DROP_POLICY(USER, r.object_name, r.policy_name);
    END LOOP;

    -- 1. Bảng Tồn kho chi nhánh (INVENTORIES)
    DBMS_RLS.ADD_POLICY(
        object_schema   => USER,
        object_name     => 'INVENTORIES',
        policy_name     => 'POL_VPD_INVENTORIES',
        function_schema => USER,
        policy_function => 'PKG_PHARMA_SECURITY.FN_VPD_BRANCH_ISOLATION',
        statement_types => 'SELECT, INSERT, UPDATE, DELETE',
        update_check    => TRUE
    );

    -- 2. Bảng Hóa đơn bán hàng (INVOICES)
    DBMS_RLS.ADD_POLICY(
        object_schema   => USER,
        object_name     => 'INVOICES',
        policy_name     => 'POL_VPD_INVOICES',
        function_schema => USER,
        policy_function => 'PKG_PHARMA_SECURITY.FN_VPD_BRANCH_ISOLATION',
        statement_types => 'SELECT, INSERT, UPDATE, DELETE',
        update_check    => TRUE
    );

    -- 3. Bảng Phiếu nhập kho (GOODS_RECEIPTS)
    DBMS_RLS.ADD_POLICY(
        object_schema   => USER,
        object_name     => 'GOODS_RECEIPTS',
        policy_name     => 'POL_VPD_GOODS_RECEIPTS',
        function_schema => USER,
        policy_function => 'PKG_PHARMA_SECURITY.FN_VPD_BRANCH_ISOLATION',
        statement_types => 'SELECT, INSERT, UPDATE, DELETE',
        update_check    => TRUE
    );

    -- 4. Bảng Lịch sử biến động tồn kho (INVENTORY_TRANSACTIONS)
    DBMS_RLS.ADD_POLICY(
        object_schema   => USER,
        object_name     => 'INVENTORY_TRANSACTIONS',
        policy_name     => 'POL_VPD_INV_TRANSACTIONS',
        function_schema => USER,
        policy_function => 'PKG_PHARMA_SECURITY.FN_VPD_BRANCH_ISOLATION',
        statement_types => 'SELECT, INSERT, UPDATE, DELETE',
        update_check    => TRUE
    );

    -- 5. Bảng Khách hàng (CUSTOMERS)
    DBMS_RLS.ADD_POLICY(
        object_schema   => USER,
        object_name     => 'CUSTOMERS',
        policy_name     => 'POL_VPD_CUSTOMERS',
        function_schema => USER,
        policy_function => 'PKG_PHARMA_SECURITY.FN_VPD_BRANCH_ISOLATION',
        statement_types => 'SELECT, INSERT, UPDATE, DELETE',
        update_check    => TRUE
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
    -- Nếu là Chủ nhà thuốc thì hiển thị tổng doanh thu thực tế, ngược lại ẩn thành NULL
    CASE 
        WHEN SYS_CONTEXT('PHARMA_CTX', 'ROLE_CODE') IN ('CHU_NHA_THUOC', 'Chủ nhà thuốc', 'ADMIN') 
        THEN NVL(SUM(i.TotalAmount), 0)
        ELSE NULL 
    END AS PersonalRevenue
FROM USERS u
JOIN ROLES r ON u.RoleId = r.Id
LEFT JOIN INVOICES i ON u.Id = i.CashierId
GROUP BY u.Id, u.Username, u.FullName, u.PhoneNumber, u.BranchId, r.RoleName;
/