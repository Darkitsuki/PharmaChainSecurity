import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../data/demo_data.dart';
import '../data/models/order_model.dart';
import '../services/customer_auth_service.dart';
import '../services/order_service.dart';
import '../widgets/customer_auth_modal.dart';
import '../widgets/ui_components.dart';

class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({
    super.key,
    required this.orderService,
    required this.onStartShopping,
  });

  final OrderService orderService;
  final VoidCallback onStartShopping;

  @override
  State<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen> {
  @override
  void initState() {
    super.initState();
    CustomerAuthService.instance.addListener(_onAuthChanged);
    widget.orderService.addListener(_onOrderServiceChanged);
    _loadOrdersIfLoggedIn();
  }

  @override
  void dispose() {
    CustomerAuthService.instance.removeListener(_onAuthChanged);
    widget.orderService.removeListener(_onOrderServiceChanged);
    super.dispose();
  }

  void _onAuthChanged() {
    if (mounted) {
      setState(() {});
      _loadOrdersIfLoggedIn();
    }
  }

  void _onOrderServiceChanged() {
    if (mounted) {
      setState(() {});
    }
  }

  Future<void> _loadOrdersIfLoggedIn() async {
    final user = CustomerAuthService.instance.currentUser;
    if (user != null && user.phoneNumber.trim().isNotEmpty) {
      await widget.orderService.fetchCustomerOrders(user.phoneNumber);
    }
  }

  Future<void> _promptLogin() async {
    final user = await CustomerAuthModal.show(
      context,
      api: widget.orderService.api,
    );
    if (user != null && mounted) {
      await widget.orderService.fetchCustomerOrders(user.phoneNumber);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authService = CustomerAuthService.instance;
    final isLoggedIn = authService.isLoggedIn;
    final currentUser = authService.currentUser;

    return Scaffold(
      backgroundColor: AppColors.canvas,
      appBar: AppBar(
        title: const Text('Đơn thuốc của tôi', style: TextStyle(fontWeight: FontWeight.w800)),
        actions: [
          if (isLoggedIn)
            IconButton(
              icon: const Icon(Icons.refresh),
              tooltip: 'Làm mới danh sách',
              onPressed: () => _loadOrdersIfLoggedIn(),
            ),
        ],
      ),
      body: !isLoggedIn
          ? _buildAuthGuard()
          : widget.orderService.isLoading && widget.orderService.orderHistory.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(color: AppColors.forest),
                      SizedBox(height: 16),
                      Text('Đang tải lịch sử đơn hàng...', style: TextStyle(color: AppColors.muted)),
                    ],
                  ),
                )
              : _buildOrderList(currentUser!),
    );
  }

  Widget _buildAuthGuard() {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: AppColors.forest.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.lock_person_outlined, size: 72, color: AppColors.forest),
            ),
            const SizedBox(height: 24),
            const Text(
              'Đăng nhập để xem lịch sử đơn hàng',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.ink),
            ),
            const SizedBox(height: 10),
            const Text(
              'Vì lý do bảo mật y tế và bảo vệ quyền riêng tư, lịch sử đơn thuốc và hóa đơn điện tử chỉ hiển thị cho khách hàng đã đăng nhập số điện thoại.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.muted, height: 1.5, fontSize: 13),
            ),
            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: FilledButton.icon(
                icon: const Icon(Icons.login),
                label: const Text('Đăng nhập bằng số điện thoại', style: TextStyle(fontWeight: FontWeight.w700)),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.forest,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _promptLogin,
              ),
            ),
            const SizedBox(height: 14),
            OutlinedButton(
              onPressed: widget.onStartShopping,
              style: OutlinedButton.styleFrom(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Tiếp tục xem danh mục thuốc'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderList(CustomerUser user) {
    final orders = widget.orderService.orderHistory;

    return RefreshIndicator(
      color: AppColors.forest,
      onRefresh: _loadOrdersIfLoggedIn,
      child: orders.isEmpty
          ? Center(
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: const BoxDecoration(color: AppColors.mint, shape: BoxShape.circle),
                      child: const Icon(Icons.receipt_long_outlined, size: 64, color: AppColors.forest),
                    ),
                    const SizedBox(height: 20),
                    const Text('Bạn chưa có đơn đặt thuốc nào',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 8),
                    Text(
                      'Tài khoản ${user.phoneNumber} (${user.fullName}) chưa ghi nhận đơn mua thuốc nào trên hệ thống chuỗi nhà thuốc.',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: AppColors.muted, height: 1.5, fontSize: 13),
                    ),
                    const SizedBox(height: 24),
                    FilledButton.icon(
                      icon: const Icon(Icons.medication_outlined),
                      label: const Text('Đặt thuốc ngay'),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.forest,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: widget.onStartShopping,
                    ),
                  ],
                ),
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: orders.length + 1,
              separatorBuilder: (_, __) => const SizedBox(height: 14),
              itemBuilder: (context, index) {
                if (index == 0) {
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: AppColors.forest.withValues(alpha: 0.06),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.forest.withValues(alpha: 0.15)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.account_circle_outlined, size: 20, color: AppColors.forest),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Khách hàng: ${user.fullName} · ${user.phoneNumber}',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppColors.forest,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }

                final order = orders[index - 1];
                return _buildOrderCard(order);
              },
            ),
    );
  }

  Widget _buildOrderCard(CustomerOrderResult order) {
    return Panel(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.receipt_outlined, color: AppColors.forest, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    order.invoiceNumber,
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                  ),
                ],
              ),
              _buildStatusBadge(order),
            ],
          ),
          if (order.isCancelled && order.cancelReason != null && order.cancelReason!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFFFEBEE),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFFFCDD2)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, size: 14, color: Color(0xFFC62828)),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      'Lý do hủy: ${order.cancelReason}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFFC62828),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.access_time, size: 14, color: AppColors.muted),
              const SizedBox(width: 6),
              Text(
                '${order.createdAt.hour.toString().padLeft(2, '0')}:${order.createdAt.minute.toString().padLeft(2, '0')} · ${order.createdAt.day.toString().padLeft(2, '0')}/${order.createdAt.month.toString().padLeft(2, '0')}/${order.createdAt.year}',
                style: const TextStyle(fontSize: 12, color: AppColors.muted),
              ),
            ],
          ),
          const Divider(height: 20),
          Row(
            children: [
              const Icon(Icons.store_outlined, size: 16, color: AppColors.muted),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  'Chi nhánh: ${order.branchName}',
                  style: const TextStyle(fontSize: 12, color: AppColors.ink),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              Icon(
                order.deliveryMethod == DeliveryMethod.delivery ? Icons.local_shipping_outlined : Icons.storefront_outlined,
                size: 16,
                color: AppColors.muted,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  order.deliveryAddress != null && order.deliveryAddress!.isNotEmpty
                      ? 'Giao hàng đến: ${order.deliveryAddress}'
                      : 'Nhận thuốc tại nhà thuốc chi nhánh',
                  style: const TextStyle(fontSize: 12, color: AppColors.ink),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.payment_outlined, size: 16, color: AppColors.muted),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  'Hình thức: ${order.paymentMethod == 'QR_CODE' ? 'Chuyển khoản VietQR' : 'Tiền mặt tại quầy / COD'}',
                  style: const TextStyle(fontSize: 12, color: AppColors.muted),
                ),
              ),
            ],
          ),
          if (order.items.isNotEmpty) ...[
            const Divider(height: 20),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Danh mục thuốc trong đơn:',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.muted),
                ),
                const SizedBox(height: 6),
                ...order.items.map((item) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 3),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              '• ${item.drugName} (x${item.quantity})',
                              style: const TextStyle(fontSize: 12, color: AppColors.ink),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            money(item.subTotal.toInt()),
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.ink),
                          ),
                        ],
                      ),
                    )),
              ],
            ),
          ],
          const Divider(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Tổng thanh toán', style: TextStyle(fontSize: 11, color: AppColors.muted)),
                  const SizedBox(height: 2),
                  Text(
                    money(order.totalAmount.toInt()),
                    style: TextStyle(
                      color: order.isCancelled ? AppColors.muted : AppColors.forest,
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
                      decoration: order.isCancelled ? TextDecoration.lineThrough : null,
                    ),
                  ),
                ],
              ),
              _buildDigitalSignatureBadge(order),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(CustomerOrderResult order) {
    if (order.isCancelled) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: const Color(0xFFFFEBEE),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Text(
          'ĐÃ HỦY',
          style: TextStyle(
            color: Color(0xFFC62828),
            fontWeight: FontWeight.w800,
            fontSize: 11,
          ),
        ),
      );
    }

    if (order.isPendingPayment) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: const Color(0xFFFFF8E1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Text(
          'CHỜ THANH TOÁN TẠI QUẦY',
          style: TextStyle(
            color: Color(0xFFE65100),
            fontWeight: FontWeight.w800,
            fontSize: 11,
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.mint,
        borderRadius: BorderRadius.circular(8),
      ),
      child: const Text(
        'ĐÃ THANH TOÁN',
        style: TextStyle(
          color: AppColors.forest,
          fontWeight: FontWeight.w800,
          fontSize: 11,
        ),
      ),
    );
  }

  Widget _buildDigitalSignatureBadge(CustomerOrderResult order) {
    if (order.isCancelled) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: const Color(0xFFF5F5F5),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Row(
          children: [
            Icon(Icons.remove_circle_outline, size: 14, color: AppColors.muted),
            SizedBox(width: 4),
            Text(
              'ĐÃ THU HỒI CHỮ KÝ',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: AppColors.muted,
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.mint,
        borderRadius: BorderRadius.circular(8),
      ),
      child: const Row(
        children: [
          Icon(Icons.verified_outlined, size: 14, color: AppColors.forest),
          SizedBox(width: 4),
          Text(
            'ĐÃ KÝ SỐ HSM',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              color: AppColors.forest,
            ),
          ),
        ],
      ),
    );
  }
}
