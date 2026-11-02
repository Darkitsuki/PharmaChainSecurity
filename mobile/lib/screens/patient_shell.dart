import 'package:flutter/material.dart';
import '../core/auth/auth_session.dart';
import '../core/theme/app_theme.dart';
import '../services/cart_service.dart';
import '../services/drug_service.dart';
import '../services/order_service.dart';
import 'cart_screen.dart';
import 'home_screen.dart';
import 'medicine_screen.dart';
import 'order_history_screen.dart';

class PatientShell extends StatefulWidget {
  const PatientShell({
    super.key,
    this.session,
    this.onExit,
    this.onOpenStaffPortal,
    this.initialTab = 0,
  });

  final AuthSession? session;
  final VoidCallback? onExit;
  final VoidCallback? onOpenStaffPortal;
  final int initialTab;

  @override
  State<PatientShell> createState() => _PatientShellState();
}

class _PatientShellState extends State<PatientShell> {
  late int _currentIndex = widget.initialTab;
  late final CartService _cartService;
  late final DrugService _drugService;
  late final OrderService _orderService;

  @override
  void initState() {
    super.initState();
    _cartService = CartService();
    _drugService = DrugService(
      api: widget.session?.api,
      tokenProvider: () => widget.session?.token,
    );
    _orderService = OrderService(
      api: widget.session?.api,
      tokenProvider: () => widget.session?.token,
      defaultBranchId: widget.session?.user?.branchId,
    );
  }

  @override
  void dispose() {
    _cartService.dispose();
    super.dispose();
  }

  void _switchTab(int index) {
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      HomeScreen(
        drugService: _drugService,
        cartService: _cartService,
        onNavigateToCart: () => _switchTab(2),
        onNavigateToOrders: () => _switchTab(3),
        onOpenStaffPortal: widget.onOpenStaffPortal,
      ),
      const MedicineScreen(),
      CartScreen(
        cartService: _cartService,
        orderService: _orderService,
        onContinueShopping: () => _switchTab(0),
        onOrderPlaced: () => _switchTab(3),
      ),
      OrderHistoryScreen(
        orderService: _orderService,
        onStartShopping: () => _switchTab(0),
      ),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: AppColors.line)),
        ),
        child: ListenableBuilder(
          listenable: _cartService,
          builder: (context, _) {
            final cartCount = _cartService.totalQuantity;

            return BottomNavigationBar(
              currentIndex: _currentIndex,
              onTap: _switchTab,
              type: BottomNavigationBarType.fixed,
              selectedItemColor: AppColors.forest,
              unselectedItemColor: AppColors.muted,
              selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11),
              unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, fontSize: 11),
              backgroundColor: Colors.white,
              elevation: 8,
              items: [
                const BottomNavigationBarItem(
                  icon: Icon(Icons.storefront_outlined),
                  activeIcon: Icon(Icons.storefront),
                  label: 'Trang chủ',
                ),
                const BottomNavigationBarItem(
                  icon: Icon(Icons.medication_outlined),
                  activeIcon: Icon(Icons.medication),
                  label: 'Danh mục',
                ),
                BottomNavigationBarItem(
                  icon: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      const Icon(Icons.shopping_cart_outlined),
                      if (cartCount > 0)
                        Positioned(
                          top: -4,
                          right: -8,
                          child: Container(
                            padding: const EdgeInsets.all(3),
                            decoration: const BoxDecoration(color: AppColors.coral, shape: BoxShape.circle),
                            constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                            child: Text(
                              '$cartCount',
                              style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ),
                    ],
                  ),
                  activeIcon: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      const Icon(Icons.shopping_cart),
                      if (cartCount > 0)
                        Positioned(
                          top: -4,
                          right: -8,
                          child: Container(
                            padding: const EdgeInsets.all(3),
                            decoration: const BoxDecoration(color: AppColors.coral, shape: BoxShape.circle),
                            constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                            child: Text(
                              '$cartCount',
                              style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ),
                    ],
                  ),
                  label: 'Giỏ hàng',
                ),
                const BottomNavigationBarItem(
                  icon: Icon(Icons.receipt_long_outlined),
                  activeIcon: Icon(Icons.receipt_long),
                  label: 'Đơn của tôi',
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
