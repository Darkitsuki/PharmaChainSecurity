-- =============================================================================
-- Migration V20261030_01: Seed Customers & Update Valid RSA Digital Signature
-- =============================================================================

ALTER SESSION SET CURRENT_SCHEMA = PHARMA_ADMIN;

-- 1. BẢNG KHÁCH HÀNG THÂN THIẾT (CUSTOMERS)
MERGE INTO CUSTOMERS c
USING (
    SELECT 'cus-00000000-0000-0000-0000-000000000001' AS id, 'KH001' AS CustomerCode, 'Nguyễn Thị Mai' AS FullName, '0901234567' AS PhoneNumber, 'mai.nguyen@gmail.com' AS Email, '123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM' AS Address, 'br-00000000-0000-0000-0000-000000000001' AS BranchId, 1650000.00 AS TotalSpent, 165 AS Points, TO_TIMESTAMP('2026-02-01 10:00:00', 'YYYY-MM-DD HH24:MI:SS') AS CreatedDate, 1 AS IsActive FROM DUAL UNION ALL
    SELECT 'cus-00000000-0000-0000-0000-000000000002', 'KH002', 'Trần Văn Hùng', '0912345678', 'hung.tran@gmail.com', '456 Hai Bà Trưng, Phường Tân Định, Quận 1, TP.HCM', 'br-00000000-0000-0000-0000-000000000001', 920000.00, 92, TO_TIMESTAMP('2026-02-15 14:30:00', 'YYYY-MM-DD HH24:MI:SS'), 1 FROM DUAL UNION ALL
    SELECT 'cus-00000000-0000-0000-0000-000000000003', 'KH003', 'Lê Minh Tuấn', '0987654321', 'tuan.le@gmail.com', '789 Nguyễn Huệ, Phường Ninh Kiều, Cần Thơ', 'br-00000000-0000-0000-0000-000000000003', 2450000.00, 245, TO_TIMESTAMP('2026-03-01 09:15:00', 'YYYY-MM-DD HH24:MI:SS'), 1 FROM DUAL UNION ALL
    SELECT 'cus-00000000-0000-0000-0000-000000000004', 'KH004', 'Phạm Thu Hà', '0933112233', 'ha.pham@yahoo.com', '12 Âu Cơ, Phường Tân Thành, Quận Tân Phú, TP.HCM', 'br-00000000-0000-0000-0000-000000000002', 540000.00, 54, TO_TIMESTAMP('2026-03-20 11:20:00', 'YYYY-MM-DD HH24:MI:SS'), 1 FROM DUAL UNION ALL
    SELECT 'cus-00000000-0000-0000-0000-000000000005', 'KH005', 'Võ Quốc Bảo', '0944556677', 'bao.vo@outlook.com', '88 CMT8, Phường Bến Thành, Quận 1, TP.HCM', 'br-00000000-0000-0000-0000-000000000001', 3100000.00, 310, TO_TIMESTAMP('2026-04-10 16:45:00', 'YYYY-MM-DD HH24:MI:SS'), 1 FROM DUAL UNION ALL
    SELECT 'cus-00000000-0000-0000-0000-000000000006', 'KH006', 'Đặng Mỹ Linh', '0966778899', 'linh.dang@gmail.com', '205 Lũy Bán Bích, Phường Hiệp Tân, Quận Tân Phú, TP.HCM', 'br-00000000-0000-0000-0000-000000000002', 780000.00, 78, TO_TIMESTAMP('2026-04-25 10:10:00', 'YYYY-MM-DD HH24:MI:SS'), 1 FROM DUAL UNION ALL
    SELECT 'cus-00000000-0000-0000-0000-000000000007', 'KH007', 'Bùi Hoàng Nam', '0977889900', 'nam.bui@gmail.com', '54 Trần Hưng Đạo, Phường An Nghiệp, Ninh Kiều, Cần Thơ', 'br-00000000-0000-0000-0000-000000000003', 1250000.00, 125, TO_TIMESTAMP('2026-05-05 08:40:00', 'YYYY-MM-DD HH24:MI:SS'), 1 FROM DUAL UNION ALL
    SELECT 'cus-00000000-0000-0000-0000-000000000008', 'KH008', 'Trương Cẩm Tú', '0908889911', 'tu.truong@gmail.com', '72 Nguyễn Thị Minh Khai, Phường Đa Kao, Quận 1, TP.HCM', 'br-00000000-0000-0000-0000-000000000001', 460000.00, 46, TO_TIMESTAMP('2026-05-18 15:55:00', 'YYYY-MM-DD HH24:MI:SS'), 1 FROM DUAL UNION ALL
    SELECT 'cus-00000000-0000-0000-0000-000000000009', 'KH009', 'Hoàng Đức Trọng', '0919998822', 'trong.hoang@gmail.com', '18 Thoại Ngọc Hầu, Phường Phú Thạnh, Quận Tân Phú, TP.HCM', 'br-00000000-0000-0000-0000-000000000002', 1890000.00, 189, TO_TIMESTAMP('2026-06-01 13:25:00', 'YYYY-MM-DD HH24:MI:SS'), 1 FROM DUAL UNION ALL
    SELECT 'cus-00000000-0000-0000-0000-000000000010', 'KH010', 'Lý Lan Anh', '0938887733', 'lananh.ly@gmail.com', '30 Đại lộ Hòa Bình, Phường Tân An, Ninh Kiều, Cần Thơ', 'br-00000000-0000-0000-0000-000000000003', 620000.00, 62, TO_TIMESTAMP('2026-06-15 17:15:00', 'YYYY-MM-DD HH24:MI:SS'), 1 FROM DUAL
) s ON (c.id = s.id)
WHEN NOT MATCHED THEN
    INSERT (id, CustomerCode, FullName, PhoneNumber, Email, Address, BranchId, TotalSpent, Points, CreatedDate, IsActive)
    VALUES (s.id, s.CustomerCode, s.FullName, s.PhoneNumber, s.Email, s.Address, s.BranchId, s.TotalSpent, s.Points, s.CreatedDate, s.IsActive);

-- 2. CẬP NHẬT CHỮ KÝ SỐ HỢP LỆ CHO HÓA ĐƠN MẪU HD20260815-0001
UPDATE DIGITAL_SIGNATURES
SET HashValue_SHA256 = '79e602fa1ca3ef0204f3a31c728a2a643b44b7d9bbc6d8fde19a899a0fb8fd42',
    SignatureData = 'YAJfhk2hf6hlxEv08zC5ZO05BnqtgJ24HkkeXVaOKokR8ucc4V1f/rxrs8WT3wYCDphdU9yJbt++gQPrASISXkJPpDpl/fmcg+hyzbn4lnNcys0Ekd2hOiokjR5aqycSHznwps4H1k6Lr106mF3nlPGAqVRH38P+izHh7HURiwvBnnUMn/dcdRP1OMxbFQOeZH1gLa2GZqjIAhf5WywwFSjYfVJYB3jOqh5aTcTTUB883tr8hKgCNZwIgFW7BA/kCyiGNl76+fQINYSWhwMPBbYDPTkp7lQ8M6lqUzYl6wf+xXpl7GkkaksjfCKpYHjgszzHyJlG3iJh9OZkSubYPw==',
    CertSerial = 'VN-LONGCHAU-CA-2026-0001',
    Status = 'VALID'
WHERE InvoiceId = 'iv-00000000-0000-0000-0000-000000000001';

COMMIT;

