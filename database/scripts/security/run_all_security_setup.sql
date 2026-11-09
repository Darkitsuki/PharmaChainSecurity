-- =============================================================================
-- MASTER SCRIPT: TRIỂN KHAI TOÀN DIỆN KIẾN TRÚC BẢO MẬT CSDL (VPD & CLS)
-- PROJECT: PharmaChainSecurity — Multi-Branch Pharmacy Management System
-- TARGET DB: Oracle Database 23ai / 21c
-- =============================================================================

PROMPT [1/5] Chạy Script 01: Phân tách người dùng và cấp quyền tối thiểu...
@@01_setup_users_and_privileges.sql

PROMPT [2/5] Chạy Script 02: Chuẩn hóa Application Context và Package...
@@02_pkg_pharma_security.sql

PROMPT [3/5] Chạy Script 03: Đăng ký chính sách Row-Level Security (DBMS_RLS)...
@@03_apply_vpd_policies.sql

PROMPT [4/5] Chạy Script 04: Xây dựng Column-Level Security View...
@@04_vw_staff_revenue_security.sql

PROMPT =============================================================================
PROMPT HƯỚNG DẪN KIỂM THỬ:
PROMPT Để thực thi Script 05 kiểm thử tự động, vui lòng đổi sang PHARMA_APP_USER:
PROMPT   CONNECT PHARMA_APP_USER/"AppUser_Secured_2026#"@FREEPDB1;
PROMPT   @05_verify_security_suite.sql
PROMPT =============================================================================

