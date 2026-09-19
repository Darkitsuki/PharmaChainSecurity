---
name: flutter-mobile
description: >
  Chuẩn hóa triển khai, sửa đổi, tái cấu trúc và kiểm thử mobile application Flutter/Dart trong PharmaBranch. Dùng khi làm việc với widgets, screens, state, forms, navigation, API integration, client-side validation và mobile testing.
---

# Flutter Mobile Implementation — Chuẩn mực Triển khai Ứng dụng Di động Flutter / Dart

## 1. Mục tiêu và Phạm vi (Objective & Scope)

Skill này cung cấp các chuẩn mực kỹ thuật và quy tắc triển khai chi tiết cho việc viết mới, chỉnh sửa, tái cấu trúc (refactor) và rà soát (code review) mã nguồn ứng dụng di động **Flutter / Dart** trong dự án PharmaBranch.

Mục tiêu cốt lõi:
- **Chuẩn hóa cách triển khai Flutter/Dart**: Đảm bảo widgets, screens, custom state management, form handling và API integration có cấu trúc rõ ràng, tường minh và dễ bảo trì.
- **Tôn trọng Existing Convention First**: Khảo sát và tuân thủ các quy ước, thư viện, kiến trúc và cấu trúc thư mục thực tế đang có trong repository trước khi viết mã.
- **Tính trung lập công nghệ (Technology Neutrality)**: Tuyệt đối không tự ý du nhập state management, routing, HTTP client hay kiến trúc mobile mới nếu chưa có bằng chứng vật lý (evidence) hoặc yêu cầu rõ ràng từ task.
- **Bảo toàn ranh giới an ninh**: Ứng dụng di động là phương tiện giao diện người dùng (UX) và hiển thị dữ liệu phía client, **tuyệt đối không phải là chốt chặn an ninh có thẩm quyền (security authority)**.
- **Tương thích toàn diện**: Tuân thủ tuyệt đối các quy định của Rules `00–09`, Skill 01 (Onboarding), Skill 02 (Coding Standards), Skill 03 (.NET Backend) và Skill 04 (React Frontend).

---

## 2. Thứ bậc Ưu tiên và Tính Trung lập Công nghệ (Priority Hierarchy & Technology Neutrality)

### 2.1. Thứ bậc ưu tiên bắt buộc
Khi triển khai mã nguồn mobile Flutter, Agent bắt buộc tuân theo thứ bậc ưu tiên sau:

```text
1. Rules hiện hành 00–09
    ↓
2. Yêu cầu cụ thể của Task
    ↓
3. Quy ước thực tế hiện có trong repository / mobile project (Existing conventions)
    ↓
4. Các Skills áp dụng liên quan (Skill 01, Skill 02, Skill 05...)
    ↓
5. Quy chuẩn chính thức của Flutter / Dart / Nền tảng (Official guidelines)
    ↓
6. Thực hành tốt chung trong ngành kỹ nghệ di động (Generic best practices)
    ↓
7. Sở thích cá nhân của Agent (Agent personal preference)
```

**Nguyên tắc cốt lõi**:
- Tuyệt đối không dùng sở thích cá nhân hay "best practice phổ biến trên mạng" để ghi đè các quy định của Rules hoặc conventions đã thiết lập của repository.
- **Existing Convention First**: Luôn ưu tiên áp dụng convention sẵn có trong codebase.

### 2.2. Tính trung lập công nghệ Flutter (Flutter Technology Neutrality)
Skill 05 hỗ trợ nền tảng Flutter/Dart nhưng tuyệt đối **KHÔNG mặc định bắt buộc** bất kỳ công nghệ hay thư viện cụ thể nào sau đây:
- **State Management**: BLoC, Cubit, Riverpod, Provider, GetX, MobX, Redux, ChangeNotifier thuần.
- **Navigation / Routing**: GoRouter, AutoRoute, Beamer, Navigator 1.0 / 2.0.
- **HTTP Client**: Dio, `package:http`, Chopper, Retrofit.
- **Serialization / Immutability**: Freezed, `json_serializable`, manual `fromJson/toJson`, built_value.
- **Dependency Injection / Service Locator**: GetIt, Injectable, Kiwi.
- **Kiến trúc ứng dụng**: Clean Architecture, MVVM, Feature-first, Layer-first.

Các công nghệ trên chỉ được sử dụng khi:
1. Repository đã có bằng chứng vật lý thực tế (physical evidence); hoặc
2. Yêu cầu cụ thể của Task quy định; hoặc
3. Đã có quyết định kiến trúc hợp lệ được phê duyệt trong phạm vi dự án.

**Kỷ luật du nhập công nghệ mới**:
- Không bao giờ thêm package mới vào `pubspec.yaml` một cách âm thầm.
- Nếu thực sự cần giới thiệu technology/package mới, Agent bắt buộc phải nêu rõ trong đề xuất:
  - Tên technology / package cụ thể.
  - Lý do kỹ thuật bắt buộc phải bổ sung.
  - Phạm vi ảnh hưởng trong codebase.
  - Phân tích trade-offs và tác động tới repository hiện tại.

---

## 3. Phân định Trách nhiệm (Ownership Model)

Để duy trì ranh giới rõ ràng trong quản trị dự án, Skill 05 xác định rõ những gì thuộc quyền sở hữu kỹ thuật của mình và những gì là tuân thủ chính sách từ các Rules:

### 3.1. Phạm vi thuộc sở hữu của Skill 05 (Owned Responsibilities)
Skill 05 trực tiếp sở hữu và hướng dẫn kỹ thuật triển khai (MOBILE IMPLEMENTATION HOW) cho các thành phần sau:
1. **Flutter/Dart implementation practices**: Quy chuẩn viết mã Dart hiện đại kết hợp sound null-safety.
2. **Widget implementation**: Thiết kế và triển khai Flutter widgets có trách nhiệm đơn nhất, tối ưu composition.
3. **Screen / Page implementation**: Điều phối bố cục màn hình, kết nối dữ liệu, điều hướng và quản lý trạng thái mức màn hình.
4. **Navigation implementation**: Triển khai điều hướng, truyền tham số và quản lý back navigation theo router thực tế của project.
5. **State handling**: Quản lý trạng thái giao diện phía client (client-side state implementation HOW): ephemeral state, screen state, và form state.
6. **Form implementation & Client validation**: Xử lý nhập liệu, validation phản hồi tức thì trên client, quản lý trạng thái submitting/disabled.
7. **API integration**: Tích hợp gọi HTTP API theo hợp đồng của Rule 08, xử lý request/response DTOs.
8. **DTO / Model mapping**: Ánh xạ giữa transport DTOs, domain models và UI models khi cần thiết.
9. **Serialization**: Chuyển đổi JSON sang object an toàn theo convention hiện có.
10. **Async operations & Widget lifecycle**: Quản lý vòng đời tác vụ bất đồng bộ phù hợp với vòng đời của Widget.
11. **Loading / Success / Empty / Error states**: Thiết kế trải nghiệm đầy đủ cho mọi trạng thái dữ liệu trên mobile.
12. **Accessibility & Mobile UX**: Đảm bảo Semantics, hỗ trợ screen reader, touch targets và typography tương thích mobile.
13. **Performance optimization**: Tối ưu rebuild, tối ưu danh sách lớn, quản lý bộ nhớ dựa trên bằng chứng thực tế.
14. **Flutter testing**: Triển khai unit tests, widget tests và integration tests theo convention của project.
15. **Refactoring Flutter code**: Quy trình tái cấu trúc an toàn, có kiểm soát, bảo toàn hành vi.
16. **Platform integration**: Hướng dẫn tích hợp platform phía mobile client cần thiết cho task.

