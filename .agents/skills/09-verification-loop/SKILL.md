---
name: verification-loop
description: >
  Guides the systematic verification process for PharmaBranch changes and features,
  tracing requirements through implementation, cross-layer integration, API contracts,
  security/authorization, branch isolation, database integrity, tests, runtime evidence,
  and regression while respecting Rules 00–09 and repository evidence.
---

# SKILL 09 — VERIFICATION LOOP

## 1. Objective & Scope

### 1.1. Objective

Skill này chuẩn hóa quy trình và phương pháp luận **Xác minh có hệ thống (Systematic Verification Loop)** cho toàn bộ hệ thống quản lý chuỗi nhà thuốc đa chi nhánh PharmaBranch.

Mục tiêu tối thượng của Verification Loop là trả lời dứt khoát câu hỏi:
> **"Thay đổi / tính năng / tác vụ đã thực sự hoàn thành đầy đủ, chính xác và an toàn theo đúng yêu cầu hay chưa?"**

Verification Loop không dừng lại ở câu hỏi hạn hẹp *"Mã nguồn có biên dịch thành công hay không?"* hay *"Test có vượt qua hay không?"*. Skill này thiết lập một cơ chế kiểm chứng đa tầng, yêu cầu bằng chứng vật lý (physical evidence) từ mọi ranh giới kỹ thuật:
- **Yêu cầu (Requirements):** Đã được xác định rõ ràng với tiêu chí nghiệm thu (acceptance criteria) cụ thể chưa?
- **Phạm vi (Scope):** Có được kiểm soát chặt chẽ, không bị phình to hoặc bỏ sót không?
- **Hiện diện triển khai (Implementation Existence):** Mã nguồn, cấu hình, dữ liệu có thực sự tồn tại và được kết nối hoàn chỉnh không?
- **Độ chính xác (Correctness):** Hành vi thực tế có khớp với đặc tả nghiệp vụ không?
- **Liên kết đa tầng (Cross-Layer Trace):** Luồng dữ liệu và điều khiển có thông suốt từ giao diện, API, tầng nghiệp vụ đến cơ sở dữ liệu không?
- **Ranh giới hợp đồng API (API Contract):** Endpoint, DTO, validation, mã trạng thái và xử lý lỗi có tuân thủ đặc tả không?
- **Ranh giới an ninh & phân quyền (Security & Authorization):** Xác thực, RBAC, kiểm soát truy cập runtime, IDOR/BOLA có được thẩm định phía máy chủ không?
- **Ranh giới cô lập chi nhánh (Branch Isolation):** Ngữ cảnh chi nhánh có được bảo vệ độc lập, không rò rỉ dữ liệu chéo không?
- **Ranh giới toàn vẹn dữ liệu (Database Integrity):** Khóa chính, khóa ngoại, ràng buộc CHECK/UNIQUE, giao dịch và xử lý đồng thời có toàn vẹn không?
- **Bằng chứng kiểm thử (Test Evidence):** Kiểm thử có tồn tại, có được thực thi, có vượt qua và có phản ánh đúng kịch bản biên không?
- **Bằng chứng runtime (Runtime Evidence):** Ứng dụng có khởi động, phản hồi, ghi log và xử lý lỗi chính xác ở môi trường chạy thực tế không?
- **Kiểm định hồi quy (Regression):** Thay đổi có gây đổ vỡ các chức năng, luồng nghiệp vụ hoặc kiểm thử hiện hữu không?
- **Tính nhất quán tài liệu (Documentation Consistency):** Tài liệu thiết kế, API spec, README có phản ánh đúng hiện trạng triển khai không?
- **Giả định chưa kiểm chứng (Unverified Assumptions):** Còn giả định nào chưa được chứng minh bằng bằng chứng thực tế không?

### 1.2. Scope

Skill này áp dụng cho mọi hoạt động xác minh trong hệ thống PharmaBranch:
- Xác minh sau khi hoàn thành một tính năng mới (Feature Completion Verification);
- Xác minh sau khi sửa lỗi hoặc tái cấu trúc (Bugfix & Refactoring Verification);
- Xác minh kiểm thử và bằng chứng thực thi (Test & Runtime Evidence Verification);
- Đánh giá hiện trạng triển khai trong chế độ đọc (Read-Only Audit & Gap Analysis);
- Thẩm định độ tin cậy và ban hành phán quyết cuối cùng (Final Verdict & Confidence Evaluation).

```text
+-----------------------------------------------------------------------------------------+
|                                    VERIFICATION LOOP                                    |
|                                                                                         |
|  [Task / Scope] ---> [Physical Implementation] ---> [Cross-Layer Trace]                 |
|                                                             |                           |
|  [Final Verdict] <--- [Regression & Docs] <--- [Security / Data / Tests / Runtime]     |
+-----------------------------------------------------------------------------------------+
```

Skill này kiên quyết ngăn chặn các kết luận sai lầm phổ biến:
- *"Biên dịch thành công = Chức năng hoàn thành"*
- *"Test PASS = Tính năng an toàn và chính xác hoàn toàn"*
- *"Tài liệu / ERD ghi có = Hiện thực đã tồn tại"*
- *"Giao diện ẩn nút bấm = Phân quyền đã an toàn"*

---

## 2. Priority Hierarchy & Technology Neutrality

### 2.1. Thứ bậc ưu tiên tuyệt đối (Priority Hierarchy)

Khi tiến hành xác minh, Agent phải tuân thủ nghiêm ngặt thứ tự ưu tiên sau:

1. `.agents/rules/00-project-governance.md` (Quản trị dự án tối cao)
2. `.agents/rules/01-architecture.md` (Kiến trúc phân tầng và ranh giới hệ thống)
3. `.agents/rules/02-architecture-quality.md` (Chất lượng giao dịch, đồng thời và vận hành)
4. `.agents/rules/03-security.md` (An ninh, xác thực và bảo vệ bí mật)
5. `.agents/rules/04-rbac.md` (Mô hình vai trò và ma trận quyền hạn)
6. `.agents/rules/05-authorization.md` (Kiểm soát truy cập runtime và phòng chống IDOR/BOLA)
7. `.agents/rules/06-branch-isolation.md` (Cô lập dữ liệu chi nhánh và ranh giới tenant)
8. `.agents/rules/07-database-integrity.md` (Toàn vẹn quan hệ, ràng buộc và nhất quán dữ liệu)
9. `.agents/rules/08-api-contract.md` (Chuẩn mực hợp đồng API và giao tiếp HTTP)
10. `.agents/rules/09-observability-operations.md` (Giám sát, đo kiểm, log và độ tin cậy vận hành)
11. Yêu cầu tác vụ của người dùng và tiêu chí nghiệm thu cụ thể (User Task / Acceptance Criteria)
12. Quy ước hiện hữu của repository và bằng chứng kiến trúc thực tế (Repository Evidence)
13. Các hướng dẫn chuyên môn Skill 01–08 (Skills Guidance)
14. Tài liệu chính thức của ngôn ngữ, runtime và thư viện (Official Documentation)
15. Thực hành kỹ thuật phổ quát (Generic Best Practices)
16. Ý kiến chủ quan hoặc thói quen của Agent (Agent Preference)

> [!IMPORTANT]
> Skill 09 không được phép override hoặc làm suy yếu bất kỳ nguyên tắc nào trong Rules 00–09. Nếu kết quả xác minh phát hiện xung đột giữa hành vi thực tế và Rules, Agent phải ghi nhận phát hiện và dừng lại báo cáo theo quy định quản trị.

### 2.2. Tính trung lập công nghệ (Technology Neutrality)

Verification Loop là một khung phương pháp luận độc lập với công nghệ cụ thể. Skill 09:
- **Không áp đặt công nghệ bắt buộc:** Không mặc định dự án phải sử dụng ASP.NET Core, EF Core, Dapper, ADO.NET, React, Redux, Flutter, Riverpod, BLoC, SQL Server-specific patterns, REST, GraphQL, Swagger, OpenAPI, xUnit, NUnit, Jest, Playwright, Cypress, Docker hay bất kỳ nền tảng CI/CD nào.
- **Dựa trên bằng chứng thực tế của repository:** Mọi công nghệ, thư viện hay công cụ kiểm thử được đề cập trong tài liệu này chỉ mang tính chất **minh họa (illustrative)** hoặc áp dụng **nếu có mặt trong repository (if present in repository)** theo đúng quy ước thực tế.
- **Không biến ví dụ thành yêu cầu kiến trúc:** Việc nêu một ví dụ về endpoint HTTP hay một câu lệnh SQL không đồng nghĩa với việc bắt buộc mọi thành phần khác phải triển khai theo hình thức đó nếu repository có quy ước khác đã được phê duyệt.

---

## 3. Verification Ownership Model

Việc phân định ranh giới sở hữu (Ownership Boundary) là tối quan trọng để tránh chồng chéo trách nhiệm giữa các Rules và Skills.

### 3.1. Phạm vi Skill 09 Sở hữu (Skill 09 OWNS)

Skill 09 chịu trách nhiệm trực tiếp và duy nhất đối với:
1. **Quy trình xác minh (Verification Process & Sequence):** Các bước, thứ tự và cổng kiểm soát từ lúc tiếp nhận thay đổi đến khi kết luận.
2. **Thu thập và phân loại bằng chứng (Evidence Collection & Classification):** Thu thập bằng chứng vật lý, phân định giữa bằng chứng thực tế và giả định.
3. **Kiểm tra tính hoàn chỉnh triển khai (Completion Verification):** Đối chiếu mã nguồn thực tế với yêu cầu nghiệm thu.
4. **Theo vết liên tầng (Cross-Layer Traceability):** Xác minh luồng dữ liệu và điều khiển xuyên suốt các tầng hệ thống.
5. **Diễn giải kết quả kiểm thử (Test-Result Interpretation):** Đánh giá ý nghĩa thực sự của kết quả kiểm thử đối với yêu cầu nghiệp vụ.
6. **Kiểm tra hồi quy (Regression Verification):** Xác định phạm vi ảnh hưởng và kiểm tra các chức năng liên đới.
7. **Kiểm tra tính nhất quán tài liệu (Documentation Consistency Verification):** So khớp tài liệu với hiện trạng mã nguồn.
8. **Phát hiện giả định chưa kiểm chứng và thiếu bằng chứng (Missing Evidence & Assumption Detection):** Chỉ ra các điểm mù chưa được chứng minh.
9. **Mô hình độ tin cậy và phán quyết cuối cùng (Verification Confidence & Final Verdict):** Đưa ra đánh giá VERIFIED / NOT VERIFIED dựa trên bằng chứng.
10. **Cấu trúc báo cáo xác minh (Verification Report Structure):** Chuẩn hóa định dạng tài liệu báo cáo kết quả kiểm tra.

### 3.2. Phạm vi Skill 09 KHÔNG Sở hữu (Skill 09 DOES NOT OWN)

Skill 09 kiểm chứng sự tuân thủ nhưng **KHÔNG định nghĩa lại** các chính sách và triển khai thuộc quyền sở hữu của các thành phần khác:
- **General Project Governance:** Thuộc quyền sở hữu độc quyền của `Rule 00`.
- **Architecture Policy & Layering:** Thuộc quyền sở hữu độc quyền của `Rule 01`.
- **Transaction, Concurrency & Idempotency Policy:** Thuộc quyền sở hữu độc quyền của `Rule 02`.
- **Security Policy & Secret Protection:** Thuộc quyền sở hữu độc quyền của `Rule 03`.
- **RBAC Model & Permission Matrix:** Thuộc quyền sở hữu độc quyền của `Rule 04`.
- **Runtime Authorization & IDOR/BOLA Protection:** Thuộc quyền sở hữu độc quyền của `Rule 05`.
- **Branch Data Isolation Policy:** Thuộc quyền sở hữu độc quyền của `Rule 06`.
- **Database Integrity & Constraint Policy:** Thuộc quyền sở hữu độc quyền của `Rule 07`.
- **API Contract & HTTP Standards:** Thuộc quyền sở hữu độc quyền của `Rule 08`.
- **Observability & Operational Telemetry Policy:** Thuộc quyền sở hữu độc quyền của `Rule 09`.
- **Coding Standards Practice:** Thuộc phạm vi của `Skill 02`.
- **Backend .NET Implementation:** Thuộc phạm vi của `Skill 03`.
- **Frontend React Implementation:** Thuộc phạm vi của `Skill 04`.
- **Mobile Flutter Implementation:** Thuộc phạm vi của `Skill 05`.
- **API Design Practice:** Thuộc phạm vi của `Skill 06`.
- **SQL Server Database Implementation:** Thuộc phạm vi của `Skill 07`.
- **Test Strategy & Test Authoring Practices:** Thuộc phạm vi của `Skill 08`.

> [!NOTE]
> **Quy tắc vàng:** *"Verification ≠ Policy Ownership"*. Skill 09 kiểm tra xem một endpoint có phân quyền đúng theo Rule 05 hay không, nhưng tuyệt đối không tự ý sửa đổi quy tắc phân quyền của Rule 05.

---

## 4. Verification Discovery

Quy trình xác minh bắt buộc phải khởi đầu bằng hoạt động **Khảo sát bằng chứng (Verification Discovery)**. Agent không được phép bắt đầu đánh giá hay đưa ra phán quyết khi chưa khảo sát đầy đủ hiện trạng vật lý trong repository.

