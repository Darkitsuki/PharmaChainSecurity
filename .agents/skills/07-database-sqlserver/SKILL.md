---
name: database-sqlserver
description: >
  Guides database engineering and SQL Server implementation for the PharmaBranch
  project, including schema design, constraints, SQL safety, transactions,
  concurrency, branch isolation, Row-Level Security, indexing, performance,
  migrations, seed data, backup/recovery validation, testing, and database
  refactoring while respecting Rules 00–09 and repository evidence.
---

# SKILL 07 — DATABASE SQL SERVER

## 1. MỤC TIÊU VÀ PHẠM VI (OBJECTIVE & SCOPE)

### 1.1. Mục tiêu (Objective)

Skill này hướng dẫn Agent thực hiện các hoạt động kỹ thuật cơ sở dữ liệu (database engineering) và triển khai Microsoft SQL Server trong hệ thống quản lý chuỗi nhà thuốc đa chi nhánh PharmaBranch theo quy trình chuẩn:

```text
Khảo sát (Discover)
    ↓
Hiểu hiện trạng (Understand)
    ↓
Thiết kế lược đồ (Design)
    ↓
Triển khai kỹ thuật (Implement)
    ↓
Xác minh toàn vẹn (Validate)
    ↓
Tối ưu hóa hiệu năng (Optimize)
    ↓
Tài liệu hóa (Document)
```

Skill này tập trung vào khía cạnh triển khai kỹ thuật tầng cơ sở dữ liệu (Database Implementation HOW), biến các chính sách kiến trúc và toàn vẹn dữ liệu thành các cấu trúc vật lý an toàn, nhất quán và hiệu quả.

---

### 1.2. Phân định Chính sách vs. Triển khai (Policy vs. Implementation)

Agent phải phân biệt rõ ràng:
- **Chính sách cơ sở dữ liệu (Database Policy — WHAT / AUTHORITY)**: Do các Rules `00–09` sở hữu:
  - `07-database-integrity.md` quy định chính sách toàn vẹn dữ liệu, khóa chính, khóa ngoại, CHECK constraints, tính bất biến của sổ cái giao dịch.
  - `02-architecture-quality.md` quy định chính sách transaction, concurrency control, idempotency và state transitions.
  - `06-branch-isolation.md` quy định chính sách cô lập dữ liệu chi nhánh và ranh giới tenant.
- **Triển khai kỹ thuật cơ sở dữ liệu (Database Implementation — HOW)**: Thuộc thẩm quyền của **Skill 07**, bao gồm:
  - Cú pháp T-SQL, kiểu dữ liệu, lược đồ bảng, ràng buộc vật lý, chỉ mục (indexes);
  - Parameterized database access và bảo vệ an toàn câu truy vấn;
  - Cơ chế khóa (locking), mức độ cô lập giao dịch (isolation levels), Row-Level Security (RLS) predicates;
  - Kịch bản migration, seed data, sao lưu/phục hồi và kiểm thử tầng CSDL.

---

### 1.3. Phạm vi Áp dụng (Scope)

Skill 07 áp dụng cho mọi thao tác liên quan đến SQL Server trong PharmaBranch:
- Khảo sát cấu trúc bảng, views, stored procedures, functions, triggers và migrations;
- Thiết kế và chỉnh sửa schema, bảng, cột, kiểu dữ liệu, PK, FK, UNIQUE, CHECK, DEFAULT;
- Xây dựng câu truy vấn SQL an toàn, tham số hóa (parameterized queries);
- Triển khai transaction và concurrency control ở tầng database;
- Triển khai cô lập dữ liệu chi nhánh và SQL Server Row-Level Security (RLS);
- Thiết kế chỉ mục (indexing), phân tích execution plans và tối ưu hóa truy vấn;
- Quản lý migration versioning, seed data và kiểm định quy trình backup/restore;
- Viết automated tests cho CSDL và thực hiện database refactoring an toàn.

---

### 1.4. Phạm vi KHÔNG thuộc sở hữu của Skill 07 (Non-Responsibilities)

Skill 07 tuyệt đối **KHÔNG sở hữu** các thẩm quyền sau:
- **Project Governance**: Thuộc `00-project-governance.md`.
- **System Architecture**: Thuộc `01-architecture.md`.
- **General Coding Standards**: Thuộc `02-coding-standards` (Skill 02).
- **Backend Application & Service Layer Implementation**: Thuộc Skill 03 (`03-dotnet-backend`).
- **Web Frontend Implementation**: Thuộc Skill 04 (`04-react-frontend`).
- **Mobile Application Implementation**: Thuộc Skill 05 (`05-flutter-mobile`).
- **API Contract & DTO Design**: Thuộc `08-api-contract.md` và Skill 06 (`06-api-design`).
- **Authentication & JWT Policy**: Thuộc `03-security.md`.
- **RBAC Model & Role Permissions**: Thuộc `04-rbac.md`.
- **Runtime Authorization Policy**: Thuộc `05-authorization.md`.
- **Business Transaction & State Transition Policy**: Thuộc `02-architecture-quality.md`.
- **Authoritative Business Domain Rules**: Thuộc domain nghiệp vụ nhà thuốc PharmaBranch (nghiệp vụ bán lẻ, đơn thuốc, duyệt nhập kho, kiểm kê).

---

## 2. THỨ BẬC ƯU TIÊN VÀ TÍNH TRUNG LẬP CÔNG NGHỆ (PRIORITY & TECHNOLOGY NEUTRALITY)

### 2.1. Thứ bậc Ưu tiên Bắt buộc

Khi đưa ra bất kỳ quyết định kỹ thuật nào về CSDL, Agent bắt buộc tuân theo thứ tự ưu tiên:

```text
1. Rules 00–09 (Hệ thống Quy tắc Quản trị Tối cao — Rules ALWAYS win)
   ↓
2. Yêu cầu Cụ thể của Task (Task Requirements)
   ↓
3. Quy ước CSDL Hiện có của Repository (Existing Database Conventions)
   ↓
4. Bằng chứng Vật lý trong Codebase (Physical Repository Evidence)
   ↓
5. Kiến trúc Hệ thống Đã được Phê duyệt (Approved Architecture)
   ↓
6. Các Skills Liên quan (Skill 01, 02, 03, 06)
   ↓
7. Official Technology Documentation (Microsoft SQL Server Docs)
   ↓
8. Generic Best Practices (Chuẩn mực kỹ thuật CSDL chung)
   ↓
9. Agent Preference (Sở thích cá nhân của Agent — Ưu tiên thấp nhất)
```

**Nguyên tắc vàng**: "Best practice" chung không bao giờ được phép ghi đè bằng chứng vật lý của repository và các Rules `00–09`.

---

### 2.2. Tính Trung lập Công nghệ (Technology Neutrality)

Mục tiêu công nghệ CSDL của dự án là **Microsoft SQL Server** khi có bằng chứng codebase hoặc kiến trúc đã phê duyệt xác nhận. Tuy nhiên, Agent tuyệt đối **KHÔNG được tự động áp đặt**:
- Entity Framework Core, Dapper, ADO.NET hay LINQ;
- Repository Pattern hay Unit of Work ở tầng CSDL;
- Bắt buộc phải dùng Stored Procedures, Views, Functions hay Triggers;
- Bắt buộc phải dùng EF Core Migrations, SSDT (.sqlproj), DACPAC, DbUp, FluentMigrator, Liquibase hay Flyway.

Đây là các phương án triển khai tùy chọn. Quyết định kỹ thuật phải dựa trên:
1. Bằng chứng vật lý đã có trong repository;
2. Quy ước hiện tại của codebase;
3. Kiến trúc đã được phê duyệt chính thức.

Nếu có yêu cầu đưa công nghệ/công cụ mới vào dự án, Agent phải báo cáo rõ:
- **Tên công cụ/công nghệ**: (Ví dụ: Dapper, DbUp);
- **Lý do kỹ thuật (Reason)**: Tại sao hiện trạng không đáp ứng được;
- **Phạm vi tác động (Scope)**: Tầng nào bị ảnh hưởng;
- **Dependencies phát sinh**: Gói NuGet, công cụ CLI;
- **Trade-offs**: Đánh đổi giữa hiệu năng, độ phức tạp và khả năng bảo trì;
- **Kế hoạch chuyển đổi (Migration/Impact)**: Cách thức tích hợp an toàn.

---

## 3. MÔ HÌNH SỞ HỮU TRÁCH NHIỆM (OWNERSHIP MODEL)

### 3.1. Bảng Phân định Trách nhiệm CSDL

| Lĩnh vực CSDL | Thẩm quyền Chính sách (Policy Authority) | Trách nhiệm Triển khai của Skill 07 (Database Implementation HOW) |
| :--- | :--- | :--- |
| **Toàn vẹn CSDL (Integrity, PK, FK, CHECK, NULL)** | `07-database-integrity.md` | Thiết kế schema, định nghĩa PK, FK, UNIQUE, CHECK, NOT NULL, DEFAULT constraints bằng T-SQL an toàn |
| **Giao dịch (Transactions & ACID)** | `02-architecture-quality.md` | Hỗ trợ transaction boundaries, kiểm soát thời gian giữ lock, tránh lồng ghép tác vụ ngoại vi vào DB transaction |
| **Xử lý đồng thời (Concurrency Control)** | `02-architecture-quality.md` | Triển khai rowversion tokens (timestamp là tên đồng nghĩa cũ/legacy synonym trong SQL Server), isolation levels, UPDATE nguyên tử và locking hints phù hợp |
| **Cô lập Chi nhánh (Branch Isolation)** | `06-branch-isolation.md` | Mô hình hóa đường dẫn ranh giới chi nhánh, bảo đảm query không đọc chéo tenant |
| **Row-Level Security (RLS)** | `06-branch-isolation.md` | Triển khai predicate functions, security policies, phối hợp vòng đời `SESSION_CONTEXT` |
| **An toàn SQL & Chống Injection** | `03-security.md` | Đảm bảo 100% câu truy vấn sử dụng parameterized queries; cấm ghép chuỗi câu lệnh thô |
| **Sao lưu & Phục hồi CSDL** | `09-observability-operations.md` & Rule 07 | Skill 07 sở hữu kịch bản backup/restore CSDL và kiểm tra toàn vẹn sau phục hồi; Rule 09 sở hữu hạ tầng DR và cảnh báo vận hành |
| **Truy cập Dữ liệu Ứng dụng** | Skill 03 (`03-dotnet-backend`) | Cung cấp query patterns tối ưu cho backend persistence; Skill 03 sở hữu code C# truy cập CSDL |
| **Hợp đồng API & Định dạng Dữ liệu** | `08-api-contract.md` & Skill 06 | Phối hợp ánh xạ kiểu dữ liệu chính xác; CSDL không quyết định cấu trúc public API DTO |
| **Nghiệp vụ Nhà thuốc** | Domain nghiệp vụ PharmaBranch | CSDL thực thi các bất biến miền giá trị vật lý; không biến CSDL thành nơi tự phát sinh business logic |

