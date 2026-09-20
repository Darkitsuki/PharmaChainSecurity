---
name: database-oracle
description: >
  Guides database engineering and Oracle Database implementation for the PharmaBranch
  project, including schema design, constraints, SQL safety, transactions,
  concurrency, branch isolation, Virtual Private Database (VPD), Data Redaction, indexing, performance,
  migrations, seed data, backup/recovery validation, testing, and database
  refactoring while respecting Rules 00–09 and repository evidence.
---

# SKILL 07 — DATABASE ORACLE

## 1. MỤC TIÊU VÀ PHẠM VI (OBJECTIVE & SCOPE)

### 1.1. Mục tiêu (Objective)

Skill này hướng dẫn Agent thực hiện các hoạt động kỹ thuật cơ sở dữ liệu (database engineering) và triển khai Oracle Database (Oracle Database 23ai / 23c / 21c / Free Edition) trong hệ thống quản lý chuỗi nhà thuốc đa chi nhánh PharmaBranch theo quy trình chuẩn:

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

Skill này tập trung vào khía cạnh triển khai kỹ thuật tầng cơ sở dữ liệu (Database Implementation HOW), biến các chính sách kiến trúc và toàn vẹn dữ liệu thành các cấu trúc vật lý an toàn, nhất quán và hiệu quả trên nền tảng Oracle Database.

---

### 1.2. Phân định Chính sách vs. Triển khai (Policy vs. Implementation)

Agent phải phân biệt rõ ràng:
- **Chính sách cơ sở dữ liệu (Database Policy — WHAT / AUTHORITY)**: Do các Rules `00–09` sở hữu:
  - `07-database-integrity.md` quy định chính sách toàn vẹn dữ liệu, khóa chính, khóa ngoại, CHECK constraints, tính bất biến của sổ cái giao dịch trong Oracle.
  - `02-architecture-quality.md` quy định chính sách transaction, concurrency control, idempotency và state transitions.
  - `06-branch-isolation.md` quy định chính sách cô lập dữ liệu chi nhánh và ranh giới tenant.
- **Triển khai kỹ thuật cơ sở dữ liệu (Database Implementation — HOW)**: Thuộc thẩm quyền của **Skill 07**, bao gồm:
  - Cú pháp Oracle SQL & PL/SQL, kiểu dữ liệu (`VARCHAR2`, `NVARCHAR2`, `NUMBER`, `TIMESTAMP`, `CLOB`), lược đồ bảng, ràng buộc vật lý, chỉ mục (indexes);
  - Parameterized database access và bảo vệ an toàn câu truy vấn;
  - Cơ chế khóa dòng (`SELECT ... FOR UPDATE`), mức độ cô lập giao dịch (isolation levels), Virtual Private Database (VPD) predicates;
  - Kịch bản migration, seed data, sao lưu/phục hồi (RMAN, Data Pump) và kiểm thử tầng CSDL.

---

### 1.3. Phạm vi Áp dụng (Scope)

Skill 07 áp dụng cho mọi thao tác liên quan đến Oracle Database trong PharmaBranch:
- Khảo sát cấu trúc bảng, views, packages, stored procedures, functions, triggers và migrations;
- Thiết kế và chỉnh sửa schema, bảng, cột, kiểu dữ liệu, PK, FK, UNIQUE, CHECK, DEFAULT;
- Xây dựng câu truy vấn SQL an toàn, tham số hóa (parameterized queries);
- Triển khai transaction và concurrency control ở tầng database (`SELECT FOR UPDATE`);
- Triển khai cô lập dữ liệu chi nhánh và Oracle Virtual Private Database (VPD / DBMS_RLS) cùng Data Redaction (DBMS_REDACT);
- Thiết kế chỉ mục (indexing), phân tích execution plans (EXPLAIN PLAN) và tối ưu hóa truy vấn;
- Quản lý migration versioning, seed data và kiểm định quy trình backup/restore (RMAN, Data Pump);
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
7. Official Technology Documentation (Oracle Database Docs)
   ↓
8. Generic Best Practices (Chuẩn mực kỹ thuật CSDL chung)
   ↓
9. Agent Preference (Sở thích cá nhân của Agent — Ưu tiên thấp nhất)
```

**Nguyên tắc vàng**: "Best practice" chung không bao giờ được phép ghi đè bằng chứng vật lý của repository và các Rules `00–09`.

---

### 2.2. Tính Trung lập Công nghệ (Technology Neutrality)

Mục tiêu công nghệ CSDL của dự án là **Oracle Database (Free Edition / 23ai / 21c)** khi có bằng chứng codebase hoặc kiến trúc đã phê duyệt xác nhận. Tuy nhiên, Agent tuyệt đối **KHÔNG được tự động áp đặt**:
- Entity Framework Core (`Oracle.EntityFrameworkCore`), Dapper, ODP.NET (Oracle.ManagedDataAccess) hay LINQ;
- Repository Pattern hay Unit of Work ở tầng CSDL;
- Bắt buộc phải dùng Packages, Stored Procedures, Views, Functions hay Triggers;
- Bắt buộc phải dùng EF Core Migrations, SQLcl, Liquibase hay Flyway.

Đây là các phương án triển khai tùy chọn. Quyết định kỹ thuật phải dựa trên:
1. Bằng chứng vật lý đã có trong repository;
2. Quy ước hiện tại của codebase;
3. Kiến trúc đã được phê duyệt chính thức.

Nếu có yêu cầu đưa công nghệ/công cụ mới vào dự án, Agent phải báo cáo rõ:
- **Tên công cụ/công nghệ**: (Ví dụ: Dapper, Liquibase);
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
| **Toàn vẹn CSDL (Integrity, PK, FK, CHECK, NULL)** | `07-database-integrity.md` | Thiết kế schema, định nghĩa PK, FK, UNIQUE, CHECK, NOT NULL, DEFAULT constraints bằng Oracle SQL an toàn |
| **Giao dịch (Transactions & ACID)** | `02-architecture-quality.md` | Hỗ trợ transaction boundaries, kiểm soát thời gian giữ lock, tránh lồng ghép tác vụ ngoại vi vào DB transaction |
| **Xử lý đồng thời (Concurrency Control)** | `02-architecture-quality.md` | Triển khai `SELECT ... FOR UPDATE`, version tokens, isolation levels, UPDATE nguyên tử |
| **Cô lập Chi nhánh (Branch Isolation)** | `06-branch-isolation.md` | Mô hình hóa đường dẫn ranh giới chi nhánh, bảo đảm query không đọc chéo tenant |
| **Virtual Private Database (VPD)** | `06-branch-isolation.md` | Triển khai policy functions (`DBMS_RLS.ADD_POLICY`), phối hợp application context (`SYS_CONTEXT`) |
| **Data Redaction (Ẩn dữ liệu nhạy cảm)** | `03-security.md` | Triển khai chính sách che/ẩn cột (`DBMS_REDACT.ADD_POLICY`) theo yêu cầu bảo vệ doanh thu |
| **An toàn SQL & Chống Injection** | `03-security.md` | Đảm bảo 100% câu truy vấn sử dụng parameterized queries; cấm ghép chuỗi câu lệnh thô |
| **Sao lưu & Phục hồi CSDL** | `09-observability-operations.md` & Rule 07 | Skill 07 sở hữu kịch bản backup/restore CSDL (RMAN, Data Pump) và kiểm tra toàn vẹn sau phục hồi; Rule 09 sở hữu hạ tầng DR và cảnh báo vận hành |
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
- Scripts CSDL: `*.sql`, `schema.sql`, `init.sql`, `seed.sql`, `tables/`, `packages/`, `views/`;
- Project CSDL: tệp script PL/SQL, Liquibase changelogs, Flyway migrations;
- Migration files: thư mục `Migrations/`, EF Core migrations (`Oracle.EntityFrameworkCore`);
- Ứng dụng backend: `DbContext`, entity configurations, repository classes, raw SQL queries;
- Cấu hình & Môi trường: Connection strings trong `appsettings.json`, `docker-compose.yml`, scripts CI/CD;
- Automated Tests: Integration tests kết nối CSDL (Testcontainers Oracle), DbContext tests, migration tests.

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
Oracle Database Engine
    ↓
Table / View / Package / Procedure
    ↓
Constraints / Indexes / VPD Policies
```

