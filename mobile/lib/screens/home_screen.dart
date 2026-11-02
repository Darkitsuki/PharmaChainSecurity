import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../data/demo_data.dart';
import '../data/models/drug_model.dart';
import '../services/cart_service.dart';
import '../services/customer_auth_service.dart';
import '../services/drug_service.dart';
import '../widgets/customer_auth_modal.dart';
import '../widgets/ui_components.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({
    super.key,
    required this.drugService,
    required this.cartService,
    required this.onNavigateToCart,
    required this.onNavigateToOrders,
    this.onOpenStaffPortal,
  });

  final DrugService drugService;
  final CartService cartService;
  final VoidCallback onNavigateToCart;
  final VoidCallback onNavigateToOrders;
  final VoidCallback? onOpenStaffPortal;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String searchQuery = '';
  String selectedCategory = 'Tất cả';
  List<DrugModel> drugs = [];
  bool isLoading = true;

  final categories = [
    'Tất cả',
    'Hạ sốt - Giảm đau',
    'Hô hấp - Trị ho',
    'Tiêu hóa - Dạ dày',
    'Vitamin & Khoáng chất',
    'Chăm sóc da - Da liễu',
  ];

  @override
  void initState() {
    super.initState();
    _loadDrugs();
  }

  Future<void> _loadDrugs() async {
    setState(() => isLoading = true);
    try {
      final list = await widget.drugService.getDrugs(search: searchQuery);
      if (mounted) {
        setState(() {
          drugs = list;
          isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => isLoading = false);
    }
  }

  void _onCategorySelected(String category) {
    setState(() => selectedCategory = category);
  }

  List<DrugModel> get filteredDrugs {
    return drugs.where((d) {
      if (selectedCategory != 'Tất cả' && d.category != selectedCategory) {
        return false;
      }
      return true;
    }).toList();
  }

  void _showPrescriptionDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.camera_alt_outlined, color: AppColors.forest, size: 28),
            SizedBox(width: 10),
            Text('Gửi đơn thuốc Bác sĩ', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Chụp ảnh đơn thuốc của Bác sĩ hoặc giấy khám bệnh. Dược sĩ chuyên môn của chúng tôi sẽ gọi điện xác nhận và hướng dẫn chi tiết liều dùng.',
              style: TextStyle(height: 1.5, color: AppColors.muted, fontSize: 13),
            ),
            SizedBox(height: 16),
            Panel(
              padding: EdgeInsets.all(14),
              child: Row(
                children: [
                  Icon(Icons.verified_user_outlined, color: AppColors.forest, size: 20),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text('Bảo mật thông tin bệnh án 100% theo quy định Bộ Y Tế.',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Đóng')),
          FilledButton.icon(
            icon: const Icon(Icons.add_a_photo_outlined, size: 18),
            label: const Text('Chụp đơn thuốc ngay'),
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Đã đính kèm ảnh đơn thuốc mẫu. Bạn có thể tiến hành đặt thuốc!'),
                  backgroundColor: AppColors.forest,
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cart = widget.cartService;

    return Scaffold(
      backgroundColor: AppColors.canvas,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(color: AppColors.mint, borderRadius: BorderRadius.circular(8)),
              child: const Icon(Icons.local_pharmacy_outlined, color: AppColors.forest, size: 20),
            ),
            const SizedBox(width: 8),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('PharmaSecure', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
                Text('Nhà thuốc trực tuyến · Đặt giao 2H', style: TextStyle(fontSize: 10, color: AppColors.muted)),
              ],
            ),
          ],
        ),
        actions: [
          ListenableBuilder(
            listenable: CustomerAuthService.instance,
            builder: (context, _) {
              final customer = CustomerAuthService.instance.currentUser;
              return IconButton(
                tooltip: customer != null ? 'Tài khoản: ${customer.fullName}' : 'Đăng nhập / Đăng ký',
                icon: Icon(
                  customer != null ? Icons.account_circle : Icons.account_circle_outlined,
                  color: customer != null ? AppColors.forest : null,
                ),
                onPressed: () => CustomerAuthModal.show(context),
              );
            },
          ),
          IconButton(
            tooltip: 'Đơn thuốc đã đặt',
            icon: const Icon(Icons.receipt_long_outlined),
            onPressed: widget.onNavigateToOrders,
          ),
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                tooltip: 'Giỏ hàng',
                icon: const Icon(Icons.shopping_cart_outlined),
                onPressed: widget.onNavigateToCart,
              ),
              ListenableBuilder(
                listenable: cart,
                builder: (context, _) {
                  if (cart.totalQuantity == 0) return const SizedBox.shrink();
                  return Positioned(
                    top: 6,
                    right: 6,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(color: AppColors.coral, shape: BoxShape.circle),
                      constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                      child: Text(
                        '${cart.totalQuantity}',
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
          if (widget.onOpenStaffPortal != null)
            IconButton(
              tooltip: 'Cổng Dược sĩ / Quản trị nội bộ',
              icon: const Icon(Icons.badge_outlined),
              onPressed: widget.onOpenStaffPortal,
            ),
          const SizedBox(width: 8),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // 1. Search Box
          TextField(
            onChanged: (val) {
              searchQuery = val;
              _loadDrugs();
            },
            decoration: InputDecoration(
              hintText: 'Tìm biệt dược, hoạt chất, triệu chứng...',
              prefixIcon: const Icon(Icons.search, color: AppColors.forest),
              suffixIcon: searchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, size: 18),
                      onPressed: () {
                        searchQuery = '';
                        _loadDrugs();
                      },
                    )
                  : null,
            ),
          ),
          const SizedBox(height: 16),

          // 2. Banner: Prescription Order
          InkWell(
            onTap: _showPrescriptionDialog,
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
                  BoxShadow(color: Color(0x33246B5B), blurRadius: 10, offset: Offset(0, 4))
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0x33FFFFFF),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.document_scanner_outlined, color: Colors.white, size: 28),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Có đơn thuốc của Bác sĩ?',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Chụp ảnh gửi ngay để Dược sĩ tư vấn & soạn thuốc đúng toa.',
                          style: TextStyle(color: Color(0xFFD6EAE3), fontSize: 11, height: 1.4),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.arrow_forward_ios, color: Colors.white, size: 14),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // 3. Category Chips
          const Text('Danh mục nhóm bệnh', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
          const SizedBox(height: 10),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: categories.map((cat) {
                final isSelected = selectedCategory == cat;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(cat),
                    selected: isSelected,
                    onSelected: (_) => _onCategorySelected(cat),
                    selectedColor: AppColors.mint,
                    checkmarkColor: AppColors.forest,
                    labelStyle: TextStyle(
                      color: isSelected ? AppColors.forest : AppColors.ink,
                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.normal,
                      fontSize: 12,
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 20),

          // 4. Product List Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                selectedCategory == 'Tất cả' ? 'Dược phẩm phổ biến' : selectedCategory,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
              ),
              Text(
                '${filteredDrugs.length} sản phẩm',
                style: const TextStyle(fontSize: 12, color: AppColors.muted),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // 5. Product Grid
          if (isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(40),
                child: CircularProgressIndicator(),
              ),
            )
          else if (filteredDrugs.isEmpty)
            const Padding(
              padding: EdgeInsets.all(32),
              child: Center(
                child: Column(
                  children: [
                    Icon(Icons.search_off_outlined, size: 48, color: AppColors.muted),
                    SizedBox(height: 12),
                    Text('Không tìm thấy thuốc phù hợp.', style: TextStyle(color: AppColors.muted)),
                  ],
                ),
              ),
            )
          else
            for (final drug in filteredDrugs)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Panel(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          color: AppColors.mint,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.medication_outlined, color: AppColors.forest, size: 28),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    drug.name,
                                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                                  ),
                                ),
                                if (drug.prescriptionRequired)
                                  const StatusBadge('KÊ ĐƠN (Rx)', warning: true),
                              ],
                            ),
                            const SizedBox(height: 4),
                            if (drug.activeIngredient != null && drug.activeIngredient!.isNotEmpty)
                              Text(
                                'Hoạt chất: ${drug.activeIngredient}',
                                style: const TextStyle(fontSize: 11, color: AppColors.muted),
                              ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '${money(drug.price.toInt())} / ${drug.unit}',
                                  style: const TextStyle(
                                    color: AppColors.forest,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 14,
                                  ),
                                ),
                                FilledButton.tonalIcon(
                                  style: FilledButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    minimumSize: Size.zero,
                                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  ),
                                  icon: const Icon(Icons.add_shopping_cart, size: 16),
                                  label: const Text('Thêm giỏ', style: TextStyle(fontSize: 12)),
                                  onPressed: () {
                                    widget.cartService.addItem(drug);
                                    ScaffoldMessenger.of(context).hideCurrentSnackBar();
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('Đã thêm "${drug.name}" vào giỏ hàng'),
                                        duration: const Duration(seconds: 2),
                                        action: SnackBarAction(
                                          label: 'Xem giỏ',
                                          textColor: Colors.amber,
                                          onPressed: widget.onNavigateToCart,
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
        ],
      ),
    );
  }
}