### 4.1. Các mục tiêu cần khảo sát (Discovery Targets)

Agent phải tìm kiếm và thu thập bằng chứng cụ thể cho các yếu tố sau:
1. **Yêu cầu & Tiêu chí nghiệm thu (Task & Acceptance Criteria):** Đọc kỹ prompt của user, issue, PR description hoặc tài liệu đặc tả liên quan.
2. **Tập tin thay đổi (Changed Files):** Xác định danh sách chính xác các file đã được thêm mới, sửa đổi hoặc xóa bỏ (sử dụng git diff hoặc kiểm tra file hệ thống).
3. **Tập tin nguồn liên quan (Relevant Source Files):** Các file phụ thuộc trực tiếp hoặc gián tiếp vào tập tin thay đổi.
4. **Điểm nhập và Định tuyến (Entry Points & Routes):** Route API, Controller, Page/Screen của Frontend hoặc Mobile.
5. **Mô hình hợp đồng & DTOs (Contracts & DTOs):** Request DTO, Response DTO, Validation rules.
6. **Thực thể & Đối tượng CSDL (Database Objects):** Bảng, cột, khóa chính, khóa ngoại, chỉ mục, ràng buộc CHECK, trigger, stored procedure, migration scripts.
7. **Cấu hình & Đăng ký dịch vụ (Configuration & DI Wiring):** Dependency Injection container, appsettings, biến môi trường, middleware pipeline.
8. **Bộ kiểm thử hiện hữu (Existing Tests):** Unit tests, Integration tests, E2E tests liên quan đến phạm vi thay đổi.
9. **Tài liệu kỹ thuật (Documentation):** API specs, ERD diagrams, README, architecture notes.
10. **Bằng chứng xác minh trước đó (Prior Verification Evidence):** Test runs logs, CI build artifacts, execution traces.

### 4.2. Nguyên tắc Discovery: Evidence-First

- **Không giả định đường dẫn hay cấu trúc:** Nếu repository chưa chứng minh sự tồn tại của một file/thư mục, không được suy đoán rằng nó tồn tại.
- **Ghi nhận NOT FOUND / NOT VERIFIED:** Nếu không tìm thấy bằng chứng vật lý cho một thành phần được yêu cầu, phải đánh dấu rõ ràng là `NOT FOUND` hoặc `NOT VERIFIED`. Tuyệt đối không được coi việc "không thấy lỗi" là đồng nghĩa với việc thành phần đó đã tồn tại và đạt yêu cầu (`PASS`).

---

## 5. Verification Loop

Verification Loop là một chu trình lặp có cấu trúc gồm 14 giai đoạn logic, được tổ chức thành 10 bước thực thi cốt lõi kèm theo các cổng thẩm định, đánh giá và ban hành phán quyết.

### 5.1. Mô hình chu trình 14 giai đoạn

```text
       +-------------------------------------------------------+
       | 1. Define Verification Scope (Xác định phạm vi)       |
       +---------------------------+---------------------------+
                                   |
                                   v
       +-------------------------------------------------------+
       | 2. Establish Evidence Baseline (Thiết lập baseline)   |
       +---------------------------+---------------------------+
                                   |
                                   v
       +-------------------------------------------------------+
       | 3. Inspect Implementation (Kiểm tra mã nguồn)         |
       +---------------------------+---------------------------+
                                   |
                                   v
       +-------------------------------------------------------+
       | 4. Trace Dependencies & Layers (Theo vết liên tầng)   |
       +---------------------------+---------------------------+
                                   |
                                   v
       +-------------------------------------------------------+
       | 5. Verify API / Contract Boundary (Kiểm tra API)      |
       +---------------------------+---------------------------+
                                   |
                                   v
       +-------------------------------------------------------+
       | 6. Verify Security & Auth Boundary (Kiểm tra bảo mật) |
       +---------------------------+---------------------------+
                                   |
                                   v
       +-------------------------------------------------------+
       | 7. Verify Data / DB Boundary (Kiểm tra CSDL)          |
       +---------------------------+---------------------------+
                                   |
                                   v
       +-------------------------------------------------------+
       | 8. Execute / Inspect Tests (Kiểm tra bộ test)         |
       +---------------------------+---------------------------+
                                   |
                                   v
       +-------------------------------------------------------+
       | 9. Inspect Runtime Evidence (Kiểm tra runtime)        |
       +---------------------------+---------------------------+
                                   |
                                   v
       +-------------------------------------------------------+
       | 10. Check Regression (Kiểm định hồi quy)              |
       +---------------------------+---------------------------+
                                   |
                                   v
       +-------------------------------------------------------+
       | 11. Verify Documentation (So khớp tài liệu)           |
       +---------------------------+---------------------------+
                                   |
                                   v
       +-------------------------------------------------------+
       | 12. Evaluate Findings (Đánh giá các phát hiện)        |
       +---------------------------+---------------------------+
                                   |
                                   v
       +-------------------------------------------------------+
       | 13. Determine Confidence (Xác định độ tin cậy)        |
       +---------------------------+---------------------------+
                                   |
                                   v
       +-------------------------------------------------------+
       | 14. Produce Final Verdict (Ban hành phán quyết)       |
       +-------------------------------------------------------+
```

### 5.2. Tính phi tuyến tính và vòng lặp phản hồi (Non-Linear Feedback Loop)

Verification Loop **không phải là một đường thẳng một chiều (linear-only)**. Trong quá trình thực hiện:
- Nếu bước kiểm tra liên tầng (Bước 4) phát hiện một dependency chưa được đăng ký trong DI, Agent phải lập tức quay lại Bước 3 để kiểm tra lại tính hoàn chỉnh của mã nguồn.
- Nếu bước kiểm tra bảo mật (Bước 6) phát hiện lỗ hổng IDOR, Agent phải lập tức mở rộng phạm vi kiểm tra dữ liệu (Bước 7) và yêu cầu bổ sung test tiêu cực (Bước 8).
- Nếu phát hiện bất kỳ bằng chứng mâu thuẫn (Contradicted Evidence) nào ở các bước sau, chu trình bắt buộc phải quay lại bước thiết lập baseline để làm rõ sự thật khách quan.

---

## 6. Step 1 — Define Verification Scope

Xác định phạm vi là bước then chốt đầu tiên để tránh hai cạm bẫy: kiểm tra hời hợt bỏ sót rủi ro, hoặc kiểm tra lan man vượt ngoài thẩm quyền tác vụ.

### 6.1. Bộ câu hỏi định hình phạm vi (Scope Questions)

Trước khi kiểm tra, Agent phải trả lời rõ ràng các câu hỏi:
1. **What changed?** Chính xác những tệp tin, lớp, hàm, bảng CSDL nào đã được thêm mới hoặc chỉnh sửa?
2. **Why changed?** Mục tiêu nghiệp vụ hoặc lý do kỹ thuật của thay đổi này là gì?
3. **Expected behavior?** Hành vi kỳ vọng ở trạng thái thành công (happy path) và các trạng thái lỗi/biên (edge cases) là gì?
4. **In Scope?** Những thành phần, luồng xử lý và ranh giới kỹ thuật nào bắt buộc phải xác minh trong tác vụ này?
5. **Out of Scope?** Những module, tính năng hoặc hệ thống bên ngoài nào không thuộc phạm vi tác vụ hiện tại?
6. **Acceptance Criteria?** Các tiêu chí cụ thể, đo lường được để xác nhận tác vụ đã hoàn thành là gì?
7. **Dependencies?** Thay đổi này phụ thuộc vào những module nào và những module nào đang phụ thuộc vào nó?
8. **Risk Level?** Mức độ rủi ro của thay đổi đối với an ninh, tài chính, dữ liệu và hiệu năng là gì (Thấp, Trung bình, Cao, Nghiêm trọng)?
9. **Relevant Architectural Boundaries?** Ranh giới nào bị tác động: API, Application, Database, Security, UI?

### 6.2. Nguyên tắc kiểm soát phạm vi (Scope Control)

- **Không tự tiện mở rộng phạm vi kiểm toán toàn hệ thống:** Nếu tác vụ chỉ yêu cầu sửa đổi một endpoint thuộc module Danh mục thuốc (Medicine Catalog), Agent không được tự ý thực hiện một cuộc kiểm toán toàn diện sang module Bán hàng (Sales) hoặc Kê đơn, trừ khi phát hiện liên kết phụ thuộc trực tiếp có nguy cơ phá vỡ hệ thống.
- **Không thu hẹp phạm vi tùy tiện:** Nếu thay đổi chạm vào bảng CSDL có dữ liệu dùng chung hoặc ranh giới phân quyền chi nhánh, Agent bắt buộc phải đưa việc xác minh cô lập chi nhánh và toàn vẹn dữ liệu vào phạm vi bắt buộc, không được bỏ qua chỉ vì "người dùng không nhắc tới".

---

## 7. Step 2 — Establish Evidence Baseline

Verification Loop yêu cầu mọi kết luận phải được xây dựng trên bằng chứng khách quan, được đánh giá theo mô hình độ tin cậy ngữ cảnh thay vì áp dụng một hệ thống phân cấp tĩnh, máy móc.

### 7.1. Mô hình độ tin cậy bằng chứng (Evidence Reliability Model)

Bằng chứng trong hệ thống không được đánh giá đơn thuần dựa trên loại nguồn (source type), mà bắt buộc phải được thẩm định theo **7 chiều kích ngữ cảnh**:
1. **Tính thích đáng (Relevance):** Bằng chứng có liên quan trực tiếp đến yêu cầu và tiêu chí nghiệm thu đang xét hay không?
2. **Tính áp dụng (Applicability):** Bằng chứng có phù hợp với phạm vi tác vụ (scope) và ranh giới kỹ thuật đang xác minh không?
3. **Tính cập nhật (Freshness):** Bằng chứng có phản ánh trạng thái mới nhất của hệ thống hay đã bị lỗi thời sau các thay đổi gần đây?
4. **Tính trực tiếp (Directness):** Bằng chứng là quan sát trực tiếp (log thực thi, mã nguồn thực tế) hay suy diễn gián tiếp qua nhiều bước?
5. **Tính nhất quán (Consistency):** Bằng chứng có đồng thuận với các nguồn dữ liệu độc lập khác hay tồn tại mâu thuẫn?
6. **Tính tái lập (Reproducibility):** Kết quả có thể được tái hiện một cách độc lập và ổn định không?
7. **Độ bao phủ phạm vi (Scope Coverage):** Bằng chứng bao quát được bao nhiêu phần trăm không gian trạng thái cần xác minh?

```text
+-----------------------------------------------------------------------------------------+
|                               EVIDENCE RELIABILITY MODEL                                |
|                                                                                         |
|   [Relevance]   *   [Applicability]   *   [Freshness]   *   [Directness]                |
|                      *   [Consistency]   *   [Reproducibility]                          |
|                                                                                         |
|  - Physical Code:       Giá trị cao nhất để xác minh tính hiện diện triển khai          |
|  - Runtime Evidence:    Giá trị cao nhất để xác minh hành vi vận hành thực tế           |
|  - Test Execution:      Giá trị cao nhất để xác minh logic trong phạm vi test           |
|  - Documentation:       Giá trị cao cho thiết kế kỳ vọng, hợp đồng và tiêu chí nghiệm thu|
+-----------------------------------------------------------------------------------------+
```

> [!IMPORTANT]
> **Nguyên tắc cốt lõi:** *"Bằng chứng phải được đánh giá dựa trên tính áp dụng và tính nhất quán, không dựa trên loại nguồn một cách cô lập (Evidence must be evaluated by applicability and consistency, not by source type alone)"*.
> - Mã nguồn vật lý có giá trị quyết định đối với việc xác minh hiện diện triển khai.
> - Bằng chứng runtime có giá trị quyết định đối với hành vi vận hành thực tế.
> - Bằng chứng kiểm thử có giá trị quyết định đối với hành vi nằm trong phạm vi ca kiểm thử.
> - Tài liệu có giá trị xác lập thiết kế kỳ vọng, hợp đồng, quyết định kiến trúc và tiêu chí nghiệm thu, nhưng không tự thân chứng minh hiện trạng triển khai.
> - **Xử lý xung đột:** Nếu mã nguồn thể hiện một hành vi nhưng runtime hoặc test cho thấy hành vi trái ngược, Agent không được tự ý chọn mã nguồn làm sự thật tuyệt đối; tình huống này bắt buộc phải được đánh dấu là `CONTRADICTED` và yêu cầu điều tra làm rõ.

### 7.2. Các chân lý bằng chứng cốt lõi (Core Evidence Truths)

