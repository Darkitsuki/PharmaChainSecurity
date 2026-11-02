import 'package:flutter/material.dart';
import '../core/auth/auth_session.dart';
import '../core/theme/app_theme.dart';
import '../data/demo_data.dart';
import '../data/models/cart_item.dart';
import '../data/models/drug_model.dart';
import '../data/models/order_model.dart';
import '../services/drug_service.dart';
import '../services/order_service.dart';
import '../widgets/ui_components.dart';
import 'patient_shell.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({
    super.key,
    this.session,
    this.drugService,
    this.orderService,
  });

  final AuthSession? session;
  final DrugService? drugService;
  final OrderService? orderService;

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  String query = '';
  final Map<DemoMedicine, int> cart = {};

  final _customerNameController = TextEditingController(text: 'Khách mua tại quầy');
  final _customerPhoneController = TextEditingController(text: '0908123456');
  final _deliveryAddressController = TextEditingController();

  late final OrderService _orderService;

  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _orderService = widget.orderService ??
        OrderService(
          api: widget.session?.api,
          tokenProvider: () => widget.session?.token,
          defaultBranchId: widget.session?.user?.branchId,
        );
  }

  @override
  void dispose() {
    _customerNameController.dispose();
    _customerPhoneController.dispose();
    _deliveryAddressController.dispose();
    super.dispose();
  }

  Future<void> _handleCheckout() async {
    if (cart.isEmpty || _isSubmitting) return;

    setState(() => _isSubmitting = true);

    try {
      final items = cart.entries.map((e) {
        final drug = DrugModel(
          drugId: e.key.code,
          drugCode: e.key.code,
          name: e.key.name,
          activeIngredient: e.key.ingredient,
          unit: e.key.unit,
          price: e.key.price.toDouble(),
        );
        return CartItem(drug: drug, quantity: e.value);
      }).toList();

      final branchId = widget.session?.user?.branchId ?? 'br-00000000-0000-0000-0000-000000000001';
      final branchName = widget.session?.user?.branchName ?? 'Chi nhánh Quận 1';

      final request = CustomerOrderRequest(
        customerName: _customerNameController.text.trim().isEmpty ? 'Khách lẻ' : _customerNameController.text.trim(),
        phoneNumber: _customerPhoneController.text.trim().isEmpty ? '0908123456' : _customerPhoneController.text.trim(),
        deliveryMethod: DeliveryMethod.pickup,
        branchId: branchId,
        branchName: branchName,
        paymentMethod: PaymentMethod.cod,
        items: items,
      );

      final result = await _orderService.placeOrder(request);

      if (!mounted) return;

      // Show success dialog
      await showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              Icon(Icons.check_circle, color: AppColors.forest, size: 28),
              SizedBox(width: 10),
              Text('Thanh toán thành công', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Mã hóa đơn: ${result.invoiceNumber}',
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: AppColors.forest)),
              const SizedBox(height: 6),
              Text('Tổng thanh toán: ${money(result.totalAmount.toInt())}',
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(color: AppColors.mint, borderRadius: BorderRadius.circular(8)),
                child: Row(
                  children: [
                    const Icon(Icons.verified_outlined, size: 16, color: AppColors.forest),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text('ĐÃ KÝ SỐ HSM: ${result.hashValueSha256.substring(0, 16)}...',
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.forest)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              const Text('Hóa đơn điện tử đã được ghi nhận vào hệ thống CSDL và trừ tồn kho chi nhánh.',
                  style: TextStyle(fontSize: 12, color: AppColors.muted, height: 1.4)),
            ],
          ),
          actions: [
            FilledButton(
              onPressed: () {
                Navigator.pop(ctx);
                setState(() => cart.clear());
              },
              child: const Text('Tạo đơn tiếp theo'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Thanh toán không thành công: $e'),
            backgroundColor: AppColors.coral,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _openPatientApp() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PatientShell(
          session: widget.session,
          onExit: () => Navigator.pop(context),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final items = demoMedicines.where((m) =>
        m.active && m.name.toLowerCase().contains(query.toLowerCase().trim()));
    final total =
        cart.entries.fold<int>(0, (sum, e) => sum + e.key.price * e.value);

    return ListView(padding: const EdgeInsets.all(20), children: [
      // Banner to switch to Patient Ordering App
      InkWell(
        onTap: _openPatientApp,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.forest, Color(0xFF1E584B)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: const [
              BoxShadow(
                color: Color(0x33246B5B),
                blurRadius: 8,
                offset: Offset(0, 4),
              )
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0x33FFFFFF),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.shopping_bag_outlined, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Mở Ứng dụng Bệnh nhân Đặt thuốc',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
                    SizedBox(height: 4),
                    Text('Giao diện E-commerce: Đặt giao tận nơi, chụp đơn thuốc Rx.',
                        style: TextStyle(color: Color(0xFFD6EAE3), fontSize: 11)),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios, color: Colors.white, size: 14),
            ],
          ),
        ),
      ),
      const SizedBox(height: 20),

      const PageHeading('Bán hàng tại quầy',
          'Tạo hóa đơn, trừ tồn kho chi nhánh & xác thực ký số điện tử HSM'),
      SearchBox(
          hint: 'Tìm thuốc theo tên hoặc hoạt chất...',
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
                      tooltip: 'Thêm vào giỏ',
                      icon: const Icon(Icons.add_circle_outline,
                          color: AppColors.forest),
                      onPressed: () => setState(() =>
                          cart.update(m, (n) => n + 1, ifAbsent: () => 1)))
                ]))),
      const SizedBox(height: 20),
      Panel(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const Text('Giỏ hàng quầy',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 19)),
        const SizedBox(height: 10),
        if (cart.isEmpty)
          const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Text('Chưa có sản phẩm. Thêm thuốc ở danh sách trên.',
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
                          tooltip: 'Giảm số lượng',
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
                          tooltip: 'Tăng số lượng',
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
        Text('Tổng tiền: ${money(total)}',
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.forest)),
        const SizedBox(height: 18),
        TextField(
            controller: _customerPhoneController,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
                labelText: 'Số điện thoại khách hàng *',
                prefixIcon: Icon(Icons.phone_outlined))),
        const SizedBox(height: 12),
        TextField(
            controller: _customerNameController,
            decoration: const InputDecoration(
                labelText: 'Họ và tên khách hàng',
                prefixIcon: Icon(Icons.person_search_outlined))),
        const SizedBox(height: 18),
        FilledButton.icon(
            icon: _isSubmitting
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Icon(Icons.check_circle_outline),
            onPressed: cart.isEmpty || _isSubmitting ? null : _handleCheckout,
            label: Text(_isSubmitting ? 'Đang xuất hóa đơn...' : 'Thanh toán & Xuất hóa đơn Ký số')),
        const SizedBox(height: 10),
        const Text(
            'Hóa đơn điện tử bảo mật tuân thủ Thông tư 78/2021/TT-BTC và chuẩn chữ ký số HSM SHA-256.',
            style:
                TextStyle(color: AppColors.muted, fontSize: 11, height: 1.5)),
      ])),
    ]);
  }
}