---

### 4.4. Thứ bậc Bằng chứng CSDL (Evidence Hierarchy)

Độ tin cậy của bằng chứng được xếp hạng giảm dần:
1. **Physical Executable Database Schema**: Cấu trúc CSDL thực tế đang chạy trên Oracle Database.
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

- Kiểu dữ liệu phải biểu diễn chính xác ngữ nghĩa của trường thông tin trong thế giới thực trên Oracle Database.
- Kích thước lưu trữ phải vừa đủ, tránh lãng phí dung lượng bộ nhớ và I/O đĩa.
- Phải tương thích với kiểu dữ liệu của tầng ứng dụng .NET (`Oracle.EntityFrameworkCore` trong Skill 03) và hợp đồng API (Skill 06).

---

### 6.2. Số học Chính xác: Giá trị Tiền tệ và Số lượng (Financial & Quantity Precision)

- **Giá trị tiền tệ và đơn giá**: Bắt buộc sử dụng số học chính xác (`NUMBER(p, s)`). **TUYỆT ĐỐI CẤM** dùng các kiểu dấu phẩy động xấp xỉ như `BINARY_FLOAT` hoặc `BINARY_DOUBLE` vì lỗi làm tròn số học (rounding errors).
- **Số lượng tồn kho, đóng gói**: Dùng kiểu số nguyên (`NUMBER(10)`) nếu đơn vị là số lượng đếm được (hộp, vỉ, viên); hoặc dùng `NUMBER(p, s)` nếu đơn vị có phần thập phân (ml, gram, liều).
- **Lưu ý về độ chính xác**: Độ chính xác và thang đo cụ thể (ví dụ `NUMBER(18, 2)` hay `NUMBER(18, 4)`) là ví dụ minh họa; Agent phải lựa chọn dựa trên quy ước schema hiện có và yêu cầu nghiệp vụ thực tế, không biến giá trị cụ thể thành quy tắc phổ quát.

---

### 6.3. Thời gian và Ngày tháng (Temporal & Date/Time)

- Sử dụng `TIMESTAMP(6)` hoặc `TIMESTAMP WITH TIME ZONE` lưu trữ tương thích chuẩn UTC (`SYSTIMESTAMP` / `CURRENT_TIMESTAMP`) khi phù hợp với quy ước repository và ngữ nghĩa miền dữ liệu.
- Sử dụng kiểu `DATE` thuần túy cho các trường ngày không cần mốc giờ (ngày sản xuất, ngày hết hạn thuốc, ngày sinh).

---

### 6.4. Chuỗi Ký tự và Unicode (Strings & Text)

- Sử dụng `NVARCHAR2(n)` hoặc `VARCHAR2(n CHAR)` khi dữ liệu miền nghiệp vụ và quy ước repository đòi hỏi hỗ trợ Unicode UTF-8 (tiếng Việt có dấu, tên thuốc, họ tên, địa chỉ, ghi chú).
- Sử dụng `VARCHAR2(n CHAR)` khi chắc chắn dữ liệu là mã ASCII không dấu (mã vạch Barcode, mã SKU, mã số thuế, mã ISO).
- Sử dụng `CLOB` / `NCLOB` cho nội dung văn bản lớn không xác định độ dài (JSON payload, nhật ký audit chi tiết). Tránh dùng kiểu `LONG` cũ đã lỗi thời.

---

### 6.5. Định danh Khóa (Identifiers)

- Các lựa chọn định danh: `NUMBER(10) GENERATED BY DEFAULT AS IDENTITY`, `NUMBER(19) GENERATED BY DEFAULT AS IDENTITY`, `SEQUENCE + TRIGGER` hoặc `RAW(16)` (GUID).
- **Tuyệt đối không tự ý chuyển đổi kiểu dữ liệu khóa chính**:
  - Không tự tiện đổi `NUMBER(10)` sang `NUMBER(19)` nếu dung lượng bảng chưa cần;
  - Không tự tiện đổi `NUMBER` sang `RAW(16)` hoặc `VARCHAR2` sang GUID mà không có yêu cầu kiến trúc và bằng chứng phê duyệt.

---

## 7. KHÓA CHÍNH (PRIMARY KEYS)

### 7.1. Bất biến Khóa chính (PK Invariants)

Theo quy định của Rule 07, mọi bảng trong CSDL bắt buộc phải có một Primary Key duy nhất:
- Cột khóa chính bắt buộc phải khai báo `NOT NULL`;
- Khóa chính phải đảm bảo tính **duy nhất (uniqueness)**, **ổn định (stability)** và **bất biến (immutability)**;
- Tuyệt đối **không cập nhật (UPDATE)** hoặc tái sử dụng giá trị khóa chính sau khi đã tạo bản ghi.

---

### 7.2. Khóa Thay thế (Surrogate Key) vs. Khóa Tự nhiên (Natural Key)

- **Khóa thay thế (Surrogate Key)** (`NUMBER GENERATED BY DEFAULT AS IDENTITY`, hoặc `RAW(16)` sinh tự động): Khuyến nghị sử dụng cho các bảng giao dịch nghiệp vụ (`HOA_DON`, `DON_NHAP_HANG`, `TON_KHO`) để giữ khóa ngắn gọn, độc lập với thay đổi nghiệp vụ.
- **Khóa tự nhiên (Natural Key)** (mã định danh chuẩn không đổi): Chỉ dùng khi giá trị thực sự bất biến toàn cầu. Các mã nghiệp vụ có thể thay đổi (mã số nhân viên, số hóa đơn) phải được quản lý bằng ràng buộc `UNIQUE` riêng, không nên dùng làm Primary Key vật lý nếu phải làm khóa ngoại ở nhiều bảng con.

---

### 7.3. Chỉ mục Khóa chính trong Oracle (Index Implications)

- Theo mặc định trong Oracle Database, việc tạo Primary Key sẽ tự động tạo một Unique B-Tree Index tương ứng để thực thi ràng buộc.
- Primary Key nên có tính chất tuần tự tăng dần (Identity / Sequence) để tối ưu hiệu năng ghi vào cấu trúc B-Tree Index.

---

## 8. KHÓA NGOẠI VÀ QUAN HỆ THAM CHIẾU (FOREIGN KEYS & RELATIONSHIPS)

### 8.1. Toàn vẹn Tham chiếu (Referential Integrity)

- Mọi quan hệ giữa các bảng nghiệp vụ bắt buộc phải được bảo vệ bằng ràng buộc `FOREIGN KEY` vật lý trong Oracle Database.
- Khóa ngoại ngăn chặn triệt để tình trạng bản ghi mồ côi (orphan records):
  - Cấm chèn bản ghi con tham chiếu tới bản ghi cha không tồn tại;
  - Cấm xóa bản ghi cha khi đang có bản ghi con tham chiếu tới (với chính sách `NO ACTION` / `RESTRICT`).
