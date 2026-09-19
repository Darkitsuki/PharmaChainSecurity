---
name: api-design
description: >
  Thiết kế, chuẩn hóa, kiểm thử và tái cấu trúc API theo contract và
  architecture đã được xác lập; tập trung vào resource design, endpoint,
  HTTP semantics, DTO, validation, error handling, pagination, versioning,
  authorization integration, branch scope, idempotency, concurrency,
  documentation và API testing. Không thay thế API contract policy,
  security policy, RBAC, branch isolation, database integrity hoặc backend
  architecture rules.
---

# SKILL 06 — API DESIGN

## 1. MỤC TIÊU VÀ PHẠM VI (OBJECTIVE & SCOPE)

### 1.1. Mục tiêu (Objective)

Skill này hướng dẫn Agent trong việc:

- thiết kế API resource và endpoint semantics;
- thiết kế request và response contracts;
- thiết kế Data Transfer Objects (DTO) tại API boundary;
- xử lý input validation tại API boundary;
- xử lý error mapping và error responses theo contract;
- thiết kế cơ chế pagination, filtering và sorting;
- thiết kế và quản lý API versioning và backward compatibility;
- tích hợp ranh giới authentication và authorization;
- tích hợp ranh giới cô lập dữ liệu chi nhánh (branch/tenant scope);
- triển khai API-level idempotency contract khi Rule 02 và Rule 08 yêu cầu;
- xử lý concurrency và state transition tại API boundary;
- phối hợp với transaction boundary do kiến trúc backend xác lập;
- viết và cập nhật API documentation;
- viết API-specific tests (unit, integration, negative authorization, branch isolation);
- tái cấu trúc (refactoring) API an toàn, có kiểm soát.

**Nguyên tắc phân định cốt lõi**:
- **Skill 06 sở hữu**: API-layer design và các vấn đề triển khai đặc thù của tầng API (API-specific implementation concerns).
- **Skill 03 sở hữu**: Triển khai backend cụ thể (ASP.NET Core / .NET 8), application/domain services, dependency injection, middleware/pipeline, persistence/repository, cơ sở dữ liệu và hạ tầng hệ thống.
- **Rule 08 sở hữu**: Chính sách hợp đồng API tối cao (WHAT / POLICY / CONTRACT).

> *"Skill 06 governs API-layer design and API-specific implementation concerns. Framework, application, persistence, and infrastructure implementation remain under the backend implementation skill (Skill 03) and repository architecture."*

---

### 1.2. Phạm vi áp dụng (Scope)

Skill 06 áp dụng cho:

- Thiết kế mới và sửa đổi API endpoints;
- Cấu trúc Request DTO và Response DTO;
- Validation tại ranh giới API;
- Ánh xạ lỗi và chuẩn hóa HTTP status codes theo Rule 08;
- HTTP semantics (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`);
- Phân trang, lọc, sắp xếp dữ liệu;
- API versioning và đánh giá ảnh hưởng breaking changes;
- API documentation (OpenAPI / Swagger / specifications);
- API testing và rà soát chất lượng endpoint;
- Tích hợp ranh giới an ninh, quyền hạn, chi nhánh và tính bất biến giao dịch.

---

### 1.3. Phạm vi KHÔNG thuộc sở hữu của Skill 06 (Non-Responsibilities)

Skill 06 tuyệt đối **KHÔNG sở hữu** các chính sách và thẩm quyền hệ thống sau:

- **System Architecture Policy**: Thuộc `01-architecture.md`.
- **Project Governance**: Thuộc `00-project-governance.md`.
- **General Coding Standards**: Thuộc `02-coding-standards` (Skill 06 kế thừa).
- **Backend Framework / Persistence / Infrastructure Implementation**: Thuộc Skill 03 (`03-dotnet-backend`).
- **Web Frontend Implementation**: Thuộc Skill 04 (`04-react-frontend`).
- **Mobile Application Implementation**: Thuộc Skill 05 (`05-flutter-mobile`).
- **Authentication Policy / JWT Specification / Credentials**: Thuộc `03-security.md`.
- **RBAC Model & Role Definitions**: Thuộc `04-rbac.md`.
- **Runtime Authorization Policy & Enforcement**: Thuộc `05-authorization.md`.
- **Branch Isolation / Tenant Boundary / SQL Server RLS**: Thuộc `06-branch-isolation.md`.
- **Database Integrity, Relational Constraints & SQL Parameterization Implementation**: Thuộc `07-database-integrity.md`, `03-security.md` và Skill 03.
- **API Contract Authority & Policy**: Thuộc `08-api-contract.md`.
- **Operational Observability & Logging Policy**: Thuộc `09-observability-operations.md`.
- **Transaction / Concurrency / Idempotency Policy**: Thuộc `02-architecture-quality.md`.
- **Authoritative Business Domain Rules**: Thuộc domain nghiệp vụ nhà thuốc PharmaBranch.

Mọi nội dung trên phải tuân thủ nghiêm ngặt Rules `00–09` và các Skills tương ứng.

---

## 2. THỨ BẬC ƯU TIÊN VÀ TÍNH TRUNG LẬP CÔNG NGHỆ (PRIORITY & TECHNOLOGY NEUTRALITY)

### 2.1. Thứ bậc ưu tiên bắt buộc

Khi thiết kế hoặc triển khai API, Agent bắt buộc tuân theo thứ tự ưu tiên:

1. **Rules `00–09`** (Hệ thống quy tắc quản trị cốt lõi, Rules luôn luôn thắng).
2. **Yêu cầu cụ thể của Task** (Task specification).
3. **Existing API Contract & Repository Conventions** (Bằng chứng vật lý đã có trong codebase).
4. **Existing Architecture & Implementation Evidence** (Kiến trúc thực tế đã triển khai).
5. **Các Skills liên quan** (Skill 01, 02, 03, 04, 05).
6. **Official Documentation** của công nghệ/framework đang thực sự được sử dụng.
7. **Generic Engineering Best Practices** (Chuẩn mực kỹ thuật chung).
8. **Agent Preference** (Sở thích cá nhân của Agent — mức ưu tiên thấp nhất).

Agent tuyệt đối không được dùng preference cá nhân để override:
- API contract của Rule 08;
- Security policy của Rule 03/05;
- Branch isolation của Rule 06;
- Transaction/concurrency policy của Rule 02;
- Database integrity của Rule 07;
- Quy ước API sẵn có trong repository.

---

### 2.2. Tính trung lập công nghệ (Technology Neutrality)

Skill 06 không mặc định hay áp đặt:
- ASP.NET Controllers hay Minimal APIs;
- Framework ngôn ngữ khác (Spring, Express, FastAPI, NestJS);
- Giao thức ngoài REST (GraphQL, gRPC) trừ khi task/architecture phê duyệt;
- Thư viện validation cụ thể (FluentValidation, DataAnnotations);
- Thư viện mapping cụ thể (AutoMapper, Mapster);
- Công cụ sinh tài liệu cụ thể (Swashbuckle, NSwag);
- Cơ chế truy cập dữ liệu (EF Core, Dapper, ADO.NET).

Nếu repository đã có sẵn convention và công nghệ:
- Bắt buộc khảo sát bằng chứng (physical evidence) trước;
- Tuân thủ quy ước hiện có của repository;
- Không thay đổi hoặc du nhập thư viện mới chỉ vì sở thích cá nhân.

---

## 3. MÔ HÌNH SỞ HỮU TRÁCH NHIỆM (OWNERSHIP MODEL)

### 3.1. Trách nhiệm của Skill 06 (Skill 06 Owns HOW)

Skill 06 chịu trách nhiệm về phương diện thiết kế tầng API và các yêu cầu triển khai của tầng API:
- Resource modeling và URI naming conventions theo chuẩn REST;
- Ánh xạ HTTP methods tương ứng với ngữ nghĩa thao tác;
- Thiết kế Request DTO và Response DTO;
- Validation input tại ranh giới API;
- Ánh xạ lỗi sang Problem Details hoặc cấu trúc lỗi chuẩn của Rule 08;
- Thiết kế tham số phân trang, lọc và sắp xếp dữ liệu;
- Kỹ thuật versioning và tương thích ngược;
- Tài liệu hóa API (phân định rõ trạng thái thiết kế vs. triển khai);
- Triển khai API-specific tests;
- Tái cấu trúc API an toàn;
- Tích hợp ranh giới authorization, branch scope, idempotency và concurrency tại tầng API.

Framework, application services, persistence và infrastructure implementation vẫn thuộc trách nhiệm của Skill 03 và kiến trúc backend của repository.

---

### 3.2. Ranh giới với Rule 08 (Rule 08 Owns API Contract Policy)

- **Rule 08 là authority tối cao** về chính sách hợp đồng API: chuẩn URI, format DTO, HTTP status codes, pagination format, error envelope, idempotency headers, correlation IDs.
- **Skill 06 áp dụng và hiện thực hóa (operationalizes)** các nguyên tắc thiết kế API dưới sự chỉ đạo của Rule 08.
- **Quy ước API hiện có của repository** phải được ưu tiên hàng đầu nếu đã có bằng chứng vật lý.
- **Các ví dụ trong Skill 06** (về HTTP status codes, pagination fields, error envelopes, endpoint URIs) chỉ mang tính minh họa, trừ khi chúng được thiết lập rõ ràng bởi Rule 08, bằng chứng codebase hoặc API contract đã được phê duyệt.
- **Không tự tạo contract**: Agent tuyệt đối không được tự ý phát minh hợp đồng API mới chỉ dựa vào các ví dụ trong tài liệu.

> *"Examples in this skill are illustrative unless they are explicitly established by Rule 08, repository evidence, or an approved API contract."*

---

### 3.3. Ranh giới với Rule 05 (Authorization Authority) và Rule 06 (Branch Scope Authority)

- **Phân định thẩm quyền giữa Rule 05 và Rule 06**:
  - **Rule 05 (Authorization)**: Quyết định ai được phép thực hiện thao tác nào trên tài nguyên nào (WHO can perform WHAT action on WHICH resource); quy định kiểm soát BOLA/IDOR và chống leo thang đặc quyền.
  - **Rule 06 (Branch Isolation)**: Quyết định phạm vi dữ liệu chi nhánh/tenant mà actor được phép truy cập (WHICH branch/tenant data the actor may access); quy định cô lập dữ liệu và ranh giới RLS/CLS.
- **Skill 06 đảm bảo**: Thiết kế API phản ánh chính xác hai ranh giới này tại server-side (nhận định danh và branch context từ context đáng tin cậy, không tin tưởng client claims). Tuyệt đối không chuyển quyền sở hữu cô lập chi nhánh sang Skill 06.

---

### 3.4. Ranh giới với Rule 06 (Branch Isolation Authority)

- **Rule 06 quyết định**: Ranh giới cô lập dữ liệu chi nhánh, cơ chế session context, SQL Server RLS.
- **Skill 06 đảm bảo**: API boundary không phá vỡ ranh giới chi nhánh; không cho phép client parameter ghi đè tenant context; không để rò rỉ dữ liệu giữa các chi nhánh qua collection hoặc detail endpoints.

---

### 3.5. Ranh giới với Rule 02 (Transaction & Concurrency Policy)

- **Rule 02 quyết định**: Ranh giới transaction, chiến lược concurrency, yêu cầu idempotency cho các tác vụ nhạy cảm, atomicity và chuyển trạng thái nghiệp vụ.
- **Skill 06 đảm bảo**: Thiết kế API boundary tiếp nhận idempotency key, concurrency tokens đúng contract và phối hợp thực thi với tầng nghiệp vụ/persistence.

---

## 4. KHẢO SÁT HIỆN TRẠNG API (API DISCOVERY)

### 4.1. Khảo sát trước khi Thiết kế hoặc Chỉnh sửa

Trước khi thiết kế endpoint mới hoặc sửa đổi endpoint hiện có, Agent bắt buộc phải khảo sát hiện trạng repository để thu thập bằng chứng vật lý:
- API routes hiện có;
- Controllers / Endpoints / Handlers;
- Request DTOs và Response DTOs;
- Tầng Application / Service xử lý nghiệp vụ;
- Middleware / Filter / Pipeline xử lý xác thực và phân quyền;
- Cơ chế validation hiện có (DataAnnotations, FluentValidation, custom);
- Exception handling và format trả lỗi;
- API documentation (OpenAPI / Swagger / Markdown docs);
- API test suites hiện có;
- Các consumers phía client (React Web, Flutter Mobile);
- Cấu hình môi trường và API versioning conventions.

---

### 4.2. Nguồn bằng chứng và Tính trung lập của OpenAPI (Evidence Sources)

Thứ tự tin cậy của bằng chứng:
1. Physical source code (Controllers, Handlers, DTOs).
2. API integration & automated tests.
3. OpenAPI / Swagger hoặc API specification/documentation nếu tồn tại.
4. Existing frontend / mobile consumers.
5. Configuration files.
6. Documentation / Architecture diagrams.
7. Agent assumptions (không có giá trị chứng minh).

**Lưu ý quan trọng về OpenAPI / Swagger**:
- Source of truth của OpenAPI/Swagger hoặc API specification/documentation phải được xác định bằng evidence thực tế trong repository.
- Tuyệt đối không mặc định OpenAPI là design-first, code-first, generated hoặc authoritative nếu chưa có evidence.
> *"OpenAPI/Swagger or equivalent API documentation/specification may be design-first, implementation-generated, manually maintained, or hybrid depending on repository convention. Do not assume its source of truth without evidence."*
- Không được mặc định OpenAPI luôn tự động sinh từ implementation, và cũng không mặc định OpenAPI là source of truth nếu chưa có bằng chứng xác nhận quy ước của repository.

---

### 4.3. "Not Found" là Bằng chứng Hợp lệ

Nếu qua khảo sát không tìm thấy endpoint, DTO, middleware hay tài liệu:
- Phải ghi nhận rõ ràng: `Not Found` hoặc `Not Verified`.
- Tuyệt đối không tự suy diễn: *"Có thể framework tự động cấu hình ngầm"* hoặc *"Chắc là endpoint đã tồn tại"*.

---

### 4.4. Chuỗi luồng thực thi API cần xác định

```text
API Surface
    ↓
Endpoint / Route
    ↓
Request DTO
    ↓
Boundary Validation
    ↓
Authentication Context (Rule 03)
    ↓
Authorization & Scope Check (Rule 05 / 06)
    ↓
Application / Domain Logic
    ↓
Transaction Boundary (Rule 02)
    ↓
Persistence (Rule 07)
    ↓
Response DTO / Status Code (Rule 08)
```

Mọi mắt xích chưa có bằng chứng vật lý phải được đánh dấu `NOT VERIFIED`.

---

## 5. THIẾT KẾ RESOURCE VÀ ENDPOINT (RESOURCE & ENDPOINT DESIGN)

### 5.1. Thiết kế Hướng Tài nguyên (Resource-Oriented Design)

Theo phong cách RESTful, URI nên đại diện cho danh từ/tài nguyên nghiệp vụ thay vì hành động hay chi tiết kỹ thuật:

```text
GET    /api/v1/medicines
GET    /api/v1/medicines/{id}
POST   /api/v1/medicines
PUT    /api/v1/medicines/{id}
PATCH  /api/v1/medicines/{id}
DELETE /api/v1/medicines/{id}
```

*Lưu ý: Các URI trên chỉ là ví dụ minh họa; cấu trúc đường dẫn thực tế bắt buộc phải tuân theo Rule 08 và existing convention của repository.*

- Sử dụng danh từ số nhiều (plural nouns), chữ thường, phân tách bằng dấu gạch nối (kebab-case): `/api/v1/sale-orders`.
- Tránh đưa động từ CRUD vào đường dẫn: cấm dùng `/api/v1/getMedicines`, `/api/v1/deleteOrder`.

---

### 5.2. Định danh Tài nguyên (Resource Identity)

- Mỗi tài nguyên phải có định danh ổn định, bất biến (surrogate ID hoặc mã nghiệp vụ duy nhất).
- Không dùng các trường có thể thay đổi (tên thuốc, tiêu đề, số điện thoại) làm định danh chính trên đường dẫn.

---

### 5.3. Tài nguyên Lồng nhau (Nested Resources)

- Chỉ dùng lồng nhau khi có quan hệ phụ thuộc sở hữu trực tiếp rõ ràng: `/api/v1/sale-orders/{id}/items`.
- Không lạm dụng lồng nhau quá 2 cấp (ví dụ: cấm `/api/v1/branches/{id}/warehouses/{id}/shelves/{id}/boxes/{id}/medicines/{id}`).
- Việc lồng URI (ví dụ `/branches/{branchId}/medicines`) **không tự động cấp quyền truy cập mọi branch**; Rule 05 và Rule 06 vẫn thẩm định độc lập tại server-side.

---

### 5.4. Endpoint Hành động Nghiệp vụ (Action Endpoints)

Không ép mọi thao tác nghiệp vụ phức tạp vào 4 thao tác CRUD cơ bản. Đối với các state transitions hoặc domain commands, sử dụng action sub-paths rõ ràng:

```text
POST /api/v1/sale-orders/{id}/cancel
POST /api/v1/sale-orders/{id}/confirm
POST /api/v1/purchase-orders/{id}/approve
```

- Action endpoints phải tuân theo state machine của domain và được Rule 02, Rule 05 kiểm soát chặt chẽ.
- Cấm dùng action endpoint để né tránh validation hay quyền hạn.

---

## 6. NGỮ NGHĨA PHƯƠNG THỨC HTTP (HTTP METHOD SEMANTICS)

### 6.1. GET
- Thao tác an toàn (safe) và có tính idempotent, chỉ dùng để đọc dữ liệu.
- Tuyệt đối **không dùng GET để làm biến đổi trạng thái** (không tạo đơn, không trừ kho, không thanh toán, không xóa dữ liệu).

### 6.2. POST
- Dùng để tạo mới tài nguyên hoặc thực thi các domain commands/actions.
- Mặc định POST không idempotent; nếu thao tác nhạy cảm (tạo đơn, thanh toán) cần chống trùng lặp, phải tích hợp `Idempotency-Key` theo Rule 02 và Rule 08.

### 6.3. PUT
- PUT thường biểu diễn thay thế tài nguyên (replacement of a resource representation) hoặc cập nhật có tính idempotent.
- Ngữ nghĩa payload cụ thể bắt buộc phải tuân theo Rule 08 và existing API contract. Không được tự động giả định rằng mọi endpoint PUT đều bắt buộc phải gửi toàn bộ bản đại diện (full representation) nếu evidence/contract của repository không quy định.
- > *"PUT commonly represents replacement of a resource representation, but the exact payload semantics MUST follow Rule 08 and the existing API contract. Do not assume that every PUT endpoint requires a complete representation."*

### 6.4. PATCH
- Dùng để cập nhật từng phần (partial update) của tài nguyên.
- Phân biệt rõ ngữ nghĩa:
  - *Field omitted (không gửi trường)*: Giữ nguyên giá trị cũ.
  - *Field = null (gửi giá trị null)*: Xóa hoặc đặt trường về rỗng (nếu contract cho phép).

### 6.5. DELETE
- Dùng để xóa tài nguyên hoặc kích hoạt trạng thái deactivation/soft-delete đã được contract xác định.
- Thao tác phải có tính idempotent (khả năng thực hiện lặp lại an toàn, xóa nhiều lần cho kết quả nhất quán).

---

## 7. THIẾT KẾ REQUEST VÀ RESPONSE (REQUEST & RESPONSE DESIGN)

### 7.1. Hợp đồng Rõ ràng, Tường minh (Explicit Contracts)

- Mọi endpoint phải có Request model và Response model định kiểu tường minh.
- Không bind trực tiếp Database Entity vào Controller action parameters.
- Không trả về raw Database Entity cho client.

---

### 7.2. Tính Ổn định của Hợp đồng (Response Stability)

- Response DTO phải giữ cấu trúc ổn định cho consumer (Web, Mobile).
- Không tùy tiện đổi tên trường, kiểu dữ liệu, cấu trúc lồng nhau hay format phân trang/lỗi mà không qua quy trình quản lý versioning của Rule 08.

---

### 7.3. Các trường Dữ liệu do Server Sở hữu (Server-Owned Fields)

Client tuyệt đối không được phép tự quyết định các trường do server kiểm soát:
- `id` (nếu là server-generated);
- `createdAt`, `updatedAt`, `deletedAt`;
- `createdBy`, `updatedBy`, `approvedBy`;
- `branchId` (phải lấy từ authenticated context theo Rule 06);
- `ownerId`, `userId` (phải xác thực theo Rule 05);
- `totalAmount`, `discountAmount`, `taxAmount` (server phải tự tính);
- `paymentStatus`, `orderStatus` (phải qua state transition hợp lệ).

---

### 7.4. Bảo vệ Dữ liệu Nhạy cảm (Sensitive Fields Protection)

- Không trả về các trường bảo mật: password hashes, private keys, database credentials, internal tokens, security secrets.
- Tuân thủ Column-Level Security (Rule 03): chỉ trả về các trường mà role/permission của caller được phép xem.
- Không log các trường nhạy cảm trong request/response logging.

---

## 8. THIẾT KẾ DATA TRANSFER OBJECTS (DTO DESIGN)

### 8.1. Request DTO
- Chỉ chứa các trường dữ liệu mà client được phép gửi lên.
- Định kiểu chặt chẽ, có validation attributes/rules phù hợp.
- Tránh nhận các trường thừa thãi tạo nguy cơ tấn công Mass Assignment.

---

### 8.2. Response DTO
- Đại diện cho giao diện dữ liệu mà client cần hiển thị.
- Che giấu cấu trúc bảng biểu và khóa ngoại nội bộ của cơ sở dữ liệu.
- Định dạng sẵn các dữ liệu phù hợp với presentation nếu contract yêu cầu.

---

### 8.3. Phân tách Mô hình khi Cần thiết (Model Separation)

Tùy theo độ phức tạp của module, kiến trúc có thể áp dụng:

```text
Request DTO → Application/Command Model → Domain Entity → Persistence Model → Response DTO
```

Không bắt buộc mọi endpoint đều phải có đầy đủ 5 tầng model nếu thao tác đơn giản; tuy nhiên, ranh giới giữa DTO ngoại vi và Entity nội bộ phải luôn được bảo toàn.

---

### 8.4. Phòng chống Tấn công Mass Assignment

- Cấm bind tự động (auto-binding) toàn bộ payload vào domain entities hoặc persistence models.
- Cấm cho phép client cập nhật các trường nhạy cảm (`role`, `permission`, `branchId`, `isApproved`, `balance`, `inventoryQuantity`).

---

## 9. XỬ LÝ KIỂM TRA ĐẦU VÀO (INPUT VALIDATION)

### 9.1. Validation tại Ranh giới API (Boundary Validation)

Kiểm tra cú pháp và cấu trúc dữ liệu ngay tại cửa ngõ API:
- Các trường bắt buộc (`required`);
- Giới hạn độ dài chuỗi (`minLength`, `maxLength`);
- Định dạng dữ liệu (email, số điện thoại, regex format);
- Khoảng giá trị hợp lệ (`min`, `max`);
- Kiểu dữ liệu và giá trị enum hợp lệ;
- Giới hạn tham số phân trang (`page >= 1`, `1 <= pageSize <= 100`).

---

### 9.2. Phân định với Domain Validation

- **Boundary Validation**: Kiểm tra tính hợp lệ về mặt hình thức/cú pháp của dữ liệu gửi lên (ví dụ: `quantity > 0`).
- **Domain Validation**: Kiểm tra các quy tắc nghiệp vụ nghiệp vụ có thẩm quyền (authoritative business rules), ví dụ: `quantity <= tồn kho thực tế`.
- Domain validation bắt buộc phải do authoritative backend layer thực thi, không dồn toàn bộ nghiệp vụ phức tạp vào API controller.

---

### 9.3. Client Input là Hoàn toàn Không Đáng tin cậy (Untrusted Input)

Server phải độc lập kiểm tra và tính toán lại, tuyệt đối không tin:
- Đơn giá (`unitPrice`) do client gửi;
- Tổng tiền hóa đơn (`totalAmount`) do client gửi;
- Số lượng tồn kho sẵn có do client khai báo;
- Vai trò người dùng (`role`), chi nhánh (`branchId`), mã người dùng (`userId`).

---

### 9.4. Giới hạn Kích thước Input (Payload Size Limits)

Để phòng chống tấn công DoS và cạn kiệt tài nguyên:
- Giới hạn kích thước payload tối đa cho request body;
- Giới hạn độ dài mảng/danh sách gửi lên trong một request (batch operations limit);
- Giới hạn kích thước file upload và kiểm tra header `Content-Length`.

---

## 10. XỬ LÝ LỖI VÀ ÁNH XẠ PHẢN HỒI (ERROR HANDLING)

### 10.1. Chuẩn hóa Định dạng Lỗi theo Rule 08

- Phản hồi lỗi phải có cấu trúc nhất quán theo RFC 7807 Problem Details hoặc format lỗi chuẩn do Rule 08 quy định.
- Cung cấp mã lỗi nghiệp vụ rõ ràng (machine-readable error code) và thông điệp thân thiện (human-readable message).
- Với lỗi validation, trả về danh sách chi tiết các trường bị lỗi mapped theo tên trường phía DTO (camelCase).

---

### 10.2. Không để lộ Thông tin Kỹ thuật Nội bộ (Do Not Leak Internals)

Tuyệt đối không bao giờ trả về cho client:
- Raw stack trace kỹ thuật;
- Câu lệnh SQL hoặc lỗi nội bộ database;
- Chi tiết cấu trúc schema hoặc tên bảng/cột nhạy cảm;
- Connection strings, credentials, secrets;
- Đường dẫn file hệ thống nội bộ (internal filesystem paths);
- Tên class nội bộ của framework.

---

### 10.3. Phân loại Lỗi và Trạng thái HTTP

API phân loại và ánh xạ lỗi sang HTTP status codes chuẩn theo Rule 08:
- **Lỗi Cú pháp / Dữ liệu đầu vào**: `400 Bad Request`.
- **Lỗi Chưa xác thực**: `401 Unauthorized`.
- **Lỗi Không có quyền / Sai chi nhánh**: `403 Forbidden`.
- **Lỗi Không tìm thấy tài nguyên**: `404 Not Found`.
- **Lỗi Xung đột trạng thái / Trùng khóa**: `409 Conflict`.
- **Lỗi Vi phạm quy tắc nghiệp vụ**: `422 Unprocessable Entity` (nếu contract áp dụng).
- **Lỗi Quá tải / Rate limit**: `429 Too Many Requests` (nếu hệ thống hỗ trợ).
- **Lỗi Máy chủ nội bộ**: `500 Internal Server Error`.

---

### 10.4. Lan truyền Mã vết Yêu cầu (Correlation ID)

- Tiếp nhận hoặc tự sinh header `X-Correlation-ID` theo quy định của Rule 08 và Rule 09.
- Trả lại correlation ID trong response headers hoặc error response payload để hỗ trợ truy vết sự cố mà không để lộ chi tiết nội bộ.
- Không đưa thông tin nhạy cảm vào correlation metadata.

---

## 11. MÃ TRẠNG THÁI HTTP (HTTP STATUS CODES)

*Lưu ý: Bảng dưới đây chỉ là các ví dụ thiết kế minh họa; contract chính thức và bắt buộc thuộc thẩm quyền của Rule 08 và bằng chứng repository.*

| Status | Ý nghĩa thông thường | Ngữ cảnh sử dụng tiêu biểu |
| :--- | :--- | :--- |
| **200 OK** | Thành công | GET dữ liệu, PUT/PATCH cập nhật có trả body, POST action có kết quả |
| **201 Created** | Tạo mới thành công | POST tạo tài nguyên mới; trả kèm header `Location` khi phù hợp |
| **202 Accepted** | Tiếp nhận xử lý bất đồng bộ | Yêu cầu được nhận vào hàng đợi xử lý ngầm |
| **204 No Content** | Thành công không có nội dung | DELETE thành công, hoặc PUT/PATCH không cần trả về representation |
| **400 Bad Request** | Request không hợp lệ | Sai định dạng JSON, validation input thất bại |
| **401 Unauthorized** | Chưa xác thực | Token thiếu, hết hạn, hoặc chữ ký JWT không hợp lệ |
| **403 Forbidden** | Bị từ chối truy cập | Đã xác thực nhưng thiếu Role/Permission hoặc truy cập ngoài Branch Scope |
| **404 Not Found** | Không tìm thấy | Tài nguyên không tồn tại, hoặc nằm ngoài branch scope cần che giấu |
| **409 Conflict** | Xung đột trạng thái | Trùng lặp unique code, optimistic concurrency race, duplicate submit |
| **422 Unprocessable** | Vi phạm quy tắc nghiệp vụ | Cú pháp đúng nhưng vi phạm điều kiện nghiệp vụ (nếu Rule 08 dùng) |
| **429 Too Many Requests** | Vượt quá giới hạn | Quá số lượng request cho phép trong khoảng thời gian |
| **500 Server Error** | Lỗi máy chủ | Sự cố nội bộ chưa được xử lý của hệ thống |

---

## 12. PHÂN TRANG, LỌC VÀ SẮP XẾP (PAGINATION, FILTERING & SORTING)

### 12.1. Phân trang Bắt buộc cho Danh sách Lớn (Bounded Pagination)

- Không bao giờ trả về danh sách không giới hạn (unbounded query) cho các collection có khả năng tăng trưởng.
- Tham số phân trang chuẩn: `page` (1-indexed) và `pageSize`.
- Luôn quy định giá trị mặc định (ví dụ: `page=1`, `pageSize=20`) và giới hạn tối đa nghiêm ngặt (ví dụ: `maxPageSize=100`).

---

### 12.2. Chiến lược Phân trang (Pagination Strategies)

- **Offset-based Pagination (`page`, `pageSize`)**: Thích hợp cho phần lớn màn hình quản trị, danh mục thuốc, tìm kiếm thông thường.
- **Cursor-based Pagination (`cursor`, `limit`)**: Cân nhắc khi dữ liệu cực lớn, yêu cầu infinite scroll trên mobile, hoặc khi dữ liệu thêm mới liên tục gây lệch trang offset. Chỉ triển khai khi contract hoặc task yêu cầu.

---

### 12.3. Sắp xếp Ổn định (Deterministic Ordering)

- Kết quả phân trang bắt buộc phải có thứ tự sắp xếp xác định, ổn định giữa các lần gọi.
- Kết hợp khóa sắp xếp chính với Primary Key (ví dụ: `ORDER BY created_at DESC, id DESC`) để tránh trùng lặp hoặc bỏ sót phần tử khi phân trang.

---

### 12.4. Lọc Dữ liệu An toàn (Safe Filtering)

- Chỉ cho phép lọc theo danh sách trắng (whitelist) các trường và toán tử được contract công bố.
- Cấm nhận trực tiếp raw SQL expression hoặc arbitrary filter clauses từ client.

---

### 12.5. Lọc Chi nhánh là Bất khả xâm phạm (Branch Filtering Protection)

- Client không được sử dụng query parameter (ví dụ `?branchId=B02`) để xem dữ liệu của chi nhánh khác nếu user chỉ được phân quyền tại chi nhánh `B01`.
- Rule 06 là authority tối cao: Query phân trang bắt buộc phải bị cô lập theo branch context đáng tin cậy từ server.

---

## 13. QUẢN LÝ PHIÊN BẢN API (API VERSIONING)

### 13.1. Chính sách Versioning theo Rule 08

- Cơ chế versioning (URI versioning `/api/v1/...`, Header versioning hay Query versioning) phải tuân theo Rule 08 và quy ước sẵn có của repository. Không tự ý thay đổi chiến lược versioning.

---

### 13.2. Thay đổi Gây vỡ Tương thích (Breaking Changes)

Các thay đổi sau được coi là breaking changes:
- Đổi tên hoặc xóa một endpoint;
- Đổi tên hoặc xóa một field trong request/response DTO;
- Đổi kiểu dữ liệu của một field;
- Đổi một field từ optional thành required trong request;
- Thay đổi cấu trúc bao bọc lỗi hoặc phân trang;
- Thay đổi quy tắc xác thực hoặc phân quyền làm từ chối các client hợp lệ hiện có.

---

### 13.3. Kỷ luật Bảo toàn Tương thích Ngược (Backward Compatibility)

- Trước khi thực hiện bất kỳ thay đổi nào có nguy cơ breaking change, Agent bắt buộc phải khảo sát toàn bộ các consumers trong repository: React Web, Flutter Mobile, Integration tests.
- Áp dụng kỹ thuật mở rộng có kiểm soát (Expand and Contract): bổ sung field mới trước, duy trì field cũ (đánh dấu deprecated) trong thời gian chuyển tiếp thay vì xóa bỏ đột ngột.

---

## 14. RANH GIỚI XÁC THỰC (AUTHENTICATION BOUNDARY)

### 14.1. Xác thực Phía Server là Tuyệt đối

- API không bao giờ tin tưởng các cơ chế kiểm tra phía client: nút bị ẩn, frontend route guard, mobile navigation không phải là bằng chứng xác thực.
- Mọi protected endpoint bắt buộc phải đi qua middleware/filter xác thực phía server theo Rule 03.

---

### 14.2. Nguồn Định danh Đáng tin cậy (Trusted Identity Source)

- Định danh người dùng (`userId`), vai trò (`role`) và chi nhánh công tác (`branchId`) bắt buộc phải được giải mã và trích xuất từ authenticated context (JWT claims hợp lệ, validated server-side session).
- Tuyệt đối cấm lấy định danh người thực hiện từ request body, query parameter hay custom client headers (ví dụ: cấm nhận `{"userId": "123"}` để xác định người tạo đơn).

---

## 15. RANH GIỚI PHÂN QUYỀN (AUTHORIZATION BOUNDARY)

### 15.1. Thẩm định Quyền Hạn tại Server-Side

- Mọi API endpoint phải gắn liền với yêu cầu phân quyền cụ thể theo Rule 04 và Rule 05.
- Thẩm định dựa trên bộ tứ:
  ```text
  Authenticated Principal + Required Permission + Target Resource + Allowed Scope → ALLOW / DENY
  ```

---

### 15.2. Chống Lỗ hổng BOLA / IDOR

- Biết được `id` của tài nguyên (ví dụ: `GET /api/v1/sale-orders/{id}`) **không đồng nghĩa** với việc caller có quyền xem tài nguyên đó.
- API bắt buộc phải kiểm tra quyền sở hữu (ownership) và phạm vi chi nhánh (branch scope) trước khi trả về dữ liệu.

---

### 15.3. Thao tác Phụ thuộc Trạng thái Nghiệp vụ (State-Aware Operations)

- **Phân định thẩm quyền**:
  > *"Authorization determines whether the actor is permitted to perform the action. State-transition/business-state constraints are governed by Rule 02 and domain/business rules. Skill 06 coordinates these concerns at the API boundary but does not redefine their authority."*
- Rule 05 thẩm định tính hợp lệ của người gọi (Actor, Permission, Resource).
- Ranh giới chuyển trạng thái nghiệp vụ, vòng đời (lifecycle), điều kiện tiên quyết và tính nhất quán trạng thái thuộc thẩm quyền của Rule 02 và domain/business rules.
- **Vai trò của Skill 06 tại API boundary**:
  - Không biến tầng API thành nơi sở hữu business state machine.
  - Phản ánh chính xác các ràng buộc trạng thái: từ chối thao tác không hợp lệ với mã lỗi phù hợp (ví dụ: `409 Conflict` hoặc `422 Unprocessable`) khi tài nguyên ở trạng thái cấm sửa đổi (ví dụ: đơn hàng đã `CANCELLED` / `COMPLETED`, phiếu nhập đã `APPROVED`).
  - Cấm cho phép client gửi trường `status` tùy tiện để ép chuyển trạng thái mà không thông qua business workflow được kiểm soát ở backend.

---

### 15.4. Không Bảo mật bằng Sự Mơ hồ (No Security by Obscurity)

- Không dùng URL ngẫu nhiên, ID khó đoán hay endpoint bí mật để thay thế cho cơ chế authorization.

---

## 16. RANH GIỚI CÔ LẬP DỮ LIỆU CHI NHÁNH (BRANCH / TENANT SCOPE)

### 16.1. BranchId từ Client là Hoàn toàn Không Đáng tin cậy

- Nếu request từ client có chứa tham số `branchId` (trong body, query hay header), giá trị này phải được coi là untrusted input.
- Không bao giờ dùng client-supplied `branchId` làm security boundary.

---

### 16.2. Lan truyền Ngữ cảnh Chi nhánh Đáng tin cậy

```text
Authenticated Request (JWT)
   ↓
Trích xuất User & Branch Context tại Server
   ↓
API Endpoint Authorization
   ↓
Application / Service Execution
   ↓
Session Context Initialization
   ↓
SQL Server RLS / Scoped Query Execution
```

- Endpoint tạo mới tài nguyên (`POST /api/v1/medicines`) phải tự động gắn `chi_nhanh_id` từ authenticated context của server, không cho client tự chọn chi nhánh khác.

---

### 16.3. Xử lý Thao tác Đa Chi nhánh Hợp lệ

- Các thao tác xuyên chi nhánh chỉ được phép thực hiện khi người dùng có vai trò quản trị toàn hệ thống (Global Scope theo Rule 04/06).
- Mọi truy cập xuyên chi nhánh phải được ghi nhận kiểm toán (audit log) đầy đủ.

---

## 17. TÍNH IDEMPOTENT VÀ CƠ CHẾ THỬ LẠI (IDEMPOTENCY & RETRY)

### 17.1. Phân định Trách nhiệm Idempotency

```text
Rule 02  → Quyết định CHÍNH SÁCH VÀ KHI NÀO CẦN (WHY / WHEN)
Rule 08  → Quyết định ĐẶC TẢ HỢP ĐỒNG HTTP / HEADERS (CONTRACT)
Skill 06 → Thiết kế và điều phối cơ chế tại API BOUNDARY (HOW AT API LAYER)
Skill 03 → Triển khai chi tiết tại tầng backend persistence (IMPLEMENTATION)
Skill 04/05 → Triển khai gửi key và retry an toàn phía client (CLIENT INTEGRATION)
```

---

### 17.2. Khi nào Cần Idempotency

- Không áp dụng idempotency máy móc cho mọi endpoint.
- Bắt buộc xem xét đối với các tác vụ mutation nhạy cảm: tạo đơn bán hàng, xác nhận thanh toán, hoàn tiền, điều chỉnh kho, giao dịch tài chính.

---

### 17.3. Thiết kế Idempotency Key tại API Boundary

- Tiếp nhận header định danh (ví dụ `Idempotency-Key`) theo đúng hợp đồng Rule 08 quy định. Không tự ý phát minh header mới.
- Khóa phải được liên kết chặt chẽ với caller identity và branch scope để ngăn ngừa chiếm dụng key chéo người dùng.
- Nếu request với cùng idempotency key đang được xử lý: phản hồi trạng thái chờ phù hợp hoặc `409 Conflict`.
- Nếu request với cùng idempotency key đã xử lý thành công: trả lại kết quả đã được lưu trữ (cached outcome) mà không thực thi lại side effects.

---

### 17.4. Xử lý Lệch Payload với cùng Idempotency Key (Payload Mismatch)

- Nếu client gửi lại cùng một `Idempotency-Key` nhưng nội dung request body bị thay đổi: bắt buộc từ chối (`400 Bad Request` hoặc `409 Conflict` theo Rule 08), tuyệt đối không âm thầm chấp nhận hoặc ghi đè kết quả.

---

### 17.5. Kỷ luật Thử lại Phía Client (Retry Discipline)

- Endpoint phân biệt rõ:
  - *Safe read operations*: Có thể retry an toàn khi gặp lỗi mạng tạm thời.
  - *Idempotent mutations*: Có thể retry an toàn khi có header idempotency bảo vệ.
  - *Non-idempotent mutations*: Cấm tự động retry nếu không có idempotency protection.

---

## 18. XỬ LÝ ĐỒNG THỜI VÀ CHUYỂN TRẠNG THÁI (CONCURRENCY & STATE TRANSITIONS)

### 18.1. Trạng thái Đáng tin cậy Phải do Server Sở hữu

- API không tin tưởng trạng thái do client tự tính toán hoặc gửi lên (`status = PAID`, `inventoryAvailable = true`). Toàn bộ điều kiện nghiệp vụ phải do authoritative server layer thẩm định.

---

### 18.2. Phòng chống Mất Dữ liệu khi Cập nhật Đồng thời (Lost Update)

Khi thiết kế API cho các tài nguyên có nguy cơ bị sửa đổi đồng thời bởi nhiều người dùng:
- **Cơ chế Concurrency phải dựa trên bằng chứng kiến trúc thực tế**:
  > *"Concurrency mechanism must be derived from actual architecture, contract, and repository evidence rather than chosen by API-design preference."*
- **Các cơ chế concurrency hợp lệ bao gồm**:
  - `version/concurrency token` (ví dụ: `rowVersion`, `version` number),
  - `ETag / If-Match` HTTP headers,
  - `optimistic concurrency`,
  - `locking strategy` (pessimistic locking ở tầng database/application).
- **Quy tắc về Timestamp**:
  - Không được khiến Agent hiểu rằng timestamp hoặc `updatedAt` thông thường mặc định là concurrency token.
  - Chỉ coi timestamp-based mechanism là concurrency mechanism khi physical evidence chứng minh nó được sử dụng với semantics phù hợp cho concurrency control.
  - Không tự ý coi trường timestamp thông thường (`updated_at`) là concurrency token an toàn vì rủi ro trùng mili-giây và sai lệch clock skew.

---

### 18.3. Xử lý Dữ liệu Lỗi thời (Stale Data Handling)

- Nếu client gửi kèm version hoặc concurrency token (`expectedVersion`, `ETag`), API phải đối chiếu với dữ liệu hiện tại.
- Nếu dữ liệu đã bị thay đổi bởi giao dịch khác -> từ chối cập nhật với mã lỗi `409 Conflict` (hoặc `412 Precondition Failed` theo contract). Tuyệt đối không ghi đè âm thầm.

---

## 19. PHỐI HỢP RANH GIỚI GIAO DỊCH (TRANSACTION BOUNDARY COORDINATION)

### 19.1. Phân định Trách nhiệm Giao dịch

- API endpoint không tự động đồng nghĩa với database transaction.
- Chính sách và yêu cầu toàn vẹn giao dịch (ACID) thuộc quyền sở hữu của **Rule 02 (`02-architecture-quality.md`)**.

---

### 19.2. Chuỗi Phối hợp Giao dịch Trung lập Kiến trúc

Ranh giới giao dịch phải tuân theo kiến trúc thực tế của repository thay vì áp đặt mô hình cố định:

```text
API → Architecturally Defined Transaction Boundary → Persistence
```

- Endpoint không tự ý mở hay quản lý transaction thô nếu kiến trúc đã xác lập ranh giới giao dịch ở tầng phụ trách tương ứng.
- Skill 06 không được vô tình mandate `Application Service`, `Domain Service`, `Unit of Work`, hay `Repository` là transaction owner.
- Transaction ownership bắt buộc phải follow Rule 02 và physical architecture evidence.
- Skill 06 tuyệt đối không tự áp đặt transaction architecture.

---

### 19.3. Giao dịch Kết hợp Tác vụ Ngoại vi (External Side Effects)

- Nếu một tác vụ vừa thay đổi database vừa gọi service bên ngoài (gửi email, gọi cổng thanh toán, sinh chữ ký số):
  - Không bao bọc các cuộc gọi mạng bên ngoài vào trong database transaction mở kéo dài (gây giữ lock và deadlock).
  - Cần có chiến lược xử lý thất bại (failure-handling strategy) phù hợp dựa trên Rule 02, bằng chứng kiến trúc và yêu cầu nghiệp vụ thực tế.
  - Các cơ chế xử lý thất bại có thể bao gồm: Outbox pattern, compensation action, retry with idempotency, reconciliation hoặc cơ chế tương đương.
  - Các ví dụ trên chỉ mang tính chất minh họa, tuyệt đối không bắt buộc Outbox hay Compensation nếu kiến trúc repository không quy định.
  > *"External side effects should use an appropriate failure-handling strategy based on Rule 02, architecture evidence, and business requirements; examples include Outbox, compensation, retry, reconciliation, or an equivalent mechanism."*

---

## 20. AN NINH TẦNG API (API SECURITY)

### 20.1. Kiểm soát An ninh Toàn diện theo Rule 03

Tầng API phải kiểm soát chặt chẽ:
- Ngăn ngừa Injection (SQL, Command, LDAP);
- Ngăn ngừa Mass Assignment qua DTOs chặt chẽ;
- Ngăn ngừa BOLA / IDOR;
- Ngăn ngừa leo thang đặc quyền ngang và dọc;
- Kiểm soát input không an toàn;
- Không để lộ thông tin nhạy cảm trong response hoặc logs;
- Kiểm soát an toàn file upload (nếu có);
- Giới hạn payload size và số lượng phần tử xử lý.

---

### 20.2. Ranh giới Triển khai Parameterization (SQL Parameterization Boundary)

- **Nguyên tắc thiết kế tầng API**:
  - Skill 06 chỉ kiểm soát API boundary; Skill 06 không sở hữu SQL implementation.
  - Client input là hoàn toàn không đáng tin cậy.
  - API không được thiết kế contract hoặc input pattern khiến raw client input trở thành executable SQL hoặc query fragment.
  - Cấm thiết kế API contract cho phép client gửi raw SQL clauses, raw WHERE conditions hay arbitrary executable fragments lên server.
- **Ranh giới triển khai persistence**:
  - Actual SQL construction, query parameterization và database access implementation thuộc Rule 03, Rule 07 và Skill 03 (hoặc Skill 07 theo kiến trúc).
  - Tuyệt đối không biến Skill 06 thành SQL implementation guide.
  > *"Actual query parameterization and database access implementation are owned by the database/security/backend implementation layers (Rule 03, Rule 07, Skill 03)."*

---

### 20.3. Kỷ luật Logging An toàn

- Không ghi log chứa: mật khẩu, JWT token, refresh token, API keys, mã OTP, số thẻ thanh toán đầy đủ, dữ liệu y tế/nhân thân nhạy cảm.
- Sử dụng correlation ID để liên kết logs giữa các tầng mà không làm rò rỉ dữ liệu nhạy cảm.

---

## 21. TÀI LIỆU HÓA API (API DOCUMENTATION)

### 21.1. Phân định Trạng thái Tài liệu (Documentation State)

Tài liệu API phải phân biệt rạch ròi trạng thái của từng endpoint:

> *"Documentation state must distinguish proposed/designed APIs from implemented and verified APIs."*

Các trạng thái chuẩn (hoặc terminology tương đương nếu repository có convention):
- **`PROPOSED`**: Đang được đề xuất trong thiết kế, chưa có code triển khai.
- **`DESIGNED`**: Đã hoàn thiện thiết kế contract nhưng chưa hoàn thành implementation.
- **`IMPLEMENTED`**: Đã có physical source code (Controller, DTO, Handler).
- **`VERIFIED`**: Đã được kiểm thử tự động xác nhận hoạt động đúng contract.
- **`NOT VERIFIED`**: Có trong tài liệu nhưng chưa tìm thấy bằng chứng kiểm thử hoặc implementation code.

**Nguyên tắc kỷ luật bắt buộc**:
- Không được trình bày API `PROPOSED` hoặc `DESIGNED` như `IMPLEMENTED` hoặc `VERIFIED` nếu chưa có evidence.
- Documentation không chứng minh implementation.
- API specification không chứng minh endpoint thực sự tồn tại.
- Implementation evidence phải được kiểm tra độc lập qua physical source code và route registration.
- Tài liệu không chứng minh rằng code đã chạy đúng; code có sẵn cũng không tự động chứng minh tài liệu đã cập nhật.

---

### 21.2. Tính Đa dạng của OpenAPI / Swagger

- Tuân thủ quy ước OpenAPI của repository: code-first, design-first, manually maintained hay hybrid.
- Cập nhật đầy đủ request/response DTOs, HTTP status codes, error models, authentication requirements và query parameters.
- Nếu repository chưa có OpenAPI/Swagger: không tự ý cài đặt thêm thư viện vào dự án trừ khi task yêu cầu rõ ràng.

---

### 21.3. Dữ liệu Mẫu An toàn (Safe Examples)

- Các ví dụ (examples) trong tài liệu phải hợp lệ về mặt ngữ pháp nhưng **tuyệt đối không dùng dữ liệu production, thông tin cá nhân thật, mật khẩu thật hay API keys thật**.

---

## 22. KIỂM THỬ TẦNG API (API TESTING)

### 22.1. Các Tầng Kiểm thử API

Tùy theo phạm vi task và kiến trúc dự án:
- **API Unit Tests**: Kiểm tra DTO mapping, boundary validation, controller/handler logic độc lập.
- **API Integration Tests**: Kiểm tra luồng thực thi HTTP request thực tế qua pipeline, xác thực, phân quyền, kết nối database và trả về status code đúng contract.
- **Negative Authorization Tests**: Kiểm tra các kịch bản từ chối: Anonymous (401), Sai quyền (403), Sai chi nhánh (403/404), Sai owner (403/404), Sai trạng thái (409/422).
- **Branch Isolation Tests**: Kiểm tra actor thuộc Chi nhánh A bị từ chối/không thấy dữ liệu của Chi nhánh B.
- **Idempotency & Concurrency Tests**: Kiểm tra retry và gửi đồng thời request không gây duplicate effects.

---

### 22.2. Giới hạn Thẩm quyền của Kiểm thử API (Testing Boundary)

- **Passing API tests không chứng minh toàn bộ an ninh hệ thống**: Việc API tests pass chứng minh hành vi cụ thể được test hoạt động đúng, nhưng không thay thế cho toàn bộ kiến trúc an ninh, tính toàn vẹn cơ sở dữ liệu hay RLS enforcement tại server-side.
- Kết quả test là bằng chứng thực nghiệm (empirical evidence) cho phạm vi được kiểm thử, không suy diễn vượt quá phạm vi test case.

---

## 23. KỶ LUẬT TÁI CẤU TRÚC API (API REFACTORING DISCIPLINE)

Khi thực hiện tái cấu trúc các endpoint API:

1. **Thiết lập Baseline trước khi sửa**: Xác định rõ endpoint hiện tại, request/response DTO, các consumers đang sử dụng (Web, Mobile), test suites sẵn có và ranh giới an ninh/chi nhánh.
2. **Bảo toàn Hợp đồng Hiện có (Preserve Contract)**: Nếu task không yêu cầu breaking change, phải giữ nguyên 100% endpoint URI, field names, HTTP status codes, error format và hành vi phân quyền.
3. **Đánh giá Ảnh hưởng Tới Consumers (Consumer Impact Search)**:
   - Bắt buộc tìm kiếm các API consumers thực tế trong các đường dẫn mã nguồn vật lý (physical source paths) của React Web và Flutter Mobile đã được phát hiện trong quá trình khảo sát repository (Skill 01), tuyệt đối **không tìm kiếm trong các file hướng dẫn của skill**.
   - > *"Search actual API consumers in the physical React Web / Flutter Mobile source paths discovered during repository discovery, rather than searching skill instruction files."*
   - Xác định API consumers từ physical source code, có thể kiểm tra: API clients, services, hooks, repositories, screens/pages, DTOs/models, request builders, integration tests, configuration/environment.
   - Không giả định trước cấu trúc thư mục hay đường dẫn cụ thể nếu repository chưa chứng minh bằng bằng chứng vật lý.
4. **Thay đổi Từng bước Nhỏ (Incremental Refactoring)**:
   ```text
   Baseline → Small Change → Build & Lint → Run Tests → Contract Verification → Next Change
   ```
5. **Kiểm soát Breaking Change**: Mọi thay đổi breaking change phải có quyết định được duyệt, có chiến lược versioning theo Rule 08 và kế hoạch migration cho client.

---

## 24. BẢNG KIỂM TRA CHẤT LƯỢNG API (API QUALITY CHECKLIST)

Trước khi kết luận bất kỳ task thiết kế hoặc triển khai API nào hoàn thành, Agent bắt buộc tự đối chiếu với danh sách kiểm tra sau:

### 24.1. API Contract Authority & Rule 08
- [ ] **Rule 08 & existing API contract là authority**: API design tuân thủ Rule 08 và quy ước hợp đồng API hiện có của repository.
- [ ] **API contract source-of-truth được xác định khi cần**: Nguồn sự thật của API contract được xác định dựa trên bằng chứng vật lý (code, contract đã duyệt, repo conventions).
- [ ] **Không invented contract**: Tuyệt đối không tự ý phát minh contract mới; các ví dụ trong tài liệu chỉ mang tính chất minh họa trừ khi đã được Rule 08 hoặc repository quy định rõ.
- [ ] **PUT payload semantics follow Rule 08/existing API contract**: PUT payload semantics tuân thủ Rule 08 và existing API contract, không được tự động mặc định bắt buộc full representation nếu evidence/contract không yêu cầu.

### 24.2. API State & Documentation
- [ ] **PROPOSED/DESIGNED được phân biệt rõ với IMPLEMENTED/VERIFIED**: Phân biệt rạch ròi giữa các trạng thái `PROPOSED`, `DESIGNED`, `IMPLEMENTED` và `VERIFIED`.
- [ ] **Documentation không claim implementation khi chưa có evidence**: Tài liệu không tự nhận API đã được triển khai khi chưa có bằng chứng source code vật lý; API specification không chứng minh endpoint thực sự tồn tại.
- [ ] **Verification status is explicit when relevant**: Trạng thái kiểm thử/xác minh (`VERIFIED` / `NOT VERIFIED`) được thể hiện minh bạch, implementation evidence phải được kiểm tra độc lập.

### 24.3. OpenAPI / Swagger Source of Truth
- [ ] **OpenAPI/Swagger source of truth is identified from evidence when relevant**: Xác định nguồn sự thật của OpenAPI/Swagger từ bằng chứng repository (code-first, design-first, manually maintained hay hybrid).
- [ ] **No assumption is made that OpenAPI is always generated or authoritative**: Không mặc định OpenAPI luôn tự động sinh từ implementation, code-first, design-first hay authoritative nếu chưa có bằng chứng xác nhận.

### 24.4. Backend Boundary & Skill 03
- [ ] **API-layer concerns remain within Skill 06**: Resource modeling, endpoint semantics, request/response contracts, DTO boundary, API validation, HTTP error contracts và API testing thuộc Skill 06.
- [ ] **Skill 06 không vượt sang toàn bộ backend implementation**: Framework (ASP.NET Core), application services, dependency injection, persistence/repository, database access và infrastructure thuộc quyền sở hữu của Skill 03 và backend architecture.

### 24.5. Concurrency & State Transitions
- [ ] **Concurrency mechanism dựa trên architecture/contract/evidence**: Cơ chế concurrency (version/concurrency token, ETag/If-Match, optimistic concurrency, locking strategy) bắt nguồn từ kiến trúc và hợp đồng thực tế.
- [ ] **Timestamp fields không mặc định là concurrency token**: Không tự động coi trường timestamp (`updatedAt`, `updated_at`) là concurrency token; chỉ sử dụng khi physical evidence chứng minh nó được thiết kế với semantics phù hợp cho concurrency control.

### 24.6. Persistence & Security Boundary
- [ ] **Client input is treated as untrusted**: Mọi dữ liệu từ client đều được coi là không đáng tin cậy; API contract không cho phép client gửi raw SQL clauses hay executable query fragments.
- [ ] **SQL parameterization implementation được delegate đúng layer**: Triển khai câu lệnh tham số hóa và truy cập CSDL cụ thể thuộc Rule 03, Rule 07 và backend/persistence implementation (Skill 03); Skill 06 không biến thành SQL implementation guide.

### 24.7. Transaction Boundary & Architecture Neutrality
- [ ] **Transaction boundary không bị Skill 06 áp đặt**: Chuỗi phối hợp tuân theo `API → Architecturally Defined Transaction Boundary → Persistence`; không áp đặt kiến trúc cố định (Application Service, Domain Service, Unit of Work, Repository) nếu repository chưa chứng minh.
- [ ] **Transaction ownership tuân Rule 02 và architecture evidence**: Quyền sở hữu và ranh giới giao dịch hoàn toàn tuân thủ Rule 02 và physical architecture evidence.
- [ ] **External side-effect failure handling uses an architecture/business-appropriate strategy rather than mandating Outbox or Compensation**: Chiến lược xử lý thất bại cho external side effects dựa trên Rule 02, bằng chứng kiến trúc và yêu cầu nghiệp vụ; Outbox, compensation, retry, reconciliation chỉ là ví dụ minh họa, không bắt buộc.

### 24.8. Security, Authorization & Branch Isolation
- [ ] **Authentication được thẩm định server-side**: Identity trích xuất từ JWT/session context đáng tin cậy; không lấy từ request body/query.
- [ ] **Authorization ownership is separated from state-transition/business-state ownership**: Rule 05 quyết định ai được phép thực hiện action nào; điều kiện chuyển trạng thái và vòng đời tài nguyên thuộc Rule 02 và domain/business rules.
- [ ] **Branch/tenant scope ownership is clearly separated between Rule 05 and Rule 06**: Rule 05 quyết định quyền hạn của actor trên action/resource; Rule 06 quyết định branch/tenant data scope và cô lập dữ liệu; không chuyển quyền sở hữu cô lập dữ liệu sang Skill 06.
- [ ] **Authorization và BOLA/IDOR được bảo vệ**: Kiểm tra quyền hạn và quyền sở hữu trên mọi endpoint collection và detail theo Rule 04 và Rule 05.
- [ ] **Branch isolation độc lập với client parameter**: Branch scope lấy từ server context; cấm dùng client `branchId` để xem chéo chi nhánh theo Rule 06.
- [ ] **Sensitive data exposure & error masking**: Không trả về password hashes, private keys, tokens; error responses không để lộ internal stack traces hoặc SQL strings.

### 24.9. Request / Response, Pagination & Testing
- [ ] **DTO boundary & mass assignment prevention**: Request và Response DTOs tách biệt hoàn toàn với persistence models; ngăn chặn mass assignment.
- [ ] **Bounded pagination**: Mọi collection query đều có giới hạn `pageSize` tối đa và sắp xếp ổn định.
- [ ] **Idempotency contract theo Rule 02 và Rule 08**: Hỗ trợ idempotency key trên các mutating actions quan trọng theo đúng chính sách dự án.
- [ ] **Idempotency terminology uses correct wording**: Sử dụng chuẩn xác thuật ngữ "tính idempotent" hoặc "khả năng thực hiện lặp lại an toàn (idempotent)".
- [ ] **API consumers are discovered from actual physical frontend/mobile source paths, not skill files**: Đánh giá ảnh hưởng consumer từ physical frontend/mobile source code được phát hiện từ Skill 01, tuyệt đối không tìm kiếm trong skill instruction files.
- [ ] **API testing bao phủ happy path và negative cases**: Kiểm tra validation errors, 401, 403, 404, 409, cross-branch access; không suy diễn passing API test thành backend hoàn hảo.
- [ ] **Tái cấu trúc bảo toàn tương thích**: Đảm bảo không gây breaking change ngầm tới React Web (Skill 04) và Flutter Mobile (Skill 05).

---

## 25. TUÂN THỦ QUẢN TRỊ DỰ ÁN VÀ RANH GIỚI CROSS-SKILL (GOVERNANCE & CROSS-SKILL BOUNDARY)

### 25.1. Bảng đối chiếu Thẩm quyền với Rules và Skills

| Lĩnh vực quan tâm (Concern) | Thẩm quyền Tối cao (Authority) | Trách nhiệm của Skill 06 (How to Implement at API Layer) |
| :--- | :--- | :--- |
| **Quản trị dự án, Scope control, Evidence-first** | `00-project-governance.md` | Skill 06 chỉ sửa đổi có bằng chứng, thay đổi tối thiểu, có thể kiểm chứng |
| **Kiến trúc hệ thống tổng thể** | `01-architecture.md` | Skill 06 thiết kế API theo ranh giới Client–Server, không tạo ranh giới kiến trúc trái quy định |
| **Transaction, Concurrency, Idempotency Policy** | `02-architecture-quality.md` | Skill 06 thiết kế API tiếp nhận idempotency key, concurrency token; không tự tạo transaction boundary sai kiến trúc |
| **An ninh hệ thống, Mã hóa, Bảo vệ Secrets** | `03-security.md` | Skill 06 không để lộ secrets, không cho phép injection, che giấu dữ liệu nhạy cảm theo CLS |
| **Mô hình Vai trò và Ma trận Quyền hạn** | `04-rbac.md` | Skill 06 liên kết endpoint với quyền hạn cụ thể; không tự định nghĩa mô hình RBAC mới |
| **Thẩm định Quyền hạn Runtime, BOLA/IDOR** | `05-authorization.md` | Skill 06 thiết kế API thẩm định Actor + Permission + Resource + Scope tại server-side |
| **Cô lập Dữ liệu Chi nhánh (Branch Scope, RLS)** | `06-branch-isolation.md` | Skill 06 đảm bảo branch scope xuất phát từ authenticated server context; client input là untrusted |
| **Tính Toàn vẹn Dữ liệu và SQL Parameterization** | `07-database-integrity.md` | Skill 06 cấm API contract nhận raw SQL; việc triển khai parameterized queries thuộc Rule 07/03 |
| **Chính sách Hợp đồng API (URI, DTOs, Status)** | `08-api-contract.md` | Skill 06 áp dụng và hiện thực hóa contract của Rule 08; không tự phát minh contract |
| **Chính sách Logging, Tracing và Giám sát** | `09-observability-operations.md` | Skill 06 truyền nhận correlation ID, log an toàn; client telemetry không thay thế backend audit log |
| **Khảo sát Hiện trạng Codebase** | Skill 01 (`01-codebase-onboarding`) | Skill 06 kế thừa kết quả discovery toàn repository của Skill 01 |
| **Chuẩn mực Chất lượng Mã nguồn Chung** | Skill 02 (`02-coding-standards`) | Skill 06 tuân thủ chuẩn đặt tên, hàm nhỏ, refactoring discipline của Skill 02 |
| **Triển khai Backend (.NET Core / C# / DB Access)**| Skill 03 (`03-dotnet-backend`) | Skill 06 phối hợp thiết kế API layer; backend framework và persistence do Skill 03 sở hữu |
| **Triển khai Web Frontend (React / TypeScript)** | Skill 04 (`04-react-frontend`) | Skill 06 đảm bảo API contract ổn định, tương thích với React client consumers |
| **Triển khai Mobile Application (Flutter / Dart)** | Skill 05 (`05-flutter-mobile`) | Skill 06 đảm bảo API contract ổn định, tương thích với Flutter mobile consumers |
| **API Design / API-specific Implementation Concerns** | **Skill 06 (`06-api-design`)** | **Sở hữu API-layer design và các vấn đề triển khai đặc thù tầng API (resource, endpoint semantics, DTO, validation, error mapping, versioning, documentation, API testing)** |

---

### 25.2. Chuỗi luồng Phối hợp Liên kỹ năng (Cross-Skill Flow)

```text
Skill 01 (Khảo sát hiện trạng codebase)
   ↓
Rule 01 (Kiến trúc Client-Server)
   ↓
Rule 08 (Chính sách Hợp đồng API tối cao)
   ↓
Skill 06 (Thiết kế chi tiết API, DTOs, Validation, Error Handling, Versioning)
   ↓
Skill 03 (Triển khai Backend ASP.NET Core, Controllers/Handlers, Services, Persistence)
   ↓
Rule 05 (Thẩm định Authorization & BOLA/IDOR)
   ↓
Rule 06 (Thẩm định Branch Scope & Cô lập Tenant)
   ↓
Rule 02 (Thẩm định Transaction Boundary & Concurrency)
   ↓
Rule 07 (Thẩm định Database Integrity & Parameterization)
   ↓
Rule 09 (Ghi nhận Telemetry & Correlation Tracing)
   ↓
Skill 04 / Skill 05 (Tích hợp Client Web React & Mobile Flutter)
```

Skill 06 tuyệt đối không được đốt cháy giai đoạn hay bỏ qua các ranh giới kiểm soát trên.

---

### 25.3. Nguyên tắc Xử lý Xung đột (Conflict Resolution)

- **Khi Skill 06 mâu thuẫn với Rules `00–09`**:
  > **Rules luôn luôn thắng (Rules win).** Bắt buộc điều chỉnh thiết kế API để tuân thủ tuyệt đối quy định của Rules.
- **Khi Skill 06 mâu thuẫn với kiến trúc thực tế của codebase**:
  > **Bằng chứng vật lý của repository và quyết định kiến trúc đã duyệt luôn luôn thắng.**
- **Khi chuẩn mực kỹ thuật chung (generic best practices) mâu thuẫn với quy ước dự án**:
  > **Quy ước dự án đã được thiết lập luôn luôn thắng**, trừ khi có quyết định thay đổi kiến trúc chính thức.

---

### 25.4. Cấm Tự ý Phát minh Hợp đồng (No Contract Invention)

Agent tuyệt đối không được tự tiện tạo ra:
- Endpoint URI mới;
- Trường dữ liệu mới trong DTO;
- Mã trạng thái HTTP tùy hứng;
- Cấu trúc format lỗi tự tạo;
- Header xác thực, idempotency hay correlation tự nghĩ ra;
- Chiến lược versioning riêng biệt;

khi chưa có bằng chứng vật lý trong repository hoặc đặc tả đã được phê duyệt. Mọi đề xuất mới phải được đánh dấu rõ ràng là **`PROPOSED`**, không được coi là **`EXISTING CONTRACT`**.

---

### 25.5. Cấm Bỏ qua Ranh giới An ninh (No Security Boundary Bypass)

Nghiêm cấm thiết kế hoặc triển khai API theo đường tắt:

```text
Client → API Controller → Direct Database Access (Bypass All Boundaries)
```

Mọi request bắt buộc phải đi qua đầy đủ các chốt chặn an ninh: Xác thực (Rule 03), Phân quyền (Rule 05), Cô lập chi nhánh (Rule 06), Domain Validation và Giao dịch an toàn (Rule 02).

---

### 25.6. Định nghĩa Hoàn thành của Task API (Definition of Done)

Một task API chỉ được coi là hoàn thành khi trải qua đầy đủ các bước kiểm chứng:

```text
Discovery (Khảo sát bằng chứng vật lý)
   ↓
Design (Thiết kế DTOs, URI, Validation, Status Codes theo Rule 08)
   ↓
Implementation (Triển khai tầng API phối hợp với Skill 03)
   ↓
Validation (Kiểm tra dữ liệu đầu vào và nghiệp vụ)
   ↓
Testing (Chạy API tests, negative authorization, branch isolation)
   ↓
Contract Verification (Kiểm tra tính nhất quán với Rule 08 và Client consumers)
   ↓
Security Boundary Verification (Xác minh không có lỗ hổng BOLA/IDOR/Injection)
   ↓
Consumer Compatibility Verification (Xác minh React Web & Flutter Mobile không bị gãy)
   ↓
Documentation Verification (Cập nhật tài liệu với trạng thái IMPLEMENTED/VERIFIED rõ ràng)
```

Nếu bất kỳ bước nào chưa thể kiểm chứng bằng mã nguồn hoặc bài test thực tế, Agent bắt buộc phải ghi nhận trạng thái **`NOT VERIFIED`**, tuyệt đối không giả định hoàn thành.
