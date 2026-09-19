---
trigger: always_on
---

# Authorization — Runtime Access Control

## 1. Purpose

Rule này định nghĩa cơ chế thực thi kiểm soát truy cập runtime cho PharmaBranch:
- Bảo vệ API endpoints và tài nguyên nghiệp vụ phía server.
- Thực thi Branch Scope và Resource Ownership; chặn IDOR/BOLA.
- Ngăn chặn leo thang đặc quyền ngang và dọc.
- Kiểm soát chuyển trạng thái nghiệp vụ và thao tác nhạy cảm.
- Chuẩn hóa kiểm thử và audit authorization theo nguyên tắc evidence-first.

Mô hình Role → Permission → Resource → Action → Scope do `04-rbac.md` định nghĩa; rule này tập trung vào **Runtime Authorization Enforcement**.

## 2. Authorization Boundary

Authorization phải được thẩm định tại security boundary của server trước khi request chạm tới application logic hay database:

```text
Client → Authentication → Trusted Identity → Permission Resolution → Authorization → Scope / Ownership / State Check → Business Logic → Database
```

Client là untrusted; frontend là hỗ trợ UX, không phải chốt chặn bảo mật.

## 3. Server-Side Enforcement

Mọi protected endpoint phải được authorization ở server-side. Tuyệt đối không dựa vào:
- UI client: menu ẩn, nút disabled, route guard, role/permission trong `localStorage`.
- Dữ liệu client gửi: `userId`, `role`, `permission`, `branchId`, `ownerId` hay custom headers.

Server phải tự trích xuất Identity và phạm vi truy cập từ authenticated security context đáng tin cậy.

## 4. Authorization Decision Flow

Mọi quyết định truy cập phải qua chuỗi thẩm định:

```text
Authenticated Identity → Role / Permission → Resource → Action → Branch / Ownership Scope → Resource State → ALLOW / DENY
```

Kết quả thẩm định bắt buộc là **ALLOW** hoặc **DENY**.

## 5. Deny by Default

Áp dụng nguyên tắc **Deny by Default**: thiếu căn cứ xác minh hợp lệ bắt buộc phải từ chối (**DENY**). Bắt buộc DENY khi:
- Request ẩn danh (Anonymous / Unauthenticated).
- Thiếu Permission hoặc Permission không khớp Action yêu cầu.
- Resource ngoài Branch Scope hoặc không thuộc Ownership hợp lệ.
- Role không được phép thực hiện nghiệp vụ; Resource ở trạng thái cấm thao tác.
- Security context bị thiếu, giả mạo hoặc không hợp lệ.

## 6. API Authorization

Mỗi endpoint phải gắn liền với authorization requirement cụ thể (ví dụ: `GET /api/medicines` → `MEDICINE_VIEW`; `POST /api/sale-orders` → `SALE_ORDER_CREATE`; `PUT /api/inventory/{id}` → `INVENTORY_UPDATE`).

Nghiêm cấm dùng quyền chung chung (như `ANY_AUTHENTICATED_USER`) cho các endpoint quản trị hoặc thay đổi dữ liệu.

## 7. Branch Scope Enforcement

Quyền nghiệp vụ (`Permission`) bắt buộc đi kèm phạm vi chi nhánh (`Allowed Branch Scope`):

```text
Current User Branch == Resource Branch
```

- User chi nhánh B01 cấm truy cập dữ liệu B02 (trừ khi có quyền cross-branch tường minh).
- Không tin tưởng `branchId` do client gửi trong URL, query, hay body.
- Bảo vệ branch scope trên mọi thao tác: `READ`, `CREATE`, `UPDATE`, `DELETE`, `APPROVE`, `PROCESS`, `EXPORT`, `LIST`, `SEARCH`, `FILTER`, `REPORT`.
- Ở tầng truy vấn (Query-Level Authorization), dữ liệu phải cô lập tại nguồn (`WHERE branch_id = @user_branch`), không tải toàn bộ rồi lọc memory.

## 8. Resource Ownership

Biết Resource ID **không đồng nghĩa** có quyền truy cập. Authorization phải kiểm tra đồng thời:

```text
Identity + Permission + Resource + Scope / Ownership
```

Quyền sở hữu phải đối chiếu từ dữ liệu server-side, không tin tưởng các trường do client khai báo (`ownerId`, `createdBy`).

## 9. IDOR / BOLA Protection

Hệ thống phải phòng chống triệt để lỗ hổng IDOR và BOLA:
- Bảo vệ cả collection endpoints (`/api/orders`) lẫn single-resource endpoints (`/api/orders/{id}`).
- Kiểm tra quyền sở hữu và branch scope trên mọi HTTP method: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- Bảo vệ endpoint danh sách (list) không tự động bảo vệ endpoint chi tiết (detail).

## 10. Horizontal and Vertical Privilege Escalation