- **Đặc thù Oracle**: Bắt buộc tạo Index trên các cột Foreign Key để duy trì tốc độ JOIN và quan trọng nhất là **ngăn chặn tình trạng khóa bảng toàn diện (Table-level Share Lock)** của Oracle trên bảng con khi cập nhật/xóa bảng cha.

---

### 8.2. Rủi ro của CASCADE DELETE trên Dữ liệu Vận hành

- Tuyệt đối **CẤM** cấu hình `ON DELETE CASCADE` trên các bảng tài chính, bán hàng, tồn kho và kiểm toán (`HOA_DON_ITEM`, `TON_KHO`, `GIAO_DICH_KHO`, `NHAT_KY_KIEM_TOAN`).
- Hành vi cascade tự động có thể xóa sạch toàn bộ lịch sử giao dịch khi một thực thể cha bị xóa vô tình.

---

### 8.3. Thứ tự Di cư và Quan hệ Vòng (Circular Dependencies)

- Khi thiết kế lược đồ và kịch bản migration, Agent phải sắp xếp thứ tự tạo bảng hợp lý: bảng cha phải được tạo trước bảng con.
- Tuyệt đối tránh quan hệ tham chiếu vòng vì sẽ gây bế tắc khi INSERT/DELETE.
- Kiểu dữ liệu của cột FK bắt buộc phải khớp 100% với kiểu dữ liệu của cột PK cha.

---

## 9. RÀNG BUỘC TOÀN VẸN CSDL (CONSTRAINTS & INTEGRITY)

### 9.1. Phân loại Ràng buộc trong Oracle Database

Oracle Database cung cấp 6 loại ràng buộc toàn vẹn cốt lõi:
1. `PRIMARY KEY`: Định danh duy nhất bản ghi, bắt buộc NOT NULL.
2. `FOREIGN KEY`: Bảo vệ toàn vẹn tham chiếu, ngăn chặn bản ghi mồ côi.
3. `UNIQUE`: Ngăn chặn trùng lặp dữ liệu nghiệp vụ (mã thuốc, barcode, số hóa đơn).
4. `CHECK`: Ràng buộc miền giá trị hợp lệ của cột dựa trên biểu thức logic.
5. `NOT NULL`: Bắt buộc trường dữ liệu phải có giá trị.
6. `DEFAULT`: Cung cấp giá trị khởi tạo khi câu lệnh INSERT không truyền dữ liệu (Oracle 12c+ hỗ trợ `DEFAULT ON NULL`).

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

### 10.1. Bản chất của NULL trong Oracle Database

- `NULL` đại diện cho **sự vắng mặt của dữ liệu (absence of value)** hoặc **chưa biết (unknown)**.
- **ĐẶC THÙ QUAN TRỌNG CỦA ORACLE**: Trong Oracle Database, **chuỗi rỗng `''` được xử lý đồng nhất với `NULL`**. Do đó một cột chuỗi có ràng buộc `NOT NULL` sẽ báo lỗi nếu chèn chuỗi rỗng `''`.
- `NULL` **KHÔNG tương đương** với:
  - Số không `0`;
  - Trạng thái nghiệp vụ mặc định.

---

### 10.2. Logic Tam trị (Three-Valued Logic) và Phép So sánh

- Mọi phép so sánh trực tiếp với NULL (`col = NULL` hoặc `col <> NULL`) đều trả về kết quả `UNKNOWN`.
- Bắt buộc phải sử dụng toán tử chuẩn: `IS NULL` hoặc `IS NOT NULL`.
- Cẩn trọng khi dùng hàm tổng hợp (Aggregate Functions): `COUNT(column_name)` bỏ qua các giá trị NULL, trong khi `COUNT(*)` đếm toàn bộ số dòng; `SUM(col)` hay `AVG(col)` bỏ qua dòng có giá trị NULL.

---

### 10.3. Ràng buộc Giá trị Mặc định (DEFAULT Constraints)

- Ràng buộc `DEFAULT` có hiệu lực khi câu lệnh `INSERT` bỏ qua không liệt kê cột.
- Trong Oracle 12c+, tính năng `DEFAULT ON NULL` có thể được dùng nếu muốn tự động gán giá trị mặc định ngay cả khi câu lệnh INSERT truyền tường minh giá trị NULL.
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
- **Lý do**: `SELECT *` gây lãng phí băng thông mạng, tăng I/O bộ nhớ, ngăn cản Oracle Optimizer sử dụng Index-Only scan, và dễ gãy ứng dụng khi schema thay đổi thứ tự cột.

---

### 11.2. Tính Chuẩn xác của JOIN và Tránh Trùng lặp

- Sử dụng đúng kiểu kết hợp: `INNER JOIN` khi yêu cầu dữ liệu bắt buộc có ở cả hai bảng; `LEFT JOIN` khi bảng phụ có thể không có dữ liệu.
- Kiểm tra kỹ điều kiện `ON` để tránh tạo tích Descartes (Cartesian Product) gây bùng nổ dữ liệu.
- Cảnh giác với việc lạm dụng `DISTINCT` để che giấu lỗi JOIN sai làm nhân đôi số dòng.

---

### 11.3. Tính SARGable của Mệnh đề WHERE

- Các biểu thức tìm kiếm trong mệnh đề `WHERE` phải đảm bảo tính **SARGable (Search Argument Able)** để Oracle có thể sử dụng Index Range Scan thay vì Full Table Scan:
  ```sql
  -- KHÔNG SARGable (Full Table Scan / Chậm):
  WHERE EXTRACT(YEAR FROM ngay_tao) = 2026

  -- SARGable (Index Range Scan / Nhanh):
  WHERE ngay_tao >= TIMESTAMP '2026-01-01 00:00:00' AND ngay_tao < TIMESTAMP '2027-01-01 00:00:00'
  ```
- Tránh bao bọc cột chỉ mục trong các hàm tính toán (`SUBSTR`, `TO_CHAR`, `NVL`) trừ khi đã tạo Function-Based Index tương ứng.

---

### 11.4. Phân trang Bị chặn (Bounded Pagination)

