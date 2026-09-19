---
name: security-review
description: >
  Defines the comprehensive security review methodology, threat surface analysis,
  authentication/authorization audit, branch data isolation, vulnerability assessment,
  cryptography, auditability, and finding classification for the PharmaBranch system
  across Client, API, Backend, Database, and Operational layers, adhering strictly to
  Rules 00–09, Evidence-First principles, and Technology Neutrality.
---

# SKILL 10 — SECURITY REVIEW

## 1. Objective & Scope

### 1.1. Objective

Skill này chuẩn hóa phương pháp luận và quy trình **Đánh giá An ninh Chuyên sâu (Security Review Methodology)** cho toàn bộ hệ thống quản lý chuỗi nhà thuốc đa chi nhánh PharmaBranch.

Mục tiêu cốt lõi của Security Review là xác định xem các chốt chặn an ninh (security controls) trong hệ thống có:
1. **Hiện diện (Present):** Có tồn tại mã nguồn, cấu hình hoặc cơ chế bảo vệ thực tế trong repository hay không.
2. **Triển khai đúng đắn (Correctly Implemented):** Logic an ninh có đáp ứng đúng đặc tả kỹ thuật và tiêu chuẩn nghiệp vụ hay không.
3. **Kết nối hoàn chỉnh (Correctly Wired):** Chốt chặn an ninh có được tích hợp vào middleware pipeline, filter, interceptor, DI container hoặc database session context hay không.
4. **Thực thi đúng ranh giới (Enforced at the Correct Boundary):** An ninh có được thẩm định dứt khoát tại ranh giới tin cậy (trusted server boundary / database layer) hay bị phó mặc cho phía Client (untrusted).
5. **Kháng vòng qua (Resistant to Bypass):** Chốt chặn an ninh có bị vô hiệu hóa khi người dùng sửa đổi URL, query parameter, request body, headers, hoặc gọi trực tiếp HTTP request hay không.
6. **Nhất quán liên tầng (Consistent Across Layers):** Ngữ cảnh an ninh có được truyền dẫn toàn vẹn qua các tầng kiến trúc: Client -> API -> Application -> Persistence -> Database hay không.
7. **Tuân thủ quy tắc quản trị (Consistent with Governing Rules):** Các cơ chế có thỏa mãn các quy định của Rules 00–09 hay không.
8. **Được hỗ trợ bởi bằng chứng đầy đủ (Supported by Adequate Evidence):** Mọi đánh giá và kết luận đều phải có bằng chứng tương ứng, được đánh giá khách quan theo ngữ cảnh và phạm vi.

> [!IMPORTANT]
> **Ranh giới trách nhiệm (Reviewer vs. Policy Owner):**
> Skill 10 đóng vai trò là một **NĂNG LỰC ĐÁNH GIÁ (REVIEWER)**, không phải là cơ quan ban hành hoặc sở hữu toàn bộ chính sách an ninh. Mọi chính sách an ninh nền tảng bắt nguồn từ `Rule 03` (Security), `Rule 04` (RBAC), `Rule 05` (Authorization), `Rule 06` (Branch Isolation), `Rule 07` (Database Integrity) và `Rule 09` (Observability/Operations). Skill 10 chỉ thẩm tra, rà soát và đánh giá việc tuân thủ các quy tắc này.

### 1.2. Mô hình phân loại bằng chứng & Phân định trạng thái an ninh

Để bảo đảm tính khách quan tuyệt đối theo nguyên tắc **Evidence > Assumption**, Security Review phân biệt rõ các loại bằng chứng và các khía cạnh kiểm chứng an ninh:

#### A. Bảy loại bằng chứng an ninh (Seven Evidence Types)
1. **Requirement Evidence (Bằng chứng yêu cầu):** Yêu cầu an ninh được quy định trong Rules 00–09, hồ sơ đặc tả nghiệp vụ hoặc yêu cầu tác vụ rõ ràng.
2. **Design / Architecture Evidence (Bằng chứng thiết kế / kiến trúc):** Hồ sơ kiến trúc đã được phê duyệt, Architecture Decision Records (ADRs), sơ đồ dữ liệu ERD, đặc tả luồng an ninh.
3. **Implementation Evidence (Bằng chứng triển khai vật lý):** Mã nguồn thực tế (`.cs`, `.tsx`, `.dart`, `.sql`), file cấu hình, scripts migration hiện diện trong repository.
4. **Runtime Evidence (Bằng chứng runtime):** Nhật ký thực thi (logs), phản hồi HTTP, telemetry, traces được thu thập khi ứng dụng đang chạy.
5. **Test Evidence (Bằng chứng kiểm thử):** Kết quả thực thi bộ kiểm thử tự động (Unit, Integration, Security Tests) kèm báo cáo pass/fail cụ thể trong phạm vi test.
6. **Configuration Evidence (Bằng chứng cấu hình):** File cấu hình môi trường (`appsettings.json`, `.env`), cờ bảo mật, cấu hình web server/container.
7. **Documentation Evidence (Bằng chứng tài liệu):** Hướng dẫn cài đặt, tài liệu API tĩnh (Swagger UI, README).

> [!NOTE]
> **Nguyên tắc thẩm định bằng chứng:**
> - Bằng chứng yêu cầu có thể chứng minh requirement; bằng chứng thiết kế có thể chứng minh intended design; bằng chứng triển khai có thể chứng minh implementation; bằng chứng runtime có thể chứng minh hành vi thực tế; bằng chứng test có thể chứng minh kết quả trong phạm vi test; bằng chứng cấu hình có thể chứng minh thiết lập môi trường.
> - Bằng chứng thiết kế và tài liệu (`Design / Documentation Evidence`) có giá trị chứng minh *yêu cầu* hoặc *thiết kế dự kiến*, nhưng **không tự nó chứng minh được việc triển khai thực tế** (*"Design/documentation evidence can prove a requirement or intended design, but does not by itself prove implementation"*).
> - Không được biến nguyên tắc *"bằng chứng triển khai/runtime có sức nặng thực tế cao"* thành quan niệm cực đoan rằng *"chỉ có mã nguồn hoặc runtime mới là bằng chứng hợp lệ duy nhất"*. Mỗi nguồn bằng chứng đều có giá trị trong phạm vi thẩm quyền của nó.
> - Mọi bằng chứng phải được đánh giá qua 7 chiều kích: **Tính thích đáng (Relevance)**, **Khả năng áp dụng (Applicability)**, **Tính trực tiếp (Directness)**, **Độ tươi mới (Freshness)**, **Tính nhất quán (Consistency)**, **Khả năng tái lập (Reproducibility)**, và **Độ bao phủ phạm vi (Scope Coverage)**.

#### B. Sáu khía cạnh kiểm chứng an ninh
- **Implementation Existence (Sự hiện diện của mã nguồn):** File, class, method hoặc schema có tồn tại trong repository hay không.
- **Security Control Existence (Sự tồn tại của chốt chặn bảo mật):** Chốt chặn an ninh (ví dụ: hàm kiểm tra quyền, predicate RLS, filter xác thực) có được viết hay không.
- **Security Control Correctness (Tính đúng đắn của chốt chặn):** Thuật toán, logic phân quyền, phép so sánh hoặc câu lệnh có chính xác về mặt nghiệp vụ hay không.
- **Security Control Coverage (Độ bao phủ của chốt chặn):** Tất cả các endpoint, hành động và tài nguyên nhạy cảm có được bảo vệ hay chỉ có một vài endpoint đơn lẻ được bảo vệ.
- **Security Control Enforcement (Tính thực thi của chốt chặn):** Chốt chặn có thực sự kích hoạt và từ chối hành vi vi phạm tại runtime hay chỉ là mã nguồn thụ động không được gọi.
- **Security Control Verification (Sự xác minh chốt chặn bằng bằng chứng):** Đã có bằng chứng thực nghiệm (test pass, log xác thực, phản hồi từ chối) chứng minh chốt chặn hoạt động hay chưa.

```text
Implementation Exists ≠ Security Control Exists ≠ Control Correct ≠ Control Covered ≠ Control Enforced ≠ Control Verified
```

Đặc biệt, trong việc đánh giá bằng chứng và trạng thái an ninh, Agent bắt buộc phải phân biệt rạch ròi:
- `NOT FOUND ≠ NOT IMPLEMENTED` (Không tìm thấy bằng chứng không đồng nghĩa với chưa được triển khai; có thể do phạm vi tìm kiếm hạn chế hoặc cần kiểm chứng thêm).
- `NOT VERIFIED ≠ FAIL` (Chưa được xác minh không đồng nghĩa với thất bại hay có lỗ hổng; thiếu bằng chứng là một Verification Gap, không tự động suy diễn thành FAIL).
- `PROPOSED ≠ IMPLEMENTED` (Giải pháp được đề xuất trong tài liệu thiết kế hoặc kế hoạch không đồng nghĩa với việc đã có mã nguồn vật lý trong repository).
- `IMPLEMENTED ≠ VERIFIED` (Mã nguồn đã được viết không đồng nghĩa với việc chốt chặn an ninh đã được kích hoạt, thực thi đúng ranh giới và xác minh bằng chứng).

### 1.3. Scope

Phạm vi đánh giá an ninh của Skill 10 bao trùm toàn diện các bề mặt và thành phần của hệ thống:
- **Client Layer:** Ứng dụng Web (ReactJS nếu áp dụng), Mobile (Flutter nếu áp dụng), bao gồm quản lý local state, token storage, input handling và ranh giới hiển thị.
- **API Boundary:** Các endpoint HTTP/REST, Request/Response DTOs, routing, headers, status codes, API versioning và rate limiting theo Rule 08.
- **Authentication:** Xác thực danh tính, quy trình đăng nhập/đăng xuất, vòng đời tài khoản và xử lý lỗi xác thực theo Rule 03.
- **Authorization & RBAC:** Phân quyền theo vai trò nghiệp vụ (Rule 04), kiểm soát truy cập runtime (Rule 05), phòng chống IDOR/BOLA và leo thang đặc quyền.
- **Branch / Tenant Isolation:** Ranh giới cô lập dữ liệu chi nhánh (`CHI_NHANH`), trích xuất ngữ cảnh chi nhánh và phòng chống rò rỉ dữ liệu chéo chi nhánh (Rule 06).
- **Backend Application Layer:** Dịch vụ nghiệp vụ, domain invariants, workflow chuyển trạng thái và tính toán giá trị nhạy cảm.
- **Database & Data Persistence:** Cơ sở dữ liệu (Microsoft SQL Server nếu áp dụng), parameterized queries, RLS policies (nếu kiến trúc áp dụng), session context, schema permissions và toàn vẹn giao dịch (Rule 02, 07, Skill 07).
- **Transaction & Concurrency Security:** Phòng chống race condition, lost update, double-spending, check-then-act vulnerabilities trong các thao tác bán hàng, nhập kho, tồn kho và thanh toán khi nghiệp vụ yêu cầu tính nhất quán.
- **Data Protection & Privacy:** Bảo vệ thông tin định danh cá nhân (PII), hồ sơ bệnh nhân/đơn thuốc, thông tin tài chính, lương nhân viên và Column-Level Security (CLS) theo Rule 03.
- **File & Export Handling:** Tải tệp lên/xuống, xuất file Excel/CSV/PDF, kiểm soát định dạng, path traversal và rò rỉ dữ liệu qua xuất báo cáo.
- **Audit Logging & Security Telemetry:** Nhật ký kiểm toán nghiệp vụ (`NHAT_KY_KIEM_TOAN`), nhật ký vận hành, theo vết tương quan (`X-Correlation-ID`) và chống can thiệp log (Rule 03/09).
- **Cryptography & Digital Signature:** Băm mật khẩu, mã hóa dữ liệu lưu trữ/truyền tải, chữ ký số hóa đơn điện tử và bảo vệ khóa bí mật theo Rule 02/03.
- **Security Configuration & Supply-Chain:** Cấu hình môi trường, CORS, cookie, headers an ninh, quản lý bí mật và rà soát lỗ hổng phụ thuộc bên thứ ba.
- **Security Testing:** Kiểm thử an ninh đơn vị, tích hợp, kịch bản tiêu cực (negative test cases) và kiểm tra độ bao phủ kiểm thử.

---

## 2. Priority Hierarchy & Technology Neutrality

### 2.1. Thứ bậc ưu tiên thẩm quyền (Priority Hierarchy)

Khi tiến hành đánh giá an ninh hoặc giải quyết mâu thuẫn giữa các nguồn thông tin, Agent bắt buộc phải tuân thủ nghiêm ngặt thứ bậc thẩm quyền:

1. **Rules 00–09 (Governing Rules — Thẩm quyền tối cao):**
   - `Rule 00`: Quản trị dự án, phạm vi kiểm soát, nguyên tắc bằng chứng.
   - `Rule 01`: Kiến trúc hệ thống Client-Server, hướng phụ thuộc.
   - `Rule 02`: Ranh giới giao dịch, kiểm soát đồng thời, an toàn chữ ký số.
   - `Rule 03`: An ninh thông tin, chuẩn mật khẩu, bảo mật API, an toàn credentials.
   - `Rule 04`: Mô hình RBAC (Role, Permission, Resource, Action, Scope).
   - `Rule 05`: Kiểm soát truy cập runtime, chống IDOR/BOLA, leo thang đặc quyền.
   - `Rule 06`: Ranh giới cô lập dữ liệu chi nhánh (`CHI_NHANH`), RLS, session context.
   - `Rule 07`: Toàn vẹn CSDL SQL Server, khóa ngoại, ràng buộc CHECK/UNIQUE.
   - `Rule 08`: Hợp đồng API, DTO, mã trạng thái, chuẩn hóa lỗi.
   - `Rule 09`: Giám sát vận hành, cấu trúc log, health checks, an toàn sao lưu.
