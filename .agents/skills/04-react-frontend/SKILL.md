---
name: react-frontend
description: >
  Chuẩn hóa triển khai, sửa đổi, tái cấu trúc và kiểm thử frontend React/TypeScript
  trong PharmaBranch. Dùng khi làm việc với components, pages, state, forms,
  routing, API integration, client-side validation và frontend testing.
---

# React Frontend Implementation — Chuẩn mực Triển khai Frontend React / TypeScript

## 1. Mục tiêu và Phạm vi (Objective & Scope)

Skill này cung cấp các chuẩn mực kỹ thuật và quy tắc triển khai chi tiết cho việc viết mới, chỉnh sửa, tái cấu trúc (refactor) và rà soát (code review) mã nguồn frontend **React + TypeScript** trong dự án PharmaBranch.

Mục tiêu cốt lõi:
- **Chuẩn hóa cách triển khai React/TypeScript**: Đảm bảo component, page, custom hooks, form và state management có cấu trúc rõ ràng, tường minh và dễ bảo trì.
- **Tôn trọng Existing Frontend Convention First**: Khảo sát và tuân thủ các quy ước, thư viện và cấu trúc thư mục thực tế đang có trong repository trước khi viết mã.
- **Không áp đặt công nghệ khi thiếu bằng chứng**: Tuyệt đối không tự ý du nhập state management, routing, HTTP client, styling hay UI framework nếu chưa có evidence vật lý.
- **Bảo toàn ranh giới an ninh**: Frontend là phương tiện giao diện người dùng (UX) và hiển thị dữ liệu, **tuyệt đối không phải là chốt chặn an ninh có thẩm quyền (security authority)**.
- **Tương thích toàn diện**: Tuân thủ tuyệt đối các quy định của Rules `00–09`, Skill 01 (Onboarding), Skill 02 (Coding Standards) và Skill 03 (.NET Backend).

---

## 2. Phân định trách nhiệm (Ownership Model)

Để duy trì ranh giới rõ ràng trong quản trị dự án, Skill 04 xác định rõ những gì thuộc quyền sở hữu kỹ thuật của mình và những gì là tuân thủ chính sách từ các Rules:

### 2.1. Phạm vi thuộc sở hữu của Skill 04 (Owned Responsibilities)
Skill 04 trực tiếp sở hữu và hướng dẫn kỹ thuật triển khai (FRONTEND IMPLEMENTATION HOW) cho các thành phần sau:
1. **React/TypeScript implementation practices**: Quy chuẩn viết mã React hiện đại kết hợp type safety của TypeScript.
2. **Component implementation**: Thiết kế và triển khai React components có trách nhiệm đơn nhất.
3. **Page implementation**: Điều phối bố cục trang, kết nối dữ liệu, điều hướng và quản lý trạng thái mức trang.
4. **UI state implementation**: Quản lý trạng thái giao diện cục bộ (local state), derived state, và form state.
5. **Client-side form handling**: Xử lý nhập liệu, validation phản hồi nhanh trên client, quản lý trạng thái submitting/disabled.
6. **Client-side validation implementation**: Kiểm tra tính hợp lệ dữ liệu trên client nhằm nâng cao trải nghiệm người dùng (UX).
7. **Frontend routing implementation**: Triển khai điều hướng, liên kết trang theo router thực tế của project.
8. **API client integration implementation**: Tích hợp gọi HTTP API theo hợp đồng của Rule 08, xử lý request/response DTOs.
9. **Loading / error / empty states**: Thiết kế trải nghiệm đầy đủ khi dữ liệu đang tải, có lỗi hoặc rỗng.
10. **Reusable frontend components**: Xây dựng các UI components tái sử dụng khi có tính tương đồng ngữ nghĩa (semantic cohesion).
11. **Hooks implementation**: Sử dụng built-in hooks chuẩn mực và xây dựng custom hooks đóng gói logic giao diện.
12. **Frontend error boundary implementation**: Triển khai chốt chặn bắt lỗi giao diện khi repository có sử dụng.
13. **Accessibility implementation**: Đảm bảo semantic HTML, điều hướng bàn phím, nhãn form và quản lý focus cơ bản.
14. **Frontend testing implementation**: Triển khai component tests, integration tests và e2e tests theo test conventions của project.
15. **Frontend performance basics**: Tránh re-render thừa, tối ưu render list và tải tài nguyên dựa trên bằng chứng thực tế.
16. **Frontend code organization**: Tổ chức mã nguồn phù hợp với cấu trúc thư mục thực tế của repository.

### 2.2. Phạm vi KHÔNG thuộc sở hữu của Skill 04 (Non-Responsibilities)
Skill 04 tuyệt đối **KHÔNG sở hữu** các chính sách và thẩm quyền hệ thống sau:
- **System Architecture Policy**: Thuộc `01-architecture.md`.
- **General Coding Standards**: Thuộc `02-coding-standards` (Skill 04 chỉ kế thừa và tham chiếu).
- **Authentication Policy / JWT Specification**: Thuộc `03-security.md`.
- **RBAC Model & Role Definitions**: Thuộc `04-rbac.md`.
- **Runtime Authorization Enforcement**: Thuộc `05-authorization.md`.
- **Branch Isolation / Tenant Boundary**: Thuộc `06-branch-isolation.md`.
- **Database Integrity Policy**: Thuộc `07-database-integrity.md`.
- **API Contract Ownership & Protocols**: Thuộc `08-api-contract.md`.
- **Observability Policy & Logging Standards**: Thuộc `09-observability-operations.md`.
- **Pharma Business Rules**: Thuộc đặc tả nghiệp vụ nhà thuốc PharmaBranch.
- **Backend Architecture & Data Access**: Thuộc Skill 03 (`03-dotnet-backend`).
- **Deployment / Infrastructure Policy**: Thuộc DevOps / Hosting.
- **UI/UX Design Authority**: Nếu dự án đã có Design System, Figma hoặc UI Blueprint riêng, Skill 04 phải tuân thủ, không tự ý sáng tác thiết kế mới.

Nguyên tắc bất biến:
```text
"Skill 04 tuân thủ" ≠ "Skill 04 sở hữu"
```
Rules sở hữu CHÍNH SÁCH VÀ BẤT BIẾN (POLICY / INVARIANTS). Skill 04 sở hữu KỸ THUẬT TRIỂN KHAI FRONTEND (HOW TO IMPLEMENT). Skill 04 không tự ý định nghĩa lại bất kỳ policy nào.

---

## 3. Thứ bậc ưu tiên (Priority Hierarchy)

Khi triển khai mã nguồn frontend, Agent bắt buộc tuân theo thứ bậc ưu tiên sau:

```text
1. Rules hiện hành 00–09
    ↓
2. Yêu cầu cụ thể của Task
    ↓
3. Quy ước thực tế hiện có trong repository / frontend (Existing conventions)
    ↓
4. Các Skills áp dụng liên quan (Skill 01, Skill 02, Skill 04...)
    ↓
5. Quy chuẩn chính thức của React / TypeScript / Nền tảng (Official guidelines)
    ↓
6. Thực hành tốt chung trong ngành frontend (Generic best practices)
    ↓
7. Sở thích cá nhân của Agent (Agent personal preference)
```

