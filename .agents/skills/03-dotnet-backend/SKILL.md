---
name: dotnet-backend
description: >
  Chuẩn hóa triển khai, sửa đổi, tái cấu trúc và kiểm thử backend ASP.NET Core / .NET 8 trong PharmaBranch.
  Dùng khi làm việc với mã nguồn C#, controllers/endpoints, services, dependency injection, DTOs,
  xử lý bất đồng bộ, middleware, tích hợp truy cập dữ liệu và kiểm thử backend.
---

# .NET Backend Implementation — Chuẩn mực Triển khai Backend ASP.NET Core / .NET 8

## 1. Mục tiêu và Phạm vi (Objective & Scope)

Skill này cung cấp các chuẩn mực kỹ thuật và quy tắc triển khai chi tiết cho việc viết mới, chỉnh sửa, tái cấu trúc (refactor) và rà soát (code review) mã nguồn backend **ASP.NET Core / .NET 8** trong dự án PharmaBranch.

Mục tiêu cốt lõi:
- **Chuẩn hóa thực thi**: Đảm bảo toàn bộ mã C# và ASP.NET Core tuân thủ các thực hành kỹ thuật đáng tin cậy của nền tảng .NET 8.
- **Tuân thủ quản trị**: Hiện thực hóa đầy đủ các yêu cầu kiến trúc, an ninh, phân quyền, cô lập chi nhánh và hợp đồng API do hệ thống Rules `00–09` quy định.
- **Tính nhất quán**: Bảo toàn phong cách tổ chức, quy ước đặt tên và mẫu triển khai thực tế đang tồn tại trong repository theo nguyên tắc Existing Convention First.
- **Hiệu năng và An toàn**: Đảm bảo xử lý bất đồng bộ an toàn, quản lý vòng đời phụ thuộc chuẩn xác, xử lý lỗi an toàn không làm rò rỉ thông tin nhạy cảm.

---

## 2. Phân định trách nhiệm (Responsibility & Non-Responsibility)

Để duy trì ranh giới rõ ràng trong quản trị dự án, Skill 03 xác định rõ những gì thuộc quyền sở hữu kỹ thuật của mình và những gì là tuân thủ chính sách từ các Rules:

### 2.1. Phạm vi thuộc sở hữu của Skill 03 (Owned Responsibilities)
Skill 03 trực tiếp sở hữu và hướng dẫn kỹ thuật triển khai (.NET implementation practices) cho các thành phần backend sau:
1. **ASP.NET Core / .NET 8 implementation practices**: Cấu hình WebApplication, Program.cs, pipeline middleware.
2. **C# backend coding practices**: Cách viết code C# 12 / .NET 8 an toàn, mạch lạc, dễ bảo trì (kế thừa các quy chuẩn chung từ Skill 02).
3. **Dependency Injection (DI) implementation**: Đăng ký và quản lý vòng đời dịch vụ (Transient, Scoped, Singleton), phòng chống captive dependencies.
4. **Controller / Endpoint implementation**: Triển khai Controller hoặc Endpoint mỏng (thin controllers), phân tách trách nhiệm giao tiếp HTTP.
5. **DTO / Model boundary implementation**: Triển khai ranh giới giữa external DTOs và internal domain/data models, ngăn chặn mass assignment.
6. **Application / Service implementation practices**: Triển khai use cases, nghiệp vụ ứng dụng và điều phối giao dịch.
7. **Async / Await & CancellationToken**: Lập trình bất đồng bộ không tắc nghẽn (non-blocking) và lan truyền tín hiệu hủy tác vụ khi API hỗ trợ.
8. **Middleware implementation**: Triển khai các middleware xử lý lỗi tập trung, correlation ID, ngữ cảnh phiên.
9. **Backend error-handling implementation**: Kỹ thuật try-catch an toàn, mapping exception sang cấu trúc lỗi RFC 7807 Problem Details theo Rule 08.
10. **Configuration / Options implementation**: Triển khai Options Pattern (`IOptions<T>`, `IOptionsSnapshot<T>`) cho cấu hình strongly-typed.
11. **.NET backend testing implementation**: Triển khai unit tests, integration tests (`WebApplicationFactory`).

### 2.2. Phạm vi KHÔNG thuộc sở hữu của Skill 03 (Non-Responsibilities)
Skill 03 tuyệt đối **KHÔNG sở hữu** các chính sách hệ thống sau (chỉ hiện thực hóa và tuân thủ):
- **System Architecture Decisions**: Thuộc `01-architecture.md`.
- **Authentication Policy & JWT Specifications**: Thuộc `03-security.md`.
- **RBAC Model & Roles Definition**: Thuộc `04-rbac.md`.
- **Authorization Policy & Runtime Enforcement**: Thuộc `05-authorization.md`.
- **Branch Isolation Policy & Tenant Boundary**: Thuộc `06-branch-isolation.md`.
- **Database Integrity & Constraints Policy**: Thuộc `07-database-integrity.md`.
- **API Contract Ownership & Protocols**: Thuộc `08-api-contract.md`.
- **Observability Policy & Log Metrics Standards**: Thuộc `09-observability-operations.md`.
- **Domain Business Rules**: Thuộc đặc tả nghiệp vụ nhà thuốc PharmaBranch.
- **Deployment & Infrastructure Policy**: Thuộc DevOps / Infrastructure.
- **General Coding Standards**: Thuộc `02-coding-standards` (Skill 03 chỉ tham chiếu, không định nghĩa lại).

