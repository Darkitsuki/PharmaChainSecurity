-- =============================================================================
-- CẬP NHẬT MẬT KHẨU CHUẨN AN TOÀN CHO TOÀN BỘ TÀI KHOẢN PHARMACHAINSECURITY
-- Thuật toán băm: BCrypt WorkFactor 12 (BouncyCastle)
-- Tiêu chuẩn: Chữ hoa, chữ thường, số, ký tự đặc biệt (@), độ dài 13 - 16 ký tự
-- =============================================================================

-- 1. Tài khoản Chủ chuỗi / Quản trị (OWNER)
-- Mật khẩu mới: Pharma@Owner2026
UPDATE USERS 
SET PasswordHash = '$2y$12$D68GZTPS2XOiDIA1YiGPj.8EGxdMZtWTHdvcRdzujNWSsIyvRFJPK'
WHERE Username = 'chunhathuoc';

-- 2. Tài khoản Thủ kho Chi nhánh 1 (WAREHOUSE)
-- Mật khẩu mới: Pharma@KhoCN1
UPDATE USERS 
SET PasswordHash = '$2y$12$Xvx2QDubG180h2CIaSe.w.4XaN4rDHW1nScGb902OtXQaUI8z.Qv6'
WHERE Username = 'nvkho_cn1';

-- 3. Tài khoản Bán hàng / Thu ngân Chi nhánh 1 (SALES)
-- Mật khẩu mới: Pharma@SaleCN1
UPDATE USERS 
SET PasswordHash = '$2y$12$cGRc5thC7XnqKkHwa7G5quaqdvzhz3srF1llg4e3R3m.ENTe2xT56'
WHERE Username = 'nvbanhang_cn1';

-- 4. Tài khoản Bán hàng Chi nhánh 1 Ca 2 (SALES)
-- Mật khẩu mới: Pharma@Sale1Ca2
UPDATE USERS 
SET PasswordHash = '$2y$12$sn88s7RvJj6.q7iTf8gec.j0hcu4JkgymfOD77Y45BJSSiuSR/jZG'
WHERE Username = 'nvbanhang_cn1_ca2';

-- 5. Tài khoản Thủ kho Chi nhánh 2 (WAREHOUSE)
-- Mật khẩu mới: Pharma@KhoCN2
UPDATE USERS 
SET PasswordHash = '$2y$12$BUDDOM3jeL4OBUYTTLNudeGkBf/MlyB9JsofNlS/9Y5k/m2JsmG7i'
WHERE Username = 'nvkho_cn2';

-- 6. Tài khoản Bán hàng / Thu ngân Chi nhánh 2 (SALES)
-- Mật khẩu mới: Pharma@SaleCN2
UPDATE USERS 
SET PasswordHash = '$2y$12$qbEZax9xZMOTkh9chm3.bOjeccm/5QLGK2LxBzOQhIYh8KQ4KzXXC'
WHERE Username = 'nvbanhang_cn2';

-- 7. Tài khoản Thủ kho Chi nhánh 3 (WAREHOUSE)
-- Mật khẩu mới: Pharma@KhoCN3
UPDATE USERS 
SET PasswordHash = '$2y$12$uUt.xBNu05qOBVmdT/33neLc9.C4sZzdtspU3e4iFYGsYBj/cmtUq'
WHERE Username = 'nvkho_cn3';

-- 8. Tài khoản Bán hàng / Thu ngân Chi nhánh 3 (SALES)
-- Mật khẩu mới: Pharma@SaleCN3
UPDATE USERS 
SET PasswordHash = '$2y$12$56rfEr0EqEsihp4RuonXhuOni3b3ISR.lP/a4vzoD52YH.yLkT086'
WHERE Username = 'nvbanhang_cn3';

COMMIT;

-- =============================================================================
-- KIỂM TRA LẠI DỮ LIỆU SAU KHI CẬP NHẬT
-- =============================================================================
SELECT Username, FullName, RoleId, BranchId, SUBSTR(PasswordHash, 1, 10) || '...' AS HashPrefix, IsActive 
FROM USERS 
ORDER BY Username;
