---
trigger: always_on
---

# GOVERNANCE RULE: TESTING & QUALITY ASSURANCE

## 1. Nguyên tắc cốt lõi (Core Testing Principles)
- **AAA Pattern**: Tất cả các test case BẮT BUỘC tuân theo cấu trúc 3 phần: `Arrange` (Chuẩn bị) -> `Act` (Thực thi) -> `Assert` (Xác minh).
- **Tính độc lập (Isolation)**: Các test case không được phụ thuộc vào thứ tự chạy hoặc trạng thái còn lại của test case khác.
- **Tính lặp lại (Deterministic)**: Test phải cho ra cùng một kết quả ở bất kỳ môi trường nào (Local, CI/CD). Không sử dụng ngẫu nhiên `DateTime.Now` hay `Random` trực tiếp mà phải mock/stub.
- **Không đụng CSDL thật trong Unit Test**: Unit test tuyệt đối không kết nối DB thực, Network hay API bên ngoài. Sử dụng Mock / InMemory / Testcontainers khi cần thiết.

## 2. Quy chuẩn đặt tên Test Case
Đặt tên method test phải thể hiện rõ 3 thành phần: `[TênMethod]_[KịchBản/ĐiềuKiện]_[KếtQuảKỳVọng]`

*Ví dụ:*
- `.NET`: `CalculateDiscount_WhenCustomerIsVIP_ReturnsTenPercent()`
- `React`: `should render error message when login fails`
- `Flutter`: `should update pharmacy inventory after successful sync`

## 3. Phân cấp Kiểm thử (Test Pyramid)
1. **Unit Tests (Chủ đạo - 70%)**: Kiểm thử các hàm xử lý logic nghiệp vụ, Domain Models, Service Isolations.
2. **Integration Tests (20%)**: Kiểm thử tương tác giữa API với Database (sử dụng Testcontainers / SQLite InMemory) hoặc giữa các Component UI với State Management.
3. **E2E / UI Tests (10%)**: Kiểm thử luồng nghiệp vụ quan trọng trên giao diện thực tế.

## 4. Tiêu chuẩn Coverage
- Core Domain / Business Logic (.NET Core, Service Layer): **> 85%**
- Frontend Custom Hooks / State Managers (React, Flutter): **> 80%**
- UI Components / Pages: Tập trung test tương tác người dùng, không gượng ép test render tĩnh.