- **Documentation ≠ Implementation Evidence:** Tài liệu thiết kế ghi nhận một tính năng không phải là bằng chứng cho thấy tính năng đó đã được triển khai trong mã nguồn thực tế. Tuy nhiên, tài liệu là căn cứ quan trọng để xác định kỳ vọng nghiệp vụ ban đầu.
- **ERD ≠ Database Implementation Evidence:** Sơ đồ ERD phác thảo thiết kế quan hệ thực thể kỳ vọng, nhưng không chứng minh trong CSDL thực tế đã tồn tại bảng, cột và các ràng buộc khóa ngoại đó.
- **API Documentation ≠ Live Endpoint Behavior:** Tài liệu OpenAPI/Swagger chỉ ra hợp đồng kỳ vọng, nhưng không chứng minh endpoint trên máy chủ đang hoạt động và xử lý đúng mã trạng thái HTTP.
- **Test File Existence ≠ Passing Test Evidence:** Sự hiện diện của một tệp test chỉ chứng minh mã kiểm thử đã được viết, không chứng minh test đó đã được thực thi, còn phù hợp hay đã vượt qua (PASS).
- **Physical & Runtime Evidence Precedence:** Bằng chứng vật lý và bằng chứng runtime có giá trị ưu tiên hơn so với tài liệu không có căn cứ hoặc các giả định chủ quan khi xác minh hành vi thực tế; mọi bằng chứng mâu thuẫn phải được điều tra thay vì tự tiện loại bỏ.

---

## 8. Step 3 — Verify Implementation

Bước này kiểm tra trực tiếp mã nguồn vật lý để xác nhận tính tồn tại, tính hoàn chỉnh và chất lượng kết nối của các thành phần phần mềm.

### 8.1. Các nội dung kiểm tra mã nguồn bắt buộc

Agent phải thẩm tra mã nguồn theo danh sách kiểm tra sau:
1. **Sự hiện diện của tệp tin (File Existence):** Tất cả các tệp tin theo yêu cầu cấu trúc đều hiện diện tại đúng vị trí quy định.
2. **Sự hiện diện của định danh (Symbol Existence):** Các lớp (classes), giao diện (interfaces), phương thức (methods), thuộc tính (properties) cần thiết đều đã được khai báo với đúng kiểu dữ liệu và tên gọi.
3. **Đường dẫn thực thi trọn vẹn (Executable Implementation Path):** Mã nguồn phải có thân hàm thực thi logic nghiệp vụ cụ thể; không được chứa mã giữ chỗ (placeholder), stub trống, `throw NotImplementedException()`, hoặc `TODO` chưa hoàn thiện.
4. **Kết nối phụ thuộc (Connected Dependencies):** Mọi phụ thuộc được inject hoặc truyền vào đều phải được khởi tạo và cấu hình hợp lệ; không có lớp hoặc dịch vụ nào bị cô lập (orphan/dead code).
5. **Không có logic không thể chạm tới (No Unreachable Logic):** Không có các nhánh rẽ điều kiện luôn luôn đúng/sai dẫn đến mã nguồn bị chết.
6. **Đăng ký dịch vụ hoàn chỉnh (Wiring & Registration):** Dịch vụ, repository, middleware, route handler phải được đăng ký đầy đủ trong DI container hoặc cơ chế wiring tương đương của framework (nếu framework sử dụng DI).
7. **Khớp nối yêu cầu (Requirement Matching):** Logic xử lý bên trong các hàm phải phản ánh chính xác các quy tắc nghiệp vụ quy định trong yêu cầu.

### 8.2. Phân loại trạng thái triển khai (Implementation Status)

Mỗi thành phần được kiểm tra phải được phân loại rõ ràng thành một trong bốn trạng thái:
- **IMPLEMENTED:** Mã nguồn tồn tại đầy đủ, có thân hàm hoàn chỉnh, được kết nối trọn vẹn và khớp với yêu cầu nghiệp vụ.
- **PARTIALLY IMPLEMENTED:** Mã nguồn đã được tạo một phần nhưng còn thiếu các nhánh xử lý quan trọng, còn sót logic giữ chỗ hoặc chưa được kết nối đầy đủ với các tầng khác.
- **NOT IMPLEMENTED:** Thành phần hoàn toàn chưa được viết trong mã nguồn dù yêu cầu có đề cập.
- **NOT VERIFIED:** Chưa đủ bằng chứng vật lý hoặc chưa khảo sát được mã nguồn để khẳng định trạng thái triển khai.

---

## 9. Step 4 — Cross-Layer Trace

Một hệ thống doanh nghiệp như PharmaBranch hoạt động dựa trên sự phối hợp đồng bộ giữa các tầng kiến trúc. Kiểm tra riêng lẻ một tầng là không đủ; Agent bắt buộc phải lần vết (trace) luồng xử lý xuyên suốt các tầng.

### 9.1. Lược đồ luồng liên tầng minh họa (Illustrative Cross-Layer Flow)

Luồng xử lý điển hình trong kiến trúc Client-Server của hệ thống:

```text
[Client Layer]         UI Component / Screen
      |                (React / Flutter - if present)
      v
[Network Layer]        API Client / HTTP Request
      |                (Axios / Fetch / Dio - if present)
      v
[API Boundary]         Controller / Route Handler / DTO Validation
      |                (ASP.NET Core Endpoint - if present)
      v
[Application Layer]    Application Service / Use Case Handler
      |                (Business Rules Orchestration)
      v
[Domain Layer]         Domain Entities / Invariants / Business Calculations
      |                (Core Business Rules)
      v
[Persistence Layer]    Repository / Data Access Component
      |                (EF Core / Dapper / ADO.NET - if present)
      v
[Database Layer]       Microsoft SQL Server
                       (Tables / Constraints / RLS / Transactions)
```

> [!NOTE]
> Sơ đồ trên chỉ mang tính chất **minh họa (illustrative)**. Repository thực tế có thể có ít tầng hơn hoặc nhiều tầng hơn tùy thuộc vào thiết kế kiến trúc đã phê duyệt. Skill 09 không áp đặt số lượng tầng cố định; Agent phải đánh giá dựa trên kiến trúc thực tế của repository. Nếu một tầng không tồn tại trong thiết kế được duyệt, không được tự ý đánh FAIL.

### 9.2. Tiêu chí xác minh liên tầng (Cross-Layer Verification Criteria)

Khi lần vết một tính năng qua các tầng, Agent phải xác nhận:
1. **Tính tương thích tham số:** Dữ liệu từ UI được đóng gói chính xác vào Request DTO, truyền qua HTTP không bị mất mát hay sai lệch kiểu dữ liệu.
2. **Tính chuyển tiếp hợp lệ:** Controller giải nén Request DTO, thực hiện validation và chuyển tiếp tham số đã thẩm định sang Application Service mà không bỏ qua ranh giới nghiệp vụ.
3. **Toàn vẹn luồng điều khiển:** Application Service áp dụng quy tắc nghiệp vụ, gọi Persistence layer để tương tác CSDL, và nhận lại kết quả.
4. **Không rò rỉ mô hình nội bộ:** Entity CSDL không được trả thẳng về cho Client mà phải được ánh xạ (map) sang Response DTO trước khi trả qua API boundary.
5. **Xử lý lỗi đồng bộ:** Lỗi phát sinh ở tầng CSDL (vi phạm ràng buộc, deadlock) hoặc tầng nghiệp vụ (hết hàng, sai quyền) phải được chuyển dịch có kiểm soát thành mã lỗi HTTP và thông báo giao diện phù hợp, không làm sập ứng dụng hay rò rỉ stack trace.

---

## 10. Step 5 — Verify API / Contract Boundary

Nếu thay đổi tác động đến giao diện lập trình ứng dụng (API), Agent có nhiệm vụ **xác minh tính tuân thủ** của endpoint đối với `Rule 08` (API Contract), hợp đồng API đã phê duyệt, và quy ước kiến trúc hiện hành của dự án.

> [!IMPORTANT]
> **Ranh giới sở hữu:** Skill 09 **KHÔNG định nghĩa quy ước API mới** và không đóng vai trò chính sách thiết kế API. Skill 09 chỉ xác minh xem hiện trạng triển khai có khớp với hợp đồng và chính sách đã được xác lập hay không.
> 
> **Thứ bậc nguồn xác minh API:**
> 1. `Rule 08` (API Contract Policy tối cao)
> 2. Hợp đồng / Đặc tả API đã được phê duyệt (Approved API Contract / Specs)
> 3. Quy ước hiện hữu đã được thiết lập trong repository (Existing Repository Conventions)
> 4. Quyết định kiến trúc đã được phê duyệt (Approved Architecture Decisions)
> 5. Bằng chứng triển khai mã nguồn thực tế (Physical Implementation Evidence)
> 6. Bộ kiểm thử hợp đồng và tích hợp (Contract / Integration Tests)
> 7. Tài liệu dự án (Documentation)
> 8. Giả định chủ quan (Assumptions — Không có giá trị pháp lý)

### 10.1. Các nội dung kiểm tra ranh giới API (API Verification Checklist)

Các mục dưới đây là **các mẫu hình bằng chứng và tiêu chí kiểm tra minh họa (illustrative verification examples & evidence patterns)** dựa trên Rule 08, giúp Agent xác minh xem endpoint thực tế có tuân thủ đúng yêu cầu hay không. Project không bắt buộc phải sử dụng một quy ước cụ thể nếu quy ước đó không bắt nguồn từ Rule 08, approved API contract hoặc repository evidence; Agent không tự áp đặt naming convention, HTTP method, status code, error format, pagination, date/time, numeric representation, hay response structure:

1. **Xác minh Định danh URI & Cấu trúc Tài nguyên:**
   - Kiểm tra xem URI có tuân thủ quy ước REST của Rule 08 hay không (ví dụ mẫu: sử dụng danh từ số nhiều, chữ thường, nối bằng dấu gạch ngang kebab-case như `/api/v1/medicines`, `/api/v1/sale-orders`).
   - Xác minh rằng URI không chứa động từ CRUD (như `/api/v1/get-medicines` hay `/api/v1/delete-order`) trừ khi hành động phi tài nguyên được kiến trúc phê duyệt rõ ràng.
   - Kiểm tra cấu trúc tài nguyên con xem có phản ánh đúng quan hệ sở hữu theo đặc tả không (ví dụ mẫu: `/api/v1/sale-orders/{id}/items`).
2. **Xác minh Ngữ nghĩa Phương thức HTTP (HTTP Semantics):**
   - Xác minh xem phương thức HTTP có đúng ngữ nghĩa quy định không:
     - `GET`: Thao tác đọc an toàn và có tính lũy bao (idempotent), không gây tác dụng phụ làm thay đổi dữ liệu trên máy chủ.
     - `POST`: Thao tác tạo mới tài nguyên hoặc kích hoạt hành vi nghiệp vụ.
     - `PUT`: Thao tác thay thế toàn bộ tài nguyên theo ngữ nghĩa hợp đồng.
     - `PATCH`: Thao tác cập nhật một phần theo ngữ nghĩa hợp đồng.
     - `DELETE`: Thao tác xóa hoặc hủy kích hoạt tài nguyên.
3. **Xác minh Mô hình DTO & Phòng chống Mass Assignment:**
   - Kiểm tra xem endpoint có sử dụng Request DTO riêng biệt hay không, đảm bảo client chỉ có thể gửi các trường được phép thay đổi.
   - Xác minh rằng endpoint không trả thẳng Entity CSDL nội bộ ra bên ngoài; Response DTO phải loại bỏ các khóa nội bộ hoặc thông tin nhạy cảm.
4. **Xác minh Thẩm định Dữ liệu Đầu vào (Input Validation):**
   - Kiểm tra xem dữ liệu đầu vào có được thẩm định chặt chẽ ở ranh giới API phía máy chủ hay không.
   - Xác minh xem khi có lỗi validation, phản hồi có trả về đúng mã trạng thái (ví dụ: `400 Bad Request`) và cấu trúc lỗi máy đọc được theo quy ước hệ thống (ví dụ mẫu: Problem Details RFC 7807 kèm danh sách lỗi chi tiết) hay không.