2. **Explicit Task Requirements:** Yêu cầu cụ thể, có phạm vi rõ ràng do người dùng giao cho tác vụ hiện tại.
3. **Approved Architecture / ADRs / Security Requirements:** Hồ sơ kiến trúc đã được phê duyệt, Architecture Decision Records (ADRs).
4. **Existing Repository Conventions:** Quy ước thiết kế và triển khai an ninh đã định hình trong repository.
5. **Physical Implementation Evidence:** Bằng chứng hiện diện vật lý trong mã nguồn (`.cs`, `.tsx`, `.dart`, `.sql`).
6. **Automated Test Evidence:** Bằng chứng kiểm thử tự động (Unit, Integration, Security Negative Tests).
7. **Runtime / Security Telemetry Evidence:** Bằng chứng chạy thực tế, logs, HTTP responses, traces.
8. **Existing Skills (Skills 01–09):** Tài liệu hướng dẫn quy trình và tiêu chuẩn kỹ thuật chuyên ngành.
9. **Official Technology Documentation:** Tài liệu chính thức từ nhà cung cấp công nghệ.
10. **Generic Security Best Practices:** Các khuyến nghị an ninh chung từ OWASP, CIS, NIST.
11. **Agent Preference / Assumptions (Thấp nhất — Không có giá trị pháp lý):** Ý kiến chủ quan của Agent.

### 2.2. Nguyên tắc trung lập công nghệ (Technology Neutrality)

Skill 10 tuân thủ triệt để nguyên tắc **Trung lập Công nghệ (Technology Neutrality)**:
- Agent **KHÔNG ĐƯỢC TỰ Ý ÁP ĐẶT** một công nghệ, thư viện, hoặc framework an ninh cụ thể nếu nó không bắt nguồn từ Rules 00–09, kiến trúc đã phê duyệt, hoặc bằng chứng vật lý trong repository.
- Skill 10 **ĐÁNH GIÁ (REVIEWS)** việc triển khai công nghệ thực tế; Skill 10 **KHÔNG LỰA CHỌN (DOES NOT CHOOSE)** công nghệ thay cho dự án.
- Công nghệ cụ thể chỉ được đề cập khi thỏa mãn một trong các điều kiện:
  1. Kiến trúc dự án đã xác nhận công nghệ đó.
  2. Bằng chứng repository chứng minh công nghệ đó đang được sử dụng thực tế.
  3. Yêu cầu tác vụ / yêu cầu an ninh chỉ định công nghệ đó.
  4. Được ghi chú rõ ràng là **ví dụ minh họa (illustrative example)** hoặc cơ chế tương đương (or equivalent mechanism).
- Các thuật ngữ công nghệ sau chỉ được xem là ví dụ minh họa hoặc áp dụng khi có hiện diện trong repository:
  - *Cơ chế xác thực:* JWT, OAuth2, OpenID Connect, Session Cookies, ASP.NET Core Identity (nếu có sử dụng).
  - *Thuật toán băm/mật mã:* BCrypt, Argon2, PBKDF2, AES-256, RSA-SHA256 (hoặc thuật toán quy định theo Rule 03).
  - *Thư viện phân quyền:* Custom Authorization Middleware, ASP.NET Policy/Requirement Handlers, FluentValidation (nếu có sử dụng).
  - *Cơ chế CSDL & Cache:* SQL Server RLS, SESSION_CONTEXT, Redis, In-Memory Cache (khi áp dụng theo kiến trúc).
  - *Nhật ký & Giám sát:* Serilog, NLog, Application Insights, OpenTelemetry (khi hiện diện).
  - *Quản lý bí mật:* Azure Key Vault, AWS Secrets Manager, HashiCorp Vault, DotNet User-Secrets (khi áp dụng).
- Nếu một tính năng an ninh được triển khai bằng một kỹ thuật hợp lệ khác (nhưng vẫn thỏa mãn yêu cầu của Rules 00–09), Agent tuyệt đối không được đánh FAIL chỉ vì dự án không sử dụng công nghệ mà Agent quen thuộc.

### 2.3. Phân định Yêu cầu, Chốt chặn, Khuyến nghị và Ví dụ minh họa (Security Control Classification)

Để tránh việc áp đặt các tiêu chuẩn chủ quan biến thành quy định cứng, Skill 10 phân biệt rạch ròi 4 cấp độ:

1. **Security Requirement (Yêu cầu an ninh bắt buộc):**
   - Bắt nguồn từ các quy tắc tối cao (`Rules 00–09`), tài liệu kiến trúc đã được duyệt, hoặc yêu cầu nghiệp vụ/tác vụ rõ ràng.
   - Bắt buộc phải có mặt và được thẩm tra thực thi (ví dụ: mật khẩu không được lưu plaintext theo Rule 03; phân quyền server-side theo Rule 05; cô lập chi nhánh theo Rule 06; toàn vẹn giao dịch theo Rule 02).
2. **Security Control (Chốt chặn bảo mật):**
   - Là cơ chế kỹ thuật cụ thể được triển khai trong hệ thống để đáp ứng Security Requirement (ví dụ: middleware xác thực, handler phân quyền, session context, tham số hóa truy vấn).
3. **Security Recommendation / Applicable Control (Khuyến nghị an ninh / Biện pháp áp dụng):**
   - Là các thực hành tốt nhất (best practices / defense-in-depth) nhằm tăng cường độ vững chắc cho hệ thống.
   - Các cơ chế như: cờ cookie (`HttpOnly`, `Secure`, `SameSite`), cấu hình bảo mật transport (`HSTS`), chính sách nội dung (`CSP`), kiểm tra byte đầu file (`magic bytes`), đặt tên file ngẫu nhiên (`random filename`), giới hạn tần suất (`rate limiting`), khóa phiên bản phụ thuộc (`lockfile`), mã hóa bản sao lưu (`backup encryption`), hoặc cơ chế bảo mật CSDL nâng cao (`SQL Server RLS`) **được xem xét như những khuyến nghị an ninh hoặc biện pháp áp dụng khi có cấu hình/yêu cầu liên quan, không tự động biến thành yêu cầu bắt buộc phổ quát nếu Rules 00–09 hoặc kiến trúc dự án không quy định**.
4. **Illustrative Example (Ví dụ minh họa):**
   - Là các ví dụ kỹ thuật cụ thể nhằm làm sáng tỏ khái niệm (ví dụ: thuật toán băm mật khẩu `BCrypt` / `Argon2` / `PBKDF2`, thuật toán ký token `HMAC-SHA256`, mã trạng thái HTTP `401` / `403` / `404`, chuỗi payload mẫu `' OR 1=1 --`).
   - Các ví dụ này không mang tính áp đặt bắt buộc hệ thống phải sử dụng duy nhất một giải pháp đó nếu có giải pháp tương đương hợp lệ thỏa mãn yêu cầu của Rules.

---

## 3. Security Review Ownership Model

Mô hình phân định sở hữu bảo đảm Skill 10 hoạt động chính xác với tư cách là cơ quan kiểm định chéo (Cross-Layer Auditor) mà không giẫm chân lên thẩm quyền của các Rule và Skill khác:

| Thẩm quyền | Chủ thể sở hữu (Owner) | Trách nhiệm cốt lõi | Ranh giới kiểm tra của Skill 10 |
|---|---|---|---|
| **Security Baseline** | `Rule 03` | Quy định chuẩn an ninh thông tin, chuẩn băm mật khẩu, an toàn credentials, taxonomy mức độ nghiêm trọng | Rà soát việc tuân thủ các chuẩn an ninh nền tảng của Rule 03 |
| **RBAC Model (WHO)** | `Rule 04` | Định nghĩa vai trò (Role), quyền hạn (Permission), ma trận phân quyền | Thẩm tra tính đầy đủ của ma trận quyền và nguyên tắc đặc quyền tối thiểu |
| **Runtime Access (HOW)** | `Rule 05` | Cơ chế thực thi kiểm soát truy cập runtime, chống IDOR, chặn leo thang đặc quyền | Kiểm tra điểm chặn runtime phía server, xác minh việc từ chối truy cập trái phép |
| **Branch Scope (WHICH DATA)** | `Rule 06` | Ranh giới cô lập dữ liệu theo chi nhánh (`CHI_NHANH`), RLS (nếu áp dụng), tenant context | Kiểm tra tính không thể xuyên thủng của đường dẫn cô lập chi nhánh trên mọi thao tác |
| **Database Integrity** | `Rule 07` | Ràng buộc schema, khóa chính, khóa ngoại, CHECK, UNIQUE, an toàn migration | Rà soát khía cạnh an ninh CSDL: quyền truy cập bảng, injection, lộ schema |
| **API Contract** | `Rule 08` | Đặc tả URI, DTO, mã trạng thái HTTP, định dạng lỗi Problem Details | Đánh giá an ninh API: mass assignment, lộ thông tin lỗi, rò rỉ dữ liệu nhạy cảm |
| **Observability** | `Rule 09` | Chuẩn hóa cấu trúc log, health check, alert priority (P1/P2/P3), sao lưu phục hồi | Thẩm định tính nguyên vẹn của audit log, vệ sinh log (không lộ bí mật) |
| **Backend Implementation** | `Skill 03` | Lập trình .NET 8, Web API, mẫu hình truy xuất dữ liệu, middleware pipeline | Rà soát lỗi bảo mật trong mã nguồn backend và cấu hình máy chủ |
| **Frontend Implementation** | `Skill 04` | Lập trình ReactJS, quản lý UI state, component rendering, HTTP client | Thẩm tra an toàn mã nguồn React, chống XSS, an toàn lưu trữ token |
| **Mobile Implementation** | `Skill 05` | Lập trình Flutter / Dart, mobile storage, offline caching, secure storage | Thẩm tra an toàn ứng dụng di động, lưu trữ an toàn trên thiết bị |
| **API Design** | `Skill 06` | Thiết kế giao diện lập trình, resource URI, DTO mapping, idempotency pattern | Đánh giá thiết kế an ninh của API theo tiêu chuẩn Rule 08 |
| **Database Architecture** | `Skill 07` | Thiết kế bảng SQL Server, index, query optimization, migration script | Rà soát cấu hình an ninh CSDL SQL Server, phân quyền người dùng ứng dụng |
| **Testing Practices** | `Skill 08` | Thiết kế test case, unit test, integration test, mock data | Đánh giá mức độ bao phủ của các ca kiểm thử bảo mật (negative test suites) |
| **Verification Loop** | `Skill 09` | Chu trình xác minh hoàn thành tính năng, bằng chứng đa tầng, phán quyết nghiệm thu | Cung cấp bằng chứng an ninh chuyên sâu để phục vụ phán quyết của Skill 09 |
| **Security Review** | **`Skill 10`** | **Rà soát an ninh toàn diện, mô hình hóa mối đe dọa, phát hiện lỗ hổng liên tầng** | **Thực thi quy trình: Khám phá -> Lần vết -> Đánh giá -> Phân loại phát hiện -> Khuyến nghị** |

> [!IMPORTANT]
> Skill 10 **KHÔNG**:
> - Triển khai mã nguồn an ninh backend (thuộc Skill 03).
> - Triển khai an ninh phía frontend (thuộc Skill 04) hoặc mobile (thuộc Skill 05).
> - Thiết kế kiến trúc cơ sở dữ liệu (thuộc Skill 07).
> - Định nghĩa quy ước hợp đồng API (thuộc Rule 08 / Skill 06).
> - Định nghĩa chính sách RBAC (thuộc Rule 04).
> - Định nghĩa chính sách cô lập chi nhánh (thuộc Rule 06).
> - Ban hành phán quyết nghiệm thu tính năng (thuộc Skill 09).
>
> Skill 10 chỉ **REVIEW VÀ BÁO CÁO (REVIEWS AND REPORTS)** theo chu trình: `Discover -> Trace -> Evaluate -> Identify Security Finding -> Recommend -> Re-verify`.

---

## 4. Security Discovery

Quá trình khám phá an ninh (Security Discovery) là giai đoạn thu thập bằng chứng khách quan, có cấu trúc để định hình toàn bộ bề mặt triển khai trước khi phân tích chuyên sâu.

### 4.1. Quy trình 14 bước Security Review lặp lại (Repeatable Workflow)

```text
[1. Scope Definition] --------> [2. Security Discovery] -------> [3. Map Attack Surface]
         |                                                                   |
         v                                                                   v
[6. Verify Enforcement] <------ [5. Trace Controls] <----------- [4. Identify Boundaries]
         |
         v
[7. Test Bypass Paths] -------> [8. Validate Consistency] -----> [9. Evaluate Evidence]
                                                                             |
                                                                             v
[12. Recommend Remediation] <-- [11. Assess Severity] <--------- [10. Classify Findings]
         |
         v
[13. Re-verify Changes] ------> [14. Produce Final Report]
```

1. **Scope Definition:** Xác định chính xác phạm vi rà soát (thành phần nào in-scope, out-of-scope).
2. **Security Discovery:** Quét và lập danh mục toàn bộ các thành phần an ninh hiện diện trong mã nguồn và cấu hình.
3. **Map Attack Surface:** Lập bản đồ các bề mặt tấn công từ phía ngoài vào trong.
4. **Identify Boundaries:** Định vị các ranh giới tin cậy (Trust Boundaries) giữa Client, API, Service, CSDL.
5. **Trace Controls:** Lần vết các cơ chế bảo vệ từ điểm tiếp nhận yêu cầu đến tầng dữ liệu.
6. **Verify Enforcement:** Xác minh cơ chế an ninh có thực sự kích hoạt và từ chối hành vi sai trái hay không.
7. **Test Bypass Paths:** Rà soát các kịch bản vòng qua chốt chặn (bỏ tham số, tráo ID, sửa header, injection).
8. **Validate Cross-Layer Consistency:** Kiểm tra sự nhất quán về danh tính, quyền hạn và chi nhánh giữa các tầng.
9. **Evaluate Evidence:** Đánh giá độ tin cậy và chất lượng của bằng chứng thu thập được theo 7 chiều kích.
10. **Classify Findings:** Gán trạng thái chuẩn hóa cho từng phát hiện (CONFIRMED, LIKELY, POTENTIAL...).
11. **Assess Severity:** Xác định mức độ nghiêm trọng áp dụng theo tiêu chuẩn Rule 03.
12. **Recommend Remediation:** Đưa ra khuyến nghị khắc phục gắn liền với nguyên nhân gốc rễ (Root Cause).
13. **Re-verify After Changes:** Tái thẩm tra khi có bản vá được áp dụng (nếu trong chu trình sửa lỗi).
14. **Produce Final Report:** Soạn thảo báo cáo đánh giá an ninh chuẩn mực, minh bạch và bảo mật thông tin.

