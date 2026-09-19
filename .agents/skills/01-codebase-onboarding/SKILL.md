---
name: codebase-onboarding
description: >
  Khảo sát và lập bản đồ toàn bộ codebase PharmaBranch trước khi thực hiện thay đổi. 
  Dùng khi Agent bắt đầu làm việc với repository, chưa hiểu kiến trúc, hoặc cần xác định module, dependency, API database, frontend, mobile và các ràng buộc hiện có.
---

# Codebase Onboarding

## 1. Mục tiêu

Trước khi sửa, thêm hoặc xóa bất kỳ code nào, Agent phải hiểu được cấu trúc và kiến trúc hiện tại của hệ thống.

Mục tiêu của onboarding:

1. Xác định cấu trúc repository.
2. Xác định các application/client/server.
3. Xác định framework và runtime.
4. Xác định database và data-access strategy.
5. Xác định API architecture.
6. Xác định authentication và authorization hiện tại.
7. Xác định các module nghiệp vụ.
8. Xác định dependency giữa các layer.
9. Xác định coding conventions hiện có.
10. Xác định các Rules và Skills đang áp dụng.
11. Xác định các điểm chưa rõ trước khi thay đổi code.

Không được giả định kiến trúc nếu codebase chưa được kiểm tra.

---

# 2. Nguyên tắc bắt buộc

## 2.1. Read Before Change

Không sửa code ngay khi nhận task. Skill 01 là quy trình thuần READ ONLY và không thực hiện thay đổi mã nguồn.

Phải tuân thủ quy trình Onboarding:

    Discover
        ↓
    Inspect
        ↓
    Understand
        ↓
    Trace
        ↓
    Plan
        ↓
    Report

Trong đó, bước "Plan" có nghĩa là xác định các hành động đề xuất tiếp theo dựa trên evidence thực tế. "Plan" KHÔNG đồng nghĩa với việc thực thi thay đổi code trong Skill này.

---

## 2.2. Ưu tiên code thực tế

Khi tài liệu và code thực tế khác nhau:

1. Code/configuration hiện tại là evidence chính cho trạng thái hiện tại.
2. Đối với data model và cơ sở dữ liệu, thứ bậc bằng chứng tuân thủ nghiêm ngặt Database Evidence Hierarchy được định nghĩa tại Section 9.
3. Documentation được dùng để hiểu intended architecture.
4. Không tự ý sửa documentation để làm cho nó khớp code.

Nếu phát hiện mâu thuẫn:

    Documentation ≠ Implementation

phải ghi nhận rõ mâu thuẫn trước khi quyết định thay đổi.

---

## 2.3. Không đoán dependency

Không được giả định:

- framework
- database
- authentication mechanism
- authorization mechanism
- ORM
- API style
- package structure
- build tool
- deployment model

nếu chưa kiểm tra repository.

---

# 3. Onboarding Workflow

## Phase 1 — Repository Discovery

Khảo sát root directory.

Xác định:

- application folders
- backend
- frontend
- mobile
- database
- infrastructure
- tests
- documentation
- configuration
- scripts
- agent configuration

Tạo sơ đồ:

    Repository
    ├── Backend
    ├── Web Client
    ├── Mobile Client
    ├── Database
    ├── Infrastructure
    ├── Tests
    └── Agent Configuration

Không được tự tạo thư mục nếu chưa có yêu cầu.

---

# 4. Phase 2 — Technology Discovery

Xác định technology stack bằng cách đọc file thực tế.

Backend cần kiểm tra:

- project file
- package/dependency manifest
- startup configuration
- application configuration
- controllers
- services
- repositories/data access
- middleware
- authentication
- authorization

Frontend cần kiểm tra:

- package.json
- source structure
- routing
- API client
- state management
- authentication state
- permission guards
- UI architecture

Mobile cần kiểm tra:

- pubspec.yaml
- lib/
- routing
- API client
- authentication
- state management
- feature structure

Database cần kiểm tra:

- SQL scripts
- schema
- migrations
- seed
- stored procedures
- views
- functions
- triggers
- security policies

---

# 5. Phase 3 — Architecture Mapping

Sau khi discovery, tạo Architecture Map.

Format:

    Client
      │
      ├── Web
      └── Mobile
              │
              ▼
          API Layer
              │
              ▼
      Application/Service
              │
              ▼
       Data Access Layer
              │
              ▼
           Database

Chỉ sử dụng các layer thực sự tồn tại trong codebase.

Nếu kiến trúc khác với sơ đồ trên thì phải mô tả kiến trúc thực tế.