### 3.2. Phạm vi KHÔNG thuộc sở hữu của Skill 05 (Non-Responsibilities)
Skill 05 tuyệt đối **KHÔNG sở hữu** các chính sách và thẩm quyền hệ thống sau:
- **System Architecture Policy**: Thuộc `01-architecture.md`.
- **General Coding Standards**: Thuộc `02-coding-standards` (Skill 05 kế thừa và tham chiếu).
- **Authentication Policy / JWT Specification**: Thuộc `03-security.md`.
- **RBAC Model & Role Definitions**: Thuộc `04-rbac.md`.
- **Runtime Authorization Enforcement**: Thuộc `05-authorization.md`.
- **Branch Isolation / Tenant Boundary**: Thuộc `06-branch-isolation.md`.
- **Database Integrity Policy**: Thuộc `07-database-integrity.md`.
- **API Contract Ownership & Protocols**: Thuộc `08-api-contract.md`.
- **Observability Policy & Logging Standards**: Thuộc `09-observability-operations.md`.
- **Business State Machine, Transaction & Server State Policy**: Thuộc các Rules tương ứng (`02`, `04`, `05`), domain và backend; Skill 05 chỉ sở hữu client-side state implementation HOW.
- **Native Security, Signing, CI/CD & Deployment Policy**: Thuộc Rule hoặc skill khác; Skill 05 không sở hữu native security architecture, application signing/release policy, CI/CD infrastructure hay platform-wide deployment policy.
- **Pharma Business Rules**: Thuộc đặc tả nghiệp vụ nhà thuốc PharmaBranch.
- **Backend Implementation**: Thuộc Skill 03 (`03-dotnet-backend`).
- **Web React Implementation**: Thuộc Skill 04 (`04-react-frontend`).
- **Architecture Selection**: Thuộc Rules, hiện trạng repository hoặc quyết định kiến trúc được phê duyệt.

Nguyên tắc bất biến:
```text
"Skill 05 tuân thủ" ≠ "Skill 05 sở hữu"
```
Rules sở hữu CHÍNH SÁCH VÀ BẤT BIẾN (POLICY / INVARIANTS). Skill 05 sở hữu KỸ THUẬT TRIỂN KHAI MOBILE (HOW TO IMPLEMENT).

---

## 4. Khảo sát Dự án Flutter (Flutter Project Discovery)

Trước khi viết mới hoặc chỉnh sửa mã nguồn Flutter, Agent bắt buộc phải khảo sát hiện trạng repository để thu thập bằng chứng vật lý (physical evidence).

15-point discovery dưới đây là **flutter-specific discovery**, bổ sung cho Skill 01 (`01-codebase-onboarding`); **không thay thế hoặc lặp lại toàn bộ repository onboarding của Skill 01**:
- **Skill 01**: Sở hữu repository-wide discovery và khảo sát tổng thể hiện trạng repository.
- **Skill 05**: Sở hữu flutter-specific discovery chuyên sâu phục vụ triển khai ứng dụng di động.

### 4.1. Mười lăm điểm khảo sát bắt buộc
1. **Flutter project root**: Xác định thư mục chứa dự án Flutter (thư mục chứa `pubspec.yaml`).
2. **Đọc `pubspec.yaml`**: Kiểm tra danh sách dependencies, dev_dependencies, assets, fonts và environment constraints.
3. **Dart / Flutter version**: Kiểm tra phiên bản Dart SDK và Flutter SDK quy định trong `pubspec.yaml` hoặc `.metadata`.
4. **Thư mục `lib/`**: Xem xét cấu trúc tổ chức mã nguồn bên trong `lib/` (theo features, layers hay mô hình khác).
5. **Entry point**: Kiểm tra `lib/main.dart` hoặc các flavors/environments entry points (`main_dev.dart`, `main_prod.dart`).
6. **Routing convention**: Đang dùng GoRouter, AutoRoute, Navigator 1.0 (`routes` table, `onGenerateRoute`) hay router tùy biến.
7. **State management hiện tại**: Đang dùng BLoC, Riverpod, Provider, GetX hay chỉ dùng `StatefulWidget` / `ChangeNotifier`.
8. **API client hiện tại**: Đang dùng Dio instance, `package:http`, custom wrapper hay API client abstraction sẵn có.
9. **Model / DTO convention**: Cách tổ chức models, vị trí lưu trữ và cấu trúc định nghĩa các thực thể dữ liệu.
10. **Serialization convention**: Đang dùng `json_serializable`, Freezed, hay tự viết tay các hàm `fromJson` / `toJson`.
11. **Dependency Injection**: Có sử dụng GetIt, Provider, Injectable hay passing dependencies thủ công qua constructors.
12. **Testing convention**: Kiểm tra thư mục `test/` để xem convention viết unit test, widget test và mocking library (`mockito`, `mocktail`).
13. **Naming convention**: Quy ước đặt tên file (snake_case), class (PascalCase), method/variable (camelCase) và constant (lowerCamelCase hoặc screaming snake).
14. **Asset / Resource convention**: Quy ước khai báo hình ảnh, icon, SVG, fonts, localization (l10n/i18n).
15. **Platform-specific code**: Kiểm tra các thư mục `android/`, `ios/` xem có custom native plugins hoặc MethodChannel nào đang dùng.

### 4.2. Ý nghĩa khảo sát: "Không tìm thấy" là kết quả hợp lệ
- **Mục đích của Discovery**: Khảo sát nhằm xác định bằng chứng vật lý thực tế (physical evidence) đang có trong repository, **tuyệt đối KHÔNG phải là danh sách kiểm tra sự tồn tại bắt buộc** của các công nghệ đó.
- **"Không tìm thấy" là một kết quả hoàn toàn hợp lệ**: Nếu repository chưa có dự án Flutter thực tế, hoặc không sử dụng các thư viện như BLoC, Riverpod, GoRouter, Dio, Freezed, Agent phải chấp nhận hiện trạng đó. Tuyệt đối không được tự ý suy diễn rằng repository "thiếu sót" và không được tự ý du nhập công nghệ mới.
- **Không áp đặt cấu trúc giả định**: Nếu repository chưa có Flutter project thực tế, Agent **KHÔNG được giả định một cấu trúc Flutter cụ thể** là cấu trúc hiện tại của repository.

---

## 5. Chuẩn mực Chất lượng Mã nguồn Dart (Dart Code Quality)

Tuân thủ toàn diện các quy chuẩn chất lượng mã nguồn từ **Skill 02 (`02-coding-standards`)**:

### 5.1. Nguyên tắc lập trình Dart sạch
- **Mã nguồn dễ đọc và mạch lạc**: Ưu tiên tính rõ ràng, tường minh hơn là viết code ngắn nhưng khó hiểu.
- **Hàm nhỏ, gắn kết cao (Small Cohesive Functions)**: Mỗi hàm hoặc method chỉ nên thực hiện một nhiệm vụ duy nhất.
- **Phụ thuộc tường minh (Explicit Dependencies)**: Truyền các dependencies qua constructor thay vì sử dụng biến toàn cục hoặc service locator ẩn.
- **Hành vi có thể dự đoán (Predictable Behavior)**: Không tạo các tác dụng phụ (side effects) ngoài mong muốn trong quá trình build UI hoặc getter calls.
- **Tính bất biến phù hợp (Appropriate Immutability)**:
  - Khai báo biến `final` khi giá trị không thay đổi sau khởi tạo.
  - Sử dụng constructor `const` cho các widgets tĩnh để Flutter tối ưu hóa cây widget (widget tree) không phải rebuild thừa.
- **Khả năng kiểm thử (Testability)**: Tách biệt logic tính toán khỏi UI rendering để dễ dàng viết unit tests độc lập.

### 5.2. Chống lạm dụng Abstraction
- Không tạo abstraction chỉ để làm code "trông đẹp" hoặc cố gắng tạo kiến trúc quá phức tạp khi quy mô chưa cần.
- **Tuyệt đối KHÔNG tạo các anti-patterns**:
  - `GenericUtils`, `CommonHelper`, `GlobalHelper`: Nơi gom góp các hàm tiện ích không có tính gắn kết ngữ nghĩa.
  - `God Class` / `God Widget`: Class hoặc widget chứa hàng nghìn dòng mã xử lý quá nhiều trách nhiệm.
  - `Overly Generic Base Widgets`: Các lớp BaseWidget hay BaseScreen quá cồng kềnh, can thiệp sâu vào vòng đời và làm ẩn giấu luồng thực thi của widget con.

---

## 6. Kỷ luật Null-Safety trong Dart (Dart Null Safety)

Triển khai mã nguồn tuân thủ nghiêm ngặt chuẩn Sound Null-Safety của Dart:

### 6.1. Nguyên tắc áp dụng
- **Không lạm dụng toán tử ép kiểu null (`!`)**: Tuyệt đối tránh sử dụng `!` (forced unwrap) chỉ để làm thỏa mãn compiler. Chỉ sử dụng khi đã có kiểm tra null tường minh ngay trước đó hoặc có khẳng định chắc chắn về mặt logic.
- **Kỷ luật Nullable đúng ngữ nghĩa**: Nullable (`Type?`) chỉ được sử dụng khi giá trị thực sự có thể vắng mặt (absent/null) theo runtime semantics, API contract, UI state, platform semantics hoặc domain semantics. Không khai báo nullable chỉ để né compiler và không biến toàn bộ model/state thành nullable một cách tùy tiện.
- **Xử lý `dynamic` tại JSON/API Boundary**: Hạn chế sử dụng `dynamic` trong mã nguồn business và UI; tuy nhiên, `dynamic` có thể xuất hiện tại ranh giới phân tích dữ liệu JSON/API (ví dụ: `Map<String, dynamic>`) khi framework hoặc dữ liệu không định kiểu yêu cầu. Sau khi tiếp nhận tại boundary, phải thu hẹp kiểu (narrow type) sang model/type cụ thể càng sớm càng tốt; không yêu cầu loại bỏ tuyệt đối `dynamic` khỏi mọi JSON boundary.
- **Tránh Type Cast không kiểm chứng**: Hạn chế ép kiểu `as Type` khi chưa kiểm tra kiểu dữ liệu bằng toán tử `is` hoặc cơ chế type-safe parsing.

### 6.2. Xử lý giá trị Null hợp lệ
Khi một trường dữ liệu hợp lệ có thể là null, phải xử lý đầy đủ các kịch bản:
- **Null State / Missing Data**: Hiển thị giá trị mặc định thân thiện (ví dụ: "Chưa cập nhật", "N/A") thay vì để crash ứng dụng.
- **Loading State**: Giá trị null biểu thị dữ liệu đang trong quá trình tải.
- **Optional Field**: Trường dữ liệu tùy chọn không bắt buộc phải có trong form hoặc DTO.
- **Unavailable Resource**: Tài nguyên không tồn tại hoặc bị từ chối truy cập.

**Lưu ý**: Không biến null-safety thành defensive coding quá mức làm rối loạn mã nguồn bằng hàng loạt câu lệnh kiểm tra null vô nghĩa cho những biến đã được khẳng định `non-nullable`.

---

## 7. Thiết kế Widget và Tái sử dụng (Widget Design & Reusability)

### 7.1. Nguyên tắc Trách nhiệm Đơn nhất (Single Responsibility)
Mỗi widget nên tập trung vào một nhiệm vụ hiển thị hoặc điều phối giao diện cụ thể:
- `MedicineCard`: Hiển thị thông tin tóm tắt của một sản phẩm thuốc.
- `MedicineListView`: Điều phối danh sách, xử lý scroll và hiển thị các trạng thái loading/empty của thuốc.
- `MedicineSearchBar`: Quản lý giao diện nhập liệu tìm kiếm thuốc.
- `InvoiceTotalSummary`: Hiển thị tổng quan số tiền và chiết khấu của hóa đơn.

**Tránh Widget "Khổng Lồ" (God Widgets)**:
Tuyệt đối không để một widget trở thành nơi chứa toàn bộ:
- Gọi API trực tiếp
- Xử lý business logic phức tạp
- Điều phối navigation
- Quản lý state toàn cục
- Client validation
- UI presentation

Nếu repository đã có convention tách các trách nhiệm này (như repositories, services, controllers/blocs, presentation), bắt buộc phải tuân theo.

### 7.2. Ưu tiên Composition hơn Inheritance
- Ưu tiên phối hợp nhiều widget nhỏ gọn (Composition) thay vì kế thừa nhiều tầng từ một widget cha phức tạp.
- Sử dụng thuộc tính `child` hoặc `builder` để tăng tính tái sử dụng và linh hoạt.

### 7.3. Constructor Parameters & Props
- Khi widget nhận tham số (props/constructor parameters), phải định nghĩa kiểu dữ liệu tường minh, sử dụng `required` cho các trường bắt buộc và cung cấp giá trị mặc định hợp lý cho trường tùy chọn.
- Widget không nhận tham số không cần tạo cấu trúc props nhân tạo.
- Chỉ sử dụng constructor `const` khi widget cùng constructor và super-constructor đáp ứng đầy đủ điều kiện `const` của Dart, đồng thời phù hợp với convention của repository. Không biến `const` thành một yêu cầu hiệu năng tuyệt đối trong mọi tình huống.

### 7.4. Kỷ luật Tái sử dụng Widget
- Chỉ tạo Reusable Widget khi có tính tương đồng ngữ nghĩa rõ ràng (semantic cohesion) và có nhu cầu tái sử dụng thực tế ở nhiều màn hình.
- Không gộp hai widget thành một abstraction dùng chung chỉ vì chúng có layout hoặc màu sắc ngẫu nhiên tương tự nhau nhưng phục vụ hai miền nghiệp vụ hoàn toàn khác biệt.

---

## 8. Quản lý Trạng thái (State Management)

### 8.1. Tôn trọng giải pháp State Management hiện tại
- Skill 05 chỉ sở hữu **kỹ thuật triển khai trạng thái phía client (client-side state implementation HOW)**. Skill 05 **không sở hữu** authentication policy, authorization policy, business state machine, transaction state hay backend/server state policy (các chính sách và nguồn chân lý này thuộc về Rules `02`, `03`, `04`, `05`, backend và domain tương ứng).
- Skill 05 tuyệt đối **không tự ý chọn hoặc thay đổi state management framework**. Phải khảo sát và tuân thủ cơ chế quản lý trạng thái thực tế của repository (ví dụ: BLoC, Riverpod, Provider hay State cục bộ).

### 8.2. Phân định các tầng trạng thái (State Taxonomy)
Hệ thống mobile cần phân biệt rõ ràng các tầng trạng thái:
1. **Ephemeral / Local UI State**: Trạng thái riêng biệt của một widget (đóng/mở dropdown, tab đang chọn, trạng thái focus, animation) nên được quản lý bằng cơ chế local state phù hợp với repository, chẳng hạn `StatefulWidget`, `ValueNotifier` hoặc cơ chế tương đương.
2. **Screen State**: Trạng thái phục vụ riêng một màn hình cụ thể (dữ liệu đang xem, form state, filter tạm thời của màn hình) được quản lý trong phạm vi controller/state manager của màn hình theo quy ước dự án (ví dụ bloc, provider, controller hoặc cơ chế tương đương).
3. **Shared Application State**: Trạng thái cần chia sẻ giữa nhiều màn hình độc lập (giỏ hàng hiện tại, ngôn ngữ ứng dụng, theme) được quản lý qua state manager cấp ứng dụng phù hợp với repository.
4. **Server State**: Dữ liệu nhận về từ backend API (danh mục thuốc, tồn kho chi nhánh, lịch sử hóa đơn) phải tuân theo data-fetching/state convention thực tế của repository. Caching chỉ sử dụng khi repository convention, yêu cầu của task, đặc thù nghiệp vụ hoặc bằng chứng đo lường thực tế cho thấy cần thiết; không ngầm hiểu hoặc bắt buộc rằng mọi server state đều phải có cache.
5. **Authentication / Session State**: Trạng thái đăng nhập của người dùng trên mobile (User profile cơ bản, auth status) được quản lý qua Auth service/state manager chuyên trách của client.
6. **Cached State**: Dữ liệu lưu trữ tạm thời dưới client phục vụ offline hoặc truy xuất nhanh theo giải pháp lưu trữ của repository.
Các ví dụ về công cụ/lớp trạng thái nêu trên chỉ mang tính minh họa, không áp đặt implementation bắt buộc.

### 8.3. Kỷ luật Quản lý State
- **Không lạm dụng Global State**: Không đưa server state hoặc local UI state vào global state chỉ vì tiện lợi.
- **Tránh Rebuild thừa thãi**: Sử dụng selector, scoped state hoặc cơ chế tương đương nếu state-management solution hiện tại của repository hỗ trợ, nhằm giới hạn phạm vi rebuild.
- **Tránh Mutable Global State ẩn giấu**: Không sử dụng biến toàn cục có thể thay đổi (mutable globals) gây ra các tác dụng phụ khó lần vết.
- **Vòng đời rõ ràng**: Các object có resource hoặc lifecycle cần quản lý phải có cơ chế cleanup phù hợp như dispose, close, cancellation hoặc cơ chế tương đương. Không phải mọi state object đều bắt buộc phải có dispose/close nếu chúng không nắm giữ tài nguyên cần giải phóng.

---

## 9. Điều hướng và Chuyển màn hình (Navigation & Routing)

### 9.1. Tuân thủ Router hiện tại
- Điều hướng phải tuân thủ router mechanism thực tế của repository (GoRouter, AutoRoute hay Navigator 1.0/2.0).
- Không tự ý du nhập thư viện routing mới vào project.