### 4.2. Danh mục tài nguyên cần khám phá (Discovery Inventory)

Agent khảo sát và phân loại các tệp tin hiện hữu theo bảng mục tiêu:
- **Authentication & Identity:** Endpoint đăng nhập/đăng xuất, controller tài khoản, handler tạo/giải mã token, middleware xác thực.
- **Authorization & RBAC:** Middleware/Attribute kiểm tra quyền, enum Vai trò/Quyền hạn, bảng ánh xạ người dùng - vai trò, bảng vai trò - quyền.
- **Branch Context:** Logic trích xuất `ChiNhanhId`, middleware thiết lập tenant context, session context CSDL, logic truyền tham số chi nhánh.
- **Endpoints & Controllers:** Toàn bộ API controller/endpoints, định nghĩa route, DTO đầu vào, DTO đầu ra.
- **Data Access & SQL:** Cơ chế truy xuất dữ liệu thực tế (ví dụ: EF Core DbContext, Dapper, ADO.NET nếu có sử dụng), stored procedures, câu lệnh SQL động, migrations.
- **Database Security Objects:** RLS security policies (nếu kiến trúc áp dụng), security functions, views bảo mật, triggers kiểm toán, bảng phân quyền SQL.
- **Audit & Telemetry:** Service ghi log kiểm toán, middleware ghi log HTTP, cấu hình Serilog/NLog/Console (khi áp dụng).
- **File Handling & Export:** Endpoint upload ảnh/tệp, service đọc/ghi đĩa, hàm xuất file CSV/Excel/PDF.
- **Cryptography & Signatures:** Service băm mật khẩu, mã hóa dữ liệu, logic ký số hóa đơn, quản lý khóa.
- **Configuration & Environment:** `appsettings.json`, `appsettings.Production.json`, `.env`, Dockerfile, launchSettings.
- **Dependencies & Packages:** `.csproj` (NuGet), `package.json` (npm), `pubspec.yaml` (Flutter), lockfiles.
- **Security Tests:** Các thư mục test (`*.Tests`), file test xác thực, test phân quyền, test cô lập chi nhánh, test SQLi.

> [!WARNING]
> **Nguyên tắc khám phá:** Tuyệt đối không suy diễn sự tồn tại của chốt chặn an ninh chỉ từ tên thư mục hoặc tên tệp tin (ví dụ: có thư mục `Security/` không có nghĩa là an ninh đã được triển khai). Phải kiểm tra nội dung thực tế bên trong.

---

## 5. Threat Surface Identification

### 5.1. Chuỗi truy vết an ninh khái niệm (Conceptual Security Trace Chain)

Để phân tích bề mặt tấn công một cách khoa học, Agent sử dụng chuỗi truy vết khái niệm tham chiếu dưới đây làm la bàn khảo sát (đây là **chuỗi truy vết logic tham chiếu cho dự án**, không phải cấu trúc phần mềm áp đặt):

```text
Untrusted Client (Web / Mobile / External Client)
      |
      v
[Boundary 1: Transport & Network]   ---> TLS, HTTPS, CORS, Security Headers
      |
      v
[Boundary 2: Authentication]        ---> Token/Credential Extraction, Signature Verification, Identity Claim
      |
      v
[Boundary 3: RBAC & Capability]     ---> Role Check, Permission Check, Least Privilege (Rule 04)
      |
      v
[Boundary 4: Runtime Authorization] ---> Endpoint Guard, Operation Permission, Action Scope (Rule 05)
      |
      v
[Boundary 5: Branch Data Isolation] ---> Server-derived ChiNhanhId, Enforceable Branch Path (Rule 06)
      |
      v
[Boundary 6: Ownership & State]     ---> Resource ID Validation, Tenant Match, Lifecycle State Check
      |
      v
[Boundary 7: Input & Business Logic]---> DTO Validation, Injection Defense, Invariant Enforcement
      |
      v
[Boundary 8: Transaction & Lock]    ---> Atomic Boundary, Concurrency Control when applicable (Rule 02)
      |
      v
[Boundary 9: Persistence Layer]     ---> Parameterized Commands, Safe Data Access
      |
      v
[Boundary 10: Database Security]    ---> Database Controls, RLS (if applied), Schema Least Privilege
      |
      v
[Boundary 11: Audit & Telemetry]    ---> NHAT_KY_KIEM_TOAN, Security Telemetry, Correlation Tracing
      |
      v
Trusted API Response                ---> Response DTO Filtering, Masking Sensitive Fields
```

#### Mô hình cô lập chi nhánh chuẩn hóa (Standard Branch Isolation Model)
```text
Authoritative Branch Scope
        ↓
Enforceable Branch Isolation Path
        ↓
Application / Persistence / Database Enforcement
        ↓
Verification
```

> [!NOTE]
> Chuỗi `JWT → BranchId → SESSION_CONTEXT → SQL Server RLS` là **ví dụ tham chiếu cụ thể của dự án (project-specific reference example / applicable when implemented)**, không phải là kiến trúc áp đặt phổ quát cho mọi hệ thống. Trọng tâm của Security Review là kiểm tra: *"Is there an enforceable and verifiable branch isolation path?"* (Hệ thống có đường dẫn cô lập chi nhánh có thể thực thi và kiểm chứng được hay không?), chứ không phải *"Hệ thống có bắt buộc dùng SESSION_CONTEXT/RLS hay không?"*.

### 5.2. Các bề mặt tấn công cần rà soát (Attack Surfaces)

1. **Anonymous Access Surface:** Các endpoint không yêu cầu xác thực (`[AllowAnonymous]`, public routes). Nguy cơ: lộ dữ liệu nội bộ, vét cạn tài nguyên, brute-force mật khẩu.
2. **Authenticated Abuse Surface:** Người dùng hợp lệ nhưng thực hiện hành vi vượt quyền hoặc lạm dụng chức năng.
3. **Parameter Tampering & IDOR Surface:** Sửa đổi `id`, `branchId`, `userId`, `price`, `status` trên URL, query string hoặc body để truy cập tài nguyên trái phép.
4. **Cross-Branch Traversal Surface:** Gọi API với ID của chi nhánh khác hoặc khai thác các mối quan hệ liên kết (JOIN) để đọc/ghi dữ liệu ngoài phạm vi chi nhánh được phân công.
5. **Injection Surface:** Chèn chuỗi điều khiển độc hại vào đầu vào để thao túng câu lệnh SQL, lệnh hệ điều hành, trình thông dịch script hoặc mã HTML/JS.
6. **Concurrency & Race Condition Surface:** Gửi nhiều request đồng thời cùng microsecond nhằm mua vượt tồn kho (overselling), thanh toán trùng lặp hoặc tạo trạng thái không nhất quán khi nghiệp vụ đòi hỏi tính nhất quán.
7. **Business Logic & State Transition Abuse:** Xác minh xem các thao tác chuyển trạng thái nghiệp vụ trái phép hoặc không hợp lệ có thể vượt qua các chốt chặn kiểm soát trạng thái của tầng nghiệp vụ/domain (Rule 02/05) hay không.
8. **Sensitive Data Exposure Surface:** Rò rỉ thông tin nhạy cảm qua API response, file log, localStorage, URL parameters hoặc thông báo lỗi (error stack trace).
9. **File Upload & Export Abuse:** Tải lên tệp độc hại, tệp giả mạo extension, path traversal ghi đè file hệ thống, hoặc xuất dữ liệu toàn chuỗi vượt thẩm quyền.
10. **Audit Log Tampering Surface:** Sửa đổi, xóa nhật ký kiểm toán hoặc thực hiện hành vi nhạy cảm mà không để lại dấu vết.

> [!CAUTION]
> Không bao giờ tuyên bố một lỗ hổng tồn tại chỉ vì một danh mục tấn công có thể hình dung ra trên lý thuyết. Mỗi phát hiện lỗ hổng phải có **bằng chứng vật lý chứng minh đường dẫn tấn công (Attack Path)** hoặc phải được ghi nhận là một **khoảng trống cần xác minh (Verification Gap / POTENTIAL)**.

---

## 6. Authentication Review

### 6.1. Mục tiêu kiểm tra xác thực

Rà soát toàn bộ ranh giới xác thực để bảo đảm hệ thống xác định danh tính người gọi một cách tin cậy:
- **Enforcement Boundary:** Xác thực phải được thực thi tại server-side middleware/filter trước khi request chạm vào business logic.
- **Phân định rõ ràng:** *Cơ chế xác thực tồn tại* KHÔNG ĐỒNG NGHĨA VỚI *Xác thực thực sự được thực thi trên mọi endpoint*.

### 6.2. Các nội dung rà soát chi tiết

1. **Bảo vệ Endpoint mặc định (Deny by Default / Protected by Default):**
   - Kiểm tra xem kiến trúc có áp dụng chính sách bảo vệ mặc định cho toàn bộ API và chỉ mở các endpoint ẩn danh một cách rõ ràng hay không.
   - Tìm kiếm các endpoint bị "quên" gắn thuộc tính bảo vệ (thiếu `[Authorize]` hoặc cấu hình route guard tương đương).
2. **Kiểm tra thông tin đăng nhập (Credential Verification):**
   - Rà soát hàm xử lý đăng nhập (`Login`): kiểm tra xem có cơ chế chống brute-force (khóa tài khoản tạm thời, rate limiting) khi có yêu cầu bảo mật hay không.
   - Xác minh việc so sánh mật khẩu: sử dụng hàm so sánh thời gian không đổi (constant-time comparison) hoặc cơ chế băm an toàn theo Rule 03, tránh so sánh chuỗi trần (`password == user.Password`).
   - Kiểm tra thông báo lỗi khi đăng nhập thất bại: thông báo nên trung lập (ví dụ: *"Tên đăng nhập hoặc mật khẩu không đúng"*), tránh làm lộ tài khoản có tồn tại hay không (chống User Enumeration).
3. **Vòng đời tài khoản & Trạng thái vô hiệu hóa (Account Lifecycle):**
   - Kiểm tra xem khi tài khoản bị khóa, bị xóa hoặc đổi mật khẩu, hệ thống có cơ chế từ chối xác thực hay không.
   - Kiểm tra xem tài khoản đã bị vô hiệu hóa (`IsActive == false`) có thể tiếp tục sử dụng token cũ để gọi API hay không.
4. **Các kịch bản vòng qua xác thực (Authentication Bypass Scenarios):**
   - *Missing Guard:* Endpoint nhạy cảm thiếu bộ lọc xác thực.
   - *Optional Authentication Flaw:* Endpoint chấp nhận token nếu có, nhưng nếu không có token vẫn cho phép xử lý với quyền mặc định hoặc dữ liệu rỗng.
   - *Null / Empty Identity:* Request gửi header xác thực rỗng nhưng middleware không bắt lỗi mà gán danh tính là Anonymous User rồi vẫn cho phép đi tiếp.
   - *Forged Identity:* Header tự chế từ client (như `X-User-Id`, `X-Role`) được tin tưởng trực tiếp thay vì giải mã từ token được ký số hợp lệ ở máy chủ.
   - *Inconsistent Pipeline:* Một số route xử lý qua pipeline bỏ qua middleware xác thực (ví dụ: route tĩnh, handler tùy chỉnh).

---

## 7. Credential & Secret Handling

### 7.1. Nguyên tắc cốt lõi

- **Mật khẩu:** Không bao giờ lưu trữ mật khẩu ở dạng rõ (plaintext). Mật khẩu phải được bảo vệ bằng cơ chế băm an toàn theo quy định của `Rule 03` (các thuật toán như BCrypt, Argon2, PBKDF2 chỉ là ví dụ minh họa; thuật toán thực tế phải tuân thủ Rule 03 và cấu hình bảo mật được duyệt).
- **Bí mật hệ thống:** Private keys, signing secrets, connection strings, API keys của bên thứ ba không được nhúng cứng (hard-coded) vào mã nguồn.

### 7.2. Các nội dung rà soát chi tiết

1. **Quét mã nguồn tìm bí mật bị lộ (Secret Scanning):**
   - Quét toàn bộ repository để phát hiện các chuỗi nhạy cảm bị hard-code: chuỗi kết nối CSDL chứa thông tin xác thực, khóa bí mật token, private key, API key đối tác.
   - Kiểm tra các file cấu hình mẫu (`appsettings.json`, `.env.example`) xem có chứa credentials thật của môi trường production hay không.
   - Kiểm tra lịch sử commit (nếu có thể tiếp cận) xem đã từng có commit chứa mật khẩu rồi sau đó bị xóa đi hay không.
2. **Bảo mật phía Client (Client Bundle Security):**
   - Kiểm tra mã nguồn ứng dụng client (Web/Mobile): không được chứa database connection string, private key ký số hoặc master API key trong mã nguồn client. Mọi thứ trong client bundle đều có thể bị trích xuất.
3. **Bảo mật trong Log (Log Hygiene):**
   - Rà soát các bộ lọc log: bảo đảm rằng tham số mật khẩu đăng nhập, mã PIN, OTP, số thẻ, token xác thực không bị ghi ra console hoặc file log (theo Rule 03/09).
4. **Quy tắc ứng xử với bí mật trong Báo cáo An ninh:**
   - **TUYỆT ĐỐI KHÔNG TÁI HIỆN BÍ MẬT TRẦN TRONG BÁO CÁO:** Khi phát hiện một chuỗi mật khẩu hoặc private key bị lộ trong mã nguồn, Agent bắt buộc phải che dấu (redact) giá trị trong báo cáo (ví dụ: `Server=10.0.0.1;User=sa;Password=******;` hoặc `key_abc***xyz`). Chỉ trích dẫn đường dẫn file và dòng bị vi phạm.

---

## 8. Session / Token Security

### 8.1. Đánh giá dựa trên kiến trúc thực tế

