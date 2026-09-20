# AGENT INSTRUCTIONS & ROUTING INDEX

Tệp này đóng vai trò là chỉ mục điều hướng cho tất cả các AI Agent làm việc trong repository **Pharmacy**. 

---

## 1. Tổng quan hệ thống (System Context)
- **Dự án**: Pharmacy Management System
- **Backend**: .NET Core (Clean Architecture / Domain-Driven Design)
- **Frontend Web**: React (TypeScript)
- **Mobile**: Flutter (Dart)
- **Database**: Oracle Database (Virtual Private Database / PL-SQL)

---

## 2. Quy trình nạp ngữ cảnh (Context Routing Protocol)

Trước khi thực hiện bất kỳ nhiệm vụ nào (tạo tính năng, sửa bug, refactor), AI Agent **BẮT BUỘC** phải đọc các file chỉ dẫn tương ứng trong `.agents/`.

### A. Quy tắc hệ thống (System Rules)
Tham chiếu `.agents/rules/` theo từng trường hợp nghiệp vụ:

* **Tất cả nhiệm vụ**: Bắt buộc tuân thủ `00-project-governance.md`, `01-architecture.md` và `06-branch-isolation.md`.
* **Viết API / Logic nghiệp vụ**: Đọc `03-security.md`, `04-rbac.md`, `05-authorization.md` và `08-api-contract.md`.
* **Thao tác với CSDL / Migration**: Đọc `07-database-integrity.md`.
* **Xử lý Log / Monitoring / Error**: Đọc `09-observability-operations.md`.
* **Refactor / Tối ưu code**: Đọc `02-architecture-quality.md`.

### B. Kỹ năng công nghệ cụ thể (Technology Skills)
Nạp file skill tương ứng từ `.agents/skills/` tùy thuộc vào khu vực mã nguồn (`/src/...`) đang thao tác:

| Khu vực mã nguồn | Skill File cần đọc |
| :--- | :--- |
| **Chung cho toàn bộ project** | `01-codebase-onboarding/SKILL.md`<br>`02-coding-standards/SKILL.md` |
| **Backend (`src/backend/`)** | `03-dotnet-backend/SKILL.md`<br>`06-api-design/SKILL.md` |
| **Web Frontend (`src/web/`)** | `04-react-frontend/SKILL.md`<br>`06-api-design/SKILL.md` |
| **Mobile (`src/mobile/`)** | `05-flutter-mobile/SKILL.md`<br>`06-api-design/SKILL.md` |
| **Database (`database/`)** | `07-database-oracle/SKILL.md` |

---

## 3. Quy trình thực thi của Agent (Execution Protocol)

1. **Phân tích yêu cầu**: Xác định phạm vi ảnh hưởng (Backend, Web, Mobile hay Database).
2. **Nạp Rule & Skill**: Đọc chính xác các file hướng dẫn được liệt kê ở mục 2.
3. **Thực thi mã nguồn**:
   - Tuân thủ quy chuẩn đặt tên, cấu trúc thư mục của từng tech stack.
   - Luôn đảm bảo API Response đúng format chuẩn (`08-api-contract.md`).
   - Kiểm tra các điều kiện an toàn bảo mật và phân quyền (`03-security.md`, `05-authorization.md`).
4. **Xác nhận kết quả**: Đảm bảo không vi phạm kiến trúc tầng và không gây ảnh hưởng tới các module khác.