-- ============================================================================
-- PROJECT: PharmaChainSecurity
-- FILE: 03_Test_Security_Policies.sql
-- MÔ TẢ: Kịch bản kiểm thử thực nghiệm VPD (Cô lập chi nhánh) và CLS (Ẩn doanh thu)
-- ============================================================================

-- 1. Giả lập phiên đăng nhập của Nhân viên bán hàng tại Chi nhánh Quận 1
EXEC PKG_PHARMA_SECURITY.SET_USER_CONTEXT('us-00000000-0000-0000-0000-000000000001', 'NV_BAN_HANG', 'br-00000000-0000-0000-0000-000000000001');

-- Kiểm tra: Chỉ trả về các dòng tồn kho và hóa đơn của Chi nhánh Quận 1 (...0001)
SELECT BranchId, DrugId, BatchId, Quantity FROM INVENTORIES;
SELECT InvoiceNo, BranchId, TotalAmount FROM INVOICES;

-- Kiểm tra CLS: Thấy danh sách nhân viên nhưng cột PersonalRevenue bị ẩn (NULL)
SELECT Username, FullName, PhoneNumber, RoleName, PersonalRevenue FROM VW_STAFF_REVENUE_SECURITY;


-- 2. Giả lập phiên đăng nhập của Chủ nhà thuốc
EXEC PKG_PHARMA_SECURITY.SET_USER_CONTEXT('us-00000000-0000-0000-0000-000000000003', 'CHU_NHA_THUOC', 'br-00000000-0000-0000-0000-000000000001');

-- Kiểm tra: Thấy toàn bộ tồn kho của cả Chi nhánh Quận 1 (...0001) và Tân Phú (...0002)
SELECT BranchId, DrugId, BatchId, Quantity FROM INVENTORIES;

-- Kiểm tra CLS: Chủ nhà thuốc nhìn thấy rõ cột PersonalRevenue của từng nhân viên
SELECT Username, FullName, PhoneNumber, RoleName, PersonalRevenue FROM VW_STAFF_REVENUE_SECURITY;