Chỉ xác định DBMS thực tế sau khi kiểm tra configuration, connection string, migration, schema, database scripts hoặc các evidence tương ứng.

Không được biến SQL Server thành assumption chỉ vì PharmaBranch được thiết kế hướng tới SQL Server.

---

# 6. Phase 4 — Backend Mapping

Xác định:

- API entry points
- controller structure
- service structure
- repository/data-access structure
- DTO/model structure
- authentication flow
- authorization flow
- exception handling
- validation
- transaction boundaries
- logging
- configuration

Với mỗi feature quan trọng phải trace:

    Request
      ↓
    Controller
      ↓
    Service
      ↓
    Data Access
      ↓
    Database

Không kết luận một feature đã được implement chỉ vì có Controller.

Phải trace tới implementation thực tế.

---

# 7. Phase 5 — Frontend Mapping

Xác định:

- routing
- pages
- components
- API services
- state management
- authentication state
- authorization guards
- error handling
- loading states

Đặc biệt kiểm tra:

    Login
      ↓
    Token/Session
      ↓
    API Client
      ↓
    Authorization
      ↓
    Role-based UI

UI permission không được xem là thay thế cho Backend authorization.

---

# 8. Phase 6 — Mobile Mapping

Xác định:

- application entry point
- screens
- routing
- API layer
- authentication
- state management
- feature modules
- local storage

Đối chiếu mobile với API contract.

Không tạo API mới chỉ để phục vụ Mobile nếu API hiện tại đã đáp ứng yêu cầu.

---

# 9. Phase 7 — Database Mapping

Phải xác định:

- database engine (phải được discover từ evidence, không giả định)
- schema
- tables
- primary keys
- foreign keys
- unique constraints
- indexes
- transactions
- stored procedures/functions
- views
- triggers
- security mechanisms

## Database Evidence Hierarchy

Khi khảo sát cơ sở dữ liệu, Agent phải tuân thủ thứ bậc bằng chứng (Evidence Hierarchy):

1. **Live database / runtime database metadata** (khi có quyền truy cập kết nối runtime thực tế)
2. **Executable database migrations / deployed schema artifacts**
3. **Database scripts** (CREATE TABLE / ALTER TABLE / stored procedures / functions / triggers)
4. **ORM / data-access models** (Entity models, DbContext, mappings)
5. **ERD / DBML / design artifacts**
6. **Documentation / business specification**

Nguyên tắc bắt buộc:
- Thứ bậc trên chỉ áp dụng khi Agent thực sự có quyền truy cập vào nguồn bằng chứng tương ứng.
- Nếu không có quyền truy cập live database: `Live Database Status = NOT VERIFIED`.
- `SQL script ≠ live database proof`: Không được coi SQL script là bằng chứng rằng live database hiện đang có schema đó.
- `ERD ≠ live database proof`: Không được coi ERD là bằng chứng table/column tồn tại vật lý.
- `Documentation ≠ implementation proof`: Không giả định DBMS là SQL Server chỉ vì đặc tả thiết kế ghi SQL Server.

## Expected Domain / Database References — Checklist

Đối với PharmaBranch, các entity/table tham chiếu kỳ vọng cần chú ý đối chiếu:

- CHI_NHANH
- NGUOI_DUNG
- VAI_TRO
- QUYEN_HAN
- TON_KHO
- GIAO_DICH_KHO
- HOA_DON
- CHI_TIET_HOA_DON
- THANH_TOAN
- CHU_KY_SO
- NHAT_KY_KIEM_TOAN

These names are expected references only. They must be verified against actual source code, database schema, migrations, scripts, ORM models, API contracts or other available evidence.

Các bảng này có vai trò quan trọng trong branch isolation, RBAC, bán hàng, tồn kho, ký số và audit.

Nguyên tắc xác lập trạng thái:
- `Evidence Status` dùng để mô tả mức độ tìm thấy và xác minh bằng chứng.
- `Implementation Status` dùng để mô tả trạng thái triển khai thực tế.
- Không được suy luận `Implementation Status` chỉ từ việc không tìm thấy evidence.

Nếu không tìm thấy artifact/evidence:
- `Evidence Status = NOT FOUND`
- `Implementation Status = NOT VERIFIED`

Không được tự động kết luận `NOT IMPLEMENTED` trừ khi có đủ bằng chứng xác nhận capability chưa được triển khai theo semantics ở Section 15. Tuyệt đối không được suy đoán hoặc coi các tên trên là bằng chứng rằng table/entity tương ứng thực sự tồn tại.