- Tuyệt đối cấm câu truy vấn collection không giới hạn số lượng trả về (unbounded queries).
- Sử dụng cú pháp phân trang chuẩn ANSI / Oracle 12c+ kèm mệnh đề `ORDER BY` đơn định (deterministic sorting):
  ```sql
  SELECT thuoc_id, ten_thuoc, gia_ban
  FROM THUOC
  WHERE chi_nhanh_id = :branch_id
  ORDER BY thuoc_id ASC
  OFFSET :offset_val ROWS FETCH NEXT :page_size ROWS ONLY;
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
Oracle Library Cache & Shared Pool (Bind Variables)
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
- Mọi truy vấn phải sử dụng cơ chế tham số hóa an toàn (Bind Variables trong Oracle):
  - ODP.NET: `cmd.Parameters.Add(new OracleParameter("name", OracleDbType.NVarchar2)).Value = userInput;`
  - Dapper: `connection.Query<ThuocDto>(sql, new { Name = userInput });`
  - EF Core: `context.Thuoc.Where(t => t.TenThuoc == userInput)` hoặc `FromSqlInterpolated`.

---

### 12.3. Tham số hóa trong Dynamic SQL (PL/SQL)

Nếu bắt buộc phải sử dụng Dynamic SQL:
- Bắt buộc sử dụng lệnh `EXECUTE IMMEDIATE ... USING bind_var1, bind_var2`;
- Tuyệt đối không nối chuỗi biến trực tiếp vào chuỗi lệnh dynamic.

---

## 13. RANH GIỚI GIAO DỊCH (TRANSACTIONS)

### 13.1. Phân định Trách nhiệm Giao dịch theo Rule 02

- **Chính sách giao dịch**: Do `02-architecture-quality.md` sở hữu.
- **Skill 07**: Chịu trách nhiệm về cơ chế kỹ thuật hỗ trợ giao dịch phía CSDL (Oracle transaction management, implicit transactions, commit/rollback, isolation levels).
- **Đặc thù Oracle**: Trong Oracle, transaction tự động bắt đầu khi câu lệnh DML đầu tiên thực thi và duy trì cho đến khi phát lệnh `COMMIT` hoặc `ROLLBACK` rõ ràng.

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

### 14.2. Cơ chế Xử lý Đồng thời tại CSDL Oracle

Agent phải lựa chọn cơ chế đồng thời dựa trên kiến trúc và bằng chứng thực tế:
- **Khóa bi quan (Pessimistic Locking với `SELECT ... FOR UPDATE`)**:
  - Đây là cơ chế chuẩn mực và tối ưu trong Oracle Database để chống race condition và bán âm kho:
    ```sql
    SELECT so_luong 
    FROM INVENTORIES 
    WHERE branch_id = :branch_id AND batch_id = :batch_id 
    FOR UPDATE;
    ```
  - Có thể kết hợp `FOR UPDATE WAIT 5` hoặc `FOR UPDATE NOWAIT` để xử lý timeout an toàn nếu giao dịch khác đang giữ khóa.
- **Optimistic Concurrency (Khóa lạc quan)**:
  - Sử dụng cột phiên bản kiểu số (`version_no NUMBER DEFAULT 1 NOT NULL`) làm concurrency token;
  - Kiểm tra token khi UPDATE: `WHERE id = :id AND version_no = :old_version`. Nếu số dòng ảnh hưởng = 0 -> Báo lỗi xung đột đồng thời (ConcurrencyConflict).
- **Atomic Conditional Updates (Cập nhật nguyên tử có điều kiện)**:
  - Cập nhật nguyên tử có điều kiện được ưu tiên khi nó thỏa mãn trọn vẹn bất biến nghiệp vụ:
    ```sql
    UPDATE INVENTORIES 
    SET quantity = quantity - :qty 
    WHERE branch_id = :branch_id AND batch_id = :batch_id AND quantity >= :qty;
    ```

---

## 15. CÔ LẬP DỮ LIỆU CHI NHÁNH (BRANCH / TENANT ISOLATION)

### 15.1. Phân biệt Lọc Dữ liệu vs. Cô lập Dữ liệu

Agent phải phân biệt rạch ròi:
- **Lọc dữ liệu chi nhánh (Branch Filtering)**: Chỉ đơn thuần thêm `WHERE chi_nhanh_id = :branch_id` trong câu SELECT của ứng dụng. Đây là cơ chế lọc hiển thị, **chưa đủ để coi là cô lập an ninh**.
- **Cô lập dữ liệu chi nhánh (Branch Isolation)**: Ranh giới an ninh bắt buộc theo Rule 06, ngăn chặn tuyệt đối tình trạng nhân viên Chi nhánh A đọc, sửa, xóa hoặc suy diễn dữ liệu của Chi nhánh B, dù vô tình hay cố ý thao túng tham số API.

---

### 15.2. Nguyên tắc Bất biến về Chi nhánh

1. **Client BranchId là hoàn toàn không đáng tin cậy**: Không bao giờ sử dụng `branchId` do client gửi lên làm định danh an ninh;
2. **Mô hình dữ liệu thuộc phạm vi chi nhánh (Branch-Scoped Schema)**:
   - Mọi thực thể thuộc sở hữu chi nhánh hoặc nằm trong phạm vi chi nhánh (branch-scoped) bắt buộc phải có một đường dẫn quan hệ chứng minh được và thực thi được dẫn về phạm vi chi nhánh;
   - Khóa ngoại trực tiếp `chi_nhanh_id` là phù hợp khi thực thể thuộc sở hữu trực tiếp của chi nhánh (ví dụ: bảng tồn kho `INVENTORIES`), nhưng không phải là yêu cầu phổ quát cho mọi bảng trong CSDL;
   - Các thực thể danh mục dùng chung hoặc dữ liệu tham chiếu toàn cục (danh mục thuốc gốc `DRUGS`) mang tính hệ thống toàn cục và không thuộc sở hữu riêng của một chi nhánh, do đó không mang khóa ngoại chi nhánh;
   - Các thực thể con phụ thuộc (chi tiết hóa đơn `INVOICE_ITEMS`, chi tiết đặt hàng) thừa hưởng và bảo đảm phạm vi chi nhánh thông qua quan hệ hợp lệ với thực thể cha (`INVOICES`, `PURCHASE_ORDERS`).
3. **Cô lập quan hệ đa chặng (Relational Traversal Isolation)**: Hóa đơn tại Chi nhánh A tuyệt đối không được tham chiếu hoặc trừ tồn kho của Chi nhánh B; tính cô lập chi nhánh phải được bảo đảm xuyên suốt các quan hệ liên kết bảng.

---

## 16. ORACLE VIRTUAL PRIVATE DATABASE (VPD) & DATA REDACTION

### 16.1. Khái niệm và Vai trò của Oracle VPD

Virtual Private Database (VPD, còn gọi là Fine-Grained Access Control) là cơ chế an ninh phòng thủ theo chiều sâu (defense-in-depth) ở tầng CSDL của Oracle Database thông qua package `DBMS_RLS`:
- **Policy Function**: Hàm PL/SQL tự động sinh ra mệnh đề điều kiện (`WHERE predicate`) gắn trực tiếp vào câu lệnh SQL của ứng dụng tại thời điểm thực thi;
- **Security Policy**: Chính sách liên kết policy function với bảng dữ liệu:
  - `statement_types => 'SELECT,INSERT,UPDATE,DELETE'`;
  - Đảm bảo câu lệnh quét qua bảng chỉ nhìn thấy và chỉ thao tác được trên các dòng có `branch_id` khớp với biến ngữ cảnh.

---

### 16.2. Luồng Hoạt động với Application Context (`SYS_CONTEXT`)

```text
Application Acquires DB Connection
    ↓
Set Secure Context: DBMS_SESSION.SET_IDENTIFIER(:authorized_branch_id)
hoặc qua Custom Context Package: pkg_session_ctx.set_branch_id(:authorized_branch_id)
    ↓
Application Executes Query (e.g., SELECT * FROM INVOICES)
    ↓
Oracle VPD Engine Evaluates Policy Function:
returns "branch_id = SYS_CONTEXT('PHARMA_CTX', 'BRANCH_ID')"
    ↓