5. **Xác minh Mã trạng thái HTTP (HTTP Status Codes):**
   - Đối chiếu mã trạng thái trả về với đặc tả hợp đồng: `200 OK`, `201 Created`, `204 No Content`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`, `500 Internal Server Error`.
   - Xác minh xem hệ thống có vi phạm lỗi bọc mã lỗi trong `200 OK` hay không (nghiêm cấm trả `200 OK` khi xử lý nghiệp vụ thất bại).
6. **Xác minh Phân trang, Lọc & Sắp xếp (Pagination, Filtering, Sorting):**
   - Đối với collection endpoints, kiểm tra xem có cơ chế giới hạn phân trang hay không (ví dụ mẫu: tham số `page`, `pageSize` với ngưỡng tối đa theo Rule 08).
   - Kiểm tra xem siêu dữ liệu phân trang (như `totalCount`, `totalPages`, `page`, `pageSize`) có được trả về đầy đủ theo hợp đồng hay không.
7. **Xác minh Định dạng Thời gian & Tiền tệ:**
   - Kiểm tra xem dữ liệu thời gian có tuân thủ chuẩn quy định (ví dụ mẫu: ISO 8601 UTC) hay không.
   - Kiểm tra xem các trường tiền tệ và số lượng có duy trì độ chính xác số học (ví dụ mẫu: kiểu số chính xác `decimal`, không dùng dấu phẩy động `float/double`) hay không.
8. **Xác minh Tính lũy bao (Idempotency):**
   - Đối với các thao tác nhạy cảm dễ bị gọi lại nhiều lần do lỗi mạng (ví dụ: tạo đơn, thanh toán), kiểm tra xem cơ chế lũy bao (ví dụ mẫu: header `Idempotency-Key` theo Rule 08) có được triển khai và bảo vệ đúng cách hay không.

> [!NOTE]
> Các quy ước trên là ví dụ minh họa kiểm tra; yêu cầu thực tế bắt nguồn từ Rule 08 và hợp đồng API đã duyệt. Nếu repository có tài liệu OpenAPI/Swagger, nó chỉ được xem là bằng chứng nếu được chứng minh là sinh ra từ mã nguồn thực tế hoặc đồng bộ với mã nguồn; không mặc định coi OpenAPI là nguồn sự thật tuyệt đối nếu mã nguồn có sự sai lệch.

---

## 11. Step 6 — Verify Security / Authorization Boundary

An ninh là ranh giới sống còn của hệ thống PharmaBranch. Verification Loop bắt buộc phải kiểm tra an ninh phía máy chủ dựa trên `Rule 03` (Security), `Rule 04` (RBAC), và `Rule 05` (Authorization).

### 11.1. Phân định rõ ràng các khái niệm an ninh

Agent phải phân biệt rạch ròi giữa 5 khái niệm an ninh độc lập:
1. **Authentication (Xác thực):** *"Bạn là ai?"* (Thẩm định danh tính qua cơ chế xác thực máy chủ, ví dụ: kiểm tra token JWT hợp lệ, chưa hết hạn, chữ ký đúng nếu hệ thống áp dụng token auth).
2. **RBAC (Vai trò & Năng lực):** *"Vai trò của bạn có quyền năng gì?"* (Ánh xạ Role sang tập hợp Permission theo ma trận quyền).
3. **Runtime Authorization (Thẩm định quyền thực thi):** *"Trong ngữ cảnh hiện tại, bạn có được thực hiện hành động này không?"* (Kiểm tra Permission + Resource + Action).
4. **Resource Ownership (Quyền sở hữu):** *"Tài nguyên này có thuộc quyền quản lý của bạn không?"* (Kiểm tra chủ sở hữu thực tế, chống IDOR/BOLA).
5. **Branch Isolation (Cô lập chi nhánh):** *"Dữ liệu này có thuộc chi nhánh được cấp quyền của bạn không?"* (Ranh giới tenant độc lập theo Rule 06).

```text
+------------------------------------------------------------------------------------------+
| AUTHENTICATION   ---> Xác định danh tính (valid server security context / token)         |
|       |                                                                                  |
|       v                                                                                  |
| RBAC             ---> Xác định quyền năng của Role (Permission Matrix)                   |
|       |                                                                                  |
|       v                                                                                  |
| AUTHORIZATION    ---> Thẩm định quyền runtime trên Action và Resource                    |
|       |                                                                                  |
|       v                                                                                  |
| OWNERSHIP / IDOR ---> Thẩm định tài nguyên có thuộc đối tượng/người dùng hợp lệ không   |
|       |                                                                                  |
|       v                                                                                  |
| BRANCH ISOLATION ---> Thẩm định dữ liệu thuộc đúng chi nhánh (ChiNhanhId scope)          |
+------------------------------------------------------------------------------------------+
```

### 11.2. Tiêu chí xác minh an ninh bắt buộc

- **Thực thi hoàn toàn ở phía Server (Server-Side Enforcement):** Tuyệt đối không chấp nhận bằng chứng an ninh chỉ dựa trên giao diện (nút bấm bị ẩn, menu bị khóa, route guard của frontend). Mọi endpoint API bảo vệ đều phải có bộ lọc xác thực và phân quyền phía server.
- **Không tin tưởng dữ liệu do Client gửi:** Các tham số nhạy cảm như `userId`, `role`, `branchId` không bao giờ được lấy từ request body hay query string để làm căn cứ phân quyền; chúng bắt buộc phải được trích xuất từ authenticated security context đáng tin cậy phía máy chủ (ví dụ: claims của JWT nếu hệ thống sử dụng JWT).
- **Phòng chống IDOR / BOLA:** Kiểm tra xem người dùng có thể truy cập hoặc chỉnh sửa tài nguyên của người dùng khác hoặc chi nhánh khác bằng cách thay đổi ID trên URL (`GET /api/orders/{id}`) hay không.
- **Phòng chống leo thang đặc quyền (Privilege Escalation):**
  - *Leo thang dọc (Vertical):* Role cấp thấp (Sales, Warehouse) có thể gọi các API quản trị của Owner/Manager hay không?
  - *Leo thang ngang (Horizontal):* Nhân viên chi nhánh A có thể đọc/ghi dữ liệu của chi nhánh B hay không?
  - *Tự nâng quyền (Self-Escalation):* Người dùng có thể tự gán role hoặc thêm permission cho chính mình qua request body không?
- **Bảo vệ dữ liệu nhạy cảm:** Mật khẩu phải được lưu trữ dưới dạng băm an toàn theo chính sách của `Rule 03` (các thuật toán như BCrypt, Argon2, PBKDF2 chỉ là ví dụ minh họa; cơ chế thực tế phải tuân thủ Rule 03 và cấu hình bảo mật được duyệt); private keys, connection strings, JWT secrets không bao giờ được xuất hiện trong mã nguồn, logs hay API response.

> [!NOTE]
> Các thuật ngữ công nghệ bảo mật (như JWT, BCrypt, Argon2, PBKDF2) nêu trên chỉ là **ví dụ minh họa (illustrative examples)**. Cơ chế bảo mật thực tế bắt buộc phải được xác minh đối chiếu với Rule 03, kiến trúc bảo mật đã phê duyệt và bằng chứng vật lý trong repository. Skill 09 không áp đặt bất kỳ công nghệ bảo mật nào ngoài quy định của Rule 03.

---

## 12. Step 7 — Verify Data / Database Boundary

Nếu thay đổi có tương tác với cơ sở dữ liệu, Agent có nhiệm vụ **xác minh tính tuân thủ** của tầng dữ liệu đối với `Rule 02` (Transactions & Concurrency), `Rule 06` (Branch Isolation), `Rule 07` (Database Integrity) và các quy chuẩn kỹ thuật trong `Skill 07`.

> [!IMPORTANT]
> **Ranh giới sở hữu:** Skill 09 **KHÔNG tự định nghĩa chính sách CSDL** và không áp đặt quy tắc schema mới. Mọi tiêu chuẩn toàn vẹn, ranh giới giao dịch và cơ chế xử lý đồng thời phải được dẫn xuất từ Rule 02, Rule 06, Rule 07, Skill 07, kiến trúc đã phê duyệt, schema thực tế, migration scripts, truy vấn CSDL, kiểm thử và bằng chứng runtime.

### 12.1. Các nội dung kiểm tra ranh giới Cơ sở dữ liệu (Database Verification Checklist)

Các mục dưới đây là **tiêu chí xác minh và mẫu hình bằng chứng** để Agent thẩm tra tầng CSDL dựa trên các Rules tương ứng:

1. **Xác minh Khóa chính & Toàn vẹn Tham chiếu (PK & FK Integrity):**
   - Xác minh xem các bảng thực thể nghiệp vụ có định nghĩa khóa chính (PK) hợp lệ, bất biến và `NOT NULL` theo Rule 07 hay không.
   - Kiểm tra các mối quan hệ cha-con (ví dụ: `HOA_DON` -> `HOA_DON_ITEM`, `TON_KHO` -> `CHI_NHANH`) xem có được ràng buộc bằng khóa ngoại (FK) tường minh để ngăn chặn bản ghi mồ côi (orphan records) hay không.
   - Xác minh xem các bảng nhạy cảm (tài chính, bán hàng, tồn kho, kiểm toán) có áp dụng đúng chính sách hành vi xóa (`NO ACTION` / `RESTRICT`, tránh `CASCADE DELETE`) theo Rule 07 để bảo vệ dữ liệu lịch sử hay không.
2. **Xác minh Ràng buộc Miền giá trị (Domain & CHECK Constraints):**
   - Kiểm tra xem các trường số lượng có ràng buộc chống giá trị âm (ví dụ: `CHECK (so_luong >= 0)` khi nghiệp vụ yêu cầu không âm) hay không.
   - Kiểm tra xem các trường đơn giá và tổng tiền có ràng buộc chống giá trị âm (ví dụ: `CHECK (don_gia >= 0)`) hay không.
   - Xác minh xem trạng thái vòng đời thực thể có được giới hạn trong danh mục miền giá trị hợp lệ hay không.
   - Kiểm tra xem các ràng buộc thời gian (ví dụ: ngày hết hạn sau ngày sản xuất) có được bảo đảm ở tầng CSDL hay không.
3. **Xác minh Tính duy nhất (Uniqueness Constraints):**
   - Kiểm tra xem các định danh nghiệp vụ (mã thuốc, mã vạch, số hóa đơn) có ràng buộc `UNIQUE` hoặc unique index hay không.
   - Đối với các định danh có phạm vi chi nhánh, xác minh xem ràng buộc duy nhất phức hợp (composite unique) có bao gồm phạm vi chi nhánh theo đúng thiết kế hay không.
4. **Xác minh Ngữ nghĩa NULL & Giá trị Mặc định:**
   - Kiểm tra xem các thuộc tính bắt buộc có được khai báo `NOT NULL` theo đúng bất biến miền (domain invariants) hay không.
   - Xác minh xem giá trị mặc định (`DEFAULT`) có bị lạm dụng để che giấu việc thiếu sót dữ liệu đầu vào cần thiết hay không.
5. **Xác minh Ranh giới Giao dịch ACID (Transaction Boundaries):**
   - Transaction boundary được xác minh khi thao tác nghiệp vụ hoặc kiến trúc thực sự yêu cầu tính nguyên tử (atomicity) hoặc tính nhất quán (consistency) theo Rule 02 và Rule 07. Không mặc định mọi thao tác đa bảng đều bắt buộc phải có transaction nếu kiến trúc hoặc nghiệp vụ không đòi hỏi.
   - Kiểm tra xem khi xảy ra lỗi ở bất kỳ bước nào trong ranh giới giao dịch áp dụng, toàn bộ thao tác có được rollback trọn vẹn để tránh trạng thái nửa vời hay không.
6. **Xác minh Kiểm soát Xử lý Đồng thời (Concurrency Control):**
   - Xác minh rằng cơ chế kiểm soát đồng thời được áp dụng (nếu nghiệp vụ có yêu cầu chống race condition/tranh chấp theo Rule 02) là thích hợp với ngữ nghĩa nhất quán của nghiệp vụ và có bằng chứng vật lý hỗ trợ. Không áp đặt một cơ chế khóa (locking mechanism) cụ thể hoặc mẫu hình giao dịch cụ thể ngoài thiết kế được duyệt.
   - Kiểm tra xem có tồn tại mẫu hình cập nhật không an toàn (như `Read-then-Update` không có cơ chế bảo vệ đồng thời đối với tài nguyên dùng chung) hay không.
7. **Xác minh Đường dẫn Cô lập Chi nhánh (Branch Isolation Path):**
   - Xác minh rằng dữ liệu thuộc phạm vi chi nhánh có **đường dẫn cô lập chi nhánh có thể thực thi và chính xác (enforceable branch isolation path)** phù hợp với Rule 06, kiến trúc và schema thực tế. Không mặc định mọi bảng đều phải trực tiếp có cột branch_id (phân biệt đúng thực thể global/shared, thực thể có branch FK trực tiếp, hoặc thực thể có phạm vi gián tiếp qua quan hệ cha-con).
   - Nếu hệ thống áp dụng SQL Server Row-Level Security (RLS) hoặc session context, kiểm tra xem predicate có đánh giá đúng ngữ cảnh chi nhánh đã xác thực (ví dụ: `SESSION_CONTEXT(N'BranchId')`) và fail-closed khi thiếu context hay không.
8. **Xác minh An toàn Migration & Scripts:**
   - Kiểm tra xem các thay đổi schema có được ghi nhận trong migration scripts có phiên bản, có tính lũy bao và có khả năng rollback an toàn theo Rule 07 hay không.
   - Xác minh xem có lệnh xóa phá hủy dữ liệu nguy hiểm nào được thực thi mà không có đánh giá tác động và phương án sao lưu hay không.

> [!CAUTION]
> Tuyệt đối không bao giờ kết luận *"Câu truy vấn CSDL chạy được = Toàn vẹn CSDL đạt yêu cầu"*. Một câu lệnh SQL có thể chạy thành công nhưng vẫn vi phạm ranh giới cô lập chi nhánh, gây race condition hoặc bỏ sót ràng buộc toàn vẹn. Mọi hành vi CSDL phải được đối chiếu với Rule 02, 06, 07 và Skill 07.

---

## 13. Step 8 — Verify Tests

Verification Loop kiểm chứng **BẰNG CHỨNG KIỂM THỬ (Test Evidence)**, không định nghĩa lại chiến lược viết test của `Skill 08`.

### 13.1. Phân định các khía cạnh của bằng chứng kiểm thử

Khi đánh giá test, Agent phải phân biệt rạch ròi giữa các trạng thái:
- **Test Exists (Test có tồn tại):** File test và hàm test có hiện diện vật lý trong repository.
- **Test Executed (Test đã được thực thi):** Bộ test đã thực sự được chạy trong phiên làm việc hoặc CI runner hiện tại.
- **Test Passed (Test vượt qua):** Các assertion kiểm tra thực tế trả về kết quả thành công.
- **Test Failed (Test thất bại):** Có ít nhất một assertion thất bại hoặc phát sinh lỗi runtime.
- **Test Scope (Phạm vi test):** Test đang bao phủ đơn vị nhỏ (Unit), luồng tích hợp (Integration) hay luồng đầu cuối (E2E).
- **Test Relevance (Tính liên quan của test):** Test có thực sự kiểm chứng logic của thay đổi mới hay chỉ là test cũ không liên quan.

### 13.2. Chân lý phân tầng kiểm thử (Test Hierarchy Truths)

Agent phải khắc ghi các nguyên tắc giải thích kết quả test:
- **Unit Test PASS ≠ Integration Test PASS:** Một hàm tính toán chiết khấu chạy đúng khi test đơn vị không chứng minh nó sẽ kết nối thành công với database khi chạy thực tế.
- **Integration Test PASS ≠ E2E Test PASS:** Các module backend tích hợp tốt với nhau không chứng minh giao diện frontend/mobile sẽ hiển thị và tương tác đúng với người dùng.
- **E2E Test PASS ≠ Security PASS:** Một test E2E kiểm tra luồng mua hàng thành công (happy path) hoàn toàn không chứng minh hệ thống an toàn trước các cuộc tấn công leo thang quyền hay IDOR.
- **Happy Path Test PASS ≠ Edge Case Verification:** Một test kiểm tra tạo đơn hàng với số lượng hợp lệ không chứng minh hệ thống sẽ từ chối an toàn khi số lượng bằng 0 hoặc âm.
- **E2E Test Boundaries:** Test E2E chỉ chứng minh luồng nghiệp vụ hoạt động trong phạm vi môi trường và dữ liệu giả lập được cấu hình cho test đó, không thể thay thế cho việc kiểm chứng các ranh giới kiến trúc cấp thấp.

---

## 14. Step 9 — Verify Runtime / Operational Evidence

Nếu tác vụ yêu cầu xác minh runtime hoặc kiểm tra khả năng sẵn sàng vận hành trong phạm vi (in-scope), Agent có nhiệm vụ **xác minh hành vi vận hành thực tế** đối chiếu với `Rule 09` (Observability & Operations), kiến trúc đã phê duyệt, hợp đồng vận hành hiện hữu và triển khai thực tế.

> [!IMPORTANT]
> **Ranh giới sở hữu:** Skill 09 **KHÔNG tự định nghĩa tiêu chuẩn vận hành bắt buộc**. Các thành phần như endpoint kiểm tra sức khỏe, header theo vết hay ngưỡng cảnh báo phải được dẫn xuất từ Rule 09 và kiến trúc dự án thực tế; chúng không phải là yêu cầu phổ quát bắt buộc cho mọi tác vụ nếu tác vụ không thuộc phạm vi runtime.

### 14.1. Các chỉ dấu bằng chứng Runtime (Runtime Evidence Indicators)

Tùy thuộc vào phạm vi tác vụ và kiến trúc hệ thống, bằng chứng runtime có thể bao gồm:
1. **Khởi động ứng dụng (Application Startup):** Quá trình bootstrap và nạp cấu hình diễn ra suôn sẻ, không phát sinh unhandled exception hoặc lỗi sập ứng dụng trong quá trình khởi tạo container/dịch vụ.
2. **Kiểm tra sức khỏe (Health & Readiness Checks):**
   - Nếu kiến trúc hệ thống có triển khai cơ chế kiểm tra sức khỏe, xác minh xem các endpoint liveness và readiness (ví dụ mẫu theo Rule 09: `/health/live`, `/health/ready`) có phản hồi mã trạng thái kỳ vọng (ví dụ: `200 OK`) và phản ánh chính xác trạng thái phụ thuộc CSDL hay không.
3. **Phản hồi của Endpoint thực tế (Live Endpoint Response):** Thực hiện cuộc gọi HTTP thực nghiệm (nếu môi trường cho phép) và kiểm tra xem payload, headers và mã trạng thái trả về có đúng với đặc tả hợp đồng hay không.
4. **Cấu trúc Log & Xử lý lỗi (Structured Logging & Error Handling):**
   - Kiểm tra xem log có được ghi nhận theo định dạng có cấu trúc (ví dụ: JSON hoặc key-value) kèm định danh tương quan (ví dụ mẫu theo Rule 09: header `X-Correlation-ID`) để theo vết yêu cầu xuyên suốt các tầng hay không.
   - Khi xảy ra lỗi, xác minh xem hệ thống có ghi log chi tiết phía server nhưng trả về thông điệp lỗi an toàn cho client, không rò rỉ stack trace, chuỗi SQL hay connection string ra bên ngoài hay không.
5. **Vệ sinh Log (Log Hygiene):** Xác nhận tuyệt đối không có mật khẩu, token xác thực, khóa bí mật, số thẻ hay dữ liệu nhạy cảm nào bị rò rỉ vào file log (theo Rule 03 và Rule 09).

> [!WARNING]
> Các endpoint `/health/live`, `/health/ready` hay header `X-Correlation-ID` chỉ là **ví dụ minh họa (illustrative examples)** theo quy ước Rule 09; chúng không phải là yêu cầu bắt buộc cho mọi tác vụ không liên quan đến runtime. Đồng thời, không bao giờ được coi một thử nghiệm thủ công đơn lẻ ở runtime (ví dụ: "API trả về 200") là bằng chứng cho tất cả các yêu cầu về an ninh, cô lập chi nhánh hay toàn vẹn giao dịch.

---

## 15. Step 10 — Regression Verification

Bất kỳ sự thay đổi mã nguồn nào cũng tiềm ẩn nguy cơ phá vỡ các chức năng đang hoạt động bình thường. Kiểm tra hồi quy là bắt buộc để đảm bảo sự ổn định của toàn hệ thống.

### 15.1. Xác định phạm vi kiểm định hồi quy (Regression Scope)

Phạm vi kiểm tra hồi quy phải dựa trên bằng chứng phân tích tác động (Impact Analysis), bao gồm:
1. **Hành vi bị thay đổi (Changed Behavior):** Xác định chính xác sự thay đổi về logic, dữ liệu đầu vào hoặc đầu ra.
2. **Phụ thuộc trực tiếp (Direct Dependencies):** Các lớp, hàm hoặc endpoint gọi trực tiếp vào thành phần bị thay đổi.
3. **Phụ thuộc gián tiếp (Indirect Dependencies):** Các module hoặc luồng nghiệp vụ hạ nguồn nhận dữ liệu từ thành phần bị thay đổi.
4. **Bộ kiểm thử hiện hữu (Existing Tests):** Chạy lại toàn bộ các test suite liên quan đến module bị thay đổi để phát hiện lỗi hồi quy sớm.
5. **Các luồng nghiệp vụ liên quan (Related Workflows):** Ví dụ, khi thay đổi bảng `TON_KHO` để phục vụ tính năng Nhập hàng, bắt buộc phải kiểm tra hồi quy luồng Bán hàng và luồng Trả hàng xem có bị ảnh hưởng hay không.
6. **Thay đổi có tính phá vỡ (Breaking Changes):** Kiểm tra xem có thay đổi nào làm gãy hợp đồng API (đổi tên trường, xóa trường) khiến Client (Web/Mobile) không thể giao tiếp được nữa hay không.

### 15.2. Nguyên tắc thực thi hồi quy

- **Không chạy toàn bộ hệ thống một cách mù quáng:** Nếu thay đổi chỉ là một bản sửa lỗi nhỏ ở tầng giao diện không ảnh hưởng đến API hay logic dùng chung, không cần thiết phải chạy lại toàn bộ integration test của backend.
- **Mở rộng phạm vi khi có tác động liên tầng:** Nếu thay đổi nằm ở tầng CSDL (thay đổi schema, sửa trigger, cập nhật ràng buộc) hoặc Core Domain, phạm vi kiểm định hồi quy bắt buộc phải mở rộng sang tất cả các module tiêu thụ dữ liệu đó.

---

## 16. Documentation & Traceability

Tài liệu dự án phải luôn phản ánh trung thực hiện trạng triển khai của mã nguồn. Sự mất đồng bộ giữa tài liệu và mã nguồn là nguồn gốc của các lỗi thiết kế nghiêm trọng.

### 16.1. Ma trận trạng thái tài liệu & hiện trạng (Documentation States)

Mọi tính năng hoặc yêu cầu trong tài liệu phải được gán nhãn trạng thái chính xác:
- **PROPOSED:** Tính năng mới được đề xuất trong tài liệu hoặc issue, chưa có thiết kế kỹ thuật chi tiết.
- **DESIGNED:** Đã có thiết kế chi tiết (API contract, ERD, Use Case) nhưng chưa có mã nguồn triển khai.
- **IMPLEMENTED:** Mã nguồn đã được lập trình đầy đủ trong repository nhưng chưa hoàn thành chu trình xác minh toàn diện.
- **VERIFIED:** Mã nguồn đã được triển khai, kiểm thử, lần vết liên tầng và vượt qua toàn bộ tiêu chí nghiệm thu của Verification Loop.
- **NOT VERIFIED:** Tính năng đã được triển khai nhưng chưa được kiểm chứng đầy đủ bằng bằng chứng thực tế.
- **OUTDATED:** Tài liệu mô tả hành vi cũ, không còn khớp với mã nguồn hiện tại của hệ thống.
- **CONTRADICTED:** Tài liệu mô tả một đằng nhưng mã nguồn triển khai một nẻo, chứa đựng mâu thuẫn trực tiếp cần giải quyết.

### 16.2. Chuỗi theo vết toàn diện (End-to-End Traceability Chain)

Quy trình xác minh phải thiết lập và duy trì chuỗi theo vết không đứt đoạn từ đầu đến cuối:

```text
Requirement (Yêu cầu)
      |
      v
