---
name: coding-standards
description: >
  Chuẩn hóa cách viết, sửa đổi, refactor và review code trong PharmaBranch.
  Dùng khi tạo hoặc thay đổi code để duy trì tính nhất quán, khả năng đọc,
  bảo trì, kiểm thử và chất lượng mã nguồn theo convention thực tế của repository.
---

# Coding Standards — Chuẩn mực Viết và Quản lý Mã nguồn

## 1. Mục tiêu và Phạm vi (Objective & Scope)

Skill này định nghĩa các tiêu chuẩn kỹ thuật cốt lõi để hướng dẫn Agent và lập trình viên khi viết mới, chỉnh sửa, tái cấu trúc (refactor) và rà soát (code review) mã nguồn trong dự án PharmaBranch.

Mục tiêu cốt lõi:
- **Readability**: Mã nguồn phải trực quan, dễ đọc, dễ hiểu đối với mọi thành viên.
- **Maintainability**: Mã nguồn có cấu trúc rõ ràng, dễ mở rộng và có chi phí bảo trì thấp.
- **Consistency**: Duy trì tính nhất quán tuyệt đối với các convention và mẫu thiết kế đang tồn tại trong repository.
- **Testability**: Mã nguồn được thiết kế thuận lợi cho việc kiểm thử độc lập và tự động hóa.
- **Predictable Implementation**: Triển khai có thể dự đoán được, tránh các thay đổi bất ngờ hoặc "phép thuật" ngầm (magic behavior).
- **Controlled Refactoring**: Tái cấu trúc có kiểm soát, theo phạm vi được chỉ định, không thay đổi hành vi ngoài ý muốn.
- **Adherence to Existing Conventions**: Tôn trọng và tuân thủ các quy ước thực tế đã được thiết lập trong codebase.

---

## 2. Phân định trách nhiệm (Responsibility & Non-Responsibility)

### 2.1. Phạm vi thuộc trách nhiệm của Skill 02 (Owned Responsibilities)
Skill 02 sở hữu và hướng dẫn các khía cạnh chất lượng mã nguồn sau:
1. **Existing coding convention**: Tuân thủ quy ước mã nguồn hiện hữu của dự án.
2. **Naming**: Tiêu chuẩn đặt tên biến, hàm, lớp, tệp tin và các định danh kỹ thuật.
3. **File/class/function organization**: Tổ chức tệp, cấu trúc lớp và phân bổ hàm theo trách nhiệm.
4. **Readability**: Tính tường minh, định dạng, độ phức tạp điều khiển và khả năng đọc hiểu mã.
5. **Maintainability**: Thiết kế module hóa, giảm coupling không cần thiết, tăng cohesion phù hợp và giữ chi phí thay đổi ở mức hợp lý.
6. **Error-handling quality**: Kỹ thuật xử lý lỗi, ngoại lệ an toàn, không nuốt lỗi (fail-safe).
7. **Defensive coding**: Lập trình phòng thủ, kiểm soát giá trị biên, ranh giới dữ liệu và trạng thái rỗng/bất hợp lệ.
8. **Comments/documentation**: Quy cách chú thích giải thích "LÝ DO" (WHY), bất biến và hành vi phi hiển nhiên.
9. **Code duplication & abstraction**: Kiểm soát trùng lặp mã nguồn, kỷ luật trừu tượng hóa vừa đủ.
10. **Testability**: Thiết kế đảm bảo tính kiểm thử được (deterministic, cô lập phụ thuộc).
11. **Refactoring discipline**: Kỷ luật tái cấu trúc mã nguồn có phạm vi, an toàn và bảo toàn hành vi.
12. **Code quality checklist**: Bảng kiểm định chất lượng trước khi hoàn tất công việc.

