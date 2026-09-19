---
trigger: always_on
---

# RBAC — Role-Based Access Control

## 1. Purpose

Rule này định nghĩa mô hình phân quyền RBAC cho hệ thống PharmaBranch.

Mục tiêu:

- Xác định rõ vai trò của người dùng.
- Xác định quyền mà từng vai trò được phép thực hiện.
- Chuẩn hóa Permission, Resource, Action và Scope.
- Ngăn quyền vượt quá trách nhiệm nghiệp vụ.
- Đảm bảo phân quyền nhất quán giữa Web, API và Database.
- Làm cơ sở cho Authorization, Testing và Security Audit.

Rule này tập trung vào RBAC Model.

Cơ chế thực thi quyền, API authorization, IDOR/BOLA, privilege escalation và resource protection thuộc `05-authorization.md`.


## 2. Core Principle

Mọi quyết định phân quyền phải được mô hình hóa theo:

Identity
→ Role
→ Permission
→ Resource
→ Action
→ Scope

Trong đó:

- Identity: người dùng đã được xác thực.
- Role: vai trò nghiệp vụ của người dùng.
- Permission: quyền được cấp cho role.
- Resource: đối tượng nghiệp vụ mà quyền tác động.
- Action: hành động được phép thực hiện.
- Scope: phạm vi dữ liệu mà quyền có hiệu lực.

Không được coi Role đơn thuần là quyền truy cập.

Ví dụ:

```text
SALES
  → SALE_ORDER
  → CREATE
  → BRANCH_SCOPE
```

có nghĩa nhân viên bán thuốc được tạo đơn bán hàng trong phạm vi chi nhánh được phép.

## 3. Deny by Default

Hệ thống phải áp dụng nguyên tắc:

> Không có Permission rõ ràng → Không được phép thực hiện.

Không được suy luận quyền theo kiểu:

* Không bị cấm thì được phép.
* Cùng phòng ban thì được phép.
* Cùng chi nhánh thì được phép.
* Có Role gần giống thì được phép.

Mọi quyền mới phải được khai báo rõ ràng.

## 4. System Roles

Hệ thống định hướng ba vai trò RBAC vận hành chính:

1. **`OWNER`**: Chủ nhà thuốc / Branch Owner.
2. **`SALES`**: Nhân viên bán hàng / Sales Staff.
3. **`WAREHOUSE`**: Nhân viên kho / Warehouse Staff.

Nguyên tắc:

> Business title / terminology ≠ RBAC role.

- Thuật ngữ "MANAGER" / "Quản lý" là chức danh/ngữ cảnh tổ chức, **KHÔNG** tự động là vai trò RBAC thứ tư.
- MANAGER **KHÔNG** tự động đồng nhất với OWNER và **KHÔNG** tự động ánh xạ thành role riêng.
- Role `MANAGER` chỉ được lập khi có bằng chứng dự án tường minh (yêu cầu, schema, cấu hình, mã nguồn).

### 4.1 OWNER

Chủ nhà thuốc / Branch Owner, quản lý hoạt động chi nhánh.

Quyền nghiệp vụ có thể bao gồm:

* Quản lý thông tin chi nhánh.
* Quản lý nhân viên.
* Quản lý Role và Permission trong phạm vi được cấp.
* Quản lý thuốc và danh mục.
* Quản lý tồn kho.
* Quản lý nhập hàng.
* Quản lý bán hàng.
* Quản lý hóa đơn.
* Quản lý trả hàng.
* Xem báo cáo.
* Thực hiện hoặc phê duyệt các nghiệp vụ yêu cầu quyền quản lý.
* Xem các thông tin quản trị thuộc phạm vi chi nhánh.

OWNER không mặc nhiên có quyền truy cập dữ liệu của chi nhánh khác.

### 4.2 SALES

Nhân viên bán thuốc.

Quyền nghiệp vụ chính:

* Tra cứu thuốc.
* Tra cứu tồn kho phục vụ bán hàng.
* Quản lý khách hàng theo phạm vi nghiệp vụ được cấp.
* Tạo đơn bán hàng.
* Cập nhật đơn hàng trong trạng thái cho phép.
* Tạo hóa đơn.
* Xử lý thanh toán theo nghiệp vụ được cấp.
* Xử lý trả hàng theo quyền được cấp.
* Xem dữ liệu bán hàng cần thiết cho công việc.

SALES không được mặc nhiên:

* Quản lý nhân viên.
* Gán Role.
* Cấp Permission.
* Thay đổi cấu hình bảo mật.
* Điều chỉnh tồn kho ngoài nghiệp vụ được cấp.
* Thực hiện nghiệp vụ quản trị chi nhánh.

### 4.3 WAREHOUSE

Nhân viên kho.

Quyền nghiệp vụ chính:

* Tra cứu thuốc.
* Xem tồn kho.
* Tiếp nhận hàng.
* Ghi nhận nhập kho.
* Ghi nhận xuất kho.
* Ghi nhận điều chuyển kho nếu được cấp.
* Kiểm kê.
* Ghi nhận chênh lệch tồn kho theo quyền được cấp.
* Xem lịch sử giao dịch kho.
* Hỗ trợ nghiệp vụ mua hàng/nhập hàng theo quyền được cấp.

WAREHOUSE không được mặc nhiên:

* Quản lý nhân viên.
* Gán Role.
* Cấp Permission.
* Thay đổi cấu hình bảo mật.
* Thực hiện nghiệp vụ bán hàng ngoài phạm vi được cấp.

## 5. Role → Permission → Resource → Action

Permission phải được mô hình hóa rõ ràng.

Mẫu:

```text
ROLE
  ↓
PERMISSION
  ↓
RESOURCE
  ↓
ACTION
  ↓
SCOPE
```

Ví dụ:

```text
SALES
  → ORDER_CREATE
  → ORDER
  → CREATE
  → OWN_BRANCH
```

Hoặc:

```text
WAREHOUSE
  → INVENTORY_RECEIVE
  → INVENTORY
  → RECEIVE
  → OWN_BRANCH
```

## 6. Resource Vocabulary

Resource phải sử dụng tên nhất quán với domain model.

Các Resource chính có thể bao gồm:

```text
BRANCH
USER
ROLE
PERMISSION
MEDICINE
CATEGORY
INVENTORY
INVENTORY_TRANSACTION
SUPPLIER
PURCHASE_ORDER
PURCHASE_ORDER_ITEM
CUSTOMER
SALE_ORDER
SALE_ORDER_ITEM
INVOICE
PAYMENT
RETURN
EXPENSE
REPORT
AUDIT_LOG
```

Không tạo Permission dựa trên tên UI nếu Resource nghiệp vụ đã tồn tại.

Ví dụ không nên:

```text
CAN_CLICK_STOCK_BUTTON
```

Nên:

```text
INVENTORY_VIEW
INVENTORY_ADJUST
```

## 7. Action Vocabulary

Action phải mô tả hành vi nghiệp vụ.

Các Action cơ bản:

```text
VIEW
CREATE
UPDATE
DELETE
APPROVE
REJECT
CANCEL
PROCESS
RECEIVE
ISSUE
ADJUST
EXPORT
IMPORT
ASSIGN
```

Chỉ tạo Action chuyên biệt khi nghiệp vụ thực sự yêu cầu.

Không tạo quá nhiều Permission chỉ để phản ánh từng nút trên giao diện.

## 8. Scope

Permission phải xác định phạm vi dữ liệu khi nghiệp vụ yêu cầu.

Các Scope có thể gồm:

```text
OWN_BRANCH
OWN_RESOURCE
OWN_RECORD
GLOBAL
```

Đối với hệ thống quản lý chuỗi/chi nhánh:

> Quyền nghiệp vụ không đồng nghĩa với quyền truy cập toàn hệ thống.

Ví dụ:

```text
SALES
→ ORDER_VIEW
→ OWN_BRANCH
```

không có nghĩa:

```text
SALES
→ ORDER_VIEW
→ ALL_BRANCHES
```

Scope phải được xác định ở tầng nghiệp vụ và được enforce bởi Authorization.

## 9. Separation of Duties

Các nghiệp vụ có rủi ro cao phải phân tách trách nhiệm khi cần thiết.

Ví dụ:

```text
WAREHOUSE
→ thực hiện nhập kho

OWNER
→ phê duyệt nghiệp vụ yêu cầu phê duyệt
```

Không cấp toàn bộ quyền quản trị cho mọi Role chỉ vì thuận tiện triển khai.

Đặc biệt cần kiểm soát:

* Role management.
* Permission management.
* User management.
* Inventory adjustment.
* Approval.
* Financial operations.
* Configuration.
* Audit data.

## 10. Role Assignment

Việc gán Role phải tuân thủ nguyên tắc:

```text
Actor
→ có quyền quản lý Role
→ chỉ được gán Role trong phạm vi được phép
```

Không được thiết kế cơ chế cho phép người dùng:

```text
tự cấp Role cho chính mình
```

hoặc:

```text
tự cấp Permission cao hơn
```

Role assignment phải được coi là một security-sensitive operation.

## 11. Permission Management

Permission là capability của hệ thống.

Không được để client tự quyết định Permission.

Client chỉ có thể:

* Hiển thị menu.
* Ẩn/hiện chức năng.
* Điều chỉnh trải nghiệm UI.

Quyền thực tế phải được xác định từ server-side authorization.

UI không phải là nguồn sự thật của RBAC.

## 12. Authorization Matrix

Mỗi Resource quan trọng phải có ma trận quyền.

Ví dụ baseline:

| Resource       | OWNER         | SALES        | WAREHOUSE       |
| -------------- | ------------- | ------------ | --------------- |
| BRANCH         | Manage        | View limited | View limited    |
| USER           | Manage        | None         | None            |
| ROLE           | Manage        | None         | None            |
| PERMISSION     | Manage        | None         | None            |
| MEDICINE       | Manage        | View         | View            |
| INVENTORY      | Manage        | View         | Manage          |
| PURCHASE_ORDER | Manage        | View limited | Process         |
| SALE_ORDER     | Manage        | Manage       | View limited    |
| INVOICE        | Manage        | Process      | None            |
| PAYMENT        | Manage        | Process      | None            |
| RETURN         | Manage        | Process      | Process limited |
| REPORT         | View/Manage   | View limited | View limited    |
| AUDIT_LOG      | View          | None         | None            |

Đây là baseline nghiệp vụ.

Implementation phải kiểm tra lại với:

* Database schema.
* API contract.
* Business requirements.
* Actual application code.

Không được coi bảng trên là bằng chứng rằng quyền đã được triển khai.

## 13. Least Privilege

Mỗi Role chỉ nhận các Permission cần thiết cho công việc.

Không cấp:

```text
FULL_ACCESS
ADMIN
SUPER_ADMIN
```

cho Role nghiệp vụ nếu không có yêu cầu rõ ràng.

Nếu một nghiệp vụ chỉ cần:

```text
INVENTORY_VIEW
```

thì không cấp:

```text
INVENTORY_MANAGE
```

Least Privilege phải được áp dụng ở cấp:

* Role.
* Permission.
* Resource.
* Action.
* Scope.

## 14. RBAC Change Control

Mọi thay đổi liên quan đến:

* Role.
* Permission.
* Resource.
* Action.
* Scope.
* Authorization matrix.

phải được kiểm tra ảnh hưởng tới:

```text
Frontend
→ API
→ Business Service
→ Database
→ Audit Log
→ Tests
```

Không được thay đổi RBAC chỉ ở UI mà không kiểm tra server-side authorization.

## 15. RBAC Testing Requirements

Các Role quan trọng phải có test cho:

### Positive cases

```text
Role có Permission
→ Action được phép
```

### Negative cases

```text
Role không có Permission
→ Action bị từ chối
```

### Scope cases

```text
Có Permission nhưng ngoài Scope 
→ Action bị từ chối
```

### Regression cases

```text
Thay đổi Permission A
→ không được vô tình cấp quyền B/C
```

Các kiểm thử cụ thể về:

* IDOR/BOLA.
* Vertical privilege escalation.
* Horizontal privilege escalation.
* Cross-branch access.
* API authorization.

thuộc `05-authorization.md`.

## 16. Evidence Requirement

Khi đánh giá RBAC đã được triển khai, không kết luận chỉ dựa trên:

* Tên Role.
* Menu UI.
* Button bị ẩn.
* Documentation.
* Database column tên `role`.

Phải tìm evidence trong:

```text
Authentication
→ Role resolution
→ Permission resolution
→ Authorization decision
→ Resource scope
→ API enforcement
→ Database enforcement khi cần
→ Security tests
```

Nếu chưa có evidence:

```text
NOT VERIFIED
```

không được suy luận thành:

```text
SECURE
```

## 17. Read-Only RBAC Audit

Khi thực hiện RBAC audit:

1. Discovery.
2. Xác định Roles.
3. Xác định Permissions.
4. Xác định Resources.
5. Xác định Actions.
6. Xác định Scope.
7. Trace từ Identity → Authorization.
8. Kiểm tra API enforcement.
9. Kiểm tra Branch Scope.
10. Kiểm tra privilege escalation.
11. Kiểm tra test evidence.
12. Đưa ra verdict.

Audit phải ưu tiên evidence thực tế.

Không sửa code, database, configuration hoặc permission trong quá trình READ ONLY audit.

## 18. Conflict Rule

Nếu rule này mâu thuẫn với:

```text
00-project-governance.md
01-architecture.md
02-architecture-quality.md
03-security.md
05-authorization.md
```

thì:

1. Security requirement cao hơn convenience.
2. Explicit project requirement cao hơn assumption.
3. Evidence thực tế cao hơn documentation cũ.
4. Không tự ý thay đổi architecture để giải quyết conflict.
5. Ghi nhận conflict và xác minh trước khi thay đổi.

Không được tự động áp dụng một Role hoặc Permission mới nếu chưa có yêu cầu hoặc evidence phù hợp.

## 19. Final Principle

RBAC của PharmaBranch phải bảo đảm:

```text
Clear Role
    ↓
Explicit Permission
    ↓
Defined Resource
    ↓
Defined Action
    ↓
Defined Scope
    ↓
Server-side Authorization
```

Nguyên tắc cuối cùng:

> Người dùng chỉ được thực hiện đúng những nghiệp vụ mà Role + Permission + Scope của họ cho phép.