Agent chỉ rà soát các khía cạnh session/token tương ứng với cơ chế thực tế mà dự án sử dụng (ví dụ: JWT, State-based Session, Cookie-based Auth). Không áp đặt các yêu cầu của JWT nếu dự án dùng cơ chế khác, và không đòi hỏi refresh tokens nếu kiến trúc không quy định.

### 8.2. Các nội dung rà soát chi tiết (minh họa với Token/JWT)

1. **Phát hành Token (Token Issuance):**
   - Kiểm tra thuật toán ký: sử dụng thuật toán mã hóa mạnh theo chuẩn kiến trúc (ví dụ mẫu: HMAC-SHA256 hoặc RSA-SHA256). Nghiêm cấm chấp nhận thuật toán `none` (`alg: "none"`).
   - Kiểm tra độ an toàn của Secret Key: khóa bí mật dùng để ký token phải có độ dài và độ phức tạp đủ lớn theo tiêu chuẩn an ninh.
2. **Thẩm định Token (Token Validation Parameters):**
   - Rà soát cấu hình kiểm tra token phía server (nếu kiến trúc sử dụng JWT):
     - Xác minh chữ ký số của đơn vị phát hành (`ValidateIssuerSigningKey = true`).
     - Xác minh đơn vị phát hành (`ValidateIssuer`) và đối tượng tiếp nhận (`ValidateAudience`) khi áp dụng.
     - Xác minh hạn dùng (`ValidateLifetime = true`) với độ lệch đồng hồ (`ClockSkew`) tối thiểu.
3. **Thời hạn tồn tại & Thu hồi (Expiry & Revocation):**
   - Token truy cập nên có thời hạn phù hợp với yêu cầu nghiệp vụ.
   - Nếu kiến trúc có sử dụng Refresh Token: kiểm tra xem Refresh Token có được lưu trữ an toàn, có cơ chế xoay vòng (rotation), phát hiện tái sử dụng và bị thu hồi khi đăng xuất hay không.
4. **Lưu trữ Token phía Client (Client-Side Storage):**
   - Trên Web (ReactJS nếu có sử dụng): Đánh giá rủi ro lưu trữ token trong `localStorage` / `sessionStorage` (nguy cơ XSS) so với cookies có cờ bảo mật.
   - Trên Mobile (Flutter nếu có sử dụng): Đánh giá việc lưu trữ token trong bộ nhớ an toàn của thiết bị (như Flutter Secure Storage / Keychain / Keystore) so với bộ nhớ không mã hóa.
5. **Đăng xuất & Vô hiệu hóa (Logout Semantics):**
   - Kiểm tra xem thao tác đăng xuất phía client có đi kèm với việc vô hiệu hóa phiên làm việc / thu hồi token ở server (khi kiến trúc yêu cầu stateful revocation) hay không.

---

## 9. RBAC & Permission Review

### 9.1. Chuỗi phân quyền vai trò nghiệp vụ (RBAC Chain)

Dựa trên thẩm quyền của `Rule 04`, phân quyền phải được đánh giá qua chuỗi:

```text
Identity (Đã xác thực)
   ↓
Role (Vai trò nghiệp vụ: OWNER, SALES, WAREHOUSE...)
   ↓
Permission / Capability (Quyền hạn cụ thể: ORDER_CREATE, INVENTORY_ADJUST...)
   ↓
Resource / Action (Đối tượng tác động & Hành động: SALE_ORDER / CREATE...)
   ↓
Scope (Phạm vi dữ liệu: OWN_BRANCH, OWN_RECORD...)
```

### 9.2. Các nội dung rà soát chi tiết

1. **Nguyên tắc Đặc quyền Tối thiểu (Least Privilege):**
   - Kiểm tra từng vai trò có bị cấp quyền vượt quá phạm vi trách nhiệm nghiệp vụ quy định trong Rule 04 hay không:
     - Nhân viên bán hàng (`SALES`): Được tra cứu thuốc, xem tồn kho bán hàng, tạo đơn bán, tạo hóa đơn trong chi nhánh của mình; không được phép xem tồn kho chi nhánh khác, không điều chỉnh kho trực tiếp, không quản lý người dùng hay gán quyền ngoài thẩm quyền.
     - Nhân viên kho (`WAREHOUSE`): Quản lý nhập/xuất/kiểm kê kho trong chi nhánh; không bán hàng, tạo hóa đơn bán lẻ hay can thiệp tài chính ngoài thẩm quyền.
     - Chủ nhà thuốc / Quản lý (`OWNER` / `MANAGER`): Có quyền quản lý trong phạm vi chi nhánh được giao; không mặc nhiên có quyền can thiệp dữ liệu chi nhánh khác nếu không có phạm vi liên chi nhánh rõ ràng.
2. **Phân tách Trách nhiệm (Separation of Duties):**
   - Kiểm tra các nghiệp vụ rủi ro cao: thao tác kiểm kê và duyệt chênh lệch kho, tạo đơn nhập và duyệt chi tiền có được phân tách giữa nhân viên và quản lý theo yêu cầu nghiệp vụ hay không.
3. **Cơ chế gán vai trò & quyền hạn (Role / Permission Assignment):**
   - Rà soát các endpoint tạo/sửa người dùng và gán vai trò: bảo đảm chỉ người dùng có quyền quản trị được thực hiện.
   - Chống tự nâng quyền (Self-Escalation): bảo đảm người dùng không thể tự gán role cao hơn cho chính mình qua API cập nhật thông tin cá nhân.
4. **Không tin tưởng vai trò từ Client (Server-Side Role Resolution):**
   - Vai trò và quyền hạn phải được giải quyết từ cơ sở dữ liệu hoặc từ token claims đã được ký số hợp lệ ở máy chủ; không lấy vai trò từ request parameter do client gửi lên.

---

## 10. Authorization / BOLA / IDOR

### 10.1. Ranh giới kiểm soát truy cập runtime (Runtime Authorization Boundary)

Dựa trên thẩm quyền của `Rule 05`, nhận biết ID của tài nguyên **không đồng nghĩa** với việc có quyền truy cập tài nguyên đó.

```text
Identity + Permission + Resource ID + Ownership / Branch Scope + State ===> ALLOW / DENY
```

### 10.2. Các nội dung rà soát chi tiết

1. **Kiểm tra tham chiếu đối tượng trực tiếp không an toàn (IDOR / BOLA):**
   - Rà soát toàn bộ các endpoint nhận định danh tài nguyên đơn lẻ (`GET /api/orders/{id}`, `PUT /api/invoices/{id}`, `DELETE /api/customers/{id}`):
     - Hệ thống có thẩm định xem tài nguyên có ID `{id}` có thuộc quyền sở hữu của người dùng hiện tại hoặc thuộc chi nhánh hiện tại của người dùng hay không?
     - Nếu người dùng A (chi nhánh 1) gọi xem đơn hàng của chi nhánh 2, hệ thống có từ chối theo chính sách an ninh của Rule 05 và hợp đồng API của Rule 08 hay không?
2. **Kiểm tra trên toàn bộ các phương thức HTTP:**
   - IDOR không chỉ xảy ra trên `GET` (đọc trộm). Phải kiểm tra trên cả `PUT`, `PATCH`, `DELETE`: kẻ tấn công có thể sửa đổi hoặc xóa đơn hàng, phiếu nhập, thông tin thuốc của chi nhánh khác bằng cách thay đổi ID trên URL hay không.
3. **Ngăn chặn vét cạn đối tượng (Object Enumeration):**
   - Nếu hệ thống sử dụng ID số tự tăng tuần tự, kiểm tra xem kẻ tấn công có thể viết script lặp từ 1 đến N để trích xuất dữ liệu ngoài phạm vi hay không.
4. **Phân biệt Authentication vs. Authorization:**
   - Không chấp nhận lập luận *"Endpoint này đã có [Authorize] nên không bị IDOR"*. Thuộc tính xác thực chỉ chứng minh người gọi đã đăng nhập; nó hoàn toàn không kiểm tra người gọi có quyền trên đối tượng cụ thể hay không.

---

## 11. Branch / Tenant Isolation

### 11.1. Chi nhánh là ranh giới an ninh dữ liệu bắt buộc (Branch Boundary)

Theo `Rule 06`, `CHI_NHANH` (Chi nhánh) là ranh giới cô lập dữ liệu người thuê (tenant isolation boundary) tối cao. Người dùng thuộc Chi nhánh A tuyệt đối không được truy cập, xem, tạo, sửa, xóa hoặc suy diễn dữ liệu thuộc Chi nhánh B.

### 11.2. Các nội dung rà soát chi tiết

1. **Ngữ cảnh chi nhánh bắt nguồn từ máy chủ (Server-Derived Branch Context):**
   - Ngữ cảnh chi nhánh (`chi_nhanh_id`) của phiên làm việc bắt buộc phải được trích xuất từ định danh đã xác thực ở server (ví dụ: claim chi nhánh trong token hoặc tra cứu từ CSDL).
   - **Chống tiêm nhiễm tham số chi nhánh từ client (Client Branch Injection):** Thử nghiệm truyền tham số phạm vi chi nhánh từ client xung đột với phạm vi chi nhánh có thẩm quyền (*Attempt to provide a client-controlled branch scope that conflicts with the authoritative branch scope*). Kết quả kỳ vọng phải tuân thủ Rule 06 và hợp đồng API/domain được phê duyệt (ví dụ minh họa: hệ thống từ chối request hoặc bỏ qua giá trị client gửi lên để duy trì phạm vi chi nhánh có thẩm quyền).
2. **Đường dẫn cô lập chi nhánh thực thi được (Enforceable Branch Path):**
   - Rà soát xem dữ liệu thuộc phạm vi chi nhánh có **đường dẫn cô lập chi nhánh có thể thực thi và kiểm chứng được** hay không:
     - *Thực thể trực tiếp:* Bảng có khóa ngoại tham chiếu trực tiếp đến `CHI_NHANH` (ví dụ: `TON_KHO`, `HOA_DON`, `PHIEU_NHAP`).
     - *Thực thể gián tiếp:* Bảng con không có cột `chi_nhanh_id` trực tiếp nhưng có quan hệ khóa ngoại tất định với bảng cha có sở hữu chi nhánh (ví dụ: `HOA_DON_ITEM` thuộc `HOA_DON`).
     - *Thực thể toàn hệ thống (Global / Shared):* Bảng dùng chung toàn chuỗi không có chi nhánh (ví dụ: danh mục thuốc gốc `THUOC`, đơn vị tính `DON_VI_TINH`).
   - Skill 10 **KHÔNG bắt buộc mọi bảng đều phải có trực tiếp cột `chi_nhanh_id`**, và không giả định `WHERE chi_nhanh_id = @branchId` là cơ chế duy nhất; mục tiêu là xác minh tính toàn vẹn của đường dẫn cô lập thực tế.
3. **Cô lập tại tầng Cơ sở dữ liệu (Database-Level Isolation & RLS):**
   - Nếu hệ thống áp dụng SQL Server Row-Level Security (RLS) theo kiến trúc đã phê duyệt:
     - Kiểm tra predicate function: có đánh giá đúng ngữ cảnh phiên (ví dụ: `SESSION_CONTEXT(N'BranchId') == chi_nhanh_id`) hay không?
     - Kiểm tra chính sách: có đầy đủ cả `FILTER PREDICATE` (chặn đọc) và `BLOCK PREDICATE` (chặn ghi/sửa/xóa) hay không?
     - Kiểm tra trạng thái Fail-Closed: khi session context bị thiếu hoặc rỗng, hàm bảo mật có trả về `0` (từ chối tất cả) hay không?
4. **An toàn tái sử dụng kết nối (Connection Pool Safety):**
   - Khi tái sử dụng kết nối từ pool, persistence layer có thiết lập lại ngữ cảnh chi nhánh cho request mới và xóa sạch context cũ trước khi trả kết nối về pool hay không?
5. **Cô lập trong Báo cáo, Thống kê và Xuất dữ liệu:**
   - Các câu lệnh tính tổng (`SUM`, `COUNT`, `AVG`), báo cáo doanh thu, tồn kho và file xuất CSV/Excel có bị rò rỉ số liệu của chi nhánh khác hay không?

---

## 12. Privilege Escalation

### 12.1. Phân loại các hình thức leo thang đặc quyền

Agent rà soát và kiểm tra 4 hình thức leo thang đặc quyền chính:

1. **Horizontal Privilege Escalation (Leo thang ngang):**
   - Người dùng A truy cập hoặc thao túng tài nguyên của Người dùng B cùng cấp bậc (ví dụ: Nhân viên bán thuốc A sửa đơn hàng của Nhân viên bán thuốc B khi không được phép; Chi nhánh A xem kho Chi nhánh B).
2. **Vertical Privilege Escalation (Leo thang dọc):**
   - Người dùng cấp dưới thực hiện thành công chức năng của cấp trên (ví dụ: `SALES` hoặc `WAREHOUSE` gọi thành công API tạo tài khoản, đổi cấu hình chi nhánh, hoặc xem báo cáo tài chính của `OWNER`).
3. **Cross-Branch Escalation (Leo thang xuyên chi nhánh):**
   - Người dùng thuộc Chi nhánh A thực hiện thao tác quản lý hoặc sửa đổi dữ liệu tác nghiệp tại Chi nhánh B.
4. **Administrative / System Escalation (Leo thang quản trị):**
   - Người dùng tác nghiệp thông thường lợi dụng lỗ hổng để đạt được quyền Quản trị viên hệ thống (Super Admin) hoặc chiếm quyền kiểm soát server CSDL.

### 12.2. Các cơ chế dẫn đến leo thang đặc quyền cần rà soát

- **Mass Assignment (Gán thuộc tính hàng loạt):** Request DTO cho phép client gửi trường `Role`, `IsAdmin`, `Permissions`, hoặc Entity Model được bind trực tiếp từ request body khiến thuộc tính quyền hạn bị ghi đè trái phép.
- **Hidden Endpoints:** Endpoint quản trị chỉ được "giấu" bằng đường dẫn URL bí mật mà không có bộ lọc phân quyền phía máy chủ.
- **Client-Side Role Checks:** Giao diện chỉ kiểm tra vai trò để hiển thị form, nhưng API nhận xử lý form không kiểm tra vai trò.
- **State Transition Flaws:** Xác minh xem các thao tác chuyển trạng thái tài nguyên trái phép có thể bị lợi dụng để vượt quyền (ví dụ: người dùng tự phê duyệt chứng từ của chính mình khi thiếu thẩm quyền theo Rule 02/05) hay không.

