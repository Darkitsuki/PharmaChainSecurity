---
name: skill-distillation
description: >
  Framework and procedural methodology for distilling verified problem-solving experiences,
  debugging lessons, and recurring technical patterns from chat history into reusable Playbooks
  and Skills, adhering strictly to Karpathy Guidelines, Verification Loop, and Governance Invariants.
---

# SKILL 14 — SKILL & KNOWLEDGE DISTILLATION

## 1. Objective & Scope

### 1.1. Objective
Skill này thiết lập phương pháp luận và quy trình chuẩn hóa **Chắt lọc tri thức & Kỹ năng (Skill & Knowledge Distillation)** cho toàn bộ hệ thống quản lý chuỗi nhà thuốc đa chi nhánh **PharmaBranch**.

Mục tiêu cốt lõi của Skill 14 là:
1. **Chống thất thoát tri thức (Prevent Knowledge Loss):** Chuyển hóa các bài học thực chiến, kinh nghiệm giải quyết lỗi phức tạp, kỹ thuật cấu hình Oracle VPD / .NET / React / Flutter từ lịch sử chat thành tài sản tri thức có cấu trúc và có thể tái sử dụng.
2. **Bảo vệ tính toàn vẹn của Quản trị (Governance Protection):** Ngăn chặn hiện tượng "trôi dạt quy chuẩn" (Governance Drift). Đảm bảo các giải pháp tình thế (temporary workarounds) không bao giờ bị hợp thức hóa thành quy tắc chính thức làm suy yếu an ninh hệ thống.
3. **Tuân thủ Karpathy Guidelines (Anti-Bloat & Simplicity):** Giữ cho bộ kỹ năng luôn tinh gọn, phẫu thuật, tránh tình trạng bùng nổ kỹ năng rác (Skill Bloat) gây quá tải ngữ cảnh (Context Budget Overflow).

---

### 1.2. Ranh giới sở hữu & Nguyên tắc bất biến (Ownership & Invariants)

> [!IMPORTANT]
> **Quy tắc vàng 1: "Distillation ≠ Policy Creation"**
> - Skill 14 chỉ chắt lọc phương pháp luận thực thi (How-to, Playbooks, Edge-case Workflows).
> - Skill 14 **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP** tự ý sửa đổi, nới lỏng hoặc ghi đè các Quy tắc Quản trị cốt lõi trong `.agents/rules/` (`00` đến `10`). Mọi thay đổi với Rules bắt buộc phải qua sự xem xét và phê duyệt trực tiếp của con người.

> [!IMPORTANT]
> **Quy tắc vàng 2: "Update over Create" (Ưu tiên cập nhật hơn tạo mới)**
> - Trước khi tạo một Skill mới, Agent bắt buộc phải kiểm tra xem bài học vừa rút ra có thể bổ sung trực tiếp vào một Skill hiện có (`01` đến `13`) hay không.
> - Chỉ tạo Skill mới khi quy trình đó là một miền năng lực độc lập hoàn toàn, có tính hệ thống và lặp lại tối thiểu 3 lần.

> [!IMPORTANT]
> **Quy tắc vàng 3: "Human-in-the-Loop Gating"**
> - Mọi kỹ năng hoặc playbook được sinh ra đều phải ở trạng thái **BẢN NHÁP (DRAFT / PROPOSAL)**.
> - Agent không được tự ý ghi đè vào thư viện kỹ năng production khi chưa có sự xác nhận của người dùng.

---

## 2. Mô hình tri thức hai tầng (Two-Tier Knowledge Model)

Để tránh làm phình to bộ nhớ ngữ cảnh của Agent, tri thức chắt lọc từ chat history bắt buộc phải được phân loại thành 2 tầng:

```text
+-----------------------------------------------------------------------------------------+
|                               TWO-TIER KNOWLEDGE MODEL                                  |
|                                                                                         |
|  [Chat Transcript / Problem Solved]                                                     |
|                 |                                                                       |
|                 v                                                                       |
|  [Karpathy Filter & Evidence Check]                                                     |
|                 |                                                                       |
|        +--------+--------+                                                              |
|        |                 |                                                              |
|        v                 v                                                              |
|  [TIER 1: PLAYBOOK / KI]  [TIER 2: CORE SKILL]                                          |
|  - Mẹo debug lỗi cụ thể   - Miền năng lực mới, hoàn chỉnh                               |
|  - Mã lỗi ORA- / SDK fix  - Quy trình phức tạp liên tầng                                |
|  - Lưu: docs/playbooks/   - Lưu: .agents/skills/xx-name/                                |
|  - Nạp: On-demand         - Nạp: Tích hợp vào AGENTS.md                                 |
+-----------------------------------------------------------------------------------------+
```

