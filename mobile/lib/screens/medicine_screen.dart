import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../data/demo_data.dart';
import '../data/models/drug_model.dart';
import '../services/drug_service.dart';
import '../widgets/ui_components.dart';

class MedicineScreen extends StatefulWidget {
  const MedicineScreen({
    super.key,
    this.inventory = false,
    this.drugService,
    this.branchName,
    this.onOrderSupplements,
  });

  final bool inventory;
  final DrugService? drugService;
  final String? branchName;
  final void Function(DrugModel drug)? onOrderSupplements;

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
    if (oldWidget.drugService != widget.drugService ||
        oldWidget.inventory != widget.inventory) {
      _loadDrugs();
    }
  }

  Future<void> _loadDrugs() async {
    if (widget.drugService == null) return;
    setState(() => isLoading = true);
    try {
      final list = await widget.drugService!.getDrugs(
        search: query,
        includeInactive: !widget.inventory,
        withInventory: widget.inventory,
      );
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

  void _showLiveDrugDetails(BuildContext context, DrugModel drug) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.65,
          minChildSize: 0.4,
          maxChildSize: 0.9,
          expand: false,
          builder: (context, scrollController) {
            return ListView(
              controller: scrollController,
              padding: const EdgeInsets.all(24),
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 20),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.mint,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(Icons.medication_outlined,
                          color: AppColors.forest, size: 28),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(drug.drugCode,
                              style: const TextStyle(
                                  fontSize: 11,
                                  color: AppColors.muted,
                                  letterSpacing: 1,
                                  fontWeight: FontWeight.w600)),
                          const SizedBox(height: 4),
                          Text(drug.name,
                              style: const TextStyle(
                                  fontSize: 18, fontWeight: FontWeight.w800)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Panel(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _detailRow('Hoạt chất', drug.activeIngredient ?? 'Chưa cập nhật'),
                      _detailRow('Đơn vị tính', drug.unit),
                      _detailRow('Giá niêm yết', '${money(drug.price.toInt())} / ${drug.unit}'),
                      _detailRow('Tổng tồn kho', '${drug.stock} ${drug.unit}'),
                      _detailRow('Lô FEFO', drug.batch),
                      _detailRow('Hạn dùng FEFO', drug.expiry),
                      _detailRow(
                        'Trạng thái',
                        drug.isActive ? 'Đang kinh doanh' : 'Tạm ngưng',
                        color: drug.isActive ? AppColors.forest : AppColors.coral,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                const Text('Danh sách các lô theo FEFO (Hạn gần nhất xuất trước):',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                const SizedBox(height: 12),
                FutureBuilder<List<DrugBatchModel>>(
                  future: widget.drugService!.getBatches(drug.drugId),
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Center(
                        child: Padding(
                          padding: EdgeInsets.all(24),
                          child: CircularProgressIndicator(),
                        ),
                      );
                    }
                    final batches = snapshot.data ?? [];
                    if (batches.isEmpty) {
                      return const Padding(
                        padding: EdgeInsets.all(16),
                        child: Text('Không có thông tin lô khả dụng trong kho.',
                            style: TextStyle(color: AppColors.muted)),
                      );
                    }
                    return Column(
                      children: batches.map((b) {
                        final isNear = b.isExpiringSoon;
                        final isExpired = b.isExpired;
                        final dateStr =
                            '${b.expiryDate.day.toString().padLeft(2, '0')}/${b.expiryDate.month.toString().padLeft(2, '0')}/${b.expiryDate.year}';
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(color: Colors.grey.shade200),
                          ),
                          child: ListTile(
                            leading: Icon(
                              Icons.all_inbox_outlined,
                              color: isExpired
                                  ? AppColors.coral
                                  : isNear
                                      ? Colors.orange
                                      : AppColors.forest,
                            ),
                            title: Text('Lô: ${b.batchNo}',
                                style: const TextStyle(fontWeight: FontWeight.w700)),
                            subtitle: Text('HSD: $dateStr · Tồn: ${b.stockQuantity} ${drug.unit}'),
                            trailing: StatusBadge(
                              isExpired
                                  ? 'Hết hạn'
                                  : isNear
                                      ? 'Cận hạn (≤90d)'
                                      : 'Khả dụng',
                              warning: isExpired || isNear,
                            ),
                          ),
                        );
                      }).toList(),
                    );
                  },
                ),
                const SizedBox(height: 16),
                if (widget.onOrderSupplements != null)
                  FilledButton.icon(
                    onPressed: () {
                      Navigator.pop(ctx);
                      widget.onOrderSupplements!(drug);
                    },
                    icon: const Icon(Icons.add_shopping_cart),
                    label: const Text('Đặt mua bổ sung thuốc này'),
                  ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _detailRow(String label, String value, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 13)),
          Text(value,
              style: TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                  color: color ?? AppColors.forest)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final inventory = widget.inventory;
    final labels = inventory
        ? ['Tất cả', 'Tồn thấp', 'Cận hạn']
        : ['Tất cả', 'Đang kinh doanh', 'Tạm ngưng'];

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
              ? '${widget.branchName ?? 'Chi nhánh Quận 1'} · Theo dõi theo lô và hạn dùng'
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
                  StatCard('Mặt hàng',
                      '${isLive ? liveDrugs!.where((d) => d.isActive).length : 4}',
                      Icons.inventory_2_outlined,
                      caption: isLive ? 'CSDL Oracle' : 'Dữ liệu minh họa'),
                  StatCard('Tồn thấp',
                      '${isLive ? liveDrugs!.where((d) => d.isActive && d.stock < 10).length : 1}',
                      Icons.warning_amber_outlined,
                      caption: isLive ? 'CSDL Oracle' : 'Dữ liệu minh họa'),
                  StatCard('Cận hạn',
                      '${isLive ? liveDrugs!.where((d) => d.isActive && d.expiring).length : 1}',
                      Icons.access_time_outlined,
                      caption: isLive ? 'CSDL Oracle' : 'Dữ liệu minh họa'),
                ]
              : [
                  StatCard('Tổng mặt hàng', '$totalCount',
                      Icons.medication_outlined,
                      caption: isLive ? 'CSDL Oracle' : 'Dữ liệu minh họa'),
                  StatCard('Hoạt động',
                      '${isLive ? liveDrugs!.where((d) => d.isActive).length : totalCount}',
                      Icons.check_circle_outline,
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

  Widget _buildDrugCard(
      BuildContext context, dynamic item, bool inventory, bool isLive) {
    final String code =
        isLive ? (item as DrugModel).drugCode : (item as DemoMedicine).code;
    final String name =
        isLive ? (item as DrugModel).name : (item as DemoMedicine).name;
    final String ingredient = isLive
        ? ((item as DrugModel).activeIngredient ?? 'Chưa cập nhật')
        : (item as DemoMedicine).ingredient;
    final int price =
        isLive ? (item as DrugModel).price.toInt() : (item as DemoMedicine).price;
    final String unit =
        isLive ? (item as DrugModel).unit : (item as DemoMedicine).unit;
    final bool active =
        isLive ? (item as DrugModel).isActive : (item as DemoMedicine).active;
    final String batch =
        isLive ? (item as DrugModel).batch : (item as DemoMedicine).batch;
    final String expiry =
        isLive ? (item as DrugModel).expiry : (item as DemoMedicine).expiry;
    final int stock =
        isLive ? (item as DrugModel).stock : (item as DemoMedicine).stock;
    final bool expiring =
        isLive ? (item as DrugModel).expiring : (item as DemoMedicine).expiring;

    return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () {
              if (isLive && widget.drugService != null && item is DrugModel) {
                _showLiveDrugDetails(context, item);
              } else {
                showRecordDetails(context, name, [
                  'Mã: $code',
                  'Hoạt chất: $ingredient',
                  'Giá: ${money(price)} / $unit',
                  'Lô: $batch',
                  'Hạn dùng: $expiry',
                  'Tồn: $stock $unit',
                  'Trạng thái: ${active ? 'Đang kinh doanh' : 'Tạm ngưng'}'
                ]);
              }
            },
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