### 2.2. Phạm vi KHÔNG thuộc trách nhiệm của Skill 02 (Non-Responsibilities)
Tuyệt đối KHÔNG đưa các nội dung thuộc về kiến trúc hệ thống, an ninh hoặc nghiệp vụ vào Skill này:
- **Authentication & JWT**: Quản lý phiên, xác thực người dùng (thuộc `03-security.md`).
- **Authorization & RBAC**: Phân quyền, kiểm tra quyền hạn, ma trận vai trò (thuộc `04-rbac.md` và `05-authorization.md`).
- **Branch Isolation**: Cô lập dữ liệu giữa các chi nhánh, RLS (thuộc `06-branch-isolation.md`).
- **Database Security & Relational Integrity**: Ràng buộc toàn vẹn, PK, FK, CHECK, CLS (thuộc `03-security.md` và `07-database-integrity.md`).
- **API Contract & Protocol Design**: Thiết kế HTTP URI, DTO schema, HTTP status codes, Problem Details (thuộc `08-api-contract.md`).
- **Observability & Health Checks**: Structured logging, request tracing, health endpoints, alerts (thuộc `09-observability-operations.md`).
- **Deployment & Infrastructure**: Cấu hình container, CI/CD, backup/recovery.
- **Domain Business Rules**: Quy tắc nghiệp vụ đặc thù của ngành dược (thuộc tầng Application/Domain và đặc tả nghiệp vụ).
- **Architecture Selection**: Không biến Skill 02 thành tài liệu định nghĩa kiến trúc toàn hệ thống.

---

## 3. Thứ bậc ưu tiên (Priority Hierarchy)

Khi có sự xung đột hoặc mâu thuẫn giữa các hướng dẫn kỹ thuật, quyết định phải được đưa ra dựa trên thứ bậc ưu tiên nghiêm ngặt sau:

```text
1. Rules hiện hành (00-project-governance -> 09-observability-operations)
    ↓
2. Yêu cầu cụ thể của Task (Task-specific requirements)
    ↓
3. Quy ước thực tế hiện có trong repository (Existing repository conventions)
    ↓
4. Các Skills áp dụng liên quan (Applicable Skills)
    ↓
5. Quy ước chuẩn của Ngôn ngữ / Nền tảng (Language / platform official conventions)
    ↓
6. Thực hành tốt chung (Generic best practices)
    ↓
7. Sở thích cá nhân của Agent (Agent personal preference)
```

**Nguyên tắc bất di bất dịch**:
- Tuyệt đối không sử dụng "generic best practices" hay "sở thích cá nhân của Agent" để ghi đè hoặc vi phạm Rules hoặc Existing Repository Conventions.
- Nếu một best practice chung mâu thuẫn với convention đã nhất quán trong repo, phải ưu tiên convention của repo (trừ khi có yêu cầu tái cấu trúc rõ ràng từ task).

---

## 4. Nguyên tắc Existing Convention First

Trước khi viết mới hoặc chỉnh sửa bất kỳ dòng mã nào, Agent bắt buộc phải khảo sát mã nguồn tương tự đang hoạt động trong repository:

### 4.1. Quy trình khảo sát trước khi viết mã
1. **Tìm implementation tương tự**: Tìm kiếm các file, module hoặc tính năng có vai trò tương đương trong cùng codebase.
2. **Nhận diện Naming Pattern**: Quan sát cách đặt tên file, class, method, variable, interface, DTO.
3. **Xác định File Placement**: Quan sát vị trí đặt tệp tin trong cấu trúc thư mục hiện hành.
4. **Nhận diện Class / Component Structure**: Quan sát cách khai báo dependencies, constructor, lifecycle, export/public API.
5. **Nhận diện Error Handling Pattern**: Quan sát cách bắt lỗi, bọc ngoại lệ, hoặc trả về kết quả thành công/thất bại.
6. **Nhận diện Validation Pattern**: Quan sát vị trí và phong cách kiểm tra tính hợp lệ của dữ liệu đầu vào.
7. **Nhận diện Testing Pattern**: Quan sát cấu trúc test, cách đặt tên test case, kỹ thuật mock/stub hiện có.
8. **Nhận diện Logging Pattern**: Quan sát cách inject và sử dụng logger.

### 4.2. Quy tắc áp dụng
```text
Existing Convention > New Convention
```
- Nếu convention hiện tại đã đáp ứng tốt yêu cầu kỹ thuật và nghiệp vụ, bắt buộc tuân theo convention đó.
- Không tự ý du nhập convention mới, phong cách cú pháp mới chỉ vì Agent quen thuộc hoặc ưa chuộng pattern đó hơn.

