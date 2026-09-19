---
name: testing
description: >
  Guides testing strategies, test design, implementation, execution, analysis,
  and verification across the PharmaBranch system (backend, frontend, mobile,
  database, API, integration, and E2E) while respecting Rules 00–09 and
  repository evidence.
---

# SKILL 08 — TESTING & VERIFICATION PRACTICES

## 1. MỤC TIÊU VÀ PHẠM VI (OBJECTIVE & SCOPE)

### 1.1. Mục tiêu (Objective)

Skill này chuẩn hóa phương pháp luận và quy trình thực hành kiểm thử (Testing & Verification Practices) cho toàn bộ hệ thống quản lý chuỗi nhà thuốc đa chi nhánh PharmaBranch. Mục tiêu trọng tâm là cung cấp khung hướng dẫn toàn diện để Agent:
- Lập kế hoạch kiểm thử (Test Planning);
- Thiết kế ca kiểm thử (Test Design);
- Triển khai và hướng dẫn viết mã kiểm thử (Test Implementation Guidance);
- Thực thi và phân tích bằng chứng kiểm thử (Test Execution & Evidence Analysis);
- Kiểm thử hồi quy và đánh giá chất lượng bộ kiểm thử (Regression & Quality Evaluation);
- Phối hợp xác minh các ranh giới bảo mật, phân quyền, cô lập chi nhánh, toàn vẹn CSDL và xử lý đồng thời.

```text
Khảo sát hiện trạng kiểm thử (Test Discovery)
    ↓
Lựa chọn chiến lược kiểm thử dựa trên rủi ro (Risk-Based Testing Strategy)
    ↓
Thiết kế và triển khai kịch bản kiểm thử (Test Design & Implementation)
    ↓
Thực thi kiểm thử và thu thập bằng chứng (Execution & Evidence Collection)
    ↓
Đánh giá trạng thái xác minh (Verification Assessment: PASS / FAIL / N/A / NOT VERIFIED)
```

---

### 1.2. Phạm vi Sở hữu của Skill 08 (Scope of Ownership)

Skill 08 sở hữu **PHƯƠNG PHÁP XÁC MINH VÀ TRIỂN KHAI KIỂM THỬ (HOW TO TEST & VERIFY)**:
- Hướng dẫn kiểm thử đơn vị (Unit Testing);
- Hướng dẫn kiểm thử thành phần (Component Testing);
- Hướng dẫn kiểm thử giao diện lập trình ứng dụng (API Testing);
- Hướng dẫn kiểm thử tích hợp liên tầng (Integration Testing);
- Hướng dẫn kiểm thử cơ sở dữ liệu (Database Testing);
- Hướng dẫn kiểm thử hợp đồng giao tiếp (Contract Testing);
- Điều phối kịch bản kiểm thử xác thực (Authentication Testing Coordination);
- Điều phối kịch bản kiểm thử phân quyền và RBAC (Authorization / RBAC Testing Coordination);
- Điều phối kịch bản kiểm thử cô lập dữ liệu chi nhánh (Branch Isolation Testing Coordination);
- Hướng dẫn kiểm thử bất biến nghiệp vụ (Business Rule Testing);
- Hướng dẫn kiểm thử giao dịch và tranh chấp đồng thời (Transaction & Concurrency Testing);
- Hướng dẫn kiểm thử tính lặp lại an toàn (Idempotency Testing);
- Hướng dẫn kiểm thử ca biên và xử lý lỗi (Error & Edge-Case Testing);
- Hướng dẫn kiểm thử giao diện Web React và ứng dụng Mobile Flutter (Frontend / Mobile Testing);
- Hướng dẫn kiểm thử luồng nghiệp vụ đầu cuối (End-to-End Testing);
- Quản lý dữ liệu mẫu, fixtures và môi trường kiểm thử (Test Data, Fixtures & Environment);
- Nhận diện và xử lý kiểm thử không ổn định (Flaky Tests).

---

### 1.3. Phân biệt Rạch ròi giữa Kiểm thử (Testing) và Chính sách (Policy)

Agent phải phân biệt rạch ròi:
- **Chính sách (Policy & Invariants)**: Do Rules `00–09` sở hữu độc quyền (ví dụ: Rule 03 định nghĩa chính sách bảo mật; Rule 05 định nghĩa chính sách phân quyền; Rule 06 định nghĩa ranh giới cô lập chi nhánh; Rule 07 định nghĩa chính sách toàn vẹn CSDL; Rule 08 định nghĩa chuẩn hợp đồng API).
- **Kiểm thử (Testing)**: Thuộc quyền sở hữu của Skill 08, chỉ trả lời câu hỏi: *"Làm thế nào để thiết kế và thực thi kịch bản nhằm chứng minh hệ thống đang tuân thủ đúng chính sách đã đề ra?"*.
- **Cấm tuyệt đối**: Skill 08 không được tự ý phát minh, định nghĩa lại, nới lỏng hay thay thế bất kỳ chính sách an ninh, quy tắc nghiệp vụ, ranh giới chi nhánh hoặc kiến trúc nào của hệ thống.

---

### 1.4. Tương thích Kiểm toán Chỉ Đọc (Read-Only Audit Compatibility)

Skill 08 hỗ trợ đầy đủ quy trình kiểm toán chỉ đọc (Read-Only Audit Protocol):
- Khi thực hiện nhiệm vụ đánh giá hoặc kiểm toán, Agent **tuyệt đối không** tự ý viết code test mới, không sửa code kiểm thử hiện có, không can thiệp database, không sửa đổi mã nguồn sản phẩm, và không tạo bằng chứng giả mạo.
- Đánh giá kiểm thử phải dựa trên bằng chứng thực tế tìm thấy trong repository, phân định minh bạch các trạng thái: `TEST EXISTS`, `TEST EXECUTED`, `TEST PASSED`, `TEST COVERAGE`, `VERIFIED`, và `NOT VERIFIED`.

---

## 2. THỨ BẬC ƯU TIÊN VÀ TÍNH TRUNG LẬP CÔNG NGHỆ (PRIORITY & TECHNOLOGY NEUTRALITY)

### 2.1. Thứ bậc Thẩm quyền (Authority Hierarchy)

Mọi quyết định và khuyến nghị kiểm thử trong Skill 08 phải tuân thủ nghiêm ngặt thứ bậc ưu tiên sau:

```text
Rules 00–09 (Quy định quản trị, kiến trúc, an ninh, toàn vẹn tối cao)
    ↓
Yêu cầu cụ thể của Task hiện tại (Task-Specific Requirements)
    ↓
Quy ước và bằng chứng vật lý hiện có trong Repository (Physical Evidence)
    ↓
Các Kỹ năng chuyên biệt áp dụng (Applicable Skills: 01–07)
    ↓
Tài liệu chính thức của Framework / Thư viện kiểm thử đang dùng
    ↓
Các thông lệ kiểm thử tốt nhất nói chung (Generic Best Practices)
    ↓
Sở thích cá nhân của Agent (Agent Preference - Ưu tiên thấp nhất)
```

---

### 2.2. Tính Trung lập Công nghệ Kiểm thử (Technology Neutrality)

Skill 08 tuân thủ nguyên tắc trung lập công nghệ tuyệt đối. Agent **không được mặc định** dự án bắt buộc phải sử dụng bất kỳ công nghệ hoặc thư viện kiểm thử cụ thể nào:
- Không bắt buộc C# Test Framework: `xUnit`, `NUnit`, `MSTest`;
- Không bắt buộc Mocking Framework: `Moq`, `NSubstitute`, `FakeItEasy`;
- Không bắt buộc Assertion Library: `FluentAssertions`, `Shouldly`;
- Không bắt buộc E2E Web Framework: `Playwright`, `Cypress`, `Selenium`;
- Không bắt buộc JavaScript/React Test Framework: `Vitest`, `Jest`, `React Testing Library`;
- Không bắt buộc Mobile Test Framework: `Flutter test`, `Integration test`;
- Không bắt buộc Database Test Tool: `Testcontainers`, `InMemory Database`, `WebApplicationFactory`;
- Không bắt buộc Snapshot testing, Mutation testing hay Contract testing framework cụ thể.

**Điều kiện sử dụng công nghệ kiểm thử cụ thể**:
1. Codebase đã có bằng chứng vật lý chứng minh công nghệ đó đang được sử dụng (ví dụ: package reference trong `.csproj`, `package.json`, `pubspec.yaml`); HOẶC
2. Yêu cầu của task chỉ định rõ ràng; HOẶC
3. Quyết định kiến trúc kỹ thuật đã được người dùng/kiến trúc sư phê duyệt bằng văn bản.

Mọi tên framework xuất hiện trong tài liệu này (như xUnit, Playwright, Jest, Vitest, Moq...) chỉ là **ví dụ minh họa (illustrative examples)**, không cấu thành yêu cầu bắt buộc.

---

## 3. MÔ HÌNH SỞ HỮU TRÁCH NHIỆM (TESTING OWNERSHIP MODEL)

### 3.1. Bảng Phân định Trách nhiệm: Policy vs. Testing Implementation