---

### 3.2. CSDL Không Sở hữu Nghiệp vụ Ứng dụng

- CSDL thực thi các **ràng buộc toàn vẹn cấu trúc và miền giá trị bất biến** (structural & domain invariants), ví dụ: `so_luong >= 0`, `don_gia >= 0`, `ngay_het_han > ngay_san_xuat`.
- CSDL **không tự động sở hữu nghiệp vụ ứng dụng phức tạp**, ví dụ: kiểm tra quyền hạn nhân viên bán thuốc, quy trình phê duyệt hủy hóa đơn, hoặc tính toán chiết khấu tích điểm. Những nghiệp vụ này thuộc quyền sở hữu của tầng ứng dụng và các Rules tương ứng.

---

## 4. KHẢO SÁT HIỆN TRẠNG CƠ SỞ DỮ LIỆU (DATABASE DISCOVERY)

### 4.1. Quy trình Khảo sát Evidence-First

Trước khi đề xuất bất kỳ thay đổi nào về CSDL, Agent bắt buộc phải khảo sát codebase theo chuỗi:

```text
Khảo sát CSDL (Discovery)
    ↓
Tìm kiếm Bằng chứng Vật lý (Artifact Search)
    ↓
Lần vết từ Ứng dụng sang CSDL (Trace Flow)
    ↓
Xác định Trạng thái (Classification)
```

---

### 4.2. Các Dấu vết Vật lý Cần Tìm kiếm

Agent phải tìm kiếm sự hiện diện của các tệp tin và cấu hình CSDL:
- Scripts CSDL: `*.sql`, `schema.sql`, `init.sql`, `seed.sql`, `tables/`, `procs/`, `views/`;
- Project CSDL: `*.sqlproj`, `*.dbproj`, `*.dacpac`;
- Migration files: thư mục `Migrations/`, EF Core migrations, DbUp scripts, FluentMigrator;
- Ứng dụng backend: `DbContext`, entity configurations, repository classes, raw SQL queries;
- Cấu hình & Môi trường: Connection strings trong `appsettings.json`, `docker-compose.yml`, scripts CI/CD;
- Automated Tests: Integration tests kết nối CSDL, DbContext tests, migration tests.

---

### 4.3. Chuỗi Lần vết Truy cập Dữ liệu (Execution Trace)

Agent phải lần vết luồng thực thi dữ liệu từ ứng dụng xuống CSDL:

```text
Application Endpoint / Use Case
    ↓
Backend Data Access Layer (Skill 03)
    ↓
SQL / ORM Mapping (Parameterized Command)
    ↓
SQL Server Database Engine
    ↓
Table / View / Stored Procedure
    ↓
Constraints / Indexes / RLS Policies
```

---

### 4.4. Thứ bậc Bằng chứng CSDL (Evidence Hierarchy)

Độ tin cậy của bằng chứng được xếp hạng giảm dần:
1. **Physical Executable Database Schema**: Cấu trúc CSDL thực tế đang chạy trên SQL Server.
2. **Deterministic Migration Scripts**: Các tệp migration đã áp dụng thành công.
3. **Database Initialization / Schema Scripts**: Các file `.sql` định nghĩa schema vật lý.
4. **Application SQL / ORM Entity Configurations**: Mapping trong mã nguồn backend C#.
5. **Automated Database Integration Tests**: Code kiểm thử CSDL tự động đang pass.
6. **Configuration Files**: Connection strings, database configuration.
7. **ERD / DBML / Schema Diagrams**: Sơ đồ thiết kế CSDL.
8. **Documentation / README**: Tài liệu mô tả CSDL.
9. **Agent Assumptions**: Giả định của Agent (**không có giá trị chứng minh**).

---

### 4.5. Phân loại Trạng thái Triển khai (Status Classification)

Mọi kết luận về CSDL phải được gắn nhãn minh bạch:
- **`IMPLEMENTED`**: Đã tìm thấy schema/script/code vật lý trong codebase.
- **`VERIFIED`**: Đã được xác nhận hoạt động bằng integration test hoặc query thực nghiệm.
- **`NOT VERIFIED`**: Có trong tài liệu hoặc task nhưng chưa tìm thấy bằng chứng vật lý.
- **`PROPOSED`**: Đang được đề xuất kỹ thuật, chưa có mã nguồn hoặc schema.
- **`DESIGNED`**: Đã có bản vẽ thiết kế kỹ thuật nhưng chưa áp dụng vào CSDL.
- **`ASSUMPTION`**: Giả định kỹ thuật cần được xác minh lại bằng bằng chứng.

**Nguyên tắc kỷ luật**:
- **ERD không chứng minh implementation**: Một quan hệ FK có trên hình vẽ ERD không đồng nghĩa ràng buộc FK vật lý đã tồn tại trong CSDL.
- **"Not Found" là bằng chứng hợp lệ**: Nếu không tìm thấy tệp script hoặc constraint, phải báo cáo trung thực là `Not Found` / `Not Verified`, tuyệt đối không suy đoán.

---

## 5. THIẾT KẾ LƯỢC ĐỒ CƠ SỞ DỮ LIỆU (SCHEMA DESIGN)

### 5.1. Quy ước Đặt tên (Naming Conventions)

Thiết kế lược đồ phải tuân thủ quy ước đặt tên nhất quán của repository:
- **Tên bảng**: Danh từ số ít hoặc số nhiều theo quy ước hiện có (ví dụ tiếng Việt: `CHI_NHANH`, `NGUOI_DUNG`, `THUOC`, `HOA_DON`, `HOA_DON_CHI_TIET`, `TON_KHO` hoặc tiếng Anh: `Branches`, `Users`, `Medicines` nếu codebase sử dụng). Không tự ý lai tạp hai ngôn ngữ.
- **Tên cột**: Tường minh, viết hoa hoặc snake_case theo quy ước hiện có (`chi_nhanh_id`, `so_luong`, `don_gia`, `ngay_tao`).
- **Khóa chính**: `<ten_bang>_id` hoặc `id` theo quy ước hiện có.
- **Khóa ngoại**: `<ten_bang_cha>_id` phản ánh chính xác quan hệ tham chiếu.
- **Constraints**: Các tiền tố quy ước khuyến nghị (recommended conventions / examples) nhằm tăng tính nhất quán; không biến tiền tố thành điều kiện bắt buộc về tính đúng đắn khi repository hoặc schema hiện có đã có quy ước riêng:
  - Khóa chính: `PK_<TableName>`
  - Khóa ngoại: `FK_<ChildTable>_<ParentTable>_<ColumnName>`
  - Duy nhất: `UQ_<TableName>_<ColumnName>`
  - Kiểm tra giá trị: `CK_<TableName>_<ConditionName>`
  - Giá trị mặc định: `DF_<TableName>_<ColumnName>`
  - Chỉ mục: `IX_<TableName>_<Columns>` hoặc `UX_<TableName>_<Columns>` (unique index).
  Việc đặt tên phải ưu tiên tuân thủ quy ước thực tế của repository, schema hiện có và quyết định kiến trúc đã duyệt.

---

### 5.2. Chuẩn hóa vs. Phi chuẩn hóa (Normalization vs. Denormalization)

- Mặc định hướng tới chuẩn hóa bậc 3 (3NF) để bảo đảm tính toàn vẹn dữ liệu, tránh trùng lặp và bất thường khi cập nhật.
- Phi chuẩn hóa (denormalization) chỉ được xem xét khi:
  - Có bằng chứng đo lường hiệu năng chứng minh điểm nghẽn (bottleneck) nghiêm trọng;
  - Phục vụ báo cáo phân tích tổng hợp (reporting/analytics aggregate) mà chi phí tính toán lại quá cao;
  - Dữ liệu lịch sử cần snapshot bất biến (ví dụ: `don_gia_tai_thoi_diem_ban` trong chi tiết hóa đơn).
- Không được tự tiện chuẩn hóa hay phi chuẩn hóa khi chưa có bằng chứng và yêu cầu kiến trúc rõ ràng.

---

### 5.3. Mô hình hóa Quan hệ và Quyền sở hữu Vòng đời (Lifecycle Ownership)

Mỗi quan hệ giữa các bảng phải xác định rõ ràng:
- **Bảng cha (Principal/Parent)** vs. **Bảng con (Dependent/Child)**;
- **Quan hệ 1 - 1, 1 - N, hay N - N** (thông qua bảng liên kết trung gian);
- **Quyền sở hữu vòng đời (Lifecycle)**: Khi bản ghi cha bị xóa, bản ghi con sẽ ra sao?
  - Với các bảng giao dịch vận hành và tài chính (`HOA_DON`, `HOA_DON_CHI_TIET`, `GIAO_DICH_KHO`, `PHIEU_NHAP`): Tuyệt đối **CẤM CASCADE DELETE** để bảo toàn lịch sử kiểm toán. Phải dùng `NO ACTION` hoặc `RESTRICT`.
  - Với các quan hệ cha - con thuần túy mang tính thành phần nội bộ (composition): Xem xét kỹ lưỡng trước khi dùng cascade, ưu tiên xóa có kiểm soát ở tầng ứng dụng/transaction.

---

### 5.4. Khung Quyết định Thiết kế Lược đồ (Decision Framework)

Mọi quyết định thiết kế schema phải được cân nhắc tổng thể:
```text
Yêu cầu Nghiệp vụ (PharmaBranch)
       +
Chính sách Toàn vẹn (Rule 07)
       +
Kiến trúc Hệ thống (Rule 01)
       +
Quy ước Codebase Hiện có
       +
Bằng chứng Đo lường Hiệu năng
```

---

## 6. KIỂU DỮ LIỆU (DATA TYPES)

### 6.1. Nguyên tắc Lựa chọn Kiểu Dữ liệu

- Kiểu dữ liệu phải biểu diễn chính xác ngữ nghĩa của trường thông tin trong thế giới thực.
- Kích thước lưu trữ phải vừa đủ, tránh lãng phí dung lượng bộ nhớ và I/O đĩa.
- Phải tương thích với kiểu dữ liệu của tầng ứng dụng .NET (Skill 03) và hợp đồng API (Skill 06).

---

### 6.2. Số học Chính xác: Giá trị Tiền tệ và Số lượng (Financial & Quantity Precision)