---

## 5. Nguyên tắc Không giả định kiến trúc và Giới thiệu Công nghệ Mới (No Architecture Assumption & New Technology Introduction)

Skill 02 không quy định hoặc áp đặt bất kỳ mô hình kiến trúc cụ thể nào lên dự án nếu chưa có bằng chứng vật lý (physical evidence) trong repository:

- **KHÔNG mặc định**: Clean Architecture, Onion Architecture, Hexagonal Architecture, CQRS, Event Sourcing.
- **KHÔNG mặc định Design Pattern**: Mediator, Repository Pattern, Unit of Work, Specification Pattern, Factory Pattern.
- **KHÔNG mặc định State Management**: Redux, Riverpod, BLoC, MobX, Zustand, Vuex.
- **KHÔNG mặc định Data Access / ORM**: Entity Framework Core, Dapper, Prisma, TypeORM, Hibernate.
- **KHÔNG mặc định Utility Libraries**: AutoMapper, FluentValidation, Lodash, RxJS, MediatR.

### 5.1. Nguyên tắc Giới thiệu Công nghệ / Thư viện Mới
- **Không tự ý introduce technology chỉ vì Agent preference**: Không tự tiện đưa thêm thư viện, framework hoặc pattern mới vào dự án chỉ vì sở thích cá nhân hoặc thói quen của Agent.
- **Các trường hợp được phép giới thiệu công nghệ mới**:
  1. Task yêu cầu rõ ràng; HOẶC
  2. Architecture/design decision đã được phê duyệt; HOẶC
  3. Requirement kỹ thuật đủ rõ ràng và việc introduce dependency nằm trong scope được phép.
- **Kỷ luật khi thêm dependency mới**:
  - Phải nêu rõ dependency mới.
  - Nêu rõ lý do kỹ thuật.
  - Nêu rõ tác động tới hệ thống và codebase.
  - Tuyệt đối không âm thầm thêm dependency.
- **Giới hạn phạm vi**: Không biến Skill 02 thành cơ chế phê duyệt kiến trúc (architecture approval mechanism).

---

## 6. Tiêu chuẩn đặt tên (Naming Standards)

Tên gọi là phương tiện truyền đạt ý niệm thiết kế quan trọng nhất trong mã nguồn.

### 6.1. Nguyên tắc cốt lõi
- **Rõ nghĩa và phản ánh trách nhiệm**: Tên biến, hàm, lớp phải thể hiện chính xác nó đại diện cho cái gì hoặc thực hiện hành động gì.
- **Nhất quán với ngữ cảnh domain**: Sử dụng từ vựng domain nhất quán trong toàn bộ module (ví dụ: nếu đã dùng `Medicine` thì không tự ý đổi sang `Drug` hay `PharmaceuticalProduct` trong cùng một ngữ cảnh mà không có lý do).
- **Tránh từ viết tắt tối nghĩa**: Tránh viết tắt tùy tiện hoặc không phổ biến (ví dụ: dùng `customerInvoice` thay vì `custInv`, dùng `transactionCount` thay vì `txCnt`).
- **Tránh tên chung chung**: Tránh các định danh mơ hồ như `data`, `info`, `item`, `temp`, `obj`, `process()`, `handle()`, `doSomething()` trừ khi phạm vi là một lambda cực ngắn mang tính toán học cục bộ.
- **Bảo toàn quy ước hiện tại**: Không thay đổi naming convention hiện có (PascalCase, camelCase, snake_case, UPPER_CASE) của các thành phần đã tồn tại nếu không có yêu cầu kỹ thuật rõ ràng.

### 6.2. Hướng dẫn theo loại đối tượng
- **Class / Struct / Type**: Sử dụng danh từ hoặc cụm danh từ mô tả thực thể hoặc đối tượng chịu trách nhiệm.
- **Interface / Abstraction**: Sử dụng tiền tố hoặc hậu tố theo quy ước hiện có của ngôn ngữ/codebase.
- **Method / Function**: Sử dụng động từ hoặc cụm động từ mô tả hành động (ví dụ: `CalculateSubtotal`, `FindActiveBranches`, `ValidateRequestPayload`).
- **Boolean Variable / Method**: Bắt đầu bằng trợ động từ khẳng định trạng thái (ví dụ: `isValid`, `hasPermission`, `isExpired`, `canModify`).
- **Collection / Array / List**: Sử dụng danh từ số nhiều hoặc có hậu tố rõ nghĩa (ví dụ: `activeBranches`, `pendingOrders`, `invoiceItems`).