**Nguyên tắc**:
- Tuyệt đối không dùng sở thích cá nhân hay "best practice phổ biến trên mạng" để ghi đè các quy định của Rules hoặc conventions đã thiết lập của repository.

---

## 4. Nguyên tắc Existing Frontend Convention First

Trước khi viết mới hoặc chỉnh sửa mã nguồn frontend, Agent bắt buộc phải khảo sát hiện trạng repository để thu thập bằng chứng vật lý (physical evidence).

16-point discovery là **frontend-specific discovery**, bổ sung cho Skill 01 (`01-codebase-onboarding`); **không thay thế hoặc lặp lại toàn bộ repository onboarding của Skill 01**.
- **Skill 01**: Sở hữu repository-wide discovery và khảo sát tổng thể hiện trạng repository.
- **Skill 04**: Sở hữu frontend-specific discovery chuyên sâu phục vụ triển khai giao diện.

### 4.1. Mười sáu điểm khảo sát bắt buộc
1. **package.json và lockfile**: Xác định chính xác các thư viện và phiên bản đang được cài đặt.
2. **React version**: Kiểm tra phiên bản React (React 18, React 19...) để dùng đúng APIs (Hooks, concurrent features).
3. **TypeScript configuration**: Xem `tsconfig.json` (strict mode, path aliases `@/...`, target, moduleResolution).
4. **Build tool**: Đang dùng Vite, Next.js, Webpack, CRA hay công cụ khác.
5. **Source root**: Thư mục gốc chứa mã nguồn (`src/`, `app/`, `frontend/`).
6. **Component organization**: Cách tổ chức components (theo features, Atomic Design, components phẳng hay theo modules).
7. **Page organization**: Vị trí các pages/views (`pages/`, `views/`, `routes/`, `app/`).
8. **Routing implementation**: Đang dùng React Router (v5 hay v6), TanStack Router, Next.js App/Pages router hay router tự viết.
9. **State management**: Đang dùng Context API thuần, Redux Toolkit, Zustand, MobX, TanStack Query hay state cục bộ.
10. **API client / HTTP client**: Đang dùng Axios instance, native `fetch` wrapper, hay custom API client abstraction.
11. **Form handling**: Đang dùng React Hook Form, Formik, form state tùy biến hay controlled inputs thuần túy.
12. **Validation library**: Đang dùng Zod, Yup, Joi hay các hàm validator viết tay.
13. **Styling / UI framework**: Đang dùng Tailwind CSS, CSS Modules, Styled Components, Bootstrap, Ant Design, Material UI hay Vanilla CSS.
14. **Authentication state handling**: Cách lưu và đọc trạng thái đăng nhập trên client (Context, token manager, session service).
15. **Test framework**: Đang dùng Vitest, Jest, React Testing Library, Playwright hay Cypress.
16. **Lint / Formatter configuration**: Kiểm tra `.eslintrc`, `.prettierrc`, Biome để tuân thủ quy cách code style.

### 4.2. Ý nghĩa khảo sát: "Không tìm thấy" là kết quả hợp lệ
- **Mục đích của Discovery**: Khảo sát 16 điểm trên nhằm **xác định bằng chứng vật lý thực tế (physical evidence)** đang có trong repository, **tuyệt đối KHÔNG phải là danh sách kiểm tra sự tồn tại bắt buộc** của các công nghệ đó.
- **"Không tìm thấy" là một kết quả hợp lệ**: Nếu một công nghệ (như Redux, Zustand, Axios, React Router, Tailwind, Form library, Validation library hay Testing framework) không có mặt trong codebase, Agent phải chấp nhận hiện trạng đó. Tuyệt đối không được suy diễn rằng repository "thiếu sót" hoặc bắt buộc phải có các công nghệ này.
- **Không tự ý du nhập hoặc áp đặt công nghệ**: Tuyệt đối KHÔNG được giả định hoặc tự ý cài đặt khi chưa có bằng chứng vật lý:
  - Redux, Redux Toolkit, Zustand, MobX, Recoil
  - TanStack Query (React Query), SWR
  - Axios, Fetch API wrappers
  - React Router, Next.js, TanStack Router
  - Vite, Webpack, CRA
  - Tailwind CSS, Bootstrap, Material UI, Ant Design, shadcn/ui
  - CSS Modules, Styled Components
  - Formik, React Hook Form
  - Zod, Yup, Joi
  - Jest, Vitest, React Testing Library, Playwright, Cypress
- **Tôn trọng convention sẵn có**: Nếu repository đã có sẵn một giải pháp, **bắt buộc tuân theo convention đó**. Nếu repository chưa có, chỉ triển khai bằng các phương tiện tối giản có sẵn (như React built-in state, browser standard APIs) hoặc theo yêu cầu tường minh của Task. Tuyệt đối không tự ý refactor mã nguồn ổn định chỉ để chuyển sang thư viện mà Agent quen thuộc hơn.

---

## 5. Nền tảng React và TypeScript (React / TypeScript Baseline)

### 5.1. Thiết kế Component
- **Không áp đặt một component architecture cụ thể**: Không áp đặt Atomic Design, Feature-Sliced Design, Clean Architecture hay bất kỳ mô hình tổ chức component cụ thể nào nếu repository chưa sử dụng.
- **Trách nhiệm rõ ràng**: Mỗi component chỉ nên phục vụ một mục đích cụ thể về mặt hiển thị hoặc điều phối giao diện.
- **Dễ đọc, mạch lạc và nhất quán với Existing Frontend Convention**:
  - Mã nguồn component cần có cấu trúc rõ ràng, dễ theo dõi logic hiển thị và nhất quán với quy ước thực tế trong repository.
  - Thứ tự thông thường từ trên xuống: `imports` → `types/interfaces` → `component definition` → `hooks` → `event handlers` → `JSX return` chỉ là một **baseline guideline** tham khảo khi repository chưa có quy ước cụ thể.
  - **Không phải hard requirement**: Tuyệt đối không được sử dụng thứ tự trên làm căn cứ để refactor mã nguồn đang hoạt động ổn định chỉ vì khác biệt về thứ tự khai báo nội bộ.
- **Hạn chế side effects**: Không lạm dụng side effects bên trong render logic.
- **Tránh state dư thừa**: Không tạo state cho những giá trị có thể tính toán trực tiếp từ props hoặc state khác (derived state).
- **Tránh Prop Drilling**: Nếu một prop phải truyền qua quá nhiều tầng trung gian không sử dụng đến nó, hãy xem xét giải pháp truyền component (composition / `children`) hoặc state abstraction phù hợp với codebase.
- **Tách biệt logic phức tạp**: Logic tính toán nặng hoặc quy trình nghiệp vụ nên được tách thành custom hooks hoặc helper functions thuần túy.