- **Giá trị tiền tệ và đơn giá**: Bắt buộc sử dụng số học chính xác (`DECIMAL(p, s)`). **TUYỆT ĐỐI CẤM** dùng các kiểu dấu phẩy động xấp xỉ như `FLOAT` hoặc `REAL` vì lỗi làm tròn số học (rounding errors).
- **Số lượng tồn kho, đóng gói**: Dùng kiểu số nguyên (`INT`, `BIGINT`) nếu đơn vị là số lượng đếm được (hộp, vỉ, viên); hoặc dùng `DECIMAL(p, s)` nếu đơn vị có phần thập phân (ml, gram, liều).
- **Lưu ý về độ chính xác**: Độ chính xác và thang đo cụ thể (ví dụ `DECIMAL(18, 2)` hay `DECIMAL(18, 4)`) là ví dụ minh họa; Agent phải lựa chọn dựa trên quy ước schema hiện có và yêu cầu nghiệp vụ thực tế, không biến giá trị cụ thể thành quy tắc phổ quát.

---

### 6.3. Thời gian và Ngày tháng (Temporal & Date/Time)

- Ưu tiên sử dụng `DATETIME2` và lưu trữ tương thích chuẩn UTC (`SYSUTCDATETIME()`) khi phù hợp với quy ước repository và ngữ nghĩa miền dữ liệu; không tự ý thay đổi quy ước đã thiết lập nếu không có bằng chứng hoặc quyết định kiến trúc được phê duyệt.
- Sử dụng kiểu `DATE` thuần túy cho các trường ngày không cần mốc giờ (ví dụ: ngày sản xuất, ngày hết hạn thuốc, ngày sinh khách hàng).

---

### 6.4. Chuỗi Ký tự và Unicode (Strings & Text)

- Sử dụng các kiểu dữ liệu hỗ trợ Unicode như `NVARCHAR` khi dữ liệu miền nghiệp vụ và quy ước repository đòi hỏi (ví dụ: tiếng Việt có dấu, họ tên người dùng, tên thuốc, địa chỉ, ghi chú); không áp đặt quy tắc kiểu dữ liệu tuyệt đối khi chưa có bằng chứng.
- Sử dụng `VARCHAR` khi chắc chắn dữ liệu là mã ASCII không dấu chuẩn theo quy ước schema (ví dụ: mã vạch Barcode, mã SKU, mã số thuế, mã ISO).
- Luôn chỉ định độ dài tối đa hợp lý (`NVARCHAR(100)`, `NVARCHAR(255)`), tránh lạm dụng `NVARCHAR(MAX)` trừ trường hợp nội dung văn bản không xác định độ dài (JSON payload thô, nhật ký audit chi tiết).

---

### 6.5. Định danh Khóa (Identifiers)

- Các lựa chọn định danh: `INT IDENTITY(1,1)`, `BIGINT IDENTITY(1,1)` hoặc `UNIQUEIDENTIFIER` (GUID).
- **Tuyệt đối không tự ý chuyển đổi kiểu dữ liệu khóa chính**:
  - Không tự tiện đổi `INT` sang `BIGINT` nếu dung lượng bảng chưa cần;
  - Không tự tiện đổi `INT` sang `UNIQUEIDENTIFIER` hoặc `VARCHAR` sang GUID mà không có yêu cầu kiến trúc và bằng chứng phê duyệt.

---

## 7. KHÓA CHÍNH (PRIMARY KEYS)

### 7.1. Bất biến Khóa chính (PK Invariants)

Theo quy định của Rule 07, mọi bảng trong CSDL bắt buộc phải có một Primary Key duy nhất:
- Cột khóa chính bắt buộc phải khai báo `NOT NULL`;
- Khóa chính phải đảm bảo tính **duy nhất (uniqueness)**, **ổn định (stability)** và **bất biến (immutability)**;
- Tuyệt đối **không cập nhật (UPDATE)** hoặc tái sử dụng giá trị khóa chính sau khi đã tạo bản ghi.

---

### 7.2. Khóa Thay thế (Surrogate Key) vs. Khóa Tự nhiên (Natural Key)

- **Khóa thay thế (Surrogate Key)** (`INT IDENTITY`, `BIGINT IDENTITY`, `UNIQUEIDENTIFIER` sinh tự động): Khuyến nghị sử dụng cho các bảng giao dịch nghiệp vụ (`HOA_DON`, `DON_NHAP_HANG`, `TON_KHO`) để giữ khóa ngắn gọn, độc lập với thay đổi nghiệp vụ.
- **Khóa tự nhiên (Natural Key)** (ví dụ: mã quốc gia ISO, mã định danh chuẩn không đổi): Chỉ dùng khi giá trị thực sự bất biến toàn cầu. Các mã nghiệp vụ có thể thay đổi (mã số nhân viên, số hóa đơn) phải được quản lý bằng ràng buộc `UNIQUE` riêng, không nên dùng làm Primary Key vật lý nếu phải làm khóa ngoại ở nhiều bảng con.

---

### 7.3. Cân nhắc Phân cụm Chỉ mục Khóa chính (Clustered Index Implications)

- Theo mặc định trong SQL Server, Primary Key sẽ tạo Clustered Index.
- Clustered Key nên có tính chất: tuần tự tăng dần (monotonically increasing) để hạn chế phân mảnh trang (page splits) khi INSERT (ví dụ: `IDENTITY` hoặc `NEWSEQUENTIALID()`).
- Tránh sử dụng `NEWID()` ngẫu nhiên làm Clustered Primary Key trên các bảng có tần suất ghi cao.

---

## 8. KHÓA NGOẠI VÀ QUAN HỆ THAM CHIẾU (FOREIGN KEYS & RELATIONSHIPS)

### 8.1. Toàn vẹn Tham chiếu (Referential Integrity)

- Mọi quan hệ giữa các bảng nghiệp vụ bắt buộc phải được bảo vệ bằng ràng buộc `FOREIGN KEY` vật lý trong SQL Server.
- Khóa ngoại ngăn chặn triệt để tình trạng bản ghi mồ côi (orphan records):
  - Cấm chèn bản ghi con tham chiếu tới bản ghi cha không tồn tại;
  - Cấm xóa bản ghi cha khi đang có bản ghi con tham chiếu tới (với chính sách `NO ACTION` / `RESTRICT`).

---

### 8.2. Rủi ro của CASCADE DELETE trên Dữ liệu Vận hành

- Tuyệt đối **CẤM** cấu hình `ON DELETE CASCADE` trên các bảng tài chính, bán hàng, tồn kho và kiểm toán (`HOA_DON_ITEM`, `TON_KHO`, `GIAO_DICH_KHO`, `NHAT_KY_KIEM_TOAN`).
- Hành vi cascade tự động có thể xóa sạch toàn bộ lịch sử giao dịch khi một thực thể cha bị xóa vô tình.
- Chỉ sử dụng `ON DELETE CASCADE` cho các thực thể phụ thuộc nội bộ không có giá trị kiểm toán độc lập (nếu kiến trúc cho phép).

---

### 8.3. Thứ tự Di cư và Quan hệ Vòng (Circular Dependencies)

- Khi thiết kế lược đồ và kịch bản migration, Agent phải sắp xếp thứ tự tạo bảng hợp lý: bảng cha phải được tạo trước bảng con.
- Tuyệt đối tránh quan hệ tham chiếu vòng (A tham chiếu B và B tham chiếu A) vì sẽ gây bế tắc khi INSERT/DELETE và tạo kịch bản migration phức tạp.
- Kiểu dữ liệu của cột FK bắt buộc phải khớp 100% với kiểu dữ liệu của cột PK cha (ví dụ cùng `INT`, cùng `BIGINT`, cùng collation).

---

## 9. RÀNG BUỘC TOÀN VẸN CSDL (CONSTRAINTS & INTEGRITY)

### 9.1. Phân loại Ràng buộc trong SQL Server

SQL Server cung cấp 6 loại ràng buộc toàn vẹn cốt lõi:
1. `PRIMARY KEY`: Định danh duy nhất bản ghi, bắt buộc NOT NULL.
2. `FOREIGN KEY`: Bảo vệ toàn vẹn tham chiếu, ngăn chặn bản ghi mồ côi.
3. `UNIQUE`: Ngăn chặn trùng lặp dữ liệu nghiệp vụ (mã thuốc, barcode, số hóa đơn).
4. `CHECK`: Ràng buộc miền giá trị hợp lệ của cột dựa trên biểu thức logic.
5. `NOT NULL`: Bắt buộc trường dữ liệu phải có giá trị.
6. `DEFAULT`: Cung cấp giá trị khởi tạo khi câu lệnh INSERT không truyền dữ liệu.

---

### 9.2. Phân định Ràng buộc CSDL vs. Nghiệp vụ Ứng dụng

Agent phải phân định rõ ràng những gì thuộc về CSDL và những gì thuộc về Application Layer:

| Loại Ràng buộc | Nơi Thực thi Tối ưu | Ví dụ Điển hình |
| :--- | :--- | :--- |
| **Bất biến Miền giá trị Vật lý** | CSDL (`CHECK`, `NOT NULL`) | `so_luong >= 0`, `gia_ban >= 0`, `ty_le_giam BETWEEN 0 AND 100` |
| **Tính Duy nhất của Mã Nghiệp vụ** | CSDL (`UNIQUE` index/constraint) | Mã định danh thuốc (`ma_thuoc`), Số hóa đơn (`so_hoa_don`) |
| **Thời gian Logic Hợp lệ** | CSDL (`CHECK`) | `ngay_het_han > ngay_san_xuat`, `ngay_ket_thuc >= ngay_bat_dau` |
| **Phân quyền Vai trò Người dùng** | Application / Rule 04 / Rule 05 | *"Chỉ Dược sĩ trưởng mới được duyệt nhập kho"* (Không dùng CHECK constraint) |
| **Quy trình Chuyển Trạng thái** | Application / Rule 02 | Kiểm tra điều kiện đơn hàng chuyển từ `PENDING` sang `PROCESSING` |

---

## 10. NGỮ NGHĨA NULL VÀ GIÁ TRỊ MẶC ĐỊNH (NULL & DEFAULT SEMANTICS)

### 10.1. Bản chất của NULL trong SQL Server

- `NULL` đại diện cho **sự vắng mặt của dữ liệu (absence of value)** hoặc **chưa biết (unknown)**.
- `NULL` **KHÔNG tương đương** với:
  - Chuỗi rỗng `''`;
  - Số không `0`;
  - Giá trị Boolean `false`;
  - Trạng thái nghiệp vụ mặc định.

---

### 10.2. Logic Tam trị (Three-Valued Logic) và Phép So sánh