---

# 10. Phase 8 — Security Discovery

Không được chỉ kiểm tra UI.

Phải tìm evidence cho:

## Authentication

- login
- password hashing
- token/session
- logout
- token invalidation

## Authorization

- role
- permission
- endpoint authorization
- ownership
- BOLA/IDOR

## Branch Isolation

Kiểm tra:

    user
      ↓
    branch_id
      ↓
    API
      ↓
    database
      ↓
    branch-scoped data

## Database Security

Kiểm tra:

- Row-Level Security
- Column-Level Security
- database permissions
- sensitive fields

## Audit

Kiểm tra:

- audit logging
- actor
- branch
- action
- resource
- old data
- new data
- result

Không được kết luận "secure" chỉ vì có class/configuration
mang tên Security/Auth/RBAC.

---

# 11. Phase 9 — Domain Mapping

## Expected PharmaBranch Domains — Checklist

Danh sách này chỉ được dùng để đối chiếu, không được kết luận một domain tồn tại chỉ vì nó nằm trong danh sách:

1. Authentication
2. User / Role / Permission
3. Branch
4. Drug Catalog
5. Inventory
6. Batch / Expiry
7. Supplier
8. Purchase Order
9. Goods Receipt
10. Customer
11. Drug Order
12. Sales / Invoice
13. Payment
14. Return / Exchange
15. Expense
16. Digital Signature
17. Audit Log

Domain thực tế phải được xác định bằng evidence từ:

- source code
- database
- API
- configuration
- documentation
- business specification

Nguyên tắc xác lập trạng thái:
- `Evidence Status` dùng để mô tả mức độ tìm thấy và xác minh bằng chứng.
- `Implementation Status` dùng để mô tả trạng thái triển khai.
- Không được suy luận `Implementation Status` chỉ từ việc không tìm thấy evidence.

Nếu không tìm thấy artifact/evidence cho domain:
- `Evidence Status = NOT FOUND`
- `Implementation Status = NOT VERIFIED`

Không được tự động kết luận `NOT IMPLEMENTED` chỉ vì không tìm thấy evidence trừ khi có đủ bằng chứng xác nhận theo semantics ở Section 15. Tuyệt đối không được tự thêm hoặc xác nhận domain nếu chưa có evidence.

---

# 12. Phase 10 — Dependency Mapping

Khi khảo sát hệ thống, phải kiểm tra dependency giữa các thành phần.

## Expected Dependency Checklist / Hypotheses

Các sơ đồ dưới đây là giả thuyết khảo sát để định hướng điều tra, KHÔNG PHẢI sự thật kiến trúc bắt buộc:

    Sales
      ├── Drug
      ├── Batch
      ├── Inventory
      ├── Customer
      ├── Invoice
      ├── Payment
      ├── Digital Signature
      └── Audit Log

Nếu khảo sát Inventory:

    Inventory
      ↓
    Sales
      ↓
    Return
      ↓
    Reporting

Nguyên tắc bắt buộc:
- Examples in dependency checklists are investigation hypotheses, not architectural facts (Ví dụ trong dependency checklist chỉ là giả thuyết khảo sát, không phải sự thật kiến trúc).
- Dependency thực tế BẮT BUỘC phải được xác lập từ bằng chứng vật lý (physical evidence) như:
  - imports / using directives
  - package / project references
  - method / service / repository calls
  - API endpoints & network calls
  - database foreign keys & SQL queries
  - event / message bus relationships
  - runtime configuration
- Mối quan hệ (ví dụ `Sales → Inventory`) KHÔNG ĐƯỢC báo cáo là dependency thực tế trừ khi có bằng chứng vật lý chứng minh sự tồn tại của quan hệ này.

---

# 13. Phase 11 — Existing Convention Discovery

Trước khi tạo file/class/function mới phải tìm convention hiện tại.

Kiểm tra:

- naming
- package structure
- DTO naming
- API response format
- exception format
- validation
- logging
- database access
- frontend component structure
- state management
- testing style

Ưu tiên:

    Existing Convention
          >
    New Convention

Không tạo architecture mới nếu architecture hiện tại đã có thể đáp ứng yêu cầu.

---

# 14. Phase 12 — Rules & Skills Discovery

Trước khi thực hiện task:

1. Đọc Rules áp dụng.
2. Xác định Skills liên quan.
3. Xác định thứ tự ưu tiên.
4. Xác định các constraint bắt buộc.

Expected structure:

    .agents/
    ├── rules/
    └── skills/

Thứ tự ưu tiên:

    Rules > Skills