Nguyên tắc bất biến:
```text
"Skill 03 tuân thủ" ≠ "Skill 03 sở hữu"
```
Rules sở hữu POLICY / INVARIANT. Skill 03 sở hữu KỸ THUẬT TRIỂN KHAI (HOW TO IMPLEMENT) trên nền tảng .NET/ASP.NET Core. Skill 03 không tự ý định nghĩa lại bất kỳ policy nào.

---

## 3. Thứ bậc ưu tiên (Priority Hierarchy)

Khi triển khai mã nguồn backend, Agent bắt buộc tuân theo thứ bậc ưu tiên sau:

```text
1. Rules hiện hành (00-project-governance -> 09-observability-operations)
    ↓
2. Yêu cầu cụ thể của Task (Task-specific requirements)
    ↓
3. Quy ước thực tế hiện có trong repository / backend (Existing repository conventions)
    ↓
4. Các Skills áp dụng liên quan (Skill 01, Skill 02, Skill 03...)
    ↓
5. Quy chuẩn chính thức của .NET / ASP.NET Core (Official Microsoft guidelines)
    ↓
6. Thực hành tốt chung trong ngành (Generic best practices)
    ↓
7. Sở thích cá nhân của Agent (Agent personal preference)
```

**Nguyên tắc**:
- Không dùng "thực hành phổ biến trên mạng" hoặc "sở thích cá nhân" để ghi đè các quy định của Rules hoặc conventions đã thiết lập của repository.

---

## 4. Nguyên tắc Existing Backend Convention First

Trước khi viết mới, sửa đổi hoặc đề xuất bất kỳ giải pháp backend nào, Agent bắt buộc phải khảo sát hiện trạng mã nguồn:

### 4.1. Mười bước khảo sát backend bắt buộc
1. **Kiểm tra cấu trúc Backend**: Xác định các project con, thư mục, cách phân chia các tầng (Presentation, Application, Infrastructure...).
2. **Xác định Project Conventions**: Kiểm tra phiên bản .NET target (`net8.0`), file `.csproj`, nullable context, implicit usings.
3. **Xác định Dependency Injection style**: Xem cách nhóm service registrations (`AddApplication()`, `AddInfrastructure()` hay đăng ký trực tiếp trong `Program.cs`).
4. **Xác định Controller / Endpoint conventions**: Đang dùng Controller-based API (`[ApiController]`, `ControllerBase`) hay Minimal APIs (`app.MapGet()`).
5. **Xác định DTO conventions**: Cấu trúc request/response models, cách đặt tên, thư mục chứa DTOs, cơ chế validation.
6. **Xác định Service conventions**: Cách khai báo interface và implementation (ví dụ: `IOrderService` -> `OrderService`), cách inject logger.
7. **Xác định Công nghệ Data Access thực tế**: Kiểm tra project dependencies xem đang sử dụng ORM nào (EF Core, Dapper hay ADO.NET thuần).
8. **Xác định Error Handling conventions**: Xem hệ thống đang dùng Middleware bắt ngoại lệ, `IExceptionHandler`, hay trả về `Result<T>`.
9. **Xác định Configuration conventions**: Cách đọc `appsettings.json`, các Options classes đã khai báo.
10. **Xác định Test conventions**: Framework test đang dùng (xUnit, NUnit), cách tổ chức test project, thư viện mock/assertion.

### 4.2. Tuyệt đối không giả định kiến trúc hoặc thư viện (No Architecture Assumptions)
Tuyệt đối KHÔNG giả định hoặc áp đặt:
- Clean Architecture, Onion Architecture, Hexagonal Architecture
- CQRS, MediatR, Event Sourcing
- Repository Pattern, Unit of Work Pattern
- Entity Framework Core, Dapper
- FluentValidation, AutoMapper, Mapster
- Minimal APIs, MVC Controllers

trừ khi có **bằng chứng vật lý rõ ràng** trong codebase, hoặc yêu cầu tường minh từ task, hoặc quyết định kiến trúc đã được phê duyệt.

### 4.3. Giới thiệu công nghệ / thư viện mới (New Technology Introduction)
Chỉ được phép đưa thêm thư viện (NuGet package) hoặc pattern mới khi:
1. Task yêu cầu rõ ràng, tường minh; HOẶC
2. Quyết định kiến trúc / thiết kế đã được phê duyệt; HOẶC
3. Yêu cầu kỹ thuật đủ rõ ràng và việc thêm dependency nằm trong phạm vi cho phép của task.

