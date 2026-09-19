---
name: rbac-security
description: >
  Framework-agnostic guidance, modeling methodology, permission matrix, assignment semantics,
  privilege escalation defense, and verification procedures for the Role-Based Access Control
  (RBAC) model of the PharmaBranch multi-branch pharmacy management system, strictly aligned with
  Rules 00–09 and Evidence-First governance.
---

# SKILL 12 — RBAC SECURITY

## 1. Objective & Scope

### 1.1. Objective

Skill này chuẩn hóa phương pháp luận, mô hình hóa và quy trình xác minh cho hệ thống **Phân quyền theo Vai trò (Role-Based Access Control — RBAC)** trong hệ thống quản lý chuỗi nhà thuốc đa chi nhánh **PharmaBranch**.

Mục tiêu cốt lõi của Skill 12 là đóng vai trò:
> **Chuyên gia mô hình hóa, phân tích và xác minh RBAC (RBAC Modeling, Analysis & Verification Guidance).**

Skill 12 bảo đảm:
1. **Mô hình hóa RBAC chuẩn mực:** Định hình chuỗi logic phân quyền độc lập với công nghệ:
   $$\text{Role} \longrightarrow \text{Permission} \longrightarrow \text{Resource} \longrightarrow \text{Action} \longrightarrow \text{Scope}$$
2. **Phân tích gán quyền và phân tách nhiệm vụ (Role Assignment & SoD):** Xác định cách thức người dùng liên kết với vai trò, ngăn ngừa tự cấp quyền và xung đột trách nhiệm nghiệp vụ.
3. **Phân định ranh giới rạch ròi:** Tách bạch giữa danh tính (Authentication), năng lực vai trò (RBAC capability), phạm vi chi nhánh (Branch scope), kiểm soát truy cập runtime (Authorization), và vòng đời nghiệp vụ (Domain state machine).
4. **Kỷ luật bằng chứng thực tế (Evidence-First Discipline):** Đánh giá vai trò, quyền hạn và ma trận truy cập dựa trên bằng chứng vật lý thực tế, không suy đoán chủ quan.
5. **Trung lập về công nghệ (Technology Neutrality):** Diễn giải ngữ nghĩa phân quyền độc lập với framework, ORM hay thư viện cụ thể.

### 1.2. Scope & Boundaries (Ranh giới sở hữu)

Skill 12 có ranh giới trách nhiệm minh bạch:

- **SKILL 12 SỞ HỮU (OWNS):**
  - Ngữ nghĩa vai trò (Role semantics) và cấu trúc phân rã quyền.
  - Ngữ nghĩa quyền hạn (Permission semantics).
  - Từ vựng tài nguyên ở góc nhìn RBAC (Resource vocabulary in RBAC perspective).
  - Từ vựng hành động ở góc nhìn RBAC (Action vocabulary in RBAC perspective).
  - Ngữ nghĩa phạm vi của quyền (Scope semantics: Global, Branch-scoped, Ownership-scoped).
  - Mối quan hệ giữa Vai trò và Quyền hạn (Role-Permission relationship & matrix analysis).
  - Đánh giá nguyên tắc đặc quyền tối thiểu (Least Privilege analysis).
  - Đánh giá phân tách trách nhiệm (Separation of Duties analysis).
  - Ma trận RBAC (RBAC matrix: Project Evidence Matrix & RBAC Design Matrix).
  - Khả năng truy vết RBAC (RBAC traceability & evidence classification).
  - Các chiều kích kiểm thử đặc thù RBAC (RBAC-specific testing dimensions).
  - Hướng dẫn tái cấu trúc đặc thù RBAC (RBAC-specific refactoring guidance).

- **SKILL 12 TUYỆT ĐỐI KHÔNG SỞ HỮU HOẶC THAY THẾ (DOES NOT OWN OR REPLACE):**
  - Chính sách phân quyền nền tảng và nguyên tắc Deny by Default: thuộc sở hữu của `Rule 04` (RBAC Policy).
  - Cơ chế thực thi kiểm soát truy cập thời gian chạy (Runtime Authorization Enforcement, IDOR/BOLA defense): thuộc sở hữu của `Rule 05` (Authorization).
  - Cơ chế cô lập dữ liệu chi nhánh, SQL Server RLS và session context: thuộc sở hữu của `Rule 06` (Branch Isolation).
  - Tiêu chuẩn an ninh tổng thể, JWT, và quản lý credentials: thuộc sở hữu của `Rule 03` (Security).
  - Toàn vẹn quan hệ cơ sở dữ liệu, khóa chính và ràng buộc schema: thuộc sở hữu của `Rule 07` (Database Integrity) và `Skill 07` (Database SQL Server).
  - Hợp đồng API, URI, DTO, mã lỗi và Problem Details: thuộc sở hữu của `Rule 08` (API Contract) và `Skill 06` (API Design).
  - Đánh giá toàn diện bề mặt tấn công, STRIDE và severity framework: thuộc sở hữu của `Skill 10` (Security Review) và `Rule 03`.
  - Ngữ nghĩa nghiệp vụ bán lẻ thuốc, quy trình và máy trạng thái miền: thuộc sở hữu của `Skill 11` (Pharma Domain).
  - Phương pháp luận và framework kiểm thử chung: thuộc sở hữu của `Skill 08` (Testing).
  - Phương pháp luận vòng lặp xác minh: thuộc sở hữu của `Skill 09` (Verification Loop).
  - Hướng dẫn triển khai kỹ thuật cụ thể: thuộc sở hữu của `Skill 03` (.NET), `Skill 04` (React), `Skill 05` (Flutter).

---

## 2. Priority Hierarchy & Technology Neutrality

### 2.1. Thứ bậc ưu tiên chuẩn tắc (Priority Hierarchy)

Mọi đánh giá, mô hình hóa và khuyến nghị trong Skill 12 phải tuân thủ nghiêm ngặt thứ bậc ưu tiên:

1. `Rules 00–09` (Chuẩn quản trị, an ninh và kiến trúc cao nhất).
2. Yêu cầu nhiệm vụ tường minh (Explicit task requirements).
3. Yêu cầu nghiệp vụ/miền được phê duyệt (Approved business/domain requirements).
4. Kiến trúc được phê duyệt (Approved architecture).
5. Bằng chứng vật lý trong kho lưu trữ (Physical repository evidence).
6. Quy ước hiện có về API / Database / Frontend / Mobile.
7. Bộ kiểm thử hiện có (Existing tests).
8. `Skills 01–11`.
9. Tài liệu kỹ thuật chính thức của công nghệ được chọn.
10. Thực hành tốt chung (Generic best practices).
11. Ý kiến chủ quan của Agent (Agent preference).

> [!CRITICAL]
> **Quy tắc không suy diễn:**
> Không được sử dụng generic RBAC best practice để ghi đè (override) bằng chứng thực tế của dự án.
> Evidence > Assumption.

### 2.2. Tính trung lập về công nghệ (Technology Neutrality)

Skill 12 duy trì tính trung lập hoàn toàn về mặt công nghệ:
- Không áp đặt ASP.NET Core Authorization, Identity, EF Core hay Dapper.
- Không áp đặt Policy-based Authorization, Claims-based Authentication, CASL, OPA, Keycloak, Auth0 hay bất kỳ thư viện phân quyền cụ thể nào.
- Khi các công nghệ trên xuất hiện trong mã nguồn vật lý, chúng chỉ được tiếp cận như các thành phần triển khai cần đánh giá đối chiếu (`when present`, `if applicable`, `according to repository evidence`), không phải yêu cầu tiên quyết do Skill 12 tự đặt ra.

---

## 3. RBAC Ownership Model

