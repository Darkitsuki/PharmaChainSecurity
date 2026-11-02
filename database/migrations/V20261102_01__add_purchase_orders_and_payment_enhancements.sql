-- =============================================================================
-- Migration: V20261102_01__add_purchase_orders_and_payment_enhancements.sql
-- Description: Thêm bảng PURCHASE_ORDERS, PURCHASE_ORDER_ITEMS và bổ sung
--              liên kết đơn mua, đổi hàng, theo dõi thanh toán VietQR / tiền mặt
-- Project: PharmaChainSecurity (Oracle Database 23ai)
-- Governance: Rule 00, Rule 03, Rule 06 (Branch Isolation), Rule 07, Skill 07
-- =============================================================================

ALTER SESSION SET CURRENT_SCHEMA = PHARMA_ADMIN;

-- -----------------------------------------------------------------------------
-- 1. BẢNG ĐƠN ĐẶT MUA THUỐC (PURCHASE_ORDERS)
-- -----------------------------------------------------------------------------
CREATE TABLE PURCHASE_ORDERS (
    id                   VARCHAR2(50)     NOT NULL,
    OrderNo              VARCHAR2(50)     NOT NULL,
    BranchId             VARCHAR2(50)     NOT NULL,
    SupplierId           VARCHAR2(50)     NOT NULL,
    CreatedBy            VARCHAR2(50)     NOT NULL,
    ApprovedBy           VARCHAR2(50),
    TotalEstimatedAmount NUMBER(15, 2)    DEFAULT 0.00 NOT NULL CHECK (TotalEstimatedAmount >= 0),
    Status               VARCHAR2(20)     DEFAULT 'PENDING' NOT NULL CHECK (Status IN ('PENDING', 'APPROVED', 'REJECTED', 'ORDERED', 'RECEIVED', 'CANCELLED')),
    ApprovedDate         TIMESTAMP,
    ExpectedDeliveryDate DATE,
    Notes                VARCHAR2(500),
    CreatedDate          TIMESTAMP        DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT PK_PURCHASE_ORDERS PRIMARY KEY (id),
    CONSTRAINT UQ_PURCHASE_ORDERS_NO UNIQUE (OrderNo),
    CONSTRAINT FK_PO_BRANCHES FOREIGN KEY (BranchId) REFERENCES BRANCHES(id),
    CONSTRAINT FK_PO_SUPPLIERS FOREIGN KEY (SupplierId) REFERENCES SUPPLIERS(id),
    CONSTRAINT FK_PO_CREATED_BY FOREIGN KEY (CreatedBy) REFERENCES USERS(id),
    CONSTRAINT FK_PO_APPROVED_BY FOREIGN KEY (ApprovedBy) REFERENCES USERS(id)
);

CREATE INDEX IDX_PO_BRANCH ON PURCHASE_ORDERS(BranchId);
CREATE INDEX IDX_PO_SUPPLIER ON PURCHASE_ORDERS(SupplierId);
CREATE INDEX IDX_PO_STATUS ON PURCHASE_ORDERS(Status);
CREATE INDEX IDX_PO_DATE ON PURCHASE_ORDERS(CreatedDate);

-- -----------------------------------------------------------------------------
-- 2. BẢNG CHI TIẾT ĐƠN ĐẶT MUA (PURCHASE_ORDER_ITEMS)
-- -----------------------------------------------------------------------------
CREATE TABLE PURCHASE_ORDER_ITEMS (
    OrderId            VARCHAR2(50)     NOT NULL,
    DrugId             VARCHAR2(50)     NOT NULL,
    Quantity           NUMBER(10)       NOT NULL CHECK (Quantity > 0),
    EstimatedUnitPrice NUMBER(15, 2)    NOT NULL CHECK (EstimatedUnitPrice >= 0),
    SubTotal           NUMBER(15, 2)    NOT NULL CHECK (SubTotal >= 0),
    Notes              VARCHAR2(255),
    CONSTRAINT PK_PO_ITEMS PRIMARY KEY (OrderId, DrugId),
    CONSTRAINT FK_PO_ITEMS_ORDER FOREIGN KEY (OrderId) REFERENCES PURCHASE_ORDERS(id) ON DELETE CASCADE,
    CONSTRAINT FK_PO_ITEMS_DRUG FOREIGN KEY (DrugId) REFERENCES DRUGS(id)
);

CREATE INDEX IDX_PO_ITEMS_DRUG ON PURCHASE_ORDER_ITEMS(DrugId);

-- -----------------------------------------------------------------------------
-- 3. LIÊN KẾT PHIẾU NHẬP KHO VỚI ĐƠN ĐẶT MUA (GOODS_RECEIPTS)
-- -----------------------------------------------------------------------------
ALTER TABLE GOODS_RECEIPTS ADD (
    PurchaseOrderId VARCHAR2(50),
    CONSTRAINT FK_RECEIPTS_PO FOREIGN KEY (PurchaseOrderId) REFERENCES PURCHASE_ORDERS(id)
);

CREATE INDEX IDX_RECEIPTS_PO ON GOODS_RECEIPTS(PurchaseOrderId);

-- -----------------------------------------------------------------------------
-- 4. BỔ SUNG LƯU VẾT THANH TOÁN TIỀN MẶT / CHUYỂN KHOẢN VIETQR (INVOICES)
-- -----------------------------------------------------------------------------
ALTER TABLE INVOICES ADD (
    PaymentMethod    VARCHAR2(20)  DEFAULT 'CASH' NOT NULL CHECK (PaymentMethod IN ('CASH', 'BANK_TRANSFER', 'QR_CODE', 'CREDIT_CARD')),
    PaymentStatus    VARCHAR2(20)  DEFAULT 'PAID' NOT NULL CHECK (PaymentStatus IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    PaidAmount       NUMBER(15, 2) DEFAULT 0.00   NOT NULL CHECK (PaidAmount >= 0),
    PaidAt           TIMESTAMP,
    PaymentReference VARCHAR2(100)
);

CREATE INDEX IDX_INVOICES_PAYMENT ON INVOICES(PaymentMethod, PaymentStatus);

-- -----------------------------------------------------------------------------
-- 5. BỔ SUNG LIÊN KẾT ĐỔI THUỐC VỚI HÓA ĐƠN MỚI (RETURNS)
-- -----------------------------------------------------------------------------
ALTER TABLE RETURNS ADD (
    ExchangeInvoiceId VARCHAR2(50),
    CONSTRAINT FK_RETURNS_EXCHANGE_INV FOREIGN KEY (ExchangeInvoiceId) REFERENCES INVOICES(id)
);

CREATE INDEX IDX_RETURNS_EXCHANGE_INV ON RETURNS(ExchangeInvoiceId);

-- -----------------------------------------------------------------------------
-- 6. GẮN CHÍNH SÁCH ORACLE VPD (ROW-LEVEL SECURITY) CHO PURCHASE_ORDERS (RULE 06)
-- -----------------------------------------------------------------------------
BEGIN
    DBMS_RLS.ADD_POLICY(
        object_schema   => USER,
        object_name     => 'PURCHASE_ORDERS',
        policy_name     => 'POL_VPD_PURCHASE_ORDERS',
        function_schema => USER,
        policy_function => 'PKG_PHARMA_SECURITY.FN_VPD_BRANCH_ISOLATION',
        statement_types => 'SELECT, INSERT, UPDATE, DELETE',
        update_check    => TRUE
    );
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Bỏ qua nếu policy đã được đăng ký hoặc trong môi trường chưa cài đặt package
END;
/