---

## 13. Input Validation & Injection

### 13.1. Nguyên tắc thẩm định đầu vào và phòng chống chèn ép lệnh

Tất cả dữ liệu đến từ phía Client (URL path, query string, request body, headers, uploaded files) đều là **KHÔNG ĐÁNG TIN CẬY (UNTRUSTED)**.

Security Review phân biệt rõ 4 khái niệm dễ bị nhầm lẫn:
- **Input Validation (Thẩm định đầu vào):** Kiểm tra cấu trúc, kiểu dữ liệu, độ dài, khoảng giá trị và định dạng của dữ liệu đầu vào tại API boundary.
- **Output Encoding (Mã hóa đầu ra):** Chuyển đổi các ký tự nguy hiểm thành ký tự an toàn trước khi render lên UI (chống XSS).
- **Parameterized Data Access (Tham số hóa truy vấn):** Tách bạch hoàn toàn giữa lệnh SQL và dữ liệu thông qua tham số (chống SQL Injection).
- **Business Validation (Thẩm định nghiệp vụ):** Kiểm tra xem dữ liệu có hợp lệ theo quy tắc domain (ví dụ: số lượng tồn kho có đủ để xuất không) hay không.

### 13.2. Các lớp tấn công Injection cần rà soát (Attack Classes)

Security Review tập trung vào các **lớp tấn công (Attack Classes)**, các chuỗi payload cụ thể chỉ là ví dụ minh họa hoặc chỉ dấu tấn công mẫu (illustrative examples / example attack indicators):

1. **SQL Injection (SQLi):**
   - Tìm kiếm các câu lệnh SQL được tạo bằng cách nối chuỗi trực tiếp (`string.Concat`, toán tử `+`, nội suy chuỗi). Các chuỗi như `' OR 1=1 --` chỉ là payload minh họa; mục tiêu rà soát là việc thiếu tham số hóa.
   - Kiểm tra các câu lệnh SQL động trong Stored Procedures (`sp_executesql` không có tham số hóa, lệnh `EXEC(@sql)`).
   - Kiểm tra các mệnh đề `ORDER BY` hoặc tên cột được truyền động từ client mà không qua whitelist.
2. **Cross-Site Scripting (XSS):**
   - Trên Web (như ReactJS nếu áp dụng): Kiểm tra việc sử dụng các phương thức render HTML thô (ví dụ: `dangerouslySetInnerHTML`), chèn URL không an toàn vào thẻ `<a href={url}>` (ví dụ: `javascript:...`), hoặc render dữ liệu chưa qua khử độc từ bên thứ ba.
   - Trên Mobile (như Flutter nếu áp dụng): Kiểm tra việc render HTML trong WebView hoặc thực thi JavaScript từ nguồn không tin cậy.
3. **Command Injection (Chèn lệnh hệ điều hành):**
   - Kiểm tra xem mã nguồn có gọi các lệnh hệ điều hành (ví dụ minh họa: `Process.Start`, `cmd.exe`, `powershell.exe` hoặc bash shell) với tham số lấy trực tiếp từ người dùng mà không qua khử độc hay không.
