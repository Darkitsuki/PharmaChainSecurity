-- Migration: V20261004_05__create_auth_audit_logs.sql
-- Description: Tạo bảng AUDIT_LOGS lưu vết an ninh đăng nhập (LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT) và chỉ mục tra cứu theo Rule 03 & Rule 09

CREATE TABLE AUDIT_LOGS (
    id             VARCHAR2(50)    NOT NULL,
    UserId         VARCHAR2(50),
    Username       VARCHAR2(100)   NOT NULL,
    BranchId       VARCHAR2(50),
    EventType      VARCHAR2(50)    NOT NULL,
    IpAddress      VARCHAR2(50),
    UserAgent      VARCHAR2(500),
    FailureReason  VARCHAR2(255),
    CreatedDate    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT PK_AUDIT_LOGS PRIMARY KEY (id)
);

-- Chỉ mục hỗ trợ tra cứu lịch sử an ninh và phát hiện bất thường theo Rule 09
CREATE INDEX IDX_AUDIT_USER ON AUDIT_LOGS(Username);
CREATE INDEX IDX_AUDIT_DATE ON AUDIT_LOGS(CreatedDate);
CREATE INDEX IDX_AUDIT_EVENT ON AUDIT_LOGS(EventType);
CREATE INDEX IDX_AUDIT_BRANCH ON AUDIT_LOGS(BranchId);
