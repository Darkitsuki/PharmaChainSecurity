-- Migration: V20261004_04__add_user_profile_and_indexes.sql
-- Description: Bổ sung FullName, PhoneNumber, CreatedDate cho USERS và tạo chỉ mục tăng tốc báo cáo doanh thu & cô lập chi nhánh

-- 1. Bổ sung thông tin hồ sơ cho người dùng
ALTER TABLE USERS ADD (
    FullName    VARCHAR2(255) DEFAULT 'Nhân viên' NOT NULL,
    PhoneNumber VARCHAR2(20),
    CreatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Chỉ mục hỗ trợ Rule 06 (Branch Isolation) & Rule 04 (RBAC) trên USERS
CREATE INDEX IDX_USERS_BRANCH ON USERS(BranchId);
CREATE INDEX IDX_USERS_ROLE ON USERS(RoleId);
CREATE INDEX IDX_USERS_ACTIVE ON USERS(IsActive);

-- 3. Chỉ mục tăng tốc báo cáo doanh thu theo chi nhánh và thời gian
CREATE INDEX IDX_INVOICES_BRANCH_DATE ON INVOICES(BranchId, CreatedDate);
CREATE INDEX IDX_INVOICE_ITEMS_DRUG ON INVOICE_ITEMS(DrugId);