- Mọi phép so sánh trực tiếp với NULL (`col = NULL` hoặc `col <> NULL`) đều trả về kết quả `UNKNOWN`, dẫn đến loại bỏ bản ghi trong mệnh đề `WHERE`.
- Bắt buộc phải sử dụng toán tử chuẩn: `IS NULL` hoặc `IS NOT NULL`.
- Cẩn trọng khi dùng hàm tổng hợp (Aggregate Functions): `COUNT(column_name)` bỏ qua các giá trị NULL, trong khi `COUNT(*)` đếm toàn bộ số dòng; `SUM(col)` hay `AVG(col)` bỏ qua dòng có giá trị NULL.

---

### 10.3. Ràng buộc Giá trị Mặc định (DEFAULT Constraints)

- Ràng buộc `DEFAULT` chỉ có hiệu lực khi câu lệnh `INSERT` **bỏ qua không liệt kê cột** trong danh sách INSERT.
- Nếu câu lệnh `INSERT` truyền tường minh giá trị `NULL`, SQL Server sẽ chèn giá trị `NULL` (nếu cột cho phép NULL), chứ không kích hoạt giá trị `DEFAULT`.
- Tuyệt đối không âm thầm thay đổi thuộc tính `NULL / NOT NULL` hoặc xóa `DEFAULT` trong quá trình refactor mà không phân tích ảnh hưởng tới code ứng dụng.

---

## 11. THIẾT KẾ CÂU TRUY VẤN SQL (SQL QUERY DESIGN)

### 11.1. Cấm Tuyệt đối `SELECT *` trong Ứng dụng

- Mọi câu truy vấn dữ liệu vận hành trong ứng dụng bắt buộc phải liệt kê tường minh danh sách cột cần lấy:
  ```sql
  -- ĐÚNG:
  SELECT thuoc_id, ten_thuoc, gia_ban, so_luong_ton 
  FROM THUOC 
  WHERE chi_nhanh_id = @BranchId;

  -- SAI (CẤM):
  SELECT * FROM THUOC;
  ```
- **Lý do**: `SELECT *` gây lãng phí băng thông mạng, tăng I/O bộ nhớ, ngăn cản SQL Server sử dụng Covering Index (Index chứa đủ cột), và dễ gãy ứng dụng khi schema thay đổi thứ tự cột.

---

### 11.2. Tính Chuẩn xác của JOIN và Tránh Trùng lặp

- Sử dụng đúng kiểu kết hợp: `INNER JOIN` khi yêu cầu dữ liệu bắt buộc có ở cả hai bảng; `LEFT JOIN` khi bảng phụ có thể không có dữ liệu.
- Kiểm tra kỹ điều kiện `ON` để tránh tạo tích Descartes (Cartesian Product) gây bùng nổ dữ liệu.
- Cảnh giác với việc lạm dụng `DISTINCT` để che giấu lỗi JOIN sai làm nhân đôi số dòng.

---

### 11.3. Tính SARGable của Mệnh đề WHERE

- Các biểu thức tìm kiếm trong mệnh đề `WHERE` phải đảm bảo tính **SARGable (Search Argument Able)** để SQL Server có thể sử dụng Index Seek thay vì Index Scan hoặc Table Scan:
  ```sql
  -- KHÔNG SARGable (Index Scan / Chậm):
  WHERE YEAR(ngay_tao) = 2026

  -- SARGable (Index Seek / Nhanh):
  WHERE ngay_tao >= '2026-01-01T00:00:00Z' AND ngay_tao < '2027-01-01T00:00:00Z'
  ```
- Tránh bao bọc cột chỉ mục trong các hàm tính toán (`SUBSTRING`, `CONVERT`, `ISNULL`) ở vế so sánh của mệnh đề `WHERE`.

---

### 11.4. Phân trang Bị chặn (Bounded Pagination)

- Tuyệt đối cấm câu truy vấn collection không giới hạn số lượng trả về (unbounded queries).
- Sử dụng cú pháp phân trang chuẩn của SQL Server kèm mệnh đề `ORDER BY` đơn định (deterministic sorting):
  ```sql
  SELECT thuoc_id, ten_thuoc, gia_ban
  FROM THUOC
  WHERE chi_nhanh_id = @BranchId
  ORDER BY thuoc_id ASC
  OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
  ```

---

## 12. THAM SỐ HÓA VÀ AN TOÀN SQL (PARAMETERIZATION & SQL SAFETY)

### 12.1. Chuỗi Xử lý Dữ liệu Không Đáng tin cậy (Untrusted Input Chain)

Mọi dữ liệu đầu vào từ phía client đều là untrusted và phải đi qua chuỗi kiểm soát:

```text
Untrusted Client Input
    ↓
API Boundary Validation (Skill 06 / Rule 08)
    ↓
Backend Parameterized Query Building (Skill 03)
    ↓
SQL Server Engine Execution Plan Cache
    ↓
Database Persistence Layer (Skill 07 / Rule 07 / Rule 03)
```

---

### 12.2. Nghiêm cấm Ghép Chuỗi SQL Thô (Raw String Concatenation)

- **TUYỆT ĐỐI CẤM** việc nối chuỗi trực tiếp dữ liệu từ người dùng vào câu lệnh SQL:
  ```csharp
  // SAI — NGUY HIỂM CHẾT NGƯỜI (SQL Injection):
  string sql = "SELECT * FROM THUOC WHERE ten_thuoc = '" + userInput + "'";
  ```
- Mọi truy vấn phải sử dụng cơ chế tham số hóa an toàn:
  - ADO.NET: `SqlCommand.Parameters.Add("@name", SqlDbType.NVarChar).Value = userInput;`
  - Dapper: `connection.Query<ThuocDto>(sql, new { Name = userInput });`
  - EF Core: `context.Thuoc.Where(t => t.TenThuoc == userInput)` hoặc `FromSqlInterpolated`.

---

### 12.3. Tham số hóa trong Dynamic SQL

Nếu bắt buộc phải sử dụng Dynamic SQL (ví dụ: màn hình tìm kiếm thuốc với nhiều bộ lọc tùy chọn):
- Bắt buộc sử dụng thủ tục hệ thống `sp_executesql` có khai báo định kiểu danh sách tham số tường minh;
- Tuyệt đối không ghép nối tham số đầu vào vào chuỗi lệnh dynamic.

---

## 13. RANH GIỚI GIAO DỊCH (TRANSACTIONS)

### 13.1. Phân định Trách nhiệm Giao dịch theo Rule 02

- **Chính sách giao dịch**: Do `02-architecture-quality.md` sở hữu.
- **Skill 07**: Chịu trách nhiệm về cơ chế kỹ thuật hỗ trợ giao dịch phía CSDL (T-SQL transaction commands, isolation levels, deadlock handling, rollback behavior).
- **Không áp đặt máy móc**: Không phát biểu rằng *"Mọi thao tác nhiều bảng đều bắt buộc phải dùng transaction"*. Transaction chỉ được sử dụng khi nghiệp vụ và kiến trúc đòi hỏi tính nguyên tử (Atomicity) và nhất quán (Consistency) giữa các thay đổi dữ liệu phụ thuộc lẫn nhau.

---

### 13.2. Ví dụ Nghiệp vụ Giao dịch Điển hình trong PharmaBranch

Thao tác bán thuốc và xuất kho là ví dụ kinh điển về yêu cầu giao dịch nguyên tử:
1. Tạo bản ghi Hóa đơn (`HOA_DON`);
2. Tạo danh sách Chi tiết hóa đơn (`HOA_DON_CHI_TIET`);
3. Trừ số lượng tồn kho theo lô cụ thể (`TON_KHO`);
4. Ghi nhận nhật ký biến động kho (`GIAO_DICH_KHO`).

Nếu bước 3 thất bại (ví dụ không đủ tồn kho), toàn bộ giao dịch bắt buộc phải **ROLLBACK** hoàn toàn, không để lại dữ liệu hóa đơn dở dang.

---

### 13.3. Kỷ luật Quản lý Ranh giới Giao dịch

- **Giữ giao dịch ngắn nhất có thể**: Mở transaction ngay trước khi ghi dữ liệu và commit ngay sau khi hoàn thành;
- **Tuyệt đối cấm lồng ghép tác vụ ngoại vi vào trong Database Transaction**:
  - Không gọi API cổng thanh toán, không gửi email/SMS, không sinh chữ ký số bên ngoài trong khi đang mở CSDL transaction (sẽ gây giữ khóa tài nguyên lâu, dẫn đến nghẽn mạng và deadlock hàng loạt).

---

## 14. XỬ LÝ ĐỒNG THỜI (CONCURRENCY)

### 14.1. Các Nguy cơ Tranh chấp Dữ liệu Đồng thời

Hệ thống bán thuốc chuỗi phải đối mặt với các nguy cơ tranh chấp nghiêm trọng:
- **Lost Update (Mất dữ liệu cập nhật)**: Hai nhân viên cùng bán vỉ thuốc cuối cùng;
- **Overselling (Bán âm kho)**: Tồn kho thực tế là 1, nhưng hai giao dịch đồng thời cùng đọc tồn kho = 1 và cùng trừ kho thành công;
- **Deadlock**: Hai giao dịch truy cập các tài nguyên theo thứ tự ngược nhau và khóa lẫn nhau.

---

### 14.2. Cơ chế Xử lý Đồng thời tại CSDL

Agent phải lựa chọn cơ chế đồng thời dựa trên kiến trúc và bằng chứng thực tế:
- **Optimistic Concurrency (Khóa lạc quan)**:
  - Sử dụng cột kiểu `rowversion` làm token tự động tăng của SQL Server (lưu ý: `timestamp` là tên đồng nghĩa cũ/legacy synonym trong SQL Server, là kiểu nhị phân và tuyệt đối **không phải** kiểu ngày tháng datetime);
  - Kiểm tra token khi UPDATE: `WHERE id = @Id AND version_token = @OldVersion`. Nếu số dòng ảnh hưởng = 0 -> Có xung đột đồng thời.
- **Pessimistic Locking (Khóa bi quan)**:
  - Sử dụng khóa tường minh trong transaction khi thực sự cần thiết (ví dụ: `SELECT ... WITH (UPDLOCK) WHERE ...`);
  - **Gợi ý khóa (Locking hints) có tính điều kiện**: Các gợi ý khóa đòi hỏi bằng chứng về ngữ nghĩa giao dịch và khối lượng công việc (workload). Tuyệt đối **không coi `ROWLOCK` hay bất kỳ gợi ý khóa nào là yêu cầu mặc định hoặc phổ quát**.
- **Atomic Conditional Updates (Cập nhật nguyên tử có điều kiện)**:
  - Cập nhật nguyên tử có điều kiện được ưu tiên khi nó thỏa mãn trọn vẹn bất biến nghiệp vụ mà không cần thêm locking hints tường minh:
    ```sql
    UPDATE TON_KHO 
    SET so_luong = so_luong - @Qty 
    WHERE thuoc_id = @ThuocId AND chi_nhanh_id = @BranchId AND so_luong >= @Qty;
    ```
    Nếu `@@ROWCOUNT = 0`, báo lỗi không đủ tồn kho và hủy thao tác.