Skill 12 thiết lập mô hình sở hữu rõ ràng đối với ngữ nghĩa RBAC:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             RBAC OWNERSHIP MODEL                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ Skill 12 OWNS:                                                              │
│  - WHO can be associated with WHAT capability (Role & Permission semantics) │
│  - Resource & Action vocabulary from RBAC modeling perspective              │
│  - Scope semantics of capabilities (Global vs Branch vs Ownership)          │
│  - Least privilege & Separation of duties analysis                          │
│  - RBAC matrix modeling & evidence classification                           │
│  - RBAC-specific test dimensions & refactoring guidance                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ Skill 12 DOES NOT OWN:                                                      │
│  - Normative RBAC governance/policy (Rule 04)                               │
│  - Runtime authorization enforcement, IDOR, BOLA (Rule 05)                  │
│  - Branch isolation & database RLS enforcement (Rule 06)                    │
│  - API contracts, HTTP codes, DTO schemas (Rule 08 / Skill 06)              │
│  - Database schema, keys, relational integrity (Rule 07 / Skill 07)         │
│  - Authentication, tokens, secret protection (Rule 03)                      │
│  - Full security assessment & vulnerability severity (Skill 10 / Rule 03)   │
│  - Domain business semantics & lifecycle state machines (Skill 11)          │
│  - Implementation technology guidance (Skills 03, 04, 05)                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Ranh giới cốt tử:**
> RBAC trả lời: *"Chủ thể có thể được gắn kết với năng lực gì?"* (WHO can be associated with WHAT capability).  
> Authorization trả lời: *"Hệ thống kiểm soát như thế nào việc người dùng này thực hiện thao tác trên tài nguyên cụ thể vào thời điểm hiện tại?"* (HOW runtime enforcement is executed).  
> RBAC định nghĩa ngữ nghĩa; Runtime Authorization (Rule 05) thực thi chốt chặn bảo vệ.

---

## 4. RBAC Discovery

### 4.1. Quy trình khám phá RBAC theo bằng chứng (Evidence-Based Discovery Process)

Khi tiếp cận một hệ thống hoặc chức năng cần phân quyền, Agent phải thực hiện 5 bước khám phá tuần tự:

```text
[1. Requirement Discovery] ──► Thu thập tài liệu đề tài, luận văn, đặc tả nghiệp vụ
            │
            ▼
[2. Role Discovery]        ──► Xác định danh sách vai trò thực tế có bằng chứng
            │
            ▼
[3. Capability Discovery]  ──► Xác định các năng lực nghiệp vụ cần bảo vệ
            │
            ▼
[4. Boundary Discovery]    ──► Xác định ranh giới chi nhánh, ranh giới tài nguyên
            │
            ▼
[5. Implementation Trace]  ──► Kiểm tra mã nguồn, DB schema, API, UI, test hiện có
```

### 4.2. Khám phá không áp đặt (Non-Presumptive Discovery)

- Không suy đoán vai trò hoặc quyền hạn tồn tại chỉ vì chúng thường thấy trong các hệ thống nhà thuốc khác.
- Phân biệt giữa tài liệu mô tả yêu cầu (`PROJECT-EVIDENCED`) với mã nguồn đã cài đặt (`IMPLEMENTED`) và đã qua kiểm thử (`VERIFIED`).
- Nếu chưa có bằng chứng khám phá cụ thể: ghi nhận trạng thái **`NOT VERIFIED`**.

---

## 5. Role / Permission / Resource / Action / Scope Model

### 5.1. Chuỗi mô hình hóa ngũ phân (Five-Element RBAC Chain)

Mọi quyết định phân quyền trong hệ thống được cấu trúc theo mô hình 5 thành phần:

```text
[Identity / User]
       │
       ▼ (Assigned via Role Assignment)
    [Role]
       │
       ▼ (Possesses Capabilities)
 [Permission] ──► Defines ──► [Resource] + [Action]
       │
       ▼ (Bounded by)
    [Scope]
```

### 5.2. Từ vựng tài nguyên (Resource Vocabulary)

Từ vựng tài nguyên được quan sát dưới góc nhìn mô hình hóa RBAC và phải được đối chiếu với mã nguồn, API và cơ sở dữ liệu:

- `medicine`: Danh mục thuốc, dược phẩm, hoạt chất, quy cách đóng gói.
- `inventory`: Tồn kho thực tế tại kho/chi nhánh, gắn liền với lô và hạn dùng.
- `receipt_note`: Chứng từ tiếp nhận hàng hóa và nhập kho từ nhà cung cấp.
- `sale_order`: Đơn hàng bán lẻ thuốc tại quầy.
- `invoice`: Hóa đơn bán lẻ thuốc chính thức xuất cho khách hàng.
- `return`: Chứng từ hoặc yêu cầu trả hàng, hoàn tiền.
- `expense`: Phiếu đề xuất hoặc phê duyệt chi phí tiền mặt tại chi nhánh.
- `revenue_report`: Báo cáo tài chính, doanh thu, lợi nhuận chi nhánh.
- `staff`: Danh sách nhân viên, tài khoản người dùng tại chi nhánh.
- `audit_log`: Nhật ký theo dõi hoạt động và biến động hệ thống.

> [!NOTE]
> Danh mục tài nguyên trên là từ vựng mô hình hóa tham chiếu (reference modeling vocabulary). Sự tồn tại của tài nguyên trong danh mục không đồng nghĩa tài nguyên đó đã được triển khai hoàn chỉnh ở tầng dữ liệu hay API.

### 5.3. Từ vựng hành động (Action Vocabulary)

Hành động trong RBAC phản ánh các thao tác nghiệp vụ có thể thực thi:

- `VIEW` / `READ`: Tra cứu, xem dữ liệu, không gây tác dụng phụ hay thay đổi số dư.
- `CREATE`: Khởi tạo mới thực thể nghiệp vụ.
- `UPDATE`: Chỉnh sửa dữ liệu của thực thể trong trạng thái cho phép.
- `DELETE`: Xóa hoặc vô hiệu hóa tài nguyên khi được vòng đời nghiệp vụ và chính sách cho phép.
- `APPROVE`: Phê duyệt chứng từ hoặc yêu cầu nhạy cảm.
- `EXPORT`: Xuất dữ liệu ra tệp (Excel, PDF) hoặc in ấn.
- `RECEIVE`: Ghi nhận tiếp nhận hàng hóa thực tế vào kho.
- `ADJUST`: Điều chỉnh số dư tồn kho sau kiểm kê.
- `CANCEL`: Hủy bỏ giao dịch khi chưa hoàn tất.
- `SIGN`: Thao tác ký số hóa đơn điện tử (Skill 12 chỉ mô hình hóa hành động; cơ chế mật mã và toàn vẹn giao dịch do `Rule 03` và `Rule 02` sở hữu).
- `ASSIGN`: Gán vai trò hoặc phân công nhiệm vụ cho người dùng.

---

## 6. Project Roles

### 6.1. Bối cảnh vai trò dự án (Project Role Context)

Theo bối cảnh tài liệu dự án và luận văn tốt nghiệp, hệ thống định hướng ba nhóm chức danh tham chiếu:
- **Chủ nhà thuốc (Pharmacy Owner)**
- **Nhân viên bán thuốc (Sales Staff)**
- **Nhân viên quản lý kho (Warehouse Staff)**

Tương ứng với ba vai trò RBAC vận hành chính trong baseline:
- `OWNER`: Chủ nhà thuốc / Branch Owner
- `SALES`: Nhân viên bán hàng / Sales Staff
- `WAREHOUSE`: Nhân viên kho / Warehouse Staff

