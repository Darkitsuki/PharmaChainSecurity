# PharmaSecure UI/UX Standards

Tài liệu này ghi nhận ngôn ngữ giao diện đang được dùng trong Web PharmaSecure. POS là mẫu tham chiếu cho component và trải nghiệm chung; bố cục của từng trang vẫn phải phù hợp nghiệp vụ.

## Nguồn tham chiếu trong mã nguồn

- Khung ứng dụng, sidebar, header và menu tài khoản: `frontend/src/components/AppShell.tsx`.
- Modal dùng chung: `frontend/src/components/common/Modal.tsx`.
- Luồng POS, danh sách dữ liệu, form, trạng thái và hành động: `frontend/src/pages/CheckoutPage.tsx`.
- Branding đăng nhập: `frontend/src/components/auth/AuthHeader.tsx`.
- Focus và chuyển động toàn cục: `frontend/src/index.css` và cấu hình Tailwind hiện có.

Ưu tiên tái sử dụng các component và token hiện có (`ink`, `forest`, `mint`, `coral`, `canvas`, `line`, `shadow-panel`). Không thêm thư viện UI chỉ để tạo biến thể đã có thể thực hiện bằng component/CSS hiện tại.

## Quy tắc bắt buộc

### Layout và typography

- Trang nghiệp vụ chạy trong `AppShell`; dùng page container hiện có và không tạo sidebar/header riêng.
- Tiêu đề trang dùng `font-display`, đậm và rõ thứ bậc. Tiêu đề section nhỏ hơn; label và metadata dùng cỡ chữ phụ nhất quán.
- Dùng khoảng cách theo nhịp hiện có: page `px-4 sm:px-6 lg:px-9`, section khoảng `gap-6/7`, card thường `p-4/5/6` tùy mật độ.
- Số lượng, mã và tiền tệ cần căn dễ quét; tiền tệ dùng formatter thống nhất, không nối chuỗi thủ công.

### Điều hướng và hành động

- Sidebar phải giữ menu theo quyền hiện có, có trạng thái active, nhãn hoặc accessible name khi thu gọn, và điều hướng mobile riêng.
- Primary action thể hiện hành động chính; secondary/cancel nhẹ hơn; destructive action dùng màu cảnh báo và bước xác nhận phù hợp.
- Mọi nút gửi dữ liệu phải có trạng thái loading/disabled để tránh gửi lặp. Chỉ báo success sau khi API xác nhận.
- Hover, focus và active phải nhìn thấy; phần tử chỉ để hiển thị không được tạo cảm giác có thể nhấn.

### Modal, form và accessibility

- Dùng `Modal` chung: render bằng portal, căn giữa viewport, giới hạn chiều cao, body cuộn độc lập, đóng bằng Escape, trap/restore focus và khóa cuộn nền.
- Header/body/footer dùng padding do `Modal` cung cấp; tránh bọc thêm lớp padding trùng lặp.
- Input/select/search cần label, focus rõ, validation gần trường nhập và thông báo lỗi có ý nghĩa.
- Trạng thái không chỉ thể hiện bằng màu; bổ sung text, icon hoặc nhãn. Giữ tương phản và điều hướng bàn phím.
- Chuyển động ngắn và phục vụ nhận biết trạng thái; tuân thủ `prefers-reduced-motion` trong CSS toàn cục.

### Hiển thị dữ liệu và phản hồi

- Bảng dùng cho dữ liệu cần đối chiếu nhiều cột; card/list dùng khi màn hình hẹp hoặc nội dung thiên về thao tác.
- Phân biệt rõ loading, empty, error, forbidden, not found và unavailable. Không biến lỗi API thành số `0`, “hết hàng” hoặc trạng thái thành công.
- Badge trạng thái phải lấy từ contract nghiệp vụ và có nhãn dễ hiểu. Không lặp mã kỹ thuật khi không giúp người dùng ra quyết định.
- Sau mutation thành công, đồng bộ state hoặc refetch dữ liệu liên quan; tránh hiển thị dữ liệu đã lỗi thời.

## Quy tắc linh hoạt theo nghiệp vụ

Dashboard có thể dùng KPI/biểu đồ; kho và audit log có thể dùng bảng/bộ lọc; nhập hàng có thể dùng quy trình nhiều bước; đổi trả có thể ưu tiên hóa đơn gốc; báo cáo có thể dùng bộ lọc thời gian. Các trang này không phải sao chép bố cục hai cột của POS, nhưng phải dùng cùng typography, spacing, component, feedback và accessibility.

Responsive phải được thiết kế theo nội dung: desktop/laptop có thể giữ nhiều cột; tablet/mobile chuyển bảng rộng thành list/card hoặc cho phép cuộn có chủ đích. Không để action quan trọng bị che hoặc tạo layout shift bất thường.

## Dữ liệu động và bảo mật

- Dữ liệu nghiệp vụ đi theo luồng Frontend → API → nguồn dữ liệu đáng tin cậy. Backend quyết định quyền, phạm vi chi nhánh và phép tính nghiệp vụ; frontend hiển thị và quản lý trạng thái tải.
- Không hardcode KPI, tồn kho, giá thực tế, doanh thu, số đơn/hóa đơn, thông báo, branch/user hiện tại, kết quả thanh toán hoặc trạng thái dịch vụ.
- Được hardcode nhãn UI, navigation cố định, enum theo API contract, theme token, placeholder và fixture tách biệt trong test.
- Mock chỉ dùng trong môi trường mock/test được nhận diện rõ; không âm thầm thay API lỗi bằng mock trong production.
- Không nhận `BranchId`, role hoặc trạng thái nhạy cảm từ lựa chọn tùy ý của client. Giữ JWT, RBAC, branch isolation và chính sách dữ liệu hiện hành.
- Realtime chỉ dùng khi có yêu cầu và hạ tầng phù hợp. Ưu tiên refetch/cache invalidation; không polling liên tục để tạo cảm giác dữ liệu “sống”.

## Checklist cho thay đổi UI mới

- [ ] Tái sử dụng `AppShell`, `Modal` và token/component hiện có khi phù hợp.
- [ ] Có loading, empty, error, disabled và success đúng thời điểm.
- [ ] Không có dữ liệu nghiệp vụ giả hoặc fallback gây hiểu nhầm.
- [ ] Mutation chống gửi lặp và đồng bộ lại dữ liệu sau thành công.
- [ ] API/RBAC/branch scope không bị thay đổi hoặc suy diễn ở frontend.
- [ ] Bàn phím, focus, accessible name và responsive đã được kiểm tra.
- [ ] Build/test liên quan đạt; kiểm tra trực quan không được thay thế bằng tuyên bố E2E chưa thực hiện.