| Thẩm quyền Chính sách (Policy / Invariant Authority) | Nội dung Chính sách (WHAT MUST BE TRUE) | Trách nhiệm Xác minh của Skill 08 (HOW TO TEST & VERIFY) |
| :--- | :--- | :--- |
| `00-project-governance.md` | Nguyên tắc Evidence-first, kiểm soát phạm vi, cấm sửa ngoài scope | Khảo sát bằng chứng kiểm thử trước khi kết luận; tuân thủ quy trình kiểm toán |
| `01-architecture.md` | Kiến trúc phân tầng Client-Server, ranh giới API, phụ thuộc một chiều | Thiết kế kiểm thử tôn trọng ranh giới các tầng; không kiểm thử xuyên tầng trái phép |
| `02-architecture-quality.md` | Chính sách giao dịch ACID, concurrency, idempotency, state transitions | Thiết kế kịch bản test rollback, tranh chấp kho đồng thời, kiểm tra chuyển trạng thái |
| `03-security.md` | Chính sách an ninh, xác thực JWT, chống SQL Injection, mã hóa, CLS | Thiết kế kịch bản test đăng nhập sai, token hết hạn, giả mạo token, SQL injection payload |
| `04-rbac.md` | Mô hình phân quyền RBAC, vai trò nghiệp vụ (OWNER, SALES, WAREHOUSE) | Thiết kế ma trận kiểm thử quyền hạn theo vai trò, kiểm tra từ chối khi thiếu quyền |
| `05-authorization.md` | Thực thi kiểm soát truy cập runtime, chống IDOR/BOLA, leo thang đặc quyền | Thiết kế ca test truy cập tài nguyên của user khác, gọi chéo API, kiểm tra ownership |
| `06-branch-isolation.md` | Ranh giới cô lập dữ liệu chi nhánh `CHI_NHANH`, chính sách RLS | Thiết kế ca test đọc/ghi chéo chi nhánh, giả mạo tham số `branchId`, fail-closed |
| `07-database-integrity.md` | Chính sách toàn vẹn CSDL, PK, FK, CHECK, NOT NULL, UNIQUE constraints | Thiết kế ca test chèn dữ liệu vi phạm ràng buộc vật lý, vi phạm kiểu dữ liệu |
| `08-api-contract.md` | Hợp đồng API, HTTP methods, status codes, Problem Details RFC 7807 | Thiết kế API test kiểm tra cấu trúc request/response DTO, mã lỗi và phân trang |
| `09-observability-operations.md` | Chính sách ghi nhật ký, truy vết correlation ID, health checks | Kiểm tra sự hiện diện của correlation ID trong response/logs, xác minh health endpoints |
| Skill 03 (`03-dotnet-backend`) | Triển khai mã nguồn Backend C# / ASP.NET Core | Cung cấp phương pháp viết Unit/Integration test cho Controllers, Services, Repositories |
| Skill 04 (`04-react-frontend`) | Triển khai giao diện Web ReactJS | Cung cấp phương pháp viết Component test, UI behavior test cho Web client |
| Skill 05 (`05-flutter-mobile`) | Triển khai ứng dụng Mobile Flutter / Dart | Cung cấp phương pháp viết Widget test, BLoC/State test cho Mobile client |
| Skill 06 (`06-api-design`) | Đặc tả thiết kế API, URI, DTO mappings | Cung cấp phương pháp kiểm thử hợp đồng API (Contract Testing) khớp thiết kế |
| Skill 07 (`07-database-sqlserver`) | Triển khai T-SQL schema, indexes, RLS, scripts | Cung cấp phương pháp kiểm thử schema vật lý, execution behavior trên SQL Server |

---

### 3.2. Nguyên tắc Cốt lõi của Mô hình Sở hữu

> **"Rules define WHAT MUST BE TRUE. Skills define HOW IT IS IMPLEMENTED. Skill 08 defines HOW WE VERIFY IT."**  
> (Rules định nghĩa cái gì phải đúng. Skills chuyên biệt định nghĩa cách thức hiện thực hóa. Skill 08 định nghĩa phương pháp xác minh tính đúng đắn đó).

Skill 08 tuyệt đối không đưa ra các phán quyết kiến trúc mới hay sửa đổi hợp đồng hệ thống, mà chỉ đóng vai trò là chiếc gương phản chiếu khách quan việc triển khai có đáp ứng đúng chuẩn mực hay không.

---

## 4. KHẢO SÁT HIỆN TRẠNG KIỂM THỬ (TEST DISCOVERY)

### 4.1. Quy trình Khảo sát Evidence-First

Trước khi đề xuất, viết mới, sửa đổi hoặc chạy bất kỳ bài kiểm thử nào, Agent bắt buộc phải thực hiện khảo sát hiện trạng codebase theo quy trình:

```text
Khảo sát Cấu trúc Thư mục (Directory Search)
    ↓
Nhận diện Framework & Công cụ Kiểm thử (Test Framework Identification)
    ↓
Khảo sát Hạ tầng & Quy ước Hiện có (Infrastructure & Convention Discovery)
    ↓
Đánh giá Mức độ Sẵn sàng của Môi trường Kiểm thử (Environment Readiness)
    ↓
Báo cáo Hiện trạng Minh bạch (Discovery Reporting)
```

---

### 4.2. Các Dấu vết Vật lý Cần Tìm kiếm

Agent phải chủ động tìm kiếm các dấu hiệu vật lý trong repository:
1. **Dự án và Thư mục Kiểm thử**: Thư mục `tests/`, `test/`, `*.Tests/`, `*.IntegrationTests/`, `*.UnitTests/`, `*.Specs/`;
2. **Khai báo Thư viện Kiểm thử (Dependencies)**:
   - Backend C#: Các package trong file `.csproj` như `Microsoft.NET.Test.Sdk`, `xunit`, `nunit`, `Moq`, `FluentAssertions`...;
   - Frontend React: `jest`, `vitest`, `@testing-library/react` trong `package.json`;
   - Mobile Flutter: `flutter_test`, `integration_test` trong `pubspec.yaml`.
3. **Quy ước Đặt tên (Naming Conventions)**: Cách đặt tên tệp (`*Tests.cs`, `*.test.tsx`, `*_test.dart`) và cách đặt tên phương thức kiểm thử (ví dụ: `Method_Condition_ExpectedResult`);
4. **Hạ tầng Dữ liệu mẫu & Giả lập**: Thư mục `fixtures/`, `factories/`, `mocks/`, `stubs/`, `fakes/`, `testdata/`;
5. **Hạ tầng Kiểm thử Tích hợp**: Sự hiện diện của test web host (`WebApplicationFactory`), database initialization scripts cho test;
6. **Kịch bản Chạy Kiểm thử trong CI/CD**: Các lệnh `dotnet test`, `npm test`, `flutter test` trong file workflow (`.github/workflows/`, script sh/ps1);
7. **Cấu hình Môi trường Kiểm thử**: `appsettings.Testing.json`, file `.env.test`, connection strings dành riêng cho test;
8. **Cấu hình Đo lường Độ bao phủ (Coverage)**: `coverlet`, `lcov`, cấu hình ngưỡng coverage trong repository.

---

### 4.3. Thứ bậc Bằng chứng Kiểm thử (Evidence Hierarchy)

Độ tin cậy của các kết luận kiểm thử được xếp hạng giảm dần:
1. **Executed Test Run Logs / Results**: Kết quả thực thi thực tế (test execution logs) chứng minh bài test đã chạy và PASS/FAIL trong môi trường xác định.
2. **Physical Test Code & Fixtures**: Mã nguồn kiểm thử thực tế tồn tại trong repository, có thể biên dịch được.
3. **Test Configuration & CI Scripts**: Cấu hình kiểm thử và kịch bản CI tự động hóa.
4. **Test Plans / Test Specifications**: Kế hoạch kiểm thử trên tài liệu (chỉ chứng minh ý định, **không chứng minh** code đã được kiểm thử).
5. **Agent Assumptions**: Giả định của Agent (**hoàn toàn không có giá trị chứng minh**).

---

### 4.4. "Not Found" là Kết quả Khảo sát Hợp lệ

- Nếu repository **chưa có dự án kiểm thử hoặc chưa có hạ tầng test**, Agent phải báo cáo trung thực:
  > *"Không tìm thấy bằng chứng vật lý về hạ tầng kiểm thử cho module [X] trong repository (Status: NOT VERIFIED / NO TEST INFRASTRUCTURE)."*
- **Cấm tự ý cài đặt framework mới**: Tuyệt đối không tự ý khởi tạo dự án test mới, cài đặt thư viện kiểm thử, hoặc viết mã kiểm thử khi task hiện tại không yêu cầu hoặc chưa có sự phê duyệt kiến trúc từ người dùng.

---

## 5. CHIẾN LƯỢC KIỂM THỬ (TESTING STRATEGY)

### 5.1. Các Tầng Kiểm thử trong Hệ thống

Chiến lược kiểm thử của PharmaBranch được tổ chức theo các tầng phân định rõ ranh giới:

```text
        ▲
       / \         End-to-End Tests (Luồng nghiệp vụ xuyên biên giới, số lượng ít, chi phí cao)
      /   \
     /-----\       Integration & Database Tests (Tương tác liên tầng, DB constraints, concurrency)
    /       \
   /---------\     API & Contract Tests (Hợp đồng HTTP, DTOs, Auth gating, RFC 7807)
  /           \
 /-------------\   Component & Unit Tests (Logic thuần túy, nhanh, độc lập, bao phủ rộng)
```

---

### 5.2. Lựa chọn Tầng Kiểm thử Dựa trên Rủi ro (Risk-Based Testing)

Không mặc định rằng mọi tính năng hoặc mọi dòng code đều phải được bao phủ bởi tất cả các loại kiểm thử. Việc lựa chọn loại kiểm thử phải dựa trên ma trận rủi ro:
- **Rủi ro Cực cao (Critical Risk)**: Thay đổi tồn kho, bán thuốc, xuất hóa đơn, cô lập chi nhánh, thanh toán, phân quyền bảo mật -> Bắt buộc kết hợp **Unit Test + API Authorization Test + Database Concurrency / Integrity Test**.
- **Rủi ro Trung bình (Medium Risk)**: Danh mục tham chiếu tĩnh, tra cứu thông tin, hiển thị dữ liệu báo cáo -> Tập trung **API Test + Component Test**.
- **Rủi ro Thấp (Low Risk)**: Thay đổi nhãn giao diện, căn chỉnh màu sắc, định dạng chuỗi tĩnh -> **Component / Unit Test** cục bộ.

Tiêu chí đánh giá gồm:
1. **Mức độ nghiêm trọng của lỗi (Failure Impact)**: Lỗi có gây mất mát tài chính, sai lệch kho, rò rỉ dữ liệu chéo chi nhánh hay không?
2. **Chi phí thực thi và bảo trì (Execution & Maintenance Cost)**: Chi phí chạy test và nguy cơ test bị vỡ (brittle) khi giao diện thay đổi;
3. **Ranh giới tác động (Boundary Impact)**: Thao tác có vượt qua ranh giới mạng, database hay chỉ là xử lý tính toán trong bộ nhớ?

---

### 5.3. Chống Trùng lặp Kiểm thử (Test Duplication Prevention)

- **Tránh kiểm thử lặp lại cùng một logic ở nhiều tầng**: Nếu một quy tắc kiểm tra logic đơn thuần (ví dụ kiểm tra định dạng email) đã được Unit Test kiểm tra triệt để ở tầng Domain/Validation, không cần tạo hàng chục ca kiểm thử E2E chỉ để nhập các chuỗi email sai tương tự qua giao diện người dùng.
- Tầng cao hơn chỉ kiểm tra sự phối hợp (integration wiring) và ranh giới giao tiếp, không lặp lại toàn bộ các ca kiểm thử biên chi tiết của tầng dưới.

---

## 6. KIỂM THỬ ĐƠN VỊ (UNIT TESTING)

### 6.1. Đặc tính của Kiểm thử Đơn vị Chuẩn mực

Một bài kiểm thử đơn vị chất lượng phải bảo đảm 4 đặc tính cốt lõi:
1. **Xác định (Deterministic)**: Chạy 1.000 lần phải cho cùng 1 kết quả duy nhất; không phụ thuộc vào thời gian hệ thống, thứ tự chạy test hay biến môi trường ngẫu nhiên.
2. **Cô lập về mặt hành vi (Behavioral Isolation)**: Các phụ thuộc ngoại vi (CSDL thật, mạng Internet, hệ thống tệp vật lý, tiến trình bên ngoài) NÊN được cô lập khi việc cô lập là cần thiết để bảo đảm tính xác định cho bài kiểm thử đơn vị.
3. **Tập trung (Focused)**: Mỗi bài test chỉ xác minh một hành vi hoặc một kết quả đơn lẻ; khi test thất bại, nguyên nhân lỗi phải rõ ràng ngay lập tức.
4. **Nhanh chóng (Fast)**: Thực thi trong vài mili-giây để có thể chạy liên tục trong quá trình phát triển.