Ngăn chặn leo thang đặc quyền:
- **Horizontal Escalation (Ngang):** Truy cập tài nguyên user/chi nhánh khác cùng cấp (Sales A truy cập Order của Sales B → **DENY**; Warehouse B01 truy cập Inventory của B02 → **DENY**).
- **Vertical Escalation (Dọc):** Role cấp dưới gọi nghiệp vụ role cấp cao (`SALES` quản lý nhân sự → **DENY**; `WAREHOUSE` gán role/permission → **DENY**).
- **Chống tự cấp quyền (Self-Escalation):** Cấm user tự nâng role hoặc gán thêm permission cho chính mình.

## 11. State-Based Authorization

Quyền truy cập phụ thuộc vào trạng thái tài nguyên:

```text
Identity + Permission + Resource + Current State + Requested Action
```

State transitions phải kiểm tra tại server-side:
- Đơn hàng đã hoàn tất (`ORDER = COMPLETED`) → cấm chỉnh sửa (`UPDATE`) → **DENY**.
- Phiếu nhập đã duyệt (`PURCHASE_ORDER = APPROVED`) → cấm sửa các trường bị khóa → **DENY**.

## 12. Sensitive Operations

Nghiệp vụ rủi ro cao đòi hỏi kiểm soát nghiêm ngặt (`Permission + Scope + State + Approval + Audit Log`):
- Gán role (`Role Assignment`) và thay đổi quyền (`Permission Change`).
- Điều chỉnh tồn kho (`Inventory Adjustment`).
- Hủy đơn (`Order Cancellation`), hoàn tiền (`Refund`), duyệt chiết khấu.
- Phê duyệt chứng từ mua/nhập/xuất/chuyển kho.
- Đổi cấu hình hệ thống, xóa dữ liệu quan trọng, thao tác tài chính.
- Truy cập hoặc xuất `Audit Log`, export dữ liệu nhạy cảm.

## 13. Authorization Failure Handling

Khi authorization thất bại:
- Mã lỗi chuẩn (`401 Unauthorized`, `403 Forbidden`, hoặc `404 Not Found` khi cần ẩn resource ngoài scope).
- Không để lộ thông tin nhạy cảm trong response: schema DB, câu lệnh SQL, cấu hình bảo mật, dữ liệu của user/chi nhánh khác.
- Phân biệt rõ lỗi Authentication với lỗi Authorization trong server log nội bộ.

## 14. Authorization Testing

Mọi protected endpoint phải có negative tests:
1. **Anonymous:** Request ẩn danh gọi protected API → **DENY**.
2. **Missing Permission:** Thiếu permission cho action → **DENY**.
3. **Wrong Permission:** Permission không khớp action → **DENY**.
4. **Wrong Branch Scope:** Đúng permission nhưng sai chi nhánh → **DENY**.
5. **Wrong Ownership:** Đúng permission nhưng sai owner → **DENY**.
6. **Horizontal Escalation:** Thao tác chéo user/branch cùng cấp → **DENY**.
7. **Vertical Escalation:** Role cấp dưới gọi API role quản trị → **DENY**.
8. **Invalid Resource State:** Resource ở trạng thái cấm thao tác → **DENY**.
9. **Cross-Branch Access:** Đọc/ghi dữ liệu ngoài chi nhánh → **DENY**.
10. **Sensitive Operation:** Thao tác nhạy cảm khi thiếu điều kiện/duyệt → **DENY**.

Kỳ vọng: Unauthorized → **DENY**; Authorized → **ALLOW** (không ép buộc test framework cụ thể).

## 15. Evidence-First Verification

Tuân thủ **Evidence > Assumption**:
- Phân biệt: `DESIGNED / REQUIRED ≠ IMPLEMENTED / VERIFIED`.
- Không suy luận an toàn chỉ từ tên method, route API, UI ẩn nút hay tài liệu thiết kế.
- Thiếu physical evidence: bắt buộc đánh giá **NOT VERIFIED**, không được coi là **SECURE**.
- Trong READ ONLY audit: không sửa code, database, permission hay cấu hình.

## 16. Rule Boundary & Related Rules

Phân định trách nhiệm:
- **`04-rbac.md`:** Mô hình RBAC (Role, Permission, Resource, Action, Scope, Matrix, Least Privilege, Separation of Duties).
- **`05-authorization.md`:** Cơ chế thực thi runtime (Enforcement, API protection, Branch/Ownership scoping, IDOR/BOLA, Escalation defense, State checks, Testing).
- **`03-security.md`:** An ninh tổng thể (Authentication, JWT, SQL injection, RLS/CLS, digital signature, audit logging).
- **`01-architecture.md` & `02-architecture-quality.md`:** Kiến trúc hệ thống, transaction boundaries, concurrency và deployment quality.

Không định nghĩa lại mô hình RBAC hay áp đặt công nghệ ngoài kiến trúc đã duyệt.

## 17. Final Principle

Nguyên tắc bất di bất dịch:
> Có đăng nhập không đồng nghĩa có quyền.  
> Có Permission không đồng nghĩa được truy cập mọi Resource.  
> Có Resource ID không đồng nghĩa được truy cập Resource.  
> Có quyền trong một chi nhánh không đồng nghĩa có quyền trên toàn hệ thống.  
> Authorization bắt buộc phải được thẩm định và thực thi tại server-side.