### 5.2. Quản lý Props
- **Type an toàn và tường minh**: Khi component nhận props, phải định nghĩa kiểu Props rõ ràng bằng interface hoặc type (ví dụ: `interface ProductCardProps { ... }`). Component không nhận props không cần tạo Props type nhân tạo.
- **Hạn chế `any`**: Tuyệt đối tránh sử dụng kiểu `any`. Sử dụng kiểu dữ liệu chính xác, union types hoặc generics khi cần thiết.
- **Không truyền dữ liệu thừa**: Chỉ truyền đúng các trường mà component con thực sự cần sử dụng.
- **Không ép hard limit số lượng props**: Số lượng props phụ thuộc vào tính gắn kết ngữ nghĩa; nếu danh sách props quá dài và rời rạc, hãy xem xét gom nhóm thành các đối tượng có cấu trúc hợp lý.

### 5.3. Phân định các tầng Trạng thái (State Taxonomy)
Frontend phải phân biệt rõ các loại state khác nhau, không gom tất cả vào một nơi:
1. **Local UI State**: Trạng thái phục vụ riêng một component (đóng/mở modal, tab đang chọn, hover) -> sử dụng `useState` hoặc `useReducer`.
2. **Derived State**: Trạng thái được suy ra trực tiếp từ state/props khác (tổng tiền, danh sách đã lọc) -> tính toán trực tiếp trong hàm render hoặc bọc bằng `useMemo` khi có bằng chứng về chi phí tính toán lớn.
3. **Server Cache State**: Dữ liệu lấy từ backend API (danh sách thuốc, thông tin đơn hàng) -> quản lý qua caching library của repo hoặc dedicated service state.
4. **Shared Application State**: Trạng thái cần chia sẻ giữa các trang không có quan hệ cha-con trực tiếp -> sử dụng Context/State manager của repo.
5. **Authentication / Session State**: Trạng thái đăng nhập của người dùng trên UI (User info hiển thị, token) -> quản lý qua Auth Context/Service.
6. **Form State**: Dữ liệu nhập liệu, trạng thái touch, dirty, errors -> quản lý trong form scope, không đưa vào global state.

### 5.4. Kỷ luật TypeScript
- Bật type-checking chặt chẽ theo cấu hình hiện tại của project.
- Hạn chế tối đa type assertions (`as Type`) và non-null assertions (`!`). Chỉ sử dụng khi có căn cứ chắc chắn mà TypeScript compiler không thể tự suy luận.
- **Ranh giới giữa API DTO types và UI Models**: Có thể tái sử dụng API DTO types tại API boundary khi phù hợp. Khi UI cần biến đổi, chuẩn hóa hoặc kết hợp dữ liệu, có thể ánh xạ sang view/form/UI model riêng thay vì phụ thuộc trực tiếp vào transport DTO.

---

## 6. Thiết kế Component và Tái sử dụng (Component Design & Reusability)

### 6.1. Nguyên tắc Trách nhiệm Đơn nhất (Single Responsibility)
Mỗi component nên tập trung vào một nhiệm vụ hiển thị cụ thể:
- `MedicineCard`: Hiển thị thông tin tóm tắt của một loại thuốc.
- `MedicineList`: Điều phối danh sách, phân trang và trạng thái empty của thuốc.
- `MedicineSearchForm`: Quản lý giao diện nhập liệu tìm kiếm thuốc.
- `InvoiceSummary`: Hiển thị bảng tổng kết tiền và chiết khấu của hóa đơn.

**Tránh Component "Khổng Lồ" (God Components)**: Không biến một component thành container khổng lồ chứa: fetching, business rules, form logic, navigation, rendering và error handling tất cả trong cùng một nơi nếu repository có cách tổ chức tốt hơn.

### 6.2. Kỷ luật Tái sử dụng (Reusability Discipline)
Chỉ tạo Reusable Component khi:
- Thành phần đó có tính tương đồng ngữ nghĩa rõ ràng (semantic cohesion).
- Có nhu cầu tái sử dụng thực tế ở nhiều màn hình khác nhau.
- Việc trừu tượng hóa giúp giảm trùng lặp mã nguồn mà không làm gia tăng độ phức tạp không cần thiết.
- **Không áp dụng Rule of Three máy móc**: Hai component có thể dùng chung nếu có tính gắn kết ngữ nghĩa rõ ràng; ngược lại, ba component ngẫu nhiên giống nhau về layout không bắt buộc phải gộp lại nếu chúng phục vụ hai nghiệp vụ hoàn toàn khác biệt.

---

## 7. Chuẩn mực sử dụng React Hooks

### 7.1. Tuân thủ tuyệt đối Rules of Hooks
- Chỉ gọi Hooks ở cấp cao nhất của React function component hoặc bên trong custom Hook.
- Tuyệt đối không gọi Hook bên trong vòng lặp (`for`, `while`), câu lệnh điều kiện (`if/else`) hay các hàm lồng nhau.

### 7.2. Kỷ luật với `useEffect`
- **Không dùng `useEffect` cho derived state**: Nếu giá trị có thể tính toán trực tiếp từ props hoặc state khác, hãy tính toán ngay trong quá trình render, không dùng `useEffect` để `setState` gây ra re-render thừa.
- **Dependency Arrays phải đầy đủ và chính xác**: Liệt kê mọi biến, hàm, props được sử dụng bên trong effect vào dependency array. Không dùng eslint-disable tùy tiện để bỏ qua dependencies.
- **Cleanup đầy đủ**: Luôn return cleanup function trong `useEffect` khi đăng ký timers (`setTimeout`, `setInterval`), event listeners hoặc subscriptions để phòng chống rò rỉ bộ nhớ.
- **Phân định rõ ràng**:
  - *Render Logic*: Tính toán JSX thuần túy.
  - *Event Handlers*: Xử lý tương tác của người dùng (click, submit, change).
  - *Side Effects*: Đồng bộ hóa với hệ thống bên ngoài (API, DOM mutations, analytics).

### 7.3. Custom Hooks
- Custom Hooks phải bắt đầu bằng tiền tố `use` (ví dụ: `useMedicineSearch`, `useInvoiceCalculation`).
- Custom Hooks đóng gói các hành vi giao diện hoặc logic bất đồng bộ có tính gắn kết, giúp component giao diện giữ được sự ngắn gọn và tập trung.

---

## 8. Triển khai Trang và Điều hướng (Page & Routing Implementation)

### 8.1. Trách nhiệm của Page Component
Page component (màn hình ứng dụng) chịu trách nhiệm:
- Tiếp nhận route context (route params, query params) theo cơ chế router của project.
- Phối hợp các components con để dựng nên bố cục hoàn chỉnh của trang.
- Kết nối với tầng dữ liệu (data fetching/state) và truyền dữ liệu cần thiết cho các component con.
- Xử lý các trạng thái mức trang: Page loading, Page error, Page empty state.
- Điều phối chuyển trang (navigation) theo luồng nghiệp vụ.

