-- =============================================================================
-- MIGRATION: V20261004_02__add_is_active_and_indexes_to_drugs.sql
-- DESCRIPTION: Bổ sung cột IsActive, CreatedDate và chỉ mục tìm kiếm cho bảng DRUGS
-- =============================================================================

-- 1. BỔ SUNG CỘT ISACTIVE VÀ CREATEDDATE CHO BẢNG DRUGS
ALTER TABLE DRUGS ADD (
    IsActive    NUMBER(1)    DEFAULT 1 NOT NULL CHECK (IsActive IN (0, 1)),
    CreatedDate TIMESTAMP    DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. TẠO CHỈ MỤC TÌM KIẾM TÊN THUỐC VÀ TRẠNG THÁI HOẠT ĐỘNG
CREATE INDEX IDX_DRUGS_NAME ON DRUGS(Name);
CREATE INDEX IDX_DRUGS_ACTIVE ON DRUGS(IsActive);