> [!IMPORTANT]
> **Quy tắc phân định bằng chứng vai trò (F12-R01):**
> Project context baseline references OWNER (Chủ nhà thuốc / Branch Owner), SALES và WAREHOUSE; actual implementation must be verified from repository evidence.  
> Không được tuyên bố "PharmaBranch chắc chắn có 3 role" như một sự thật hiển nhiên nếu mã nguồn chưa được kiểm chứng vật lý.
> Phải phân biệt rõ:
> - **Confirmed Role:** Vai trò có đầy đủ bằng chứng yêu cầu và bằng chứng triển khai vật lý.
> - **Reference Role:** Vai trò được đề cập trong tài liệu tham khảo hoặc bối cảnh dự án.
> - **Proposed Role:** Vai trò do thiết kế hoặc kỹ sư đề xuất.
> - **Implemented Role:** Vai trò đã xuất hiện trong mã nguồn hoặc cơ sở dữ liệu.
> - **Verified Role:** Vai trò đã được kiểm chứng bằng bằng chứng xác minh phù hợp với scope, có thể bao gồm automated test, implementation trace, runtime evidence hoặc independent verification.
> Nếu mã nguồn chưa chứng minh vai trò: trạng thái triển khai là **`NOT VERIFIED`**.

### 6.2. Xử lý thuật ngữ "MANAGER"

- **Phân định danh xưng và vai trò RBAC (Title vs Role):**
  $$\text{Business title / organizational terminology} \neq \text{RBAC role}$$
- Thuật ngữ "Manager" / "Quản lý" xuất hiện trong tài liệu hoặc cơ cấu tổ chức như một chức danh nghiệp vụ hoặc thuật ngữ quản lý, **KHÔNG** tự động được coi là vai trò RBAC độc lập thứ tư.
- MANAGER **KHÔNG** tự động đồng nhất với OWNER mà không có bằng chứng rõ ràng.
- MANAGER **KHÔNG** tự động được ánh xạ thành một role MANAGER riêng biệt.
- MANAGER có thể xuất hiện dưới dạng chức danh tổ chức, thuật ngữ quản lý hoặc yêu cầu nghiệp vụ. Vai trò RBAC `MANAGER` độc lập chỉ được thiết lập khi và chỉ khi có bằng chứng dự án tường minh (yêu cầu được phê duyệt, schema/database, cấu hình, mã nguồn triển khai hoặc định nghĩa vai trò rõ ràng).

### 6.3. Các vai trò cấm tự ý suy diễn (Forbidden Role Inferences)

Tuyệt đối không đưa các vai trò sau vào mô hình RBAC nếu tài liệu dự án chưa yêu cầu:
- `ADMIN` / `SUPER_ADMIN` (Không tự tạo siêu người dùng đứng ngoài kiểm soát chi nhánh).
- `ACCOUNTANT` (Kế toán).
- `DOCTOR` (Bác sĩ kê đơn).
- `CUSTOMER` (Khách hàng ngoài quầy).

---

## 7. Role Semantics

### 7.1. OWNER (Chủ nhà thuốc / Branch Owner)

- **Ngữ nghĩa nghiệp vụ:** Đại diện cho chủ sở hữu chi nhánh, chịu trách nhiệm quản lý, giám sát vận hành và phê duyệt các hoạt động tài chính/nhân sự tại chi nhánh.
- **Năng lực tham chiếu có bằng chứng từ luận văn:**
  - Quản trị hoạt động và giám sát chi nhánh.
  - Xem báo cáo doanh thu, lợi nhuận, chi phí của chi nhánh.
  - Phê duyệt các yêu cầu chi tiền mặt / chi phí tại chi nhánh.
- **Ranh giới an ninh quan trọng:**
  - `OWNER` **KHÔNG** mặc nhiên có quyền truy cập dữ liệu của chi nhánh khác (tuân thủ `Rule 06`).
  - `OWNER` không được tự ý bypass các bất biến miền, toàn vẹn giao dịch và toàn vẹn cơ sở dữ liệu (`Rule 02`, `Rule 07`). Không tồn tại cơ chế "All-Powerful Owner Bypass".

### 7.2. SALES (Nhân viên bán thuốc / Dược sĩ tư vấn)

- **Ngữ nghĩa nghiệp vụ:** Nhân viên thực hiện tư vấn và bán lẻ thuốc trực tiếp tại quầy thuốc của chi nhánh.
- **Năng lực tham chiếu có bằng chứng từ luận văn:**
  - Tra cứu danh mục thuốc, thông tin hoạt chất, quy cách đóng gói và giá niêm yết.
  - Tra cứu số lượng tồn kho khả dụng phục vụ bán lẻ tại chi nhánh.
  - Tra cứu thông tin khách hàng / bệnh nhân tại quầy.
  - Tạo đơn bán lẻ và lập hóa đơn bán lẻ tại quầy cho khách hàng.
  - Xuất / in hóa đơn bán lẻ.
- **Ràng buộc hạn chế tham chiếu:**
  - Không được sửa đổi đơn giá niêm yết của thuốc.
  - Không được xem báo cáo tài chính / doanh thu tổng hợp của chi nhánh.
  - Không được thực hiện nghiệp vụ tiếp nhận / nhập kho từ nhà cung cấp.

### 7.3. WAREHOUSE (Nhân viên quản lý kho)

- **Ngữ nghĩa nghiệp vụ:** Nhân viên phụ trách bảo quản, kiểm đếm và tiếp nhận hàng hóa tại kho thuốc chi nhánh.
- **Năng lực tham chiếu có bằng chứng từ luận văn:**
  - Toàn quyền tiếp nhận hàng hóa và lập phiếu nhập kho từ nhà cung cấp.
  - Cập nhật hạn sử dụng của thuốc theo lô hàng nhập.
  - Quản lý và theo dõi số lượng tồn kho tại chi nhánh.
- **Ràng buộc hạn chế tham chiếu:**
  - Tuyệt đối không thực hiện nghiệp vụ bán lẻ thuốc tại quầy.
  - Không được xem báo cáo doanh thu tài chính tổng hợp ngoài phạm vi kho.

> [!IMPORTANT]
> **Quy tắc phân định bằng chứng năng lực nghiệp vụ (F12-A07):**  
> Business capability được xác nhận từ tài liệu dự án (`PROJECT-EVIDENCED`) không tự nó chứng minh permission tương ứng đã được triển khai, gán đúng cho role hoặc được thực thi tại runtime (*PROJECT-EVIDENCED business capability does not by itself prove that a corresponding permission exists, is assigned correctly, or is enforced at runtime*).  
> Việc xác nhận năng lực nghiệp vụ chỉ là căn cứ xác định *"What is required"*; việc triển khai permission, gán quyền và chốt chặn runtime phải được kiểm chứng bằng bằng chứng vật lý độc lập.

---

## 8. Permission Model

### 8.1. Cấu trúc và quy ước định danh quyền (Permission Naming)

Quy ước mô hình hóa chuẩn hóa của Skill 12:
$$\text{resource} : \text{action}$$

> [!NOTE]
> Định danh dạng `resource:action` là quy ước mô hình hóa của Skill 12 nhằm phân tích hệ thống. Nếu dự án đã có quy ước đặt tên riêng trong mã nguồn hoặc cơ sở dữ liệu, phải tuân thủ quy ước hiện có của dự án. Không tự động coi các định danh này là quyền đã được triển khai.

### 8.2. Độ mịn của quyền hạn (Permission Granularity)

- Độ mịn của quyền hạn phải được đánh giá dựa trên yêu cầu thực tế, nhu cầu an ninh, bề mặt API và khả năng bảo trì.
- Skill 12 không mặc định quyền hạn bắt buộc phải ở cấp module, cấp màn hình, cấp endpoint hay cấp nút bấm.
- Nếu sử dụng quyền dạng gộp (coarse-grained bundle như `medicine:manage`), phải ghi rõ đây là tập hợp quyền tiện ích phục vụ mô hình hóa, không phải bằng chứng cho thấy mọi hành động con bên dưới đều được phân quyền độc lập.

### 8.3. Danh mục quyền tham chiếu (Reference Permission Catalog)