Physical Implementation Evidence (Bằng chứng mã nguồn vật lý)
      |
      v
Cross-Layer Trace Evidence (Bằng chứng kết nối liên tầng)
      |
      v
Executable Test Evidence (Bằng chứng kiểm thử tự động)
      |
      v
Runtime Operational Evidence (Bằng chứng vận hành thực tế)
      |
      v
Final Verdict (Phán quyết nghiệm thu cuối cùng)
```

> [!IMPORTANT]
> Bằng chứng vật lý và bằng chứng runtime có giá trị ưu tiên hơn so với tài liệu không có căn cứ hoặc các giả định chủ quan khi xác minh hành vi thực tế, trong khi bằng chứng mâu thuẫn phải được điều tra làm rõ thay vì tự tiện loại bỏ. Tài liệu vẫn giữ nguyên giá trị cốt lõi trong việc xác định thiết kế kỳ vọng, hợp đồng, quyết định kiến trúc và tiêu chí nghiệm thu, nhưng không tự thân chứng minh được hiện trạng triển khai thực tế.

---

## 17. Evidence Classification

Mọi bằng chứng thu thập được trong quá trình xác minh phải được phân loại vào đúng 7 trạng thái chuẩn hóa sau đây.

### 17.1. Bảy trạng thái bằng chứng chuẩn hóa

1. **CONFIRMED (Đã xác nhận):**
   - Có bằng chứng vật lý trực tiếp, rõ ràng, không thể tranh cãi (mã nguồn hiện hữu, test PASS có log thực thi, response HTTP thực tế).
2. **SUPPORTED (Được hỗ trợ):**
   - Có bằng chứng gián tiếp hoặc bằng chứng cấu hình mạnh mẽ ủng hộ nhận định, nhưng chưa có test thực thi trực tiếp tại runtime.
3. **PARTIAL (Một phần):**
   - Đã tìm thấy một phần bằng chứng (ví dụ: đã có DTO và Service nhưng thiếu đăng ký DI hoặc thiếu ràng buộc CSDL).
4. **NOT VERIFIED (Chưa xác minh):**
   - Thành phần có thể đã được triển khai nhưng chưa đủ điều kiện, công cụ hoặc bằng chứng kiểm thử để đưa ra kết luận dứt khoát.
5. **NOT FOUND (Không tìm thấy):**
   - Đã tiến hành tìm kiếm và rà soát kỹ lưỡng trong toàn bộ repository nhưng không thấy sự hiện diện vật lý của tệp tin, lớp hay đối tượng được yêu cầu.
6. **CONTRADICTED (Mâu thuẫn):**
   - Phát hiện sự xung đột trực tiếp giữa các nguồn bằng chứng (ví dụ: tài liệu ghi `don_gia > 0` nhưng mã nguồn cho phép `= 0`, hoặc API spec ghi trả về `201` nhưng Controller trả về `200`).
7. **ASSUMPTION (Giả định):**
   - Suy đoán hoặc kết luận dựa trên lý thuyết, quy ước thông thường hoặc phán đoán chủ quan mà không có bất kỳ bằng chứng vật lý nào trong repository hỗ trợ.

### 17.2. Các quy tắc phân loại tối quan trọng

- **NOT FOUND ≠ NOT IMPLEMENTED:** Một tệp tin không tìm thấy ở thư mục A không có nghĩa là tính năng chưa được triển khai; nó có thể được đặt ở thư mục B. Agent phải rà soát toàn diện trước khi kết luận `NOT IMPLEMENTED`.
- **NOT VERIFIED ≠ FAIL:** Việc một tính năng chưa thể xác minh (do thiếu môi trường chạy test) không đồng nghĩa với việc tính năng đó bị lỗi hoặc thất bại. Nó phải được giữ nguyên trạng thái `NOT VERIFIED`.
- **ASSUMPTION ≠ EVIDENCE:** Giả định không bao giờ được coi là bằng chứng. Mọi giả định phải được dán nhãn `ASSUMPTION` và phải được chứng minh hoặc loại bỏ.
- **CONTRADICTED bắt buộc phải ưu tiên điều tra:** Khi phát hiện bằng chứng mâu thuẫn, Agent không được phép tự ý chọn nguồn bằng chứng thuận tiện hơn để kết luận; bắt buộc phải ghi nhận mâu thuẫn và yêu cầu làm rõ sự thật khách quan.

---

## 18. Finding / Failure Classification

Khi phát hiện sự sai lệch, thiếu sót hoặc lỗi trong quá trình xác minh, Agent phải phân loại phát hiện theo quy tắc chuẩn mực.

### 18.1. Sáu trạng thái đánh giá kết quả (Evaluation Statuses)

Mỗi tiêu chí kiểm tra trong phạm vi xác minh phải nhận một trong sáu trạng thái:
- **PASS (Đạt):** Có đầy đủ bằng chứng vật lý xác nhận tiêu chí hoàn thành trọn vẹn, không có vi phạm.
- **FAIL (Không đạt):** Có bằng chứng vật lý chứng minh tiêu chí bị vi phạm, mã nguồn chạy sai hoặc thiếu sót chức năng cốt lõi.
- **PARTIAL (Đạt một phần):** Tiêu chí được thực hiện một phần nhưng còn tồn tại các vấn đề thứ yếu chưa hoàn tất.
- **BLOCKED (Bị chặn):** Không thể tiến hành kiểm tra do có sự cố môi trường, thiếu phụ thuộc tiên quyết hoặc thiếu quyền truy cập.
- **NOT VERIFIED (Chưa xác minh):** Chưa thể đưa ra kết luận do thiếu bằng chứng thực thi hoặc chưa đủ điều kiện khảo sát.
- **NOT APPLICABLE (Không áp dụng):** Tiêu chí kiểm tra nằm ngoài phạm vi tác vụ hoặc không liên quan đến công nghệ/mô hình của tính năng hiện tại.

### 18.2. Phân loại mức độ nghiêm trọng (Severity Governance)

Agent tuyệt đối không được tự ý phát minh ra thang đo mức độ nghiêm trọng mới. Việc phân loại phải tuân thủ nghiêm ngặt các Rules liên quan:
- **Phát hiện về An ninh & Phân quyền:** Phải phân loại theo đúng 5 cấp độ của `Rule 03`:
  - `CRITICAL` (Nghiêm trọng: Rò rỉ dữ liệu chéo chi nhánh, bypass xác thực, lộ private keys).
  - `HIGH` (Cao: Lỗ hổng IDOR/BOLA, thiếu phân quyền endpoint thay đổi dữ liệu, mass assignment).
  - `MEDIUM` (Trung bình: Thiếu rate limiting, log ghi thông tin nhạy cảm ở mức độ thấp, thiếu kiểm tra trạng thái).
  - `LOW` (Thấp: Thiếu header bảo mật phụ, thông báo lỗi hơi chi tiết nhưng không lộ bí mật).
  - `INFORMATIONAL` (Thông tin: Khuyến nghị cải tiến cấu trúc mã nguồn, dọn dẹp biến thừa).
- **Phát hiện về Vận hành & Hệ thống:** Phải phân loại theo mức độ ưu tiên cảnh báo vận hành của `Rule 09`:
  - `P1` (Khẩn cấp: Mất kết nối CSDL, crash toàn hệ thống, lỗi giao dịch diện rộng).
  - `P2` (Quan trọng: Tỷ lệ lỗi tăng cao, suy giảm hiệu năng nghiêm trọng, timeout CSDL).
  - `P3` (Thông tin: Cảnh báo thường nhật, hoàn thành tác vụ sao lưu, khởi động node).

---

## 19. Verification Confidence

Verification Confidence đo lường **mức độ chắc chắn và độ tin cậy khách quan** của kết luận xác minh dựa trên chất lượng, tính thích đáng và độ bao phủ của bằng chứng thu thập được trong mối tương quan với phạm vi tác vụ.

> [!IMPORTANT]
> **Nguyên tắc nhận biết phạm vi (Scope-Aware Confidence):**
> - Độ tin cậy **không đòi hỏi mọi loại bằng chứng cho mọi tác vụ**. Yêu cầu về bằng chứng phụ thuộc hoàn toàn vào phạm vi xác minh (Verification Scope).
> - Không bao giờ áp đặt rằng *"HIGH confidence bắt buộc phải có runtime evidence"* hoặc *"HIGH confidence bắt buộc phải có integration tests"*. Nếu một loại bằng chứng là không áp dụng (NOT APPLICABLE) cho tác vụ, sự vắng mặt của nó không làm suy giảm độ tin cậy của kết luận.
> - **Ví dụ minh họa:** Trong một tác vụ chỉ kiểm tra và xác minh script Migration CSDL:
>   - Bằng chứng runtime: `NOT APPLICABLE`
>   - Bằng chứng giao diện (Frontend/Mobile): `NOT APPLICABLE`
>   - Bằng chứng mã nguồn migration: `PASS`
>   - Bằng chứng schema và ràng buộc: `PASS`
>   - Bằng chứng idempotent migration test: `PASS`
>   - **Độ tin cậy đạt mức HIGH CONFIDENCE** vì toàn bộ phạm vi áp dụng đã được kiểm chứng trọn vẹn bằng bằng chứng vật lý vững chắc.

### 19.1. Bốn mức độ tin cậy (Confidence Levels)

1. **HIGH CONFIDENCE (Độ tin cậy cao):**
   - Bằng chứng thu thập được đầy đủ, mạnh mẽ và hoàn toàn phù hợp với phạm vi xác minh đã định hình.
   - *"Required evidence depends on verification scope"*: Bằng chứng cần thiết phụ thuộc hoàn toàn vào phạm vi xác minh; tuyệt đối không đòi hỏi bắt buộc phải có runtime evidence, frontend evidence, integration test hay unit test nếu các loại bằng chứng đó không áp dụng (N/A) cho tác vụ.
   - Toàn bộ các tiêu chí nghiệm thu khả dụng (applicable acceptance criteria) đều được kiểm chứng bằng bằng chứng tương ứng.
   - Không tồn tại mâu thuẫn chưa giải quyết (unresolved contradictions) hoặc phát hiện chặn (blocking findings) trong phạm vi.
   - Kết luận không phụ thuộc đáng kể vào các giả định (minimal or no assumption dependence).
2. **MEDIUM CONFIDENCE (Độ tin cậy trung bình):**
   - Bằng chứng thu thập được đủ mạnh để ủng hộ các kết luận cốt lõi.
   - Vẫn còn tồn tại một hoặc vài giới hạn nhỏ về phạm vi hoặc thiếu bằng chứng thứ yếu nhưng không làm phương hại đến phần đã xác minh.
   - Tồn tại một số giả định hợp lý nhưng đã được đối chiếu sơ bộ với quy ước repository.
3. **LOW CONFIDENCE (Độ tin cậy thấp):**
   - Bằng chứng thu thập được còn hạn chế, chủ yếu dựa trên tài liệu hoặc đọc mã nguồn tĩnh đơn lẻ.
   - Còn tồn tại các giả định chưa được kiểm chứng hoặc thiếu hụt bằng chứng ở các ranh giới quan trọng.
   - Kết luận chỉ nên được xem là tạm thời (provisional) và cần khảo sát thêm.
4. **NO CONFIDENCE / INSUFFICIENT EVIDENCE (Không có độ tin cậy / Thiếu bằng chứng):**
   - Bằng chứng bị phân mảnh nghiêm trọng, thiếu sót hoặc không tìm thấy.
   - Kết luận dựa chủ yếu trên suy đoán logic (assumptions) mà không có bằng chứng vật lý hỗ trợ.
   - Tồn tại mâu thuẫn trực tiếp giữa các nguồn bằng chứng mà chưa được điều tra làm rõ.

### 19.2. Nguyên tắc sử dụng Confidence Model

- **Confidence không thay thế cho PASS / FAIL:** Một phát hiện có thể là `FAIL` với `HIGH CONFIDENCE` (chắc chắn 100% là lỗi vì có bằng chứng vật lý vi phạm rõ ràng). Ngược lại, một tính năng có vẻ hoạt động nhưng chỉ đạt `LOW CONFIDENCE` vì thiếu bằng chứng kiểm chứng các ranh giới.
- **Confidence đo lường mức độ tin cậy của bằng chứng, không phải kết quả nghiệm thu:** Độ tin cậy trả lời câu hỏi: *"Chúng ta tin tưởng vào kết luận này đến mức nào?"*. Nó không tự động ấn định phán quyết cuối cùng.

---

## 20. Final Verdict

Phán quyết cuối cùng (Final Verdict) là tuyên bố chính thức và có thẩm quyền về tình trạng nghiệm thu của tác vụ dựa trên các tiêu chí nghiệm thu trong phạm vi đã xác định.

> [!IMPORTANT]
> **Tách biệt rạch ròi: VERDICT ≠ CONFIDENCE**
> - **Confidence** trả lời: *"Chúng ta tin kết luận này đến mức nào dựa trên chất lượng và độ phủ của bằng chứng?"*
> - **Verdict** trả lời: *"Các yêu cầu và tiêu chí nghiệm thu trong phạm vi tác vụ đã được xác minh đạt hay chưa?"*
> - Trạng thái `VERIFIED` không bị ràng buộc máy móc vào một nhãn confidence cụ thể nếu các tiêu chí trong scope đã được chứng minh đầy đủ. Ngược lại, một phán quyết `FAILED` cũng hoàn toàn có thể đi kèm với `HIGH CONFIDENCE`.

### 20.1. Căn cứ ban hành phán quyết cuối cùng

Phán quyết cuối cùng phải được thiết lập dựa trên 7 yếu tố:
1. Phạm vi xác minh đã được định hình rõ ràng (Defined Verification Scope).
2. Các tiêu chí nghiệm thu khả dụng trong phạm vi (Applicable Acceptance Criteria).
3. Tính đầy đủ và thích đáng của bằng chứng (Evidence Sufficiency & Applicability).
4. Tính nhất quán liên tầng khi áp dụng (Cross-Layer Consistency when applicable).
5. Các phát hiện gây chặn (Blocking Findings).
6. Các mâu thuẫn chưa giải quyết (Unresolved Contradictions).
7. Ranh giới kỹ thuật bị tác động (Verification Boundaries).

### 20.2. Sáu trạng thái phán quyết cuối cùng (Final Verdict States)

1. **VERIFIED (Đã xác minh hoàn tất):**
   - Tất cả các tiêu chí nghiệm thu khả dụng (applicable acceptance criteria) trong phạm vi tác vụ đều đã được kiểm chứng bằng bằng chứng phù hợp.
   - Không còn bất kỳ phát hiện chặn (blocking finding) hoặc mâu thuẫn chưa giải quyết nào ảnh hưởng đến phạm vi tác vụ.
   - Không đòi hỏi máy móc mọi loại bằng chứng nếu loại bằng chứng đó là N/A đối với tác vụ.
   - Không có quy tắc máy móc "VERIFIED = HIGH CONFIDENCE": Phán quyết VERIFIED phản ánh việc hoàn thành các tiêu chí nghiệm thu khả dụng trong scope; phán quyết này không đòi hỏi bắt buộc phải gán nhãn HIGH CONFIDENCE và không đòi hỏi các bằng chứng ngoài scope.
2. **PARTIALLY VERIFIED (Xác minh một phần):**
   - Một phần các tiêu chí nghiệm thu cốt lõi đã được kiểm chứng đạt yêu cầu, nhưng vẫn còn một số tiêu chí hoặc kịch bản biên chưa có đủ bằng chứng xác minh.
3. **NOT VERIFIED (Chưa được xác minh):**
   - Chưa thu thập đủ bằng chứng cần thiết để đưa ra kết luận khẳng định hoặc phủ định về việc hoàn thành yêu cầu.
4. **FAILED (Thất bại / Không đạt):**
   - Bằng chứng vật lý chứng minh mã nguồn hoặc hành vi thực tế không đáp ứng tiêu chí nghiệm thu, hoặc phát hiện vi phạm nghiêm trọng đối với các ranh giới an ninh, toàn vẹn dữ liệu hay kiến trúc.
5. **BLOCKED (Bị chặn):**
   - Quá trình xác minh không thể hoàn tất do sự cố môi trường, thiếu phụ thuộc tiên quyết hoặc rào cản kỹ thuật nằm ngoài phạm vi tác vụ.
6. **NOT APPLICABLE (Không áp dụng):**
   - Yêu cầu hoặc tiêu chí được đánh giá hoàn toàn không áp dụng cho phạm vi tác vụ hiện tại.

### 20.3. Quy tắc cốt lõi của Final Verdict

- **Chỉ xét các tiêu chí nằm trong phạm vi (In-Scope Only):** Phán quyết `VERIFIED` được ban hành khi toàn bộ các tiêu chí nghiệm thu **thuộc phạm vi tác vụ** được chứng minh đạt yêu cầu.
- **Không áp đặt kiểm tra toàn hệ thống:** Các thành phần hoặc module nằm ngoài phạm vi tác vụ phải được đánh dấu là `NOT APPLICABLE` thay vì đòi hỏi phải PASS thì mới cho phép tác vụ hiện tại đạt `VERIFIED`. Các mục thiếu điều kiện kiểm tra trong phạm vi phải được ghi nhận là `NOT VERIFIED`.

---

## 21. Verification Report Format

Mọi báo cáo kết quả xác minh phải tuân thủ cấu trúc chuẩn mực dưới đây, đảm bảo tính súc tích, minh bạch và hoàn toàn trung lập về công nghệ.

```markdown
# BÁO CÁO XÁC MINH (VERIFICATION REPORT)