Database Returns Strictly Authorized Rows
```

---

### 16.3. Kỷ luật Thực thi VPD An toàn

- **Nguyên tắc Fail-Closed**: Nếu `SYS_CONTEXT('PHARMA_CTX', 'BRANCH_ID')` chưa được thiết lập (hoặc mang giá trị NULL), policy function bắt buộc phải trả về predicate `1=2` (từ chối toàn bộ truy cập), tuyệt đối không mở rộng cho phép đọc tất cả;
- **An toàn Connection Pool**:
  - Khi kết nối được mượn từ pool, ứng dụng bắt buộc phải set lại Context cho request mới trước khi chạy bất kỳ truy vấn nào;
  - Tránh tuyệt đối việc rò rỉ context của chi nhánh trước đó sang request của chi nhánh khác;
- **Oracle Data Redaction (`DBMS_REDACT`)**:
  - Áp dụng chính sách Data Redaction cho các cột doanh thu nhạy cảm (ví dụ `total_amount` trong hóa đơn hoặc doanh thu nhân viên) đối với nhóm nhân viên quầy, hiển thị số 0 hoặc giá trị ngụy trang khi không có quyền xem báo cáo tài chính.

---

## 17. CHIẾN LƯỢC CHỈ MỤC (INDEXING)

### 17.1. Kỷ luật Chỉ mục Dựa trên Bằng chứng (Evidence-Based Indexing)

- Chỉ mục không được tạo theo cảm tính hoặc giả định; mọi quyết định tạo chỉ mục phải dựa trên:
  - Tần suất và mẫu câu truy vấn thực tế (`WHERE`, `JOIN`, `ORDER BY`);
  - Khối lượng dữ liệu (Data Volume) và độ chọn lọc (Selectivity);
  - Đánh đổi chi phí ghi: Mỗi chỉ mục bổ sung làm chậm thao tác `INSERT`, `UPDATE`, `DELETE` và tiêu tốn dung lượng đĩa/bộ đệm.

---

### 17.2. Các Loại Chỉ mục Trong Oracle Cần Cân nhắc

- **B-Tree Index**: Chỉ mục tiêu chuẩn mặc định trong Oracle Database.
- **Composite Index (Chỉ mục kết hợp)**: Đặt các cột có độ chọn lọc cao (hoặc cột trong điều kiện đẳng thức `=`) lên trước; cột trong điều kiện dải (`BETWEEN`, `>`, `<`) hoặc `ORDER BY` ở sau.
- **Index-Organized Table (IOT)**: Tương tự Clustered Index, lưu trữ toàn bộ dữ liệu bảng ngay trong B-Tree của Primary Key (phù hợp cho bảng danh mục tĩnh hoặc bảng liên kết N-N).
- **Function-Based Index**: Chỉ mục dựa trên biểu thức/hàm (ví dụ: `UPPER(drug_name)` hoặc `CASE WHEN is_deleted = 0 THEN id END`).
- **Foreign Key Indexing**: Bắt buộc tạo chỉ mục cho các cột khóa ngoại trong Oracle để tránh khóa toàn bảng khi cập nhật.

---

### 17.3. Cấm Tuyệt đối Quy tắc Chỉ mục Máy móc

- **TUYỆT ĐỐI KHÔNG** tạo chỉ mục tràn lan không có căn cứ.
- Định kỳ rà soát và loại bỏ các chỉ mục trùng lặp hoặc chỉ mục không bao giờ được sử dụng (Unused Indexes).

---

## 18. HIỆU NĂNG TRUY VẤN VÀ ĐO LƯỜNG (QUERY PERFORMANCE)

### 18.1. Quy trình Điều tra Hiệu năng Chuẩn

Khi phát hiện hoặc nghi ngờ vấn đề hiệu năng truy vấn, Agent bắt buộc tuân thủ quy trình:

```text
Xác định Câu truy vấn Thực tế
    ↓
Đo lường Chỉ số (Elapsed Time, CPU, Buffer Gets, Disk Reads)
    ↓
Phân tích Execution Plan (EXPLAIN PLAN / AUTOTRACE / V$SQL_PLAN)
    ↓
Tìm Nguyên nhân Cốt lõi (Root Cause)
    ↓
Tối ưu hóa có Kiểm chứng (Refactor / Index)
    ↓