Kỷ luật khi thêm package:
- Nêu rõ tên package và phiên bản tương thích .NET 8.
- Nêu rõ lý do kỹ thuật và tác động tới dự án.
- Tuyệt đối không âm thầm sửa file `.csproj` hoặc cài đặt ngầm.
- Không biến Skill 03 thành cơ chế phê duyệt kiến trúc (architecture approval mechanism).

---

## 5. Nền tảng công nghệ .NET 8 / ASP.NET Core Baseline

### 5.1. Khai thác tính năng hiện đại của C# 12 / .NET 8 (Optional & Heuristic)
- **Nullable Reference Types**: Là tính năng được khuyến nghị (recommended capability) khi project đã kích hoạt hoặc khi có yêu cầu rõ ràng từ task/quyết định kiến trúc. Không tự ý bật `<Nullable>enable</Nullable>` trong file `.csproj` nếu repository chưa sử dụng. Nếu project đã bật Nullable, code mới phải tôn trọng các chú thích nullability (`string?`, `int?`) và xử lý null một cách nhất quán. Không tự ý refactor cấu hình project chỉ để kích hoạt tính năng ngôn ngữ; luôn tôn trọng Existing Backend Convention First.
- **Primary Constructors**: Có thể sử dụng primary constructors cho class/record khi giúp code ngắn gọn, rõ ràng và phù hợp với convention của project; không bắt buộc và không refactor code cũ chỉ để dùng cú pháp này.
- **Records**: `record` hoặc `readonly record struct` có thể phù hợp cho immutable DTOs hoặc value-oriented models. Tuy nhiên, `class` thông thường vẫn hoàn toàn hợp lệ khi phù hợp với existing convention hoặc yêu cầu của framework/thư viện. Không tự ý refactor DTO hiện tại từ `class` sang `record` chỉ để tuân theo sở thích cú pháp, luôn tôn trọng Existing Convention First.
- **Collection Expressions & Pattern Matching**: Có thể sử dụng các tính năng mới của C# 12 khi giúp biểu đạt logic súc tích, dễ đọc; không refactor mã nguồn ổn định nếu project đang sử dụng cú pháp chuẩn trước đó.

### 5.2. Pipeline cấu hình ứng dụng (`Program.cs`)
Thứ tự middleware trong pipeline phải được sắp xếp theo dependency và thứ tự thực thi hợp lý của ASP.NET Core cũng như kiến trúc thực tế của project, không phải một chuỗi cố định bất biến cho mọi hệ thống.

Các nguyên tắc bất biến cần bảo đảm:
- Exception Handling / Problem Details middleware phải được đặt đủ sớm trong pipeline để có thể bắt được các ngoại lệ chưa được xử lý từ các middleware phía sau (downstream).
- Authentication middleware phải đứng trước Authorization middleware.
- Endpoint routing và endpoint mapping phải phù hợp với phiên bản và phong cách API của project.
- Ngữ cảnh chi nhánh (Branch Context) và session context phải được thiết lập tại đúng ranh giới theo yêu cầu của Rule 06 và cơ chế xác thực/phân quyền của repository.

Sơ đồ minh họa thứ tự cơ bản thường gặp:
```text
Exception Handling / Problem Details
    ↓
HTTPS Redirection & HSTS
    ↓
Routing
    ↓
Authentication
    ↓
Branch Context Setup (theo Rule 06)
    ↓
Authorization
    ↓
Endpoints / Controllers mapping
```

---

## 6. Cấu trúc Solution và Backend Projects (Conditional Guidance)

Quyết định cấu trúc phân tầng và ranh giới project thuộc quyền sở hữu của Rule 01 (`01-architecture.md`) và các quyết định kiến trúc thực tế của repository. Skill 03 chỉ triển khai mã nguồn bên trong cấu trúc đã được xác lập:
- **Bảo toàn ranh giới đã xác lập**: Nếu Rule 01 hoặc repository thực tế đã thiết lập các ranh giới phân tầng (ví dụ: Presentation / API, Application / Core, Infrastructure / Persistence), Skill 03 phải tuân thủ và bảo toàn các ranh giới đó.
- **Không tự ý tạo tầng mới**: Nếu repository chưa có các tầng này (ví dụ: project có cấu trúc phẳng hơn hoặc theo phong cách khác), tuyệt đối KHÔNG tự ý tạo thêm project hoặc thư mục phân tầng chỉ vì Skill 03 đề xuất. Không biến N-Tier hay tên layer cụ thể thành bất biến kiến trúc của Skill 03, tuân thủ nghiêm ngặt Section 4.2 "No Architecture Assumptions".
- **Sơ đồ phân tầng minh họa** (chỉ áp dụng khi repository sử dụng cấu trúc phân tầng tương ứng):
```text
API / Presentation (Controllers, Endpoints, Filters, Middlewares)
    ↓ (phụ thuộc vào)
Application / Core (Services, Interfaces, DTOs, Business Validators)
    ↓ (phụ thuộc vào)
Infrastructure / Persistence (Data Access, DB Context/Connection, External Integrations)
    ↓
Database (Microsoft SQL Server — Technology Target)
```
- **Nguyên tắc phụ thuộc một chiều**: Khi làm việc trong cấu trúc phân tầng, các tầng bên trong/thấp hơn không được phụ thuộc ngược ra các tầng bên ngoài/cao hơn (ví dụ: tầng Application không phụ thuộc vào `HttpContext` hay Presentation), và không tạo phụ thuộc vòng (circular dependencies) giữa các project.