Rules quyết định:

    WHAT MUST / MUST NOT HAPPEN

Skills quyết định:

    HOW TO PERFORM THE WORK

Skill này không được override Rules.

Nếu phát hiện Skill 01 mâu thuẫn với Rules 00–09:

1. Không tự ý sửa Rules.
2. Ghi nhận conflict.
3. Điều chỉnh Skill 01 để tuân thủ Rules.

---

# 15. Required Onboarding Report

Sau khi discovery, Agent phải trả về Codebase Onboarding Report trong task response.

Nguyên tắc báo cáo:

- After discovery, the Agent must return the Codebase Onboarding Report in the task response.
- Báo cáo mặc định phải được trả về trực tiếp trong response của Agent.
- Không tự động tạo file `Codebase-Onboarding-Report.md`.
- Không tạo hoặc sửa file report trong repository, trừ khi task của người dùng yêu cầu explicitly.

### Two-Dimension Status Taxonomy

Báo cáo phân định độc lập giữa hai chiều trạng thái (không gộp lẫn):

1. **Evidence Status** (Trả lời câu hỏi: *"Did discovery find evidence?"*):
   - `CONFIRMED`: Đã tìm thấy bằng chứng vật lý rõ ràng trong code/schema/config.
   - `PARTIALLY VERIFIED`: Đã tìm thấy một phần bằng chứng vật lý, nhưng chưa đủ để thiết lập toàn bộ năng lực.
   - `NOT FOUND`: Đã tìm kiếm tại các vị trí/nguồn bằng chứng nhưng không phát hiện artifact kỳ vọng.
   - `UNKNOWN`: Không có đủ bằng chứng/dữ kiện để xác định trạng thái.

2. **Implementation Status** (Trả lời câu hỏi: *"What implementation state can be established from the evidence?"*):
   - `IMPLEMENTED`: Bằng chứng vật lý chứng minh năng lực thực sự đã được triển khai hoàn chỉnh.
   - `PARTIALLY IMPLEMENTED`: Bằng chứng vật lý chứng minh năng lực mới chỉ được triển khai một phần.
   - `NOT VERIFIED`: Chưa thể xác lập trạng thái triển khai từ bằng chứng hiện có.
   - `NOT IMPLEMENTED`: Chỉ được sử dụng khi có đủ evidence trên các implementation surfaces phù hợp cho thấy capability thực sự chưa được triển khai, HOẶC source/config/specification có bằng chứng rõ ràng xác nhận capability chưa được implement.

Nguyên tắc bất di bất dịch:
- `NOT FOUND ≠ NOT IMPLEMENTED`: Tuyệt đối không được đồng nhất `NOT FOUND` với `NOT IMPLEMENTED`.
- Việc chỉ không tìm thấy file, class, endpoint, database object, dependency hoặc configuration KHÔNG đủ để kết luận `NOT IMPLEMENTED`.
- `NOT FOUND + incomplete search ≠ NOT IMPLEMENTED`: Trong trường hợp tìm kiếm chưa đủ hoặc implementation surface chưa được xác minh đầy đủ:
  - `Evidence Status = NOT FOUND` hoặc `UNKNOWN`
  - `Implementation Status = NOT VERIFIED`
- `NOT IMPLEMENTED cần sufficient evidence`: Phải có bằng chứng xác nhận đầy đủ trước khi kết luận năng lực chưa được triển khai.
- Không được biến `UNKNOWN` thành `YES/NO` bằng suy luận.

Format báo cáo:

# Codebase Onboarding Report

## 1. Repository Structure

- Backend:
- Web:
- Mobile:
- Database:
- Tests:
- Infrastructure:

## 2. Technology Stack

### Backend

- Framework:
- Runtime:
- Build tool:
- Data access:

### Web

- Framework:
- Language:
- State management:
- API client:

### Mobile

- Framework:
- Language:
- State management:
- API client:

### Database

- DBMS:
- Version:
- Migration strategy:
- Live Database Status:

## 3. Architecture

Mô tả request flow thực tế:

    Client
      ↓
    API
      ↓
    Service
      ↓
    Data Access
      ↓
    Database

## 4. Security

### Authentication

- Evidence Status:
- Implementation Status:
- Evidence:

### Authorization

- Evidence Status:
- Implementation Status:
- Evidence:

### RBAC

- Evidence Status:
- Implementation Status:
- Evidence:

### Branch Isolation

- Evidence Status:
- Implementation Status:
- Evidence:

### Database Security

- Evidence Status:
- Implementation Status:
- Evidence:

## 5. Domain Modules

Liệt kê các module thực tế.

## 6. Important Dependencies

Liệt kê dependency quan trọng.

## 7. Existing Conventions

Liệt kê convention đang được sử dụng.

## 8. Risks / Unknowns

Liệt kê những điểm chưa thể xác định.

## 9. Recommended Next Step

Đề xuất bước tiếp theo dựa trên evidence.

---

# 16. Definition of Done

Onboarding chỉ được xem là hoàn thành khi Agent trả lời được trạng thái thực tế của 16 hạng mục dưới đây dựa trên bằng chứng vật lý hoặc trạng thái vắng mặt/chưa xác minh minh bạch.

Mỗi hạng mục phải được xác định rõ:
- `Location`: Đường dẫn file/thư mục thực tế (nếu tìm thấy) hoặc `N/A` (nếu không có bằng chứng).
- `Evidence`: Tên file, đoạn code, schema, config hoặc `N/A`.
- `Evidence Status`: `CONFIRMED` | `PARTIALLY VERIFIED` | `NOT FOUND` | `UNKNOWN`.
- `Implementation Status`: `IMPLEMENTED` | `PARTIALLY IMPLEMENTED` | `NOT VERIFIED` | `NOT IMPLEMENTED`.

Checklist 16 hạng mục:

1. **Backend**: Vị trí mã nguồn backend / API server.
2. **Frontend (Web)**: Vị trí mã nguồn Web client.
3. **Mobile Client**: Vị trí mã nguồn Mobile client.
4. **Database Artifacts**: Vị trí schema, migrations, scripts, connection configs.
5. **API Entry Points**: Vị trí khai báo routing, controllers hoặc endpoints.
6. **Authentication**: Vị trí xử lý xác thực danh tính người dùng.
7. **Authorization**: Vị trí thực thi runtime authorization gating.
8. **RBAC**: Vị trí định nghĩa vai trò, quyền hạn và phân quyền.
9. **Branch Isolation**: Vị trí thực thi cô lập dữ liệu chi nhánh (API / DB RLS).
10. **Transaction Boundaries**: Vị trí quản lý giao dịch dữ liệu (Unit of Work, DB transaction).
11. **Inventory Handling**: Vị trí xử lý nghiệp vụ kho và tồn kho.
12. **Digital Signature**: Vị trí xử lý ký số hóa đơn điện tử.
13. **Audit Log**: Vị trí ghi nhật ký kiểm toán nghiệp vụ (`NHAT_KY_KIEM_TOAN`).
14. **Tests**: Vị trí test suites (unit, integration, e2e) hoặc test project.
15. **Rules áp dụng**: Các Rules đang có hiệu lực trong `.agents/rules/`.
16. **Skills áp dụng**: Các Skills đang có hiệu lực trong `.agents/skills/`.

Nguyên tắc xử lý vắng mặt (Absence Handling):
- Nếu năng lực vắng mặt, Agent TUYỆT ĐỐI KHÔNG ĐƯỢC bịa đặt vị trí (`Location: N/A`).
- Ví dụ khi Digital Signature chưa có trong repository:
  - `Digital Signature`
  - `Location: N/A`
  - `Evidence: N/A`
  - `Evidence Status: NOT FOUND`
  - `Implementation Status: NOT VERIFIED` (hoặc `NOT IMPLEMENTED` nếu có đủ evidence xác nhận capability chưa được triển khai theo semantics ở Section 15).
- `NOT FOUND ≠ NOT IMPLEMENTED`: Trạng thái `NOT FOUND` không tự động biến thành `NOT IMPLEMENTED`. Chỉ dùng `NOT IMPLEMENTED` khi có đủ evidence theo semantics ở Section 15.
- Nếu Agent bỏ sót không trả lời được một trong 16 hạng mục trên theo cấu trúc bằng chứng minh bạch:

    ONBOARDING = INCOMPLETE

Không được suy đoán câu trả lời khi thiếu bằng chứng.

---

# 17. Important Constraint

Skill này chỉ thực hiện discovery và mapping (read-only onboarding).

Workflow onboarding:

    Discover
        ↓
    Inspect
        ↓
    Understand
        ↓
    Trace
        ↓
    Plan
        ↓
    Report

Không tự động:

- sửa source code
- refactor
- sửa database
- sửa API
- sửa configuration
- cài dependency
- tạo architecture mới
- tạo file report
- tạo folder mới

trong quá trình onboarding.

Mọi thay đổi phải được thực hiện bởi task tiếp theo và tuân thủ Rules hiện hành.