-- =============================================================================
-- SCRIPT 02: APPLICATION CONTEXT VÀ PACKAGE QUẢN LÝ PHIÊN (PKG_PHARMA_SECURITY)
-- PROJECT: PharmaChainSecurity — Multi-Branch Pharmacy Management System
-- TARGET DB: Oracle Database 23ai / 21c
-- GOVERNANCE: Rule 02 (Fail-Closed), Rule 04 (Performance & Dynamic Predicate), Rule 06
-- MÔ TẢ:
--   1. Khởi tạo Application Context duy nhất PHARMA_CTX gắn với PKG_PHARMA_SECURITY.
--   2. Thủ tục SET_USER_CONTEXT: nhận thông tin phiên từ JWT của Backend .NET 8.
--   3. Thủ tục CLEAR_USER_CONTEXT: dọn dẹp sạch context khi trả kết nối về pool.
--   4. Hàm vị từ FN_VPD_BRANCH_ISOLATION: cô lập dữ liệu theo BranchId chuẩn Fail-Closed.
--   5. Hàm vị từ FN_VPD_TRANSFER_ISOLATION: cô lập điều chuyển kho (From/To Branch).
-- =============================================================================

SET FEEDBACK ON;
SET SERVEROUTPUT ON SIZE 1000000;

PROMPT =============================================================================
PROMPT BƯỚC 2.1: KHỞI TẠO APPLICATION CONTEXT PHARMA_CTX (IDEMPOTENT)
PROMPT =============================================================================

-- Khởi tạo hoặc cập nhật Application Context gắn kết an toàn với Package bảo mật
CREATE OR REPLACE CONTEXT PHARMA_CTX USING PHARMA_ADMIN.PKG_PHARMA_SECURITY;
/

PROMPT =============================================================================
PROMPT BƯỚC 2.2: PACKAGE SPECIFICATION — PHARMA_ADMIN.PKG_PHARMA_SECURITY
PROMPT =============================================================================

CREATE OR REPLACE PACKAGE PHARMA_ADMIN.PKG_PHARMA_SECURITY AS
    /**
     * Thiết lập thông tin ngữ cảnh người dùng hiện tại từ Backend API (.NET 8).
     * @param p_user_id   Mã định danh người dùng (Id trong bảng USERS)
     * @param p_role_code Mã vai trò người dùng (OWNER, SALES, WAREHOUSE, ...)
     * @param p_branch_id Mã chi nhánh làm việc (Id trong bảng BRANCHES)
     */
    PROCEDURE SET_USER_CONTEXT(
        p_user_id   IN VARCHAR2,
        p_role_code IN VARCHAR2,
        p_branch_id IN VARCHAR2
    );

    /**
     * Dọn dẹp toàn bộ context và Client Identifier khi kết nối được trả về Connection Pool.
     * Ngăn ngừa hoàn toàn rò rỉ trạng thái chi nhánh giữa các request (Rule 06, Section 13).
     */
    PROCEDURE CLEAR_USER_CONTEXT;

    /**
     * Hàm sinh vị từ VPD (Row-Level Security) cho các bảng nghiệp vụ có cột BranchId.
     * Quy tắc chuẩn Fail-Closed:
     *   - Vai trò OWNER/CHU_NHA_THUOC/ADMIN: trả về '1 = 1' (toàn quyền xem/thao tác mọi chi nhánh).
     *   - Chưa set context hoặc BranchId rỗng: trả về '1 = 2' (chặn tuyệt đối, trả về 0 dòng).
     *   - Vai trò thông thường (SALES, WAREHOUSE): 'BranchId = SYS_CONTEXT(''PHARMA_CTX'', ''BRANCH_ID'')'.
     */
    FUNCTION FN_VPD_BRANCH_ISOLATION(
        p_schema IN VARCHAR2,
        p_object IN VARCHAR2
    ) RETURN VARCHAR2;

    /**
     * Hàm sinh vị từ VPD riêng cho bảng điều chuyển kho liên chi nhánh (STOCK_TRANSFERS).
     * Cho phép truy cập nếu chi nhánh hiện tại là Chi nhánh Gửi (FromBranchId) HOẶC Chi nhánh Nhận (ToBranchId).
     */
    FUNCTION FN_VPD_TRANSFER_ISOLATION(
        p_schema IN VARCHAR2,
        p_object IN VARCHAR2
    ) RETURN VARCHAR2;

    -- Các hàm tiện ích hỗ trợ đọc context phục vụ Audit Log và Kiểm thử
    FUNCTION GET_USER_ID   RETURN VARCHAR2;
    FUNCTION GET_ROLE_CODE RETURN VARCHAR2;
    FUNCTION GET_BRANCH_ID RETURN VARCHAR2;

END PKG_PHARMA_SECURITY;
/

PROMPT =============================================================================
PROMPT BƯỚC 2.3: PACKAGE BODY — PHARMA_ADMIN.PKG_PHARMA_SECURITY
PROMPT =============================================================================