| Business Capability (Năng lực nghiệp vụ) | Capability Status | Reference Identifier (Định danh tham chiếu) | Identifier Status |
|---|:---:|---|:---:|
| Tra cứu danh mục thuốc, hoạt chất, giá | `PROJECT-EVIDENCED` | `medicine:view` | `DESIGN-PROPOSED` |
| Quản lý danh mục thuốc (coarse-grained bundle) | `DESIGN-PROPOSED` | `medicine:manage` | `DESIGN-PROPOSED` |
| Tra cứu tồn kho khả dụng tại chi nhánh | `PROJECT-EVIDENCED` | `inventory:view` | `DESIGN-PROPOSED` |
| Điều chỉnh số dư kho sau kiểm kê | `DESIGN-PROPOSED` | `inventory:adjust` | `DESIGN-PROPOSED` |
| Tiếp nhận hàng và lập phiếu nhập kho | `PROJECT-EVIDENCED` | `inventory_receipt:create` | `DESIGN-PROPOSED` |
| Phê duyệt phiếu nhập kho chính thức | `DESIGN-PROPOSED` | `inventory_receipt:approve` | `DESIGN-PROPOSED` |
| Tạo đơn bán lẻ tại quầy cho khách | `PROJECT-EVIDENCED` | `sale_order:create` | `DESIGN-PROPOSED` |
| Tra cứu danh sách và chi tiết đơn bán | `PROJECT-EVIDENCED` | `sale_order:view` | `DESIGN-PROPOSED` |
| Lập hóa đơn bán lẻ khi hoàn tất đơn | `PROJECT-EVIDENCED` | `invoice:create` | `DESIGN-PROPOSED` |
| Tra cứu lịch sử hóa đơn bán lẻ | `PROJECT-EVIDENCED` | `invoice:view` | `DESIGN-PROPOSED` |
| Xuất / in hóa đơn cho khách hàng | `PROJECT-EVIDENCED` | `invoice:export` | `DESIGN-PROPOSED` |
| Tiếp nhận yêu cầu đổi trả thuốc | `DESIGN-PROPOSED` | `return:create` | `DESIGN-PROPOSED` |
| Xử lý đổi trả hàng vào kho / hoàn tiền | `DESIGN-PROPOSED` | `return:process` | `DESIGN-PROPOSED` |
| Lập phiếu đề xuất chi tiền mặt | `DESIGN-PROPOSED` | `expense:create` | `DESIGN-PROPOSED` |
| Phê duyệt yêu cầu chi tiền chi nhánh | `PROJECT-EVIDENCED` | `expense:approve` | `DESIGN-PROPOSED` |
| Xem báo cáo doanh thu tổng hợp chi nhánh | `PROJECT-EVIDENCED` | `report:revenue_view` | `DESIGN-PROPOSED` |
| Xem báo cáo xuất nhập tồn kho chi nhánh | `DESIGN-PROPOSED` | `report:inventory_view` | `DESIGN-PROPOSED` |
| Quản lý danh sách nhân sự chi nhánh (bundle) | `DESIGN-PROPOSED` | `staff:manage` | `DESIGN-PROPOSED` |
| Xem nhật ký kiểm toán hệ thống | `DESIGN-PROPOSED` | `audit_log:view` | `DESIGN-PROPOSED` |

---

## 9. Scope Model

### 9.1. Các loại phạm vi dữ liệu (Scope Dimensions)

Phạm vi dữ liệu (Scope) xác định ranh giới mà một quyền có hiệu lực:

1. **Global Scope (`GLOBAL`):** Áp dụng cho các tài nguyên danh mục dùng chung toàn chuỗi (ví dụ: danh mục thuốc chuẩn, hoạt chất), không bị phân tách theo chi nhánh trừ khi mô hình dữ liệu quy định khác.
2. **Branch Scope (`BRANCH-SCOPED`):** Áp dụng cho các tài nguyên nghiệp vụ thuộc sở hữu của một chi nhánh cụ thể (tồn kho, đơn hàng, hóa đơn, phiếu chi, nhân sự).
3. **Resource Ownership Scope (`OWN-RECORD`):** Áp dụng khi quyền hạn bị giới hạn trong các bản ghi do chính người dùng tạo ra (ví dụ: nhân viên chỉ xem đơn bán do mình lập).
4. **Explicit Authorized Scope:** Phạm vi được ủy quyền rõ ràng theo quy định quản trị.

### 9.2. Ranh giới RBAC và Scope

- Skill 12 không mặc định rằng hệ thống bắt buộc phải hỗ trợ toàn bộ các loại scope trên; phạm vi thực tế phải được xác nhận từ schema cơ sở dữ liệu và yêu cầu dự án.
- Có quyền (Permission) không đồng nghĩa có quyền trên toàn bộ dữ liệu. Branch Scope phải được thẩm định và thực thi theo `Rule 06`.

---

## 10. Least Privilege

### 10.1. Nguyên tắc đặc quyền tối thiểu trong RBAC

Mỗi vai trò chỉ được liên kết với những quyền hạn thực sự cần thiết để thực thi trách nhiệm nghiệp vụ được phân công. Không cấp quyền dư thừa vì sự thuận tiện khi triển khai.

### 10.2. Ranh giới đánh giá Least Privilege

- Skill 12 có thể rà soát và đánh giá các vai trò có dấu hiệu thừa quyền, đề xuất thu hồi quyền không cần thiết.
- **Quy tắc kết luận (F12-R06):** Không được tự động kết luận một vai trò "chắc chắn vi phạm Least Privilege" nếu chưa có mô hình quyền được phê duyệt hoặc yêu cầu an ninh làm cơ sở đối chiếu.
- Khi bằng chứng chưa đầy đủ, phải sử dụng các thuật ngữ thận trọng: *"potential least-privilege issue"* hoặc *"requires review"*.

---

## 11. Separation of Duties

### 11.1. Nguyên tắc phân tách trách nhiệm (SoD)

Các nghiệp vụ nhạy cảm hoặc tiềm ẩn rủi ro gian lận/sai sót phải được phân bổ cho các vai trò khác nhau nhằm bảo đảm kiểm soát chéo.

### 11.2. Ranh giới đánh giá SoD

- **Phân tách tham chiếu từ luận văn:** Phân định giữa Bán lẻ thuốc (`SALES`) và Nhập kho/quản lý tồn kho (`WAREHOUSE`).
- **Phân tách đề xuất mô hình hóa (Illustrative Proposals):**
  - Người lập phiếu chi không tự phê duyệt phiếu chi của mình.
  - Nhân viên kho lập biên bản kiểm kê; quản lý chi nhánh phê duyệt điều chỉnh số dư sổ sách.
- **Quy tắc kết luận (F12-R07):** Các ví dụ trên là minh họa (`Illustrative / Reference`), không tự động coi là quy tắc kinh doanh bắt buộc nếu tài liệu dự án chưa xác nhận. Ngữ nghĩa nghiệp vụ thuộc `Skill 11`; chính sách thuộc `Rule 04`.

---

## 12. Role-Permission Matrix

> [!IMPORTANT]
> **Ranh giới tính chất của Ma trận (F12-R05):**
> Rule-Permission Matrix không tự động trở thành sự thật triển khai chỉ vì Skill 12 trình bày bảng.
> - Bảng có nguồn gốc từ luận văn/đặc tả: ghi rõ `PROJECT-EVIDENCED`.
> - Bảng do Skill 12 đề xuất: đánh dấu rõ `Illustrative RBAC Matrix` hoặc `Reference Matrix — requires project confirmation`.

### 12.1. Ma trận Năng lực Nghiệp vụ Dự án (Project Evidence Matrix)

