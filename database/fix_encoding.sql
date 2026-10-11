ALTER SESSION SET CONTAINER = FREEPDB1;

-- 1. Cập nhật bảng DANH MỤC THUỐC (DRUGS)
UPDATE PHARMA_ADMIN.DRUGS SET Unit = 'Hộp' WHERE DrugCode IN ('THUOC001', 'THUOC002', 'THUOC003');
UPDATE PHARMA_ADMIN.DRUGS SET Unit = 'Chai', ActiveIngredient = 'Thường xuân khô' WHERE DrugCode = 'THUOC004';

-- 2. Cập nhật bảng VAI TRÒ (ROLES)
UPDATE PHARMA_ADMIN.ROLES SET RoleName = 'Chủ nhà thuốc' WHERE id = 'rl-00000000-0000-0000-0000-000000000001';
UPDATE PHARMA_ADMIN.ROLES SET RoleName = 'Nhân viên kho' WHERE id = 'rl-00000000-0000-0000-0000-000000000002';
UPDATE PHARMA_ADMIN.ROLES SET RoleName = 'Nhân viên bán hàng' WHERE id = 'rl-00000000-0000-0000-0000-000000000003';

-- 3. Cập nhật bảng CHI NHÁNH (BRANCHES)
UPDATE PHARMA_ADMIN.BRANCHES SET BranchName = 'Nhà thuốc Long Châu - Chi nhánh Quận 1', Address = '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM' WHERE id = 'br-00000000-0000-0000-0000-000000000001';
UPDATE PHARMA_ADMIN.BRANCHES SET BranchName = 'Nhà thuốc Long Châu - Chi nhánh Tân Phú', Address = '140 Lê Trọng Tấn, Phường Tây Thạnh, Quận Tân Phú, TP.HCM' WHERE id = 'br-00000000-0000-0000-0000-000000000002';

-- 4. Cập nhật bảng NGƯỜI DÙNG (USERS)
UPDATE PHARMA_ADMIN.USERS SET FullName = 'Chủ Nhà Thuốc' WHERE id = 'us-00000000-0000-0000-0000-000000000001';
UPDATE PHARMA_ADMIN.USERS SET FullName = 'Nhân Viên Kho CN1' WHERE id = 'us-00000000-0000-0000-0000-000000000002';
UPDATE PHARMA_ADMIN.USERS SET FullName = 'Dược Sĩ Bán Hàng CN1' WHERE id = 'us-00000000-0000-0000-0000-000000000003';
UPDATE PHARMA_ADMIN.USERS SET FullName = 'Dược Sĩ Bán Hàng CN2' WHERE id = 'us-00000000-0000-0000-0000-000000000004';

-- 5. Cập nhật bảng NHÀ CUNG CẤP (SUPPLIERS)
UPDATE PHARMA_ADMIN.SUPPLIERS SET SupplierName = 'Công ty Cổ phần Dược phẩm Hậu Giang (DHG Pharma)', ContactPerson = 'Nguyễn Văn Hậu', Address = '288 Bis Nguyễn Văn Cừ, An Hòa, Ninh Kiều, Cần Thơ' WHERE id = 'sup-00000000-0000-0000-0000-000000000001';
UPDATE PHARMA_ADMIN.SUPPLIERS SET SupplierName = 'Công ty Cổ phần Traphaco', ContactPerson = 'Trần Thị Thu Trang', Address = '75 Yên Ninh, Ba Đình, Hà Nội' WHERE id = 'sup-00000000-0000-0000-0000-000000000002';
UPDATE PHARMA_ADMIN.SUPPLIERS SET SupplierName = 'Công ty TNHH Sanofi-Aventis Việt Nam', ContactPerson = 'Lê Hoàng Nam', Address = 'Số 10 Hàm Nghi, Bến Nghé, Quận 1, TP.HCM' WHERE id = 'sup-00000000-0000-0000-0000-000000000003';

-- 6. Cập nhật bảng KHÁCH HÀNG (CUSTOMERS)
UPDATE PHARMA_ADMIN.CUSTOMERS SET FullName = 'Nguyễn Thị Mai', Address = '123 Lê Lợi, Quận 1, TP.HCM' WHERE id = 'cus-00000000-0000-0000-0000-000000000001';
UPDATE PHARMA_ADMIN.CUSTOMERS SET FullName = 'Trần Văn Hùng', Address = '456 Hai Bà Trưng, Quận 3, TP.HCM' WHERE id = 'cus-00000000-0000-0000-0000-000000000002';
UPDATE PHARMA_ADMIN.CUSTOMERS SET FullName = 'Lê Minh Tuấn', Address = '789 Nguyễn Huệ, Quận Ninh Kiều, Cần Thơ' WHERE id = 'cus-00000000-0000-0000-0000-000000000003';

COMMIT;
EXIT;