---

## 7. Thiết kế Hàm và Phương thức (Functions & Methods)

Hàm và phương thức là các đơn vị logic cơ bản, cần được xây dựng với tính kỷ luật cao:

### 7.1. Trách nhiệm đơn nhất (Single Responsibility)
- Mỗi hàm hoặc phương thức chỉ nên thực hiện trọn vẹn một trách nhiệm logic rõ ràng ở cùng một mức độ trừu tượng.
- Tách rời logic nghiệp vụ tính toán khỏi các thao tác I/O hoặc giao tiếp mạng khi có thể.

### 7.2. Hạn chế tác dụng phụ (Limit Side Effects)
- Hàm tính toán hoặc truy vấn giá trị (query) không được âm thầm làm thay đổi trạng thái của hệ thống hoặc tham số truyền vào (trừ khi hàm được định nghĩa rõ ràng là một lệnh thay đổi trạng thái - command).
- Tránh việc chỉnh sửa trực tiếp các tham số dạng tham chiếu (mutation) nếu không có quy ước rõ ràng.

### 7.3. Danh sách tham số (Parameter List)
- Hạn chế danh sách tham số quá dài.
- Khi một hàm có nhiều tham số liên quan mật thiết, Agent nên xem xét gom nhóm chúng vào một cấu trúc dữ liệu hoặc Request/Options object phù hợp với existing convention.
- Số lượng tham số chỉ là heuristic, không phải hard limit.
- Tránh các tham số kiểu boolean điều khiển luồng (flag arguments) khiến hàm thực hiện hai hành vi hoàn toàn khác nhau; thay vào đó, hãy tách thành hai hàm riêng biệt.

### 7.4. Kiểm soát luồng điều khiển (Control Flow & Cyclomatic Complexity)
- Tránh các khối lệnh lồng nhau quá sâu (nested `if/else`, nested loops).
- Khuyến khích sử dụng kỹ thuật **Return Early / Guard Clauses** để xử lý sớm các trường hợp không hợp lệ hoặc điều kiện biên ngay tại đầu hàm, giữ cho luồng xử lý chính phẳng và trực quan.
- **Không áp dụng hard limit máy móc**: Không đưa ra các quy tắc cứng nhắc như "mọi method phải <= X dòng". Số dòng code chỉ là chỉ số heuristic để gợi ý xem xét refactor khi logic bắt đầu phân tán.

---

## 8. Xử lý lỗi và Ngoại lệ (Error Handling)

Xử lý lỗi đúng đắn đảm bảo hệ thống phản hồi có thể dự đoán và duy trì tính toàn vẹn khi xảy ra sự cố:

### 8.1. Nguyên tắc cốt lõi
- **Không nuốt ngoại lệ âm thầm (Never silently swallow exceptions)**: Tuyệt đối không sử dụng các khối `catch (Exception e) {}` rỗng mà không log, rethrow hoặc xử lý có ý nghĩa. Mọi sự cố bị giấu kín đều dẫn đến lỗi dữ liệu khó phát hiện.
- **Không bắt ngoại lệ nếu không thể xử lý**: Chỉ bắt ngoại lệ (`try-catch`) khi tầng hiện tại có đủ ngữ cảnh để:
  1. Phục hồi một cách an toàn từ lỗi; HOẶC
  2. Bọc (wrap) ngoại lệ thành một lỗi có ý nghĩa hơn ở tầng hiện tại; HOẶC
  3. Dọn dẹp tài nguyên bắt buộc (resource cleanup).
  Nếu không, hãy để ngoại lệ lan truyền lên tầng xử lý lỗi tập trung đã được thiết kế trong hệ thống.