---

## 7. Triển khai Dependency Injection (DI)

### 7.1. Lựa chọn Service Lifetimes
- **Transient (`AddTransient`)**: Dành cho các dịch vụ nhẹ, không giữ trạng thái (stateless), thực hiện các tác vụ tính toán nhanh hoặc thuật toán thuần túy.
- **Scoped (`AddScoped`)**: Vòng đời mặc định cho hầu hết các dịch vụ nghiệp vụ (Services, Repositories, DB Context/Connection) gắn liền với một vòng đời HTTP Request.
- **Singleton (`AddSingleton`)**: Dành cho các dịch vụ dùng chung xuyên suốt vòng đời ứng dụng (in-memory cache wrappers, background workers, metric collectors).

### 7.2. Phòng chống Captive Dependencies
- **Không inject trực tiếp Scoped dependency vào Singleton service**: Khi một dependency có vòng đời Scoped bị inject vào một dịch vụ Singleton mà không xử lý mismatch về lifetime, nó trở thành captive dependency. Việc này có thể khiến dependency bị giữ lại lâu hơn vòng đời dự kiến, dẫn đến trạng thái dữ liệu cũ (stale state), sự cố quản lý vòng đời tài nguyên hoặc các vấn đề an toàn đa luồng (thread-safety / concurrency issues) tùy thuộc vào bản chất của dependency. Bật `ValidateScopes = true` và `ValidateOnBuild = true` trong cấu hình ServiceProvider ở môi trường Development để phát hiện sớm các cấu hình lifetime không hợp lệ.

### 7.3. Kỹ thuật tổ chức đăng ký DI
- Tránh nhồi nhét hàng trăm dòng đăng ký vào `Program.cs`. Sử dụng các extension methods trên `IServiceCollection` được chia nhỏ theo tầng (ví dụ: `services.AddApplicationServices()`, `services.AddInfrastructureServices(configuration)`).
- Sử dụng Constructor Injection tường minh; không sử dụng Service Locator pattern (`serviceProvider.GetService<T>()` bên trong logic nghiệp vụ).

---

## 8. Triển khai Controller và Endpoint

### 8.1. Nguyên tắc Controller mỏng (Thin Controllers)
Controllers chỉ đóng vai trò là "người bảo vệ ranh giới HTTP":
- Tiếp nhận HTTP Request.
- Kích hoạt model validation (hoặc để tự động kích hoạt bởi `[ApiController]`).
- Lấy định danh người dùng và ngữ cảnh chi nhánh từ server-trusted authenticated context (ví dụ: claims hoặc server-side session/context service theo implementation của repository).
- Chuyển giao công việc thực thi cho tầng Application / Service.
- Trả về mã HTTP status và Response DTO tương ứng theo quy định tại `08-api-contract.md`.
- **Tuyệt đối không viết logic nghiệp vụ phức tạp hoặc câu lệnh truy vấn SQL trực tiếp trong Controller**.

### 8.2. Baseline Implementation cho HTTP Verbs và Status Codes
Lưu ý quan trọng: Các ánh xạ dưới đây là **baseline implementation guidance** phổ biến của ASP.NET Core, không phải API contract độc lập. Mọi quyết định về URI, DTO schema và HTTP status code bắt buộc phải tuân theo hợp đồng API do **Rule 08 (08-api-contract.md)** quy định hoặc existing repository convention. Nếu có sự khác biệt, thứ bậc ưu tiên là: `Rules → Task → Existing Convention`.

- `GET`: Truy vấn an toàn, không có tác dụng phụ, trả về `200 OK` (hoặc `404 Not Found`).
- `POST`: Tạo mới tài nguyên, trả về `201 Created` kèm header `Location` (hoặc `200 OK` cho non-resource action).
- `PUT`: Cập nhật toàn bộ tài nguyên một cách idempotent, trả về `200 OK` hoặc `204 No Content`.
- `PATCH`: Cập nhật một phần tài nguyên, trả về `200 OK` hoặc `204 No Content`.
- `DELETE`: Xóa hoặc vô hiệu hóa mềm, trả về `204 No Content` hoặc `200 OK`.

---

## 9. Ranh giới DTO và Domain/Data Model