## 1. Thông tin tổng quan (Overview)
- **Đối tượng xác minh (Target):** [Tên tính năng / Module / Mã PR / Nhiệm vụ]
- **Phạm vi tác vụ (Scope):** [Tóm tắt những gì thay đổi và nằm trong phạm vi]
- **Mục tiêu & Yêu cầu (Requirement):** [Mô tả yêu cầu nghiệp vụ cốt lõi]
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  1. [Tiêu chí 1]
  2. [Tiêu chí 2]

## 2. Bảng tổng hợp bằng chứng (Evidence Summary)
| ID | Hạng mục kiểm tra | Nguồn bằng chứng vật lý | Trạng thái bằng chứng | Kết quả sơ bộ |
|---|---|---|---|---|
| E01 | File & Mã nguồn | [Đường dẫn file:dòng] | CONFIRMED | PASS |
| E02 | API Endpoint | [Controller / Route] | CONFIRMED | PASS |
| E03 | Toàn vẹn CSDL | [Migration script / Schema] | SUPPORTED | PASS |
| E04 | Bằng chứng Test | [Test log output] | CONFIRMED | PASS |

## 3. Theo vết liên tầng (Cross-Layer Implementation Trace)
| Tầng kiến trúc | Thành phần thực tế | Bằng chứng kết nối | Đánh giá |
|---|---|---|---|
| Presentation (UI) | [Component / Screen] | Gọi API client hợp lệ | PASS |
| API Boundary | [Endpoint Controller] | DTO validation đầy đủ | PASS |
| Application Layer | [Service / Use Case] | Áp dụng đúng business rule | PASS |
| Persistence Layer | [Repository / Data Access] | Sử dụng parameterized query | PASS |
| Database Layer | [Table / Constraints] | PK, FK, CHECK đầy đủ | PASS |