---

### 6.2. Kiểm thử Hành vi và Kết quả (Behavior & Outcome over Implementation)

- **Ưu tiên kiểm thử giao ước đầu ra (Outcome/State-based verification)**: Kiểm tra kết quả trả về của hàm hoặc trạng thái thay đổi của đối tượng, thay vì kiểm tra đối tượng đã gọi hàm nội bộ nào.
- **Tránh kiểm thử chi tiết triển khai thái quá (Over-specification)**: Việc lạm dụng mock để assert chính xác từng lời gọi phương thức nội bộ (`Verify(x => x.InternalMethod(), Times.Once())`) làm bài test trở nên giòn (brittle) và dễ vỡ khi tái cấu trúc (refactoring) mã nguồn, ngay cả khi hành vi bên ngoài không đổi.

---

### 6.3. Giới hạn An ninh và Ranh giới của Unit Test

Agent bắt buộc ghi nhớ các giới hạn bất biến:
- **Unit Test PASS ≠ System PASS**: Unit test xanh không chứng minh toàn bộ hệ thống hoạt động đúng.
- **Unit Test không chứng minh**:
  - Tính toàn vẹn CSDL và ràng buộc khóa ngoại (Foreign Keys);
  - Hành vi mạng, độ trễ và nghẽn kết nối;
  - Cơ chế phân quyền và middleware an ninh thực tế trên server;
  - Sự cô lập chi nhánh thực tế tại tầng cơ sở dữ liệu (RLS);
  - Cấu hình môi trường sản xuất (Production configuration).

---

### 6.4. Tính Trung lập về Kỹ thuật Cô lập Phụ thuộc (Dependency Isolation)

- Các phụ thuộc ngoại vi NÊN được cô lập khi cần thiết để bảo đảm tính xác định cho bài kiểm thử đơn vị. Kỹ thuật cụ thể (mock, fake, stub, in-memory implementation, test double, hoặc phương pháp tiếp cận khác được repository hỗ trợ) BẮT BUỘC phải tuân theo quy ước của repository và mục đích kiểm thử;
- Mục tiêu cốt lõi là **sự cô lập về mặt hành vi (behavioral isolation)**, không phải bắt buộc sử dụng một kỹ thuật mock cụ thể;
- Tuyệt đối không ép buộc hay mặc định bất kỳ mocking framework nào (như Moq, NSubstitute, FakeItEasy, Mockito, Jest mock, Sinon...); tôn trọng quy ước và cấu trúc hiện có trong codebase.

---

## 7. KIỂM THỬ THÀNH PHẦN (COMPONENT TESTING)

### 7.1. Khái niệm và Phạm vi Kiểm thử Thành phần

Kiểm thử thành phần (Component Testing) tập trung xác minh một đơn vị cấu trúc phần mềm lớn hơn Unit Test nhưng nhỏ hơn Integration Test hoàn chỉnh:
- **UI Component Testing**: Kiểm thử một thành phần giao diện (React component, Flutter widget) trong môi trường giả lập (harness);
- **Service Component Testing**: Kiểm thử một Application Service / Handler độc lập cùng với các phụ thuộc được kiểm soát (controlled dependencies).

---

### 7.2. Phân biệt Thành phần Cô lập vs. Thành phần Phụ thuộc Kiểm soát

Agent phải phân biệt:
- **Isolated Component**: Thành phần được cô lập hoàn toàn khỏi thế giới bên ngoài; toàn bộ đầu vào và sự kiện được kích hoạt nhân tạo trong bộ nhớ;
- **Component with Controlled Dependencies**: Thành phần được liên kết với các module phụ trợ giả lập nội bộ (in-memory test fakes), nhằm kiểm tra khả năng phối hợp cục bộ mà không cần dựng toàn bộ backend hay database thật.

---

### 7.3. Ranh giới Xác minh của Component Test

- Component Test tập trung xác minh:
  - Khả năng render và phản hồi sự kiện người dùng (click, input, submit);
  - Hiển thị đúng các trạng thái: Đang tải (Loading), Thành công (Success), Lỗi (Error), Rỗng (Empty);
  - Xác thực dữ liệu đầu vào trên form (Client-side presentation validation).
- Component Test **không thay thế** việc kiểm thử tích hợp API hay backend authorization.

---

## 8. KIỂM THỬ GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (API TESTING)

### 8.1. Phạm vi Bao phủ của API Testing

API Testing kiểm tra trực tiếp các endpoint HTTP của backend, đứng tại ranh giới public boundary giữa Client và Server theo tiêu chuẩn của Rule 08 và Skill 06:
1. **Kiểm tra Hợp đồng Yêu cầu và Phản hồi (Request & Response DTOs / Schemas)**: Xác minh dữ liệu gửi lên và trả về đúng kiểu, đúng tên trường, định dạng theo hợp đồng API và Rule 08; kiểm tra hành vi phân trang, lọc và sắp xếp theo hợp đồng đã thiết lập; tuyệt đối không tự ý hard-code quy ước đặt tên (như camelCase, kebab-case, snake_case) trừ khi quy ước đó đã được xác lập rõ ràng bởi Rule 08, kiến trúc được phê duyệt hoặc bằng chứng vật lý trong repository;
2. **Kiểm tra Ngữ nghĩa Mã trạng thái HTTP (HTTP Status Semantics)**:
   - `200 OK` cho thao tác đọc/cập nhật thành công;
   - `201 Created` cho tạo mới tài nguyên kèm header `Location`;
   - `204 No Content` cho thao tác cập nhật/xóa không trả về body;
   - `400 Bad Request` kèm Problem Details (RFC 7807) khi dữ liệu sai cú pháp/validation;
   - `401 Unauthorized` khi thiếu hoặc sai token xác thực;
   - `403 Forbidden` khi tài khoản không có quyền hoặc vi phạm ranh giới;
   - `404 Not Found` khi không tìm thấy tài nguyên hoặc ngoài phạm vi chi nhánh;
   - `409 Conflict` khi xung đột trạng thái (trùng mã, xung đột đồng thời).
3. **Kiểm tra Định dạng Lỗi Chuẩn**: Xác minh cấu trúc lỗi trả về tuân thủ RFC 7807 (Problem Details), không chứa stack trace hay thông tin nhạy cảm ở production;
4. **Kiểm tra Ranh giới Xác thực và Phân quyền**: Đảm bảo endpoint được bảo vệ chặn đứng request ẩn danh hoặc request thiếu role/permission;
5. **Kiểm tra Ranh giới Chi nhánh (Branch Scope)**: Đảm bảo dữ liệu trả về chỉ thuộc chi nhánh được cấp phép;
6. **Kiểm tra Tính lặp lại (Idempotency)**: Nếu endpoint hỗ trợ header `Idempotency-Key`, kiểm tra việc gửi lại request cùng key không gây tác động phụ trùng lặp.

---

### 8.2. Kỷ luật Phụ thuộc Hợp đồng (Subordinate to Rule 08)

- API Tests phải tuyệt đối tuân thủ hợp đồng do Rule 08 (`08-api-contract.md`) và thiết kế của Skill 06 (`06-api-design`) quy định;
- Agent **không được tự ý sáng chế hợp đồng API mới** hoặc tự thay đổi cấu trúc URL, mã lỗi trong bài test khi chưa có sự thống nhất kiến trúc.

---

### 8.3. Giới hạn của API Test

> **"API Test PASS ≠ Complete Branch Isolation PASS."**

Một bài API test trả về kết quả thành công chỉ chứng minh endpoint HTTP hoạt động đúng với dữ liệu thử nghiệm cụ thể; nó không chứng minh rằng ở tầng CSDL, các câu truy vấn phức tạp hoặc truy vấn đa chặng hoàn toàn không có lỗ hổng rò rỉ dữ liệu.

---

## 9. KIỂM THỬ TÍCH HỢP (INTEGRATION TESTING)

### 9.1. Bản chất và Mục tiêu của Integration Testing

Integration Testing kiểm tra sự tương tác thực tế giữa hai hoặc nhiều ranh giới/tầng kiến trúc của hệ thống:
```text
Client / Test Actor
    ↕
Application / API Boundary
    ↕
Application / Business Boundary
    ↕
Persistence / Database Boundary
```

Luồng kiểm thử (test flows) BẮT BUỘC chỉ phản ánh các ranh giới và thành phần thực tế có bằng chứng vật lý trong repository hoặc được thiết lập bởi quyết định kiến trúc đã phê duyệt; không tự ý mặc định các thành phần cụ thể (như Controller, Service Layer, Repository, API Gateway, Message Broker) nếu repository chưa chứng minh sự tồn tại của chúng.

Mục tiêu cốt lõi là phát hiện các lỗi phát sinh tại ranh giới giao tiếp mà Unit Test (do được cô lập) không thể phát hiện được: lỗi cấu hình ORM mapping, lỗi chuyển đổi kiểu dữ liệu SQL, lỗi cú pháp truy vấn, lỗi transaction boundary.

---

### 9.2. Phân biệt Rõ rệt giữa Unit Test và Integration Test

| Tiêu chí | Unit Testing (Kiểm thử Đơn vị) | Integration Testing (Kiểm thử Tích hợp) |
| :--- | :--- | :--- |
| **Phạm vi** | Một hàm, class, hoặc logic thuật toán cô lập | Sự tương tác giữa 2 hoặc nhiều thành phần/tầng |
| **Phụ thuộc ngoại vi** | Được cô lập về mặt hành vi (test double, in-memory, fake, mock tùy quy ước) | Tương tác giữa các thành phần/ranh giới thực tế (hoặc CSDL kiểm thử) |
| **Tốc độ thực thi** | Cực nhanh (vài mili-giây) | Chậm hơn (vài trăm mili-giây đến vài giây) |
| **Khả năng phát hiện lỗi** | Lỗi logic nghiệp vụ nội bộ | Lỗi cấu hình, mapping CSDL, lỗi giao dịch, lỗi tương thích |
| **Tính ổn định** | Rất cao, ít bị ảnh hưởng bởi môi trường | Có thể bị ảnh hưởng bởi kết nối CSDL và tài nguyên chia sẻ |

---

### 9.3. Quản lý Phụ thuộc và Trung lập Công nghệ