### 8.2. Ranh giới Bảo mật trong Điều hướng (Route Guards vs. Security Authority)
- **Frontend Route Guard chỉ phục vụ UX**: Route guards (bảo vệ đường dẫn trên client) có nhiệm vụ chuyển hướng người dùng chưa đăng nhập về trang Login, hoặc ngăn người dùng không có role phù hợp nhìn thấy giao diện không liên quan.
- **Frontend Route Guard KHÔNG PHẢI là cơ chế bảo mật**:
  ```text
  Client Route Guard   → Hỗ trợ trải nghiệm người dùng (UX Navigation)
  Backend Authorization → Thẩm định và bảo vệ an ninh thực sự (Security Enforcement)
  ```
- **Tuyệt đối không coi "Ẩn nút bấm / Ẩn menu / Chặn route trên frontend" là hệ thống đã được bảo mật**: Mọi endpoint API phía sau bắt buộc phải được thẩm định độc lập theo Rules `03`, `04`, `05`, `06`.
- **Frontend chỉ điều chỉnh giao diện, không sở hữu thẩm quyền phân quyền**: Frontend có thể sử dụng thông tin role/permission do backend cung cấp để điều chỉnh navigation và ẩn/hiện UI. Nhưng frontend tuyệt đối KHÔNG sở hữu role semantics, permission model (Rule 04) hay runtime authorization decision (Rule 05).

---

## 9. Tích hợp Gọi API (API Client Integration)

Skill 04 chỉ sở hữu kỹ thuật gọi API trên frontend. Toàn bộ hợp đồng API thuộc quyền sở hữu tối cao của **Rule 08 (`08-api-contract.md`)**.

### 9.1. Tuân thủ tuyệt đối Hợp đồng API (Rule 08 Ownership)
- **Thẩm quyền Hợp đồng API**: Toàn bộ hợp đồng API (URIs, HTTP methods, DTOs, query parameters, status codes) thuộc quyền sở hữu độc quyền của **Rule 08 (`08-api-contract.md`)**. Frontend bắt buộc phải tuân thủ hợp đồng có evidence/specification thực tế từ Rule 08 hoặc backend implementation đã được phê duyệt.
- **Tính chất minh họa của các ví dụ (Không tạo ra contract mặc định)**:
  - Mọi URI (như `/api/v1/sale-orders`), trường phân trang (như `page`, `pageSize`, `totalCount`, `totalPages`) và mã HTTP status (như `400`, `401`, `403`, `404`, `409`, `500`) được đề cập trong Skill này **chỉ được xem là ví dụ minh họa**, tuyệt đối **không được trở thành API contract mặc định** của hệ thống.
  - Các ví dụ trong Skill 04 **không tạo ra bất kỳ API contract mới nào**.
  - Agent tuyệt đối **không được suy diễn API contract từ các ví dụ trong Skill này** mà phải căn cứ trực tiếp vào contract thực tế của backend theo Rule 08.
- **Quy tắc tích hợp phía Client**:
  - Sử dụng đúng URI theo hợp đồng API thực tế đã công bố.
  - Sử dụng đúng HTTP Method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
  - Gửi đúng cấu trúc Request DTO, không gửi thừa các trường nội bộ.
  - Tiếp nhận và giải mã đúng cấu trúc Response DTO.
  - Xử lý phân trang có giới hạn theo contract thực tế quy định.
  - **Ranh giới Idempotency**: Frontend **không tự định nghĩa cơ chế idempotency** và **không tự phát minh header `Idempotency-Key`** nếu API contract không định nghĩa. Khi API contract có quy định cơ chế idempotency, frontend bắt buộc phải tuân thủ. Việc truyền `Idempotency-Key` theo yêu cầu hợp đồng không có nghĩa Skill 04 sở hữu chính sách idempotency (Rule 02 sở hữu transaction/concurrency/idempotency policy, Rule 08 sở hữu API contract).
  - Lan truyền hoặc tiếp nhận `X-Correlation-ID` khi contract quy định.
  - **Không tự ý thay đổi contract backend chỉ để làm frontend thuận tiện hơn**.

### 9.2. Lựa chọn và sử dụng HTTP Client
- Tuân thủ abstraction HTTP client hiện có trong repository:
  - Nếu project dùng Axios instance (đã gắn interceptors gắn token/correlation id), sử dụng instance đó.
  - Nếu project dùng native `fetch` bọc trong custom API service, tuân theo service đó.
  - Không cài đặt thêm HTTP client mới nếu codebase đã có sẵn giải pháp phù hợp.

### 9.3. Phân loại và xử lý lỗi API
Frontend phải phân biệt rõ các kịch bản lỗi để phản hồi giao diện chính xác (các mã trạng thái dưới đây là ví dụ minh họa theo Rule 08):
- **Lỗi Mạng (Network Failure / Timeout)**: Mất kết nối internet hoặc server không phản hồi -> hiển thị thông báo kết nối, cung cấp nút Thử lại (Retry) cho các thao tác an toàn.
- **Lỗi Xác thực (ví dụ 401 Unauthorized)**: Token hết hạn hoặc không hợp lệ -> điều hướng về trang đăng nhập hoặc kích hoạt luồng làm mới token (refresh token) nếu hệ thống hỗ trợ.
- **Lỗi Phân quyền (ví dụ 403 Forbidden)**: Không có quyền thực hiện thao tác -> hiển thị thông báo từ chối truy cập rõ ràng, không làm crash ứng dụng.
- **Lỗi Dữ liệu không hợp lệ (ví dụ 400 Bad Request / 422 Problem Details)**: Hiển thị lỗi validation chi tiết tương ứng với từng trường nhập liệu trên form.
- **Lỗi Không tìm thấy (ví dụ 404 Not Found)**: Hiển thị màn hình hoặc thông báo tài nguyên không tồn tại.
- **Lỗi Xung đột trạng thái (ví dụ 409 Conflict)**: Xung đột dữ liệu hoặc trùng lặp yêu cầu -> thông báo người dùng tải lại dữ liệu mới nhất.
- **Lỗi Máy chủ (ví dụ 500 Internal Server Error)**: Thông báo hệ thống đang gặp sự cố, hiển thị mã TraceId để liên hệ hỗ trợ. **Tuyệt đối không bao giờ hiển thị raw stack trace hoặc câu lệnh SQL của backend lên giao diện người dùng**.

---

## 10. Ranh giới Xác thực và Phân quyền (Authentication & Authorization Boundary)

Frontend đóng vai trò phản ánh giao diện (Representation), không phải thẩm quyền xác thực/phân quyền:

### 10.1. Những việc Frontend ĐƯỢC PHÉP làm
- Sử dụng trạng thái session/authentication theo cơ chế đã được Security Policy, backend authentication implementation và repository convention xác lập. Skill 04 không tự quyết định nơi hoặc cách lưu access token/refresh token.
- Hiển thị thông tin người dùng đang đăng nhập trên thanh điều hướng.
- Sử dụng thông tin Role / Permissions do backend cung cấp để điều chỉnh giao diện người dùng (navigation, ẩn/hiện nút bấm, menu, tabs) nhằm tăng trải nghiệm người dùng (UX).
- Chuyển hướng người dùng khi hết phiên làm việc.
- Hiển thị các trang thông báo 401/403 thân thiện.