| Vai trò (Role) | Năng lực nghiệp vụ được xác nhận (Business Capability) | Quyết định dự án | Nguồn bằng chứng (Evidence Source) | Trạng thái bằng chứng |
|---|---|:---:|---|:---:|
| **SALES** | Tra cứu danh mục thuốc, hoạt chất, giá niêm yết | `ALLOW` | Luận văn tốt nghiệp | `PROJECT-EVIDENCED` |
| **SALES** | Tra cứu tồn kho khả dụng phục vụ bán hàng | `ALLOW` | Luận văn tốt nghiệp | `PROJECT-EVIDENCED` |
| **SALES** | Tra cứu thông tin bệnh nhân / khách hàng | `ALLOW` | Luận văn tốt nghiệp | `PROJECT-EVIDENCED` |
| **SALES** | Tạo đơn bán lẻ và xuất hóa đơn bán lẻ | `ALLOW` | Luận văn tốt nghiệp | `PROJECT-EVIDENCED` |
| **SALES** | In / xuất hóa đơn cho khách hàng | `ALLOW` | Luận văn tốt nghiệp | `PROJECT-EVIDENCED` |
| **SALES** | Sửa đơn giá niêm yết của thuốc | `DENY` | Luận văn tốt nghiệp | `PROJECT-EVIDENCED` |
| **SALES** | Xem báo cáo tài chính / doanh thu chi nhánh | `DENY` | Luận văn tốt nghiệp | `PROJECT-EVIDENCED` |
| **SALES** | Nhập kho, duyệt phiếu nhập từ nhà cung cấp | `DENY` | Luận văn tốt nghiệp | `PROJECT-EVIDENCED` |
| **WAREHOUSE** | Tra cứu danh mục thuốc và xem tồn kho chi tiết | `ALLOW` | Luận văn tốt nghiệp | `PROJECT-EVIDENCED` |
| **WAREHOUSE** | Toàn quyền tiếp nhận hàng và lập phiếu nhập kho | `ALLOW` | Luận văn tốt nghiệp | `PROJECT-EVIDENCED` |
| **WAREHOUSE** | Cập nhật hạn dùng theo lô thuốc nhập kho | `ALLOW` | Luận văn tốt nghiệp | `PROJECT-EVIDENCED` |
| **WAREHOUSE** | Bán lẻ thuốc tại quầy, lập hóa đơn bán lẻ | `DENY` | Luận văn tốt nghiệp | `PROJECT-EVIDENCED` |
| **WAREHOUSE** | Xem báo cáo tài chính / doanh thu chi nhánh | `DENY` | `Rule 04` Mục 4.3 (Policy Authority) | `POLICY-EVIDENCED` |
| **OWNER** | Quản lý thông tin chi nhánh và nhân sự | `ALLOW` | Luận văn tốt nghiệp / `Rule 04` Mục 4.1 | `PROJECT-EVIDENCED` |
| **OWNER** | Xem báo cáo doanh thu, chi phí chi nhánh | `ALLOW` | Luận văn tốt nghiệp | `PROJECT-EVIDENCED` |
| **OWNER** | Phê duyệt các yêu cầu chi tiền chi nhánh | `ALLOW` | Luận văn tốt nghiệp | `PROJECT-EVIDENCED` |
| **OWNER** | Thao tác trên dữ liệu của chi nhánh khác | `DENY` | `Rule 04` Mục 4.1, `Rule 06` (Policy Authority) | `POLICY-EVIDENCED` |

### 12.2. Ma trận Phân quyền Mô hình hóa Tham chiếu (Illustrative RBAC Design Matrix)

Chuẩn hóa các quyết định đề xuất: **`PROPOSED-ALLOW`**, **`PROPOSED-DENY`**, **`NOT-DEFINED`**.

| Role | Normalized Permission | Scope | Proposed Decision | Evidence Status |
|---|---|---|:---:|:---:|
| **OWNER** | `medicine:view` | `GLOBAL` | `PROPOSED-ALLOW` | `DESIGN-PROPOSED` |
| **OWNER** | `medicine:manage` | `GLOBAL` | `NOT-DEFINED` | `DESIGN-PROPOSED` |
| **OWNER** | `inventory:view` | `BRANCH-SCOPED` | `PROPOSED-ALLOW` | `DESIGN-PROPOSED` |
| **OWNER** | `inventory:adjust` | `BRANCH-SCOPED` | `NOT-DEFINED` | `DESIGN-PROPOSED` |
| **OWNER** | `sale_order:create` | `BRANCH-SCOPED` | `PROPOSED-ALLOW` | `DESIGN-PROPOSED` |
| **OWNER** | `invoice:create` | `BRANCH-SCOPED` | `PROPOSED-ALLOW` | `DESIGN-PROPOSED` |
| **OWNER** | `expense:approve` | `BRANCH-SCOPED` | `PROPOSED-ALLOW` | `DESIGN-PROPOSED` |
| **OWNER** | `report:revenue_view` | `BRANCH-SCOPED` | `PROPOSED-ALLOW` | `DESIGN-PROPOSED` |
| **SALES** | `medicine:view` | `GLOBAL` | `PROPOSED-ALLOW` | `DESIGN-PROPOSED` |
| **SALES** | `inventory:view` | `BRANCH-SCOPED` | `PROPOSED-ALLOW` | `DESIGN-PROPOSED` |
| **SALES** | `sale_order:create` | `BRANCH-SCOPED` | `PROPOSED-ALLOW` | `DESIGN-PROPOSED` |
| **SALES** | `invoice:create` | `BRANCH-SCOPED` | `PROPOSED-ALLOW` | `DESIGN-PROPOSED` |
| **SALES** | `invoice:export` | `BRANCH-SCOPED` | `PROPOSED-ALLOW` | `DESIGN-PROPOSED` |
| **SALES** | `inventory_receipt:create` | `BRANCH-SCOPED` | `PROPOSED-DENY` | `DESIGN-PROPOSED` |
| **SALES** | `report:revenue_view` | `BRANCH-SCOPED` | `PROPOSED-DENY` | `DESIGN-PROPOSED` |
| **WAREHOUSE** | `medicine:view` | `GLOBAL` | `PROPOSED-ALLOW` | `DESIGN-PROPOSED` |
| **WAREHOUSE** | `inventory:view` | `BRANCH-SCOPED` | `PROPOSED-ALLOW` | `DESIGN-PROPOSED` |
| **WAREHOUSE** | `inventory_receipt:create` | `BRANCH-SCOPED` | `PROPOSED-ALLOW` | `DESIGN-PROPOSED` |
| **WAREHOUSE** | `sale_order:create` | `BRANCH-SCOPED` | `PROPOSED-DENY` | `DESIGN-PROPOSED` |
| **WAREHOUSE** | `invoice:create` | `BRANCH-SCOPED` | `PROPOSED-DENY` | `DESIGN-PROPOSED` |
| **WAREHOUSE** | `report:revenue_view` | `BRANCH-SCOPED` | `PROPOSED-DENY` | `DESIGN-PROPOSED` |

---

## 13. Role Lifecycle

### 13.1. Vòng đời và kiến trúc phân cấp vai trò (Role Hierarchy)

- **Quy tắc không mặc định kế thừa (F12-R08):** Skill 12 không mặc định hệ thống có cấu trúc kế thừa vai trò (Hierarchical RBAC, Parent-Child Roles, hay Wildcard permissions).
- Tuyệt đối không tự suy diễn cấu trúc: `OWNER > MANAGER > SALES > WAREHOUSE`.
- Mọi đề xuất về Role Hierarchy phải được đánh dấu rõ ràng: *"Optional design requiring explicit architectural/business approval"*.

### 13.2. Không áp đặt Policy Engine phức tạp (F12-R09)

- Không mặc định dự án sử dụng ABAC, ReBAC, PBAC hay các policy engine phức tạp (như OPA, CASL).
- Nếu kho lưu trữ chưa có bằng chứng, chúng chỉ được đề cập như giải pháp kiến trúc tiềm năng có thể xem xét nếu được phê duyệt.

---

## 14. Permission Assignment

### 14.1. Cơ chế gán quyền người dùng (User-to-Role Assignment)

$$\text{User Identity} \overset{\text{Role Assignment}}{\longrightarrow} \text{Role} \overset{\text{Scoped by}}{\longrightarrow} \text{Branch Context}$$