### 9.1. Phân định rõ ràng DTOs và Database Entities
- **Không bao giờ trả về trực tiếp Database Entity ra ngoài API**: Luôn luôn ánh xạ (map) từ Entity/Domain Model sang Response DTO trước khi trả về cho client.
- **Không bao giờ dùng Database Entity làm tham số đầu vào của API**: Luôn nhận Request DTO.

### 9.2. Chống lỗi Mass Assignment
- Request DTO chỉ được chứa các trường mà client được phép nhập hoặc chỉnh sửa.
- Không đưa các trường nhạy cảm (`Role`, `BranchId`, `IsAdmin`, `CreatedDate`, `PasswordHash`) vào Request DTO để ngăn chặn người dùng chỉnh sửa trái phép qua payload.

### 9.3. Kỹ thuật Ánh xạ (Mapping)
- Tuân thủ kỹ thuật mapping hiện có trong codebase:
  - Nếu project dùng mapping tường minh (Explicit extension methods: `entity.ToResponseDto()`), hãy viết extension method.
  - Nếu project có sẵn AutoMapper hoặc Mapster, sử dụng profile mapping của thư viện đó.
  - Không tự tiện cài đặt thêm thư viện mapping mới nếu chưa có sự thống nhất.

---

## 10. Triển khai Tầng Application và Nghiệp vụ (Service Layer)

### 10.1. Đóng gói Use Cases
- Mỗi phương thức trong Service đại diện cho một use case hoặc thao tác nghiệp vụ rõ ràng (ví dụ: `CreateSaleInvoiceAsync`, `ReceiveStockAsync`, `CancelOrderAsync`).
- Kiểm tra điều kiện chuyển trạng thái theo state-transition requirements của Rule 02 và đặc tả nghiệp vụ (domain specification); kiểm tra quyền thực hiện thao tác tương ứng theo Rule 05. Skill 03 chỉ triển khai các kiểm tra đó trong mã nguồn Service/Application, không sở hữu chính sách chuyển trạng thái hay phân quyền.

### 10.2. Tính độc lập của Logic nghiệp vụ
- Không truyền `HttpContext`, `HttpRequest`, `HttpResponse` hay các đối tượng thuộc namespace `Microsoft.AspNetCore.Http` vào tầng Service/Domain.
- Thay vào đó, trích xuất dữ liệu ngữ cảnh cần thiết (UserId, BranchId, UserRole) từ server-trusted context tại Controller hoặc middleware và truyền vào Service dưới dạng tham số hoặc context object độc lập theo convention của project.

---

## 11. Xử lý Bất đồng bộ (Async/Await) và Hủy tác vụ (CancellationToken)

### 11.1. Nguyên tắc Async và phòng tránh tắc nghẽn luồng
- **Async all the way down**: Áp dụng khi luồng thực thi thực sự là asynchronous I/O (truy vấn database bất đồng bộ, I/O mạng, đọc/ghi stream).
- **Cho phép triển khai đồng bộ (Synchronous)**: Khi API/thư viện/repository thực tế chỉ cung cấp synchronous operation và việc bọc sang async không đem lại giá trị thực tế; tuyệt đối không giả tạo async bằng `Task.Run` cho các thao tác I/O.
- **Ngăn chặn triệt để blocking trong request-path async code**: Tuyệt đối không sử dụng `.Result`, `.Wait()`, `.GetAwaiter().GetResult()` đối với các tác vụ bất đồng bộ trên luồng xử lý HTTP request để phòng tránh cạn kiệt thread pool (Thread Pool Starvation) và deadlock trong ASP.NET Core.

### 11.2. Lan truyền `CancellationToken`
- **Lan truyền khi downstream hỗ trợ**: Tiếp nhận và truyền `CancellationToken` xuyên suốt từ Controller -> Service -> Repository/Database Command khi các API/framework downstream thực sự hỗ trợ cancellation (như DB queries, HTTP calls, stream reads).
- Khi client hủy kết nối (ngắt request), hệ thống có thể lập tức hủy truy vấn database và tác vụ nền, giúp giải phóng tài nguyên.
- **Không giả lập token**: Không tạo `CancellationToken` giả chỉ để đáp ứng checklist khi tầng bên dưới không hỗ trợ hủy tác vụ.

---

## 12. Xử lý lỗi và Tích hợp Validation

### 12.1. Xử lý ngoại lệ tập trung (Centralized Exception Handling)
- Sử dụng Custom Middleware hoặc `IExceptionHandler` (.NET 8) làm chốt chặn xử lý ngoại lệ toàn cục.
- Phản hồi lỗi phải tuân thủ chuẩn RFC 7807 Problem Details theo quy định của `08-api-contract.md`:
  - Mã lỗi HTTP phù hợp (`400`, `401`, `403`, `404`, `409`, `422`, `500`).
  - Gắn kèm `TraceId` hoặc `CorrelationId` để phục vụ tra cứu log.
  - **Môi trường Production tuyệt đối không lộ Stack Trace, câu lệnh SQL, connection string hoặc đường dẫn tệp tin nội bộ** (tuân thủ `03-security.md`).