## 4. Bằng chứng kiểm thử (Test Evidence)
| Tên Test Suite / Ca kiểm thử | Phạm vi | Số lượng Pass/Fail | Đánh giá ý nghĩa |
|---|---|---|---|
| [Tên Suite 1] | Unit Test | 12/12 PASS | Logic nghiệp vụ chính xác |
| [Tên Suite 2] | Integration Test | 4/4 PASS | Kết nối CSDL và Transaction toàn vẹn |

## 5. Xác minh an ninh & phân quyền (Security & Authorization)
| Nội dung kiểm tra | Tiêu chuẩn đối chiếu | Bằng chứng thực tế | Kết luận |
|---|---|---|---|
| Xác thực danh tính | Rule 03 | JWT trích xuất từ middleware | PASS |
| Phân quyền vai trò | Rule 04 | Đòi hỏi Role/Permission hợp lệ | PASS |
| Kiểm soát truy cập runtime | Rule 05 | Chặn IDOR trên Single Resource | PASS |
| Cô lập chi nhánh | Rule 06 | Scope theo ChiNhanhId từ context | PASS |

## 6. Xác minh cơ sở dữ liệu (Database Integrity)
| Nội dung kiểm tra | Tiêu chuẩn đối chiếu | Bằng chứng thực tế | Kết luận |
|---|---|---|---|
| Khóa chính & Khóa ngoại | Rule 07 | Khóa ngoại có NO ACTION bảo vệ audit | PASS |
| Ràng buộc giá trị | Rule 07 | CHECK constraint so_luong >= 0 | PASS |
| Giao dịch nguyên tử | Rule 02 / Rule 07 | Transaction bao trùm bán & trừ kho | PASS |

## 7. Kiểm định hồi quy (Regression Verification)
- **Các thành phần liên đới đã kiểm tra:** [Danh sách module phụ thuộc]
- **Kết quả chạy lại test hiện hữu:** [X test vượt qua, 0 test thất bại]
- **Đánh giá rủi ro gãy vỡ hợp đồng:** [Không phát hiện breaking change]

## 8. Danh sách phát hiện (Findings & Observations)
| ID | Hạng mục | Mô tả phát hiện | Mức độ nghiêm trọng | Hành động khuyến nghị |
|---|---|---|---|---|
| F01 | Security / Logic | [Mô tả chi tiết nếu có] | LOW / MEDIUM / HIGH | [Hướng dẫn xử lý] |

## 9. Độ tin cậy xác minh (Verification Confidence)
- **Mức độ tin cậy:** HIGH CONFIDENCE / MEDIUM CONFIDENCE / LOW CONFIDENCE
- **Căn cứ xác định:** [Nêu rõ số lượng bằng chứng vật lý và kết quả test thực tế]

## 10. Phán quyết cuối cùng (Final Verdict)
- **PHÁN QUYẾT:** [ VERIFIED / PARTIALLY VERIFIED / NOT VERIFIED / FAILED / BLOCKED ]
- **Tóm tắt lý do:** [Tuyên bố ngắn gọn, minh bạch về lý do ban hành phán quyết]
```

---

## 22. Verification Anti-Patterns

Để bảo đảm tính khách quan và chiều sâu của quy trình xác minh, Agent phải nhận diện và tuyệt đối tránh xa 12 phản mẫu (anti-patterns) nguy hại sau:

1. **"It compiles, therefore it works" (Biên dịch được là chạy được):**
   - Mã nguồn không có lỗi cú pháp chỉ chứng minh trình biên dịch hiểu được mã; nó hoàn toàn không chứng minh logic nghiệp vụ đúng, không chứng minh dữ liệu được lưu an toàn và không phát hiện được lỗi logic lúc chạy.
2. **"Tests pass, therefore security is correct" (Test vượt qua nghĩa là bảo mật đúng):**
   - Hầu hết các ca kiểm thử thông thường chỉ kiểm tra kịch bản thành công (happy path). Test pass không chứng minh hệ thống an toàn trước việc tráo đổi token, khai thác IDOR, leo thang quyền hay rò rỉ dữ liệu chéo chi nhánh.
3. **"Frontend hides the button, therefore authorization works" (Giao diện ẩn nút nghĩa là phân quyền tốt):**
   - Việc ẩn nút bấm hay khóa trường nhập liệu trên Web/Mobile chỉ là trải nghiệm người dùng (UX), không phải ranh giới bảo mật. Nếu API phía máy chủ không thẩm định quyền, bất kỳ ai cũng có thể gửi HTTP request trực tiếp để thao túng hệ thống.
4. **"ERD contains the table, therefore database contains it" (Sơ đồ ERD có bảng nghĩa là CSDL có bảng):**
   - Sơ đồ ERD chỉ là bản vẽ thiết kế trên giấy. Trong CSDL thực tế, bảng có thể chưa được tạo, cột có thể thiếu, kiểu dữ liệu có thể sai lệch hoặc ràng buộc khóa ngoại chưa hề được khai báo.
5. **"Swagger documents the endpoint, therefore endpoint exists" (Swagger có endpoint nghĩa là endpoint tồn tại):**
   - Tài liệu Swagger tĩnh có thể bị lỗi thời, được viết bằng tay hoặc chưa cập nhật. Endpoint trên thực tế có thể đã bị xóa, đổi route hoặc chưa hề được lập trình trong Controller.
6. **"File exists, therefore implementation is complete" (Có file nghĩa là đã triển khai xong):**
   - Tệp tin có thể chỉ chứa khung lớp rỗng, các phương thức ném ngoại lệ `NotImplementedException`, hoặc logic giữ chỗ (`TODO`) chưa thể phục vụ nghiệp vụ thực tế.
7. **"One happy-path test passes, therefore feature is complete" (Một test thành công nghĩa là tính năng hoàn tất):**
   - Một ca kiểm thử đơn lẻ chỉ chứng minh một kịch bản lý tưởng duy nhất hoạt động. Nó hoàn toàn bỏ qua các kịch bản lỗi, kịch bản giá trị biên, kịch bản dữ liệu rỗng và các điều kiện ngoại lệ.
8. **"No error observed, therefore concurrency is correct" (Không thấy lỗi nghĩa là xử lý đồng thời đúng):**
   - Các lỗi tranh chấp tài nguyên (race condition, lost update, overselling) chỉ xuất hiện khi có nhiều yêu cầu xảy ra đồng thời. Việc một người dùng thử nghiệm tuần tự không gặp lỗi không chứng minh hệ thống an toàn dưới tải đồng thời.
9. **"No evidence found, therefore feature does not exist" (Không thấy bằng chứng nghĩa là tính năng không tồn tại):**
   - Việc Agent không tìm thấy mã nguồn ở vị trí dự đoán ban đầu có thể do Agent tìm sai thư mục hoặc chưa rà soát hết repository. Phải ghi nhận `NOT FOUND / NOT VERIFIED` và mở rộng khảo sát trước khi khẳng định tính năng chưa làm.
10. **"Documentation says implemented, therefore it is implemented" (Tài liệu nói đã làm nghĩa là đã làm):**
    - Báo cáo tiến độ hoặc tài liệu có thể ghi nhận hoàn thành dựa trên sự lạc quan hoặc thông tin cũ. Tài liệu chỉ phản ánh thiết kế kỳ vọng, còn hành vi thực tế bắt buộc phải được chứng minh bằng bằng chứng vật lý và bằng chứng runtime có thể kiểm chứng được.
11. **"E2E PASS = whole-system PASS" (E2E đạt nghĩa là toàn hệ thống đạt):**
    - Kiểm thử E2E thường chạy trên môi trường giả lập (mocking) với dữ liệu mẫu hạn chế. E2E pass chỉ chứng minh luồng đi qua các điểm chạm được kiểm tra, không bao quát được toàn bộ các ràng buộc tầng CSDL, xử lý giao dịch hay an ninh sâu.
12. **"One layer verified = entire cross-layer flow verified" (Xác minh một tầng nghĩa là toàn luồng thông suốt):**
    - Kiểm tra Controller hoạt động độc lập không chứng minh nó đã kết nối thành công với Service; kiểm tra Service không chứng minh Repository đã gửi câu lệnh đúng xuống CSDL. Phải lần vết liên tầng không gián đoạn.

---

## 23. Verification Refactoring / Re-verification

Khi mã nguồn được chỉnh sửa, sửa lỗi hoặc tái cấu trúc (refactoring) sau khi đã thực hiện xác minh, **toàn bộ kết quả xác minh trước đó sẽ bị vô hiệu hóa một phần hoặc toàn bộ**. Agent tuyệt đối không được tự động giữ nguyên phán quyết cũ.

### 23.1. Chu trình tái xác minh có định hướng (Targeted Re-verification Loop)

```text
[Initial Verification Completed]
              |
              v
[Code Change / Bugfix / Refactoring Occurs]
              |
              v
[Step A: Impact Analysis - Phân tích tác động]
              |
              v
[Step B: Invalidate Stale Evidence - Hủy bỏ bằng chứng cũ]
              |
              v
[Step C: Targeted Re-verification - Tái xác minh có mục tiêu]
              |
              v
[Step D: Regression Verification - Chạy kiểm định hồi quy]
              |
              v