- **Số lượng vai trò của người dùng (Cardinality):** Mặc dù tài liệu có thể mô tả chức danh chính, cấu trúc vật lý (1-1 hay 1-n) phải được đối chiếu từ schema cơ sở dữ liệu thực tế. Hiện trạng: **`NOT VERIFIED IN CODE`**.
- **Thẩm quyền gán vai trò:** Thẩm quyền gán vai trò phải tuân theo chính sách RBAC được quy định tại `Rule 04` và các yêu cầu được phê duyệt của dự án.
- **Phòng chống tự cấp quyền (Self-Assignment Defense):** Skill 12 phải rà soát khả năng self-assignment hoặc self-escalation của role/permission; nếu chính sách áp dụng cấm hành vi này, runtime enforcement phải ngăn chặn theo `Rule 05`.

---

## 15. Authentication vs RBAC vs Authorization

### 15.1. Phân định ba ranh giới an ninh nền tảng (F12-R02, F12-R10)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. AUTHENTICATION (Rule 03 / Skill 03)                                      │
│    "Who are you?" ──► Xác minh danh tính chủ thể dựa trên thông tin xác thực│
│    (Token hợp lệ KHÔNG ĐỒNG NGHĨA với việc có quyền thực thi thao tác).     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. RBAC MODELING (Rule 04 / Skill 12)                                       │
│    "What capabilities are associated with your role?"                       │
│    ──► Ánh xạ vai trò sang các quyền hạn tĩnh (Capabilities).               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. RUNTIME AUTHORIZATION (Rule 05 / Rule 06)                                │
│    "Are you allowed to perform THIS action on THIS resource in THIS context?│
│    ──► Thẩm định quyền hạn + Phạm vi chi nhánh + Quyền sở hữu (IDOR) +      │
│        Trạng thái thực thể thời gian chạy.                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

> [!CRITICAL]
> **Quy tắc bất biến:**
> Login thành công $\neq$ Authorized.  
> JWT hợp lệ $\neq$ RBAC verified.  
> Có Permission $\neq$ Được phép thao tác trên mọi dữ liệu.

---

## 16. Runtime Authorization Boundary

### 16.1. Ranh giới giữa mô hình RBAC và thực thi thời gian chạy

- RBAC định nghĩa năng lực vai trò; việc bảo đảm an toàn cho các API và dữ liệu thực tế thuộc trách nhiệm của tầng **Runtime Authorization** theo `Rule 05`.
- Tránh các phát biểu sai lầm: *"RBAC bảo đảm API không bị truy cập trái phép"*.
- Phát biểu chuẩn xác: *"RBAC định nghĩa ngữ nghĩa vai trò và quyền hạn; tầng Runtime Authorization phải thực thi các quyền áp dụng theo Rule 05"*.
- Việc từ chối truy cập thời gian chạy (Deny by Default) khi thiếu quyền, sai trạng thái, hoặc vượt quyền thuộc thẩm quyền của `Rule 05`.

---

## 17. Branch Scope Boundary

### 17.1. Phân định RBAC và Cô lập Chi nhánh (F12-R03)

- **RBAC trả lời:** WHO / WHAT capability (Ai có năng lực gì).
- **Branch Isolation trả lời:** WHICH DATA / WHICH BRANCH (Dữ liệu nào, chi nhánh nào được phép truy cập).
- Việc sở hữu quyền (ví dụ: `invoice:create`) **KHÔNG CÓ NGHĨA** người dùng được tạo hóa đơn cho mọi chi nhánh.
- Ngữ cảnh chi nhánh bắt buộc phải bắt nguồn từ server-side identity đã xác thực và được thực thi theo `Rule 06`.
- Tuyệt đối không xem mệnh đề `WHERE chi_nhanh_id = @branchId` là một quy tắc RBAC phổ quát; cơ chế SQL Server RLS và session context thuộc thẩm quyền sở hữu độc quyền của `Rule 06`.

---

## 18. Privilege Escalation / IDOR / BOLA

### 18.1. Rủi ro leo thang đặc quyền trong RBAC (F12-R15)

Skill 12 nhận diện các bề mặt rủi ro liên quan đến RBAC:
1. **Leo thang đặc quyền dọc (Vertical Escalation):**
   - Client giả mạo payload để gán vai trò cao hơn (`role: "OWNER"`).
   - Người dùng tự nâng quyền hoặc gán thêm quyền cho chính mình.
2. **Leo thang đặc quyền ngang (Horizontal Escalation):**
   - Người dùng chi nhánh A tìm cách thao tác trên tài nguyên của chi nhánh B.
3. **Nhầm lẫn vai trò (Role Confusion) và bỏ qua quyền (Permission Bypass).**

### 18.2. Ranh giới thẩm quyền với Security Review

- Skill 12 nhận diện các rủi ro ngữ nghĩa RBAC.
- Việc thực thi chốt chặn chống IDOR/BOLA thời gian chạy thuộc `Rule 05`.
- Việc đánh giá toàn diện bề mặt lỗ hổng, xếp hạng rủi ro và xác định mức độ nghiêm trọng (Severity: CRITICAL, HIGH, MEDIUM, LOW) thuộc sở hữu của `Rule 03` và phương pháp luận của `Skill 10`. Skill 12 không tự định nghĩa thang đo an ninh riêng.

---

## 19. API Integration

### 19.1. Ánh xạ RBAC sang năng lực API (F12-R12)

- Skill 12 có thể ánh xạ giữa Permission và năng lực mà API cung cấp (ví dụ: `invoice:create` tương ứng với thao tác lập hóa đơn).
- **Ranh giới hợp đồng API:** Skill 12 **KHÔNG TỰ ĐỊNH NGHĨA HỢP ĐỒNG API**.
- Không tự ý gán cứng định dạng đường dẫn URI, tên DTO, mã trạng thái HTTP (`401`, `403`, `404`, `422`), phân trang hay cấu trúc Problem Details nếu chưa được `Rule 08` (API Contract) và `Skill 06` (API Design) xác nhận. Mọi mã lỗi HTTP xuất hiện trong tài liệu chỉ mang tính chất minh họa.

---

## 20. Frontend / Mobile UX vs Security