### 12.2. Kiểm tra tính hợp lệ dữ liệu (Validation)
- Xác thực dữ liệu đầu vào tại ranh giới API. Khi dữ liệu vi phạm định dạng hoặc ràng buộc đầu vào, trả về phản hồi lỗi validation theo đúng quy cách và mã trạng thái (thông thường là Problem Details) do Rule 08 và existing API contract quy định.
- Trong các service nội bộ, kiểm tra phòng thủ các điều kiện tiên quyết (pre-conditions) và ném domain/application exceptions phù hợp để middleware bắt và chuyển đổi.

---

## 13. Truy cập Dữ liệu, Giao dịch và Đồng thời (Data Access, Transactions & Concurrency)

Target công nghệ của PharmaBranch là Microsoft SQL Server. Tuy nhiên, Agent cần phân biệt rõ giữa technology baseline và evidence thực tế:
- Nếu repository thực tế có evidence sử dụng SQL Server, áp dụng các hướng dẫn đặc thù cho SQL Server (như parameterized queries, `SESSION_CONTEXT`, T-SQL constraints).
- Không giả định ORM cụ thể (EF Core, Dapper hay ADO.NET thuần) nếu chưa có bằng chứng vật lý trong dependencies.
- Không giả định RLS hoặc `SESSION_CONTEXT` đã được triển khai sẵn trong database chỉ vì Rule 06 yêu cầu; nếu chưa có evidence vật lý thì ghi nhận trạng thái là `NOT VERIFIED` theo Skill 01.

### 13.1. Ràng buộc Cô lập dữ liệu Chi nhánh (Thực thi theo Rule 06)
- Tầng Data Access phải thực thi giới hạn dữ liệu theo branch context do Rule 06 quy định; mọi quyết định về policy và tenant boundary thuộc Rule 06.
- **Server-trusted Branch Context**: Branch context phải là server-trusted; tuyệt đối không tin tưởng `branchId` do client tự gửi trong body, query string hay header. Cách trích xuất và xác lập `BranchId` tuân theo authentication/authorization implementation thực tế của repository (từ JWT claims, hoặc từ server-side session/context service).
- Nếu database áp dụng SQL Server RLS dựa trên `SESSION_CONTEXT`, tầng persistence phải thiết lập `SESSION_CONTEXT(N'BranchId', @branchId)` đúng theo quy định của Rule 06 trước khi thực thi truy vấn.

