import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../data/demo_data.dart';
import '../data/models/drug_model.dart';
import '../services/drug_service.dart';
import '../widgets/ui_components.dart';

class MedicineScreen extends StatefulWidget {
  const MedicineScreen({super.key, this.inventory = false, this.drugService});
  final bool inventory;
  final DrugService? drugService;

  @override
  State<MedicineScreen> createState() => _MedicineScreenState();
}

class _MedicineScreenState extends State<MedicineScreen> {
  String query = '';
  int filter = 0;
  List<DrugModel>? liveDrugs;
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.drugService != null) {
      _loadDrugs();
    }
  }

  @override
  void didUpdateWidget(covariant MedicineScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.drugService != widget.drugService) {
      _loadDrugs();
    }
  }

  Future<void> _loadDrugs() async {
    if (widget.drugService == null) return;
    setState(() => isLoading = true);
    try {
      final list = await widget.drugService!.getDrugs(search: query);
      if (mounted) {
        setState(() {
          liveDrugs = list;
          isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final inventory = widget.inventory;
    final labels = inventory
        ? ['Tất cả', 'Tồn thấp', 'Cận hạn']
        : ['Tất cả', 'Đang kinh doanh', 'Tạm ngưng'];

    // If liveDrugs is loaded from backend, use it
    final isLive = liveDrugs != null;
    final List<dynamic> items;

    if (isLive) {
      items = liveDrugs!.where((m) {
        if (inventory && !m.isActive) return false;
        if (!'${m.drugCode} ${m.name} ${m.activeIngredient ?? ''}'
            .toLowerCase()
            .contains(query.toLowerCase().trim())) {
          return false;
        }
        if (inventory) {
          return switch (filter) {
            1 => m.stock < 10,
            2 => m.expiring,
            _ => true,
          };
        } else {
          return switch (filter) {
            1 => m.isActive,
            2 => !m.isActive,
            _ => true,
          };
        }
      }).toList();
    } else {
      items = demoMedicines.where((m) {
        if (inventory && !m.active) return false;
        if (!'${m.code} ${m.name} ${m.ingredient}'
            .toLowerCase()
            .contains(query.toLowerCase().trim())) {
          return false;
        }
        return switch (filter) {
          1 => inventory ? m.stock < 10 : m.active,
          2 => inventory ? m.expiring : !m.active,
          _ => true,
        };
      }).toList();
    }

    final totalCount = isLive ? (liveDrugs?.length ?? 0) : items.length;

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
              ? [
                  StatCard('Mặt hàng', '${isLive ? liveDrugs!.where((d) => d.isActive).length : 4}', Icons.inventory_2_outlined,
                      caption: isLive ? 'CSDL Oracle' : 'Dữ liệu minh họa'),
                  StatCard('Tồn thấp', '${isLive ? liveDrugs!.where((d) => d.isActive && d.stock < 10).length : 1}', Icons.warning_amber_outlined,
                      caption: isLive ? 'CSDL Oracle' : 'Dữ liệu minh họa'),
                ]
              : [
                  StatCard('Tổng mặt hàng', '$totalCount', Icons.medication_outlined,
                      caption: isLive ? 'CSDL Oracle' : 'Dữ liệu minh họa'),
                  StatCard('Hoạt động', '${isLive ? liveDrugs!.where((d) => d.isActive).length : totalCount}', Icons.check_circle_outline,
                      caption: isLive ? 'Đang kinh doanh' : 'Dữ liệu minh họa'),
                ]),
      const SizedBox(height: 20),
      SearchBox(
          hint: 'Tìm tên thuốc, mã hoặc hoạt chất',
          onChanged: (value) {
            query = value;
            if (isLive) {
              _loadDrugs();
            } else {
              setState(() {});
            }
          }),
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
      Text('${items.length} mặt hàng',
          style: const TextStyle(color: AppColors.muted, fontSize: 12)),
      const SizedBox(height: 12),
      if (isLoading)
        const Center(
          child: Padding(
            padding: EdgeInsets.all(40),
            child: CircularProgressIndicator(),
          ),
        )
      else if (items.isEmpty)
        const EmptyResults()
      else
        for (final item in items)
          _buildDrugCard(context, item, inventory, isLive),
    ]);
  }

  Widget _buildDrugCard(BuildContext context, dynamic item, bool inventory, bool isLive) {
    final String code = isLive ? (item as DrugModel).drugCode : (item as DemoMedicine).code;
    final String name = isLive ? (item as DrugModel).name : (item as DemoMedicine).name;
    final String ingredient = isLive ? ((item as DrugModel).activeIngredient ?? 'Chưa cập nhật') : (item as DemoMedicine).ingredient;
    final int price = isLive ? (item as DrugModel).price.toInt() : (item as DemoMedicine).price;
    final String unit = isLive ? (item as DrugModel).unit : (item as DemoMedicine).unit;
    final bool active = isLive ? (item as DrugModel).isActive : (item as DemoMedicine).active;
    final String batch = isLive ? (item as DrugModel).batch : (item as DemoMedicine).batch;
    final String expiry = isLive ? (item as DrugModel).expiry : (item as DemoMedicine).expiry;
    final int stock = isLive ? (item as DrugModel).stock : (item as DemoMedicine).stock;
    final bool expiring = isLive ? (item as DrugModel).expiring : (item as DemoMedicine).expiring;

    return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () => showRecordDetails(context, name, [
                  'Mã: $code',
                  'Hoạt chất: $ingredient',
                  'Giá: ${money(price)} / $unit',
                  'Lô: $batch',
                  'Hạn dùng: $expiry',
                  'Tồn: $stock $unit',
                  'Trạng thái: ${active ? 'Đang kinh doanh' : 'Tạm ngưng'}'
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
                          Text(code,
                              style: const TextStyle(
                                  fontSize: 10,
                                  color: AppColors.muted,
                                  letterSpacing: 1)),
                          const SizedBox(height: 4),
                          Text(name,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 15))
                        ]))
                  ]),
                  const SizedBox(height: 12),
                  Text(ingredient,
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
                                ? (expiring
                                    ? 'Cận hạn'
                                    : stock < 10
                                        ? 'Tồn thấp'
                                        : 'Trong hạn')
                                : (active
                                    ? 'Đang kinh doanh'
                                    : 'Tạm ngưng'),
                            warning: inventory
                                ? expiring || stock < 10
                                : !active),
                        Text(
                            inventory
                                ? '$stock $unit'
                                : '${money(price)} / $unit',
                            style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                color: AppColors.forest))
                      ]),
                  if (inventory) ...[
                    const Divider(height: 28),
                    Text('Lô: $batch',
                        style: const TextStyle(fontSize: 12)),
                    const SizedBox(height: 6),
                    Text('Hạn dùng: $expiry',
                        style: const TextStyle(
                            color: AppColors.muted, fontSize: 12))
                  ],
                ]))));
  }
}