CREATE OR REPLACE PACKAGE BODY PHARMA_ADMIN.PKG_PHARMA_SECURITY AS

    PROCEDURE SET_USER_CONTEXT(
        p_user_id   IN VARCHAR2,
        p_role_code IN VARCHAR2,
        p_branch_id IN VARCHAR2
    ) IS
        v_clean_user_id   VARCHAR2(50);
        v_clean_role_code VARCHAR2(100);
        v_clean_branch_id VARCHAR2(50);
    BEGIN
        v_clean_user_id   := TRIM(p_user_id);
        v_clean_role_code := UPPER(TRIM(p_role_code));
        v_clean_branch_id := TRIM(p_branch_id);

        -- Gán các thuộc tính bảo mật vào namespace PHARMA_CTX
        DBMS_SESSION.SET_CONTEXT('PHARMA_CTX', 'USER_ID', v_clean_user_id);
        DBMS_SESSION.SET_CONTEXT('PHARMA_CTX', 'ROLE_CODE', v_clean_role_code);
        DBMS_SESSION.SET_CONTEXT('PHARMA_CTX', 'BRANCH_ID', v_clean_branch_id);

        -- Thiết lập CLIENT_IDENTIFIER chuẩn Oracle để phục vụ giám sát phiên (V$SESSION / Auditing)
        IF v_clean_branch_id IS NOT NULL THEN
            DBMS_SESSION.SET_IDENTIFIER(v_clean_branch_id);
        ELSE
            DBMS_SESSION.CLEAR_IDENTIFIER;
        END IF;
    END SET_USER_CONTEXT;

    PROCEDURE CLEAR_USER_CONTEXT IS
    BEGIN
        -- Xóa sạch toàn bộ biến ngữ cảnh trong namespace PHARMA_CTX
        DBMS_SESSION.CLEAR_ALL_CONTEXT('PHARMA_CTX');
        -- Dọn dẹp CLIENT_IDENTIFIER chuẩn
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

        -- 1. Quản trị viên / Chủ nhà thuốc (Global Oversight): Cho phép truy cập dữ liệu tất cả chi nhánh
        IF UPPER(TRIM(v_role_code)) IN ('OWNER', 'CHU_NHA_THUOC', 'ADMIN') THEN
            RETURN '1 = 1';
        END IF;

        -- 2. Ngăn chặn Fail-Open (Rule 02 & Rule 06):
        -- Nếu chưa khởi tạo context hoặc BranchId bị NULL -> Chặn ngay lập tức bằng '1 = 2'
        IF v_branch_id IS NULL OR TRIM(v_branch_id) IS NULL THEN
            RETURN '1 = 2';
        END IF;

        -- 3. Dynamic Predicate chuẩn hiệu năng (Rule 04):
        -- Sử dụng trực tiếp hàm SYS_CONTEXT trong chuỗi điều kiện để Oracle Shared Pool
        -- tái sử dụng Cursor Execution Plan (tránh hard parsing và rủi ro SQL injection).
        RETURN 'BranchId = SYS_CONTEXT(''PHARMA_CTX'', ''BRANCH_ID'')';

    EXCEPTION
        WHEN OTHERS THEN
            -- Phòng thủ chiều sâu (Defense-in-Depth): Bất kỳ lỗi bất thường nào đều Fail-Closed
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

        -- 1. Quản trị viên / Chủ nhà thuốc: Toàn quyền xem và duyệt phiếu chuyển kho
        IF UPPER(TRIM(v_role_code)) IN ('OWNER', 'CHU_NHA_THUOC', 'ADMIN') THEN
            RETURN '1 = 1';
        END IF;

        -- 2. Fail-Closed nếu không có thông tin chi nhánh
        IF v_branch_id IS NULL OR TRIM(v_branch_id) IS NULL THEN
            RETURN '1 = 2';
        END IF;

        -- 3. Cho phép truy cập nếu phiên hiện tại là Chi nhánh Gửi (FromBranchId) HOẶC Chi nhánh Nhận (ToBranchId)
        RETURN '(FromBranchId = SYS_CONTEXT(''PHARMA_CTX'', ''BRANCH_ID'') OR ToBranchId = SYS_CONTEXT(''PHARMA_CTX'', ''BRANCH_ID''))';

    EXCEPTION
        WHEN OTHERS THEN
            RETURN '1 = 2';
    END FN_VPD_TRANSFER_ISOLATION;

    FUNCTION GET_USER_ID RETURN VARCHAR2 IS
    BEGIN
        RETURN SYS_CONTEXT('PHARMA_CTX', 'USER_ID');
    END GET_USER_ID;

    FUNCTION GET_ROLE_CODE RETURN VARCHAR2 IS
    BEGIN
        RETURN SYS_CONTEXT('PHARMA_CTX', 'ROLE_CODE');
    END GET_ROLE_CODE;

    FUNCTION GET_BRANCH_ID RETURN VARCHAR2 IS
    BEGIN
        RETURN SYS_CONTEXT('PHARMA_CTX', 'BRANCH_ID');
    END GET_BRANCH_ID;

END PKG_PHARMA_SECURITY;
/

PROMPT =============================================================================
PROMPT HOÀN THÀNH SCRIPT 02: TẠO CONTEXT VÀ PACKAGE BẢO MẬT PKG_PHARMA_SECURITY
PROMPT =============================================================================

