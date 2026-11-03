# Cấu hình Gmail OTP cục bộ

## File cấu hình

- File mẫu: `backend/PharmaSecure.WebApi/appsettings.Email.local.json.example`
- File local cần tạo: `backend/PharmaSecure.WebApi/appsettings.Email.local.json`

Từ thư mục gốc repository, sao chép file mẫu nếu file local chưa tồn tại:

```powershell
$example = "backend\PharmaSecure.WebApi\appsettings.Email.local.json.example"
$local = "backend\PharmaSecure.WebApi\appsettings.Email.local.json"
if (-not (Test-Path -LiteralPath $local)) {
    Copy-Item -LiteralPath $example -Destination $local
} else {
    Write-Host "File local đã tồn tại; giữ nguyên để tránh ghi đè cấu hình."
}
```

File local đã được `.gitignore` loại trừ; không xóa quy tắc ignore hoặc đưa file này lên Git.

## Điền thông tin Gmail

Trong `Email:Smtp`:

1. Đặt `Enabled` thành `true`.
2. Thay `Sender` và `Username` bằng địa chỉ Gmail dùng để gửi OTP (thường là cùng một địa chỉ).
3. Tạo Google App Password cho tài khoản đó và điền vào `AppPassword`. Chỉ lưu trong file local đã bị Git bỏ qua; không gửi secret qua chat, commit hoặc log.

Email nhận OTP không nằm trong file cấu hình. Backend tự lấy địa chỉ từ `USERS.Email` của OWNER đang đăng nhập. Người nhận có thể dùng Gmail, Outlook, Yahoo hoặc email tên miền riêng.

Các giá trị trong file mẫu/local là placeholder không hợp lệ nên không thể bật gửi OTP cho tới khi được thay bằng cấu hình hợp lệ. Không cần thêm `Host`, `Port` hoặc `SenderName`: adapter hiện tại cố định `smtp.gmail.com:587`, sử dụng STARTTLS và kiểm tra chứng thư TLS mặc định. Tên khóa mật khẩu đúng là `AppPassword`.

Lưu file. Cấu hình được đọc khi khởi động, vì vậy hãy khởi động lại Backend sau khi sửa. Trong môi trường Development, Backend đọc file từ ContentRoot của WebApi. Nếu file thiếu hoặc cấu hình không hợp lệ, OTP tiếp tục bị khóa; không có OTP giả hay đường bỏ qua xác thực.

## Khởi động Backend an toàn

Không khởi động Backend nếu chưa xác nhận `ConnectionStrings:DefaultConnection` trỏ tới database local/test được phép sử dụng. Cấu hình hiện tại có thể bật auto-migration theo mặc định; trước khi chạy phải bảo đảm `Database:AutoMigrate=false` bằng cấu hình có độ ưu tiên cao hơn (ví dụ biến môi trường `Database__AutoMigrate=false`). Không dùng Host DB cho thử nghiệm này và không chạy migration/seed.

Sau khi xác nhận kết nối database là local/test được phép, từ thư mục gốc repository chạy:

```powershell
$env:Database__AutoMigrate = "false"
Push-Location backend\PharmaSecure.WebApi
try {
    dotnet run
} finally {
    Pop-Location
}
```

Sau khi đăng nhập bằng tài khoản OWNER, mở Bảo mật/Nhật ký, nhập lại mật khẩu để yêu cầu OTP. Kiểm tra hộp thư thuộc email OWNER được lưu trong Oracle. SMTP Gmail chỉ là tài khoản gửi. Không gửi email thử nghiệm thật hoặc ghi dữ liệu lên Host khi chưa được cho phép.

## Xử lý lỗi thường gặp

- **OTP chưa được cấu hình / không khả dụng:** Kiểm tra `Enabled`, `Sender`, `Username` và `AppPassword`; không để placeholder.
- **Không tìm thấy email tài khoản:** Kiểm tra `USERS.Email` của OWNER bằng quy trình quản trị tài khoản hiện có. Không nhập email người nhận vào cấu hình SMTP.
- **Gmail xác thực thất bại:** Dùng Google App Password, không dùng mật khẩu đăng nhập Gmail; kiểm tra tài khoản đã bật xác minh 2 bước và nhập App Password đúng. Không tắt TLS.
- **Gửi email timeout/không kết nối được:** Kiểm tra mạng có cho phép kết nối SMTP tới `smtp.gmail.com:587` và thử lại sau. Backend không log địa chỉ nhận, OTP hay mật khẩu.
- Không chia sẻ nội dung App Password hoặc file local khi yêu cầu hỗ trợ.

## Cấu hình Server/Production

File `appsettings.Email.local.json` chỉ được tự nạp trong Development. Production phải cấp cấu hình qua secret manager hoặc biến môi trường an toàn, không dùng file local plaintext. Các biến môi trường tương ứng dùng dấu gạch dưới kép, ví dụ:

- `Email__Smtp__Enabled`
- `Email__Smtp__Sender`
- `Email__Smtp__Username`
- `Email__Smtp__AppPassword`

User Secrets và biến môi trường vẫn có độ ưu tiên cao hơn file local trong Development. Không đưa secret thật vào `appsettings.json`, `appsettings.Development.json` hoặc bất kỳ file nào được theo dõi bởi Git.
