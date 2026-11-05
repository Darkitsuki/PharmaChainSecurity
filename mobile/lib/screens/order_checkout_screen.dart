import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../data/demo_data.dart';
import '../data/models/order_model.dart';
import '../services/cart_service.dart';
import '../services/customer_auth_service.dart';
import '../services/order_service.dart';
import '../services/staff_notification_service.dart';
import '../widgets/customer_auth_modal.dart';
import '../widgets/ui_components.dart';

class OrderCheckoutScreen extends StatefulWidget {
  const OrderCheckoutScreen({
    super.key,
    required this.cartService,
    required this.orderService,
    required this.onOrderCompleted,
  });

  final CartService cartService;
  final OrderService orderService;
  final VoidCallback onOrderCompleted;

  @override
  State<OrderCheckoutScreen> createState() => _OrderCheckoutScreenState();
}

class _OrderCheckoutScreenState extends State<OrderCheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController(text: 'Nguyễn Văn An');
  final _phoneController = TextEditingController(text: '0908123456');
  final _addressController = TextEditingController(text: '123 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP.HCM');
  final _notesController = TextEditingController();

  DeliveryMethod _deliveryMethod = DeliveryMethod.delivery;
  PaymentMethod _paymentMethod = PaymentMethod.cod;

  String _selectedBranchId = 'br-00000000-0000-0000-0000-000000000001';
  String _selectedBranchName = 'Chi nhánh Quận 1 (123 Hai Bà Trưng, Q.1)';

  final _branches = [
    {'id': 'br-00000000-0000-0000-0000-000000000001', 'name': 'Chi nhánh Quận 1 (123 Hai Bà Trưng, Q.1)'},
    {'id': 'br-00000000-0000-0000-0000-000000000002', 'name': 'Chi nhánh Quận 3 (456 Cách Mạng Tháng 8, Q.3)'},
  ];

  bool _hasPrescriptionAttached = false;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    final customer = CustomerAuthService.instance.currentUser;
    if (customer != null) {
      _nameController.text = customer.fullName;
      _phoneController.text = customer.phoneNumber;
      if (customer.address != null && customer.address!.isNotEmpty) {
        _addressController.text = customer.address!;
      }
    }
    if (widget.cartService.hasPrescriptionItems) {
      _hasPrescriptionAttached = true;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submitOrder() async {
    if (_isSubmitting) return;

    // 1. Require Customer Login / Registration before checkout
    if (!CustomerAuthService.instance.isLoggedIn) {
      final user = await CustomerAuthModal.show(
        context,
        initialPhone: _phoneController.text.trim(),
        initialName: _nameController.text.trim(),
        initialAddress: _addressController.text.trim(),
        api: widget.orderService.api,
        branchId: _selectedBranchId,
      );
      if (user == null) return; // User dismissed auth
      if (!mounted) return;

      setState(() {
        _nameController.text = user.fullName;
        _phoneController.text = user.phoneNumber;
        if (user.address != null && user.address!.isNotEmpty) {
          _addressController.text = user.address!;
        }
      });
    }

    if (!_formKey.currentState!.validate()) return;

    if (widget.cartService.hasPrescriptionItems && !_hasPrescriptionAttached) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng đính kèm ảnh đơn thuốc của Bác sĩ để hoàn tất đặt thuốc kê đơn.'),
          backgroundColor: AppColors.coral,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final request = CustomerOrderRequest(
        customerName: _nameController.text.trim(),
        phoneNumber: _phoneController.text.trim(),
        deliveryMethod: _deliveryMethod,
        deliveryAddress: _deliveryMethod == DeliveryMethod.delivery ? _addressController.text.trim() : null,
        branchId: _selectedBranchId,
        branchName: _selectedBranchName,
        paymentMethod: _paymentMethod,
        notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
        prescriptionImageName: _hasPrescriptionAttached ? 'prescription_image_${DateTime.now().millisecondsSinceEpoch}.jpg' : null,
        items: widget.cartService.items,
      );

      final result = await widget.orderService.placeOrder(request);

      // Notify Branch Sales Staff in real-time
      StaffNotificationService.instance.notifyNewOrder(
        result,
        branchId: _selectedBranchId,
      );

      if (!mounted) return;

      // Show success modal
      await showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          contentPadding: const EdgeInsets.all(24),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(color: AppColors.mint, shape: BoxShape.circle),
                child: const Icon(Icons.check_circle_outline, color: AppColors.forest, size: 48),
              ),
              const SizedBox(height: 18),
              const Text('Đặt thuốc thành công!',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 20)),
              const SizedBox(height: 8),
              Text(
                'Mã đơn hàng: ${result.invoiceNumber}',
                style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.forest, fontSize: 15),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: result.paymentStatus == 'PENDING'
                          ? const Color(0xFFFEF3C7)
                          : AppColors.mint,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          result.paymentStatus == 'PENDING' ? Icons.schedule : Icons.check_circle_outline,
                          size: 14,
                          color: result.paymentStatus == 'PENDING' ? const Color(0xFFB45309) : AppColors.forest,
                        ),
                        const SizedBox(width: 5),
                        Text(
                          result.paymentStatus == 'PENDING'
                              ? 'CHỜ THANH TOÁN TẠI QUẦY'
                              : 'ĐÃ THANH TOÁN',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: result.paymentStatus == 'PENDING' ? const Color(0xFFB45309) : AppColors.forest,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: AppColors.mint,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.verified_outlined, size: 14, color: AppColors.forest),
                        SizedBox(width: 4),
                        Text('KÝ SỐ HSM',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.forest)),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                _deliveryMethod == DeliveryMethod.delivery
                    ? 'Dược sĩ tại ${_selectedBranchName.split('(').first} sẽ gọi điện xác nhận trong 15 phút và giao đến địa chỉ của bạn.'
                    : 'Thuốc của bạn đang được soạn sẵn tại ${_selectedBranchName.split('(').first}. Bạn có thể ghé quầy nhận bất cứ lúc nào.',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 12, color: AppColors.muted, height: 1.5),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () {
                    Navigator.pop(ctx); // Close dialog
                    Navigator.pop(context); // Go back from checkout
                    widget.onOrderCompleted();
                  },
                  child: const Text('Xem đơn hàng của tôi'),
                ),
              ),
            ],
          ),
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi khi đặt thuốc: $e'),
            backgroundColor: AppColors.coral,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = widget.cartService;

    return Scaffold(
      backgroundColor: AppColors.canvas,
      appBar: AppBar(
        title: const Text('Xác nhận đặt thuốc', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // 0. Customer Identification Status Banner
            ListenableBuilder(
              listenable: CustomerAuthService.instance,
              builder: (context, _) {
                final customer = CustomerAuthService.instance.currentUser;
                final isLoggedIn = customer != null;

                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isLoggedIn ? AppColors.mint : const Color(0xFFFFF8E1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isLoggedIn ? AppColors.forest : const Color(0xFFFFB300),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        isLoggedIn ? Icons.verified_user : Icons.account_circle_outlined,
                        color: isLoggedIn ? AppColors.forest : const Color(0xFFF57C00),
                        size: 24,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isLoggedIn
                                  ? 'Khách hàng: ${customer.fullName}'
                                  : 'Chưa đăng nhập tài khoản người mua',
                              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              isLoggedIn
                                  ? 'SĐT: ${customer.phoneNumber} · Đã định danh an toàn'
                                  : 'Đăng nhập để lưu đơn và tích điểm thành viên',
                              style: const TextStyle(fontSize: 11, color: AppColors.muted),
                            ),
                          ],
                        ),
                      ),
                      TextButton(
                        onPressed: () async {
                          final user = await CustomerAuthModal.show(
                            context,
                            initialPhone: _phoneController.text.trim(),
                            initialName: _nameController.text.trim(),
                            initialAddress: _addressController.text.trim(),
                            api: widget.orderService.api,
                            branchId: _selectedBranchId,
                          );
                          if (user != null) {
                            setState(() {
                              _nameController.text = user.fullName;
                              _phoneController.text = user.phoneNumber;
                              if (user.address != null && user.address!.isNotEmpty) {
                                _addressController.text = user.address!;
                              }
                            });
                          }
                        },
                        child: Text(isLoggedIn ? 'Đổi tài khoản' : 'Đăng nhập',
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                      ),
                    ],
                  ),
                );
              },
            ),

            // 1. Delivery Type Selector
            const Text('Hình thức nhận thuốc', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () => setState(() => _deliveryMethod = DeliveryMethod.delivery),
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: _deliveryMethod == DeliveryMethod.delivery ? AppColors.mint : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _deliveryMethod == DeliveryMethod.delivery ? AppColors.forest : AppColors.line,
                          width: _deliveryMethod == DeliveryMethod.delivery ? 2 : 1,
                        ),
                      ),
                      child: Column(
                        children: [
                          Icon(Icons.delivery_dining_outlined,
                              color: _deliveryMethod == DeliveryMethod.delivery ? AppColors.forest : AppColors.muted),
                          const SizedBox(height: 6),
                          Text('Giao tận nơi',
                              style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  color: _deliveryMethod == DeliveryMethod.delivery ? AppColors.forest : AppColors.ink)),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: InkWell(
                    onTap: () => setState(() => _deliveryMethod = DeliveryMethod.pickup),
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: _deliveryMethod == DeliveryMethod.pickup ? AppColors.mint : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _deliveryMethod == DeliveryMethod.pickup ? AppColors.forest : AppColors.line,
                          width: _deliveryMethod == DeliveryMethod.pickup ? 2 : 1,
                        ),
                      ),
                      child: Column(
                        children: [
                          Icon(Icons.store_outlined,
                              color: _deliveryMethod == DeliveryMethod.pickup ? AppColors.forest : AppColors.muted),
                          const SizedBox(height: 6),
                          Text('Nhận tại quầy',
                              style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  color: _deliveryMethod == DeliveryMethod.pickup ? AppColors.forest : AppColors.ink)),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // 2. Recipient Information Panel
            Panel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Thông tin người nhận', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      labelText: 'Họ và tên người nhận *',
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                    validator: (v) => v == null || v.trim().isEmpty ? 'Vui lòng nhập họ và tên' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'Số điện thoại liên hệ *',
                      prefixIcon: Icon(Icons.phone_outlined),
                    ),
                    validator: (v) => v == null || v.trim().length < 9 ? 'Vui lòng nhập số điện thoại hợp lệ' : null,
                  ),
                  const SizedBox(height: 12),
                  if (_deliveryMethod == DeliveryMethod.delivery)
                    TextFormField(
                      controller: _addressController,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'Địa chỉ giao hàng tận nhà *',
                        prefixIcon: Icon(Icons.location_on_outlined),
                      ),
                      validator: (v) => v == null || v.trim().isEmpty ? 'Vui lòng nhập địa chỉ nhận thuốc' : null,
                    )
                  else
                    DropdownButtonFormField<String>(
                      initialValue: _selectedBranchId,
                      decoration: const InputDecoration(
                        labelText: 'Chi nhánh nhận thuốc *',
                        prefixIcon: Icon(Icons.store_outlined),
                      ),
                      items: _branches.map((b) {
                        return DropdownMenuItem<String>(
                          value: b['id'],
                          child: Text(b['name']!, style: const TextStyle(fontSize: 13)),
                        );
                      }).toList(),
                      onChanged: (id) {
                        if (id != null) {
                          setState(() {
                            _selectedBranchId = id;
                            _selectedBranchName = _branches.firstWhere((b) => b['id'] == id)['name']!;
                          });
                        }
                      },
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 3. Prescription Upload (Rx)
            Panel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.document_scanner_outlined, color: AppColors.forest, size: 20),
                      const SizedBox(width: 8),
                      const Text('Đơn thuốc Bác sĩ (Toa thuốc)',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                      if (cart.hasPrescriptionItems) ...[
                        const SizedBox(width: 8),
                        const StatusBadge('BẮT BUỘC (Rx)', warning: true),
                      ],
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Đính kèm ảnh chụp đơn thuốc có chữ ký Bác sĩ để Dược sĩ đối chiếu và kiểm tra tính an toàn.',
                    style: TextStyle(color: AppColors.muted, fontSize: 12, height: 1.4),
                  ),
                  const SizedBox(height: 14),
                  InkWell(
                    onTap: () {
                      setState(() => _hasPrescriptionAttached = !_hasPrescriptionAttached);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(_hasPrescriptionAttached
                              ? 'Đã đính kèm ảnh đơn thuốc mẫu!'
                              : 'Đã gỡ ảnh đơn thuốc.'),
                          duration: const Duration(seconds: 1),
                        ),
                      );
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      decoration: BoxDecoration(
                        color: _hasPrescriptionAttached ? AppColors.mint : AppColors.canvas,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _hasPrescriptionAttached ? AppColors.forest : AppColors.line,
                          style: BorderStyle.solid,
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            _hasPrescriptionAttached ? Icons.check_circle : Icons.camera_alt_outlined,
                            color: _hasPrescriptionAttached ? AppColors.forest : AppColors.muted,
                          ),
                          const SizedBox(width: 10),
                          Text(
                            _hasPrescriptionAttached ? 'Đã đính kèm ảnh đơn thuốc (Bấm để gỡ)' : 'Chụp hoặc tải ảnh đơn thuốc lên',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              color: _hasPrescriptionAttached ? AppColors.forest : AppColors.ink,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 4. Payment Method
            Panel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Phương thức thanh toán', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                  const SizedBox(height: 10),
                  RadioGroup<PaymentMethod>(
                    groupValue: _paymentMethod,
                    onChanged: (val) {
                      if (val != null) setState(() => _paymentMethod = val);
                    },
                    child: const Column(
                      children: [
                        RadioListTile<PaymentMethod>(
                          value: PaymentMethod.cod,
                          title: Text('Tiền mặt khi nhận (COD)', style: TextStyle(fontWeight: FontWeight.w700)),
                          subtitle: Text('Thanh toán trực tiếp khi nhận hàng', style: TextStyle(fontSize: 12, color: AppColors.muted)),
                          activeColor: AppColors.forest,
                          contentPadding: EdgeInsets.zero,
                        ),
                        Divider(height: 1),
                        RadioListTile<PaymentMethod>(
                          value: PaymentMethod.qrTransfer,
                          title: Text('Chuyển khoản QR (VietQR)', style: TextStyle(fontWeight: FontWeight.w700)),
                          subtitle: Text('Quét mã QR thanh toán qua ứng dụng ngân hàng', style: TextStyle(fontSize: 12, color: AppColors.muted)),
                          activeColor: AppColors.forest,
                          contentPadding: EdgeInsets.zero,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 5. Order Summary
            Panel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Chi tiết đơn thuốc', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                      Text('${cart.totalQuantity} sản phẩm', style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  for (final item in cart.items)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text('${item.drug.name} × ${item.quantity}', style: const TextStyle(fontSize: 13)),
                          ),
                          Text(money(item.subtotal.toInt()), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                        ],
                      ),
                    ),
                  const Divider(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Tổng tiền thanh toán', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                      Text(
                        money(cart.totalPrice.toInt()),
                        style: const TextStyle(color: AppColors.forest, fontWeight: FontWeight.w800, fontSize: 18),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // 6. Submit Button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: FilledButton.icon(
                icon: _isSubmitting
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.check_circle_outline),
                label: Text(
                  _isSubmitting ? 'Đang gửi đơn thuốc...' : 'Xác nhận Đặt thuốc',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                ),
                onPressed: _isSubmitting ? null : _submitOrder,
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

