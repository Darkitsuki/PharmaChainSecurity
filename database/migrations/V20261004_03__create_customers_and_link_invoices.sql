-- Migration: V20261004_03__create_customers_and_link_invoices.sql
-- Description: Tạo bảng CUSTOMERS (khách hàng thân thiết/bán lẻ) và liên kết CustomerId vào bảng INVOICES

-- 1. Tạo bảng CUSTOMERS
CREATE TABLE CUSTOMERS (
    id            VARCHAR2(50)     NOT NULL,
    CustomerCode  VARCHAR2(50)     NOT NULL,
    FullName      VARCHAR2(255)    NOT NULL,
    PhoneNumber   VARCHAR2(20)     NOT NULL,
    Email         VARCHAR2(100),
    Address       VARCHAR2(500),
    BranchId      VARCHAR2(50),
    TotalSpent    NUMBER(15, 2)    DEFAULT 0.00 NOT NULL CHECK (TotalSpent >= 0),
    Points        NUMBER(10)       DEFAULT 0 NOT NULL CHECK (Points >= 0),
    CreatedDate   TIMESTAMP        DEFAULT CURRENT_TIMESTAMP NOT NULL,
    IsActive      NUMBER(1)        DEFAULT 1 NOT NULL CHECK (IsActive IN (0, 1)),
    CONSTRAINT PK_CUSTOMERS PRIMARY KEY (id),
    CONSTRAINT UQ_CUSTOMERS_CODE UNIQUE (CustomerCode),
    CONSTRAINT UQ_CUSTOMERS_PHONE UNIQUE (PhoneNumber),
    CONSTRAINT FK_CUSTOMERS_BRANCHES FOREIGN KEY (BranchId) REFERENCES BRANCHES(id)
);

-- 2. Chỉ mục tìm kiếm khách hàng theo SĐT và tên
CREATE INDEX IDX_CUSTOMERS_PHONE ON CUSTOMERS(PhoneNumber);
CREATE INDEX IDX_CUSTOMERS_NAME ON CUSTOMERS(LOWER(FullName));

-- 3. Bổ sung trường CustomerId vào bảng INVOICES (cho phép NULL đối với khách lẻ vãng lai)
ALTER TABLE INVOICES ADD (
    CustomerId VARCHAR2(50),
    CONSTRAINT FK_INVOICES_CUSTOMERS FOREIGN KEY (CustomerId) REFERENCES CUSTOMERS(id)
);

CREATE INDEX IDX_INVOICES_CUSTOMER ON INVOICES(CustomerId);