4. **Path Traversal (Duyệt thư mục trái phép):**
   - Kiểm tra các thao tác đọc/ghi file từ đĩa: tham số tên file lấy từ client có bị chèn ký tự duyệt thư mục (ví dụ minh họa: `../` hoặc `..\`) để truy cập các file cấu hình và file hệ thống nhạy cảm hay không.
5. **Unsafe Deserialization & Template Injection:**
   - Rà soát các bộ giải tuần tự hóa (deserializers): tránh sử dụng các cấu hình không an toàn cho phép khởi tạo tùy ý các lớp đối tượng nguy hiểm từ đầu vào chưa được thẩm định.

---

## 14. API Security

### 14.1. Ranh giới kiểm tra an ninh API

Theo `Rule 08` và `Skill 06`, API là cổng giao tiếp công khai duy nhất giữa Client và Server. Skill 10 tập trung đánh giá các thuộc tính bảo mật của API mà không tự định nghĩa quy ước thiết kế API mới.

### 14.2. Các nội dung rà soát chi tiết

1. **Phòng chống Mass Assignment (Gán dữ liệu hàng loạt):**
   - Endpoint có sử dụng Request DTO riêng biệt hay không?
   - Request DTO có chỉ chứa các trường được phép sửa đổi bởi client hay không? Tránh bind trực tiếp Entity CSDL vào controller action parameter.
2. **Kiểm soát rò rỉ thông tin trong Lỗi (Error Information Disclosure):**
   - Khi xảy ra ngoại lệ ở server, API có trả về Problem Details chuẩn (theo Rule 08) với thông điệp an toàn hay trả về toàn bộ Stack Trace, câu lệnh SQL lỗi hoặc đường dẫn file nội bộ trên máy chủ?
3. **Kiểm soát phương thức HTTP (HTTP Method Enforcement):**
   - Endpoint có bắt buộc đúng phương thức HTTP được định nghĩa hay chấp nhận tùy tiện theo Rule 08?
4. **Cấu hình CORS & Headers An ninh:**
   - Cấu hình Cross-Origin Resource Sharing (CORS) có bị mở rộng tùy tiện (`AllowAnyOrigin` kèm `AllowCredentials`) cho phép bất kỳ trang web độc hại nào gọi API hay không? Whitelist nguồn gốc tin cậy là khuyến nghị an ninh quan trọng.
   - Các header an ninh HTTP (như `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy`) được xem xét như các khuyến nghị an ninh (security recommendations) bảo vệ theo chiều sâu.
5. **Chống lạm dụng tần suất & Lũy bao (Rate Limiting & Idempotency):**
   - Các endpoint nhạy cảm (đăng nhập, gửi OTP, thanh toán, tạo đơn hàng) có cơ chế giới hạn tần suất (Rate Limiting) khi yêu cầu bảo vệ chống tấn công từ chối dịch vụ hoặc brute-force hay không?
   - Các thao tác thanh toán, trừ tiền, tạo hóa đơn có hỗ trợ `Idempotency-Key` (theo Rule 02/08) để ngăn chặn việc xử lý trùng lặp khi client gửi lại request hay không?

---

## 15. Database Security

### 15.1. Ranh giới an ninh Cơ sở dữ liệu

An ninh CSDL được bảo vệ dựa trên sự phối hợp giữa `Rule 03` (Security), `Rule 06` (Branch Isolation), `Rule 07` (Database Integrity) và `Skill 07` (SQL Server). Skill 10 đánh giá các thuộc tính an ninh của CSDL mà không thay thế kiến trúc CSDL của Skill 07.

### 15.2. Các nội dung rà soát chi tiết

1. **Tách biệt người dùng ứng dụng & Nguyên tắc đặc quyền tối thiểu (Least Privilege DB User):**
   - Ứng dụng có kết nối vào CSDL bằng tài khoản quản trị tối cao (`sa`) hay bằng tài khoản chuyên dụng với quyền hạn tối thiểu? Tài khoản ứng dụng nên có quyền thao tác trên dữ liệu (`SELECT`, `INSERT`, `UPDATE`, `DELETE`); không nên có quyền cấu trúc (`DROP TABLE`, `ALTER TABLE`) trong luồng nghiệp vụ thông thường.
2. **Ngăn chặn kết nối trực tiếp từ Client (No Direct DB Access):**
   - Xác nhận ứng dụng client (Web/Mobile) không kết nối thẳng vào CSDL mà phải thông qua API Backend.
3. **Rà soát Stored Procedures và Dynamic SQL:**
   - Kiểm tra các Stored Procedures xem có sử dụng dynamic SQL nối chuỗi không an toàn hay không.
   - Kiểm tra xem các quyền `EXECUTE` có được cấp phát đúng vai trò hay bị mở rộng tùy tiện.
4. **Bảo vệ CSDL sao lưu (Backup Security):**
   - File sao lưu CSDL có được lưu trữ ở thư mục an toàn, có mã hóa backup (khi môi trường yêu cầu) và giới hạn quyền truy cập tệp tin hay không?

---

## 16. Transaction / Concurrency Security

### 16.1. Rủi ro an ninh xuất phát từ xử lý đồng thời

Các lỗ hổng tranh chấp tài nguyên (Race Conditions, Lost Updates, Check-Then-Act) có thể dẫn đến hậu quả an ninh và tài chính nghiêm trọng:
- Bán vượt quá số lượng thuốc thực tế trong kho (Overselling / Negative Inventory).
- Thanh toán một hóa đơn hai lần hoặc hoàn tiền nhiều lần cho một đơn hàng (Double-Spending / Double-Refund).
- Ghi đè trạng thái phê duyệt của người khác do đọc dữ liệu cũ rồi ghi đè (Lost Update).

> [!NOTE]
> **Ranh giới sở hữu nghiệp vụ:**
> Chính sách giao dịch, kiểm soát đồng thời và chuyển trạng thái thuộc thẩm quyền của `Rule 02` và tầng Domain. Skill 10 **không tự ý định nghĩa quy tắc nghiệp vụ** (ví dụ: không tự định nghĩa hóa đơn phải thanh toán trước khi hoàn tất). Skill 10 chỉ rà soát xem kẻ tấn công có thể lợi dụng việc thiếu vắng ranh giới giao dịch hoặc cơ chế khóa để phá vỡ các bất biến nghiệp vụ hay không.

### 16.2. Các nội dung rà soát chi tiết

1. **Ranh giới giao dịch ACID trên các thao tác nhạy cảm:**
   - Rà soát các luồng nghiệp vụ đòi hỏi tính nguyên tử theo Rule 02 và Rule 07 (ví dụ: Bán hàng -> Trừ kho -> Tạo hóa đơn -> Ghi nhận thanh toán).
   - Kiểm tra xem khi một bước thất bại, toàn bộ thao tác có được rollback trọn vẹn để tránh trạng thái nửa vời hay không. Không mặc định mọi thao tác đa bảng đều bắt buộc phải dùng transaction nếu kiến trúc hoặc nghiệp vụ không đòi hỏi.
2. **Cơ chế kiểm soát đồng thời (Concurrency Controls):**
   - Khi cập nhật tồn kho thuốc trong bảng `TON_KHO`, hệ thống sử dụng cơ chế nào để chống race condition theo Rule 02?
     - *Khóa bi quan (Pessimistic Locking):* Có được áp dụng đúng đắn và giải phóng kịp thời không?
     - *Khóa lạc quan (Optimistic Locking):* Có bắt ngoại lệ xung đột đồng thời và xử lý an toàn không?
     - *Cập nhật nguyên tử (Atomic Update):* Câu lệnh cập nhật có kèm điều kiện kiểm tra tồn kho không âm và kiểm tra số dòng bị ảnh hưởng hay không?
3. **Phòng chống tấn công lặp lại (Replay & Retry Abuse):**
   - Khi xảy ra lỗi mạng và client tự động retry, hệ thống có cơ chế ngăn chặn việc tạo ra hai đơn hàng giống hệt nhau hoặc trừ kho hai lần hay không?

---

## 17. Sensitive Data Protection

### 17.1. Định danh các nhóm dữ liệu nhạy cảm

Trong hệ thống nhà thuốc PharmaBranch, các nhóm dữ liệu nhạy cảm bao gồm:
- **Thông tin định danh cá nhân (PII):** Họ tên, số CMND/CCCD, ngày sinh, số điện thoại, địa chỉ của nhân viên và khách hàng.
- **Thông tin y tế / Đơn thuốc (Health Data):** Lịch sử dùng thuốc, bệnh án, thông tin bác sĩ kê đơn, chẩn đoán bệnh tật khi áp dụng.
- **Thông tin tài chính & Kinh doanh:** Doanh thu chi nhánh, giá vốn nhập hàng, biên lợi nhuận, chiết khấu đặc biệt, lương/thưởng nhân viên.
- **Dữ liệu an ninh & Xác thực:** Mật khẩu, token, khóa ký số, chuỗi kết nối, khóa giải mã.

### 17.2. Các nội dung rà soát chi tiết

1. **Bảo vệ dữ liệu khi lưu trữ (Data at Rest):**
   - Các trường nhạy cảm có được áp dụng Column-Level Security (CLS), mã hóa cột hoặc phân quyền truy cập nghiêm ngặt theo `Rule 03` hay không?
   - Mật khẩu có được băm với thuật toán tiêu chuẩn và salt ngẫu nhiên hay không?
2. **Bảo vệ dữ liệu khi truyền tải (Data in Transit):**
   - Toàn bộ kết nối giữa Web/Mobile và Backend có bắt buộc sử dụng HTTPS/TLS hay không? Có tồn tại endpoint nào cho phép truyền qua HTTP rõ không?
   - Kết nối giữa Backend và CSDL có bật mã hóa kết nối khi môi trường yêu cầu hay không?
3. **Kiểm soát hiển thị trên API (Response Data Minimization):**
   - Response DTO có loại bỏ hoàn toàn các trường nhạy cảm không cần thiết (như PasswordHash, SecurityStamp, internal IDs) trước khi trả về cho client hay không?
   - Dữ liệu PII của khách hàng có được che dấu (masking) khi hiển thị cho vai trò không có thẩm quyền đặc biệt hay không?
4. **Bảo vệ dữ liệu trong Cache và Local Storage:**
   - Dữ liệu y tế và thông tin nhạy cảm có bị cache tùy tiện ở trình duyệt (HTTP caching headers không có `no-store`) hoặc lưu vào bộ nhớ client không mã hóa hay không?

---

## 18. File / Upload / Export Security

### 18.1. Rủi ro từ thao tác tệp tin và xuất dữ liệu

Chức năng tải file lên (upload ảnh thuốc, chứng từ nhập kho) và tải file xuống (xuất báo cáo Excel/PDF) là bề mặt tấn công thường bị tin tặc khai thác để thực thi mã độc từ xa hoặc đánh cắp dữ liệu hàng loạt.

### 18.2. Các nội dung rà soát chi tiết

1. **Thẩm định tệp tải lên (File Upload Validation):**
   - *Phần mở rộng (Extension Whitelist):* Hệ thống có kiểm tra whitelist phần mở rộng cho phép (ví dụ mẫu: `.jpg`, `.png`, `.pdf`) hay kiểm tra blacklist lỏng lẻo?
   - *Nội dung thực tế (Magic Bytes / MIME Type):* Việc kiểm tra byte đầu tệp tin (magic numbers) là khuyến nghị an ninh mạnh mẽ để ngăn chặn việc đổi tên file độc hại thành file ảnh.
   - *Giới hạn kích thước (File Size Limit):* Thiết lập giới hạn dung lượng tối đa để chống tấn công làm cạn kiệt ổ đĩa máy chủ (DoS).
   - *Đặt lại tên tệp tin (Filename Sanitization):* Thay thế tên file gốc bằng định danh ngẫu nhiên (GUID / UUID) là khuyến nghị an ninh quan trọng để chống path traversal.
   - *Vị trí lưu trữ:* Tệp tin tải lên nên được lưu ở thư mục nằm ngoài Web Root (không thể thực thi trực tiếp qua URL HTTP).
2. **Kiểm soát quyền tải xuống và xuất báo cáo (Export & Download Authorization):**
   - Chức năng xuất dữ liệu (Excel/CSV) có thẩm định quyền của người gọi hay bất kỳ ai cũng có thể kích hoạt xuất toàn bộ danh sách khách hàng và doanh thu?
   - File xuất có bị giới hạn nghiêm ngặt theo **phạm vi chi nhánh** của người dùng hiện tại (Rule 06) hay xuất toàn bộ dữ liệu của toàn chuỗi?
   - File tạm (temporary files) sau khi tạo và tải về có được xóa dọn tự động hay lưu vĩnh viễn trên đĩa máy chủ?

---

## 19. Audit Log & Security Event Review

### 19.1. Phân định rạch ròi giữa các loại nhật ký

Dựa trên thẩm quyền của `Rule 03` và `Rule 09`, Security Review phân biệt rõ 3 khái niệm:
- **Operational Logs (Nhật ký vận hành):** Dữ liệu chẩn đoán kỹ thuật tạm thời (traces, debug info, exceptions, request timing) phục vụ bảo trì hệ thống.
- **Security Events (Sự kiện an ninh):** Các chỉ số vi phạm an ninh (thất bại xác thực, lỗi từ chối phân quyền [ví dụ: HTTP 403], phát hiện tiêm nhiễm SQLi, tráo đổi chi nhánh).
- **Authoritative Business Audit Records (`NHAT_KY_KIEM_TOAN`):** Bản ghi pháp lý lưu vết ai đã làm gì, lúc nào, trên đối tượng nào và kết quả ra sao đối với các nghiệp vụ tài chính, kho và quản trị khi Rule 03/09 hoặc yêu cầu kiến trúc quy định.

### 19.2. Các nội dung rà soát chi tiết

1. **Độ bao phủ của Nhật ký kiểm toán nghiệp vụ (Audit Coverage):**
   - Xác minh các thao tác nhạy cảm về an ninh và nghiệp vụ (security-sensitive / business-sensitive actions) có được kiểm toán theo `Rule 03`, `Rule 09` và các yêu cầu áp dụng hay không.
   - Các thao tác thường thuộc diện rà soát kiểm toán bao gồm:
     - Đăng nhập thất bại / thành công, thay đổi mật khẩu, gán vai trò, cấp quyền.
     - Thay đổi thông tin chi nhánh, thêm/sửa/xóa người dùng.
     - Điều chỉnh tồn kho, phê duyệt chênh lệch kiểm kê kho.
     - Tạo, sửa, hủy hóa đơn bán hàng; xử lý trả hàng; hoàn tiền.
     - Thao tác ký số hóa đơn điện tử; thay đổi bảng giá thuốc.
2. **Cấu trúc dữ liệu của bản ghi kiểm toán (Audit Record Structure):**
   - Cấu trúc bản ghi kiểm toán phải được xác định dựa trên: `Rule 03/09`, yêu cầu được duyệt, kiến trúc, hợp đồng API (nếu áp dụng), schema CSDL, bằng chứng triển khai và thiết kế kiểm toán thực tế.
   - Các trường thông tin như: `ActorId`, `Timestamp`, `Action`, `Resource`, `ResourceId`, `ChiNhanhId` (hoặc `BranchId`), `OldValues`, `NewValues`, `ClientIp`, `UserAgent`, và `CorrelationId` là **các trường kiểm toán minh họa (illustrative audit fields / possible fields depending on requirements and architecture)**, không phải danh sách trường bắt buộc phổ quát do Skill 10 tự áp đặt.
3. **Tính toàn vẹn và chống can thiệp (Audit Integrity & Tamper Resistance):**
   - Xác minh xem bản ghi kiểm toán nghiệp vụ có được bảo vệ chống sửa đổi (`UPDATE`) hoặc xóa (`DELETE`) theo yêu cầu tính bất biến (khi Rule 03/09 hoặc yêu cầu an ninh/kiến trúc xác nhận).
   - Kiểm tra xem người dùng ứng dụng thông thường có bị ngăn chặn việc can thiệp hoặc chỉnh sửa lịch sử kiểm toán hay không.
4. **Vệ sinh dữ liệu kiểm toán (Audit Hygiene):**
   - Bản ghi kiểm toán không được chứa mật khẩu trần, token, khóa bí mật hoặc thông tin nhạy cảm không cần thiết trong dữ liệu lưu trữ theo Rule 03/09.

---

## 20. Cryptography & Digital Signature

### 20.1. Rà soát mật mã theo yêu cầu thực tế

Skill 10 kiểm tra việc sử dụng mật mã và chữ ký số dựa trên yêu cầu kiến trúc thực tế của dự án (`Rule 02` và `Rule 03`). Không tự ý áp đặt các thuật toán ngoài đặc tả dự án.

### 20.2. Các nội dung rà soát chi tiết

1. **Băm mật khẩu (Password Hashing):**
   - Thuật toán băm có đủ mạnh (ví dụ mẫu: BCrypt, Argon2, PBKDF2 với số vòng lặp phù hợp theo Rule 03) hay không?
   - Tuyệt đối nghiêm cấm sử dụng các hàm băm nhanh, không an toàn và đã bị bẻ gãy cho mật khẩu như MD5, SHA-1, hoặc SHA-256 không kèm muối (salt).
2. **Mã hóa dữ liệu nhạy cảm (Encryption at Rest & in Transit):**
   - Nếu có mã hóa dữ liệu lưu trữ: kiểm tra thuật toán mã hóa (ví dụ mẫu: AES-256-GCM / AES-256-CBC với IV ngẫu nhiên). Khóa mã hóa được lưu ở đâu? Có bị hard-code trong mã nguồn hay không?
3. **Chữ ký số hóa đơn điện tử (Digital Signature for Invoices):**
   - Khi rà soát tính năng ký số hóa đơn điện tử (theo Rule 02/03), Agent phân biệt rạch ròi 4 cấp độ:
     - *Signature Exists (Chữ ký có tồn tại):* Bảng hóa đơn có cột lưu chuỗi chữ ký hoặc file chữ ký.
     - *Cryptographically Verified (Được xác minh mật mã):* Chữ ký được giải mã bằng public key và đối chiếu hash khớp với thuật toán quy định (ví dụ mẫu: RSA-SHA256).
     - *Context Bound (Ràng buộc đúng ngữ cảnh):* Chữ ký được tính toán từ nội dung chuẩn hóa (Canonical Representation) của đúng hóa đơn đó, bao gồm tổng tiền, danh sách thuốc, thời gian và chi nhánh; không thể lấy chữ ký của hóa đơn A gán sang hóa đơn B.
     - *Verification Enforced (Xác minh được thực thi):* Hệ thống thực sự kích hoạt hàm kiểm tra chữ ký trước khi in ấn, gửi cơ quan thuế hoặc hoàn tất thanh toán.
   - **Bảo vệ Khóa ký số (Private Key Protection):** Private Key được sử dụng cho ký số phải được bảo vệ theo `Rule 02/03` và kiến trúc đã được phê duyệt; không được đưa về client hoặc hard-code trong mã nguồn nếu điều đó trái với security requirements hoặc kiến trúc được duyệt. Quá trình Security Review tập trung rà soát các thuộc tính an ninh cốt lõi: tính bí mật của khóa (key confidentiality), ngăn chặn truy cập trái phép (unauthorized access), phòng chống lộ khóa (key exposure), ranh giới ký số (signing boundary) và vòng đời/xoay vòng khóa (lifecycle/rotation) khi có quy định áp dụng.

---

## 21. Security Configuration

### 21.1. Nguyên tắc đánh giá cấu hình an ninh

- Cấu hình an ninh phải được đánh giá dựa trên môi trường cụ thể (Development vs. Staging vs. Production).
- Agent **không được mặc định** rằng cấu hình trong môi trường phát triển (`Development`) là cấu hình sẽ chạy trên môi trường thực tế (`Production`), nhưng phải cảnh báo nếu có nguy cơ cấu hình phát triển bị đưa nhầm lên production.

### 21.2. Các nội dung rà soát chi tiết

1. **Cấu hình Debug và Chi tiết Lỗi:**
   - Trong môi trường Production: `DetailedErrors`, `DeveloperExceptionPage`, Swagger UI công khai có bị tắt hoặc giới hạn truy cập theo chính sách an ninh hay không?
2. **Cấu hình Cookie & Session:**
   - Cookie xác thực (nếu kiến trúc sử dụng cookie) nên được cân nhắc gắn các cờ an ninh:
     - `HttpOnly = true` (Chống đánh cắp cookie qua JavaScript/XSS).
     - `Secure = true` (Chỉ truyền qua kết nối HTTPS).
     - `SameSite = Strict` hoặc `Lax` (Chống tấn công CSRF).
3. **Cấu hình HTTPS & TLS:**
   - Hệ thống có bật HSTS (`Strict-Transport-Security`) trên production khi kiến trúc bắt buộc HTTPS hay không?
   - Có cơ chế chuyển hướng từ HTTP sang HTTPS khi áp dụng hay không?
4. **Cấu hình Tiêm Bí mật Môi trường (Secret Injection):**
   - Trên môi trường production, bí mật (connection string, JWT secret) được nạp qua biến môi trường (Environment Variables) hay file cấu hình trần? Quyền truy cập vào file cấu hình trên server có được giới hạn hay không?

---

## 22. Dependency & Supply-Chain Security

### 22.1. Quản lý rủi ro chuỗi cung ứng phần mềm

Các thư viện bên thứ ba (ví dụ như NuGet packages trong .NET, npm packages trong React, pub packages trong Flutter khi áp dụng theo kiến trúc dự án) là nguồn gốc phổ biến của các lỗ hổng bảo mật nghiêm trọng.

### 22.2. Các nội dung rà soát chi tiết

1. **Kiểm kê gói phụ thuộc (Dependency Inventory):**
   - Rà soát các file khai báo phụ thuộc (ví dụ mẫu: `.csproj`, `package.json`, `pubspec.yaml`, `package-lock.json`, `pubspec.lock` khi hiện diện trong repository).
   - Kiểm tra xem các phiên bản thư viện có được khóa (version pinning / lockfile) để ngăn chặn việc tự động tải mã nguồn độc hại khi build hay không.
2. **Phát hiện lỗ hổng đã biết (Known Vulnerabilities / CVEs):**
   - Kiểm tra xem dự án có sử dụng các gói thư viện có lỗ hổng bảo mật đã công bố (thông qua kết quả của `dotnet list package --vulnerable`, `npm audit`, hoặc các công cụ quét phụ thuộc có sẵn trong CI/CD) hay không.
   - **Lưu ý quan trọng:** Không được vội vã kết luận một thư viện có lỗ hổng chỉ vì nó cũ; phải đối chiếu với cơ sở dữ liệu lỗ hổng hoặc bằng chứng quét bảo mật thực tế.
3. **Phụ thuộc bị bỏ rơi hoặc đáng ngờ (Abandoned / Suspicious Packages):**
   - Cảnh báo nếu dự án sử dụng các gói thư viện không rõ nguồn gốc, ít người dùng, hoặc đã ngừng phát triển nhiều năm mà đang nắm giữ các chức năng nhạy cảm (như mật mã, xác thực).
4. **Ranh giới tác vụ Read-Only:**
   - Trong quá trình Security Review ở chế độ READ-ONLY, Agent **tuyệt đối không tự tiện chạy các lệnh cài đặt tool**, update package hoặc thay đổi phiên bản phụ thuộc.

---

## 23. Security Testing & Verification

### 23.1. Đánh giá bộ kiểm thử an ninh (Security Test Suites)

Security Review có nhiệm vụ thẩm định xem hệ thống có các ca kiểm thử bảo mật chuyên biệt (Security Tests) hay không và độ bao phủ của chúng đến đâu. Các ca kiểm thử này là **công cụ REVIEW (REVIEW TOOLS)** giúp đánh giá an ninh, không phải là bộ tiêu chí nghiệm thu cứng (hard acceptance criteria) do Skill 10 tự định nghĩa.

### 23.2. Giới hạn phạm vi của kiểm thử (Test Scope Truths)

Agent phải thấm nhuần các chân lý về giới hạn của kiểm thử để không bao giờ bị đánh lừa bởi các kết quả test xanh cục bộ:
- **Frontend E2E Test PASS ≠ Backend Authorization PASS:** Một bài test E2E vượt qua chỉ chứng minh trên giao diện luồng đi đúng; nó không chứng minh rằng nếu kẻ tấn công gửi HTTP request trực tiếp bỏ qua giao diện thì backend sẽ chặn được.
- **Unit Test PASS ≠ Production Security PASS:** Unit test thường mock CSDL và mock authentication context; nó không kiểm chứng được các ràng buộc SQL Server RLS thực tế hoặc cấu hình middleware trên môi trường production.
- **Database Test PASS ≠ System-Wide Branch Isolation PASS:** Test CSDL chứng minh câu lệnh SQL có điều kiện lọc; nó không chứng minh API controller bên trên đã truyền đúng tham số chi nhánh từ authenticated user.
- **Security Scanner PASS ≠ Complete Application Security:** Công cụ quét mã tĩnh (SAST) hoặc quét phụ thuộc chỉ tìm được các mẫu lỗi bề mặt; nó hoàn toàn mù tịt trước các lỗ hổng logic nghiệp vụ, IDOR phức tạp hoặc race condition trong giao dịch bán hàng.

### 23.3. Các kịch bản kiểm thử tiêu cực đại diện (Representative Negative Security Test Scenarios)

Các kịch bản kiểm thử tiêu cực dưới đây đóng vai trò là **các nhóm kiểm thử/rà soát an ninh mẫu (review/test categories) và ví dụ minh họa (illustrative examples)** phục vụ quá trình Security Review, **không phải là bộ tiêu chí nghiệm thu phổ quát (universal acceptance criteria) do Skill 10 tự định nghĩa**.

Agent phải rà soát và đánh giá các kịch bản kiểm thử tiêu cực theo phương pháp luận evidence-first. Kết quả an ninh kỳ vọng (expected security outcome) trong các kịch bản kiểm thử tiêu cực **phải được xác định và dẫn xuất từ: `Rule 03`, `Rule 04`, `Rule 05`, `Rule 06`, `Rule 08`, các yêu cầu an ninh được duyệt, yêu cầu nghiệp vụ/domain, hợp đồng API được phê duyệt, kiến trúc đã được duyệt, bằng chứng triển khai thực tế và môi trường kiểm thử áp dụng (applicable test environment)**:

1. *Anonymous Request Test:* Yêu cầu ẩn danh gọi tài nguyên được bảo vệ cần được đánh giá theo chính sách xác thực áp dụng và hợp đồng API (*Anonymous request to a protected resource should be evaluated against the applicable authentication policy and API contract; HTTP `401 Unauthorized` là một kết quả khả dĩ mang tính minh họa*).
2. *Wrong Role Test:* Truy cập chức năng khi không có thẩm quyền cần được đánh giá theo Rule 04/05 và hợp đồng API/an ninh áp dụng (*Unauthorized capability access should be evaluated against Rule 04/05 and the applicable API/security contract; HTTP `403 Forbidden` là một kết quả khả dĩ mang tính minh họa*).
3. *Cross-Branch Read Test:* Truy cập đọc chéo chi nhánh cần được đánh giá dựa trên chính sách cô lập chi nhánh có thẩm quyền, yêu cầu được duyệt, hợp đồng API và bằng chứng triển khai (*Cross-branch access should be evaluated against the authoritative branch-isolation policy, approved requirements, API contract and implementation evidence; HTTP `404 Not Found` hoặc `403 Forbidden` là các kết quả khả dĩ mang tính minh họa mà không làm rò rỉ sự tồn tại của tài nguyên*).
4. *Cross-Branch Mutation Test:* Thao tác ghi/sửa/xóa chéo chi nhánh cần được đánh giá theo Rule 06, hợp đồng API và toàn vẹn CSDL (ví dụ minh họa: từ chối thao tác và rollback giao dịch CSDL nếu vi phạm tính toàn vẹn).
5. *Client Branch Injection Test:* Thử nghiệm truyền tham số phạm vi chi nhánh từ client xung đột với phạm vi chi nhánh có thẩm quyền (*Attempt to provide a client-controlled branch scope that conflicts with the authoritative branch scope*). Kết quả kỳ vọng phải tuân thủ Rule 06 và hợp đồng API/domain được phê duyệt (các kết quả minh họa có thể gồm từ chối request hoặc bỏ qua giá trị client gửi lên để duy trì phạm vi chi nhánh có thẩm quyền).
6. *IDOR / BOLA Test:* Truy cập hoặc sửa đổi tài nguyên ngoài quyền sở hữu hoặc ngoài phạm vi chi nhánh cần được đánh giá theo Rule 05, mô hình sở hữu tài nguyên và hợp đồng API áp dụng (các mã phản hồi như 404/403 là ví dụ minh họa tùy thuộc vào hợp đồng API).
7. *SQL Injection Test:* Rà soát xem các cơ chế phòng thủ injection áp dụng (như tham số hóa truy vấn) có hiện diện và được thực thi đúng cách hay không; các chuỗi payload cụ thể (ví dụ mẫu: `' OR 1=1 --`) chỉ là ví dụ minh họa hoặc chỉ dấu tấn công mẫu.
8. *Concurrency Negative Test:* Hành vi đồng thời phải được đánh giá dựa trên bất biến nghiệp vụ áp dụng, Rule 02, thiết kế giao dịch/đồng thời và bằng chứng triển khai (*Concurrent behavior must be evaluated against the applicable business invariant, Rule 02, transaction/concurrency design and implementation evidence; ví dụ: bảo toàn tính nhất quán tồn kho, ngăn chặn overselling theo quy tắc nghiệp vụ; không mặc định rằng mọi thao tác đồng thời chỉ cho phép đúng một request thành công nếu nghiệp vụ có cơ chế xử lý hợp lệ khác*).

---

## 24. Security Finding Classification & Report

### 24.1. Sáu trạng thái phát hiện an ninh (Finding Statuses)

Mọi phát hiện trong quá trình Security Review phải được gán đúng một trong 6 trạng thái chuẩn hóa:
1. **CONFIRMED (Đã xác nhận):** Điểm yếu an ninh được chứng minh đầy đủ bằng bằng chứng trực tiếp, thích đáng xác lập điều kiện có lỗ hổng và tác động an ninh của nó (*A security weakness is sufficiently demonstrated by direct, relevant evidence that establishes the vulnerable condition and its security impact*). Bằng chứng có thể bao gồm: bằng chứng triển khai vật lý trong mã nguồn, bằng chứng runtime, bằng chứng test an ninh có thể tái lập, bằng chứng cấu hình, bằng chứng liên tầng, hoặc sự kết hợp của nhiều loại bằng chứng. Việc khai thác thành công (successful exploitation) là bằng chứng mạnh mẽ nhưng **KHÔNG phải là điều kiện bắt buộc trong mọi trường hợp** (ví dụ: nếu mã nguồn trực tiếp cho thấy bước kiểm tra authorization bị thiếu hoàn toàn và đường dẫn tấn công được chứng minh từ call path, phát hiện có thể được gán nhãn CONFIRMED ngay cả khi chưa chạy exploit).
2. **LIKELY (Có khả năng cao):** Bằng chứng mã nguồn cho thấy chốt chặn bảo mật bị thiếu hoặc bị lỗi, khả năng khai thác rất rõ ràng nhưng còn phụ thuộc vào một số điều kiện biên môi trường chưa được thẩm định trọn vẹn.
3. **POTENTIAL (Tiềm ẩn / Cần thẩm định thêm):** Tồn tại mẫu hình mã nguồn đáng ngờ hoặc cấu hình chưa tối ưu, nhưng tác động thực tế còn phụ thuộc vào các chốt chặn ở tầng khác chưa được kiểm chứng.
4. **NOT VERIFIED (Chưa được xác minh):** Không tìm thấy đủ bằng chứng trong mã nguồn hoặc môi trường để khẳng định an toàn hay có lỗ hổng (Verification Gap). Tuyệt đối không tự động coi thiếu bằng chứng là có lỗ hổng (`NOT FOUND ≠ NOT IMPLEMENTED`, `NOT VERIFIED ≠ FAIL`).
5. **NOT APPLICABLE (Không áp dụng):** Rủi ro hoặc mối đe dọa không áp dụng cho kiến trúc hoặc phạm vi hiện tại của hệ thống.
6. **FALSE POSITIVE (Báo động giả):** Nghi ngờ ban đầu đã được chứng minh là an toàn nhờ có chốt chặn bảo vệ hợp lệ ở một tầng kiến trúc khác.

### 24.2. Năm mức độ nghiêm trọng (Finding Severities)

Mức độ nghiêm trọng được áp dụng trong quá trình Security Review **theo quy định của `Rule 03` (Applied during review according to Rule 03)**, dựa trên ma trận giữa Khả năng khai thác (Exploitability) và Mức độ tác động (Impact):

| Mức độ nghiêm trọng | Tiêu chí đánh giá theo Rule 03 | Ví dụ minh họa điển hình |
|---|---|---|
| **CRITICAL** | Khai thác từ xa dễ dàng, không cần xác thực hoặc chỉ cần quyền thấp nhất; dẫn đến rò rỉ toàn bộ CSDL, thực thi mã từ xa (RCE), hoặc phá vỡ hoàn toàn ranh giới cô lập chi nhánh | SQLi không cần auth, RCE qua upload file, Hard-coded Master Key, Bỏ qua hoàn toàn xác thực API |
| **HIGH** | Đòi hỏi đăng nhập (quyền thông thường); có thể đánh cắp dữ liệu nhạy cảm hàng loạt, leo thang đặc quyền từ nhân viên lên quản lý, hoặc IDOR/BOLA xuyên chi nhánh | IDOR đọc/sửa dữ liệu chi nhánh khác, Mass Assignment nâng quyền Admin, Race Condition gây âm kho |
| **MEDIUM** | Khai thác đòi hỏi điều kiện tiên quyết nhất định; gây ảnh hưởng giới hạn đến một người dùng hoặc rò rỉ dữ liệu ít nhạy cảm | Lộ Stack Trace chứa thông tin nội bộ, Session Timeout quá dài, Thiếu rate limiting trên API gửi email |
| **LOW** | Rủi ro thấp, khó khai thác hoặc tác động không đáng kể đến tính bảo mật của hệ thống | Thiếu một số security headers thứ yếu, Lộ phiên bản framework trong HTTP response header |
| **INFORMATIONAL** | Không phải là lỗ hổng trực tiếp; các khuyến nghị cải thiện kiến trúc hoặc nâng cao tính vững chắc (defense-in-depth) | Đề xuất cập nhật tài liệu an ninh, Đề xuất cải thiện quy ước đặt tên quyền hạn |

> [!IMPORTANT]
> **Tách biệt mức độ nghiêm trọng an ninh và độ ưu tiên vận hành:**
> - Thang đo an ninh (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFORMATIONAL`) thuộc quyền sở hữu duy nhất của `Rule 03` và được Skill 10 áp dụng trong đánh giá.
> - Thang đo độ ưu tiên cảnh báo vận hành (`P1`, `P2`, `P3`) thuộc quyền sở hữu của `Rule 09`.
> - Tuyệt đối không tự động gán tương đương (như `P1 = CRITICAL`). Một phát hiện có thể là `HIGH` về mặt an ninh nhưng không gây sự cố sập hệ thống tức thời (`P1`).

### 24.3. Mẫu báo cáo phát hiện an ninh chuẩn (Security Finding Report Format)

Mỗi phát hiện an ninh trong báo cáo bắt buộc phải tuân thủ cấu trúc chi tiết dưới đây:

```markdown
### [SEC-F01] [Tên lỗ hổng ngắn gọn, súc tích]

- **Mã phát hiện (Finding ID):** SEC-F01
- **Mức độ nghiêm trọng (Severity):** CRITICAL / HIGH / MEDIUM / LOW / INFORMATIONAL
- **Trạng thái (Status):** CONFIRMED / LIKELY / POTENTIAL / NOT VERIFIED
- **Phạm vi tác động (Scope):** [Tên Controller / Service / Table / Endpoint bị ảnh hưởng]
- **Điều kiện tiên quyết (Preconditions):** [Ví dụ: Đòi hỏi tài khoản có vai trò SALES]
- **Bằng chứng vật lý (Evidence):**
  - Tệp tin & Dòng: `[Đường dẫn file:dòng]`
  - Trích đoạn mã vi phạm (đã che giấu bí mật nếu có):
    ```csharp
    // Trích đoạn mã nguồn thực tế
    ```
- **Đường dẫn tấn công (Attack Path):**
  1. Kẻ tấn công gửi HTTP request đến endpoint `POST /api/v1/...`
  2. Tham số `id` bị sửa đổi thành ID của chi nhánh khác...
  3. Server không kiểm tra quyền sở hữu chi nhánh mà thực thi truy vấn...
- **Tác động an ninh & nghiệp vụ (Impact):** [Mô tả thiệt hại về dữ liệu, tài chính, uy tín]
- **Nguyên nhân gốc rễ (Root Cause):** [Thiếu bước kiểm tra quyền runtime / Nối chuỗi SQL / Tin tưởng tham số client]
- **Tầng kiến trúc bị ảnh hưởng (Affected Layer):** API / Application / Persistence / Database
- **Lần vết liên tầng (Cross-Layer Trace):** [Mô tả luồng đi từ UI -> API -> DB]
- **Phương pháp xác minh (Verification Method):** [Cách thức tái hiện lỗi hoặc kịch bản test]
- **Khuyến nghị khắc phục (Recommendation):** [Hướng dẫn sửa chữa chi tiết gắn liền với nguyên nhân gốc rễ]
- **Độ tin cậy của phát hiện (Confidence):** HIGH / MEDIUM / LOW
- **Rủi ro còn lại (Residual Risk):** [Đánh giá rủi ro sau khi áp dụng bản vá khuyến nghị]
```

### 24.4. Mười tám phản mẫu an ninh nguy hại (18 Security Anti-Patterns)

Agent phải nhận diện và tuyệt đối tránh xa 18 phản mẫu an ninh sau đây:
1. **Frontend-only authorization:** Tin rằng giao diện ẩn nút bấm hoặc route guard của client (như React/Flutter nếu áp dụng) là đủ an toàn mà không kiểm tra quyền ở backend.
2. **Authentication treated as authorization:** Coi việc request có token hợp lệ đồng nghĩa với việc có quyền thực hiện mọi thao tác trên mọi tài nguyên.
3. **Client-controlled branch trust:** Tin tưởng giá trị `branchId` do client gửi lên trong query string hoặc body để lọc dữ liệu.
4. **Hidden menu treated as security:** Giấu các chức năng quản trị bằng cách không hiển thị trên menu nhưng không bảo vệ endpoint phía máy chủ.
5. **ID in URL treated as authorization:** Cho rằng nếu client biết được ID của hóa đơn/đơn hàng thì đương nhiên có quyền đọc hoặc sửa hóa đơn đó.
6. **JWT presence treated as authentication proof:** Kiểm tra sự có mặt của chuỗi token nhưng không xác minh chữ ký số hoặc thời hạn sống của token.
7. **ORM usage treated as automatic SQL safety:** Tin rằng dùng ORM (như Entity Framework hay Dapper nếu dự án sử dụng) là miễn nhiễm 100% với SQLi mà quên rằng Stored Procedures hoặc câu lệnh nối chuỗi vẫn dính SQLi.
8. **Parameterization treated as complete database security:** Cho rằng tham số hóa câu lệnh SQL là CSDL đã an toàn hoàn toàn, bỏ qua việc kiểm tra phân quyền tài khoản CSDL và các chốt chặn cô lập dữ liệu (như RLS nếu áp dụng).
9. **RLS existence treated as proof of correct isolation:** Thấy CSDL có cấu hình RLS (nếu áp dụng) là kết luận cô lập chi nhánh đã đạt, không kiểm tra predicate function có bị lỗi logic hoặc session context có bị rỗng không.
10. **Audit log existence treated as proof of audit integrity:** Thấy có bảng log là kết luận việc kiểm toán đã an toàn, không kiểm tra xem bảng log có bị quyền `UPDATE`/`DELETE` xóa sạch hay không.
11. **Unit test pass treated as security proof:** Thấy unit test xanh là khẳng định hệ thống an toàn, bỏ qua thực tế unit test đã mock toàn bộ các chốt chặn an ninh thật.
12. **E2E pass treated as backend security proof:** Coi kiểm thử E2E giao diện thành công là backend đã được bảo vệ trước các cuộc gọi HTTP can thiệp tham số trực tiếp.
13. **Security scanner pass treated as complete security:** Tin tưởng tuyệt đối vào công cụ quét tự động mà không rà soát thủ công các lỗ hổng logic nghiệp vụ và phân quyền.
14. **Documentation treated as implementation proof:** Đọc tài liệu thiết kế ghi "Hệ thống bảo mật bằng JWT và RLS" liền kết luận hệ thống đã triển khai đầy đủ.
15. **Missing evidence treated automatically as vulnerability:** Không tìm thấy mã nguồn lập tức kết luận hệ thống bị lỗ hổng (thay vì đánh dấu `NOT VERIFIED` / `Verification Gap`).
16. **Hard-coded security technology preference:** Đánh rớt một tính năng an ninh chỉ vì dự án không dùng thư viện hay công nghệ mà Agent ưa thích.
17. **Severity assigned without impact analysis:** Gán nhãn `CRITICAL` bừa bãi cho các lỗi nhỏ không thể khai thác, hoặc hạ thấp lỗ hổng nghiêm trọng xuống `LOW`.
18. **Remediation without root-cause analysis:** Đưa ra khuyến nghị chắp vá ở bề mặt (như ẩn thêm nút bấm ở frontend) thay vì sửa chữa tận gốc ranh giới thẩm định ở backend.

### 24.5. Bảng kiểm chất lượng rà soát an ninh (Security Quality Checklist)

Checklist bắt buộc phải được đánh giá với 5 trạng thái chuẩn hóa: `[PASS / FAIL / PARTIAL / NOT APPLICABLE / NOT VERIFIED]`.

| STT | Hạng mục kiểm tra an ninh (Security Check Item) | Tiêu chuẩn thẩm tra chi tiết | Trạng thái đánh giá |
|---|---|---|---|
| **1** | **Scope Definition** | Phạm vi rà soát an ninh, bề mặt tấn công in/out-of-scope được xác định rõ ràng, không võ đoán? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **2** | **Security Boundaries** | Các ranh giới tin cậy (Client, API, Service, Database) được nhận diện và phân định rạch ròi? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **3** | **Authentication Review** | Xác thực được thực thi hoàn toàn ở máy chủ (Rule 03); không có endpoint bảo vệ bị lộ ẩn danh; xác thực tách biệt phân quyền? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **4** | **Credential & Secrets** | Mật khẩu được bảo vệ an toàn theo Rule 03; tuyệt đối không có mật khẩu, private key hay secret bị hard-code; che giấu bí mật trong báo cáo? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **5** | **Session & Token** | Token/Session được thẩm định theo kiến trúc thực tế; các cờ bảo mật và hạn dùng được xem xét theo Rule 03 khi áp dụng? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **6** | **RBAC Enforcement** | Phân quyền tuân thủ ma trận vai trò nghiệp vụ (Rule 04); áp dụng đặc quyền tối thiểu; phân tách trách nhiệm hợp lý? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **7** | **Runtime Authorization** | Kiểm soát truy cập runtime chặt chẽ (Rule 05); kiểm tra quyền trên từng hành động và tài nguyên ở phía máy chủ? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **8** | **IDOR / BOLA Defense** | Thẩm định quyền sở hữu tài nguyên trên các phương thức HTTP theo Rule 05; đánh giá cơ chế phòng ngừa việc thao túng định danh tài nguyên? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **9** | **Branch Data Isolation** | Cô lập chi nhánh theo Rule 06; có đường dẫn cô lập thực thi được; client scope không ghi đè authoritative scope; RLS được đánh giá khi áp dụng theo kiến trúc? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **10** | **Privilege Escalation** | Đánh giá khả năng ngăn chặn leo thang đặc quyền ngang, dọc, xuyên chi nhánh và tự nâng quyền theo Rule 04/05, requirements áp dụng và implementation evidence? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **11** | **Injection Defense** | Tham số hóa câu lệnh CSDL; khử độc đầu vào; bảo vệ theo lớp tấn công (SQLi, XSS, Command, Path Traversal); các payload cụ thể chỉ là ví dụ minh họa? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **12** | **API Security** | DTO riêng biệt chống Mass Assignment; xử lý lỗi an toàn không lộ stack trace; kiểm tra theo Rule 08, hợp đồng API được duyệt, quy ước repo và bằng chứng triển khai; không áp đặt quy ước URI hay HTTP status cứng ngoài hợp đồng? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **13** | **Database Security** | Tài khoản CSDL đặc quyền tối thiểu; không nối chuỗi SQL; an toàn sao lưu; không áp đặt kiến trúc CSDL ngoài Rule 07 / Skill 07; không mặc định yêu cầu FK chi nhánh trực tiếp hay locking hint cụ thể nếu không quy định? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **14** | **Concurrency & Transactions** | Ranh giới giao dịch được xác minh khi tính nguyên tử/nhất quán đòi hỏi theo Rule 02/07, kiến trúc và bằng chứng; cơ chế đồng thời bảo toàn bất biến; state transitions được rà soát chống bypass; không áp đặt transaction phổ quát cho mọi thao tác đa bảng? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **15** | **Sensitive Data Protection** | Dữ liệu cá nhân, y tế, tài chính được bảo vệ khi lưu trữ, truyền tải và thu nhỏ hiển thị trên API theo Rule 03 (CLS)? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **16** | **File & Export Security** | Upload security controls phù hợp với file type, threat model, requirements và architecture được kiểm tra (extension allowlist, content inspection, filename sanitization là các illustrative review indicators); export dữ liệu giới hạn theo phạm vi chi nhánh của người dùng (Rule 06)? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **17** | **Audit Logging** | Xác minh các thao tác nhạy cảm được audit theo Rule 03/09 và requirements áp dụng; cấu trúc bản ghi kiểm toán dẫn xuất từ kiến trúc/requirements; telemetry và correlation ID được đánh giá theo Rule 09; không áp đặt schema kiểm toán cứng phổ quát? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **18** | **Cryptography & Signatures** | Thuật toán mật mã mạnh theo Rule 03; chữ ký số hóa đơn ràng buộc đúng ngữ cảnh (Rule 02); private key được bảo vệ an toàn theo kiến trúc phê duyệt? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **19** | **Security Configuration** | Tắt debug trên production; cookie security attributes được review khi cookie-based auth/session được sử dụng theo security requirements và architecture; security headers được đánh giá theo khuyến nghị môi trường thực tế? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **20** | **Supply-Chain Security** | Dependency integrity, versioning và vulnerability management được review theo package manager, build process, project requirements và supply-chain controls hiện hành; tuân thủ an toàn chế độ Read-Only? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **21** | **Security Test Evidence** | Bộ kiểm thử an ninh (negative tests) được đánh giá theo phạm vi; kết quả kỳ vọng dẫn xuất từ Rules, Requirements, Contract, Domain, Architecture, Implementation, Test Environment; test pass không mặc định toàn hệ thống an toàn? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **22** | **Evidence-Based Findings** | Bằng chứng đánh giá theo 7 loại và 7 chiều kích; CONFIRMED dựa trên bằng chứng xác thực đầy đủ; NOT FOUND ≠ NOT IMPLEMENTED; NOT VERIFIED ≠ FAIL; trung lập công nghệ (không đánh rớt chỉ vì công nghệ khác)? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **23** | **Severity & Root Cause** | Mức độ nghiêm trọng áp dụng theo Rule 03; tách biệt rõ ràng Status vs. Severity; khuyến nghị xử lý tận gốc nguyên nhân? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **24** | **Cross-Skill Governance** | Tôn trọng ranh giới quản trị; Skill 10 giữ vai trò Reviewer liên tầng, không thay thế quyền sở hữu của Rules 00–09 và Skills 01–09? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |

---

## 25. Governance & Cross-Skill Boundary

### 25.1. Ranh giới tương tác liên kỹ năng (Cross-Skill Mapping)

Skill 10 thiết lập mối quan hệ hợp tác chặt chẽ nhưng độc lập với toàn bộ hệ thống tài liệu quản trị của PharmaBranch:

```text
+---------------------------------------------------------------------------------------------------+
|                                  GOVERNING RULES (Thẩm quyền tối cao)                             |
|  Rule 00 (Gov)    | Rule 01 (Arch)   | Rule 02 (Tx/Conc) | Rule 03 (Security) | Rule 04 (RBAC)   |
|  Rule 05 (AuthZ)  | Rule 06 (Branch) | Rule 07 (DB Integ)| Rule 08 (API Cont) | Rule 09 (Ops/Log)|
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                  IMPLEMENTATION & PROCESS SKILLS                                  |
|  Skill 01: Codebase Onboarding               | Skill 06: API Design                               |
|  Skill 02: Coding Standards                  | Skill 07: Database SQL Server                      |
|  Skill 03: .NET Backend Architecture         | Skill 08: Testing Practices                        |
|  Skill 04: React Frontend Architecture       | Skill 09: Verification Loop                        |
|  Skill 05: Flutter Mobile Architecture       |                                                    |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                SKILL 10 — SECURITY REVIEW (Auditor)                               |
|    - Rà soát an ninh toàn diện không thiên vị qua các tầng Client, API, Service, Database         |
|    - Thẩm định sự tuân thủ Rules 00–09 và phát hiện rủi ro liên tầng                              |
|    - Cung cấp bằng chứng an ninh phục vụ phán quyết của Skill 09                                  |
|    - Discover -> Trace -> Evaluate -> Identify Security Finding -> Recommend -> Re-verify        |
+---------------------------------------------------------------------------------------------------+
```

### 25.2. Các bất biến phân định thẩm quyền (Authority Invariants)

Để bảo đảm tính toàn vẹn của hệ thống quản trị, Agent bắt buộc phải ghi nhớ 8 bất biến sau:

1. **Skill 10 là Reviewer, không phải Policy Owner:** Skill 10 kiểm tra việc tuân thủ an ninh; nó không tự sáng tạo ra các chính sách an ninh mới thay thế cho Rules 00–09.
2. **Evidence > Assumption (Bằng chứng vượt trên giả định):** Kết luận phải phù hợp với loại bằng chứng, phạm vi áp dụng và mức độ mà bằng chứng thực sự chứng minh. Bằng chứng có thể bao gồm: (1) Requirement Evidence, (2) Design / Architecture Evidence, (3) Implementation Evidence, (4) Runtime Evidence, (5) Test Evidence, (6) Configuration Evidence, (7) Documentation Evidence. Requirement/Design/Documentation evidence có thể chứng minh requirement hoặc intended design, nhưng không tự chứng minh implementation. Implementation/Runtime/Test evidence được sử dụng khi kết luận liên quan đến implementation hoặc runtime behavior. Không được suy diễn vượt quá scope của evidence.
3. **Security Finding ≠ Verification Verdict:** Một phát hiện an ninh (`Finding: HIGH`) là mô tả về một khiếm khuyết kỹ thuật cụ thể; nó khác với phán quyết nghiệm thu tác vụ (`Verdict: VERIFIED / FAILED`) do Skill 09 ban hành.
4. **Severity ≠ Operational Priority:** Mức độ nghiêm trọng của lỗ hổng an ninh (`CRITICAL / HIGH / MEDIUM`) phản ánh rủi ro bảo mật (Rule 03); nó độc lập với mức độ ưu tiên xử lý sự cố vận hành (`P1 / P2 / P3` của Rule 09).
5. **Authentication ≠ Authorization:** Xác thực danh tính (Bạn là ai?) hoàn toàn tách biệt với phân quyền truy cập (Bạn được phép làm gì?). Xác thực thành công không đồng nghĩa với có quyền truy cập tài nguyên.
6. **Authorization ≠ Branch Isolation:** Phân quyền theo vai trò (Role/Permission) hoàn toàn tách biệt với phạm vi cô lập chi nhánh (`ChiNhanhId`). Có quyền `ORDER_VIEW` không đồng nghĩa với việc được xem đơn hàng của chi nhánh khác.
7. **Logging ≠ Authoritative Audit:** Việc ghi log vận hành ra file/console không thay thế được bản ghi kiểm toán nghiệp vụ bất biến (`NHAT_KY_KIEM_TOAN`) trong CSDL quan hệ.
8. **Test Pass ≠ Security Pass:** Bộ kiểm thử thông thường vượt qua không đồng nghĩa với việc hệ thống an toàn trước các cuộc tấn công khai thác lỗ hổng chuyên sâu.
