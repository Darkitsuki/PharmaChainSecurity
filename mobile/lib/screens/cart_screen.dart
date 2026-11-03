import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../data/demo_data.dart';
import '../services/cart_service.dart';
import '../services/order_service.dart';
import '../widgets/ui_components.dart';
import 'order_checkout_screen.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({
    super.key,
    required this.cartService,
    required this.orderService,
    required this.onContinueShopping,
    required this.onOrderPlaced,
  });

  final CartService cartService;
  final OrderService orderService;
  final VoidCallback onContinueShopping;
  final VoidCallback onOrderPlaced;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      appBar: AppBar(
        title: const Text('Giỏ hàng của bạn', style: TextStyle(fontWeight: FontWeight.w800)),
        actions: [
          ListenableBuilder(
            listenable: cartService,
            builder: (context, _) {
              if (cartService.isEmpty) return const SizedBox.shrink();
              return TextButton.icon(
                icon: const Icon(Icons.delete_sweep_outlined, size: 18, color: AppColors.coral),
                label: const Text('Xóa tất cả', style: TextStyle(color: AppColors.coral, fontSize: 13)),
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      title: const Text('Xác nhận xóa'),
                      content: const Text('Bạn có chắc muốn xóa toàn bộ thuốc trong giỏ hàng?'),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Hủy')),
                        FilledButton(
                          style: FilledButton.styleFrom(backgroundColor: AppColors.coral),
                          onPressed: () {
                            cartService.clear();
                            Navigator.pop(ctx);
                          },
                          child: const Text('Xóa'),
                        ),
                      ],
                    ),
                  );
                },
              );
            },
          ),
        ],
      ),
      body: ListenableBuilder(
        listenable: cartService,
        builder: (context, _) {
          if (cartService.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: const BoxDecoration(color: AppColors.mint, shape: BoxShape.circle),
                      child: const Icon(Icons.shopping_cart_outlined, size: 64, color: AppColors.forest),
                    ),
                    const SizedBox(height: 20),
                    const Text('Giỏ hàng của bạn đang trống',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 8),
                    const Text('Hãy chọn các sản phẩm chăm sóc sức khỏe và thuốc phù hợp để tiếp tục.',
                        textAlign: TextAlign.center, style: TextStyle(color: AppColors.muted, height: 1.5)),
                    const SizedBox(height: 24),
                    FilledButton.icon(
                      icon: const Icon(Icons.medication_outlined),
                      label: const Text('Khám phá thuốc ngay'),
                      onPressed: onContinueShopping,
                    ),
                  ],
                ),
              ),
            );
          }

          final items = cartService.items;

          return Column(
            children: [
              if (cartService.hasPrescriptionItems)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  color: const Color(0xFFFFF7ED),
                  child: const Row(
                    children: [
                      Icon(Icons.info_outline, color: Color(0xFFC2410C), size: 20),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Giỏ hàng có thuốc kê đơn (Rx). Bạn cần tải ảnh đơn thuốc của Bác sĩ khi thanh toán.',
                          style: TextStyle(color: Color(0xFF9A3412), fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                ),
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final item = items[index];
                    return Panel(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: AppColors.mint,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(Icons.medication_outlined, color: AppColors.forest),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(item.drug.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                                    const SizedBox(height: 4),
                                    Text('${money(item.drug.price.toInt())} / ${item.drug.unit}',
                                        style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                                  ],
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.close, size: 18, color: AppColors.muted),
                                onPressed: () => cartService.removeItem(item),
                              ),
                            ],
                          ),
                          const Divider(height: 20),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.remove_circle_outline),
                                    onPressed: () => cartService.updateQuantity(item, item.quantity - 1),
                                  ),
                                  Container(
                                    constraints: const BoxConstraints(minWidth: 32),
                                    alignment: Alignment.center,
                                    child: Text('${item.quantity}',
                                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.add_circle_outline, color: AppColors.forest),
                                    onPressed: () => cartService.updateQuantity(item, item.quantity + 1),
                                  ),
                                ],
                              ),
                              Text(
                                money(item.subtotal.toInt()),
                                style: const TextStyle(
                                  color: AppColors.forest,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 15,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),

              // Bottom Total & Order Button
              Container(
                padding: const EdgeInsets.all(20),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  border: Border(top: BorderSide(color: AppColors.line)),
                  boxShadow: [BoxShadow(color: Color(0x0D000000), blurRadius: 10, offset: Offset(0, -4))],
                ),
                child: SafeArea(
                  top: false,
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Tổng thanh toán', style: TextStyle(color: AppColors.muted, fontSize: 12)),
                              Text('Đã gồm VAT & Phí soạn hàng', style: TextStyle(color: AppColors.muted, fontSize: 10)),
                            ],
                          ),
                          Text(
                            money(cartService.totalPrice.toInt()),
                            style: const TextStyle(
                              color: AppColors.forest,
                              fontWeight: FontWeight.w800,
                              fontSize: 20,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          icon: const Icon(Icons.shopping_bag_outlined),
                          label: const Text('Tiến hành Đặt thuốc'),
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => OrderCheckoutScreen(
                                  cartService: cartService,
                                  orderService: orderService,
                                  onOrderCompleted: () {
                                    cartService.clear();
                                    onOrderPlaced();
                                  },
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

