-- =============================================================================
-- MIGRATION: V20261004_01__create_suppliers_and_goods_receipts.sql
-- DESCRIPTION: Thêm bảng Nhà cung cấp (SUPPLIERS), Phiếu nhập kho (GOODS_RECEIPTS)
--              và Chi tiết phiếu nhập (GOODS_RECEIPT_ITEMS) cho phân hệ Nhập kho
-- =============================================================================

-- 1. BẢNG NHÀ CUNG CẤP (SUPPLIERS)
CREATE TABLE SUPPLIERS (
    id            VARCHAR2(50)     NOT NULL,
    SupplierCode  VARCHAR2(50)     NOT NULL,
    SupplierName  VARCHAR2(255)    NOT NULL,
    ContactPerson VARCHAR2(100),
    PhoneNumber   VARCHAR2(20),
    Email         VARCHAR2(100),
    Address       VARCHAR2(500),
    TaxCode       VARCHAR2(50),
    IsActive      NUMBER(1)        DEFAULT 1 NOT NULL CHECK (IsActive IN (0, 1)),
    CreatedDate   TIMESTAMP        DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT PK_SUPPLIERS PRIMARY KEY (id),
    CONSTRAINT UQ_SUPPLIERS_CODE UNIQUE (SupplierCode)
);

-- 2. BẢNG PHIẾU NHẬP KHO (GOODS_RECEIPTS)
CREATE TABLE GOODS_RECEIPTS (
    id                VARCHAR2(50)     NOT NULL,
    ReceiptNo         VARCHAR2(50)     NOT NULL,
    BranchId          VARCHAR2(50)     NOT NULL,
    SupplierId        VARCHAR2(50)     NOT NULL,
    WarehouseStaffId  VARCHAR2(50)     NOT NULL,
    TotalAmount       NUMBER(15, 2)    DEFAULT 0.00 NOT NULL CHECK (TotalAmount >= 0),
    Note              VARCHAR2(500),
    Status            VARCHAR2(50)     DEFAULT 'COMPLETED' NOT NULL CHECK (Status IN ('COMPLETED', 'CANCELLED')),
    CreatedDate       TIMESTAMP        DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT PK_GOODS_RECEIPTS PRIMARY KEY (id),
    CONSTRAINT UQ_GOODS_RECEIPTS_NO UNIQUE (ReceiptNo),
    CONSTRAINT FK_RECEIPTS_BRANCHES FOREIGN KEY (BranchId) REFERENCES BRANCHES(id),
    CONSTRAINT FK_RECEIPTS_SUPPLIERS FOREIGN KEY (SupplierId) REFERENCES SUPPLIERS(id),
    CONSTRAINT FK_RECEIPTS_USERS FOREIGN KEY (WarehouseStaffId) REFERENCES USERS(id)
);

-- 3. BẢNG CHI TIẾT PHIẾU NHẬP KHO (GOODS_RECEIPT_ITEMS)
CREATE TABLE GOODS_RECEIPT_ITEMS (
    id           VARCHAR2(50)     NOT NULL,
    ReceiptId    VARCHAR2(50)     NOT NULL,
    DrugId       VARCHAR2(50)     NOT NULL,
    BatchId      VARCHAR2(50)     NOT NULL,
    BatchNo      VARCHAR2(100)    NOT NULL,
    ExpiryDate   DATE             NOT NULL,
    Quantity     NUMBER(10)       NOT NULL CHECK (Quantity > 0),
    ImportPrice  NUMBER(15, 2)    NOT NULL CHECK (ImportPrice >= 0),
    SubTotal     NUMBER(15, 2)    NOT NULL CHECK (SubTotal >= 0),
    CONSTRAINT PK_GOODS_RECEIPT_ITEMS PRIMARY KEY (id),
    CONSTRAINT FK_RECEIPT_ITEMS_RECEIPTS FOREIGN KEY (ReceiptId) REFERENCES GOODS_RECEIPTS(id),
    CONSTRAINT FK_RECEIPT_ITEMS_DRUGS FOREIGN KEY (DrugId) REFERENCES DRUGS(id),
    CONSTRAINT FK_RECEIPT_ITEMS_BATCHES FOREIGN KEY (BatchId) REFERENCES DRUG_BATCHES(id)
);

-- 4. CHỈ MỤC (INDEXES)
CREATE INDEX IDX_RECEIPTS_BRANCH ON GOODS_RECEIPTS(BranchId);
CREATE INDEX IDX_RECEIPTS_SUPPLIER ON GOODS_RECEIPTS(SupplierId);
CREATE INDEX IDX_RECEIPTS_DATE ON GOODS_RECEIPTS(CreatedDate);
CREATE INDEX IDX_RECEIPT_ITEMS_RECEIPT ON GOODS_RECEIPT_ITEMS(ReceiptId);
CREATE INDEX IDX_RECEIPT_ITEMS_DRUG ON GOODS_RECEIPT_ITEMS(DrugId);

-- 5. SEED DỮ LIỆU MẪU CHO NHÀ CUNG CẤP (SUPPLIERS)
INSERT INTO SUPPLIERS (id, SupplierCode, SupplierName, ContactPerson, PhoneNumber, Email, Address, TaxCode, IsActive)
VALUES ('sup-00000000-0000-0000-0000-000000000001', 'NCC001', 'Công ty Cổ phần Dược phẩm Hậu Giang (DHG Pharma)', 'Nguyễn Văn Hậu', '02923891433', 'dhgpharma@dhgpharma.com.vn', '288 Bis Nguyễn Văn Cừ, An Hòa, Ninh Kiều, Cần Thơ', '1800156801', 1);

INSERT INTO SUPPLIERS (id, SupplierCode, SupplierName, ContactPerson, PhoneNumber, Email, Address, TaxCode, IsActive)
VALUES ('sup-00000000-0000-0000-0000-000000000002', 'NCC002', 'Công ty Cổ phần Traphaco', 'Trần Thị Thu Trang', '02437654321', 'info@traphaco.com.vn', '75 Yên Ninh, Ba Đình, Hà Nội', '0100108656', 1);

INSERT INTO SUPPLIERS (id, SupplierCode, SupplierName, ContactPerson, PhoneNumber, Email, Address, TaxCode, IsActive)
VALUES ('sup-00000000-0000-0000-0000-000000000003', 'NCC003', 'Công ty TNHH Sanofi-Aventis Việt Nam', 'Lê Hoàng Nam', '02838298526', 'contact-vn@sanofi.com', 'Số 10 Hàm Nghi, Bến Nghé, Quận 1, TP.HCM', '0300481234', 1);