### 9.2. Trách nhiệm của Screen Component
Screen component (màn hình ứng dụng) chịu trách nhiệm:
- Tiếp nhận tham số đường dẫn (route arguments / path parameters) theo quy ước router của project.
- Phối hợp các widget con để dựng nên bố cục hoàn chỉnh của màn hình.
- Kết nối với tầng dữ liệu/state tương ứng và xử lý các trạng thái: Screen loading, Screen error, Screen empty.
- Xử lý back navigation (phím Back vật lý trên Android, cử chỉ vuốt trên iOS): Sử dụng cơ chế back-navigation phù hợp với Flutter version và routing convention của repository, ví dụ `PopScope` hoặc cơ chế tương đương.
- Xử lý deep links khi task yêu cầu.

### 9.3. Ranh giới Bảo mật trong Điều hướng (Route Protection vs. Security Authority)
- **Client Route Guard chỉ phục vụ UX**: Việc kiểm tra trạng thái đăng nhập hoặc quyền hạn trước khi chuyển hướng chỉ có mục đích cải thiện trải nghiệm người dùng (chuyển về trang đăng nhập hoặc không hiển thị màn hình quản trị).
- **Client Navigation KHÔNG PHẢI là chốt chặn an ninh**:
  ```text
  Client Navigation / Guard → Hỗ trợ trải nghiệm người dùng (UX Flow)
  Backend Authorization    → Thẩm định và bảo vệ an ninh thực sự (Security Enforcement)
  ```
- **Tuyệt đối không coi "Ẩn màn hình / Không hiển thị nút bấm" là hệ thống đã được bảo mật**: Mọi endpoint API mà màn hình gọi tới bắt buộc phải được backend thẩm định độc lập theo Rules `03`, `04`, `05`, `06`.

---

## 10. Tích hợp Gọi API (API Client Integration)

Toàn bộ hợp đồng API thuộc quyền sở hữu tối cao của **Rule 08 (`08-api-contract.md`)**, bao gồm URI, HTTP method, request DTO, response DTO, pagination, error semantics, HTTP status codes, idempotency và correlation. Không sử dụng REST conventions chung chung để tự tạo contract mặc định. Skill 05 chỉ hướng dẫn cách thức tích hợp và sử dụng hợp đồng từ ứng dụng Flutter.

