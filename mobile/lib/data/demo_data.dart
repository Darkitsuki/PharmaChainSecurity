import 'package:flutter/material.dart';

enum AppSection {
  overview('Tổng quan', Icons.dashboard_outlined),
  catalog('Danh mục thuốc', Icons.medication_outlined),
  inventory('Tồn kho chi nhánh', Icons.inventory_2_outlined),
  receipts('Nhập kho thuốc', Icons.add_box_outlined),
  checkout('Bán hàng tại quầy', Icons.shopping_cart_outlined),
  invoices('Hóa đơn bán hàng', Icons.receipt_long_outlined),
  returns('Đổi trả & Hoàn tiền', Icons.assignment_return_outlined),
  customers('Khách hàng & Tích điểm', Icons.people_outline),
  suppliers('Nhà cung cấp', Icons.local_shipping_outlined),
  audits('Kiểm kê kho', Icons.fact_check_outlined),
  transfers('Điều chuyển kho', Icons.swap_horiz),
  branches('Mạng lưới chi nhánh', Icons.store_outlined),
  users('Quản lý nhân viên', Icons.badge_outlined),
  reports('Báo cáo doanh thu', Icons.bar_chart_rounded);

  const AppSection(this.title, this.icon);
  final String title;
  final IconData icon;
}

// Presentation fixtures only. Never sent to a server.
class DemoMedicine {
  const DemoMedicine(this.code, this.name, this.ingredient, this.unit,
      this.price, this.stock, this.batch, this.expiry,
      {this.active = true, this.expiring = false});
  final String code, name, ingredient, unit, batch, expiry;
  final int price, stock;
  final bool active, expiring;
}

const demoMedicines = [
  DemoMedicine('THUOC001', 'Paracetamol 500mg', 'Paracetamol', 'Hộp', 35000,
      150, 'BATCH-202601-01', '10/01/2028'),
  DemoMedicine('THUOC002', 'Panadol Extra', 'Paracetamol, Caffeine', 'Hộp',
      45000, 8, 'BATCH-202602-15', '15/08/2027'),
  DemoMedicine('THUOC003', 'Augmentin 625mg', 'Amoxicillin, Clavulanic acid',
      'Hộp', 180000, 40, 'BATCH-202603-01', '15/12/2026',
      expiring: true),
  DemoMedicine('THUOC004', 'Siro Ho Prospan 100ml', 'Thường xuân khô', 'Chai',
      85000, 60, 'BATCH-202603-10', '10/03/2027'),
  DemoMedicine('DEMO-NGUNG', 'Thuốc minh họa tạm ngưng', 'Dữ liệu minh họa',
      'Hộp', 20000, 0, 'Không có lô', '—',
      active: false),
];

class DemoRecord {
  const DemoRecord(
      this.code, this.title, this.subtitle, this.status, this.details);
  final String code, title, subtitle, status;
  final List<String> details;
}