### 2.1. Tier 1: Troubleshooting Playbooks / Knowledge Items (On-Demand)
- **Định nghĩa:** Là các tài liệu tóm tắt kinh nghiệm ngắn (Micro-knowledge) xử lý một lỗi cụ thể, một cấu hình trắc trở, hoặc một cạm bẫy kỹ thuật đặc thù (ví dụ: cách debug Oracle VPD Session Context bị rò rỉ trong Connection Pool, xử lý lỗi CORS trên ASP.NET Core, mẹo build Flutter trên Windows).
- **Vị trí lưu trữ:** `docs/playbooks/` hoặc hệ thống Knowledge Base của IDE.
- **Chi phí context:** Rất thấp, chỉ nạp khi gặp đúng từ khóa/lỗi liên quan.

### 2.2. Tier 2: Standardized Core Skills (System-Wide)
- **Định nghĩa:** Là kỹ năng hoàn chỉnh với cấu trúc thư mục đầy đủ (`SKILL.md`), có frontmatter, hướng dẫn phương pháp luận từ đầu đến cuối cho một nghiệp vụ hoặc quy trình lớn chưa từng được bao phủ.
- **Tiêu chuẩn gia nhập:** Phải đáp ứng đầy đủ tiêu chí của **Verification Loop** và nhận được sự phê duyệt của con người.

---

## 3. Quy trình chắt lọc tri thức 5 bước (The Distillation Loop)

Mỗi khi Agent được yêu cầu tổng kết, chắt lọc tri thức sau một session làm việc (hoặc qua slash command `/learn`), chu trình 5 bước sau bắt buộc phải được thực hiện tuần tự:

```text
  1. Session Mining       ---> Trích xuất vấn đề, nguyên nhân gốc rễ và giải pháp
          |
          v
  2. Karpathy Filter      ---> Sàng lọc tinh gọn: Loại bỏ One-off & Trùng lặp
          |
          v
  3. Governance Sanity    ---> Rà soát đối chiếu Rules 00-10: Chặn mọi lỗ hổng
          |
          v
  4. Structured Drafting  ---> Soạn thảo bản nháp theo cấu trúc chuẩn mực
          |
          v
  5. Human Gating & Sync  ---> Trình người dùng duyệt & Đồng bộ AGENTS.md
```

### Bước 1: Khai phá phiên làm việc (Session Mining)
Agent đọc lại transcript cuộc hội thoại gần nhất và trích xuất 4 thành phần cốt lõi:
1. **Bối cảnh & Triệu chứng lỗi (Context & Symptoms):** Lỗi gì đã xảy ra? Thông báo lỗi chính xác là gì? Mã lỗi là gì (ví dụ: ORA-02290, 403 Forbidden)?
2. **Nguyên nhân gốc rễ (Root Cause):** Tại sao lại bị lỗi? (Do cơ chế locking? Do thiếu claim? Do Oracle VPD context chưa set?).
3. **Giải pháp đã kiểm chứng (Verified Solution):** Đoạn mã/cấu hình nào đã giải quyết triệt để lỗi? (Có bằng chứng physical code và test/build pass).
4. **Cạm bẫy cần tránh (Pitfalls / Anti-patterns):** Các hướng tiếp cận sai lầm hoặc giả định sai lầm đã khiến Agent mất thời gian trong phiên chat.

### Bước 2: Bộ lọc tinh gọn Karpathy (Karpathy Simplicity Filter)
Agent đặt ra 3 câu hỏi sàng lọc khắt khe:
- *Câu hỏi 1 (Tính tổng quát):* Vấn đề này có khả năng lặp lại trong tương lai không, hay chỉ là lỗi chính tả ngẫu nhiên (typo/one-off)? Nếu là one-off -> **DỪNG LẠI, KHÔNG LƯU**.
- *Câu hỏi 2 (Tính trùng lặp):* Tri thức này đã được đề cập trong Skills 01 đến 13 chưa? Nếu đã có -> Chuyển sang **chế độ Patch (Bổ sung thêm một lưu ý vào Skill cũ)**, không tạo file mới.
- *Câu hỏi 3 (Mức độ phức tạp):* Tri thức này có thể tóm tắt trong 20 dòng không? Nếu có -> Tạo **Tier 1 Playbook**, không tạo Tier 2 Skill.

### Bước 3: Rà soát An ninh & Quản trị (Governance Sanity Check)
Đối chiếu giải pháp với toàn bộ hệ thống Rules:
- **Kiểm tra Rule 03 & 05 (Security & Authorization):** Giải pháp có làm lộ secret, bỏ qua JWT, tắt middleware auth, hoặc tạo nguy cơ IDOR/BOLA không?
- **Kiểm tra Rule 06 (Branch Isolation):** Giải pháp có làm suy yếu việc cô lập chi nhánh, hay cố tình hardcode `BranchId` để vượt qua lỗi không?
- **Kiểm tra Rule 07 (Database Integrity):** Giải pháp có bỏ qua transaction, vô hiệu hóa constraint, hoặc xóa FK không?
> [!CAUTION]
> Nếu giải pháp trong chat là một "workaround tạm bợ" vi phạm bất kỳ Rule nào ở trên, Agent **BẮT BUỘC PHẢI TỪ CHỐI** việc biến nó thành Skill/Playbook. Thay vào đó, phải ghi chú rõ đó là Anti-Pattern cần loại trừ.