Đo lường Lại và So sánh
```

---

### 18.2. Nhận diện Dấu hiệu Nguy hiểm trong Execution Plan

Khi đọc Execution Plan trong Oracle Database:
- **TABLE ACCESS FULL**: Quét toàn bộ bảng do thiếu index hoặc câu truy vấn không SARGable;
- **INDEX FULL SCAN**: Quét toàn bộ chỉ mục;
- **Implicit Data Type Conversion**: Cột chuỗi so sánh với số dẫn đến Oracle tự động bọc `TO_NUMBER()` hoặc `TO_CHAR()` làm vô hiệu hóa index;
- **MERGE JOIN CARTESIAN**: Thiếu điều kiện JOIN hợp lệ.

---

### 18.3. Không Tối ưu hóa Sớm (No Premature Optimization)

- Không tự ý phán đoán *"Truy vấn này chậm vì thiếu index"* khi chưa đo lường thời gian chạy và khối lượng I/O thực tế.
- Tránh việc tối ưu hóa sớm khi bảng chỉ có vài chục hoặc vài trăm bản ghi thử nghiệm.

---

## 19. PACKAGES, PROCEDURES, FUNCTIONS VÀ TRIGGERS TRONG ORACLE

### 19.1. Đánh giá Khách quan các Đối tượng Lập trình CSDL

Các đối tượng lập trình trong Oracle (Packages, Stored Procedures, Functions, Triggers) là các **công cụ tùy chọn**, không phải yêu cầu bắt buộc:
- Chỉ sử dụng khi kiến trúc codebase đã có quy ước hoặc có lý do kỹ thuật rõ ràng được phê duyệt (ví dụ: package quản lý VPD / Session context);
- Không tự ý chuyển đổi hàng loạt business logic từ tầng ứng dụng backend sang Stored Procedures mà không có sự đồng thuận kiến trúc.

---

### 19.2. Tiêu chuẩn Đánh giá Từng Đối tượng

- **PL/SQL Packages**: Ưu tiên đóng gói các thủ tục và hàm liên quan vào trong Package thay vì tạo standalone procedures/functions rời rạc để tăng tính module hóa và hiệu năng bộ nhớ đệm SGA.
- **Views**: Hữu ích để tạo góc nhìn dữ liệu bảo mật hoặc trừu tượng hóa các phép JOIN phức tạp; tránh lồng ghép view trong view (nested views) nhiều tầng gây nghẽn Cost-Based Optimizer.
- **Stored Procedures**: Tốt cho các tác vụ xử lý hàng loạt nội bộ trong CSDL hoặc kiểm soát an ninh truy cập trực tiếp; nhược điểm là khó kiểm thử đơn vị tự động và khó kiểm soát phiên bản bằng git nếu không có project CSDL chuẩn.
- **User-Defined Functions (UDF)**:
  - Cảnh giác với Function trong mệnh đề `SELECT` hoặc `WHERE` vì gây chuyển đổi ngữ cảnh SQL-PL/SQL lặp từng dòng;
  - Trong Oracle 12c+ có thể dùng cú pháp `WITH FUNCTION ...` hoặc UDF PRAGMA UDF để tối ưu hóa context switch.
- **Triggers**:
  - **CỰC KỲ THẬN TRỌNG** với Triggers: Triggers chạy ngầm, tạo ra các side effects khó lần vết, dễ gặp lỗi mutating table (`ORA-04091: table is mutating`), và làm tăng thời gian giữ lock của transaction gốc;
  - Không dùng Triggers để giải quyết các nghiệp vụ nên thuộc về Application Service.

---

## 20. DI CƯ VÀ TIẾN HÓA LƯỢC ĐỒ (MIGRATIONS & SCHEMA EVOLUTION TRONG ORACLE)

### 20.1. Quản lý Tiến hóa Lược đồ Xác định (Deterministic Evolution)

Mọi thay đổi về cấu trúc CSDL phải được quản lý bằng các kịch bản di cư (migrations) có phiên bản và có tính xác định:
- Tuyệt đối không chỉnh sửa schema trực tiếp bằng tay trên CSDL production mà không có script lưu trữ trong source control;
- Trong hệ sinh thái .NET 8 / EF Core hoặc Liquibase/Flyway:
  - Dùng EF Core Migrations với Provider `Oracle.EntityFrameworkCore`;
  - Hoặc dùng kịch bản SQL có đánh số phiên bản (`V1__initial_schema.sql`, `V2__add_index.sql`).
- Lịch sử di cư (migration history) và chiến lược tiến hóa lược đồ phải đáp ứng yêu cầu tạo mới một CSDL hoặc nâng cấp một CSDL hiện hữu theo đúng chiến lược di cư của repository;
- Chú ý: DDL trong Oracle (như `CREATE TABLE`, `ALTER TABLE`) tự động phát sinh ngầm `COMMIT` (implicit commit). Do đó, kịch bản di cư cần được thiết kế cẩn trọng theo khối xác định.

---

### 20.2. Phân định Rạch ròi Ba Khái niệm

Agent phải phân biệt rõ ràng:
1. **Schema Migration**: Thay đổi cấu trúc bảng, cột, kiểu dữ liệu, ràng buộc, chỉ mục;
2. **Data Correction**: Cập nhật hoặc sửa chữa các giá trị dữ liệu hiện có;
3. **Seed Data**: Dữ liệu danh mục nền tảng cần thiết để ứng dụng hoạt động.

---

### 20.3. Kiểm soát Thay đổi Phá vỡ (Destructive Schema Changes)

- Các thao tác phá vỡ cấu trúc: `DROP TABLE`, `DROP COLUMN`, đổi tên cột/bảng (`ALTER TABLE ... RENAME`), thu hẹp kích thước kiểu dữ liệu:
  - Bắt buộc phải được phân tích ảnh hưởng toàn diện trên backend, frontend và mobile;
  - Phải có sự phê duyệt rõ ràng từ người dùng/kiến trúc sư;
  - Áp dụng mẫu hình mở rộng - thu hồi (Expand/Contract pattern) để đảm bảo không làm gián đoạn hệ thống.
- **Quy tắc Read-Only Audit**: Trong các task kiểm toán (audit/review), tuyệt đối **CẤM TẠO MIGRATION** hoặc sửa đổi schema CSDL.

---

## 21. DỮ LIỆU DANH MỤC VÀ KHỞI TẠO (SEED & REFERENCE DATA TRONG ORACLE)

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

### 21.3. Tính Lặp lại An toàn của Seed Script (Idempotency với MERGE)

- Kịch bản nạp dữ liệu khởi tạo / tham chiếu (seed/reference data) trong Oracle phải có tính lặp lại an toàn (idempotent) sử dụng câu lệnh chuẩn `MERGE INTO ... USING DUAL`:
  ```sql
  MERGE INTO don_vi_tinh dest
  USING (SELECT 'HOP' AS ma_dvt, 'Hộp' AS ten_dvt FROM DUAL) src
  ON (dest.ma_dvt = src.ma_dvt)
  WHEN NOT MATCHED THEN
      INSERT (ma_dvt, ten_dvt) VALUES (src.ma_dvt, src.ten_dvt);
  ```
- **Bất biến bảo vệ tính lặp lại (Uniqueness Invariant)**:
  - Việc nạp dữ liệu idempotent phải được bảo đảm bởi một bất biến toàn vẹn thích hợp ở mức CSDL: một ràng buộc `UNIQUE`, một khóa tự nhiên/khóa nghiệp vụ (natural/business key) để ngăn ngừa race condition khi chạy đồng thời;
  - Cần phân biệt rõ: tính lặp lại về mặt logic (logical repeatability), bất biến duy nhất (uniqueness invariant), và tính an toàn đồng thời (concurrency safety).
- Không đưa seed script gộp chung lẫn lộn vào bên trong file migration cấu trúc schema.

---

## 22. SAO LƯU, PHỤC HỒI VÀ TÍNH SẴN SÀNG (ORACLE BACKUP / RESTORE / RECOVERY)

### 22.1. Phân định Ranh giới Sở hữu theo Rule 07 và Rule 09

Agent phải phân biệt rạch ròi ranh giới quyền hạn giữa Skill 07 và Rule 09:
- **Skill 07 sở hữu tầng CSDL**:
  - Cấu hình và câu lệnh sao lưu Oracle (RMAN scripts, Data Pump `expdp`/`impdp`);
  - Quy trình khôi phục CSDL vật lý (restore/recover procedures);
  - Kiểm tra và xác minh tính toàn vẹn CSDL sau khi phục hồi (database-level integrity checks với `DBMS_REPAIR` hoặc `ANALYZE TABLE ... VALIDATE STRUCTURE`);
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
- Sử dụng Oracle RMAN để kiểm tra tính toàn vẹn bản sao lưu mà không cần restore thực tế:
  ```text
  RMAN> RESTORE DATABASE VALIDATE;
  ```

---

### 22.3. Các Khái niệm Vận hành Cơ bản trong Oracle

- **RPO (Recovery Point Objective)**: Lượng dữ liệu tối đa chấp nhận mất mát tính theo thời gian;
- **RTO (Recovery Time Objective)**: Thời gian tối đa cho phép để khôi phục hệ thống hoạt động trở lại;
- **Các phương thức Backup trong Oracle Database**:
  - **Oracle Recovery Manager (RMAN)**: Công cụ chuẩn của Oracle để Full/Incremental Backup mức block và ARCHIVELOG backup cho phép Point-in-Time Recovery (PITR);
  - **Oracle Data Pump (`expdp` / `impdp`)**: Sao lưu mức logic (schema, metadata, data export/import) cho mục đích di chuyển hoặc lưu trữ bảng;
  - **ARCHIVELOG Mode**: Cơ chế lưu vết Redo Logs phục vụ khôi phục không mất mát dữ liệu (zero data loss).

---

## 23. KIỂM THỬ VÀ XÁC MINH CƠ SỞ DỮ LIỆU (ORACLE DATABASE TESTING & VALIDATION)

### 23.1. Các Nhóm Kiểm thử CSDL Bắt buộc

1. **Schema & Integrity Tests**:
   - Kiểm tra trùng PK -> Bắt buộc bị từ chối (`ORA-00001: unique constraint violated`);
   - Kiểm tra chèn FK trỏ tới ID không tồn tại -> Bắt buộc bị từ chối (`ORA-02291: integrity constraint violated - parent key not found`);
   - Kiểm tra vi phạm CHECK constraint (số lượng âm, đơn giá âm) -> Bắt buộc bị từ chối (`ORA-02290: check constraint violated`);
   - Kiểm tra vi phạm NOT NULL -> Bắt buộc bị từ chối (`ORA-01400: cannot insert NULL`);
   - Kiểm tra vi phạm UNIQUE -> Bắt buộc bị từ chối.
2. **Query & Logic Tests**:
   - Xác minh câu truy vấn trả về đúng tập dữ liệu, không sinh dòng trùng lặp, xử lý đúng giá trị NULL;
   - Xác minh thuật toán phân trang (`OFFSET ... FETCH NEXT`) và sắp xếp dữ liệu xác định.
3. **Security & Isolation Tests**:
   - Kiểm tra tấn công SQL Injection thông qua các biến liên kết (:bind_variable) -> Phải an toàn 100%;
   - Kiểm tra truy cập chéo chi nhánh: User Chi nhánh A truy vấn dữ liệu Chi nhánh B -> Bắt buộc bị chặn;
   - Kiểm tra Oracle VPD policy (`DBMS_RLS`) với các giá trị `SYS_CONTEXT('PHARMA_CTX', 'BRANCH_ID')` khác nhau.
4. **Concurrency Tests**:
   - Kiểm thử tranh chấp cập nhật tồn kho đồng thời (hai request cùng mua sản phẩm có số lượng = 1) -> Dùng `SELECT ... FOR UPDATE` bảo đảm không bị overselling;
   - Kiểm thử phát hiện và xử lý deadlock (`ORA-00060: deadlock detected while waiting for resource`).
5. **Migration & Evolution Tests**:
   - Kiểm thử tạo mới CSDL từ migrations trên schema trắng (clean schema / PDB);
   - Kiểm thử nâng cấp schema và kiểm tra dữ liệu không bị mất mát.

---

### 23.2. Phân định Ranh giới Kiểm thử (Testing Boundaries)

Agent phải phân biệt rạch ròi:
- **Database Tests pass** chỉ chứng minh các ràng buộc toàn vẹn CSDL và câu lệnh SQL hoạt động đúng;
- Database Tests **KHÔNG chứng minh** rằng toàn bộ hệ thống phân quyền ứng dụng (Rule 05) hay hợp đồng API (Rule 08) đã hoàn toàn an toàn;
- Hệ thống đòi hỏi kiểm chứng end-to-end xuyên suốt từ Client -> API -> Backend -> CSDL.

---

## 24. BẢNG KIỂM TRA CHẤT LƯỢNG CƠ SỞ DỮ LIỆU (ORACLE DATABASE QUALITY CHECKLIST)

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
- [ ] **1. Động cơ CSDL được xác thực đúng**: Xác nhận Oracle Database (Oracle 23ai / 23c / Free) là target CSDL từ bằng chứng vật lý của repository.
- [ ] **2. Nguồn sự thật của Schema được xác định**: Phân định rõ schema đang được quản lý bởi code migrations (EF Core), pl/sql scripts hay db project.
- [ ] **3. Bằng chứng vật lý được kiểm tra trước khi phán đoán**: Không suy diễn cấu trúc CSDL chỉ từ tài liệu mô tả hay hình vẽ ERD.
- [ ] **4. Trạng thái implementation được gắn nhãn minh bạch**: Phân biệt rạch ròi giữa `IMPLEMENTED`, `VERIFIED`, `NOT VERIFIED` và `PROPOSED`.

### 24.2. Schema, Primary Keys & Foreign Keys (Cấu trúc & Khóa)
- [ ] **5. Mọi bảng đều có Primary Key tường minh**: Khóa chính duy nhất, ổn định, bất biến và khai báo `NOT NULL` (ưu tiên `NUMBER(19) GENERATED ALWAYS AS IDENTITY`).
- [ ] **6. Kiểu dữ liệu Primary Key không bị đổi tùy tiện**: Không tự ý đổi kiểu dữ liệu khóa chính khi chưa có yêu cầu kiến trúc và bằng chứng.
- [ ] **7. Quan hệ tham chiếu được bảo vệ bằng Foreign Key**: Khóa ngoại vật lý ngăn chặn triệt để bản ghi mồ côi.
- [ ] **8. Không lạm dụng CASCADE DELETE trên dữ liệu vận hành**: Dữ liệu tài chính, bán lẻ, kho và audit sử dụng `NO ACTION` / `RESTRICT`.
- [ ] **9. Thứ tự di cư không có quan hệ vòng**: Schema và migrations sắp xếp thứ tự bảng cha trước bảng con, tránh circular references.

### 24.3. Data Types & Semantics (Kiểu dữ liệu & Ngữ nghĩa)
- [ ] **10. Giá trị tiền tệ và số lượng dùng kiểu số chính xác**: Bắt buộc dùng `NUMBER(p, s)`, tuyệt đối cấm dùng `FLOAT` / `BINARY_FLOAT` / `BINARY_DOUBLE`.
- [ ] **11. Mốc thời gian hệ thống ưu tiên chuẩn UTC**: Sử dụng `TIMESTAMP(6)` hoặc `TIMESTAMP WITH TIME ZONE` và lưu giờ UTC (`SYS_EXTRACT_UTC(SYSTIMESTAMP)`).
- [ ] **12. Dữ liệu văn bản Unicode UTF-8**: Sử dụng `VARCHAR2(n CHAR)` với ngữ nghĩa ký tự (character length semantics), tránh lạm dụng `CLOB` trừ văn bản lớn.
- [ ] **13. Ngữ nghĩa NULL trong Oracle được xử lý chuẩn xác**: Ghi nhớ chuỗi rỗng `''` trong Oracle được đối xử như `NULL`; dùng `IS NULL` / `IS NOT NULL`.
- [ ] **14. Giá trị mặc định (DEFAULT) không che giấu lỗi**: Default constraints không làm sai lệch ý đồ truyền dữ liệu của ứng dụng.

### 24.4. Constraints & Integrity (Ràng buộc & Toàn vẹn)
- [ ] **15. Ràng buộc miền giá trị được enforce ở CSDL**: Sử dụng `CHECK` constraints cho các bất biến vật lý (`so_luong >= 0`, `don_gia >= 0`).
- [ ] **16. Mã nghiệp vụ duy nhất được bảo vệ bằng UNIQUE**: Tránh trùng lặp mã thuốc, mã vạch, số hóa đơn bằng UNIQUE constraints/indexes.
- [ ] **17. Phân biệt rõ ràng ràng buộc CSDL vs nghiệp vụ ứng dụng**: Không biến CSDL thành nơi thực thi các luồng phân quyền người dùng phức tạp.
- [ ] **18. Đặt tên ràng buộc theo quy ước nhất quán**: Tuân thủ tiền tố quy ước như `pk_`, `fk_`, `uq_`, `ck_` đảm bảo độ dài định danh không vượt quá 30 hoặc 128 ký tự.

### 24.5. SQL Safety & Query Design (Truy vấn & An toàn SQL)
- [ ] **19. Không sử dụng `SELECT *` trong ứng dụng**: Liệt kê tường minh danh sách cột cần truy vấn.
- [ ] **20. 100% câu truy vấn dùng Parameterized Queries (Bind Variables)**: Sử dụng `:paramName`; không ghép chuỗi thô; triệt tiêu hoàn toàn SQL Injection.
- [ ] **21. Mệnh đề WHERE đảm bảo tính SARGable**: Không bao bọc cột chỉ mục trong các hàm tính toán làm mất khả năng Index Range Scan.
- [ ] **22. Bounded pagination với ORDER BY đơn định**: Dùng cú pháp `OFFSET ... FETCH NEXT` kết hợp `ORDER BY` xác định.

### 24.6. Transactions & Concurrency (Giao dịch & Đồng thời)
- [ ] **23. Ranh giới Transaction tuân thủ Rule 02**: Sử dụng transaction khi cần đảm bảo tính nguyên tử giữa các bảng phụ thuộc lẫn nhau.
- [ ] **24. Không chứa tác vụ ngoại vi trong Database Transaction**: Không gọi mạng, cổng thanh toán hay email khi đang mở transaction.
- [ ] **25. Cơ chế Concurrency bảo vệ chống overselling**: Sử dụng `SELECT ... FOR UPDATE` cho khóa bi quan hoặc cột `version_no NUMBER` cho khóa lạc quan; bảo đảm kiểm tra tồn kho và khấu trừ thực thi nguyên tử.

### 24.7. Branch Isolation & Row-Level Security (Cô lập Chi nhánh & Oracle VPD)
- [ ] **26. Dữ liệu phạm vi chi nhánh có đường dẫn ràng buộc xác định**: Mọi thực thể chi nhánh liên kết trực tiếp hoặc gián tiếp với `chi_nhanh_id`.
- [ ] **27. Không tin tưởng client-supplied BranchId**: Định danh chi nhánh bắt buộc trích xuất từ server authentication context.
- [ ] **28. Oracle VPD thực thi nguyên tắc Fail-Closed**: Khi `SYS_CONTEXT('PHARMA_CTX', 'BRANCH_ID')` rỗng hoặc không hợp lệ, policy function trả về điều kiện `1=0` từ chối toàn bộ truy cập.

### 24.8. Migrations, Seed, Operations & Testing (Vận hành & Kiểm thử)
- [ ] **29. Migration xác định, hỗ trợ tạo mới hoặc nâng cấp theo chiến lược repo**: Không xóa cột/bảng tùy tiện; kịch bản hỗ trợ tạo mới hoặc nâng cấp CSDL an toàn; tuân thủ quy tắc Read-Only trong audit tasks.
- [ ] **30. Seed data tách biệt, có bất biến bảo vệ tính lặp lại (Idempotent)**: Dùng `MERGE INTO ... USING DUAL` dựa trên UNIQUE constraint/khóa tự nhiên; tuyệt đối không chứa mật khẩu bản rõ hay secrets.
- [ ] **31. Quy trình sao lưu và phục hồi CSDL được kiểm chứng**: Nhận thức rõ "sao lưu thành công chưa chứng minh khả năng phục hồi"; phân định ranh giới RMAN/Data Pump của Skill 07 với hạ tầng/cảnh báo vận hành của Rule 09.
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
| **Cô lập Dữ liệu Chi nhánh** | `06-branch-isolation.md` | Triển khai mô hình bảng chi nhánh và Oracle VPD hỗ trợ chính sách của Rule 06 |
| **Toàn vẹn CSDL Tối cao** | `07-database-integrity.md` | Skill 07 hiện thực hóa chính sách toàn vẹn của Rule 07 thành schema vật lý |
| **Hợp đồng API & Định dạng DTO** | `08-api-contract.md` | CSDL không quyết định cấu trúc DTO; ánh xạ dữ liệu đúng chuẩn |
| **Giám sát, Tracing & Logging** | `09-observability-operations.md` | Ghi nhận telemetry truy vấn chậm, theo dõi kết nối CSDL và sức khỏe hệ thống |
| **Triển khai Backend .NET** | Skill 03 (`03-dotnet-backend`) | Skill 07 cung cấp schema và query patterns; Skill 03 viết mã C# truy cập CSDL |
| **Thiết kế Tầng API** | Skill 06 (`06-api-design`) | Skill 06 sở hữu API endpoint/DTO; Skill 07 sở hữu lưu trữ bền vững |

---

### 25.2. Chuỗi luồng Phối hợp Liên kỹ năng (Cross-Skill Flow)

```text
Skill 01 (Khảo sát hiện trạng codebase & cấu trúc CSDL Oracle)
   ↓