### 10.2. Những việc Frontend TUYỆT ĐỐI KHÔNG ĐƯỢC làm
- Tự quyết định quyền truy cập cuối cùng vào dữ liệu.
- Tin tưởng các giá trị `role`, `permission`, `isAdmin` do người dùng có thể tự ý chỉnh sửa trong client state, devtools hoặc localStorage.
- Bỏ qua việc xử lý lỗi 401/403 từ API vì cho rằng "UI đã ẩn nút rồi thì user không thể gọi được".

### 10.3. Phân định Thẩm quyền Phân quyền (RBAC & Authorization Ownership Boundary)
Frontend chỉ là tầng thể hiện (representation) phía client. Frontend có thể sử dụng thông tin role / permission do backend cung cấp để điều chỉnh trải nghiệm người dùng (navigation, visibility của buttons/menus/tabs).

Frontend tuyệt đối **KHÔNG sở hữu**:
- **Role Semantics**: Ý nghĩa nghiệp vụ và định nghĩa của các vai trò (thuộc sở hữu độc quyền của `04-rbac.md`).
- **Permission Model**: Mô hình quyền hạn và ma trận phân quyền (thuộc sở hữu độc quyền của `04-rbac.md`).
- **RBAC Policy**: Chính sách phân quyền trên tài nguyên hệ thống (thuộc sở hữu độc quyền của `04-rbac.md`).
- **Authorization Decision**: Quyết định thẩm định quyền truy cập runtime (thuộc sở hữu độc quyền của `05-authorization.md`).

Mối quan hệ phân quyền:
```text
Rule 03 (Authentication)
    ↓
Rule 04 (Role / Permission Matrix)
    ↓
Rule 05 (Runtime Server Authorization)
    ↓
Rule 06 (Branch Data Isolation)
    ↓
Skill 04 (Frontend UX Representation & Form Controls)
```

---

## 11. Xử lý Ngữ cảnh Chi nhánh (Branch Context)

Trong hệ thống PharmaBranch, `CHI_NHANH` là ranh giới cô lập dữ liệu tối quan trọng:
- **Client BranchId là untrusted**: Frontend có thể gửi `branchId` khi API contract yêu cầu rõ ràng dưới dạng tham số tài nguyên, nhưng backend mới là nơi thẩm định tính hợp lệ dựa trên authenticated identity (Rule 06).
- **Không tự ý chuyển branch**: Frontend không được cho phép người dùng tự ý đổi `branchId` trong request parameters để truy cập dữ liệu của chi nhánh khác nếu backend chưa cấp quyền cross-branch.
- **Xử lý dữ liệu branch-scoped**: Dữ liệu danh mục thuốc, tồn kho, hóa đơn, báo cáo hiển thị trên giao diện phải phản ánh đúng phạm vi chi nhánh được cấp phép.
- **Báo cáo xung đột**: Nếu phát hiện API backend đang phụ thuộc hoàn toàn vào client-supplied `branchId` mà không thẩm định server-side, Agent không tự ý sửa backend trong Skill 04; phải lập báo cáo an ninh và chuyển giao cho Rule 05, Rule 06 và Skill 03.

---

## 12. Triển khai Biểu mẫu và Validation (Forms & Client-side Validation)

### 12.1. Quản lý Biểu mẫu (Form Handling)
- Dữ liệu form phải được định kiểu TypeScript rõ ràng (Form Values interface).
- **Quản lý trạng thái form linh hoạt theo nhu cầu thực tế**: Form chỉ quản lý các trạng thái thực sự cần thiết theo yêu cầu nghiệp vụ và Existing Frontend Convention của repository. Các trường trạng thái như `values`, `errors`, `isSubmitting`, `isDirty`, `isValid` chỉ là các ví dụ phổ biến, tuyệt đối không bắt buộc mọi form phải triển khai đầy đủ tất cả các trường này.
- **Chống Submit trùng lặp (Double Submit)**: Disable nút submit khi form đang trong quá trình gửi yêu cầu (`isSubmitting = true`), kết hợp cơ chế chống click liên tiếp để tránh tạo các đơn hàng hoặc hóa đơn trùng lặp.
- Hỗ trợ reset form hoặc dọn dẹp state khi người dùng đóng modal hoặc chuyển trang.

### 12.2. Vai trò của Client-side Validation
- **Mục đích của Client Validation**: Cung cấp phản hồi tức thì cho người dùng (ví dụ: trường bắt buộc, định dạng email, số lượng phải lớn hơn 0), giảm thiểu các request sai cú pháp gửi lên server.
- **Client Validation KHÔNG thay thế Server Validation**: Mọi quy tắc nghiệp vụ (tồn kho có đủ không, giá bán có đúng không, hạn sử dụng còn hợp lệ không) bắt buộc phải do backend thẩm định.
- Không tự ý cài đặt thêm các thư viện form/validation phức tạp nếu repository đã có sẵn giải pháp phù hợp.

---

## 13. Các trạng thái Giao diện dữ liệu (Loading / Error / Empty States)

Mọi màn hình hoặc thành phần giao diện phụ thuộc dữ liệu bất đồng bộ (data-driven views) bắt buộc phải xử lý trọn vẹn các trạng thái:
1. **Loading State**: Hiển thị indicator rõ ràng (Spinner, Skeleton loading, Progress bar) khi đang tải dữ liệu; không để màn hình trắng hoặc treo giao diện.
2. **Success State**: Hiển thị dữ liệu đầy đủ, mạch lạc khi request thành công.
3. **Empty State**: Empty State phải giải thích rõ tình trạng không có dữ liệu và cung cấp hành động phù hợp khi có hành động hữu ích như xóa filter, thử tìm kiếm khác hoặc tạo dữ liệu mới (không bắt buộc phải có action nếu ngữ cảnh màn hình không yêu cầu).
4. **Error State**: Khi có lỗi xảy ra, hiển thị thông báo lỗi thân thiện, kèm nút Thử lại (Retry) khi phù hợp (áp dụng đối với các thao tác đọc/truy vấn dữ liệu an toàn).
5. **Submitting / Disabled State**: Các nút hành động làm thay đổi dữ liệu phải chuyển sang trạng thái loading/disabled khi đang xử lý để ngăn chặn thao tác lặp lại.

**Nguyên tắc**:
- Không bao giờ để giao diện rơi vào trạng thái mơ hồ (unresponsive/hanging).
- Không duy trì trạng thái loading vô hạn nếu request đã thất bại hoặc bị hủy.
- Không âm thầm nuốt lỗi bằng cách catch exception mà không hiển thị phản hồi giao diện.

---