- **Không dùng Exception cho luồng điều khiển thông thường**: Không dựa vào ngoại lệ để xử lý các luồng logic rẽ nhánh bình thường (ví dụ: kiểm tra tồn tại của một phần tử trong danh sách bằng cách bắt lỗi `IndexOutOfRangeException` là phản mẫu).

### 8.2. Phân định ranh giới xử lý lỗi
- **Tuân thủ quy ước lỗi hiện có**: Nếu codebase sử dụng `Result<T>` pattern, hãy tuân theo `Result<T>`. Nếu codebase dùng exceptions truyền thống kết hợp middleware tập trung, hãy tuân theo mô hình đó.
- **Không tự ý định nghĩa HTTP contract**: Skill này không quy định mã trạng thái HTTP (400, 404, 500) hay định dạng Problem Details JSON; việc này hoàn toàn do `08-api-contract.md` kiểm soát.

---

## 9. Xử lý điều kiện biên và Lập trình phòng thủ (Boundary Conditions & Defensive Coding)

Lập trình phòng thủ giúp mã nguồn kiên cường trước dữ liệu bất thường và lỗi phần mềm:

### 9.1. Các điều kiện biên bắt buộc phải xem xét
Code mới hoặc chỉnh sửa phải luôn tự đặt câu hỏi và xử lý an toàn các kịch bản:
- **Null / Undefined**: Biến hoặc tham số có thể là null không? Đã kiểm tra hoặc sử dụng null-safe operators chưa?
- **Empty / Missing Values**: Chuỗi rỗng `""`, chuỗi chỉ có khoảng trắng `" "`, hoặc đối tượng rỗng.
- **Empty Collections**: Danh sách hoặc mảng rỗng `[]` khi duyệt hoặc truy xuất phần tử đầu tiên/cuối cùng.
- **Number Boundaries**: Số 0, số âm, số vượt ngưỡng tràn (overflow), hoặc chia cho 0.
- **Invalid State**: Đối tượng đang ở trạng thái không cho phép thực hiện hành động.
- **External / I/O Failures**: Kết nối mạng bị ngắt, file không tìm thấy, timeout.

### 9.2. Tránh phòng thủ thái quá (Defensive Overkill)
- Kiểm tra tính hợp lệ tại ranh giới nhận dữ liệu (system boundaries/entry points).
- Trong phạm vi các hàm nội bộ tin cậy (internal trusted private helpers), không lặp lại việc kiểm tra null và validation một cách vô nghĩa nếu tầng ngoài đã bảo đảm dữ liệu hợp lệ.
- Tôn trọng tầng validation đã được quy định trong kiến trúc của hệ thống.

---

## 10. Chú thích và Tài liệu mã nguồn (Comments & Documentation)

Chú thích trong mã nguồn là công cụ hỗ trợ truyền thông, không phải nơi viết lại những gì code đã thể hiện:

### 10.1. Comment điều gì?
- **Giải thích LÝ DO (WHY)**: Giải thích vì sao một quyết định kỹ thuật cụ thể được lựa chọn, đặc biệt khi có phương án khác phổ biến hơn.
- **Business Constraints & Invariants**: Các quy định nghiệp vụ phi hiển nhiên hoặc các bất biến dữ liệu bắt buộc.
- **Workarounds & Bug Fixes**: Lý do thực hiện một giải pháp tạm thời (workaround) để khắc phục lỗi của bên thứ ba hoặc hành vi môi trường đặc thù, kèm link hoặc tham chiếu issue nếu có.
- **Complex Algorithms**: Tóm tắt ý tưởng của thuật toán hoặc công thức toán học/logic phức tạp.

### 10.2. KHÔNG comment điều gì?
- **Không comment điều hiển nhiên (Noise comments)**: Ví dụ: `i++; // Tăng i lên 1` hoặc `// Constructor của lớp`.
- **Không để comment mâu thuẫn với code**: Khi sửa đổi mã, bắt buộc phải cập nhật hoặc xóa comment liên quan. Comment sai lệch gây hại hơn là không có comment.
- **Không lưu giữ mã chết (Dead code / Commented-out code)**: Mã nguồn không còn sử dụng phải được xóa bỏ hoàn toàn, không comment lại để "dự phòng". Hệ thống quản lý phiên bản (Git) chịu trách nhiệm lưu trữ lịch sử.