[Step E: Updated Verdict & Report - Cập nhật phán quyết]
```

### 23.2. Quy trình 5 bước tái xác minh chi tiết

1. **Phân tích tác động (Impact Analysis):** Xác định chính xác những tệp tin, lớp, phương thức nào đã bị thay đổi và những thành phần nào phụ thuộc trực tiếp vào chúng.
2. **Hủy bỏ bằng chứng cũ (Invalidate Stale Evidence):** Đánh dấu các kết quả test, bằng chứng liên tầng và runtime cũ liên quan đến vùng bị sửa đổi là `STALE` (lỗi thời / mất hiệu lực).
3. **Tái xác minh có mục tiêu (Targeted Re-verification):**
   - Kiểm tra lại mã nguồn mới sửa xem có đáp ứng tiêu chuẩn chất lượng và giải quyết triệt để vấn đề cũ không.
   - Chạy lại các ca kiểm thử đơn vị và tích hợp trực tiếp kiểm tra vùng mã đó.
   - Thẩm tra lại các ranh giới an ninh, hợp đồng API và toàn vẹn dữ liệu bị tác động.
4. **Kiểm tra hồi quy (Regression Verification):** Thực thi bộ kiểm thử hồi quy của module liên quan để đảm bảo bản sửa lỗi không tạo ra lỗi mới ở các luồng chức năng khác.
5. **Cập nhật phán quyết (Updated Verdict):** Tổng hợp lại bằng chứng mới, đánh giá lại độ tin cậy và ban hành phán quyết cập nhật trong báo cáo xác minh.

---

## 24. Verification Quality Checklist

Bảng kiểm chất lượng xác minh là cổng kiểm soát tối hậu, đồng bộ hóa toàn diện với tất cả các giai đoạn từ Section 4 đến Section 23, đảm bảo quy trình xác minh tuân thủ đầy đủ các ranh giới quản trị mà không lấn sân sang việc áp đặt chính sách.

Mỗi tiêu chí trong bảng kiểm bắt buộc phải được đánh giá bằng một trong năm trạng thái chuẩn hóa:
- **PASS:** Đạt yêu cầu đầy đủ với bằng chứng vật lý / bằng chứng runtime phù hợp.
- **FAIL:** Không đạt yêu cầu hoặc có bằng chứng vi phạm tiêu chuẩn.
- **PARTIAL:** Đạt một phần, còn tồn tại khiếm khuyết nhỏ chưa hoàn tất.
- **NOT APPLICABLE (N/A):** Tiêu chí không thuộc phạm vi tác vụ hiện tại (sự vắng mặt không làm giảm độ tin cậy).
- **NOT VERIFIED:** Chưa đủ bằng chứng thực tế trong phạm vi để kết luận.

| STT | Cổng kiểm soát (Verification Gate) | Tiêu chí thẩm tra chi tiết | Trạng thái đánh giá |
|---|---|---|---|
| **1** | **Scope Definition** | Phạm vi tác vụ, mục tiêu, ranh giới in/out of scope và tiêu chí nghiệm thu được định hình rõ ràng, không mở rộng hay thu hẹp tùy tiện? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **2** | **Evidence Baseline & Reliability** | Bằng chứng được đánh giá theo mô hình độ tin cậy (relevance, applicability, freshness, consistency); xung đột bằng chứng kích hoạt điều tra; không dùng tài liệu thay thế mã nguồn? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **3** | **Implementation Existence** | Các tệp tin, lớp, phương thức cần thiết hiện diện vật lý đầy đủ trong repository; không chứa mã giữ chỗ (placeholder) hay stub rỗng? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **4** | **Wiring & Registration** | Thành phần mới được đăng ký đầy đủ vào DI container, middleware pipeline hoặc routing table theo quy ước framework; không có orphan code? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **5** | **Cross-Layer Trace** | Luồng dữ liệu và điều khiển được lần vết thông suốt qua các tầng kiến trúc thực tế (UI -> API -> Service -> Persistence -> Database)? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **6** | **API Contract Boundary** | API conventions (URI naming, HTTP methods, status codes, error format, DTOs, pagination, date/time, numeric types) được kiểm tra tuân thủ Rule 08, approved contract hoặc repository convention; không tự áp đặt quy ước API ngoài thẩm quyền? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **7** | **Authentication Boundary** | Xác thực danh tính được kiểm soát hoàn toàn ở phía máy chủ (theo Rule 03); các cơ chế (như JWT) được đối chiếu theo kiến trúc thực tế; không tin tưởng client input? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **8** | **RBAC Enforcement** | Quyền hạn được kiểm tra theo ma trận vai trò nghiệp vụ (Rule 04); không phụ thuộc vào việc ẩn nút bấm hay khóa trường trên giao diện? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **9** | **Authorization & IDOR** | Kiểm soát truy cập runtime chặt chẽ (Rule 05); thẩm định quyền trên từng tài nguyên đơn lẻ; chặn đứng IDOR/BOLA và các hình thức leo thang đặc quyền? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **10** | **Branch Data Isolation** | Dữ liệu chi nhánh được bảo vệ qua đường dẫn cô lập thực thi được theo Rule 06; phân định đúng thực thể global vs branch-owned; ngữ cảnh chi nhánh trích xuất từ server context; không mandate direct branch FK cho mọi bảng? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **11** | **Database Schema & Constraints** | Khóa chính, khóa ngoại, ràng buộc CHECK và UNIQUE áp dụng được xác minh đối chiếu theo Rule 07, Skill 07 và schema thực tế; không tự ý áp đặt quy tắc schema ngoài thiết kế được duyệt? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **12** | **Transaction & Concurrency** | Transaction boundary được xác minh khi business operation / architecture thực sự yêu cầu atomicity hoặc consistency (Rule 02/07); cơ chế xử lý đồng thời phù hợp với yêu cầu nhất quán và có bằng chứng hỗ trợ; không mặc định mọi thao tác đa bảng là transaction hay mandate một locking strategy cụ thể? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **13** | **Idempotency** | Cơ chế bảo vệ lũy bao được xác minh khi nghiệp vụ hoặc kiến trúc yêu cầu (ví dụ: thao tác thanh toán, tạo đơn dễ bị thử lại theo Rule 02/08); không áp đặt lũy bao lên các thao tác không cần thiết? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **14** | **Test Evidence** | Bộ test có tồn tại, đã được thực thi thực tế và có kết quả PASS cụ thể trong phạm vi test; không suy diễn test pass cho các ranh giới an ninh chưa được test? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **15** | **Runtime Evidence** | Bằng chứng vận hành (health/readiness/liveness, logs, metrics, tracing, alerts) được xác minh phù hợp với scope và kiến trúc thực tế (Rule 09); không mandate các endpoint (/health/live, /health/ready), header (X-Correlation-ID) hay mã 200 OK cụ thể nếu kiến trúc không yêu cầu? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **16** | **Operational Logging** | Log có cấu trúc, có định danh tương quan nếu kiến trúc yêu cầu, xử lý lỗi an toàn không lộ stack trace và tuân thủ vệ sinh bảo mật (Rule 03/09)? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **17** | **Regression Verification** | Các module phụ thuộc được phân tích tác động; các test hiện hữu liên quan đã được chạy lại và vượt qua; không gây gãy vỡ hợp đồng? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **18** | **Documentation Consistency** | Tài liệu thiết kế, API docs và trạng thái tính năng phản ánh chính xác hiện trạng mã nguồn; mâu thuẫn tài liệu - mã nguồn được ghi nhận và yêu cầu điều tra? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **19** | **Finding Classification** | Mọi phát hiện lỗi/khiếm khuyết được phân loại đúng chuẩn mức độ nghiêm trọng của Rule 03 (Security) và Rule 09 (Ops); không tự tạo thang đo mới? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **20** | **Confidence Level** | Mức độ tin cậy được xác định khách quan theo phạm vi (scope-aware: HIGH / MEDIUM / LOW / NONE); bằng chứng N/A không tự động làm giảm độ tin cậy; confidence không ấn định verdict máy móc; tuân thủ "Required evidence depends on verification scope"? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **21** | **Final Verdict** | Phán quyết (VERIFIED / PARTIALLY VERIFIED / NOT VERIFIED / FAILED / BLOCKED / N/A) tách biệt hoàn toàn với confidence (VERDICT ≠ CONFIDENCE); VERIFIED dựa trên việc đáp ứng các tiêu chí nghiệm thu khả dụng trong scope; không có quy tắc máy móc VERIFIED = HIGH CONFIDENCE? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |
| **22** | **Cross-Skill Governance** | Verification Loop chỉ xác minh tuân thủ, không lấn sân định nghĩa lại chính sách hay thay thế triển khai của Skills 01–08; tuân thủ thứ bậc ưu tiên? | `[PASS / FAIL / PARTIAL / N/A / NOT VERIFIED]` |

---

## 25. Governance & Cross-Skill Boundary

Skill 09 đóng vai trò là chiếc cầu nối kiểm chứng chất lượng tối hậu, tương tác chặt chẽ với toàn bộ hệ thống Rules 00–09 và Skills 01–08 nhưng tuyệt đối tôn trọng ranh giới trách nhiệm của từng tài liệu.

### 25.1. Ma trận ánh xạ ranh giới giữa Skill 09 và Hệ thống Quản trị

| Thực thể quản trị | Vai trò & Trách nhiệm cốt lõi | Ranh giới trách nhiệm của Skill 09 (Verification Loop) |
|---|---|---|
| **Rule 00** | Quản trị dự án, kiểm soát thay đổi, nguyên tắc Evidence-First | Tuân thủ nguyên tắc Evidence-First; dừng lại và báo cáo khi phát hiện xung đột ngoài phạm vi. |
| **Rule 01** | Kiến trúc phân tầng, ranh giới Client-Server, hướng phụ thuộc | Kiểm chứng sự tuân thủ các tầng kiến trúc; không cho phép client kết nối CSDL trực tiếp. |
| **Rule 02** | Chất lượng kiến trúc, giao dịch ACID, xử lý đồng thời, tính lũy bao | Kiểm chứng ranh giới transaction và cơ chế chống race condition; không định nghĩa lại chính sách giao dịch. |
| **Rule 03** | Chính sách an ninh tổng thể, xác thực JWT, bảo vệ bí mật, phân loại lỗi | Thẩm định an ninh phía server, bảo vệ secret; áp dụng thang đo mức độ nghiêm trọng của Rule 03. |
| **Rule 04** | Mô hình phân quyền theo vai trò (RBAC), ma trận quyền hạn | Kiểm chứng vai trò người dùng được gán đúng quyền năng theo ma trận; không tự ý thêm Role mới. |
| **Rule 05** | Thực thi kiểm soát truy cập runtime, chống IDOR/BOLA, kiểm tra trạng thái | Thẩm định kiểm tra quyền trên từng endpoint và tài nguyên đơn lẻ; không định nghĩa lại runtime logic. |
| **Rule 06** | Cô lập dữ liệu chi nhánh, ranh giới tenant, RLS SQL Server | Kiểm tra tính cô lập chi nhánh xuyên suốt từ JWT đến CSDL; không nới lỏng chính sách cô lập. |
| **Rule 07** | Toàn vẹn cơ sở dữ liệu, khóa chính/ngoại, ràng buộc CHECK, migrations | Kiểm tra sự hiện diện và hoạt động của các ràng buộc toàn vẹn trong CSDL; không tự ý sửa schema. |
| **Rule 08** | Chuẩn mực hợp đồng API, định dạng URI, DTO, mã trạng thái HTTP | Kiểm chứng request/response DTO, mã trạng thái và xử lý lỗi Problem Details; không tạo convention mới. |
| **Rule 09** | Khả năng quan sát vận hành, log có cấu trúc, health checks, backup | Kiểm chứng log không lộ secret, kiểm tra health endpoints; áp dụng mức độ ưu tiên P1/P2/P3. |
| **Skill 01** | Khảo sát hiện trạng codebase (Codebase Onboarding) | Sử dụng kỹ thuật onboarding để thực hiện bước Discovery; không thay thế quy trình onboarding. |
| **Skill 02** | Quy chuẩn lập trình và chất lượng mã nguồn (Coding Standards) | Kiểm chứng mã nguồn tuân thủ coding standards; không định nghĩa lại phong cách viết mã. |
| **Skill 03** | Triển khai mã nguồn Backend (.NET Backend Engineering) | Thẩm tra mã nguồn backend (.NET nếu có); không viết mã triển khai thay thế cho Skill 03. |
| **Skill 04** | Triển khai giao diện Web (React Frontend Engineering) | Thẩm tra mã nguồn frontend (React nếu có); không viết mã giao diện thay thế cho Skill 04. |
| **Skill 05** | Triển khai ứng dụng Mobile (Flutter Mobile Engineering) | Thẩm tra mã nguồn mobile (Flutter nếu có); không viết mã mobile thay thế cho Skill 05. |
| **Skill 06** | Thiết kế và đặc tả API (API Design Practices) | Thẩm tra tính đồng bộ giữa mã nguồn và thiết kế API; không thay thế vai trò thiết kế của Skill 06. |
| **Skill 07** | Kỹ thuật CSDL SQL Server (Database SQL Server Engineering) | Thẩm tra việc cài đặt ràng buộc và migration trong SQL Server; không thay thế triển khai của Skill 07. |
| **Skill 08** | Thiết kế và triển khai kiểm thử (Testing & Verification Practices) | Đọc và giải thích kết quả kiểm thử thực tế; không định nghĩa lại chiến lược viết test của Skill 08. |

### 25.2. Tuyên ngôn nguyên tắc tối thượng

1. **Skill 09 là người kiểm chứng độc lập (Verifier), không phải người thực thi (Implementer):** Skill 09 thu thập bằng chứng để xác minh xem các yêu cầu và quy chuẩn đã được thực hiện đúng hay chưa. Skill 09 không tự ý viết thêm mã nguồn nghiệp vụ hay sửa đổi schema CSDL trong quá trình xác minh.
2. **Evidence > Assumption (Bằng chứng luôn cao hơn giả định):** Nếu không có bằng chứng vật lý hoặc bằng chứng runtime phù hợp, tính năng đó được coi là chưa được xác minh (`NOT VERIFIED`). Mọi suy đoán cá nhân đều vô giá trị trước bằng chứng thực tế khách quan.
3. **Chính trực và minh bạch kỹ thuật:** Khi phát hiện lỗi hoặc thiếu sót, Agent phải báo cáo trung thực với đầy đủ bằng chứng, không được che giấu lỗi, không được hạ thấp mức độ nghiêm trọng và không được công bố `VERIFIED` khi các tiêu chí nghiệm thu chưa được chứng minh hoàn tất.