### 10.1. Tuân thủ tuyệt đối Hợp đồng API
Ứng dụng Flutter bắt buộc phải:
- Sử dụng đúng URI do Rule 08 và backend công bố; không tự suy diễn URI dựa trên REST conventions chung chung.
- Sử dụng đúng HTTP Method theo contract của Rule 08 (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`...).
- Gửi đúng cấu trúc Request DTO, không gửi thừa các trường nội bộ.
- Tiếp nhận và giải mã đúng cấu trúc Response DTO.
- Tuân thủ hợp đồng phân trang có giới hạn theo Rule 08 và API contract thực tế của backend (các trường như `page`, `pageSize`, `totalCount`, `totalPages` chỉ là ví dụ minh họa; không tự suy diễn pagination schema từ Skill 05; Rule 08 và API contract thực tế mới là authority).
- Gửi header `Idempotency-Key` khi thực hiện các tác vụ thay đổi dữ liệu nhạy cảm nếu contract của Rule 08 và backend yêu cầu.
- Lan truyền hoặc tiếp nhận `X-Correlation-ID` khi contract quy định.
- **Không tự phát minh API contract**: Các ví dụ về URI, status code, DTO nêu trong tài liệu chỉ mang tính minh họa; contract thực tế của Rule 08 và repository mới là authority duy nhất.

### 10.2. Lựa chọn và sử dụng HTTP Client
- Tuân thủ abstraction HTTP client hiện có trong repository:
  - Nếu project đang dùng Dio instance (đã gắn interceptors xử lý auth token, refresh token, correlation id), bắt buộc dùng instance đó.
  - Nếu project đang dùng `package:http` được bọc trong custom API client, tuân thủ client đó.
  - Không tạo thêm HTTP client thứ hai nếu không có lý do kiến trúc chính đáng.

### 10.3. Xử lý phản hồi và lỗi API
Flutter client phải phân biệt rõ các kịch bản lỗi để hiển thị UI phù hợp (các mã trạng thái HTTP như 401, 403, 400, 422, 404, 409, 500 nêu dưới đây chỉ là ví dụ minh họa; contract thực tế của Rule 08 và repository mới là authority):
- **Lỗi Mạng (Network Failure / Timeout / SocketException)**: Mất kết nối internet hoặc máy chủ không phản hồi -> hiển thị banner hoặc màn hình mất kết nối, cung cấp nút Thử lại (Retry) cho các tác vụ an toàn.
- **Lỗi Xác thực (ví dụ 401 Unauthorized)**: Token hết hạn hoặc không hợp lệ -> kích hoạt luồng làm mới token (refresh token) nếu hệ thống hỗ trợ, hoặc điều hướng người dùng về màn hình đăng nhập.
- **Lỗi Phân quyền (ví dụ 403 Forbidden)**: Người dùng không có quyền truy cập -> hiển thị thông báo từ chối truy cập rõ ràng.
- **Lỗi Dữ liệu không hợp lệ (ví dụ 400 Bad Request / 422 Problem Details)**: Ánh xạ lỗi validation chi tiết tới từng trường nhập liệu trên form.
- **Lỗi Không tìm thấy (ví dụ 404 Not Found)**: Hiển thị thông báo tài nguyên không tồn tại.
- **Lỗi Xung đột trạng thái (ví dụ 409 Conflict)**: Xung đột dữ liệu hoặc trùng lặp yêu cầu -> thông báo người dùng tải lại dữ liệu mới nhất.
- **Lỗi Máy chủ (ví dụ 500 Internal Server Error)**: Thông báo hệ thống gặp sự cố. Chỉ hiển thị mã tham chiếu lỗi hoặc correlation identifier khi API contract hoặc UX specification cho phép; không tự ý expose thông tin hạ tầng nội bộ. **Tuyệt đối không bao giờ hiển thị raw stack trace, câu lệnh SQL, secrets hoặc chi tiết hạ tầng của backend lên giao diện người dùng**.

---

## 11. Mô hình Dữ liệu và Ánh xạ (DTO / Domain Model / UI Model)

### 11.1. Phân định các tầng Model khi cần thiết
Khi làm việc với dữ liệu trên mobile, có thể phân biệt ba loại mô hình khi nghiệp vụ yêu cầu:
1. **API DTO (Data Transfer Object)**: Đại diện cho dữ liệu thô nhận từ hoặc gửi lên backend, khớp 100% với cấu trúc JSON của Rule 08.
2. **Domain / Application Model**: Đại diện cho thực thể nghiệp vụ cốt lõi bên trong ứng dụng client, độc lập với hình thái JSON của API.
3. **UI / Form Model**: Đại diện cho dữ liệu hiển thị hoặc nhập liệu trên màn hình, chứa các trường phục vụ riêng cho giao diện (như định dạng tiền tệ, trạng thái error của input, cờ toggle).

### 11.2. Kỷ luật Ánh xạ dữ liệu
- **Không áp dụng máy móc**: Không bắt buộc mọi màn hình hay mọi thực thể đều phải tạo đủ 3 loại models.
- **Tái sử dụng hợp lý**: Có thể tái sử dụng trực tiếp API DTO types tại API boundary khi cấu trúc dữ liệu đơn giản và không có sự biến đổi.
- **Ánh xạ khi có biến đổi**: Khi UI cần chuẩn hóa, kết hợp dữ liệu từ nhiều nguồn, định dạng hiển thị hoặc quản lý form nhập liệu, hãy ánh xạ sang UI model riêng biệt thay vì để cấu trúc DTO thô lan tràn khắp tầng presentation.

---

## 12. Tuần tự hóa và Chuyển đổi dữ liệu (Serialization & Parsing)

### 12.1. Tuân thủ Convention của Repository
- Tuân thủ cơ chế serialization hiện có trong codebase (tự viết tay `fromJson/toJson`, sử dụng `json_serializable`, hay `Freezed`).
- Không tự ý thêm code generation framework nếu repository chưa sử dụng.

### 12.2. Kỷ luật Parsing an toàn
Khi parse JSON từ API phản hồi:
- **Xử lý an toàn các trường Null và Missing**: Sử dụng toán tử null-aware hoặc fallback hợp lý cho các trường tùy chọn.
- **Kiểm tra kiểu dữ liệu (Type Safety)**: Tránh lỗi runtime `type 'int' is not a subtype of type 'double'` bằng cách ép kiểu an toàn (ví dụ: `(json['price'] as num?)?.toDouble()`).
- **Xử lý Enum an toàn**: Cung cấp giá trị fallback hoặc xử lý ngoại lệ khi backend trả về một enum mới mà client chưa cập nhật.
- **Xử lý Date/Time**: Parse Date/Time theo format và timezone được API contract quy định. Sử dụng ISO 8601 nếu contract quy định ISO 8601 (`DateTime.tryParse`). Chỉ chuyển đổi sang UTC hoặc local timezone khi semantics của contract yêu cầu.
- **Không che giấu lỗi API**: Tuyệt đối không âm thầm chuyển đổi dữ liệu sai kiểu thành dữ liệu hợp lệ một cách tùy tiện nếu điều đó che giấu lỗi schema nghiêm trọng từ backend.

---

## 13. Xử lý Biểu mẫu và Client Validation (Forms & Client-side Validation)

### 13.1. Quản lý Biểu mẫu trên Mobile
- Quản lý trạng thái form linh hoạt: dữ liệu nhập (`values`), lỗi (`errors`), trạng thái đang gửi (`isSubmitting`), trạng thái đã sửa đổi (`isDirty`) tùy theo yêu cầu nghiệp vụ thực tế.
- **Trải nghiệm nhập liệu trên di động (Mobile Keyboard & Input UX)**:
  - Chọn đúng `TextInputType` (text, number, emailAddress, phone).
  - Chọn đúng `TextInputAction` (next, done, search) để hỗ trợ người dùng di chuyển giữa các trường.
  - Quản lý `FocusNode` hợp lý, tự động đóng bàn phím (`FocusScope.of(context).unfocus()`) khi chạm ra ngoài form.
- **Chống Submit trùng lặp (Double Submit)**: Disable hoặc lock action trong thời gian submission khi phù hợp với UI flow (`isSubmitting = true`). Debounce/throttle chỉ sử dụng khi phù hợp với interaction. UI double-submit prevention chỉ là UX protection và không thay thế server-side idempotency hoặc duplicate protection (tuyệt đối không suy diễn debounce/throttle = idempotency).

### 13.2. Vai trò của Client-side Validation
- **Mục đích của Client Validation**: Cung cấp phản hồi tức thì, thân thiện cho người dùng trên thiết bị di động (ví dụ: trường bắt buộc, định dạng số điện thoại, số lượng thuốc phải lớn hơn 0), giảm thiểu các request sai cú pháp gửi lên server.
- **Client Validation KHÔNG thay thế Server Validation**: Mọi quy tắc nghiệp vụ tối cao (tồn kho thuốc có đủ không, giá bán có hợp lệ không, đơn thuốc có cần phê duyệt không) bắt buộc phải do backend thẩm định.
- Không sao chép các ràng buộc nghiệp vụ một cách mù quáng nếu backend là nguồn chân lý duy nhất (source of truth).

---

## 14. Vòng đời Bất đồng bộ và Widget Lifecycle (Async & Widget Lifecycle)

Khi làm việc với các tác vụ bất đồng bộ trên ứng dụng di động:

### 14.1. Tôn trọng Vòng đời Widget
- **Kiểm tra `mounted` trước khi gọi `setState`**: Trong `StatefulWidget`, luôn kiểm tra thuộc tính `mounted` trước khi cập nhật state sau một thao tác `await` để tránh lỗi `setState() called after dispose()`.
- **Dọn dẹp tài nguyên trong `dispose()`**:
  - Hủy bỏ các `AnimationController`.
  - Hủy bỏ các `TextEditingController` và `FocusNode`.
  - Hủy bỏ các `Timer` (`timer.cancel()`).
  - Hủy bỏ hoặc đóng các `StreamSubscription` (`subscription.cancel()`).
  - Đóng các `Bloc` / `ChangeNotifier` nếu widget là nơi tạo ra chúng.
  - **Quy tắc sở hữu vòng đời (Dispose Ownership)**: Chỉ dispose/close resource mà component hiện tại sở hữu lifecycle, hoặc theo convention/ownership contract của repository. Tuyệt đối không được dispose object được quản lý bởi component khác hoặc do component cha/DI truyền vào.

### 14.2. Quản lý Lifecycle của Async Work
- **Quản lý Lifecycle của Async Requests**: Nếu HTTP client/repository hỗ trợ cancellation và component sở hữu lifecycle của request, việc hủy bỏ (cancel) request không còn cần thiết khi màn hình đóng hoặc khi thao tác mới được kích hoạt là phù hợp. Nếu cancellation không được hỗ trợ, bắt buộc sử dụng cơ chế phù hợp (như kiểm tra thuộc tính `mounted`, đánh dấu request ID) để ngăn ngừa stale result hoặc inappropriate state update; không giả định mọi HTTP abstraction đều hỗ trợ cancellation. Các StreamSubscription thuộc quyền sở hữu của widget phải được hủy bỏ khi dispose.
- **Phòng chống Race Conditions có căn cứ (Tránh Over-engineering)**: Chỉ áp dụng request ID, cancellation token hoặc stale-result protection khi task thực sự có competing requests, out-of-order responses, lifecycle mismatch hoặc cancellation requirement (ví dụ: tìm kiếm dạng type-ahead, filter thay đổi liên tục). Không tự ý tạo custom concurrency abstraction phức tạp chỉ để đáp ứng checklist.
- **Phân biệt rạch ròi bản chất**: Không đánh đồng mọi tác vụ async đang pending khi dispose là "memory leak". Cần phân biệt rõ:
  - *Cancellation*: Hủy bỏ tác vụ khi không còn cần.
  - *Stale Result*: Kết quả trả về sau khi ngữ cảnh đã thay đổi.
  - *Retained Resource*: Tài nguyên bị giữ lại không thể giải phóng.
  - *Subscription Leak*: Quên cancel listener/stream dẫn đến rò rỉ bộ nhớ thực sự.
  - *Inappropriate State Update*: Cập nhật state sau khi widget đã bị unmount.

---

## 15. Các trạng thái Giao diện dữ liệu (Loading / Success / Empty / Error States)

Mọi màn hình hoặc thành phần giao diện phụ thuộc dữ liệu bất đồng bộ bắt buộc phải xử lý đầy đủ các trạng thái:
1. **Initial State**: Trạng thái ban đầu khi chưa kích hoạt tải dữ liệu.
2. **Loading State**: Hiển thị indicator rõ ràng (CircularProgressIndicator, Shimmer loading skeleton) khi đang tải; không để màn hình trắng hoặc treo ứng dụng.
3. **Success State**: Hiển thị dữ liệu đầy đủ, mạch lạc khi request thành công.
4. **Empty State**: Khi danh sách hoặc kết quả tìm kiếm không có dữ liệu, giải thích rõ tình trạng không có dữ liệu và cung cấp hành động phù hợp khi có hành động hữu ích (ví dụ: "Không tìm thấy thuốc phù hợp", nút "Xóa bộ lọc" hoặc "Thêm mới"). Không bắt buộc phải có action nếu ngữ cảnh không yêu cầu.
5. **Error State**: Khi có lỗi xảy ra, hiển thị thông báo lỗi thân thiện, kèm nút Thử lại (Retry) khi phù hợp (áp dụng cho các thao tác đọc/truy vấn an toàn).
6. **Refreshing State**: Cơ chế làm mới hoặc kéo để làm mới (`RefreshIndicator` hoặc tương đương) được áp dụng khi UX, loại dữ liệu và convention của repository phù hợp. Không tạo refresh interaction chỉ để đối phó checklist; nếu màn hình hoặc dữ liệu không có refreshing semantics phù hợp thì không ép buộc.
7. **Submitting / Disabled State**: Các nút hành động làm thay đổi dữ liệu phải chuyển sang trạng thái loading/disabled khi đang xử lý để ngăn chặn thao tác lặp lại.

**Nguyên tắc cốt lõi**:
- Không bao giờ để giao diện rơi vào trạng thái mơ hồ hoặc màn hình trắng (blank screen).
- Không duy trì trạng thái loading vô hạn nếu request đã thất bại hoặc bị hủy.
- Không âm thầm nuốt lỗi bằng khối try-catch rỗng làm mất dấu vết lỗi.

---

## 16. Ranh giới Xác thực và Phiên làm việc (Authentication & Session Boundary)

Ứng dụng di động Flutter đóng vai trò phản ánh giao diện (Representation), không phải thẩm quyền xác thực hay phân quyền:

### 16.1. Những việc Flutter Client ĐƯỢC PHÉP làm
- Sử dụng trạng thái session/authentication theo cơ chế đã được Security Policy (`03-security.md`), implementation backend và repository convention xác lập.
- Hiển thị thông tin người dùng đang đăng nhập trên giao diện.
- Sử dụng thông tin Role / Permissions do backend cung cấp để điều chỉnh giao diện (navigation, ẩn/hiện menu, nút bấm) nhằm tối ưu trải nghiệm người dùng (UX).
- Điều hướng người dùng về màn hình đăng nhập khi phiên làm việc hết hạn.
- Hiển thị các thông báo từ chối truy cập (401/403) thân thiện.

### 16.2. Những việc Flutter Client TUYỆT ĐỐI KHÔNG ĐƯỢC làm
- Tự quyết định quyền truy cập cuối cùng vào dữ liệu hoặc tài nguyên hệ thống.
- Tin tưởng các giá trị `role`, `permission`, `isAdmin` do client tự lưu hoặc người dùng chỉnh sửa trong local storage.
- Bỏ qua việc xử lý lỗi 401/403 từ API vì cho rằng "UI đã ẩn nút rồi thì user không thể gọi được".

### 16.3. Ranh giới Lưu trữ Token và Thông tin Xác thực
- **Không tự ý quyết định kiến trúc lưu trữ xác thực**: Skill 05 tuyệt đối **KHÔNG sở hữu kiến trúc lưu trữ xác thực (authentication storage architecture)**. Cơ chế lưu token (như SharedPreferences, flutter_secure_storage, in-memory) bắt buộc phải tuân theo Security Policy (`03-security.md`) và thiết kế bảo mật đã được phê duyệt.
- **Tuyệt đối không lưu trữ thông tin nhạy cảm cấm**: Không bao giờ lưu trữ mật khẩu đăng nhập, mã OTP, private key hoặc thông tin thanh toán đầy đủ vào bộ nhớ client trừ khi có thiết kế bảo mật được duyệt.
- **Không log dữ liệu nhạy cảm**: Tuyệt đối không gọi `print()`, `debugPrint()` hoặc logger để in access token, refresh token, mật khẩu, mã OTP hay thông tin cá nhân nhạy cảm lên console hoặc telemetry.

---

## 17. Xử lý Ngữ cảnh Chi nhánh (Branch Context)

Trong hệ thống PharmaBranch, `CHI_NHANH` là ranh giới cô lập dữ liệu tối quan trọng:
- **Client-side BranchId là dữ liệu KHÔNG ĐÁNG TIN CẬY (Untrusted)**:
  - BranchId lấy từ route arguments, local storage, request parameters, client state hay deep links **tuyệt đối không được coi là bằng chứng xác thực hay phân quyền**.
  - Backend mới là thẩm quyền duy nhất xác định phạm vi chi nhánh của người dùng dựa trên authenticated security context (Rule 06).
- **Không tự ý chuyển đổi chi nhánh**: Flutter client không được cho phép người dùng tự ý thay đổi `branchId` trong request để truy cập dữ liệu của chi nhánh khác nếu backend chưa cấp quyền cross-branch hợp lệ.
- **Hiển thị dữ liệu theo đúng Scope**: Dữ liệu danh mục thuốc, tồn kho, hóa đơn hiển thị trên ứng dụng mobile phải phản ánh đúng phạm vi chi nhánh được backend cung cấp.
- **Không xây dựng client-side branch isolation thay thế backend**: Ranh giới an ninh cô lập dữ liệu chi nhánh thuộc độc quyền của backend và SQL Server RLS (Rule 06). Flutter client chỉ hiển thị dữ liệu theo contract được trả về.

---

## 18. Kỷ luật Idempotency và Retry (Idempotency & Retry Discipline)

Skill 05 vận hành dưới sự điều phối của **Rule 02 (`02-architecture-quality.md`)** và **Rule 08 (`08-api-contract.md`)**:

### 18.1. Ranh giới Idempotency
- **Frontend không tự định nghĩa cơ chế Idempotency**: Flutter client không tự phát minh header `Idempotency-Key`, `requestId` hoặc cơ chế chống duplicate nếu API contract của Rule 08 không quy định.
- **Tuân thủ hợp đồng khi có yêu cầu**: Khi API contract quy định gửi `Idempotency-Key` cho các giao dịch nhạy cảm (thanh toán, tạo đơn hàng), Flutter client bắt buộc phải tuân thủ đúng định dạng và quy cách truyền khóa.
- **Phân định thẩm quyền**: Quyền sở hữu chính sách giao dịch/idempotency thuộc Rule 02; quyền sở hữu đặc tả hợp đồng API thuộc Rule 08; Skill 05 chỉ sở hữu việc triển khai client tuân thủ hợp đồng.

### 18.2. Kỷ luật Retry an toàn
Phân biệt rạch ròi giữa **READ / QUERY retry** và **MUTATION retry**:
- **READ / QUERY Retry**: Các yêu cầu đọc dữ liệu an toàn (safe, idempotent read queries) có thể cung cấp nút hoặc cơ chế Thử lại (Retry) khi gặp lỗi kết nối mạng tạm thời.
- **MUTATION Retry**: Đối với các thao tác có tác dụng phụ làm biến đổi dữ liệu (POST, PUT, DELETE, tạo đơn hàng, thanh toán, trừ kho), tuyệt đối **KHÔNG tự động retry** khi gặp lỗi hoặc timeout trừ khi:
  1. API contract xác định rõ ràng retry semantics an toàn; hoặc
  2. Đã có cơ chế `Idempotency-Key` / chống duplicate request tương ứng phía server bảo vệ.
- **Tuyệt đối tránh suy diễn nguy hiểm**: Không bao giờ triển khai luồng xử lý dạng:
  ```text
  POST failed → automatically POST again
  ```
  gây nguy cơ trừ tồn kho hai lần hoặc nhân đôi hóa đơn/thanh toán. Phải giữ nhất quán tuyệt đối với Rule 02 và Rule 08.

---

## 19. Tiêu chuẩn Tiếp cận và Trải nghiệm Mobile (Accessibility & Mobile UX)

Mã nguồn Flutter phải đáp ứng các yêu cầu tiếp cận và trải nghiệm di động cơ bản:
- **Semantic Labels & Screen Reader**: Sử dụng widget `Semantics` hoặc thuộc tính `semanticLabel` cho các widget hình ảnh, icon buttons không có text đi kèm để hỗ trợ người dùng khiếm thị sử dụng TalkBack (Android) hoặc VoiceOver (iOS).
- **Vùng chạm tối thiểu (Touch Targets)**: Interactive touch targets phải đạt kích thước tối thiểu phù hợp với accessibility guideline/design system mà project áp dụng. Nếu project theo Material baseline thì 48x48 dp có thể được sử dụng làm guideline.
- **Hỗ trợ Co giãn Font chữ (Text Scaling)**: Kiểm tra layout không bị tràn viền (overflow) khi người dùng bật tính năng phóng to chữ trên hệ điều hành; sử dụng layout linh hoạt (`Flexible`, `Expanded`, `SingleChildScrollView`).
- **Focus Management**: Điều hướng focus bàn phím hợp lý giữa các trường nhập liệu trên form.
- **Không truyền tải trạng thái chỉ bằng màu sắc**: Trạng thái cảnh báo, thành công hoặc lỗi phải kết hợp cả văn bản (text), biểu tượng (icon) hoặc nhãn rõ ràng, không chỉ dựa vào màu đỏ/xanh.
- **Thích ứng Hướng màn hình & Kích thước (Responsive / Orientation)**: Khi task yêu cầu, xử lý layout linh hoạt cho cả màn hình dọc (portrait), ngang (landscape) hoặc tablet.
- **Không áp dụng máy móc**: Áp dụng accessibility phù hợp với ngữ cảnh thực tế của từng widget, không bao bọc `Semantics` tràn lan gây rối loạn screen reader.

---

## 20. Tối ưu Hiệu năng Ứng dụng Mobile (Mobile Performance Optimization)

Tối ưu hóa hiệu năng mobile phải dựa trên bằng chứng đo lường thực tế (evidence-based), tuân thủ nguyên tắc **Evidence > Premature Optimization**:
- **Sử dụng constructor `const`**: Áp dụng `const` constructor như một optimization guideline phù hợp với Flutter cho các widget tĩnh để hỗ trợ framework tái sử dụng instance và hạn chế rebuild không cần thiết; không coi `const` là bảo chứng hiệu năng tuyệt đối trong mọi context.
- **Tránh tính toán nặng trong hàm `build()`**: Tuyệt đối không thực hiện gọi API, đọc ghi file, hay xử lý thuật toán phức tạp bên trong phương thức `build()`.
- **Tối ưu Danh sách Lớn**: Với danh sách lớn hoặc có khả năng tăng trưởng đáng kể, sử dụng lazy rendering mechanism phù hợp với UI và repository, chẳng hạn `ListView.builder`, `SliverList` hoặc cơ chế tương đương. Performance optimization phải dựa trên bằng chứng đo lường thực tế (evidence-based).
- **Tối ưu Tải và Cache Hình ảnh**: Sử dụng kích thước ảnh phù hợp với màn hình thiết bị, áp dụng cơ chế cache ảnh nếu repository có sử dụng.
- **Tối ưu Rebuild theo Phạm vi**: Sử dụng widget builder nhỏ gọn hoặc các cơ chế selector của state manager để chỉ cập nhật đúng widget cần thay đổi dữ liệu.
- **Xử lý tác vụ nặng qua Background Isolate**: Chỉ xem xét sử dụng `compute()` hoặc `Isolate` riêng biệt khi có bằng chứng về việc xử lý JSON cực lớn hoặc tính toán đồ họa gây giật lag (frame drop / jank) trên UI thread.

---

## 21. Kiểm thử Ứng dụng Flutter (Flutter Testing Implementation)

Kiểm thử Flutter phải tuân thủ nghiêm ngặt các quy ước và công cụ test sẵn có trong repository:

### 21.1. Unit Tests
- Tập trung kiểm tra các logic tính toán và chuyển đổi phía client (client-side transformations & presentation calculations): client-side validation, định dạng tiền tệ/ngày tháng, presentation logic, parser dữ liệu JSON, ánh xạ DTO sang UI model.
- Không phụ thuộc vào môi trường UI hoặc thiết bị thật.
- **Ranh giới thẩm quyền**: Mobile unit test chỉ xác minh logic thực thi trên client, **không phải bằng chứng backend đã enforce business rules**. Skill 05 tuyệt đối không sở hữu hay đại diện cho server business logic.

### 21.2. Widget Tests
- Kiểm tra hành vi tương tác và hiển thị của từng widget hoặc màn hình (sử dụng `WidgetTester`).
- Kiểm tra các nhánh hiển thị: render đúng dữ liệu, hiển thị lỗi khi form sai, kích hoạt sự kiện click, hiển thị loading indicator.

### 21.3. Integration & End-to-End (E2E) Tests
- Kiểm tra các luồng người dùng quan trọng xuyên suốt (Critical User Journeys) được xác định từ yêu cầu thực tế của ứng dụng mobile (ví dụ: tìm kiếm thuốc, xem chi tiết thuốc, quản lý giỏ hàng, tạo đơn hàng, thanh toán, theo dõi đơn hàng — đây chỉ là các ví dụ minh họa về luồng customer-mobile khi và chỉ khi các tính năng này thực sự nằm trong phạm vi nghiệp vụ mobile được giao; tuyệt đối không hàm ý Flutter mobile sở hữu hay thay thế web staff workflows).
- **Ranh giới An ninh của Flutter E2E**: Kiểm tra frontend behavior đối với authentication/session và navigation/visibility theo thông tin quyền được backend cung cấp. Flutter E2E **tuyệt đối không thay thế security/authorization testing ở backend**; việc test E2E mobile pass không chứng minh rằng Rule 04 (RBAC), Rule 05 (Runtime Authorization), Rule 06 (Branch Isolation) hay Rule 07 (Database Integrity) đã được enforce an toàn tại server-side.

---

## 22. Xử lý Lỗi và Khả năng Phục hồi (Error Handling & Resilience)

### 22.1. Nguyên tắc Xử lý Lỗi
- **Không nuốt lỗi âm thầm (Never swallow exceptions)**: Không bắt ngoại lệ bằng khối `catch` rỗng mà không ghi nhận log hoặc không hiển thị phản hồi giao diện.
- **Bắt lỗi tại ranh giới hợp lý**: Global/unhandled errors phải được capture tại application boundary theo cơ chế phù hợp với Flutter version và repository convention, ví dụ `FlutterError.onError`, `PlatformDispatcher.onError`, `runZonedGuarded` hoặc cơ chế tương đương, và báo cáo lỗi theo convention của project.
- **Phân loại lỗi chính xác**: Phân biệt rõ lỗi validation, lỗi mạng (timeout/no connection), lỗi xác thực (401), lỗi phân quyền (403), lỗi máy chủ (500), lỗi parse JSON để phản hồi UI phù hợp.
- **Ranh giới quan sát phía Client (Client Observability Boundary)**: Telemetry và log phía client chỉ phục vụ chẩn đoán kỹ thuật UX/UI, tuyệt đối không được coi là authoritative audit log, authoritative security log hay authoritative business audit record. Toàn bộ các bản ghi kiểm toán thẩm quyền thuộc trách nhiệm của backend và Rules tương ứng.

### 22.2. Bảo vệ Thông tin Nhạy cảm khi có Lỗi
- Giao diện người dùng phải hiển thị thông điệp lỗi văn minh, dễ hiểu.
- **Tuyệt đối không để lộ thông tin nhạy cảm cho người dùng cuối**:
  - Không hiển thị raw stack trace kỹ thuật.
  - Không hiển thị câu lệnh SQL hoặc cấu trúc schema database.
  - Không hiển thị secrets, API keys hay thông tin hạ tầng nội bộ.

---

## 23. Kỷ luật Tái cấu trúc mã nguồn Flutter (Flutter Refactoring Discipline)

Khi thực hiện tái cấu trúc mã nguồn ứng dụng di động:
1. **Xác định hành vi hiện tại**: Hiểu rõ widget, màn hình hoặc luồng dữ liệu đang hoạt động như thế nào trước khi sửa.
2. **Xác định dependencies**: Kiểm tra các package và services mà thành phần đang phụ thuộc.
3. **Xác định State và Vòng đời**: Nắm rõ cách quản lý state và vòng đời khởi tạo/dọn dẹp của widget.
4. **Kiểm tra Tests hiện có**: Chạy test suites sẵn có để thiết lập đường cơ sở bảo đảm không làm gãy tính năng.
5. **Thay đổi từng bước nhỏ (Incremental Changes)**: Chia nhỏ quá trình refactor, kiểm tra trực quan giao diện ở từng bước.
6. **Bảo toàn hành vi nghiệp vụ**: Không thay đổi hành vi nghiệp vụ trừ khi task yêu cầu rõ ràng.
7. **Không đổi State Management chỉ để refactor**: Tuyệt đối không tự ý chuyển đổi từ Provider sang BLoC/Riverpod chỉ vì mục đích refactor.
8. **Không đổi Architecture theo sở thích**: Không tự ý chuyển từ MVC sang Clean Architecture khi chưa có quyết định kiến trúc được duyệt.
9. **Không thêm dependency không cần thiết**: Giữ nguyên danh sách thư viện hiện tại trong `pubspec.yaml`.
10. **Xác minh các luồng bị ảnh hưởng**: Chạy lại các bài kiểm thử và kiểm tra kỹ lưỡng các màn hình liên quan sau khi refactor.

---

## 24. Bảng kiểm tra chất lượng Flutter (Flutter Quality Checklist)

Trước khi hoàn thành bất kỳ task triển khai hoặc sửa đổi Flutter nào, Agent bắt buộc phải tự đối chiếu mã nguồn với danh sách kiểm tra sau:

- [ ] **1. Đã khảo sát Existing Flutter convention**: Khảo sát đầy đủ hiện trạng dự án theo 15 điểm discovery trước khi viết mã.
- [ ] **2. Không áp đặt state-management framework**: Tuân thủ giải pháp state management hiện có, không tự ý cài đặt mới.
- [ ] **3. Không áp đặt routing framework**: Tuân thủ routing mechanism hiện có, không tự ý đưa GoRouter hay router khác vào.
- [ ] **4. Không áp đặt API client**: Tuân thủ HTTP client hiện có của codebase (Dio/http/custom service).
- [ ] **5. Không áp đặt serialization library**: Tuân thủ quy ước parse JSON sẵn có của dự án.
- [ ] **6. Dart null-safety được xử lý đúng**: Nullable phản ánh đúng runtime/API/UI semantics; không lạm dụng `!`; `dynamic` chỉ dùng có kiểm soát tại ranh giới JSON/API và được thu hẹp kiểu sớm.
- [ ] **7. Widget responsibility rõ ràng**: Mỗi widget có trách nhiệm đơn nhất; không có god widgets nhồi nhét logic.
- [ ] **8. State lifecycle rõ ràng**: Các object có resource/lifecycle cần quản lý được cleanup phù hợp; chỉ dispose/close resource thuộc quyền sở hữu của component theo ownership contract.
- [ ] **9. Không có duplicated state không cần thiết**: Phân định đúng tầng state; không đưa server state vào global state bừa bãi.
- [ ] **10. Async lifecycle an toàn**: Kiểm tra `mounted` trước khi gọi `setState`; dọn dẹp timers/subscriptions thuộc ownership; cancellation và stale protection chỉ áp dụng khi có nhu cầu thực tế.
- [ ] **11. Không update disposed widget**: Không để xảy ra lỗi `setState() called after dispose()`.
- [ ] **12. Loading & refreshing state phù hợp**: Hiển thị indicator rõ ràng khi tải; refresh interaction chỉ áp dụng khi có ngữ nghĩa và UX phù hợp; không để màn hình trắng.
- [ ] **13. Empty state phù hợp**: Giải thích rõ ràng khi không có dữ liệu; cung cấp action khi hữu ích.
- [ ] **14. Error state phù hợp**: Hiển thị lỗi thân thiện, cung cấp nút Thử lại cho các tác vụ an toàn.
- [ ] **15. Form validation phù hợp**: Kiểm tra nhập liệu trên form mang lại phản hồi nhanh chóng cho người dùng.
- [ ] **16. Client validation không thay thế server validation**: Validation nghiệp vụ tối cao vẫn thuộc về backend.
- [ ] **17. API contract tuân thủ Rule 08**: Sử dụng đúng URI, HTTP method, DTOs và pagination contract thực tế theo Rule 08 và backend (không tự suy diễn schema).
- [ ] **18. Không tự phát minh idempotency**: Chỉ truyền `Idempotency-Key` khi API contract yêu cầu; tuân thủ Rule 02 và Rule 08; UI double-submit prevention không thay thế server-side idempotency.
- [ ] **19. Không tự coi BranchId client là trusted**: Dữ liệu chi nhánh phía client là untrusted; backend là authority duy nhất.
- [ ] **20. Không đưa secret vào client**: Không hard-code mật khẩu, connection strings, private keys trong mã nguồn mobile.
- [ ] **21. Không log sensitive data**: Không in token, mật khẩu, OTP lên console; telemetry/logging client không thay thế authoritative backend audit log.
- [ ] **22. Accessibility phù hợp**: Đảm bảo kích thước touch targets phù hợp với guideline/design system của project (ví dụ 48x48 dp với Material), semantic labels, hỗ trợ screen reader cơ bản.
- [ ] **23. Performance optimization có lý do**: Dựa trên bằng chứng thực tế; áp dụng `const`, lazy rendering mechanism (như `ListView.builder`, `SliverList`) phù hợp.
- [ ] **24. Testing phù hợp**: Viết tests theo convention của project; mobile unit/E2E tests không chứng minh backend authorization hay business rule enforcement.
- [ ] **25. Không thay đổi behavior ngoài scope**: Giữ phạm vi thay đổi tối thiểu, tập trung đúng yêu cầu task.
- [ ] **26. Không thêm dependency không cần thiết**: Không tùy tiện thêm package mới vào `pubspec.yaml`.
- [ ] **27. Không vi phạm Rules 00–09**: Tuân thủ triệt để hệ thống Rules quản trị cốt lõi của PharmaBranch.
- [ ] **28. Không vi phạm Skill 02 & không xâm phạm Skill 03/04**: Tôn trọng ranh giới phân tầng giữa backend, web và mobile.

---

## 25. Tuân thủ Quản trị Dự án (Governance Compliance)

Skill 05 vận hành dưới sự chi phối trực tiếp của hệ thống Rules `00–09` của PharmaBranch.

### 25.1. Bảng đối chiếu ranh giới với Rules
| Rule | Trách nhiệm của Rule (Policy & Invariants) | Mối quan hệ triển khai của Skill 05 (How to Implement) |
|---|---|---|
| `00-project-governance.md` | Rule 00 sở hữu quản trị dự án, evidence-first, kiểm soát phạm vi | Skill 05 chỉ thực hiện thay đổi tối thiểu, có bằng chứng, bảo toàn conventions của mobile client |
| `01-architecture.md` | Rule 01 sở hữu kiến trúc Client-Server tổng thể | Skill 05 triển khai phía mobile client theo ranh giới Client–Server và kiến trúc thực tế của repository; không kết nối trực tiếp database và không tự tạo architectural boundaries |
| `02-architecture-quality.md` | Rule 02 sở hữu tính toàn vẹn giao dịch, concurrency, idempotency policy | Skill 05 triển khai UX chống double submit, gửi Idempotency-Key khi API contract của Rule 08 yêu cầu; không tự phát minh cơ chế idempotency và không sở hữu idempotency policy |
| `03-security.md` | Rule 03 sở hữu an ninh hệ thống, mã hóa, bảo mật JWT | Skill 05 triển khai mobile session UX, không hard-code secrets, không log token/OTP, không là authentication authority |
| `04-rbac.md` | Rule 04 sở hữu mô hình vai trò và ma trận phân quyền | Skill 05 hiển thị menu/nút theo role/permissions được cung cấp; không tự định nghĩa mô hình RBAC |
| `05-authorization.md` | Rule 05 sở hữu thẩm định quyền truy cập runtime server-side | Skill 05 triển khai client navigation guard cho trải nghiệm người dùng; không thay thế authorization authority |
| `06-branch-isolation.md` | Rule 06 sở hữu ranh giới cô lập dữ liệu chi nhánh và RLS | Skill 05 hiển thị dữ liệu theo branch scope từ server; không coi client-side branchId là trusted boundary |
| `07-database-integrity.md` | Rule 07 sở hữu tính toàn vẹn dữ liệu quan hệ và kiểu số | Skill 05 không truy cập database trực tiếp, không định nghĩa database integrity; tôn trọng định dạng dữ liệu expose qua API |
| `08-api-contract.md` | Rule 08 sở hữu toàn bộ hợp đồng API, URI, DTOs, HTTP status | Skill 05 triển khai gọi HTTP API và ánh xạ giao diện tuân thủ 100% theo contract của Rule 08 |
| `09-observability-operations.md` | Rule 09 sở hữu chính sách logging, tracing và giám sát | Skill 05 tuân thủ quy ước logging phía client, truyền X-Correlation-ID nếu contract yêu cầu, không log dữ liệu nhạy cảm; client telemetry không thay thế authoritative audit log của server |

### 25.2. Xử lý xung đột
- Nếu phát hiện bất kỳ hướng dẫn nào trong Skill 05 mâu thuẫn với Rules `00–09`:
  1. **Tuyệt đối KHÔNG sửa Rules**.
  2. **Rules luôn luôn thắng (Rules > Skills)**.
  3. Báo cáo xung đột và điều chỉnh Skill 05 để tuân thủ triệt để quy định của Rules.

---

## 26. Phân định Ranh giới giữa các Skills (Cross-Skill Boundary)

Hệ thống Skills của PharmaBranch được phân định trách nhiệm rõ ràng, không chồng lấn:
- **Skill 01 (`01-codebase-onboarding`)**: Chịu trách nhiệm khảo sát, thu thập bằng chứng vật lý và lập bản đồ kiến trúc hiện trạng của repository trước khi thực hiện thay đổi.
- **Skill 02 (`02-coding-standards`)**: Chịu trách nhiệm chuẩn hóa chất lượng mã nguồn chung (naming, readability, comments, refactoring discipline, technology-neutral standards).
- **Skill 03 (`03-dotnet-backend`)**: Chịu trách nhiệm về kỹ thuật triển khai backend ASP.NET Core / .NET 8 (C#, DI, Controllers, Services, Async, DB access).
- **Skill 04 (`04-react-frontend`)**: Chịu trách nhiệm về kỹ thuật triển khai web frontend React + TypeScript (Components, Pages, UI State, Forms, Routing, API client integration).
- **Skill 05 (`05-flutter-mobile`)**: Chịu trách nhiệm về kỹ thuật triển khai mobile application Flutter / Dart (Widgets, Screens, Mobile State, Forms, Navigation, API client integration, Mobile Testing).
- **Rules 00–09**: Hệ thống quy tắc quản trị cốt lõi, nắm giữ toàn bộ chính sách và bất biến của hệ thống.
