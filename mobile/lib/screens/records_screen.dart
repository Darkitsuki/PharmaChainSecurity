import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../data/demo_data.dart';
import '../widgets/ui_components.dart';

class RecordsScreen extends StatefulWidget {
  const RecordsScreen({super.key, required this.section});
  final AppSection section;
  @override
  State<RecordsScreen> createState() => _RecordsScreenState();
}

class _RecordsScreenState extends State<RecordsScreen> {
  String query = '';
  String status = 'Tất cả';

  List<String> get formFields => switch (widget.section) {
        AppSection.receipts => [
            'Nhà cung cấp',
            'Mã thuốc / Số lô',
            'Hạn sử dụng',
            'Số lượng',
            'Giá nhập',
            'Ghi chú'
          ],
        AppSection.returns => [
            'Hóa đơn gốc',
            'Thuốc cần hoàn trả',
            'Số lượng',
            'Lý do hoàn trả'
          ],
        AppSection.customers => [
            'Họ và tên',
            'Số điện thoại',
            'Email',
            'Địa chỉ'
          ],
        AppSection.suppliers => [
            'Mã nhà cung cấp',
            'Tên nhà cung cấp',
            'Người liên hệ',
            'Số điện thoại',
            'Địa chỉ'
          ],
        AppSection.branches => ['Tên chi nhánh', 'Địa chỉ'],
        AppSection.users => [
            'Họ tên nhân viên',
            'Tên đăng nhập',
            'Vai trò',
            'Chi nhánh',
            'Số điện thoại'
          ],
        AppSection.audits => ['Ghi chú kiểm kê'],
        AppSection.transfers => [
            'Chi nhánh nhận',
            'Mã thuốc / Lô thuốc',
            'Số lượng',
            'Ghi chú'
          ],
        _ => const [],
      };

  @override
  Widget build(BuildContext context) {
    final records = demoRecords[widget.section] ?? const <DemoRecord>[];
    final statuses = ['Tất cả', ...records.map((r) => r.status).toSet()];
    final filtered = records
        .where((r) =>
            '${r.code} ${r.title} ${r.subtitle}'
                .toLowerCase()
                .contains(query.toLowerCase().trim()) &&
            (status == 'Tất cả' || status == r.status))
        .toList();
    return ListView(padding: const EdgeInsets.all(20), children: [
      PageHeading(widget.section.title, 'Chi nhánh Quận 1 · Danh sách minh họa',
          action: formFields.isEmpty
              ? null
              : OutlinedButton.icon(
                  icon: const Icon(Icons.add),
                  label: const Text('Mở biểu mẫu xem trước'),
                  onPressed: () => showPreviewForm(
                      context, widget.section.title, formFields))),
      StatsGrid(children: [
        StatCard('Tổng bản ghi mẫu', '${records.length}', widget.section.icon),
        const StatCard('Chi nhánh', 'CN01', Icons.store_outlined)
      ]),
      const SizedBox(height: 20),
      SearchBox(
          hint: 'Tìm mã, tên hoặc nội dung',
          onChanged: (s) => setState(() => query = s)),
      const SizedBox(height: 12),
      Wrap(
          spacing: 8,
          runSpacing: 8,
          children: statuses
              .map((s) => ChoiceChip(
                  label: Text(s),
                  selected: status == s,
                  onSelected: (_) => setState(() => status = s)))
              .toList()),
      const SizedBox(height: 20),
      if (filtered.isEmpty) const EmptyResults(),
      for (final r in filtered)
        Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: () => showRecordDetails(context, r.title, [
                      r.code,
                      r.subtitle,
                      'Trạng thái mẫu: ${r.status}',
                      ...r.details
                    ]),
                child: Panel(
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                      Row(children: [
                        Icon(widget.section.icon, color: AppColors.forest),
                        const SizedBox(width: 10),
                        Expanded(
                            child: Text(r.code,
                                style: const TextStyle(
                                    color: AppColors.forest,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 12))),
                        const Icon(Icons.chevron_right, color: AppColors.muted)
                      ]),
                      const SizedBox(height: 14),
                      Text(r.title,
                          style: const TextStyle(
                              fontWeight: FontWeight.w800, fontSize: 16)),
                      const SizedBox(height: 8),
                      Text(r.subtitle,
                          style: const TextStyle(
                              color: AppColors.muted,
                              fontSize: 12,
                              height: 1.5)),
                      const Divider(height: 28),
                      for (final detail in r.details.take(2))
                        Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Text(detail,
                                style: const TextStyle(fontSize: 12))),
                      StatusBadge(r.status,
                          warning: r.status.startsWith('Đang')),
                    ])))),
    ]);
  }
}