---

### 14.3. Chuyển ngữ Ngữ nghĩa Khóa Khái niệm sang SQL Server

- Tài liệu nghiệp vụ, mô tả yêu cầu hoặc tài liệu CSDL chung có thể sử dụng cú pháp khái niệm như `SELECT ... FOR UPDATE` (phổ biến trong PostgreSQL hay MySQL) để minh họa khóa dòng bi quan.
- SQL Server **không sử dụng cú pháp `FOR UPDATE`**. Khi triển khai trên SQL Server, Agent phải chuyển ngữ yêu cầu đó sang ngữ nghĩa giao dịch và cơ chế khóa được SQL Server hỗ trợ (ví dụ: truy vấn đọc với `WITH (UPDLOCK, HOLDLOCK)` trong transaction hoặc câu lệnh `UPDATE` nguyên tử có điều kiện), tuyệt đối **không sao chép nguyên văn** cú pháp của hệ quản trị CSDL khác vào script T-SQL.

---

## 15. CÔ LẬP DỮ LIỆU CHI NHÁNH (BRANCH / TENANT ISOLATION)

### 15.1. Phân biệt Lọc Dữ liệu vs. Cô lập Dữ liệu

Agent phải phân biệt rạch ròi:
- **Lọc dữ liệu chi nhánh (Branch Filtering)**: Chỉ đơn thuần thêm `WHERE chi_nhanh_id = @BranchId` trong câu SELECT của ứng dụng. Đây là cơ chế lọc hiển thị, **chưa đủ để coi là cô lập an ninh**.
- **Cô lập dữ liệu chi nhánh (Branch Isolation)**: Ranh giới an ninh bắt buộc theo Rule 06, ngăn chặn tuyệt đối tình trạng nhân viên Chi nhánh A đọc, sửa, xóa hoặc suy diễn dữ liệu của Chi nhánh B, dù vô tình hay cố ý thao túng tham số API.

---

### 15.2. Nguyên tắc Bất biến về Chi nhánh

1. **Client BranchId là hoàn toàn không đáng tin cậy**: Không bao giờ sử dụng `branchId` do client gửi lên làm định danh an ninh;
2. **Mô hình dữ liệu thuộc phạm vi chi nhánh (Branch-Scoped Schema)**:
   - Mọi thực thể thuộc sở hữu chi nhánh hoặc nằm trong phạm vi chi nhánh (branch-scoped) bắt buộc phải có một đường dẫn quan hệ chứng minh được và thực thi được (provable and enforceable path) dẫn về phạm vi chi nhánh;
   - Khóa ngoại trực tiếp `chi_nhanh_id` là phù hợp khi thực thể thuộc sở hữu trực tiếp của chi nhánh (ví dụ: bảng tồn kho `TON_KHO`), nhưng **không phải là yêu cầu phổ quát cho mọi bảng trong CSDL** (Direct Branch FK ≠ Universal requirement);
   - Các thực thể danh mục dùng chung hoặc dữ liệu tham chiếu toàn cục (ví dụ danh mục thuốc gốc `THUOC`, đơn vị tính `DON_VI_TINH`) mang tính hệ thống toàn cục và không thuộc sở hữu riêng của một chi nhánh, do đó không mang khóa ngoại chi nhánh;
   - Các thực thể con phụ thuộc (ví dụ chi tiết hóa đơn `HOA_DON_CHI_TIET`, dòng phiếu nhập) thừa hưởng và bảo đảm phạm vi chi nhánh thông qua quan hệ hợp lệ với thực thể cha (ví dụ `HOA_DON`, `PHIEU_NHAP`).
3. **Cô lập quan hệ đa chặng (Relational Traversal Isolation)**: Hóa đơn tại Chi nhánh A tuyệt đối không được tham chiếu hoặc trừ tồn kho của Chi nhánh B; tính cô lập chi nhánh phải được bảo đảm xuyên suốt các quan hệ liên kết bảng.

---

## 16. SQL SERVER ROW-LEVEL SECURITY (RLS)

### 16.1. Khái niệm và Vai trò của SQL Server RLS

Row-Level Security (RLS) là cơ chế an ninh phòng thủ theo chiều sâu (defense-in-depth) ở tầng CSDL của SQL Server:
- **Predicate Function**: Hàm nội tuyến (Inline Table-Valued Function) kiểm tra điều kiện truy cập cho từng dòng;
- **Security Policy**: Chính sách liên kết predicate function với bảng dữ liệu:
  - `FILTER PREDICATE`: Lọc dữ liệu khi đọc (`SELECT`, `UPDATE`, `DELETE`);
  - `BLOCK PREDICATE`: Chặn hành vi ghi dữ liệu vi phạm ranh giới (`INSERT`, `UPDATE`).

---

### 16.2. Luồng Hoạt động với `SESSION_CONTEXT`

```text
Application Acquires DB Connection
    ↓
Set Secure Context: sp_set_session_context 'BranchId', @AuthorizedBranchId
    ↓
Application Executes Query (e.g., SELECT * FROM HOA_DON)
    ↓
SQL Server RLS Evaluates Security Predicate:
WHERE chi_nhanh_id = CAST(SESSION_CONTEXT(N'BranchId') AS INT)
    ↓
Database Returns Strictly Authorized Rows
```

---

### 16.3. Kỷ luật Thực thi RLS An toàn

- **Nguyên tắc Fail-Closed**: Nếu `SESSION_CONTEXT(N'BranchId')` chưa được thiết lập (hoặc mang giá trị NULL), hàm predicate phải trả về `0` dòng (từ chối toàn bộ truy cập), tuyệt đối không mở rộng cho phép đọc tất cả;
- **An toàn Connection Pool**:
  - Khi kết nối được mượn từ pool, ứng dụng bắt buộc phải set lại `SESSION_CONTEXT` cho request mới trước khi chạy bất kỳ truy vấn nào;
  - Tránh tuyệt đối việc rò rỉ context của chi nhánh trước đó sang request của chi nhánh khác;
- **RLS là cơ chế triển khai (Implementation Mechanism)**: RLS được áp dụng khi có yêu cầu từ Rule 06 và kiến trúc codebase; không tự ý áp đặt RLS nếu kiến trúc repository sử dụng mô hình cô lập khác được phê duyệt.

---

## 17. CHIẾN LƯỢC CHỈ MỤC (INDEXING)

### 17.1. Kỷ luật Chỉ mục Dựa trên Bằng chứng (Evidence-Based Indexing)

- Chỉ mục không được tạo theo cảm tính hoặc giả định; mọi quyết định tạo chỉ mục phải dựa trên:
  - Tần suất và mẫu câu truy vấn thực tế (`WHERE`, `JOIN`, `ORDER BY`);
  - Khối lượng dữ liệu (Data Volume) và độ chọn lọc (Selectivity);
  - Đánh đổi chi phí ghi: Mỗi chỉ mục bổ sung làm chậm thao tác `INSERT`, `UPDATE`, `DELETE` và tiêu tốn dung lượng đĩa/bộ đệm.

---

### 17.2. Các Loại Chỉ mục Cần Cân nhắc

- **Clustered Index**: Sắp xếp dữ liệu vật lý của bảng. Mỗi bảng chỉ có 1 clustered index (thường là Primary Key tuần tự).
- **Non-Clustered Index**: Cấu trúc B-Tree phụ trỏ về dữ liệu gốc.
- **Composite Index (Chỉ mục kết hợp)**: Đặt các cột có độ chọn lọc cao (hoặc cột trong điều kiện đẳng thức `=`) lên trước; cột trong điều kiện dải (`BETWEEN`, `>`, `<`) hoặc `ORDER BY` ở sau.
- **Included Columns (`INCLUDE`)**: Đưa các cột cần SELECT vào tầng lá của index để tạo **Covering Index**, tránh thao tác Key Lookup tốn kém.
- **Filtered Index (Chỉ mục có bộ lọc)**: Tối ưu cho các cột có nhiều giá trị NULL hoặc dữ liệu soft-delete (ví dụ: `WHERE is_deleted = 0`).

---

### 17.3. Cấm Tuyệt đối Quy tắc Chỉ mục Máy móc

- **TUYỆT ĐỐI KHÔNG** áp đặt quy tắc máy móc như *"Mọi khóa ngoại đều bắt buộc phải có chỉ mục"*.
- Nếu một bảng con có số lượng dòng rất nhỏ (vài chục dòng danh mục) hoặc bảng ít khi thực hiện JOIN/Filter theo FK đó, việc tạo chỉ mục là lãng phí tài nguyên.
- Định kỳ rà soát và loại bỏ các chỉ mục trùng lặp (duplicate indexes) hoặc chỉ mục không bao giờ được sử dụng (unused indexes).

---

## 18. HIỆU NĂNG TRUY VẤN VÀ ĐO LƯỜNG (QUERY PERFORMANCE)

### 18.1. Quy trình Điều tra Hiệu năng Chuẩn

Khi phát hiện hoặc nghi ngờ vấn đề hiệu năng truy vấn, Agent bắt buộc tuân thủ quy trình:

```text
Xác định Câu truy vấn Thực tế
    ↓
Đo lường Chỉ số (Duration, CPU, Reads/Writes)
    ↓
Phân tích Execution Plan (Kế hoạch Thực thi)
    ↓
Tìm Nguyên nhân Cốt lõi (Root Cause)
    ↓
Tối ưu hóa có Kiểm chứng (Refactor / Index)
    ↓
Đo lường Lại và So sánh
```

---

### 18.2. Nhận diện Dấu hiệu Nguy hiểm trong Execution Plan

Khi đọc Execution Plan trong SQL Server:
- **Table Scan / Clustered Index Scan**: Quét toàn bộ bảng/chỉ mục do thiếu index hoặc câu truy vấn không SARGable;
- **Key Lookup / RID Lookup**: Truy vấn phải nhảy về bảng gốc để lấy thêm cột -> Cân nhắc bổ sung `INCLUDE` columns;
- **Implicit Conversion (Chuyển đổi kiểu ngầm)**: Cột `VARCHAR` so sánh với tham số `NVARCHAR` dẫn đến không dùng được index;
- **Sort Operator**: Phép sắp xếp tốn chi phí lớn trong bộ nhớ do thiếu chỉ mục hỗ trợ `ORDER BY`.

---

### 18.3. Không Tối ưu hóa Sớm (No Premature Optimization)

- Không tự ý phán đoán *"Truy vấn này chậm vì thiếu index"* khi chưa đo lường thời gian chạy và khối lượng I/O thực tế.
- Tránh việc tối ưu hóa sớm khi bảng chỉ có vài chục hoặc vài trăm bản ghi thử nghiệm.