- Agent không bắt buộc dự án phải dùng `Testcontainers`, `LocalDB`, `SQL Server Express` hay `InMemory Database`;
- Phải tìm kiếm bằng chứng hạ tầng kiểm thử tích hợp có sẵn trong repository để sử dụng;
- Nếu sử dụng cơ sở dữ liệu kiểm thử, phải đảm bảo có cơ chế dọn dẹp (cleanup / rollback / recreation) để tránh làm ô nhiễm dữ liệu giữa các ca test.

---

## 10. KIỂM THỬ CƠ SỞ DỮ LIỆU (DATABASE TESTING)

### 10.1. Phạm vi Kiểm thử CSDL theo Tiêu chuẩn Rule 07 & Skill 07

Kiểm thử cơ sở dữ liệu tập trung xác minh trực tiếp trên schema vật lý của SQL Server:
1. **Ràng buộc Toàn vẹn Lược đồ (Schema Constraints)**:
   - Thử chèn bản ghi trùng Khóa chính (`PK`) -> Bắt buộc nhận lỗi vi phạm PK;
   - Thử chèn Khóa ngoại (`FK`) trỏ tới bản ghi cha không tồn tại -> Bắt buộc bị từ chối;
   - Thử xóa bản ghi cha có bản ghi con vận hành (`HOA_DON`, `TON_KHO`) -> Bắt buộc bị chặn (chống cascade delete bừa bãi);
   - Thử chèn giá trị vi phạm `CHECK` constraint (ví dụ `so_luong < 0`, `don_gia < 0`) -> Bắt buộc bị CSDL từ chối;
   - Thử chèn `NULL` vào các cột bắt buộc -> Bắt buộc bị từ chối;
   - Thử chèn trùng mã nghiệp vụ bảo vệ bởi `UNIQUE` constraint -> Bắt buộc bị từ chối.
2. **Hành vi Giao dịch và Concurrency (Transactions & Locking)**:
   - Kiểm tra giao dịch hoàn tác toàn phần (Rollback) khi bước con thất bại;
   - Kiểm tra cơ chế khóa và token `rowversion` chống xung đột cập nhật đồng thời;
3. **Cô lập Chi nhánh và RLS tại CSDL**:
   - Kiểm tra Security Policy và hàm Predicate của RLS khi `SESSION_CONTEXT` được thiết lập cho Chi nhánh A không thể đọc dòng dữ liệu của Chi nhánh B;
   - Kiểm tra nguyên tắc Fail-Closed khi `SESSION_CONTEXT` rỗng.
4. **Kiểm thử Tiến hóa Lược đồ (Migrations) và Dữ liệu Khởi tạo (Seed)**:
   - Kiểm tra khả năng chạy migration nâng cấp CSDL không gây lỗi;
   - Kiểm tra tính lặp lại (idempotency) của script seed data khi chạy nhiều lần.

---

### 10.2. Ranh giới Thẩm quyền của Database Test

- **Database Test PASS ≠ Toàn bộ Hệ thống PASS**: Việc cơ sở dữ liệu chặn được số lượng âm chỉ chứng minh tầng CSDL có chốt chặn an toàn; nó không chứng minh ứng dụng backend đã xử lý lỗi và hiển thị thông báo thân thiện cho người dùng.
- Skill 08 phối hợp với Skill 07 để xác minh CSDL, nhưng **không thay thế** trách nhiệm thiết kế schema của Skill 07.

---

## 11. KIỂM THỬ HỢP ĐỒNG GIAO TIẾP (CONTRACT TESTING)

### 11.1. Mục tiêu và Bản chất của Contract Testing

Contract Testing bảo đảm sự ăn khớp hoàn hảo giữa kỳ vọng của bên gọi (Consumer: Web React, Mobile Flutter) và bên cung cấp dịch vụ (Provider: Backend ASP.NET Core API):
- **Request Contract**: Các trường bắt buộc, kiểu dữ liệu, định dạng ngày tháng ISO 8601 UTC, cấu trúc query parameters;
- **Response Contract**: Cấu trúc payload JSON, quy ước đặt tên thuộc tính theo hợp đồng đã thiết lập (không tự ý giả định quy ước nếu chưa có evidence), định dạng số tiền tệ chính xác (decimal dạng số, không dùng float);
- **Error Contract**: Cấu trúc Problem Details RFC 7807 (`type`, `title`, `status`, `errors`);
- **Khả năng Tương thích Ngược (Backward Compatibility)**: Việc bổ sung trường mới không làm gãy ứng dụng client cũ.

---

### 11.2. Nguồn Sự Thật của Contract Phải Được Xác Định bằng Bằng Chứng

- **Không mặc định OpenAPI/Swagger là nguồn sự thật duy nhất** nếu codebase chưa có bằng chứng xác nhận OpenAPI được tạo tự động và phản ánh chính xác runtime DTO;
- Nguồn sự thật của hợp đồng có thể là:
  - Tài liệu đặc tả API đã được phê duyệt;
  - Mã nguồn Backend DTOs đang chạy;
  - File OpenAPI/Swagger spec vật lý;
- Nếu nguồn hợp đồng chưa rõ ràng, Agent phải đánh giá là `NOT VERIFIED` và tiến hành khảo sát trước khi viết test.

---

## 12. KIỂM THỬ XÁC THỰC (AUTHENTICATION TESTING)

### 12.1. Các Kịch bản Kiểm thử Xác thực Chuẩn mực

Kiểm thử xác thực phối hợp với Rule 03 nhằm bảo đảm danh tính của caller được kiểm tra chặt chẽ:
1. **Request Ẩn danh (Unauthenticated Request)**: Gửi request không mang token tới endpoint được bảo vệ -> Bắt buộc nhận phản hồi `401 Unauthorized`;
2. **Token Hợp lệ (Valid Authentication)**: Gửi request mang token JWT hợp lệ -> Được phép đi tiếp vào pipeline xử lý;
3. **Thông tin Đăng nhập Không hợp lệ (Invalid Credentials)**: Đăng nhập sai mật khẩu, tài khoản không tồn tại -> Nhận lỗi từ chối, không tiết lộ tài khoản có tồn tại hay không;
4. **Token Hết hạn (Expired Token)**: Gửi token đã quá hạn sử dụng (`exp`) -> Bắt buộc bị từ chối với `401 Unauthorized`;
5. **Chữ ký Token Bị Giả mạo (Tampered Signature / Bad Token)**: Thay đổi payload của JWT nhưng không có private key hợp lệ để ký lại -> Bắt buộc bị từ chối;
6. **Thiếu Ngữ cảnh Xác thực (Missing Auth Context)**: Request có header nhưng context server-side bị rỗng hoặc lỗi -> Phải từ chối an toàn (Fail-Closed).

---

### 12.2. Phân định Ranh giới với Rule 03

- Rule 03 sở hữu chính sách xác thực và bảo mật mật khẩu/JWT;
- Skill 08 chỉ thiết kế và thực thi các ca kiểm thử nhằm xác minh cơ chế xác thực hoạt động đúng chính sách đó.

---

## 13. KIỂM THỬ PHÂN QUYỀN VÀ RBAC (AUTHORIZATION / RBAC TESTING)

### 13.1. Các Nhóm Kịch bản Kiểm thử Phân quyền

Phối hợp với Rule 04 (Mô hình RBAC) và Rule 05 (Thực thi Authorization Runtime), Skill 08 xác minh hệ thống kiểm soát quyền hạn phía server:

> **LƯU Ý QUAN TRỌNG**: Các kịch bản dưới đây chỉ là **ví dụ minh họa (illustrative examples only)**. Kết quả mong đợi (cho phép hay từ chối đối với từng vai trò hoặc trạng thái) BẮT BUỘC phải được trích xuất từ Rule 04, Rule 05, Rule 02, đặc tả nghiệp vụ đã duyệt hoặc bằng chứng triển khai trong repository. Skill 08 tuyệt đối không tự định nghĩa quyền hạn hay business rules.

1. **Kiểm thử Quyền hạn theo Vai trò (Role Permissions Verification - Ví dụ minh họa)**:
   - Khi đặc tả nghiệp vụ quy định vai trò `SALES` được tạo đơn bán nhưng không được quản lý nhân sự/nhập kho: Kịch bản kiểm thử xác minh thao tác hợp lệ được chấp thuận và thao tác ngoài quyền hạn bị từ chối;
   - Khi đặc tả nghiệp vụ quy định vai trò `WAREHOUSE` quản lý phiếu nhập kho: Kịch bản kiểm thử xác minh nghiệp vụ kho được thực thi và các thao tác tài chính/bán hàng ngoài phạm vi bị chặn;
   - Vai trò quản lý (`OWNER / MANAGER`): Xác minh các thao tác quản lý theo đúng ma trận phân quyền được cấp.
2. **Kiểm thử Chống Leo thang Đặc quyền Dọc (Vertical Privilege Escalation - Ví dụ minh họa)**:
   - Người dùng có vai trò cấp dưới gọi endpoint dành riêng cho vai trò quản trị -> Bắt buộc bị chặn theo mã lỗi phân quyền của hợp đồng API (ví dụ `403 Forbidden`).
3. **Kiểm thử Chống Tự Nâng Quyền (Self-Escalation)**:
   - Người dùng tự gửi request sửa đổi role của chính mình lên role cao hơn -> Bắt buộc bị từ chối.
4. **Kiểm thử Chống IDOR / BOLA (Horizontal Privilege Escalation)**:
   - Người dùng cố tình truy cập hoặc chỉnh sửa tài nguyên của người dùng khác bằng cách thay đổi ID trên URL/payload -> Bắt buộc bị từ chối theo hợp đồng phân quyền (ví dụ `403 Forbidden` hoặc `404 Not Found`).
5. **Kiểm thử Quyền hạn Dựa trên Trạng thái Tài nguyên (State-Dependent Authorization - Ví dụ minh họa)**:
   - Khi quy tắc nghiệp vụ quy định một chứng từ ở trạng thái khóa (ví dụ hóa đơn đã hoàn tất hoặc phiếu nhập đã duyệt) không được chỉnh sửa: Kịch bản kiểm thử xác minh thao tác cập nhật bị từ chối; kết quả kỳ vọng phải lấy từ Rule 02 và domain specification.

---

### 13.2. Phân biệt Bất biến: Authentication ≠ Authorization ≠ Branch Isolation

Agent bắt buộc ghi nhớ:
- **Đã đăng nhập (Authenticated) KHÔNG CÓ NGHĨA LÀ có quyền (Authorized)**;
- **Có quyền thực hiện chức năng (Authorized) KHÔNG CÓ NGHĨA LÀ được thao tác trên dữ liệu của chi nhánh khác (Branch Isolation)**.

---

## 14. KIỂM THỬ CÔ LẬP DỮ LIỆU CHI NHÁNH (BRANCH ISOLATION TESTING)

### 14.1. Tầm quan trọng Đặc biệt trong Hệ thống PharmaBranch