### 20.1. Ranh giới hiển thị giao diện và chốt chặn an ninh (F12-R11)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ FRONTEND / MOBILE UI (Skill 04 / Skill 05)                                  │
│  - Ẩn menu, vô hiệu hóa nút bấm (disabled button), route guard.             │
│  - Mục đích: Tối ưu hóa trải nghiệm người dùng (UX Presentation).           │
│  - Mức độ tin cậy: UNTRUSTED. Client không phải là chốt chặn bảo mật.      │
├─────────────────────────────────────────────────────────────────────────────┤
│ BACKEND / SERVER RUNTIME AUTHORIZATION (Rule 05)                            │
│  - Kiểm tra và thực thi thẩm quyền tại runtime theo authorization boundary   │
│    được Rule 05 và kiến trúc được phê duyệt xác định (các vị trí như         │
│    controller/service chỉ là illustrative implementation locations).         │
│  - Mục đích: Bảo vệ dữ liệu và toàn vẹn hệ thống (Security Enforcement).   │
│  - Mức độ tin cậy: AUTHORITATIVE & TRUSTED. Chốt chặn bắt buộc.             │
└─────────────────────────────────────────────────────────────────────────────┘
```

> [!CAUTION]
> **Cảnh báo an ninh cốt tử:**
> Nút bấm bị ẩn không đồng nghĩa với việc hành động đã được bảo vệ an toàn.
> Frontend route guard không thay thế được backend runtime authorization.

---

## 21. RBAC Testing

### 21.1. Các chiều kích kiểm thử RBAC (F12-R16)

Skill 12 định nghĩa các chiều kích kiểm thử cần xác minh đối với mô hình phân quyền:

1. **Role-Permission Positive Scenarios:** Kiểm tra người dùng sở hữu vai trò hợp lệ thực hiện hành động được cho phép; expected outcome phải được xác nhận theo Rule 04, Rule 05 và requirements.
2. **Unauthorized Role Scenarios:** Kiểm tra hành vi của vai trò không có permission đối với hành động tương ứng; expected outcome phải được xác định theo Rule 04, Rule 05, Rule 08 và requirements áp dụng.
3. **Missing Role Scenarios:** Kiểm tra trường hợp tài khoản chưa được gán vai trò truy cập tài nguyên bảo vệ; expected outcome phải được xác định theo Rule 04, Rule 05 và kiến trúc bảo mật.
4. **Privilege Escalation Scenarios:** Kiểm tra các nỗ lực can thiệp tham số role hoặc tự gán quyền (self-assignment/self-escalation); expected outcome phải được xác định theo Rule 04 và Rule 05.
5. **Cross-Role Access Scenarios:** Kiểm tra vai trò này thực thi thao tác thuộc thẩm quyền độc quyền của vai trò khác; expected outcome phải được xác định theo Rule 04 và Rule 05.
6. **Cross-Branch Access Scenarios:** Kiểm tra các nỗ lực truy cập ngoài branch scope đối với các tài nguyên branch-scoped; expected outcome phải được xác định theo Rule 05, Rule 06, requirements và implementation evidence.
7. **UI / API Mismatch Scenarios:** Kiểm tra việc bypass UI bằng cách tương tác trực tiếp với API/runtime boundary; expected outcome phải được xác định theo Rule 05, Rule 08 và implementation evidence.

> [!NOTE]
> Các kịch bản kiểm thử trên mang tính chất minh họa phương pháp luận. Skill 12 không gán cứng mã lỗi HTTP mong đợi; kết quả thẩm định thực tế phải xuất phát từ `Rule 04`, `Rule 05`, `Rule 06`, `Rule 08` và bộ test hiện có.
> Phương pháp luận kiểm thử tổng thể thuộc sở hữu của `Skill 08`.

---

## 22. Evidence & Traceability

### 22.1. Mười nhóm bằng chứng chuẩn hóa (Ten Evidence Categories - F12-R17)

Skill 12 hỗ trợ 10 nhóm nguồn bằng chứng phục vụ đánh giá:
1. **Requirement Evidence:** Luận văn tốt nghiệp, hồ sơ yêu cầu nghiệp vụ chính thức.
2. **Business / Domain Evidence:** Ngữ nghĩa quy trình và thực thể kinh doanh.
3. **RBAC Design Evidence:** Hồ sơ thiết kế kiến trúc phân quyền được duyệt.
4. **API Evidence:** Đặc tả API, endpoint routing và controller definitions.
5. **Implementation Evidence:** Mã nguồn vật lý trong repository (`.cs`, `.tsx`, `.dart`).
6. **Configuration Evidence:** Tệp cấu hình, appsettings, database seed scripts.
7. **Test Evidence:** Bộ kiểm thử tự động, unit tests, integration tests.
8. **Runtime Evidence:** Nhật ký thực thi, audit trail thời gian chạy.
9. **Documentation Evidence:** Tài liệu hướng dẫn kỹ thuật, sơ đồ tham khảo.
10. **Assumption:** Giả định kỹ thuật khi bằng chứng chưa đầy đủ (bắt buộc phải ghi rõ giả định).

### 22.2. Sáu trạng thái bằng chứng (Six Evidence Statuses - F12-R18)

```text
NOT FOUND   ≠   NOT IMPLEMENTED
NOT VERIFIED   ≠   FAIL
PROPOSED   ≠   IMPLEMENTED
DESIGNED   ≠   IMPLEMENTED
IMPLEMENTED   ≠   VERIFIED
```

- **`NOT FOUND`:** Chưa tìm thấy tại vị trí tra cứu ban đầu; không đồng nghĩa là chưa làm.
- **`NOT VERIFIED`:** Chưa thu thập đủ bằng chứng khách quan để kết luận.
- **`PROPOSED`:** Đề xuất kỹ thuật đang chờ xem xét.
- **`DESIGNED`:** Đã có trong tài liệu thiết kế nhưng chưa chứng minh bằng mã nguồn.
- **`IMPLEMENTED`:** Đã có mã nguồn vật lý trong kho lưu trữ.
- **`VERIFIED`:** Đã được kiểm chứng bằng bằng chứng xác minh phù hợp với phạm vi và tiêu chí đánh giá; bằng chứng có thể bao gồm implementation trace, runtime evidence, test evidence, configuration evidence hoặc independent verification tùy trường hợp. Verification phải được đánh giá theo scope; không yêu cầu mọi loại bằng chứng phải đồng thời tồn tại.

---

## 23. RBAC Refactoring

### 23.1. Quy tắc tái cấu trúc an toàn (Safe Refactoring Discipline)

Khi đề xuất hoặc thực hiện tái cấu trúc mô hình RBAC:
1. **Tuyệt đối không tự ý sửa code:** Không refactor chỉ dựa trên suy đoán hoặc chỉ dựa vào ma trận tham chiếu của Skill 12.
2. **Tuân thủ quy trình 9 bước:**
   - Bước 1: Khám phá hiện trạng (Discover).
   - Bước 2: Truy vết vai trò (Trace role).
   - Bước 3: Truy vết quyền hạn (Trace permission).
   - Bước 4: Truy vết cơ chế gán quyền (Trace assignment).
   - Bước 5: Truy vết thực thi runtime (Trace runtime authorization).
   - Bước 6: Truy vết phạm vi chi nhánh (Trace branch scope).
   - Bước 7: Phân tích phạm vi ảnh hưởng (Identify impact).
   - Bước 8: Đề xuất thay đổi tối thiểu (Propose minimal change).
   - Bước 9: Xác định bằng chứng kiểm chứng (Define verification evidence).

---

## 24. RBAC Quality Checklist

Bảng kiểm tra chất lượng đồng bộ với 20 tiêu chuẩn của Skill 12:

- [ ] **Role Evidence (F12-R01):** Bối cảnh vai trò được mô tả trung thực (OWNER, SALES, WAREHOUSE; MANAGER không tự động là vai trò thứ tư); phân định rõ Reference Role vs Confirmed Role; không tuyên bố đã triển khai nếu thiếu bằng chứng.
- [ ] **RBAC vs Authorization (F12-R02):** Tách bạch rõ ranh giới: RBAC định nghĩa WHO/WHAT capability; Runtime Authorization (Rule 05) thực thi kiểm soát thời gian chạy.
- [ ] **Branch Isolation Boundary (F12-R03):** Không đồng nhất RBAC với Branch Isolation; không hard-code câu lệnh SQL; phạm vi chi nhánh do Rule 06 sở hữu.
- [ ] **Permission Evidence (F12-R04):** Định danh quyền được gắn nhãn đề xuất/tham chiếu rõ ràng, không coi là quyền đã triển khai.
- [ ] **Role-Permission Matrix (F12-R05):** Ma trận thiết kế được đánh dấu rõ ràng là Illustrative / Reference; ma trận dự án ghi rõ nguồn bằng chứng.
- [ ] **Least Privilege Evaluation (F12-R06):** Đánh giá thận trọng; sử dụng "potential issue" / "requires review" khi chưa đủ căn cứ; không phán xét tùy tiện.
- [ ] **Separation of Duties (F12-R07):** Phân tách trách nhiệm được phân loại rõ giữa bằng chứng dự án và đề xuất tham khảo; không tự tạo luật kinh doanh.
- [ ] **Role Hierarchy Boundary (F12-R08):** Không mặc định có thừa kế vai trò; không tự tạo cây phân cấp nếu chưa có bằng chứng phê duyệt.
- [ ] **Policy Engine Neutrality (F12-R09):** Không áp đặt ABAC, ReBAC, CASL, OPA hay policy engine cụ thể.
- [ ] **Authentication Boundary (F12-R10):** Phân biệt danh tính (AuthN), năng lực vai trò (RBAC), và kiểm soát truy cập runtime (AuthZ).
- [ ] **UI vs Security Boundary (F12-R11):** Ẩn nút/menu chỉ là UX presentation; server-side authorization là chốt chặn bắt buộc.
- [ ] **API Boundary (F12-R12):** Không tự định nghĩa hợp đồng API; mã lỗi HTTP và DTO thuộc sở hữu của Rule 08 và Skill 06.
- [ ] **Resource/Action Vocabulary (F12-R13):** Từ vựng mô hình hóa được định nghĩa trung lập, tuân thủ quy ước hiện có của dự án.
- [ ] **Permission Granularity (F12-R14):** Đánh giá độ mịn linh hoạt theo nhu cầu an ninh và kiến trúc, không ép buộc một cấp độ duy nhất.
- [ ] **Privilege Escalation Boundary (F12-R15):** Nhận diện rủi ro leo thang quyền trong RBAC; ủy thác runtime enforcement cho Rule 05 và severity cho Rule 03 / Skill 10.
- [ ] **Testing Semantics (F12-R16):** Kịch bản kiểm thử mang tính minh họa phương pháp luận; không gán cứng mã lỗi; thuộc sở hữu của Skill 08.
- [ ] **Evidence Classification (F12-R17):** Hỗ trợ đầy đủ 10 nhóm nguồn bằng chứng; phân định rõ tài liệu quy chuẩn và bằng chứng dự án.
- [ ] **Status Model (F12-R18):** Tuân thủ 6 trạng thái chuẩn tắc (NOT FOUND, NOT VERIFIED, PROPOSED, DESIGNED, IMPLEMENTED, VERIFIED).
- [ ] **Security Severity Boundary (F12-R19):** Tuân thủ thang đo mức độ nghiêm trọng của Rule 03 / Skill 10, không tự tạo thang đo an ninh riêng.
- [ ] **Technology Neutrality & Cross-Skill (F12-R20):** Không ép buộc công nghệ cụ thể; tôn trọng ranh giới sở hữu của Rules 00–09 và Skills 01–11.

---

## 25. Governance & Cross-Skill Boundary

### 25.1. Bảng phân định thẩm quyền liên kỹ năng (Cross-Skill Boundary Matrix)

| Quy chuẩn / Kỹ năng | Thẩm quyền sở hữu độc quyền (Exclusive Ownership) | Trách nhiệm của Skill 12 (Skill 12 Responsibility) | Phân định ranh giới không chồng lấn |
|---|---|---|---|
| **Rule 00** | Quản trị dự án, thứ bậc ưu tiên, kỷ luật bằng chứng | Tuân thủ thứ bậc ưu tiên và kỷ luật Evidence-First | Skill 12 không tự đặt ra quy tắc quản trị dự án |
| **Rule 01** | Kiến trúc hệ thống, ranh giới tầng Client-Server | Mô hình hóa RBAC phù hợp kiến trúc được duyệt | Skill 12 không quyết định cấu trúc tầng kiến trúc |
| **Rule 02** | Bất biến giao dịch, kiểm soát đồng thời, chữ ký số | Tôn trọng toàn vẹn giao dịch, OWNER không được bypass | Skill 12 không quản lý transaction hay locking |
| **Rule 03** | An ninh tổng thể, JWT, quản lý secret, severity framework | Tiếp nhận thông tin xác thực để phân tích quyền | Skill 12 không quản lý JWT, mã hóa hay tự đặt severity |
| **Rule 04** | Chính sách RBAC quy chuẩn (Normative RBAC Policy) | Mô hình hóa, phân tích vai trò, quyền hạn, phạm vi | Rule 04 sở hữu chính sách; Skill 12 không override Rule 04 |
| **Rule 05** | Thực thi kiểm soát truy cập runtime (Runtime Enforcement) | Cung cấp năng lực tĩnh làm đầu vào thẩm định quyền | Rule 05 sở hữu runtime enforcement, IDOR, BOLA, state checks |
| **Rule 06** | Cô lập dữ liệu chi nhánh, SQL Server RLS, session context | Mô hình hóa phạm vi chi nhánh trong phân quyền | Rule 06 sở hữu cô lập chi nhánh và SQL RLS |
| **Rule 07** | Toàn vẹn cơ sở dữ liệu, khóa chính, ràng buộc quan hệ | Tôn trọng ràng buộc DB, không bypass kiểm tra DB | Skill 12 không quản lý schema hay ràng buộc SQL |
| **Rule 08** | API contract policy, contract-level semantics, response/error contract và HTTP semantics theo policy | Cung cấp yêu cầu năng lực làm đầu vào cho API | Rule 08 sở hữu API contract policy; Skill 12 không quyết định HTTP contract |
| **Rule 09** | Khả năng quan sát, structured logging, audit sinks | Nhận diện sự kiện phân quyền nhạy cảm cần kiểm toán | Rule 09 cấu hình logging sinks và telemetry |
| **Skill 03** | Hướng dẫn triển khai .NET backend | Cung cấp mô hình phân quyền cho việc hiện thực hóa | Skill 03 hướng dẫn triển khai mã nguồn .NET khi được chọn |
| **Skill 04** | Hướng dẫn triển khai React web frontend | Đánh giá vai trò phục vụ trải nghiệm người dùng (UX) | Skill 04 triển khai UI; Skill 12 nhắc nhở UI không phải security boundary |
| **Skill 05** | Hướng dẫn triển khai Flutter mobile | Đánh giá vai trò phục vụ UX trên thiết bị di động | Skill 05 triển khai mobile UI; an ninh thuộc server |
| **Skill 06** | API resource/endpoint design và API-specific implementation concerns | Đề xuất quyền logic cho các API endpoints | Skill 06 thiết kế API theo chuẩn Rule 08 |
| **Skill 07** | Hướng dẫn triển khai cơ sở dữ liệu SQL Server | Đề xuất mô hình dữ liệu quan hệ cho User-Role | Skill 07 hiện thực hóa DB; không sở hữu chính sách |
| **Skill 08** | Phương pháp luận và framework kiểm thử chung | Định nghĩa WHAT SHOULD BE VERIFIED cho RBAC | Skill 08 sở hữu kỹ thuật, công cụ và cách viết test (HOW) |
| **Skill 09** | Phương pháp luận vòng lặp xác minh | Đóng vai trò chuyên gia phân tích RBAC trong vòng lặp | Skill 12 không điều phối chu trình xác minh đa tầng |
| **Skill 10** | Đánh giá an ninh toàn diện, STRIDE, kiểm toán lỗ hổng | Nhận diện bề mặt rủi ro ngữ nghĩa RBAC | Skill 10 sở hữu đánh giá lỗ hổng và severity an ninh |
| **Skill 11** | Ngữ nghĩa nghiệp vụ dược, thực thể, máy trạng thái miền | Ánh xạ vai trò tương tác vào quy trình nghiệp vụ | Skill 11 sở hữu ý nghĩa kinh doanh và vòng đời thực thể |
| **Skill 12** | Mô hình hóa, phân tích ma trận và xác minh RBAC | **Chuyên gia mô hình hóa, phân tích và xác minh RBAC** | **Trọng tâm duy nhất của Skill 12** |

---

### 25.2. Trạng thái hoàn thành kiểm tra chất lượng

> [!NOTE]
> Bảng tự kiểm tra chất lượng và phân định ranh giới trên là quy trình rà soát nội bộ phục vụ Micro-Revision.
> Theo nguyên tắc Evidence-First, Skill 12 không tự cấp chứng chỉ hoàn thiện (self-certification) hay tuyên bố PASS / FROZEN.

**Trạng thái hoàn thành:** READY FOR FINAL AUDIT