### Bước 4: Soạn thảo bản nháp có cấu trúc (Structured Drafting)
Soạn thảo tài liệu theo đúng khuôn mẫu chuẩn (xem Mục 4 bên dưới). Nội dung phải súc tích, dựa trên sự thật (Evidence-First), loại bỏ các đoạn văn rườm rà.

### Bước 5: Phê duyệt của người dùng & Đồng bộ chỉ mục (Human Gating & Sync)
1. Tạo kế hoạch hoặc artifact trình bày bản nháp cho người dùng kèm câu hỏi: *"Bạn có đồng ý tích hợp tri thức/skill này vào repository không?"*.
2. Khi người dùng đồng ý:
   - Ghi file vào vị trí tương ứng (`.agents/skills/` hoặc `docs/playbooks/`).
   - Nếu là Tier 2 Skill mới: **Tự động cập nhật bảng chỉ mục điều hướng trong [AGENTS.md](file:///d:/DoAn/DoAnTotNghiep/QuanLyChuoiBanThuoc/PharmaChainSecurity/AGENTS.md)** để đảm bảo Agent trong tương lai biết đường tìm kiếm.

---

## 4. Cấu trúc chuẩn của một Skill mới (Tier 2 Template)

Khi một quy trình đủ điều kiện để trở thành Skill chính thức, nó bắt buộc phải tuân theo cấu trúc chuẩn mực sau:

```markdown
---
name: [ten-skill-kebab-case]
description: >
  [Tóm tắt súc tích trong 2-3 câu: Khi nào nạp skill này? Giải quyết vấn đề gì?]
---

# SKILL XX — [TÊN SKILL VIẾT HOA]

## 1. Objective & Scope
- **Objective:** Mục tiêu nghiệp vụ / kỹ thuật.
- **In Scope:** Những gì thuộc phạm vi giải quyết.
- **Out of Scope:** Những gì không thuộc thẩm quyền.

## 2. Governing Rules & Invariants
- Liệt kê các Rules bắt buộc phải tuân thủ (ví dụ: Rule 00, 03, 06).
- Các điều kiện bất biến không được phép vi phạm.

## 3. Step-by-Step Workflow
- Quy trình từng bước chuẩn mực (Step 1 -> Step N).
- Kèm ví dụ mã nguồn thực tế (nếu có).

## 4. Common Pitfalls & Anti-Patterns
- Những sai lầm phổ biến đã được kiểm chứng từ thực tế.
- Các giải pháp tạm thời cần tránh.

## 5. Verification Checklist
- Danh sách câu hỏi kiểm chứng nghiệm thu (Acceptance Criteria).
```

---

## 5. Cấu trúc chuẩn của một Playbook / Knowledge Item (Tier 1 Template)

Đối với các mẹo xử lý lỗi kỹ thuật cụ thể, sử dụng mẫu tài liệu tinh gọn:

```markdown
# Playbook: [Tên lỗi / Tình huống kỹ thuật]

- **Tags:** [Oracle, VPD, EF Core, Authentication, Flutter...]
- **Triệu chứng:** [Mô tả ngắn kèm mã lỗi chính xác]
- **Nguyên nhân cốt lõi:** [Giải thích ngắn gọn tại sao bị lỗi]
- **Cách xử lý chuẩn (Verified Fix):**
  ```[language]
  // Code hoặc câu lệnh chuẩn để xử lý
  ```
- **Lưu ý an ninh / Bẫy cần tránh:** [Cảnh báo ngắn]
```

---

## 6. Danh sách kiểm tra nghiệm thu Skill 14 (Self-Verification Checklist)

Trước khi đề xuất lưu một tri thức mới, Agent phải tự trả lời các câu hỏi:

- [ ] Bài học này đã được chứng minh giải quyết thành công sự cố thực tế chưa (có test / build pass)?
- [ ] Giải pháp có vi phạm bất kỳ nguyên tắc an ninh nào trong Rules 00 đến 10 không?
- [ ] Đã kiểm tra tính trùng lặp với Skills 01 đến 13 chưa?
- [ ] Có thể bổ sung vào Skill cũ thay vì tạo Skill mới không?
- [ ] Tài liệu đã được viết súc tích, theo đúng khuôn mẫu chuẩn chưa?
- [ ] Đã yêu cầu người dùng xác nhận phê duyệt chưa?
- [ ] Nếu là Skill mới, đã lên kế hoạch cập nhật `AGENTS.md` chưa?