---

## 19. VIEWS, STORED PROCEDURES, FUNCTIONS VÀ TRIGGERS

### 19.1. Đánh giá Khách quan các Đối tượng Lập trình CSDL

Các đối tượng lập trình trong SQL Server (Views, Procs, UDFs, Triggers) là các **công cụ tùy chọn**, không phải yêu cầu bắt buộc:
- Chỉ sử dụng khi kiến trúc codebase đã có quy ước hoặc có lý do kỹ thuật rõ ràng được phê duyệt;
- Không tự ý chuyển đổi hàng loạt business logic từ tầng ứng dụng backend sang Stored Procedures mà không có sự đồng thuận kiến trúc.

---

### 19.2. Tiêu chuẩn Đánh giá Từng Đối tượng

- **Views**: Hữu ích để tạo góc nhìn dữ liệu bảo mật hoặc trừu tượng hóa các phép JOIN phức tạp; tránh lồng ghép view trong view (nested views) nhiều tầng gây nghẽn execution plan.
- **Stored Procedures**: Tốt cho các tác vụ xử lý hàng loạt nội bộ trong CSDL hoặc kiểm soát an ninh truy cập trực tiếp; nhược điểm là khó kiểm thử đơn vị tự động và khó kiểm soát phiên bản bằng git nếu không có project CSDL chuẩn.
- **User-Defined Functions (UDF)**:
  - Cảnh giác cao độ với Scalar UDF trong mệnh đề `SELECT` hoặc `WHERE` vì gây chạy lặp từng dòng (RBAR — Row-By-Agonizing-Row) làm tụt giảm hiệu năng nghiêm trọng;
  - Ưu tiên Inline Table-Valued Functions (ITVF).
- **Triggers**:
  - **CỰC KỲ THẬN TRỌNG** với Triggers: Triggers chạy ngầm, tạo ra các side effects khó lần vết, làm tăng thời gian giữ lock của transaction gốc, và dễ gây lỗi nếu code không xử lý tập bản ghi nhiều dòng (`inserted`, `deleted`);
  - Không dùng Triggers để giải quyết các nghiệp vụ nên thuộc về Application Service.

---

## 20. DI CƯ VÀ TIẾN HÓA LƯỢC ĐỒ (MIGRATIONS & SCHEMA EVOLUTION)

### 20.1. Quản lý Tiến hóa Lược đồ Xác định (Deterministic Evolution)

Mọi thay đổi về cấu trúc CSDL phải được quản lý bằng các kịch bản di cư (migrations) có phiên bản và có tính xác định:
- Tuyệt đối không chỉnh sửa schema trực tiếp bằng tay trên CSDL production mà không có script lưu trữ trong source control;
- Lịch sử di cư (migration history) và chiến lược tiến hóa lược đồ phải đáp ứng yêu cầu tạo mới một CSDL hoặc nâng cấp một CSDL hiện hữu theo đúng chiến lược di cư của repository (chấp nhận các tiếp cận hợp lệ như: baseline + incremental migrations, toàn bộ lịch sử migrations đầy đủ từ đầu, hoặc chiến lược nâng cấp lược đồ có kiểm soát);
- Không ép buộc một framework di cư cụ thể, nhưng bắt buộc đảm bảo tính xác định, thứ tự phụ thuộc, an toàn khi nâng cấp và truy vết được lịch sử thay đổi.

---

### 20.2. Phân định Rạch ròi Ba Khái niệm

Agent phải phân biệt rõ ràng:
1. **Schema Migration**: Thay đổi cấu trúc bảng, cột, kiểu dữ liệu, ràng buộc, chỉ mục;
2. **Data Correction**: Cập nhật hoặc sửa chữa các giá trị dữ liệu hiện có;
3. **Seed Data**: Dữ liệu danh mục nền tảng cần thiết để ứng dụng hoạt động.

---

### 20.3. Kiểm soát Thay đổi Phá vỡ (Destructive Schema Changes)

- Các thao tác phá vỡ cấu trúc: `DROP TABLE`, `DROP COLUMN`, đổi tên cột/bảng (`sp_rename`), thu hẹp kích thước kiểu dữ liệu:
  - Bắt buộc phải được phân tích ảnh hưởng toàn diện trên backend, frontend và mobile;
  - Phải có sự phê duyệt rõ ràng từ người dùng/kiến trúc sư;
  - Áp dụng mẫu hình mở rộng - thu hồi (Expand/Contract pattern) để đảm bảo không làm gián đoạn hệ thống.
- **Quy tắc Read-Only Audit**: Trong các task kiểm toán (audit/review), tuyệt đối **CẤM TẠO MIGRATION** hoặc sửa đổi schema CSDL.

---

## 21. DỮ LIỆU DANH MỤC VÀ KHỞI TẠO (SEED & REFERENCE DATA)

### 21.1. Phân loại Dữ liệu Nền tảng

- **Reference Data (Dữ liệu tham chiếu)**: Danh mục tĩnh ít thay đổi (Danh mục đơn vị tính: Hộp, Vỉ, Viên; Danh mục nhóm thuốc; Danh mục tỉnh thành);
- **Seed Data (Dữ liệu khởi tạo)**: Dữ liệu tối thiểu để khởi động hệ thống (Chi nhánh trụ sở chính, tài khoản quản trị ban đầu, cấu hình hệ thống);
- **Demo / Test Data**: Dữ liệu giả lập phục vụ kiểm thử và trình diễn;
- **Production Data**: Dữ liệu nghiệp vụ thật của nhà thuốc.

---

### 21.2. An toàn Dữ liệu Khởi tạo (Seed Data Security)

- **TUYỆT ĐỐI CẤM** lưu trữ mật khẩu bản rõ, private keys, access tokens, API secrets hoặc thông tin khách hàng/bệnh nhân thật trong các tệp seed scripts;
- Mật khẩu tài khoản mẫu phải được hash an toàn theo tiêu chuẩn của Rule 03 trước khi seed.

---

### 21.3. Tính Lặp lại An toàn của Seed Script (Idempotency)

- Kịch bản nạp dữ liệu khởi tạo / tham chiếu (seed/reference data) phải có tính lặp lại an toàn (idempotent) để có thể chạy lại mà không gây lỗi trùng lặp và không làm mất dữ liệu vận hành:
  ```sql
  IF NOT EXISTS (SELECT 1 FROM DON_VI_TINH WHERE ma_dvt = 'HOP')
  BEGIN
      INSERT INTO DON_VI_TINH (ma_dvt, ten_dvt) VALUES ('HOP', N'Hộp');
  END
  ```
- **Bất biến bảo vệ tính lặp lại (Uniqueness Invariant)**:
  - Việc nạp dữ liệu idempotent phải được bảo đảm bởi một bất biến toàn vẹn thích hợp ở mức CSDL: một ràng buộc `UNIQUE`, một khóa tự nhiên/khóa nghiệp vụ (natural/business key), một định danh ổn định (stable identifier) hoặc mẫu hình chèn/cập nhật phù hợp với ngữ nghĩa đồng thời;
  - **`IF NOT EXISTS` đơn thuần KHÔNG PHẢI là bằng chứng đầy đủ cho tính lặp lại an toàn đồng thời (concurrency-safe idempotency)** nếu thiếu ràng buộc duy nhất vật lý tại CSDL để ngăn chặn xung đột race condition khi có nhiều tiến trình chạy song song;
  - Cần phân biệt rõ: tính lặp lại về mặt logic (logical repeatability), bất biến duy nhất (uniqueness invariant), và tính an toàn đồng thời (concurrency safety).
- Không đưa seed script gộp chung lẫn lộn vào bên trong file migration cấu trúc schema.

---

## 22. SAO LƯU, PHỤC HỒI VÀ TÍNH SẴN SÀNG (BACKUP / RESTORE / RECOVERY)

### 22.1. Phân định Ranh giới Sở hữu theo Rule 07 và Rule 09

Agent phải phân biệt rạch ròi ranh giới quyền hạn giữa Skill 07 và Rule 09:
- **Skill 07 sở hữu tầng CSDL**:
  - Cấu hình và câu lệnh sao lưu CSDL (database backup scripts/commands);
  - Quy trình khôi phục CSDL vật lý (restore procedures);
  - Kiểm tra và xác minh tính toàn vẹn CSDL sau khi phục hồi (database-level recovery validation với `DBCC CHECKDB`);
  - Bằng chứng chứng minh quy trình backup/restore hoạt động được.
- **Rule 09 (`09-observability-operations.md`) sở hữu tầng vận hành và hạ tầng**:
  - Hạ tầng máy chủ và lưu trữ production;
  - Giám sát tiến trình và cảnh báo vận hành tự động (Operational Alerts P1, P2, P3);
  - Kiến trúc khắc phục thảm họa tổng thể (disaster recovery architecture);
  - Điều phối hạ tầng (infrastructure orchestration) và vận hành production.

---

### 22.2. Nguyên tắc Vàng: Sao lưu Chưa Phục hồi là Chưa Đạt

> *"A successful backup does not prove recoverability."*  
> (Một bản sao lưu hoàn thành không đồng nghĩa CSDL có thể phục hồi thành công).

- Khả năng phục hồi dữ liệu chỉ được công nhận khi quy trình khôi phục (restore procedure) đã được diễn tập và kiểm chứng thực tế trong môi trường cô lập.
- CSDL sau khi phục hồi phải vượt qua kiểm tra tính toàn vẹn cấu trúc ở mức CSDL:
  ```sql
  DBCC CHECKDB (N'PharmaBranchDB') WITH NO_INFOMSGS, ALL_ERRORMSGS;
  ```

---

### 22.3. Các Khái niệm Vận hành Cơ bản

- **RPO (Recovery Point Objective)**: Lượng dữ liệu tối đa chấp nhận mất mát tính theo thời gian;
- **RTO (Recovery Time Objective)**: Thời gian tối đa cho phép để khôi phục hệ thống hoạt động trở lại;
- **Các loại Backup trong SQL Server**:
  - Full Backup: Sao lưu toàn bộ CSDL;
  - Differential Backup: Sao lưu các thay đổi kể từ bản Full gần nhất;
  - Transaction Log Backup: Sao lưu nhật ký giao dịch, cho phép phục hồi về mốc thời gian cụ thể (Point-in-Time Recovery).
- **Ranh giới Kỹ thuật**: Agent không tự bịa đặt hạ tầng production hư cấu; các khuyến nghị sao lưu phải bám sát năng lực và quy mô thực tế của dự án.

---

## 23. KIỂM THỬ VÀ XÁC MINH CƠ SỞ DỮ LIỆU (DATABASE TESTING & VALIDATION)