Cô lập dữ liệu chi nhánh (`CHI_NHANH`) là ranh giới tenant bắt buộc của hệ thống. Kiểm thử cô lập chi nhánh phối hợp chặt chẽ với Rule 06 và Skill 07 để chứng minh dữ liệu Chi nhánh A không bị rò rỉ hoặc thao túng bởi Chi nhánh B.

---

### 14.2. Các Kịch bản Kiểm thử Cô lập Chi nhánh Bắt buộc

1. **Truy cập Cùng Chi nhánh (Same-Branch Access - Positive Test)**:
   - Nhân viên Chi nhánh B01 đọc/ghi dữ liệu thuộc Chi nhánh B01 -> **ĐƯỢC PHÉP (ALLOW)**.
2. **Truy cập Chéo Chi nhánh (Cross-Branch Read - Negative Test)**:
   - Các bài kiểm thử cô lập chi nhánh BẮT BUỘC phải xác minh rằng hành vi truy cập chéo chi nhánh bị ngăn chặn theo Rule 05, Rule 06, Rule 08 và hợp đồng API hiện có. Mã trạng thái HTTP mong đợi (ví dụ 403 Forbidden, 404 Not Found, hoặc mã phản hồi khác do hợp đồng API quy định) BẮT BUỘC KHÔNG được Skill 08 tự ý giả định hay áp đặt làm quy tắc phổ quát; bài test phải đối chiếu với hợp đồng được xác lập; không làm rò rỉ dữ liệu hoặc sự tồn tại của bản ghi chi nhánh khác.
3. **Ghi Chéo Chi nhánh (Cross-Branch Mutation - Negative Test)**:
   - Nhân viên Chi nhánh B01 gửi request cập nhật hoặc xóa dữ liệu của Chi nhánh B02 -> **TỪ CHỐI (DENY)**; transaction bị hủy bỏ hoàn toàn.
4. **Giả mạo Tham số Chi nhánh (Client-Supplied BranchId Injection)**:
   - Client gửi `?branchId=B02` hoặc body `{"branchId": "B02"}` trong khi token xác thực thuộc Chi nhánh B01 -> Server bắt buộc **bỏ qua tham số client hoặc từ chối request**; quyền hạn phải lấy từ server authentication context đáng tin cậy.
5. **Cô lập Quan hệ Đa chặng (Relational Traversal Isolation)**:
   - Tạo hóa đơn tại Chi nhánh B01 nhưng cố tình liên kết chi tiết hóa đơn trừ tồn kho của Chi nhánh B02 -> Bắt buộc bị CSDL hoặc nghiệp vụ từ chối.
6. **Báo cáo và Tổng hợp Số liệu (Aggregate & Report Isolation)**:
   - Các API báo cáo doanh thu, số lượng tồn kho, xuất file Excel/PDF phải được kiểm thử bảo đảm chỉ tính toán trên phạm vi chi nhánh của caller, không cộng dồn số liệu chi nhánh khác.
7. **Thiếu Ngữ cảnh Chi nhánh (Missing Context - Fail-Closed)**:
   - Token không chứa claim chi nhánh hợp lệ hoặc `SESSION_CONTEXT` chưa được set -> Hệ thống từ chối toàn bộ truy cập, không rơi vào trạng thái đọc tất cả (Fail-Closed).

---

### 14.3. Phân biệt Bất biến: Branch Filtering ≠ Branch Isolation

> **"Branch Filtering KHÔNG PHẢI LÀ Branch Isolation."**

- `Branch Filtering`: Chỉ đơn thuần thêm `WHERE chi_nhanh_id = @id` ở câu truy vấn ứng dụng; nếu lập trình viên quên thêm điều kiện ở một endpoint mới, dữ liệu sẽ bị rò rỉ.
- `Branch Isolation`: Ranh giới an ninh toàn diện, được bảo vệ đa tầng từ API Authorization, Application Service, và phòng thủ theo chiều sâu bằng SQL Server Row-Level Security (RLS). Kiểm thử phải xác minh cả hai tầng.

---

## 15. KIỂM THỬ BẤT BIẾN NGHIỆP VỤ (BUSINESS RULE TESTING)

### 15.1. Phạm vi Xác minh Bất biến Nghiệp vụ Nhà thuốc

Kiểm thử nghiệp vụ xác minh các quy tắc nghiệp vụ đã được đặc tả chính thức cho PharmaBranch (các đề mục dưới đây chỉ là **ví dụ minh họa / illustrative examples only**):
- **Kiểm soát Tồn kho khi Bán (Ví dụ minh họa)**: Khi nghiệp vụ yêu cầu kiểm soát tồn kho, kịch bản kiểm thử xác minh không cho phép trừ kho khi số lượng vượt quá số lượng khả dụng;
- **Tính Bất biến của Chứng từ Tài chính (Ví dụ minh họa)**: Khi nghiệp vụ quy định chứng từ đã hoàn tất (ví dụ trạng thái `COMPLETED`) là bất biến, kịch bản kiểm thử xác minh các trường giá trị, số lượng bị khóa cập nhật;
- **Tính toán Tài chính Chính xác (Ví dụ minh họa)**:
  ```text
  Thành tiền chi tiết = (Số lượng × Đơn giá) - Chiết khấu
  Tổng tiền hóa đơn = Tổng thành tiền các mục + Thuế VAT (nếu có quy định)
  ```
- **Hạn dùng của Thuốc (Ví dụ minh họa)**: Khi nghiệp vụ có quy định về thuốc hết hạn, kịch bản kiểm thử xác minh cảnh báo hoặc từ chối xuất bán lô thuốc hết hạn;
- **Quy trình Nhập và Trả hàng (Ví dụ minh họa)**: Khi quy trình nghiệp vụ yêu cầu phê duyệt phiếu nhập hoặc kiểm tra hóa đơn gốc khi trả hàng, kịch bản kiểm thử xác minh đúng luồng chuyển trạng thái.

---

### 15.2. Kỷ luật Kỹ thuật về Business Rules

- **Illustrative examples only**: Mọi kịch bản nghiệp vụ nêu trên chỉ mang tính ví dụ minh họa;
- **Nguồn gốc kết quả kỳ vọng (Expected Outcomes)**: Kết quả mong đợi của bài kiểm thử BẮT BUỘC phải được trích xuất từ:
  1. Rule 02 / đặc tả miền nghiệp vụ (domain specifications);
  2. Yêu cầu nghiệp vụ đã được phê duyệt chính thức;
  3. Mã nguồn triển khai / bằng chứng vật lý trong repository;
  4. Hợp đồng kiểm thử đã tồn tại.
- **Tuyệt đối cấm**: Agent không được tự phát minh business rules, không tự đặt ra bất biến phổ quát (như `SALES → allowed/denied` hay `COMPLETED → transition allowed/denied`) nếu chưa có căn cứ từ các nguồn trên;
- Skill 08 có trách nhiệm kiểm tra việc thực thi business rules, **không sở hữu và không định nghĩa** business rules.

---

## 16. KIỂM THỬ GIAO DỊCH VÀ XỬ LÝ ĐỒNG THỜI (TRANSACTION & CONCURRENCY TESTING)

### 16.1. Kiểm thử Tính Toàn vẹn Giao dịch (ACID Tests)

Phối hợp với Rule 02, kiểm thử giao dịch xác minh tính nguyên tử (Atomicity):
- Khi thực hiện thao tác đa bước (ví dụ: Tạo hóa đơn -> Tạo chi tiết hóa đơn -> Trừ kho lô thuốc -> Ghi nhật ký giao dịch kho):
  - **Happy path**: Tất cả các bước thành công -> Dữ liệu được COMMIT trọn vẹn;
  - **Failure path**: Bước trừ kho thất bại (do hết hàng) -> Toàn bộ transaction phải được **ROLLBACK 100%**, không để lại bản ghi hóa đơn rác hoặc số liệu kho dở dang.

---

### 16.2. Kiểm thử Tranh chấp Đồng thời (Concurrency Tests)

Kiểm thử các kịch bản va chạm dữ liệu giữa nhiều tiến trình đồng thời:
1. **Kiểm thử Tranh chấp Tiêu thụ Tài nguyên (Illustrative Concurrency Scenario)**:
   - Ví dụ minh họa: Khi một bất biến tồn kho đòi hỏi hai thao tác đồng thời không được cùng tiêu thụ một lượng tồn kho còn lại (ví dụ tồn kho = 1, hai request cạnh tranh đồng thời), kịch bản kiểm thử đồng thời CÓ THỂ thực thi các request cạnh tranh trên cùng trạng thái tài nguyên đó;
   - Kết quả kỳ vọng BẮT BUỘC phải được trích xuất từ bất biến miền/concurrency đã được phê duyệt, Rule 02 hoặc thiết kế concurrency của CSDL, tuyệt đối không bắt nguồn từ giả định của Skill này; không biến ví dụ này thành quy tắc kiểm thử phổ quát cho mọi thao tác kho.
2. **Chống Mất Dữ liệu Cập nhật (Lost Update)**:
   - Hai nhân viên cùng mở một chứng từ và cùng bấm lưu với dữ liệu sửa đổi khác nhau;
   - Cơ chế khóa lạc quan (Optimistic Concurrency với `rowversion`) hoặc khóa có điều kiện phải phát hiện xung đột và từ chối ghi đè mất dữ liệu.
3. **Xử lý Bế tắc (Deadlock Handling)**:
   - Giả lập hai giao dịch truy cập các tài nguyên theo thứ tự chéo nhau;
   - CSDL hoặc ứng dụng phải nhận diện deadlock, chọn nạn nhân (deadlock victim), thực hiện rollback an toàn và trả thông báo lỗi hoặc thực hiện retry có kiểm soát.

---

### 16.3. Tính Trung lập về Cơ chế Concurrency

- Skill 08 không ép buộc dự án phải dùng cơ chế concurrency nào (`rowversion`, conditional update, hay pessimistic lock);
- Bài test phải kiểm tra cơ chế **thực tế mà repository đang sử dụng** theo bằng chứng vật lý.

---

## 17. KIỂM THỬ TÍNH LẶP LẠI AN TOÀN (IDEMPOTENCY TESTING)

### 17.1. Mục tiêu và Kịch bản Kiểm thử Idempotency

Kiểm thử tính lặp lại an toàn nhằm bảo đảm việc một request bị gửi lại nhiều lần (do mạng lag, retry tự động, hoặc người dùng thao tác đúp) không gây ra tác động nghiệp vụ trùng lặp:
1. **Gửi Lặp lại Request Tạo Đơn / Thanh toán (Duplicate Submission)**:
   - Gửi 2 request giống hệt nhau có cùng định danh nghiệp vụ hoặc cùng `Idempotency-Key` (nếu contract hỗ trợ);
   - **Kỳ vọng**: Hệ thống chỉ xử lý giao dịch một lần duy nhất; request thứ hai trả về kết quả đã được lưu trữ (cached outcome) hoặc thông báo trạng thái phù hợp (`409 Conflict`), không trừ tiền hai lần và không trừ kho hai lần.