---

## 11. Xử lý trùng lặp và Trừu tượng hóa (Duplication & Abstraction Discipline)

Trùng lặp mã nguồn gây rủi ro sai sót khi bảo trì, nhưng việc trừu tượng hóa sai lầm còn gây hại nghiêm trọng hơn:

### 11.1. Quy trình xử lý khi phát hiện Duplicate Code
1. **Xác định bản chất**: Hai đoạn code có thực sự chia sẻ cùng một trách nhiệm và lý do thay đổi (semantic cohesion) hay không? Hay chúng chỉ tình cờ trông giống nhau về mặt cấu trúc cú pháp ở thời điểm hiện tại?
2. **Khảo sát abstraction hiện có**: Kiểm tra xem trong module hoặc codebase đã có sẵn hàm/lớp/utility nào phục vụ mục đích này chưa.
3. **Trừu tượng hóa có chừng mực**:
   - **Semantic cohesion là tiêu chí chính**: Hai đoạn code có thể cần abstraction nếu semantic cohesion rõ ràng. Ba đoạn code giống nhau không tự động có nghĩa phải tạo abstraction.
   - **Rule of Three chỉ là heuristic**: Pattern lặp lại nhiều lần là tín hiệu để xem xét abstraction. Tuyệt đối không được dùng ">= 3 occurrences" làm điều kiện bắt buộc.

### 11.2. Tránh trừu tượng hóa thái quá (Avoid Over-Abstraction)
- Tuyệt đối không tạo ra các lớp "vô định" như `CommonHelper`, `GenericUtils`, `GeneralManager`, `DataProcessor` chỉ để nhét vài dòng mã giống nhau. Các lớp này nhanh chóng trở thành "bãi rác mã nguồn" và vi phạm tính đóng gói.
- Thà chấp nhận một chút trùng lặp logic cục bộ (local duplication) còn hơn tạo ra một abstraction sai lầm (wrong abstraction) làm gắn kết chặt các module không liên quan.

---

## 12. Khả năng kiểm thử (Testability by Design)

Mã nguồn chất lượng cao phải có khả năng được kiểm thử độc lập mà không cần khởi tạo toàn bộ môi trường phức tạp:

### 12.1. Các nguyên tắc thiết kế vì khả năng test
- **Explicit Dependencies**: Các phụ thuộc bên ngoài của một lớp/module nên được truyền vào tường minh (ví dụ qua constructor hoặc tham số hàm), tránh việc khởi tạo cứng phụ thuộc bên trong hàm (`new Dependency()`).
- **Deterministic Behavior**: Các hàm logic cốt lõi phải mang tính đơn định: cùng một đầu vào luôn tạo ra cùng một đầu ra. Tách biệt các yếu tố ngẫu nhiên, phụ thuộc thời gian hệ thống (`DateTime.Now`) hoặc môi trường ra khỏi logic nghiệp vụ thuần túy.
- **Clear Input & Output**: Thiết kế hàm với đầu vào và đầu ra rõ ràng, giúp việc viết assertions trong test trở nên đơn giản.
- **Isolated Logic**: Dễ dàng cô lập logic cần kiểm tra mà không bị ảnh hưởng bởi I/O, database hoặc giao tiếp mạng.

### 12.2. Giới hạn phạm vi
- Skill 02 không quy định framework kiểm thử cụ thể (xUnit, NUnit, Jest, Mocha, Flutter Test...). Các quy chuẩn riêng về test framework sẽ được xử lý tại các skills hoặc tasks liên quan đến testing.

---

## 13. Kỷ luật tái cấu trúc (Refactoring Discipline)

Tái cấu trúc mã nguồn là hoạt động cải thiện cấu trúc bên trong của mã mà không làm thay đổi hành vi bên ngoài:

### 13.1. Kỷ luật phạm vi (Scope Discipline)
- **Không tái cấu trúc cơ hội (No opportunistic rewrite)**: Không tự ý viết lại các hàm, lớp hoặc module nằm ngoài phạm vi task được giao chỉ vì Agent thấy code "chưa đẹp" hoặc "chưa chuẩn theo ý mình".
- Mọi thay đổi mã nguồn phải có lý do trực tiếp phục vụ mục tiêu của task hiện tại.