Rule 01 (Kiến trúc Client-Server)
   ↓
Rule 07 (Chính sách Toàn vẹn Dữ liệu Tối cao)
   ↓
Skill 07 (Thiết kế Schema Oracle, Data Types, PK, FK, Constraints, VPD, Indexes)
   ↓
Skill 03 (Triển khai Backend .NET, Data Access Oracle.EntityFrameworkCore, DbContext)
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
5. **Thay đổi kiểu dữ liệu khóa chính tùy tiện**: Tự ý đổi NUMBER sang GUID hoặc kiểu khác;
6. **Lạm dụng CASCADE DELETE trên dữ liệu vận hành**: Nguy cơ xóa sạch lịch sử hóa đơn/kho;
7. **Tạo chỉ mục tràn lan (Over-Indexing)**: Làm tê liệt hiệu năng thao tác ghi INSERT/UPDATE;
8. **Chỉ mục trùng lặp hoặc không sử dụng**: Lãng phí bộ nhớ đệm SGA và I/O;
9. **Tối ưu hóa sớm không có đo lường**: Tự phán đoán thiếu index mà không xem Execution Plan (`EXPLAIN PLAN`);
10. **Lạm dụng Triggers cho nghiệp vụ ứng dụng**: Gây ra side effects ngầm, lỗi mutating table (`ORA-04091`);
11. **Thực hiện thay đổi phá vỡ (DROP) không kiểm soát**: Gây crash đột ngột hệ thống;
12. **Gộp lẫn kịch bản Seed Data vào Schema Migration**: Gây lỗi khi chạy lại migration;
13. **Coi hình vẽ ERD là bằng chứng code đã triển khai**: Vi phạm nguyên tắc evidence-first;
14. **Tin tưởng tham số `branchId` từ client**: Vi phạm ranh giới an ninh chi nhánh;
15. **Chỉ lọc `WHERE branch_id = :id` mà coi là cô lập chi nhánh**: Thiếu cơ chế an ninh phòng thủ đa tầng;
16. **Xử lý `SYS_CONTEXT` không an toàn trong Connection Pool**: Gây rò rỉ dữ liệu chéo chi nhánh giữa các request;
17. **Cập nhật tồn kho có nguy cơ race condition**: Bỏ qua `SELECT ... FOR UPDATE` dẫn đến bán âm kho khi có giao dịch đồng thời;
18. **Âm thầm bỏ qua ngữ nghĩa NULL của Oracle**: Quên rằng chuỗi rỗng `''` được xem là `NULL` trong Oracle;
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
Discovery (Đã khảo sát hiện trạng CSDL và xác định đúng target engine Oracle)
    ↓
Schema Integrity (Schema có PK, FK, NOT NULL, CHECK, UNIQUE đầy đủ)
    ↓
SQL Safety (100% câu truy vấn sử dụng parameterized queries với bind variables, không ghép chuỗi)
    ↓
Transaction & Concurrency (Ranh giới giao dịch theo Rule 02, SELECT ... FOR UPDATE chống race condition kho)
    ↓
Branch Isolation (Bảo toàn ranh giới chi nhánh theo Rule 06, Oracle VPD qua DBMS_RLS chuẩn nếu áp dụng)
    ↓
Performance & Indexing (Chỉ mục dựa trên bằng chứng, truy vấn SARGable, phân trang OFFSET ... FETCH NEXT an toàn)
    ↓
Migration & Seed (Migration có phiên bản xác định, seed idempotent MERGE không chứa secrets)
    ↓
Testing & Verification (Đã vượt qua kiểm thử đơn vị CSDL cho cả ca thành công và thất bại)
    ↓
Quality Checklist (Tất cả mục áp dụng trong Mục 24 đạt PASS, không còn mục FAIL, các mục N/A và NOT VERIFIED được ghi nhận minh bạch)
```
