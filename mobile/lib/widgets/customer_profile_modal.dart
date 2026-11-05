import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../services/customer_auth_service.dart';

class CustomerProfileModal extends StatelessWidget {
  const CustomerProfileModal({
    super.key,
    required this.user,
    this.onViewOrders,
    this.onLoggedOut,
  });

  final CustomerUser user;
  final VoidCallback? onViewOrders;
  final VoidCallback? onLoggedOut;

  static Future<void> show(
    BuildContext context, {
    VoidCallback? onViewOrders,
  }) {
    final currentUser = CustomerAuthService.instance.currentUser;
    if (currentUser == null) return Future.value();

    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => CustomerProfileModal(
        user: currentUser,
        onViewOrders: () {
          Navigator.pop(ctx);
          onViewOrders?.call();
        },
        onLoggedOut: () {
          CustomerAuthService.instance.logout();
          Navigator.pop(ctx);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Đã đăng xuất tài khoản người mua.'),
              backgroundColor: AppColors.ink,
              duration: Duration(seconds: 2),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final money = user.totalSpent > 0
        ? '${user.totalSpent.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.')} đ'
        : '0 đ';

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.fromLTRB(24, 20, 24, 24 + bottomInset),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Header Profile
          Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: AppColors.mint,
                child: Text(
                  user.fullName.isNotEmpty ? user.fullName[0].toUpperCase() : 'K',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: AppColors.forest,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.fullName,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.ink,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      user.phoneNumber,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: AppColors.muted,
                      ),
                    ),
                    if (user.customerCode != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        'Mã TV: ${user.customerCode}',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.forest,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // KPI Cards: Points & Total Spent
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0FDF4),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFBBF7D0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.stars, color: Color(0xFF16A34A), size: 18),
                          SizedBox(width: 6),
                          Text('Điểm thưởng', style: TextStyle(fontSize: 11, color: AppColors.muted)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${user.points} điểm',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF16A34A),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.shopping_bag_outlined, color: AppColors.muted, size: 18),
                          SizedBox(width: 6),
                          Text('Đã chi tiêu', style: TextStyle(fontSize: 11, color: AppColors.muted)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        money,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppColors.ink,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          if (user.address != null && user.address!.isNotEmpty) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Row(
                children: [
                  const Icon(Icons.location_on_outlined, color: AppColors.muted, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Địa chỉ nhận thuốc mặc định:',
                            style: TextStyle(fontSize: 11, color: AppColors.muted)),
                        Text(user.address!,
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Actions
          if (onViewOrders != null) ...[
            OutlinedButton.icon(
              icon: const Icon(Icons.receipt_long_outlined),
              label: const Text('Xem đơn thuốc đã đặt'),
              onPressed: onViewOrders,
            ),
            const SizedBox(height: 10),
          ],

          TextButton.icon(
            icon: const Icon(Icons.logout, color: AppColors.coral),
            label: const Text('Đăng xuất tài khoản người mua',
                style: TextStyle(color: AppColors.coral, fontWeight: FontWeight.w600)),
            onPressed: onLoggedOut,
          ),
        ],
      ),
    );
  }
}

