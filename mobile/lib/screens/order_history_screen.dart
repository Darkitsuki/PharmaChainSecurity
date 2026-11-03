import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../data/demo_data.dart';
import '../services/order_service.dart';
import '../widgets/ui_components.dart';

class OrderHistoryScreen extends StatelessWidget {
  const OrderHistoryScreen({
    super.key,
    required this.orderService,
    required this.onStartShopping,
  });

  final OrderService orderService;
  final VoidCallback onStartShopping;

  @override
  Widget build(BuildContext context) {
    final orders = orderService.orderHistory;

    return Scaffold(
      backgroundColor: AppColors.canvas,
      appBar: AppBar(
        title: const Text('Đơn thuốc của tôi', style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      body: orders.isEmpty
          ? Center(
              child: Padding(
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
                    const Text(
                      'Tất cả các đơn đặt thuốc và hóa đơn điện tử có chữ ký số của bạn sẽ hiển thị tại đây.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.muted, height: 1.5),
                    ),
                    const SizedBox(height: 24),
                    FilledButton.icon(
                      icon: const Icon(Icons.medication_outlined),
                      label: const Text('Đặt thuốc ngay'),
                      onPressed: onStartShopping,
                    ),
                  ],
                ),
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: orders.length,
              separatorBuilder: (_, __) => const SizedBox(height: 14),
              itemBuilder: (context, index) {
                final order = orders[index];
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
                          const StatusBadge('ĐANG XỬ LÝ'),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          const Icon(Icons.access_time, size: 14, color: AppColors.muted),
                          const SizedBox(width: 6),
                          Text(
                            '${order.createdAt.hour.toString().padLeft(2, '0')}:${order.createdAt.minute.toString().padLeft(2, '0')} · ${order.createdAt.day}/${order.createdAt.month}/${order.createdAt.year}',
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
                              'Nhà thuốc: ${order.branchName}',
                              style: const TextStyle(fontSize: 12, color: AppColors.ink),
                            ),
                          ),
                        ],
                      ),
                      if (order.deliveryAddress != null) ...[
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Icon(Icons.location_on_outlined, size: 16, color: AppColors.muted),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                'Giao đến: ${order.deliveryAddress}',
                                style: const TextStyle(fontSize: 12, color: AppColors.ink),
                              ),
                            ),
                          ],
                        ),
                      ],
                      const SizedBox(height: 12),
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
                                style: const TextStyle(
                                  color: AppColors.forest,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 16,
                                ),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: AppColors.mint,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Row(
                              children: [
                                Icon(Icons.verified_outlined, size: 14, color: AppColors.forest),
                                SizedBox(width: 4),
                                Text('ĐÃ KÝ SỐ HSM',
                                    style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w800,
                                        color: AppColors.forest)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}