### 13.2. Quy trình tái cấu trúc an toàn
1. **Xác định mục tiêu rõ ràng**: Xác định cụ thể đoạn code nào cần cải thiện và vì lý do kỹ thuật gì (ví dụ: giảm độ phức tạp, sửa lỗi trùng lặp logic).
2. **Kiểm tra phụ thuộc (Dependencies)**: Xác định mọi nơi đang gọi đến đoạn code sắp sửa đổi để đảm bảo không phá vỡ hợp đồng sử dụng.
3. **Kiểm tra Tests**: Chạy các test suites hiện có (nếu có) trước khi sửa đổi để thiết lập đường cơ sở (baseline).
4. **Chia nhỏ các bước**: Thực hiện các thay đổi nhỏ, có thể xác minh được ở từng bước (incremental steps), thay vì một lần thay đổi lớn (big bang change).
5. **Bảo toàn hành vi (Preserve Behavior)**: Đảm bảo toàn bộ hành vi nghiệp vụ và kết quả đầu ra được giữ nguyên vẹn sau khi tái cấu trúc.

---

## 14. Nguyên tắc trung lập công nghệ (Technology-Neutral Cross-Stack Principle)

PharmaBranch là một hệ thống đa nền tảng gồm nhiều công nghệ mục tiêu (ASP.NET Core backend, ReactJS web, Flutter mobile, SQL Server database). Do đó, Skill 02 tuân thủ nghiêm ngặt nguyên tắc **Trung lập công nghệ (Technology-Neutral)**:

- **Không gắn cứng quy tắc riêng lẻ cho từng framework**: Không đưa các quy tắc chỉ áp dụng riêng cho C#/.NET, TypeScript/React, Dart/Flutter hay T-SQL vào Skill này.
- **Áp dụng đồng đều nguyên lý**: Các nguyên lý về Readability, Maintainability, Single Responsibility, Defensive Coding, Error Handling và Refactoring Discipline có giá trị phổ quát trên toàn bộ các ngôn ngữ và nền tảng của dự án.
- Các quy định sâu mang tính đặc thù cho từng framework/runtime (ví dụ cú pháp hook trong React, widget lifecycle trong Flutter, LINQ/async-await trong C#) sẽ được hướng dẫn tại các Skills chuyên biệt hoặc được suy ra từ existing repository conventions của từng project con.

---

## 15. Bảng kiểm tra chất lượng mã nguồn (Code Quality Checklist)

Trước khi hoàn tất bất kỳ task viết code, chỉnh sửa hoặc refactor nào, Agent bắt buộc phải tự đối chiếu mã nguồn với danh sách kiểm tra sau:

- [ ] **Tuân thủ Rules**: Mã nguồn không vi phạm bất kỳ quy định nào trong Rules `00` đến `09`.
- [ ] **Tuân thủ task requirements**: Giải quyết đúng và đủ các yêu cầu được giao trong task.
- [ ] **Tuân thủ existing convention**: Nhất quán hoàn toàn với phong cách và quy ước hiện hữu trong repository.
- [ ] **Naming rõ ràng**: Đặt tên có ý nghĩa, phản ánh trách nhiệm, không viết tắt tùy tiện hoặc mơ hồ.
- [ ] **Responsibility rõ ràng**: Hàm và lớp có trách nhiệm đơn nhất, mạch lạc và giới hạn phạm vi tác động.
- [ ] **Error path phù hợp**: Xử lý đầy đủ các nhánh lỗi, không nuốt ngoại lệ âm thầm, không dùng try-catch vô nghĩa.
- [ ] **Boundary conditions được xử lý**: Kiểm soát an toàn các giá trị null, rỗng, số biên và trạng thái bất hợp lệ.
- [ ] **Không duplicate logic không cần thiết**: Không sao chép logic phức tạp; tái sử dụng các abstraction hợp lý sẵn có.
- [ ] **Không abstraction thừa**: Không tạo các lớp Utils/Helper chung chung hoặc trừu tượng hóa sớm khi chưa đủ căn cứ.
- [ ] **Comments có giá trị**: Chỉ chú thích giải thích LÝ DO (WHY), ràng buộc phi hiển nhiên; không lưu giữ dead code.
- [ ] **Testability được duy trì**: Mã nguồn có cấu trúc phụ thuộc rõ ràng, dễ dàng thiết lập kiểm thử độc lập.
- [ ] **Không refactor ngoài scope**: Giữ phạm vi thay đổi tối thiểu cần thiết, không viết lại mã nguồn ngoài yêu cầu task.
- [ ] **Không tạo architecture mới nếu không cần**: Không tự ý áp đặt các kiến trúc, pattern hoặc framework mới khi chưa có evidence.
- [ ] **Không override convention bằng Agent preference**: Tôn trọng mã nguồn của dự án hơn sở thích cá nhân của Agent.

---

## 16. Tương thích và Tuân thủ Rules (Governance Compliance)

Skill này hoạt động dưới sự chi phối trực tiếp của hệ thống Rules `00–09` của PharmaBranch.

### 16.1. Bảng đối chiếu ranh giới với Rules
| Rule | Trách nhiệm của Rule | Mối quan hệ với Skill 02 |
|---|---|---|
| `00-project-governance.md` | Quản trị dự án, kiểm soát thay đổi | Skill 02 tuân thủ kỷ luật phạm vi tối thiểu, bảo toàn naming convention |
| `01-architecture.md` | Kiến trúc Client-Server, phân tầng N-Tier | Skill 02 không thay đổi ranh giới các tầng hay đảo ngược chiều phụ thuộc |
| `02-architecture-quality.md` | Giao dịch, đồng thời, tính toàn vẹn | Code viết ra phải tôn trọng transaction boundaries và concurrency controls |
| `03-security.md` | Xác thực, mã hóa, an ninh tổng thể | Skill 02 không sở hữu cơ chế bảo mật; code không làm lộ bí mật hay bypass an ninh |
| `04-rbac.md` | Mô hình vai trò, quyền hạn | Skill 02 không định nghĩa quyền hay vai trò |
| `05-authorization.md` | Thực thi kiểm soát truy cập runtime | Skill 02 không tự quyết định cho phép/từ chối truy cập |
| `06-branch-isolation.md` | Cô lập dữ liệu chi nhánh | Code không được tạo query hay logic vi phạm ranh giới chi nhánh |
| `07-database-integrity.md` | Toàn vẹn dữ liệu, khóa, ràng buộc DB | Code phải tôn trọng kiểu dữ liệu chính xác (ví dụ decimal) và ràng buộc quan hệ |
| `08-api-contract.md` | Hợp đồng API, HTTP status, DTO schema | Skill 02 không định nghĩa URI, DTO contract hay HTTP response codes |
| `09-observability-operations.md` | Logging cấu trúc, tracing, giám sát | Skill 02 yêu cầu code tuân thủ logging pattern có sẵn, không log dữ liệu nhạy cảm |

### 16.2. Phân định "Tuân thủ" và "Sở hữu" (Compliance ≠ Ownership)
Nguyên tắc cốt lõi:
- **"Skill 02 tuân thủ" ≠ "Skill 02 sở hữu"**.
- Skill 02 tuyệt đối **KHÔNG sở hữu**:
  - transaction
  - concurrency
  - branch isolation
  - database integrity
  - security
  - API contract
- Skill 02 chỉ yêu cầu code không cố ý vi phạm các yêu cầu do Rules/Skills chuyên trách quy định.
- Các quyết định chuyên môn về những lĩnh vực trên phải tuân theo Rules/Skills tương ứng.

### 16.3. Nguyên tắc xử lý xung đột
Nếu phát hiện bất kỳ điểm nào trong Skill 02 mâu thuẫn với Rules `00–09`:
1. **Tuyệt đối KHÔNG sửa Rules**.
2. **Rules luôn luôn thắng (Rules > Skills)**.
3. Điều chỉnh việc thực thi của Skill 02 để đảm bảo tuân thủ đầy đủ các yêu cầu của Rules.