### 23.1. Các Nhóm Kiểm thử CSDL Bắt buộc

1. **Schema & Integrity Tests**:
   - Kiểm tra trùng PK -> Bắt buộc bị từ chối;
   - Kiểm tra chèn FK trỏ tới ID không tồn tại -> Bắt buộc bị từ chối;
   - Kiểm tra vi phạm CHECK constraint (số lượng âm, đơn giá âm) -> Bắt buộc bị từ chối;
   - Kiểm tra vi phạm NOT NULL -> Bắt buộc bị từ chối;
   - Kiểm tra vi phạm UNIQUE -> Bắt buộc bị từ chối.
2. **Query & Logic Tests**:
   - Xác minh câu truy vấn trả về đúng tập dữ liệu, không sinh dòng trùng lặp, xử lý đúng giá trị NULL;
   - Xác minh thuật toán phân trang và sắp xếp dữ liệu.
3. **Security & Isolation Tests**:
   - Kiểm tra tấn công SQL Injection thông qua các tham số đầu vào -> Phải an toàn 100%;
   - Kiểm tra truy cập chéo chi nhánh: User Chi nhánh A truy vấn dữ liệu Chi nhánh B -> Bắt buộc bị chặn;
   - Kiểm tra RLS predicate với các session context khác nhau.
4. **Concurrency Tests**:
   - Kiểm thử tranh chấp cập nhật tồn kho đồng thời (hai request cùng mua sản phẩm có số lượng = 1) -> Đảm bảo không bị overselling;
   - Kiểm thử phát hiện và xử lý deadlock.
5. **Migration & Evolution Tests**:
   - Kiểm thử tạo mới CSDL từ migrations trên database trắng (clean database);
   - Kiểm thử nâng cấp schema và kiểm tra dữ liệu không bị mất mát.

---

### 23.2. Phân định Ranh giới Kiểm thử (Testing Boundaries)

Agent phải phân biệt rạch ròi:
- **Database Tests pass** chỉ chứng minh các ràng buộc toàn vẹn CSDL và câu lệnh SQL hoạt động đúng;
- Database Tests **KHÔNG chứng minh** rằng toàn bộ hệ thống phân quyền ứng dụng (Rule 05) hay hợp đồng API (Rule 08) đã hoàn toàn an toàn;
- Hệ thống đòi hỏi kiểm chứng end-to-end xuyên suốt từ Client -> API -> Backend -> CSDL.

---

## 24. BẢNG KIỂM TRA CHẤT LƯỢNG CƠ SỞ DỮ LIỆU (DATABASE QUALITY CHECKLIST)

Trước khi kết luận bất kỳ task kỹ thuật nào liên quan đến CSDL hoàn thành, Agent bắt buộc đối chiếu với danh sách kiểm tra sau theo mô hình đánh giá 4 trạng thái:
- **PASS**: Đã kiểm chứng đầy đủ và đáp ứng tiêu chuẩn bằng bằng chứng vật lý;
- **FAIL**: Vi phạm tiêu chuẩn hoặc không đạt yêu cầu kỹ thuật;
- **NOT APPLICABLE (N/A)**: Mục kiểm tra không áp dụng cho phạm vi task hiện tại (kèm lý do kỹ thuật rõ ràng);
- **NOT VERIFIED**: Chưa đủ bằng chứng vật lý để xác nhận (phải báo cáo minh bạch, không được tự suy đoán thành PASS).

Definition of Done (DoD) được thỏa mãn khi:
1. Tất cả các mục kiểm tra áp dụng (APPLICABLE) đều đạt **PASS**;
2. Tuyệt đối không còn mục **FAIL** chưa được giải quyết;
3. Mọi mục **NOT APPLICABLE** hoặc **NOT VERIFIED** đều được ghi nhận minh bạch kèm lý do kỹ thuật hoặc tình trạng bằng chứng tương ứng.

### 24.1. Discovery & Evidence (Khảo sát & Bằng chứng)
- [ ] **1. Động cơ CSDL được xác thực đúng**: Xác nhận SQL Server là target CSDL từ bằng chứng vật lý của repository.
- [ ] **2. Nguồn sự thật của Schema được xác định**: Phân định rõ schema đang được quản lý bởi code migrations, sql scripts hay db project.
- [ ] **3. Bằng chứng vật lý được kiểm tra trước khi phán đoán**: Không suy diễn cấu trúc CSDL chỉ từ tài liệu mô tả hay hình vẽ ERD.
- [ ] **4. Trạng thái implementation được gắn nhãn minh bạch**: Phân biệt rạch ròi giữa `IMPLEMENTED`, `VERIFIED`, `NOT VERIFIED` và `PROPOSED`.

### 24.2. Schema, Primary Keys & Foreign Keys (Cấu trúc & Khóa)
- [ ] **5. Mọi bảng đều có Primary Key tường minh**: Khóa chính duy nhất, ổn định, bất biến và khai báo `NOT NULL`.
- [ ] **6. Kiểu dữ liệu Primary Key không bị đổi tùy tiện**: Không tự ý đổi kiểu dữ liệu khóa chính khi chưa có yêu cầu kiến trúc và bằng chứng.
- [ ] **7. Quan hệ tham chiếu được bảo vệ bằng Foreign Key**: Khóa ngoại vật lý ngăn chặn triệt để bản ghi mồ côi.
- [ ] **8. Không lạm dụng CASCADE DELETE trên dữ liệu vận hành**: Dữ liệu tài chính, bán lẻ, kho và audit sử dụng `NO ACTION` / `RESTRICT`.
- [ ] **9. Thứ tự di cư không có quan hệ vòng**: Schema và migrations sắp xếp thứ tự bảng cha trước bảng con, tránh circular references.

### 24.3. Data Types & Semantics (Kiểu dữ liệu & Ngữ nghĩa)
- [ ] **10. Giá trị tiền tệ và số lượng dùng kiểu số chính xác**: Bắt buộc dùng `DECIMAL(p, s)`, tuyệt đối cấm dùng `FLOAT` / `REAL`.
- [ ] **11. Mốc thời gian hệ thống ưu tiên chuẩn UTC**: Ưu tiên lưu trữ `DATETIME2` và giờ UTC (`SYSUTCDATETIME()`) khi phù hợp quy ước repository và ngữ nghĩa miền dữ liệu.
- [ ] **12. Dữ liệu văn bản Unicode khi miền dữ liệu yêu cầu**: Sử dụng các kiểu Unicode như `NVARCHAR` khi nghiệp vụ và quy ước yêu cầu, với độ dài hợp lý, tránh lạm dụng `MAX`.
- [ ] **13. Ngữ nghĩa NULL được xử lý chuẩn xác**: Không đồng nhất NULL với chuỗi rỗng hoặc số 0; dùng `IS NULL` / `IS NOT NULL`.
- [ ] **14. Giá trị mặc định (DEFAULT) không che giấu lỗi**: Default constraints không làm sai lệch ý đồ truyền dữ liệu của ứng dụng.

### 24.4. Constraints & Integrity (Ràng buộc & Toàn vẹn)
- [ ] **15. Ràng buộc miền giá trị được enforce ở CSDL**: Sử dụng `CHECK` constraints cho các bất biến vật lý (`so_luong >= 0`, `don_gia >= 0`).
- [ ] **16. Mã nghiệp vụ duy nhất được bảo vệ bằng UNIQUE**: Tránh trùng lặp mã thuốc, mã vạch, số hóa đơn bằng UNIQUE constraints/indexes.
- [ ] **17. Phân biệt rõ ràng ràng buộc CSDL vs nghiệp vụ ứng dụng**: Không biến CSDL thành nơi thực thi các luồng phân quyền người dùng phức tạp.
- [ ] **18. Đặt tên ràng buộc theo quy ước nhất quán**: Ưu tiên các tiền tố quy ước khuyến nghị như `PK_`, `FK_`, `UQ_`, `CK_`, `DF_` hoặc quy ước nhất quán của repository.

### 24.5. SQL Safety & Query Design (Truy vấn & An toàn SQL)
- [ ] **19. Không sử dụng `SELECT *` trong ứng dụng**: Liệt kê tường minh danh sách cột cần truy vấn.
- [ ] **20. 100% câu truy vấn dùng Parameterized Queries**: Không ghép chuỗi thô với dữ liệu người dùng; triệt tiêu hoàn toàn SQL Injection.
- [ ] **21. Mệnh đề WHERE đảm bảo tính SARGable**: Không bao bọc cột chỉ mục trong các hàm tính toán làm mất khả năng Index Seek.
- [ ] **22. Bounded pagination với ORDER BY đơn định**: Phân trang có giới hạn kích thước trang và sắp xếp xác định.

### 24.6. Transactions & Concurrency (Giao dịch & Đồng thời)
- [ ] **23. Ranh giới Transaction tuân thủ Rule 02**: Sử dụng transaction khi cần đảm bảo tính nguyên tử giữa các bảng phụ thuộc lẫn nhau.
- [ ] **24. Không chứa tác vụ ngoại vi trong Database Transaction**: Không gọi mạng, cổng thanh toán hay email khi đang mở transaction.
- [ ] **25. Cơ chế Concurrency bảo vệ chống overselling**: Sử dụng token `rowversion`, cập nhật nguyên tử có điều kiện hoặc locking có kiểm chứng ngăn chặn bán âm kho; không áp đặt ROWLOCK mặc định; chuyển ngữ FOR UPDATE sang ngữ nghĩa SQL Server.

### 24.7. Branch Isolation & Row-Level Security (Cô lập Chi nhánh & RLS)
- [ ] **26. Dữ liệu phạm vi chi nhánh có đường dẫn ràng buộc xác định**: Mọi thực thể thuộc phạm vi chi nhánh có đường dẫn quan hệ chứng minh được và thực thi được về chi nhánh; phân biệt rõ dữ liệu sở hữu trực tiếp, dữ liệu con thừa hưởng và danh mục dùng chung toàn cục.
- [ ] **27. Không tin tưởng client-supplied BranchId**: Định danh chi nhánh bắt buộc trích xuất từ server authentication context.
- [ ] **28. RLS thực thi nguyên tắc Fail-Closed**: Khi `SESSION_CONTEXT` rỗng hoặc không hợp lệ, RLS predicate từ chối truy cập dữ liệu.