2. **Kiểm thử Retry sau Timeout**:
   - Client gửi request, server xử lý thành công nhưng phản hồi bị timeout trên đường truyền; client gửi lại request;
   - Hệ thống phát hiện giao dịch đã hoàn tất và phản hồi an toàn.
3. **Nạp Dữ liệu Khởi tạo Lặp lại (Seed Script Idempotency)**:
   - Chạy script nạp danh mục nền tảng 2 lần liên tiếp trên cùng một CSDL -> Bắt buộc không sinh lỗi trùng khóa và không nhân đôi số lượng bản ghi.

---

### 17.2. Phân biệt Ba Cấp độ Idempotency

Agent bắt buộc phân biệt rạch ròi:
```text
Cấp độ 1: UI Double-click Prevention (Disable nút bấm trên Web/Mobile - Chỉ hỗ trợ UX)
    ≠
Cấp độ 2: API Idempotency-Key (Server-side deduplication token - Ranh giới API)
    ≠
Cấp độ 3: Database Uniqueness Invariant (UNIQUE constraint trên natural key - Chốt chặn CSDL)
```
Việc tắt nút bấm trên màn hình không được coi là bằng chứng hệ thống đã có tính idempotent!

---

## 18. KIỂM THỬ CA BIÊN VÀ XỬ LÝ LỖI (ERROR & EDGE-CASE TESTING)

### 18.1. Kiểm thử Giá trị Biên và Dữ liệu Bất thường (Edge Cases)

Không chỉ kiểm thử luồng thuận lợi (happy path), Agent phải thiết kế các ca kiểm thử biên:
- **Giá trị Số học**: Số lượng = 0, số lượng âm, số lượng vượt ngưỡng tối đa kiểu `INT`, đơn giá = 0, giá trị thập phân lẻ nhiều chữ số;
- **Chuỗi Văn bản**: Chuỗi rỗng (`""`), chuỗi toàn dấu cách (`"   "`), chuỗi vượt quá độ dài tối đa của cột CSDL, ký tự đặc biệt SQL/HTML (`'`, `"`, `<`, `>`, `&`), văn bản tiếng Việt có dấu đầy đủ và bảng mã Unicode tổ hợp;
- **Ngày tháng**: Ngày hết hạn nhỏ hơn ngày sản xuất, ngày trong quá khứ xa, ngày ở tương lai vượt giới hạn;
- **Giá trị NULL**: Giá trị `null` truyền vào trường bắt buộc, giá trị `null` truyền vào trường tùy chọn.

---

### 18.2. Kiểm thử Khả năng Phục hồi khi Gặp Lỗi (Error Handling & Resilience)

1. **Lỗi Không tìm thấy Tài nguyên (Resource Missing)**: Truy vấn ID không tồn tại -> Nhận `404 Not Found` đúng chuẩn Problem Details;
2. **Lỗi Xung đột Dữ liệu (State Conflict)**: Thêm mới bản ghi trùng mã thuốc hoặc mã vạch đã có -> Nhận `409 Conflict`;
3. **Lỗi Mất Kết nối Phụ thuộc (Dependency Failure)**: CSDL ngắt kết nối tạm thời -> Hệ thống fail-closed, trả về `500/503` an toàn, **tuyệt đối không làm lộ connection string hay mã SQL thô** ra ngoài response.

---

## 19. KIỂM THỬ GIAO DIỆN VÀ MOBILE (FRONTEND / MOBILE TESTING)

### 19.1. Phân định Kiểm thử Web React vs. Mobile Flutter

- **Web React Testing (Phối hợp Skill 04)**:
  - Kiểm thử render component, trạng thái form, validation thời gian thực, xử lý phân trang, tương thích trình duyệt và trợ năng (accessibility);
- **Mobile Flutter Testing (Phối hợp Skill 05)**:
  - Kiểm thử widget, luồng quản lý trạng thái (state management), chuyển đổi màn hình, xử lý mất mạng đột ngột (offline/reconnect), và vòng đời ứng dụng mobile.

---

### 19.2. Giới hạn An ninh Tuyệt đối của Frontend / Mobile Tests

> **"Frontend / Mobile Test PASS KHÔNG CHỨNG MINH Backend An toàn."**

- Một bài kiểm thử giao diện xác nhận rằng nút "Xóa thuốc" bị ẩn đi đối với nhân viên bán hàng **hoàn toàn không chứng minh** rằng backend đã được bảo vệ;
- Nếu nhân viên đó gửi request `DELETE /api/v1/medicines/123` trực tiếp qua công cụ HTTP mà backend vẫn thực thi, đó là lỗ hổng an ninh nghiêm trọng. Mọi kiểm thử an ninh bắt buộc phải được thẩm định tại backend.

---

## 20. KIỂM THỬ LUỒNG NGHIỆP VỤ ĐẦU CUỐI (END-TO-END TESTING)

### 20.1. Bản chất của End-to-End Testing (E2E)

Kiểm thử E2E (End-to-End Testing) xác minh một luồng công việc của người dùng hoặc nghiệp vụ đã được xác định (defined user/business workflow) đi qua các ranh giới được bao gồm trong môi trường kiểm thử (boundaries included in the test environment):
- Các ranh giới cụ thể phụ thuộc vào môi trường kiểm thử và kiến trúc thực tế có bằng chứng của repository (ví dụ từ Client/Test Actor -> Application/API Boundary -> Business Boundary -> Persistence/Database Boundary);
- E2E **không nhất thiết đồng nghĩa với việc kiểm thử toàn bộ hệ thống sản xuất (production system)**;
- Luồng kiểm thử E2E tập trung xác minh sự phối hợp thông suốt giữa các ranh giới trong phạm vi kịch bản được chọn.

**Các luồng nghiệp vụ điển hình (Ví dụ minh họa / Illustrative examples only)**:
- **Luồng Bán thuốc tại Quầy (Web Staff Workflow - Ví dụ minh họa)**:
  ```text
  Đăng nhập nhân viên (Sales)
      ↓
  Tra cứu danh mục thuốc & kiểm tra tồn kho
      ↓
  Tạo đơn hàng & thêm thuốc vào giỏ
      ↓
  Xác nhận thanh toán & xuất hóa đơn
      ↓
  Kiểm tra: Tồn kho CSDL bị trừ, hóa đơn được lưu, nhật ký kho được ghi
  ```
- **Luồng Nhập hàng vào Kho (Warehouse Workflow - Ví dụ minh họa)**:
  ```text
  Đăng nhập thủ kho (Warehouse)
      ↓
  Lập phiếu nhập kho từ nhà cung cấp
      ↓
  Phê duyệt phiếu nhập
      ↓
  Kiểm tra: Tồn kho tăng, lịch sử nhập hàng được lưu trữ
  ```

---

### 20.2. Giới hạn Nghiêm ngặt của E2E Tests

Agent tuyệt đối không được nhầm lẫn:
- **E2E PASS ≠ Backend Security PASS**: E2E chạy đúng kịch bản thiết kế sẵn không chứng minh hệ thống an toàn ở tầng backend nếu bảo mật chưa được kiểm thử độc lập ở API/backend boundary;
- **E2E PASS ≠ Branch Isolation PASS**: E2E chạy thành công trên một chi nhánh không chứng minh ranh giới cô lập chi nhánh đã được bảo đảm toàn diện;
- **E2E PASS ≠ Concurrency PASS**: E2E chạy tuần tự từng bước không phát hiện được lỗi tranh chấp đồng thời khi có nhiều tiến trình cạnh tranh;
- **E2E PASS ≠ Production Reliability**: E2E trên môi trường test giới hạn không chứng minh toàn bộ hệ thống sản xuất chịu tải hoặc có khả năng phục hồi thảm họa.

---

## 21. QUẢN LÝ DỮ LIỆU KIỂM THỬ VÀ FIXTURES (TEST DATA & FIXTURES)

### 21.1. Phân biệt Rạch ròi Ba Loại Dữ liệu

Agent bắt buộc phân biệt rõ:
1. **Dữ liệu Khởi tạo Hệ thống (Seed Data)**: Dữ liệu tối thiểu cần thiết để ứng dụng hoạt động (danh mục đơn vị tính, nhóm thuốc, quyền hệ thống); do Rule 07 và Skill 07 quản lý;
2. **Dữ liệu Mẫu Kiểm thử (Test Fixtures / Test Data)**: Dữ liệu được tạo ra phục vụ riêng cho các ca kiểm thử cụ thể (ví dụ: Tạo hóa đơn mẫu với ID xác định, user kiểm thử có role cụ thể) và phải được dọn dẹp sau khi chạy test;
3. **Dữ liệu Sản xuất (Production Data)**: Dữ liệu nghiệp vụ thật của khách hàng, bệnh nhân và nhà thuốc.

---

### 21.2. Kỷ luật Bảo vệ Dữ liệu Tuyệt đối

- **TUYỆT ĐỐI CẤM SỬ DỤNG DỮ LIỆU PRODUCTION THẬT** trong môi trường kiểm thử khi chưa được ẩn danh hóa (anonymization) và chưa có sự phê duyệt bảo mật;
- **Cấm lưu trữ thông tin nhạy cảm trong Test Fixtures**: Không hard-code mật khẩu bản rõ, private keys, API secrets, hay thông tin định danh cá nhân (PII) trong mã nguồn kiểm thử;
- **Dữ liệu Kiểm thử Phải Nhận thức Chi nhánh (Branch-Aware Test Data)**: Dữ liệu test tạo ra phải được gắn đúng `chi_nhanh_id` hợp lệ để không gây nhiễu cho các bài kiểm thử cô lập chi nhánh;
- **Chiến lược Dọn dẹp Dữ liệu (Cleanup Strategy)**: Sau khi ca test kết thúc, dữ liệu test tạm thời phải được rollback hoặc dọn dẹp sạch sẽ để bảo đảm tính độc lập cho các lần chạy tiếp theo.

---

## 22. MÔI TRƯỜNG KIỂM THỬ (TEST ENVIRONMENT)

### 22.1. Phân loại Môi trường Kiểm thử

Hệ thống PharmaBranch có thể vận hành trên nhiều môi trường kiểm thử khác nhau:
- **Môi trường Cục bộ (Local Test Environment)**: Chạy trên máy tính của lập trình viên, phục vụ chu kỳ phản hồi nhanh (Unit/Component test);
- **Môi trường Tích hợp Tự động (CI Pipeline Environment)**: Chạy tự động trên các runner của hệ thống CI/CD khi có pull request hoặc commit mới;
- **Môi trường Kiểm thử Tích hợp (Dedicated Integration / Staging Environment)**: Môi trường triển khai độc lập có cấu hình tương tự production để chạy E2E và kiểm thử hiệu năng.

