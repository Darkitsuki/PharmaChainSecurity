import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../data/demo_data.dart';
import '../widgets/ui_components.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen(
      {super.key, required this.onNavigate, this.report = false});
  final ValueChanged<AppSection> onNavigate;
  final bool report;
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int days = 7;
  @override
  Widget build(BuildContext context) =>
      ListView(padding: const EdgeInsets.all(20), children: [
        PageHeading(
            widget.report ? 'Báo cáo doanh thu' : 'Tổng quan minh họa',
            widget.report
                ? 'Theo dõi doanh thu và mặt hàng bán chạy'
                : 'Tổng quan hoạt động · Chi nhánh Quận 1'),
        const Panel(
            child: Row(children: [
          Icon(Icons.store_outlined, color: AppColors.forest),
          SizedBox(width: 12),
          Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                Text('Chi nhánh Quận 1',
                    style: TextStyle(fontWeight: FontWeight.w800)),
                SizedBox(height: 4),
                Text('CN01 · TP. Hồ Chí Minh',
                    style: TextStyle(fontSize: 12, color: AppColors.muted))
              ])),
          StatusBadge('Mẫu')
        ])),
        const SizedBox(height: 18),
        if (widget.report) ...[
          Wrap(
              spacing: 8,
              children: [7, 30, 90]
                  .map((d) => ChoiceChip(
                      label: Text('$d ngày'),
                      selected: days == d,
                      onSelected: (_) => setState(() => days = d)))
                  .toList()),
          const SizedBox(height: 8),
          const Text(
              'Bộ lọc giao diện; biểu đồ bên dưới là dữ liệu minh họa cố định.',
              style: TextStyle(fontSize: 11, color: AppColors.muted)),
          const SizedBox(height: 16),
        ],
        const StatsGrid(children: [
          StatCard('Doanh thu mẫu', '12,8 triệu', Icons.payments_outlined,
              caption: '7 ngày minh họa'),
          StatCard('Hóa đơn', '48', Icons.receipt_long_outlined),
          StatCard('Lô cận hạn', '1', Icons.event_outlined),
          StatCard('Mặt hàng tồn thấp', '1', Icons.inventory_2_outlined),
        ]),
        const SizedBox(height: 24),
        Panel(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Xu hướng doanh thu',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
          const SizedBox(height: 6),
          const Text('7 ngày · Đơn vị: triệu đồng · Dữ liệu mẫu',
              style: TextStyle(fontSize: 11, color: AppColors.muted)),
          const SizedBox(height: 24),
          SizedBox(
              height: 155,
              child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: List.generate(7, (i) {
                    const heights = [
                      55.0,
                      83.0,
                      65.0,
                      112.0,
                      93.0,
                      123.0,
                      102.0
                    ];
                    return Expanded(
                        child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 5),
                            child: Column(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  Flexible(
                                      child: Container(
                                          height: heights[i],
                                          decoration: BoxDecoration(
                                              color: i == 5
                                                  ? AppColors.coral
                                                  : AppColors.forest,
                                              borderRadius: const BorderRadius
                                                  .vertical(
                                                  top: Radius.circular(6))))),
                                  const SizedBox(height: 10),
                                  Text(i == 6 ? 'CN' : 'T${i + 2}',
                                      style: const TextStyle(
                                          fontSize: 10, color: AppColors.muted))
                                ])));
                  }))),
        ])),
        const SizedBox(height: 24),
        if (!widget.report) ...[
          const Text('Truy cập nhanh',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                AppSection.checkout,
                AppSection.catalog,
                AppSection.inventory,
                AppSection.receipts
              ]
                  .map((s) => ActionChip(
                      avatar: Icon(s.icon, size: 18, color: AppColors.forest),
                      label: Text(s.title),
                      onPressed: () => widget.onNavigate(s)))
                  .toList()),
          const SizedBox(height: 24),
        ],
        Panel(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Thuốc bán chạy',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
          const SizedBox(height: 10),
          for (final m in demoMedicines.take(3))
            ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.medication_outlined,
                    color: AppColors.forest),
                title: Text(m.name,
                    style: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w700)),
                subtitle: Text('${money(m.price)} / ${m.unit}',
                    style: const TextStyle(fontSize: 12)),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => widget.onNavigate(AppSection.catalog)),
        ])),
        const SizedBox(height: 18),
        Panel(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Hóa đơn gần đây',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
          const SizedBox(height: 8),
          for (final r in demoRecords[AppSection.invoices]!)
            ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(r.code,
                    style: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w700)),
                subtitle: Text(r.title),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => widget.onNavigate(AppSection.invoices)),
        ])),
        const SizedBox(height: 18),
        const Panel(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Duyệt chi & Quỹ tiền mặt',
              style: TextStyle(fontWeight: FontWeight.w800)),
          SizedBox(height: 8),
          Text(
              'Chưa kết nối dữ liệu khoản chi. Không thực hiện duyệt hoặc ký số trong bản UI mẫu.',
              style: TextStyle(color: AppColors.muted, height: 1.5)),
          SizedBox(height: 12),
          OutlinedButton(
              onPressed: null, child: Text('Duyệt chi · Chưa kết nối')),
        ])),
        if (widget.report) ...[
          const SizedBox(height: 20),
          OutlinedButton.icon(
              onPressed: null,
              icon: const Icon(Icons.download_outlined),
              label: const Text('Xuất báo cáo · Chưa kết nối'))
        ],
      ]);
}