## 14. Vòng đời Xử lý Bất đồng bộ và Chống Xung đột (Async & Request Lifecycle)

Khi làm việc với các tác vụ bất đồng bộ trên giao diện:
- **Phòng chống Race Conditions**: Khi người dùng thay đổi bộ lọc hoặc từ khóa tìm kiếm liên tục, kết quả của request gửi trước có thể phản hồi sau request gửi sau. Cần sử dụng cơ chế hủy request (`AbortController`) hoặc kiểm tra cờ hủy/active state để đảm bảo chỉ render kết quả của request mới nhất.
- **Quản lý lifecycle của async work**:
  - Hủy hoặc vô hiệu hóa các requests không còn cần thiết khi phù hợp (ví dụ sử dụng `AbortController`).
  - Dọn dẹp (cleanup) các subscriptions, timers và event listeners khi component unmount.
  - Tránh các kết quả lỗi thời (stale results) từ các async operations gửi trước.
  - Tránh giữ lại các tài nguyên không còn cần thiết (retained resources).
  - Tránh các cập nhật state không còn phù hợp với lifecycle hiện tại của component.
  - Không đồng nhất mọi async operation còn pending khi unmount với "memory leak".
- **Kỷ luật Retry (Phân định READ/QUERY vs. MUTATION)**:
  - Không tạo vòng lặp retry vô hạn khi gặp lỗi.
  - **READ / QUERY Retry**: Các yêu cầu đọc dữ liệu an toàn (safe, idempotent read queries) có thể cung cấp nút hoặc cơ chế Thử lại (Retry) khi phù hợp khi gặp lỗi mạng tạm thời.
  - **MUTATION Retry**: Đối với các thao tác có tác dụng phụ làm biến đổi dữ liệu (như `POST`, `PUT`, `DELETE`, tạo đơn hàng, thanh toán, trừ kho), tuyệt đối **KHÔNG tự động retry** khi gặp lỗi hoặc timeout trừ khi:
    1. API contract xác định rõ ràng retry semantics an toàn; hoặc
    2. Đã có cơ chế `Idempotency-Key` / chống duplicate request tương ứng phía server bảo vệ.
  - Mutation không được tự động retry nếu contract không xác định retry semantics an toàn. Frontend không tự phát minh cơ chế idempotency.
  - **Tuyệt đối tránh suy diễn nguy hiểm**: Không bao giờ triển khai luồng xử lý dạng: `POST failed → automatically POST again` gây nguy cơ trừ tồn kho hai lần hoặc nhân đôi hóa đơn/thanh toán. Phải giữ nhất quán tuyệt đối với Rule 02 và Rule 08.

---

## 15. Tiêu chuẩn Tiếp cận Giao diện (Accessibility - a11y)

Frontend phải đáp ứng các yêu cầu accessibility cơ bản đối với các thành phần tương tác, theo semantic của component và convention/design system hiện có. Khi có giới hạn kỹ thuật hoặc component đặc thù, Agent phải áp dụng giải pháp accessibility phù hợp thay vì máy móc áp dụng một pattern:
- **Semantic HTML**: Sử dụng đúng các thẻ chuẩn HTML5 (`<button>`, `<input>`, `<nav>`, `<main>`, `<header>`, `<article>`) thay vì lạm dụng `<div>` và gán sự kiện click.
- **Điều khiển bằng Bàn phím**: Các thành phần tương tác (nút, links, input, dropdown) phải có thể focus và kích hoạt bằng phím `Tab`, `Enter`, `Space`.
- **Form Labels**: Mọi input điều khiển form phải có thẻ `<label>` tương ứng hoặc thuộc tính `aria-label` / `aria-labelledby`.
- **Thông báo Lỗi có thể tiếp cận**: Lỗi form nên được liên kết với input thông qua `aria-describedby` hoặc `aria-invalid`.
- **Không truyền tải trạng thái chỉ bằng màu sắc**: Trạng thái cảnh báo, thành công hoặc lỗi phải kết hợp cả văn bản (text), biểu tượng (icon) hoặc nhãn rõ ràng, không chỉ dựa vào màu đỏ/xanh.

---

## 16. Hiệu năng Giao diện (Frontend Performance)

Tối ưu hóa hiệu năng frontend phải dựa trên bằng chứng vật lý (evidence-based), không tối ưu hóa sớm khi chưa cần thiết (premature optimization):
- **Tránh re-render thừa**: Tách các thành phần giao diện cập nhật thường xuyên (như input text) thành components nhỏ riêng biệt để tránh re-render toàn bộ trang.
- **Sử dụng `useMemo` và `useCallback` có chọn lọc**: Chỉ sử dụng khi tính toán thực sự tốn kém hoặc khi cần duy trì tham chiếu ổn định truyền cho các component con có áp dụng memoization. Không bọc mọi hàm và biến một cách máy móc.
- **Tối ưu Danh sách Lớn**: Với các bảng dữ liệu hoặc danh sách sản phẩm hàng nghìn dòng, ưu tiên giải pháp phân trang tại server (Rule 08) trước khi xem xét giải pháp virtualization trên client.
- **Code Splitting & Lazy Loading dựa trên Bằng chứng**: Xem xét code splitting/lazy loading khi bundle hoặc performance measurement cho thấy ảnh hưởng đáng kể đến initial load hoặc route loading; không thêm lazy loading chỉ vì đó là pattern phổ biến. Luôn tuân thủ nguyên tắc Evidence > Premature Optimization.

---

## 17. Thực hành An toàn Mã nguồn Frontend (Security-Safe Frontend Practices)

Mặc dù frontend không phải chốt chặn an ninh, mã nguồn frontend phải tuân thủ nghiêm ngặt các thực hành an toàn:
- **Tuyệt đối không hard-code thông tin nhạy cảm**: Không nhúng mật khẩu, connection strings, JWT secret keys, API private keys vào mã nguồn JavaScript/TypeScript.
- **Không tự ý quyết định kiến trúc lưu trữ xác thực (Auth Token Storage Boundary)**:
  - Cơ chế lưu trữ xác thực và phiên làm việc (authentication/session storage) bắt buộc phải tuân theo Security Policy (`03-security.md`), implementation xác thực của backend và Existing Frontend Convention của repository.
  - Skill 04 tuyệt đối **KHÔNG sở hữu kiến trúc lưu trữ xác thực (authentication storage architecture)**; không tự ý quyết định nơi hoặc cách lưu access token/refresh token; không tự ý đề xuất hoặc áp đặt bất kỳ giải pháp lưu trữ nào (như `localStorage`, `sessionStorage`, in-memory hay cookie) làm kiến trúc mặc định.
  - Skill 04 chỉ sở hữu **frontend security-safe implementation** (triển khai mã nguồn an toàn phía client): không hard-code secrets, không log credentials, tokens hay dữ liệu xác thực nhạy cảm lên console hoặc telemetry.
