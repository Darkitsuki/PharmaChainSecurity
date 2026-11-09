# Oracle Database Security Architecture (VPD / RLS & CLS)

Thư mục này chứa bộ script chuẩn hóa kiến trúc bảo mật Cơ sở dữ liệu Oracle Database 23ai / 21c cho dự án PharmaChainSecurity, tuân thủ nghiêm ngặt các quy tắc Governance (Rule 01, Rule 02, Rule 03, Rule 04, Rule 06, Rule 10).

## 1. Mục lục Scripts
1. [`01_setup_users_and_privileges.sql`](./01_setup_users_and_privileges.sql):
   - Phân tách vai trò Schema Owner (`PHARMA_ADMIN`) và Runtime User (`PHARMA_APP_USER`).
   - Thu hồi đặc quyền `DBA`, `EXEMPT ACCESS POLICY` trên `PHARMA_APP_USER`.
   - Cấp quyền DML tối thiểu và tạo Synonyms.
2. [`02_pkg_pharma_security.sql`](./02_pkg_pharma_security.sql):
   - Khởi tạo Application Context `PHARMA_CTX`.
   - Package `PKG_PHARMA_SECURITY`: Quản lý phiên làm việc (`SET_USER_CONTEXT`, `CLEAR_USER_CONTEXT`), hàm vị từ cô lập chi nhánh `FN_VPD_BRANCH_ISOLATION` (Fail-Closed, Dynamic Predicate tối ưu Shared Pool) và hàm vị từ chuyển kho `FN_VPD_TRANSFER_ISOLATION`.
3. [`03_apply_vpd_policies.sql`](./03_apply_vpd_policies.sql):
   - Dọn dẹp an toàn policy cũ (Idempotent Teardown).
   - Đăng ký `DBMS_RLS` cho 8 bảng nghiệp vụ cốt lõi và bảng `STOCK_TRANSFERS` với `statement_types => 'SELECT, INSERT, UPDATE, DELETE'`, `update_check => TRUE`, `policy_type => DBMS_RLS.CONTEXT_SENSITIVE`.
4. [`04_vw_staff_revenue_security.sql`](./04_vw_staff_revenue_security.sql):
   - Xây dựng Column-Level Security (CLS) View `VW_STAFF_REVENUE_SECURITY` ẩn doanh thu cá nhân với vai trò thông thường (SALES, WAREHOUSE), chỉ hiển thị cho OWNER/ADMIN.
5. [`05_verify_security_suite.sql`](./05_verify_security_suite.sql):
   - Kịch bản kiểm thử tự động 5 Test Cases: Fail-Closed, Same-Branch Read, Cross-Branch Insert Block (`ORA-28115`), Global Oversight, và CLS Check.
6. [`run_all_security_setup.sql`](./run_all_security_setup.sql):
   - Master runner điều phối triển khai lần lượt từ Script 01 đến 04.

## 2. Quy trình Thực thi Chuẩn
```sql
-- Bước 1-4: Chạy dưới quyền DBA (SYS / SYSTEM / PDB_ADMIN hoặc PHARMA_ADMIN)
SQL> CONNECT PHARMA_ADMIN/admin123@FREEPDB1;
SQL> @run_all_security_setup.sql

-- Bước 5: Kiểm thử tự động bắt buộc chạy dưới tài khoản PHARMA_APP_USER
SQL> CONNECT PHARMA_APP_USER/"AppUser_Secured_2026#"@FREEPDB1;
SQL> @05_verify_security_suite.sql
```
