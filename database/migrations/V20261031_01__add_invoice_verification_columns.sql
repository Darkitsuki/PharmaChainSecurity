-- Migration: V20261031_01__add_invoice_verification_columns.sql
-- Description: Bổ sung lưu vết thẩm định chữ ký số vào bảng hóa đơn (Package Audit Trail)

ALTER SESSION SET CURRENT_SCHEMA = PHARMA_ADMIN;

-- 1. BỔ SUNG CỘT CHO BẢNG HÓA ĐƠN (INVOICES)
ALTER TABLE INVOICES ADD (
    LastVerifiedAt TIMESTAMP(6),
    VerifiedBy     VARCHAR2(50),
    CONSTRAINT FK_INVOICES_VERIFIED_BY FOREIGN KEY (VerifiedBy) REFERENCES USERS(id)
);

CREATE INDEX IDX_INVOICES_VERIFIED ON INVOICES(LastVerifiedAt, VerifiedBy);