const demoRecords = <AppSection, List<DemoRecord>>{
  AppSection.receipts: [
    DemoRecord(
        'PN20261022-001',
        'Công ty Dược Hậu Giang',
        '22/10/2026 · Thủ kho Minh',
        'Hoàn tất',
        ['4 mặt hàng', 'Tổng tiền: 8.450.000 ₫', 'Chi nhánh Quận 1']),
    DemoRecord(
        'PN20261020-002',
        'Công ty Traphaco',
        '20/10/2026 · Thủ kho Minh',
        'Hoàn tất',
        ['2 mặt hàng', 'Tổng tiền: 3.200.000 ₫', 'Chi nhánh Quận 1']),
  ],
  AppSection.invoices: [
    DemoRecord(
        'HD20261022-001',
        'Nguyễn Thị Mai',
        '22/10/2026 · 09:35',
        'Hoàn tất',
        ['Thu ngân: Dược sĩ Lan', '3 sản phẩm', 'Tổng tiền: 115.000 ₫']),
    DemoRecord('HD20261022-002', 'Khách lẻ', '22/10/2026 · 10:15', 'Hoàn tất',
        ['Thu ngân: Dược sĩ Lan', '1 sản phẩm', 'Tổng tiền: 85.000 ₫']),
  ],
  AppSection.returns: [
    DemoRecord(
        'TH20261022-001',
        'Nguyễn Thị Mai',
        'Hóa đơn HD20261022-001',
        'Hoàn tất',
        ['Hoàn tiền: 35.000 ₫', 'Lý do: Đổi sản phẩm', '1 hộp Paracetamol']),
  ],
  AppSection.customers: [
    DemoRecord('KH001', 'Nguyễn Thị Mai', '0901 234 567 · Quận 1', 'Hoạt động',
        ['Điểm tích lũy: 125', 'Tổng chi tiêu: 1.250.000 ₫']),
    DemoRecord('KH002', 'Trần Văn An', '0902 345 678 · Tân Phú', 'Hoạt động',
        ['Điểm tích lũy: 80', 'Tổng chi tiêu: 800.000 ₫']),
  ],
  AppSection.suppliers: [
    DemoRecord('NCC001', 'Công ty Dược Hậu Giang', 'Dược phẩm · Cần Thơ',
        'Hoạt động', ['Liên hệ: Nguyễn Minh', 'Điện thoại: 0292 389 1433']),
    DemoRecord('NCC002', 'Công ty Traphaco', 'Dược phẩm · Hà Nội', 'Hoạt động',
        ['Liên hệ: Trần Anh', 'Điện thoại: 024 3681 5847']),
  ],
  AppSection.audits: [
    DemoRecord(
        'KK20261022-001',
        'Kiểm kê định kỳ tháng 10',
        'Người lập: Thủ kho Minh',
        'Đang kiểm kê',
        ['12 mặt hàng', '2 chênh lệch', 'Giá trị chênh lệch: 70.000 ₫']),
    DemoRecord('KK20261001-001', 'Kiểm kê đầu tháng', 'Người lập: Thủ kho Minh',
        'Đã cân bằng', ['10 mặt hàng', 'Không có chênh lệch']),
  ],
  AppSection.transfers: [
    DemoRecord(
        'CK20261022-001',
        'Quận 1 → Tân Phú',
        '22/10/2026 · Phiếu chuyển đi',
        'Đang chuyển',
        ['3 mặt hàng · 50 đơn vị', 'Người lập: Thủ kho Minh']),
    DemoRecord(
        'CK20261020-002',
        'Tân Phú → Quận 1',
        '20/10/2026 · Phiếu chuyển đến',
        'Đã nhận',
        ['2 mặt hàng · 20 đơn vị', 'Người nhận: Thủ kho Minh']),
  ],
  AppSection.branches: [
    DemoRecord(
        'CN01',
        'Nhà thuốc · Chi nhánh Quận 1',
        '123 Nguyễn Huệ, TP.HCM',
        'Hoạt động',
        ['Chi nhánh đang xem trong bản mẫu', '4 nhân viên minh họa']),
    DemoRecord('CN02', 'Nhà thuốc · Chi nhánh Tân Phú',
        '140 Lê Trọng Tấn, TP.HCM', 'Hoạt động', ['2 nhân viên minh họa']),
  ],
  AppSection.users: [
    DemoRecord(
        'NV001',
        'Nguyễn Hoàng',
        'Chủ nhà thuốc · Chi nhánh Quận 1',
        'Hoạt động',
        ['Vai trò: OWNER', 'Tài khoản minh họa, không đăng nhập được']),
    DemoRecord(
        'NV002',
        'Dược sĩ Lan',
        'Nhân viên bán hàng · Chi nhánh Quận 1',
        'Hoạt động',
        ['Vai trò: SALES', 'Tài khoản minh họa, không đăng nhập được']),
    DemoRecord(
        'NV003',
        'Thủ kho Minh',
        'Nhân viên kho · Chi nhánh Quận 1',
        'Hoạt động',
        ['Vai trò: WAREHOUSE', 'Tài khoản minh họa, không đăng nhập được']),
  ],
};

String money(int value) =>
    '${value.toString().replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.')} ₫';
