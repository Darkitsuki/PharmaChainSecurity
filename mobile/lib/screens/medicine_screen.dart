import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../data/demo_data.dart';
import '../widgets/ui_components.dart';

class MedicineScreen extends StatefulWidget {
  const MedicineScreen({super.key, this.inventory = false});
  final bool inventory;
  @override
  State<MedicineScreen> createState() => _MedicineScreenState();
}

class _MedicineScreenState extends State<MedicineScreen> {
  String query = '';
  int filter = 0;
  @override
  Widget build(BuildContext context) {
    final inventory = widget.inventory;
    final labels = inventory
        ? ['Tất cả', 'Tồn thấp', 'Cận hạn']
        : ['Tất cả', 'Đang kinh doanh', 'Tạm ngưng'];
    final items = demoMedicines.where((m) {
      if (inventory && !m.active) return false;
      if (!'${m.code} ${m.name} ${m.ingredient}'
          .toLowerCase()
          .contains(query.toLowerCase().trim())) {
        return false;
      }
      return switch (filter) {
        1 => inventory ? m.stock < 10 : m.active,
        2 => inventory ? m.expiring : !m.active,
        _ => true
      };
    }).toList();
    return ListView(padding: const EdgeInsets.all(20), children: [
      PageHeading(
          inventory ? 'Tồn kho chi nhánh' : 'Danh mục thuốc',
          inventory
              ? 'Chi nhánh Quận 1 · Theo dõi theo lô và hạn dùng'
              : 'Quản lý thông tin, giá và trạng thái dược phẩm',
          action: OutlinedButton.icon(
              icon: Icon(inventory ? Icons.tune : Icons.add),
              label: Text(
                  inventory ? 'Xem mẫu điều chỉnh tồn' : 'Xem mẫu thêm thuốc'),
              onPressed: () => showPreviewForm(
                  context,
                  inventory ? 'Điều chỉnh tồn kho' : 'Thêm biệt dược mới',
                  inventory
                      ? [
                          'Mã thuốc',
                          'Số lô',
                          'Số lượng kiểm đếm',
                          'Lý do điều chỉnh'
                        ]
                      : [
                          'Mã thuốc',
                          'Tên biệt dược',
                          'Hoạt chất',
                          'Đơn vị tính',
                          'Giá bán niêm yết (VNĐ)'
                        ]))),
      StatsGrid(
          children: inventory
              ? const [
                  StatCard('Mặt hàng', '4', Icons.inventory_2_outlined),
                  StatCard('Tồn thấp', '1', Icons.warning_amber_outlined),
                ]
              : const [
                  StatCard('Đang kinh doanh', '4', Icons.medication_outlined),
                  StatCard('Tạm ngưng', '1', Icons.pause_circle_outline)
                ]),
      const SizedBox(height: 20),
      SearchBox(
          hint: 'Tìm tên thuốc, mã hoặc hoạt chất',
          onChanged: (value) => setState(() => query = value)),
      const SizedBox(height: 12),
      Wrap(
          spacing: 8,
          runSpacing: 8,
          children: List.generate(
              labels.length,
              (index) => ChoiceChip(
                  label: Text(labels[index]),
                  selected: filter == index,
                  onSelected: (_) => setState(() => filter = index)))),
      const SizedBox(height: 18),
      Text('${items.length} kết quả mẫu',
          style: const TextStyle(color: AppColors.muted, fontSize: 12)),
      const SizedBox(height: 12),
      if (items.isEmpty) const EmptyResults(),
      for (final m in items)
        Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: () => showRecordDetails(context, m.name, [
                      'Mã: ${m.code}',
                      'Hoạt chất: ${m.ingredient}',
                      'Giá: ${money(m.price)} / ${m.unit}',
                      'Lô: ${m.batch}',
                      'Hạn dùng: ${m.expiry}',
                      'Tồn mẫu: ${m.stock} ${m.unit}',
                      'Trạng thái: ${m.active ? 'Đang kinh doanh' : 'Tạm ngưng'}'
                    ]),
                child: Panel(
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                      Row(children: [
                        Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                                color: AppColors.mint,
                                borderRadius: BorderRadius.circular(12)),
                            child: const Icon(Icons.medication_outlined,
                                color: AppColors.forest)),
                        const SizedBox(width: 12),
                        Expanded(
                            child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                              Text(m.code,
                                  style: const TextStyle(
                                      fontSize: 10,
                                      color: AppColors.muted,
                                      letterSpacing: 1)),
                              const SizedBox(height: 4),
                              Text(m.name,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 15))
                            ]))
                      ]),
                      const SizedBox(height: 12),
                      Text(m.ingredient,
                          style: const TextStyle(
                              color: AppColors.muted, fontSize: 12)),
                      const SizedBox(height: 14),
                      Wrap(
                          spacing: 10,
                          runSpacing: 10,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          children: [
                            StatusBadge(
                                inventory
                                    ? (m.expiring
                                        ? 'Cận hạn'
                                        : m.stock < 10
                                            ? 'Tồn thấp'
                                            : 'Trong hạn')
                                    : (m.active
                                        ? 'Đang kinh doanh'
                                        : 'Tạm ngưng'),
                                warning: inventory
                                    ? m.expiring || m.stock < 10
                                    : !m.active),
                            Text(
                                inventory
                                    ? '${m.stock} ${m.unit}'
                                    : '${money(m.price)} / ${m.unit}',
                                style: const TextStyle(
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.forest))
                          ]),
                      if (inventory) ...[
                        const Divider(height: 28),
                        Text('Lô: ${m.batch}',
                            style: const TextStyle(fontSize: 12)),
                        const SizedBox(height: 6),
                        Text('Hạn dùng: ${m.expiry}',
                            style: const TextStyle(
                                color: AppColors.muted, fontSize: 12))
                      ],
                    ]))))
    ]);
  }
}
