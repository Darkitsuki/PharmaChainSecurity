import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../data/demo_data.dart';
import '../widgets/ui_components.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});
  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  String query = '';
  final Map<DemoMedicine, int> cart = {};
  @override
  Widget build(BuildContext context) {
    final items = demoMedicines.where((m) =>
        m.active && m.name.toLowerCase().contains(query.toLowerCase().trim()));
    final total =
        cart.entries.fold<int>(0, (sum, e) => sum + e.key.price * e.value);
    return ListView(padding: const EdgeInsets.all(20), children: [
      const PageHeading('Bán hàng tại quầy',
          'Giỏ xem trước · Không tạo hóa đơn, không trừ tồn kho'),
      SearchBox(
          hint: 'Tìm thuốc để xem bố cục giỏ',
          onChanged: (q) => setState(() => query = q)),
      const SizedBox(height: 18),
      for (final m in items)
        Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Panel(
                padding: const EdgeInsets.all(12),
                child: Row(children: [
                  const Icon(Icons.medication_outlined,
                      color: AppColors.forest),
                  const SizedBox(width: 12),
                  Expanded(
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                        Text(m.name,
                            style:
                                const TextStyle(fontWeight: FontWeight.w700)),
                        const SizedBox(height: 5),
                        Text('${money(m.price)} · ${m.unit}',
                            style: const TextStyle(
                                color: AppColors.muted, fontSize: 12))
                      ])),
                  IconButton(
                      tooltip: 'Thêm vào giỏ xem trước',
                      icon: const Icon(Icons.add_circle_outline,
                          color: AppColors.forest),
                      onPressed: () => setState(() =>
                          cart.update(m, (n) => n + 1, ifAbsent: () => 1)))
                ]))),
      const SizedBox(height: 20),
      Panel(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const Text('Giỏ xem trước',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 19)),
        const SizedBox(height: 10),
        if (cart.isEmpty)
          const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Text('Chưa có sản phẩm. Thêm thuốc mẫu ở trên.',
                  style: TextStyle(color: AppColors.muted))),
        for (final e in cart.entries)
          Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(e.key.name,
                        style: const TextStyle(fontWeight: FontWeight.w700)),
                    Row(children: [
                      IconButton(
                          tooltip: 'Giảm số lượng mẫu',
                          onPressed: () => setState(() {
                                if (e.value == 1) {
                                  cart.remove(e.key);
                                } else {
                                  cart[e.key] = e.value - 1;
                                }
                              }),
                          icon: const Icon(Icons.remove_circle_outline)),
                      Text('${e.value}'),
                      IconButton(
                          tooltip: 'Tăng số lượng mẫu',
                          onPressed: () =>
                              setState(() => cart[e.key] = e.value + 1),
                          icon: const Icon(Icons.add_circle_outline)),
                      Expanded(
                          child: Text(money(e.key.price * e.value),
                              textAlign: TextAlign.end,
                              style:
                                  const TextStyle(fontWeight: FontWeight.w700)))
                    ])
                  ])),
        const Divider(height: 24),
        Text('Tổng tiền mẫu: ${money(total)}',
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
        const SizedBox(height: 18),
        const TextField(
            decoration: InputDecoration(
                labelText: 'Khách hàng / Số điện thoại',
                prefixIcon: Icon(Icons.person_search_outlined))),
        const SizedBox(height: 18),
        const FilledButton(
            onPressed: null, child: Text('Thanh toán & Xuất hóa đơn')),
        const SizedBox(height: 10),
        const Text(
            'Chưa kết nối thanh toán hoặc ký số. Giỏ chỉ thay đổi trong bộ nhớ khi xem giao diện.',
            style:
                TextStyle(color: AppColors.muted, fontSize: 12, height: 1.5)),
      ])),
    ]);
  }
}