### 13.2. Chống SQL Injection và Độ chính xác Dữ liệu (Thực thi theo Rule 07, Rule 03)
- **Luôn luôn sử dụng Parameterized Queries**: Tuyệt đối không nối chuỗi (concatenation) đầu vào của người dùng vào câu lệnh SQL để loại trừ 100% rủi ro SQL Injection.
- **Độ chính xác dữ liệu tiền tệ và số lượng**:
  - Tiền tệ và đơn giá tài chính bắt buộc dùng kiểu số chính xác (`decimal` trong C#, tương ứng `DECIMAL(p, s)` trong SQL Server); tuyệt đối không dùng `float` hoặc `double` cho monetary values hoặc các phép tính tài chính cần độ chính xác thập phân.
  - Số lượng (Quantity) phải sử dụng kiểu dữ liệu phù hợp với domain và database schema: nếu domain cho phép phần thập phân (ví dụ: đơn vị liều lượng, thể tích) thì dùng `decimal`; nếu domain định nghĩa số lượng là số nguyên (ví dụ: hộp, vỉ, viên nguyên) thì sử dụng kiểu integer phù hợp (`int`, `long`). Không áp đặt `decimal` cho mọi trường hợp số lượng nếu schema/domain không yêu cầu.

### 13.3. Quản lý Giao dịch (Transaction Boundaries — Thực thi theo Rule 02)
- Các thao tác nghiệp vụ có nhiều thay đổi dữ liệu phụ thuộc lẫn nhau và đòi hỏi tính nguyên tử và nhất quán (atomicity & consistency) bắt buộc phải được bọc trong một Database Transaction boundary theo yêu cầu của Rule 02 (ví dụ điển hình: Tạo hóa đơn + trừ tồn kho theo lô + ghi nhận giao dịch kho + cập nhật trạng thái thanh toán). Không tự động mở transaction chỉ đơn thuần vì thao tác tác động tới nhiều bảng nếu nghiệp vụ không yêu cầu tính nguyên tử.
- Nếu có bất kỳ bước nào trong thao tác nguyên tử thất bại, toàn bộ giao dịch phải được rollback đầy đủ để bảo toàn các bất biến nghiệp vụ, không để lại trạng thái dữ liệu dở dang.
- Giữ transaction đủ ngắn và giới hạn trong các thao tác database cần thiết; không đặt các lệnh gọi external API hoặc tác vụ I/O chậm chạp không cần thiết bên trong transaction.

### 13.4. Kiểm soát Đồng thời (Concurrency Control — Thực thi theo Rule 02)
- Xử lý các kịch bản tranh chấp dữ liệu nhạy cảm (bán thuốc đồng thời, trừ kho đồng thời, trả hàng đồng thời).
- Áp dụng các giải pháp phù hợp với cơ sở dữ liệu và framework: transaction locking trong SQL Server, optimistic concurrency (dùng rowversion / concurrency token), hoặc atomic update statements (`UPDATE TON_KHO SET SoLuong = SoLuong - @Qty WHERE Id = @Id AND SoLuong >= @Qty`).

---

## 14. Cấu hình và Quản lý Bí mật (Configuration & Secrets)

### 14.1. Options Pattern
- Đóng gói các nhóm cấu hình liên quan trong `appsettings.json` thành các C# classes strongly-typed.
- Đăng ký bằng `builder.Services.Configure<MyOptions>(builder.Configuration.GetSection("MySection"))`.
- Inject thông qua `IOptions<MyOptions>` (dành cho singleton/cấu hình tĩnh) hoặc `IOptionsSnapshot<MyOptions>` (dành cho cấu hình cần cập nhật theo request).

### 14.2. Bảo vệ Bí mật và Thông tin Nhạy cảm (`03-security.md`)
- **Tuyệt đối không hard-code**: Mật khẩu database, JWT secret key, API keys của bên thứ ba, private keys trong mã nguồn C# hoặc commit vào source control.
- Sử dụng Environment Variables hoặc .NET Secret Manager (`dotnet user-secrets`) trong quá trình phát triển cục bộ.

---

## 15. Kiểm thử Backend .NET (Testing & Verification)

### 15.1. Unit Testing
- Kiểm thử các đơn vị logic nghiệp vụ trong Service layer một cách độc lập.
- Tách biệt các dependency bên ngoài (repositories, gateway, clock) để đảm bảo test chạy nhanh, độc lập và mang tính đơn định (deterministic).
- Không bắt buộc phải sử dụng Moq, NSubstitute, FakeItEasy hay bất kỳ mocking framework cụ thể nào nếu repository chưa sử dụng; tôn trọng existing test conventions của codebase.

### 15.2. Integration Testing
- Sử dụng `Microsoft.AspNetCore.Mvc.Testing` (`WebApplicationFactory<Program>`) là kỹ thuật phổ biến và được khuyến nghị cho ASP.NET Core integration testing, nhưng không phải là kiến trúc kiểm thử duy nhất.
- Không tự ý tạo thêm test project hoặc test framework mới nếu task không yêu cầu và chưa có quyết định kỹ thuật phù hợp.
- Kiểm thử tích hợp nên bao gồm:
  - Positive tests: Gửi request hợp lệ -> Nhận mã 200/201 và dữ liệu chính xác theo hợp đồng API.
  - Validation tests: Gửi payload không hợp lệ -> Nhận expected validation response/status theo Rule 08 và existing API contract.
  - Authentication / Authorization tests: Gửi request thiếu token hoặc sai quyền/khác chi nhánh -> Nhận expected response theo Rule 03, Rule 05, Rule 06 và Rule 08.

---

## 16. Bảng kiểm tra chất lượng Backend (Backend Quality Checklist)

Trước khi hoàn thành bất kỳ task triển khai hoặc sửa đổi backend nào, Agent bắt buộc phải tự đối chiếu mã nguồn với danh sách kiểm tra sau để xác nhận mã nguồn triển khai đúng cách và không vi phạm các yêu cầu kỹ thuật (lưu ý: Skill 03 kiểm tra mức độ tuân thủ của code backend, không thay thế vai trò thẩm định chuyên sâu của các Rule/Skill sở hữu chính sách tương ứng):

- [ ] **1. Không vi phạm Rules 00–09**: Triển khai mã nguồn tuân thủ các chính sách và bất biến an ninh, cô lập chi nhánh, toàn vẹn dữ liệu và hợp đồng API.
- [ ] **2. Tuân thủ Existing Convention**: Phù hợp hoàn toàn với cấu trúc project, phong cách DI, naming và patterns hiện có của codebase.
- [ ] **3. Thin Controllers**: Controller chỉ tiếp nhận HTTP, điều phối và trả về response; không chứa nghiệp vụ phức tạp.
- [ ] **4. DTO Boundaries**: Không để lộ Database Entity ra ngoài API; Request DTO không chứa các trường mass assignment.
- [ ] **5. Async / Await chuẩn tắc**: Sử dụng `async/await` khi xử lý I/O bất đồng bộ; không chặn luồng bằng `.Result` hay `.Wait()`; không giả tạo async bằng `Task.Run` cho I/O.
- [ ] **6. Lan truyền CancellationToken**: Tiếp nhận và truyền `CancellationToken` xuyên suốt khi API và framework downstream hỗ trợ hủy tác vụ.
- [ ] **7. Quản lý DI an toàn**: Đăng ký đúng Service Lifetime; không để Scoped dependency bị captive bởi Singleton.
- [ ] **8. Không nuốt Exception**: Không có khối catch rỗng; xử lý lỗi tập trung và trả về cấu trúc lỗi theo hợp đồng API của Rule 08.
- [ ] **9. Không rò rỉ thông tin nhạy cảm**: Mã lỗi và log không chứa mật khẩu, connection string, SQL query hay stack trace trong production.
- [ ] **10. Parameterized Queries**: Triển khai truy vấn an toàn bằng tham số; không nối chuỗi SQL.
- [ ] **11. Dữ liệu tiền tệ và số lượng chính xác**: Sử dụng kiểu `decimal` cho số tiền, đơn giá; đối với số lượng hàng hóa, sử dụng kiểu dữ liệu phù hợp với domain và database schema (decimal hoặc integer). Tuyệt đối không dùng float/double cho dữ liệu tài chính.
- [ ] **12. Transaction Boundaries**: Triển khai transaction boundary cho các thao tác nghiệp vụ đòi hỏi tính nguyên tử (atomicity) theo yêu cầu của Rule 02; bảo đảm rollback khi lỗi.
- [ ] **13. Ràng buộc Chi nhánh**: Triển khai truy vấn và mutation có ràng buộc theo BranchId hợp lệ từ server-trusted context theo Rule 06.
- [ ] **14. Không hard-code Secrets**: Chuỗi kết nối và khóa bí mật được đọc an toàn từ Options/Configuration.
- [ ] **15. Duy trì khả năng kiểm thử**: Code mới viết có cấu trúc rõ ràng, hỗ trợ viết unit test và integration test theo hợp đồng API và existing test conventions mà không ép framework test mới.

---

## 17. Tuân thủ Quản trị Dự án (Governance Compliance)

Skill 03 vận hành dưới sự chi phối trực tiếp của hệ thống Rules `00–09` của PharmaBranch.

### 17.1. Bảng đối chiếu ranh giới với Rules
| Rule | Trách nhiệm của Rule (Policy & Invariants) | Mối quan hệ triển khai của Skill 03 (How to Implement) |
|---|---|---|
| `00-project-governance.md` | Rule 00 sở hữu quản trị dự án, kiểm soát thay đổi | Skill 03 chỉ thực hiện thay đổi tối thiểu, có bằng chứng, bảo toàn conventions |
| `01-architecture.md` | Rule 01 sở hữu kiến trúc hệ thống Client-Server / phân tầng | Skill 03 triển khai mã nguồn backend phù hợp với cấu trúc do Rule 01 hoặc repository xác lập |
| `02-architecture-quality.md` | Rule 02 sở hữu chính sách transaction boundaries, concurrency và state transitions | Skill 03 triển khai atomic transactions, concurrency controls và kiểm tra chuyển trạng thái trong C# code theo yêu cầu của Rule 02 |
| `03-security.md` | Rule 03 sở hữu chính sách an ninh hệ thống, mã hóa, bảo mật JWT | Skill 03 triển khai backend không làm lộ bí mật/thông tin nhạy cảm và tích hợp an ninh theo Rule 03 |
| `04-rbac.md` | Rule 04 sở hữu mô hình phân quyền RBAC và vai trò nghiệp vụ | Skill 03 triển khai cơ chế kiểm tra quyền hạn backend phù hợp với mô hình của Rule 04 |
| `05-authorization.md` | Rule 05 sở hữu chính sách runtime authorization và chống IDOR | Skill 03 triển khai authorization middleware/attributes và kiểm tra quyền thực thi thao tác theo Rule 05 |
| `06-branch-isolation.md` | Rule 06 sở hữu ranh giới cô lập dữ liệu chi nhánh và RLS policy | Skill 03 triển khai server-trusted branch context và ràng buộc truy cập dữ liệu theo Rule 06 |
| `07-database-integrity.md` | Rule 07 sở hữu chính sách toàn vẹn cơ sở dữ liệu và ràng buộc quan hệ | Skill 03 triển khai parameterized SQL, kiểu số phù hợp và tôn trọng DB constraints theo Rule 07 |
| `08-api-contract.md` | Rule 08 sở hữu hợp đồng API, URI, DTO schemas, HTTP status codes và Problem Details | Skill 03 triển khai HTTP/API endpoints và serialization theo đúng contract do Rule 08 quy định |
| `09-observability-operations.md` | Rule 09 sở hữu chính sách observability, logging và tracing | Skill 03 tích hợp ILogger, correlation ID và telemetry theo conventions và policy do Rule 09 quy định |

### 17.2. Xử lý xung đột
- Nếu phát hiện bất kỳ hướng dẫn nào trong Skill 03 mâu thuẫn với Rules `00–09`:
  1. **Tuyệt đối KHÔNG sửa Rules**.
  2. **Rules luôn luôn thắng (Rules > Skills)**.
  3. Báo cáo xung đột và điều chỉnh Skill 03 để tuân thủ triệt để quy định của Rules.