---

### 22.2. Nguyên tắc Cô lập Cấu hình Môi trường

- Môi trường test phải sử dụng tệp cấu hình độc lập (ví dụ `appsettings.Testing.json`, biến môi trường test riêng biệt);
- Cơ sở dữ liệu kiểm thử phải tách biệt hoàn toàn khỏi cơ sở dữ liệu development chính và production;
- **Cảnh báo quan trọng**: Tuyệt đối không bao giờ giả định rằng môi trường kiểm thử cục bộ giống hoàn toàn 100% môi trường production về mặt hiệu năng, dung lượng mạng, tài nguyên CPU và cơ chế phân cụm.

---

## 23. CHẤT LƯỢNG BỘ KIỂM THỬ VÀ FLAKY TESTS (TEST QUALITY & FLAKY TESTS)

### 23.1. Nhận diện và Nguyên nhân Gây ra Flaky Tests

Flaky Test là bài kiểm thử cho kết quả không ổn định (lúc PASS lúc FAIL) trên cùng một phiên bản mã nguồn không đổi. Các nguyên nhân phổ biến:
1. **Phụ thuộc vào Thời gian (Timing & Race Conditions)**: Lạm dụng `Thread.Sleep()`, `delay()` cố định thay vì chờ đợi có điều kiện (polling/await condition);
2. **Chia sẻ Trạng thái Khả biến (Shared Mutable State)**: Các bài test dùng chung dữ liệu trong CSDL hoặc biến tĩnh (static variables) mà không dọn dẹp, dẫn đến việc test chạy trước làm hỏng test chạy sau;
3. **Phụ thuộc Thứ tự Thực thi (Test Order Dependency)**: Bài test chỉ PASS khi được chạy theo một thứ tự nhất định;
4. **Dữ liệu Ngẫu nhiên Không Kiểm soát**: Sử dụng hàm random mà không kiểm soát giá trị biên, gây ra fail ngẫu nhiên;
5. **Khẳng định Quá Giòn (Brittle Assertions)**: Khẳng định cứng nhắc trên chuỗi thông báo lỗi thay đổi thường xuyên hoặc thứ tự mảng không xác định.

---

### 23.2. Phân loại Khiếm khuyết khi Kiểm thử Thất bại

Khi một bài kiểm thử bị thất bại (FAIL), Agent bắt buộc phải phân loại chính xác nguyên nhân theo 5 nhóm:
- **`Product Defect` (Lỗi sản phẩm)**: Mã nguồn nghiệp vụ hoặc hệ thống bị sai logic, vi phạm invariant;
- **`Test Defect` (Lỗi mã kiểm thử)**: Mã test viết sai, giả định sai, over-mocking, hoặc assertion quá giòn;
- **`Environment Defect` (Lỗi cấu hình môi trường)**: Thiếu biến môi trường, connection string sai, cổng mạng bị chiếm dụng;
- **`Infrastructure Defect` (Lỗi hạ tầng CI/CD)**: Hết dung lượng đĩa, máy chủ CI bị timeout, mạng chập chờn;
- **`Unknown / NOT VERIFIED` (Chưa xác định)**: Chưa đủ bằng chứng để kết luận nguyên nhân, cần cô lập và điều tra thêm.

**Kỷ luật**: Tuyệt đối **CẤM** việc âm thầm xóa bỏ, comment out hoặc bỏ qua (ignore/skip) một bài test bị fail mà chưa tìm ra nguyên nhân cốt lõi (root cause) và chưa có sự chấp thuận của người dùng.

---

## 24. BẢNG KIỂM TRA CHẤT LƯỢNG KIỂM THỬ (TESTING QUALITY CHECKLIST)

Trước khi kết luận bất kỳ nhiệm vụ nào liên quan đến kiểm thử hoặc xác minh hệ thống, Agent bắt buộc đối chiếu với danh sách kiểm tra 32 mục sau theo mô hình 4 trạng thái:
- **`PASS`**: Đã kiểm chứng đầy đủ và đáp ứng tiêu chuẩn bằng bằng chứng vật lý;
- **`FAIL`**: Vi phạm tiêu chuẩn hoặc không đạt yêu cầu kỹ thuật;
- **`NOT APPLICABLE (N/A)`**: Mục kiểm tra không áp dụng cho phạm vi task hiện tại (kèm lý do kỹ thuật rõ ràng);
- **`NOT VERIFIED`**: Chưa đủ bằng chứng vật lý để xác nhận (phải báo cáo minh bạch, không suy đoán thành PASS).

### 24.1. Discovery, Strategy & Technology Neutrality (Khảo sát & Chiến lược)
- [ ] **1. Khảo sát hiện trạng test bằng chứng thực tế**: Đã tìm kiếm project test, thư mục, dependencies trước khi phán đoán; không suy đoán.
- [ ] **2. Trung lập công nghệ kiểm thử**: Không áp đặt framework test, mocking library cụ thể; mọi ví dụ chỉ mang tính minh họa.
- [ ] **3. Chiến lược kiểm thử theo rủi ro**: Phân bổ loại test hợp lý theo ma trận rủi ro, không mặc định mọi tính năng đều viết mọi loại test.
- [ ] **4. Chiến lược E2E và tránh trùng lặp giữa các tầng**: E2E xác minh workflow qua các ranh giới trong test environment (không mặc định là full production system); không lặp lại ca test biên chi tiết giữa các tầng.

### 24.2. Unit & Component Testing (Đơn vị & Thành phần)
- [ ] **5. Unit test xác định và cô lập**: Không phụ thuộc vào CSDL thật, mạng hay biến thời gian ngẫu nhiên; chạy nhanh và ổn định.
- [ ] **6. Kiểm thử hành vi thay vì chi tiết triển khai**: Hạn chế over-mocking; tập trung assert trạng thái đầu ra và kết quả nghiệp vụ.
- [ ] **7. Nhận thức rõ giới hạn của Unit Test**: Hiểu rõ "Unit Test PASS không đồng nghĩa hệ thống hoàn toàn đúng hay an toàn".
- [ ] **8. Component test phân định rõ ranh giới**: Kiểm tra đúng trạng thái UI (loading, success, error, empty) mà không thay thế API test.

### 24.3. API & Contract Testing (Giao diện Lập trình & Hợp đồng)
- [ ] **9. API test tuân thủ hợp đồng Rule 08**: Xác minh HTTP method, URI, status codes, request/response DTO/schema, phân trang, lọc và sắp xếp theo Rule 08 và hợp đồng API hiện có; không hard-code quy ước đặt tên URI nếu chưa có bằng chứng.
- [ ] **10. Định dạng lỗi Problem Details RFC 7807**: Xác minh cấu trúc lỗi máy đọc được, không lộ thông tin nhạy cảm ở production.
- [ ] **11. Nguồn sự thật Contract dựa trên bằng chứng**: Xác định rõ hợp đồng từ code DTOs hoặc spec vật lý; không suy đoán OpenAPI là tuyệt đối.
- [ ] **12. Nhận thức giới hạn của API Test**: Hiểu rõ "API Test PASS không chứng minh toàn vẹn CSDL hay cô lập chi nhánh tuyệt đối".

### 24.4. Security, Authentication & Authorization Testing (Bảo mật & Phân quyền)
- [ ] **13. Kiểm thử ranh giới xác thực (Authentication)**: Bao phủ request ẩn danh (401), token hết hạn, sai chữ ký, thiếu context.
- [ ] **14. Kiểm thử phân quyền RBAC theo Rule 04 & 05**: Kịch bản kiểm thử vai trò mang tính minh họa; kết quả kỳ vọng trích xuất từ Rule 04 & 05 và hợp đồng API; từ chối đúng chuẩn khi thiếu quyền.
- [ ] **15. Kiểm thử chống leo thang đặc quyền**: Kiểm tra chống leo thang dọc, tự nâng quyền và chống truy cập tài nguyên chéo người dùng (IDOR/BOLA).
- [ ] **16. Phân biệt Authentication ≠ Authorization**: Tách biệt rõ ràng việc xác thực danh tính với quyền hạn thực thi chức năng.

### 24.5. Branch Isolation Testing (Cô lập Dữ liệu Chi nhánh)
- [ ] **17. Kiểm thử đọc/ghi chéo chi nhánh bị từ chối**: Xác minh hành vi truy cập chéo chi nhánh bị ngăn chặn theo Rule 05, 06, 08 và hợp đồng API; mã phản hồi kỳ vọng (như 403, 404...) tuân theo contract, không tự suy đoán.
- [ ] **18. Kiểm thử giả mạo tham số BranchId từ client**: Gửi branchId khác trong query/body bắt buộc bị bỏ qua hoặc từ chối an toàn.
- [ ] **19. Phân biệt Branch Filtering ≠ Branch Isolation**: Xác minh cô lập ở cả tầng ứng dụng và tầng CSDL (RLS), không chỉ lọc WHERE.
- [ ] **20. Kiểm thử báo cáo và tổng hợp dữ liệu chi nhánh**: Báo cáo tài chính, doanh thu, xuất file tuyệt đối không tính lẫn dữ liệu chi nhánh khác.
- [ ] **21. Kiểm thử nguyên tắc Fail-Closed chi nhánh**: Thiếu context chi nhánh bắt buộc từ chối toàn bộ truy cập.

### 24.6. Database, Integrity & Concurrency Testing (CSDL & Đồng thời)
- [ ] **22. Kiểm thử ràng buộc vật lý CSDL (Rule 07)**: Kiểm tra CSDL từ chối chèn trùng PK, sai FK, vi phạm CHECK, NOT NULL, UNIQUE.
- [ ] **23. Kiểm thử tính nguyên tử giao dịch (ACID)**: Thao tác đa bước gặp lỗi ở bước con bắt buộc rollback 100%, không để lại dữ liệu dở dang.
- [ ] **24. Kiểm thử tranh chấp đồng thời (Concurrency)**: Kịch bản concurrency mang tính minh họa; kết quả kỳ vọng trích xuất từ Rule 02, thiết kế CSDL hoặc domain spec, không tự áp đặt invariant phổ quát.
- [ ] **25. Kiểm thử cơ chế Concurrency thực tế**: Xác minh đúng cơ chế repository dùng (`rowversion`, conditional update); không áp đặt cơ chế giả định.
- [ ] **26. Nhận thức giới hạn của Database Test**: Hiểu rõ "Database Test PASS không chứng minh tầng phân quyền ứng dụng đã an toàn".