- **Không log dữ liệu nhạy cảm**: Tuyệt đối không gọi `console.log` để in thông tin credentials, tokens, mật khẩu, mã OTP, full credit card hoặc dữ liệu xác thực nhạy cảm lên trình duyệt trong môi trường production.
- **Chống tấn công XSS**:
  - Không sử dụng `dangerouslySetInnerHTML` tùy tiện. Nếu bắt buộc phải hiển thị rich text, nội dung phải được làm sạch (sanitize) bằng thư viện chuyên dụng đáng tin cậy.
  - Không render trực tiếp dữ liệu thô chưa kiểm duyệt từ người dùng vào DOM.
- **Không coi Minification / Obfuscation là Bảo mật**: Bất kỳ đoạn mã nào chạy trên trình duyệt của người dùng đều có thể bị dịch ngược và kiểm tra.

---

## 18. Kiểm thử Frontend (Frontend Testing Implementation)

Kiểm thử frontend phải tuân thủ nghiêm ngặt các quy ước và công cụ test sẵn có trong repository:

### 18.1. Component & Unit Tests
- Tập trung kiểm tra hành vi tương tác của người dùng (User Behavior) và kết quả hiển thị trên giao diện, thay vì kiểm tra chi tiết cài đặt nội bộ (Implementation Details).
- Kiểm tra các nhánh logic: Nhập liệu hợp lệ/không hợp lệ, kích hoạt sự kiện click, hiển thị thông báo lỗi, render đúng props.

### 18.2. Integration & Page Tests
- Kiểm thử sự phối hợp giữa Page, State và API Client (thường mock các phản hồi HTTP theo đúng schema của Rule 08).
- Kiểm thử luồng điều hướng trang, hiển thị đúng các trạng thái Loading / Success / Error / Empty.
- **Lưu ý**: Việc test pass trên giao diện frontend (ví dụ: thấy nút bị ẩn) **không chứng minh rằng backend API đã được bảo vệ**.

### 18.3. End-to-End (E2E) Tests
- Nếu repository đã có sẵn framework E2E (Playwright, Cypress), chỉ tập trung kiểm tra các luồng nghiệp vụ quan trọng xuyên suốt (Critical User Journeys):
  - Luồng đăng nhập (login).
  - Luồng điều hướng và hiển thị giao diện theo vai trò/quyền hạn (navigation theo role/permission).
  - Luồng tìm kiếm thuốc (search medicine), chọn thuốc vào giỏ hàng (cart).
  - Luồng tạo đơn bán hàng (order) và thanh toán (payment).
- **Ranh giới An ninh của E2E Frontend**: Kiểm tra frontend behavior đối với authentication/session và navigation/visibility theo thông tin quyền được backend cung cấp. E2E frontend **tuyệt đối không thay thế security/authorization testing ở backend**; việc test E2E giao diện pass không chứng minh rằng Rule 05 (Runtime Authorization) hay Rule 06 (Branch Isolation) đã được enforce an toàn tại backend.
- Không tự ý du nhập hoặc dựng thêm test framework mới nếu task không yêu cầu rõ ràng.

---

## 19. Xử lý Lỗi Giao diện và Khả năng Phục hồi (Error Boundaries & Resilience)

Nếu repository có sử dụng React Error Boundary:
- Đặt Error Boundary tại các ranh giới hợp lý (mức toàn trang hoặc bao bọc các widget phức tạp) để ngăn chặn lỗi runtime của một component làm sập toàn bộ ứng dụng.
- Hiển thị giao diện dự phòng (Fallback UI) thân thiện, có thông điệp rõ ràng và nút "Tải lại trang" hoặc "Quay về trang chủ".
- Không hiển thị raw exception message hoặc component stack trace kỹ thuật cho người dùng cuối trong môi trường production.

---

## 20. Kỷ luật Tái cấu trúc Frontend (Frontend Refactoring Discipline)

Khi thực hiện tái cấu trúc mã nguồn giao diện:
1. **Xác định hành vi hiện tại**: Hiểu rõ component hoặc trang đang hoạt động như thế nào trước khi sửa.
2. **Kiểm tra Tests hiện có**: Chạy test suites để thiết lập đường cơ sở bảo đảm không làm gãy tính năng.
3. **Thay đổi từng bước nhỏ (Incremental Changes)**: Chia nhỏ quá trình refactor, kiểm tra trực quan giao diện ở từng bước.
4. **Bảo toàn Hợp đồng API**: Không thay đổi cấu trúc request/response models gửi lên backend trừ khi task yêu cầu.
5. **Không refactor vì mục đích "chạy theo trào lưu"**: Không tự ý đổi thư viện state management, router hay UI framework chỉ để làm code "trông hiện đại hơn".
6. **Không dọn dẹp ngoài phạm vi**: Chỉ tập trung tái cấu trúc trong phạm vi được giao, không thực hiện opportunistic cleanup làm ảnh hưởng đến các màn hình khác.

---

## 21. Bảng kiểm tra chất lượng Frontend (Frontend Quality Checklist)

Trước khi hoàn thành bất kỳ task triển khai hoặc sửa đổi frontend nào, Agent bắt buộc phải tự đối chiếu mã nguồn với danh sách kiểm tra sau:

- [ ] **1. Tuân thủ Rules 00–09**: Không vi phạm bất kỳ nguyên tắc an ninh, cô lập chi nhánh, toàn vẹn dữ liệu hay hợp đồng API nào.
- [ ] **2. Tuân thủ Existing Frontend Convention First**: Phù hợp hoàn toàn với cấu trúc thư mục, styling, naming và patterns hiện có của codebase.
- [ ] **3. Không tự ý thêm thư viện mới**: Không cài đặt state management, router, HTTP client, styling hay UI framework ngoài phạm vi task.
- [ ] **4. Component có trách nhiệm đơn nhất**: Component mạch lạc, không biến thành "god component" nhồi nhét quá nhiều trách nhiệm.
- [ ] **5. TypeScript chặt chẽ**: Types/interfaces đầy đủ cho Props, State, Form; hạn chế tối đa `any` và type assertions không an toàn.
- [ ] **6. Phân định đúng tầng State**: Phân loại chính xác local, derived, server cache, shared, auth và form state; không lạm dụng global state.
- [ ] **7. Hooks tuân thủ Rules of Hooks**: Không gọi hook trong vòng lặp hay điều kiện; dependency arrays chính xác và đầy đủ.
- [ ] **8. Không dùng useEffect cho derived state**: Tính toán trực tiếp giá trị trong quá trình render thay vì dùng effect không cần thiết.
- [ ] **9. API Integration tuân thủ Rule 08**: Sử dụng đúng URI, HTTP method, DTO models, xử lý lỗi và phân trang theo contract.
- [ ] **10. Frontend không là Security Authority**: Không coi việc ẩn UI, disabled button hay client route guard là đã bảo mật hệ thống.
- [ ] **11. Client BranchId không tin cậy**: Không dùng client-side branchId làm ranh giới an ninh; tuân thủ dữ liệu branch-scoped từ backend.
- [ ] **12. Client validation không thay thế server**: Client validation chỉ hỗ trợ UX; validation nghiệp vụ tối cao thuộc về backend.
- [ ] **13. Xử lý đủ 4 trạng thái giao diện**: Xử lý đầy đủ Loading, Success, Empty và Error states cho mọi màn hình tải dữ liệu.
- [ ] **14. Không nuốt lỗi giao diện**: Không có khối try-catch rỗng làm mất dấu vết lỗi hoặc để giao diện treo không phản hồi.
- [ ] **15. Không rò rỉ thông tin nhạy cảm**: Không log token, password, thông tin thẻ; không hard-code secrets trong mã nguồn.
- [ ] **16. An toàn chống XSS**: Không dùng `dangerouslySetInnerHTML` tùy tiện; không render trực tiếp dữ liệu thô chưa được kiểm duyệt.
- [ ] **17. Vòng đời async an toàn**: Xử lý race conditions khi tìm kiếm; dọn dẹp timers, listeners và abort requests khi component unmount.
- [ ] **18. Chống submit trùng lặp & Kỷ luật Retry**: Disable nút bấm khi đang submitting; phân biệt rõ query retry và mutation retry; không tự động retry mutation khi contract chưa xác định retry semantics an toàn; tuân thủ đúng cơ chế idempotency của Rule 02 và Rule 08 (không tự phát minh Idempotency-Key).
- [ ] **19. Khả năng tiếp cận cơ bản**: Sử dụng đúng semantic HTML, form có label, hỗ trợ điều hướng bàn phím cơ bản.
- [ ] **20. Hiệu năng dựa trên bằng chứng**: Không memoize tràn lan (`useMemo`, `useCallback`) khi chưa có bằng chứng nghẽn hiệu năng.
- [ ] **21. Testing theo đúng quy ước**: Viết test theo convention hiện có của project, kiểm tra hành vi thay vì implementation details.
- [ ] **22. Không vượt ranh giới phạm vi**: Không sửa mã nguồn backend, database schema hay cấu hình build tool ngoài yêu cầu của task.
- [ ] **23. Không refactor cơ hội**: Giữ phạm vi thay đổi tối thiểu, không thực hiện dọn dẹp mã nguồn ngoài scope task.
- [ ] **24. Giao diện thân thiện khi lỗi**: Phản hồi lỗi API văn minh, rõ ràng, không hiển thị raw stack trace hay câu lệnh SQL cho người dùng.

---

## 22. Tuân thủ Quản trị Dự án (Governance Compliance)

Skill 04 vận hành dưới sự chi phối trực tiếp của hệ thống Rules `00–09` của PharmaBranch.

### 22.1. Bảng đối chiếu ranh giới với Rules
| Rule | Trách nhiệm của Rule (Policy & Invariants) | Mối quan hệ triển khai của Skill 04 (How to Implement) |
|---|---|---|
| `00-project-governance.md` | Rule 00 sở hữu quản trị dự án, kiểm soát thay đổi | Skill 04 chỉ thực hiện thay đổi tối thiểu, có bằng chứng, bảo toàn conventions của frontend |
| `01-architecture.md` | Rule 01 sở hữu kiến trúc Client-Server tổng thể | Skill 04 triển khai phía frontend/client theo ranh giới Client–Server và kiến trúc thực tế đã được Rules/repository xác lập; không truy cập trực tiếp database và không tự ý tạo hoặc thay đổi architectural boundaries |
| `02-architecture-quality.md` | Rule 02 sở hữu tính toàn vẹn giao dịch, concurrency, idempotency policy | Skill 04 triển khai UX chống double submit, gửi Idempotency-Key khi API contract của Rule 08 yêu cầu; không tự phát minh cơ chế idempotency và không sở hữu idempotency/transaction policy |
| `03-security.md` | Rule 03 sở hữu an ninh hệ thống, mã hóa, bảo mật JWT | Skill 04 triển khai UI session UX, không hard-code secrets, không log token, không là authentication authority |
| `04-rbac.md` | Rule 04 sở hữu mô hình vai trò và ma trận phân quyền | Skill 04 hiển thị menu/nút theo role/permissions được cung cấp; không tự định nghĩa mô hình RBAC |
| `05-authorization.md` | Rule 05 sở hữu thẩm định quyền truy cập runtime server-side | Skill 04 triển khai client route guard cho trải nghiệm người dùng; không thay thế authorization authority |
| `06-branch-isolation.md` | Rule 06 sở hữu ranh giới cô lập dữ liệu chi nhánh và RLS | Skill 04 hiển thị dữ liệu theo branch scope từ server; không coi client-side branchId là trusted boundary |
| `07-database-integrity.md` | Rule 07 sở hữu tính toàn vẹn dữ liệu quan hệ và kiểu số | Skill 04 tôn trọng các định dạng số liệu, tiền tệ và kiểu dữ liệu nghiệp vụ được expose qua API |
| `08-api-contract.md` | Rule 08 sở hữu toàn bộ hợp đồng API, URI, DTOs, HTTP status | Skill 04 triển khai gọi HTTP API và ánh xạ giao diện tuân thủ 100% theo contract của Rule 08 |
| `09-observability-operations.md` | Rule 09 sở hữu chính sách logging, tracing và giám sát | Skill 04 tuân thủ quy ước logging phía client, truyền X-Correlation-ID nếu contract yêu cầu, không log dữ liệu nhạy cảm |

### 22.2. Xử lý xung đột
- Nếu phát hiện bất kỳ hướng dẫn nào trong Skill 04 mâu thuẫn với Rules `00–09`:
  1. **Tuyệt đối KHÔNG sửa Rules**.
  2. **Rules luôn luôn thắng (Rules > Skills)**.
  3. Báo cáo xung đột và điều chỉnh Skill 04 để tuân thủ triệt để quy định của Rules.

---

## 23. Phân định Ranh giới giữa các Skills (Cross-Skill Boundary)

Hệ thống Skills của PharmaBranch được phân định trách nhiệm rõ ràng, không chồng lấn:
- **Skill 01 (`01-codebase-onboarding`)**: Chịu trách nhiệm khảo sát, thu thập bằng chứng vật lý và lập bản đồ kiến trúc hiện trạng của repository trước khi thực hiện thay đổi.
- **Skill 02 (`02-coding-standards`)**: Chịu trách nhiệm chuẩn hóa chất lượng mã nguồn chung (naming, readability, comments, refactoring discipline, technology-neutral standards).
- **Skill 03 (`03-dotnet-backend`)**: Chịu trách nhiệm về kỹ thuật triển khai backend ASP.NET Core / .NET 8 (C#, DI, Controllers, Services, Async, DB access).
- **Skill 04 (`04-react-frontend`)**: Chịu trách nhiệm về kỹ thuật triển khai frontend React + TypeScript (Components, Pages, UI State, Forms, Routing, API client integration).
- **Rules 00–09**: Hệ thống quy tắc quản trị cốt lõi, nắm giữ toàn bộ chính sách và bất biến của hệ thống.
