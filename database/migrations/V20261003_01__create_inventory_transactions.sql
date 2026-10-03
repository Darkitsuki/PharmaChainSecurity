-- =============================================================================
-- MIGRATION: V20261003_01__create_inventory_transactions.sql
-- DESCRIPTION: Bổ sung bảng INVENTORY_TRANSACTIONS để lưu vết biến động tồn kho
-- ENGINE: Oracle Database 23ai / PL-SQL
-- COMPLIANCE: 07-database-integrity.md, 06-branch-isolation.md
-- =============================================================================

CREATE TABLE INVENTORY_TRANSACTIONS (
    id                VARCHAR2(50)     NOT NULL,
    BranchId          VARCHAR2(50)     NOT NULL,
    DrugId            VARCHAR2(50)     NOT NULL,
    BatchId           VARCHAR2(50)     NOT NULL,
    TransactionType   VARCHAR2(20)     NOT NULL CHECK (TransactionType IN ('NHAP', 'XUAT_BAN', 'DIEU_CHINH', 'TRA_HANG')),
    QuantityChange    NUMBER(10)       NOT NULL,
    RemainingQuantity NUMBER(10)       NOT NULL CHECK (RemainingQuantity >= 0),
    CreatedBy         VARCHAR2(50)     NOT NULL,
    CreatedDate       TIMESTAMP        DEFAULT CURRENT_TIMESTAMP NOT NULL,
    Note              VARCHAR2(500),
    CONSTRAINT PK_INV_TRANSACTIONS PRIMARY KEY (id),
    CONSTRAINT FK_INV_TX_BRANCHES FOREIGN KEY (BranchId) REFERENCES BRANCHES(id),
    CONSTRAINT FK_INV_TX_DRUGS FOREIGN KEY (DrugId) REFERENCES DRUGS(id),
    CONSTRAINT FK_INV_TX_BATCHES FOREIGN KEY (BatchId) REFERENCES DRUG_BATCHES(id),
    CONSTRAINT FK_INV_TX_USERS FOREIGN KEY (CreatedBy) REFERENCES USERS(id)
);

CREATE INDEX IDX_INV_TX_BRANCH ON INVENTORY_TRANSACTIONS(BranchId);
CREATE INDEX IDX_INV_TX_DRUG_BATCH ON INVENTORY_TRANSACTIONS(BranchId, DrugId, BatchId);
CREATE INDEX IDX_INV_TX_DATE ON INVENTORY_TRANSACTIONS(CreatedDate);