### 24.7. Business Rules, Idempotency & Edge Cases (Nghiệp vụ & Ca biên)
- [ ] **27. Kiểm thử bất biến nghiệp vụ dựa trên bằng chứng**: Kịch bản nghiệp vụ mang tính minh họa; kết quả kỳ vọng bắt buộc trích xuất từ Rule 02, domain spec hoặc bằng chứng repo; không tự phát minh quy tắc.
- [ ] **28. Kiểm thử tính lặp lại an toàn (Idempotency)**: Gửi lặp lại request tạo đơn/thanh toán không gây trùng lặp tác động phụ.
- [ ] **29. Phân biệt các cấp độ Idempotency**: Tách biệt UI click prevention với API Idempotency-Key và Database UNIQUE constraint.
- [ ] **30. Kiểm thử giá trị biên và dữ liệu bất thường**: Bao phủ số 0, số âm, chuỗi rỗng, văn bản Unicode tiếng Việt và giá trị NULL.

### 24.8. E2E, Test Data, Quality & Flaky Tests (Vận hành, Dữ liệu & Chất lượng)
- [ ] **31. Dữ liệu test độc lập và an toàn**: Tuyệt đối không dùng dữ liệu production thật; không hard-code secrets; dữ liệu test gắn đúng chi nhánh.
- [ ] **32. Xử lý và phân loại Flaky Tests minh bạch**: Phân định rõ lỗi sản phẩm, lỗi test, lỗi môi trường hay hạ tầng; không âm thầm tắt test.

---

### 24.9. Định nghĩa Hoàn thành của Hoạt động Kiểm thử (Definition of Done)

Một hoạt động kiểm thử chỉ được công nhận hoàn thành khi:
1. **Mọi mục kiểm tra áp dụng (APPLICABLE) đều đạt trạng thái `PASS`**;
2. **Tuyệt đối không còn mục `FAIL` nào tồn đọng** mà không được báo cáo và xử lý;
3. **Mọi mục `NOT APPLICABLE` hoặc `NOT VERIFIED` đều được ghi nhận minh bạch** kèm lý do kỹ thuật hoặc tình trạng thiếu hụt bằng chứng vật lý;
4. **Không sử dụng câu phát biểu "All tests pass" như một bằng chứng duy nhất** để khẳng định hệ thống hoàn toàn không có lỗi, mà phải nêu rõ phạm vi và ranh giới mà bộ test đã bao phủ.

---

## 25. TUÂN THỦ QUẢN TRỊ DỰ ÁN VÀ RANH GIỚI CROSS-SKILL (GOVERNANCE & CROSS-SKILL BOUNDARY)

### 25.1. Bảng Ma trận Thẩm quyền Toàn hệ thống

| Quy tắc / Kỹ năng | Quyền sở hữu Chính sách / Triển khai (Ownership) | Trách nhiệm Xác minh của Skill 08 (Testing Responsibility) |
| :--- | :--- | :--- |
| `00-project-governance.md` | Nguyên tắc evidence-first, kỷ luật scope lock, thứ bậc thẩm quyền | Thu thập bằng chứng thực tế trước khi kết luận; tuân thủ quy trình kiểm toán chỉ đọc |
| `01-architecture.md` | Kiến trúc Client-Server, phân tầng hệ thống, quan hệ phụ thuộc một chiều | Thiết kế test tôn trọng ranh giới phân tầng; không viết test xuyên tầng vi phạm kiến trúc |
| `02-architecture-quality.md` | Chính sách giao dịch ACID, concurrency, idempotency, state transitions | Thiết kế kịch bản test rollback nguyên tử, tranh chấp kho đồng thời, kiểm tra idempotency |
| `03-security.md` | Tiêu chuẩn an ninh, JWT authentication, chống SQL Injection, CLS | Thiết kế kịch bản test xác thực token, kiểm thử bảo mật đầu vào, bảo vệ dữ liệu nhạy cảm |
| `04-rbac.md` | Mô hình phân quyền RBAC, ma trận quyền hạn, danh mục vai trò nghiệp vụ | Thiết kế ma trận kiểm thử phân quyền theo role, kiểm tra từ chối khi vượt quyền |
| `05-authorization.md` | Thực thi kiểm soát truy cập runtime, chống IDOR/BOLA, ownership scope | Thiết kế ca test truy cập chéo user/tài nguyên, kiểm thử chuyển đổi trạng thái nghiệp vụ |
| `06-branch-isolation.md` | Ranh giới cô lập dữ liệu chi nhánh `CHI_NHANH`, Row-Level Security | Thiết kế ca test truy cập chéo chi nhánh, giả mạo tham số `branchId`, kiểm thử fail-closed |
| `07-database-integrity.md` | Chính sách toàn vẹn CSDL, PK, FK, CHECK, NOT NULL, UNIQUE constraints | Thiết kế ca test vi phạm ràng buộc vật lý, kiểm thử tính lặp lại của seed scripts |
| `08-api-contract.md` | Chuẩn hợp đồng API, HTTP status codes, Problem Details RFC 7807 | Thiết kế API tests kiểm tra schema request/response DTOs, cấu trúc lỗi và phân trang |
| `09-observability-operations.md` | Tiêu chuẩn logging, tracing correlation ID, health checks, alerts | Kiểm tra sự hiện diện của correlation ID trong logs/headers, xác minh endpoint sức khỏe |
| Skill 01 (`codebase-onboarding`) | Phương pháp luận khảo sát codebase và phân loại trạng thái bằng chứng | Kế thừa chuỗi khảo sát evidence-first để tìm kiếm hạ tầng kiểm thử trong repo |
| Skill 02 (`coding-standards`) | Chuẩn mực viết mã sạch, quy ước đặt tên, xử lý lỗi, SOLID | Đảm bảo mã kiểm thử được viết rõ ràng, dễ bảo trì, tuân thủ coding conventions |
| Skill 03 (`dotnet-backend`) | Triển khai mã nguồn Backend C# / ASP.NET Core | Cung cấp hướng dẫn viết Unit/Integration test cho Controllers, Services, Repositories C# |
| Skill 04 (`react-frontend`) | Triển khai ứng dụng Web ReactJS | Cung cấp hướng dẫn viết Component test, form validation, UI state tests cho Web |
| Skill 05 (`flutter-mobile`) | Triển khai ứng dụng Mobile Flutter / Dart | Cung cấp hướng dẫn viết Widget test, state management test cho ứng dụng Mobile |
| Skill 06 (`api-design`) | Đặc tả thiết kế endpoints, DTO mappings, API governance | Cung cấp hướng dẫn kiểm thử hợp đồng giao tiếp (Contract Testing) khớp với thiết kế API |
| Skill 07 (`database-sqlserver`) | Triển khai T-SQL schema, constraints, RLS, scripts CSDL | Cung cấp hướng dẫn kiểm thử schema vật lý, execution plan và hành vi khóa trên SQL Server |

---

### 25.2. Chuỗi luồng Phối hợp Liên kỹ năng (Cross-Skill Verification Flow)

```text
Skill 01 (Khảo sát hiện trạng hạ tầng kiểm thử & mã nguồn)
   ↓
Rule 01 & Rule 00 (Xác định ranh giới kiến trúc và kỷ luật quản trị)
   ↓
Rules 02–08 (Xác định các chính sách an ninh, phân quyền, chi nhánh, CSDL, API contract)
   ↓
Skill 08 (Thiết kế Ma trận Kiểm thử & Kịch bản Xác minh tương ứng với từng Chính sách)
   ↓
Skill 03 / 04 / 05 / 07 (Thực thi kiểm thử trên các tầng Backend, Web, Mobile, CSDL)
   ↓
Skill 08 (Thu thập bằng chứng thực thi, phân tích kết quả, đánh giá chất lượng bộ test)
   ↓
Báo cáo Kết quả Xác minh Minh bạch (PASS / FAIL / NOT APPLICABLE / NOT VERIFIED)
```

---

### 25.3. Nguyên tắc Xử lý Xung đột (Conflict Resolution)

- **Khi Skill 08 mâu thuẫn với Rules `00–09`**:
  > **Rules luôn luôn thắng (Rules ALWAYS win).** Mọi kịch bản kiểm thử phải được điều chỉnh để tuân thủ tuyệt đối các quy định của Rules.
- **Khi Kết quả Test mâu thuẫn với Tài liệu / ERD / Thiết kế**:
  > **DỪNG LẠI và báo cáo (STOP and report).** Bằng chứng mã nguồn thực tế và kết quả test chạy thật phản ánh hiện trạng hệ thống; tài liệu có thể đã bị lỗi thời (documentation drift).
- **Khi Best Practice kiểm thử chung mâu thuẫn với Quy ước Hiện tại của Dự án**:
  > **Quy ước dự án đã được thiết lập luôn luôn thắng**, trừ khi có quyết định kiến trúc chính thức thay đổi.

---

### 25.4. Các Ranh giới Kiểm thử Trọng yếu (Critical Testing Boundaries)

Agent bắt buộc ghi nhớ các cặp ranh giới không được phép đánh đồng:

```text
Unit Test PASS                 ≠  System PASS
E2E Test PASS                  ≠  Security PASS
API Test PASS                  ≠  Branch Isolation PASS
Database Test PASS             ≠  Application Authorization PASS
Frontend / Mobile Test PASS    ≠  Backend Authorization PASS
Branch Filtering               ≠  Branch Isolation
Authentication                 ≠  Authorization
RBAC                           ≠  Branch Isolation
Idempotency                    ≠  Duplicate UI Click Prevention
Test Plan                      ≠  Test Evidence
Test Code                      ≠  Test Result
Test Result                    ≠  Production Proof
```

---

### 25.5. Nguyên tắc Tối hậu (Final Principle)

> **"Skill 08 verifies implementation and behavior. It does not redefine the policy it verifies."**  
> *(Skill 08 xác minh việc triển khai và hành vi thực tế. Skill 08 không định nghĩa lại chính sách mà nó xác minh).*

Skill 08 chỉ trả lời duy nhất câu hỏi:
> **"Làm thế nào để xác minh việc triển khai hoạt động đúng đắn theo các chính sách đã đề ra?"**

Skill 08 **tuyệt đối không** trả lời thay cho các câu hỏi thuộc quyền sở hữu của các Rules và Skills khác:
- *"Kiến trúc hệ thống là gì?"* (Thuộc `01-architecture.md`);
- *"Chính sách bảo mật và xác thực là gì?"* (Thuộc `03-security.md`);
- *"Mô hình phân quyền RBAC gồm những quyền nào?"* (Thuộc `04-rbac.md`);
- *"Chính sách cô lập chi nhánh như thế nào?"* (Thuộc `06-branch-isolation.md`);
- *"Hợp đồng API và chuẩn lỗi ra sao?"* (Thuộc `08-api-contract.md`);
- *"Ràng buộc toàn vẹn CSDL quy định thế nào?"* (Thuộc `07-database-integrity.md` & Skill 07);
- *"Quy tắc nghiệp vụ nhà thuốc vận hành ra sao?"* (Thuộc Domain Nghiệp vụ PharmaBranch).