### 24.8. Migrations, Seed, Operations & Testing (Vận hành & Kiểm thử)
- [ ] **29. Migration xác định, hỗ trợ tạo mới hoặc nâng cấp theo chiến lược repo**: Không xóa cột/bảng tùy tiện; kịch bản hỗ trợ tạo mới hoặc nâng cấp CSDL an toàn; tuân thủ quy tắc Read-Only trong audit tasks.
- [ ] **30. Seed data tách biệt, có bất biến bảo vệ tính lặp lại (Idempotent)**: Dựa trên UNIQUE constraint/khóa tự nhiên để bảo đảm an toàn đồng thời; phân biệt tính lặp lại logic với an toàn tranh chấp; tuyệt đối không chứa mật khẩu bản rõ hay secrets.
- [ ] **31. Quy trình sao lưu và phục hồi CSDL được kiểm chứng**: Nhận thức rõ "sao lưu thành công chưa chứng minh khả năng phục hồi"; phân định ranh giới backup/restore của Skill 07 với hạ tầng/cảnh báo vận hành của Rule 09.
- [ ] **32. Kiểm thử CSDL đầy đủ các ca thành công và thất bại**: Bao phủ kiểm thử schema, câu truy vấn, an toàn SQL, tranh chấp đồng thời và cô lập chi nhánh.

---

## 25. TUÂN THỦ QUẢN TRỊ DỰ ÁN VÀ RANH GIỚI CROSS-SKILL (GOVERNANCE & CROSS-SKILL BOUNDARY)

### 25.1. Bảng Ma trận Thẩm quyền Toàn hệ thống

| Lĩnh vực Quản trị | Thẩm quyền Tối cao (Authority) | Vai trò của Skill 07 (Database Implementation) |
| :--- | :--- | :--- |
| **Quản trị dự án & Evidence-first** | `00-project-governance.md` | Tuân thủ tuyệt đối quy tắc evidence-first, không tự sửa ngoài scope |
| **Kiến trúc hệ thống tổng thể** | `01-architecture.md` | Tuân thủ kiến trúc Client-Server, CSDL là tầng persistence cuối cùng |
| **Giao dịch, Concurrency & Idempotency** | `02-architecture-quality.md` | Triển khai hỗ trợ kỹ thuật ở tầng CSDL theo chính sách của Rule 02 |
| **An ninh, Mã hóa, Chống Injection** | `03-security.md` | Bảo đảm 100% parameterized SQL, bảo vệ dữ liệu nhạy cảm theo CLS |
| **Mô hình Phân quyền RBAC** | `04-rbac.md` | CSDL không định nghĩa lại mô hình vai trò của hệ thống |
| **Thẩm định Quyền hạn Runtime** | `05-authorization.md` | Phân quyền do server-side thực thi; CSDL không thay thế API authorization |
| **Cô lập Dữ liệu Chi nhánh** | `06-branch-isolation.md` | Triển khai mô hình bảng chi nhánh và RLS hỗ trợ chính sách của Rule 06 |
| **Toàn vẹn CSDL Tối cao** | `07-database-integrity.md` | Skill 07 hiện thực hóa chính sách toàn vẹn của Rule 07 thành schema vật lý |
| **Hợp đồng API & Định dạng DTO** | `08-api-contract.md` | CSDL không quyết định cấu trúc DTO; ánh xạ dữ liệu đúng chuẩn |
| **Giám sát, Tracing & Logging** | `09-observability-operations.md` | Ghi nhận telemetry truy vấn chậm, theo dõi kết nối CSDL và sức khỏe hệ thống |
| **Triển khai Backend .NET** | Skill 03 (`03-dotnet-backend`) | Skill 07 cung cấp schema và query patterns; Skill 03 viết mã C# truy cập CSDL |
| **Thiết kế Tầng API** | Skill 06 (`06-api-design`) | Skill 06 sở hữu API endpoint/DTO; Skill 07 sở hữu lưu trữ bền vững |

---

### 25.2. Chuỗi luồng Phối hợp Liên kỹ năng (Cross-Skill Flow)

```text
Skill 01 (Khảo sát hiện trạng codebase & cấu trúc CSDL)
   ↓
Rule 01 (Kiến trúc Client-Server)
   ↓
Rule 07 (Chính sách Toàn vẹn Dữ liệu Tối cao)
   ↓
Skill 07 (Thiết kế Schema CSDL, Data Types, PK, FK, Constraints, RLS, Indexes)
   ↓
Skill 03 (Triển khai Backend .NET, Data Access, Entity Mapping, DbContext)
   ↓
Rule 06 & Rule 05 (Thẩm định Branch Isolation & Runtime Authorization)
   ↓
Rule 02 (Thực thi Transaction Boundary & Concurrency Control)
   ↓
Skill 06 (Cung cấp API Endpoints an toàn ra bên ngoài)
   ↓
Skill 04 / Skill 05 (Clients Web & Mobile kết nối API)
```

---

### 25.3. Nguyên tắc Xử lý Xung đột (Conflict Resolution)

- **Khi Skill 07 mâu thuẫn với Rules `00–09`**:
  > **Rules luôn luôn thắng (Rules ALWAYS win).** Bắt buộc điều chỉnh thiết kế CSDL để tuân thủ tuyệt đối quy định của Rules.
- **Khi ERD mâu thuẫn với Schema CSDL thực tế**:
  > **DỪNG LẠI và báo cáo (STOP and report).** Bằng chứng schema vật lý phản ánh thực tế triển khai, ERD chỉ là tài liệu thiết kế.
- **Khi Best Practice chung mâu thuẫn với Quy ước Hiện tại của Dự án**:
  > **Quy ước dự án đã được thiết lập luôn luôn thắng**, trừ khi có quyết định kiến trúc chính thức thay đổi.

---

### 25.4. Danh mục Các Phản Mẫu CSDL Cần Tránh (Database Anti-Patterns)

1. **`SELECT *` trong ứng dụng**: Gây lãng phí tài nguyên và rủi ro schema drift;
2. **Ghép chuỗi SQL thô (SQL Concatenation)**: Mở toang lỗ hổng SQL Injection;
3. **Thiếu Foreign Key ràng buộc vật lý**: Dẫn đến dữ liệu mồ côi khi lỗi ứng dụng xảy ra;
4. **Phó mặc toàn vẹn dữ liệu cho tầng ứng dụng**: Thiếu CHECK/NOT NULL constraints ở CSDL;
5. **Thay đổi kiểu dữ liệu khóa chính tùy tiện**: Tự ý đổi INT sang GUID hoặc BIGINT;
6. **Lạm dụng CASCADE DELETE trên dữ liệu vận hành**: Nguy cơ xóa sạch lịch sử hóa đơn/kho;
7. **Tạo chỉ mục tràn lan (Over-Indexing)**: Làm tê liệt hiệu năng thao tác ghi INSERT/UPDATE;
8. **Chỉ mục trùng lặp hoặc không sử dụng**: Lãng phí bộ nhớ đệm và I/O;
9. **Tối ưu hóa sớm không có đo lường**: Tự phán đoán thiếu index mà không xem Execution Plan;
10. **Lạm dụng Triggers cho nghiệp vụ ứng dụng**: Gây ra side effects ngầm khó debug;
11. **Thực hiện thay đổi phá vỡ (DROP) không kiểm soát**: Gây crash đột ngột hệ thống;
12. **Gộp lẫn kịch bản Seed Data vào Schema Migration**: Gây lỗi khi chạy lại migration;
13. **Coi hình vẽ ERD là bằng chứng code đã triển khai**: Vi phạm nguyên tắc evidence-first;
14. **Tin tưởng tham số `branchId` từ client**: Vi phạm ranh giới an ninh chi nhánh;
15. **Chỉ lọc `WHERE branch_id = @id` mà coi là cô lập chi nhánh**: Thiếu cơ chế an ninh phòng thủ;
16. **Xử lý `SESSION_CONTEXT` không an toàn trong Connection Pool**: Gây rò rỉ dữ liệu chéo chi nhánh;
17. **Cập nhật tồn kho có nguy cơ race condition**: Gây bán âm kho khi có giao dịch đồng thời;
18. **Âm thầm thay đổi ngữ nghĩa NULL**: Dẫn đến sai lệch logic tam trị trong các truy vấn cũ;
19. **Lưu trữ mật khẩu hoặc secrets trong Seed Scripts**: Vi phạm nghiêm trọng chuẩn an ninh;
20. **Tự ý sửa CSDL trong các task Read-Only Audit**: Vi phạm kỷ luật quản trị dự án.

---

### 25.5. Quy trình Tương thích Kiểm toán Chỉ Đọc (Read-Only Audit Protocol)

Khi thực hiện task kiểm toán (audit/review CSDL):
- **TUYỆT ĐỐI KHÔNG**:
  - Không sửa schema, bảng, cột;
  - Không tạo hoặc sửa file migration;
  - Không tạo hoặc sửa file seed;
  - Không tạo mới hoặc xóa chỉ mục;
  - Không sửa chữa hay chỉnh sửa dữ liệu;
  - Không âm thầm sửa lỗi CSDL phát hiện được.
- **QUY TRÌNH BẮT BUỘC**:
  ```text
  Khảo sát (Discover) → Kiểm tra (Inspect) → Lần vết (Trace) → Xác minh (Validate) → Báo cáo (Report)
  ```
- Khi phát hiện khiếm khuyết CSDL, Agent lập báo cáo gồm:
  - Vị trí tệp tin/bảng/cột/ràng buộc liên quan;
  - Bằng chứng vật lý chứng minh lỗi;
  - Tác động an ninh hoặc toàn vẹn dữ liệu;
  - Mức độ nghiêm trọng (Severity) và độ tin cậy (Confidence);
  - Đề xuất khắc phục kỹ thuật để người dùng xem xét.

---

### 25.6. Định nghĩa Hoàn thành của Task CSDL (Definition of Done)

Một task kỹ thuật CSDL chỉ được công nhận hoàn thành khi đáp ứng đủ các tiêu chuẩn:

```text
Discovery (Đã khảo sát hiện trạng CSDL và xác định đúng target engine)
    ↓
Schema Integrity (Schema có PK, FK, NOT NULL, CHECK, UNIQUE đầy đủ)
    ↓
SQL Safety (100% câu truy vấn sử dụng parameterized queries, không ghép chuỗi)
    ↓
Transaction & Concurrency (Ranh giới giao dịch theo Rule 02, chống race condition kho)
    ↓
Branch Isolation (Bảo toàn ranh giới chi nhánh theo Rule 06, RLS chuẩn nếu áp dụng)
    ↓
Performance & Indexing (Chỉ mục dựa trên bằng chứng, truy vấn SARGable, phân trang an toàn)
    ↓
Migration & Seed (Migration có phiên bản xác định, seed idempotent không chứa secrets)
    ↓
Testing & Verification (Đã vượt qua kiểm thử đơn vị CSDL cho cả ca thành công và thất bại)
    ↓
Quality Checklist (Tất cả mục áp dụng trong Mục 24 đạt PASS, không còn mục FAIL, các mục N/A và NOT VERIFIED được ghi nhận minh bạch)
```
