import 'package:flutter/material.dart';
import '../core/network/api_client.dart';
import '../core/theme/app_theme.dart';
import '../services/customer_auth_service.dart';

class CustomerAuthModal extends StatefulWidget {
  const CustomerAuthModal({
    super.key,
    this.initialPhone = '',
    this.initialName = '',
    this.initialAddress = '',
    this.api,
    this.branchId,
    this.initialTabIndex = 0,
    this.onAuthenticated,
  });

  final String initialPhone;
  final String initialName;
  final String initialAddress;
  final ApiClient? api;
  final String? branchId;
  final int initialTabIndex;
  final ValueChanged<CustomerUser>? onAuthenticated;

  static Future<CustomerUser?> show(
    BuildContext context, {
    String initialPhone = '',
    String initialName = '',
    String initialAddress = '',
    ApiClient? api,
    String? branchId,
    int initialTabIndex = 0,
  }) {
    return showModalBottomSheet<CustomerUser>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => CustomerAuthModal(
        initialPhone: initialPhone,
        initialName: initialName,
        initialAddress: initialAddress,
        api: api,
        branchId: branchId,
        initialTabIndex: initialTabIndex,
        onAuthenticated: (user) => Navigator.pop(ctx, user),
      ),
    );
  }

  @override
  State<CustomerAuthModal> createState() => _CustomerAuthModalState();
}

class _CustomerAuthModalState extends State<CustomerAuthModal>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  // Form Đăng nhập
  final _loginFormKey = GlobalKey<FormState>();
  late final TextEditingController _loginPhoneController;

  // Form Đăng ký
  final _registerFormKey = GlobalKey<FormState>();
  late final TextEditingController _regPhoneController;
  late final TextEditingController _regNameController;
  late final TextEditingController _regAddressController;

  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 2,
      vsync: this,
      initialIndex: widget.initialTabIndex,
    );

    _loginPhoneController = TextEditingController(
      text: widget.initialPhone.isEmpty ? '0908123456' : widget.initialPhone,
    );

    _regPhoneController = TextEditingController(
      text: widget.initialPhone.isEmpty ? '0908123456' : widget.initialPhone,
    );
    _regNameController = TextEditingController(
      text: widget.initialName.isEmpty ? 'Nguyễn Văn An' : widget.initialName,
    );
    _regAddressController = TextEditingController(text: widget.initialAddress);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _loginPhoneController.dispose();
    _regPhoneController.dispose();
    _regNameController.dispose();
    _regAddressController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_loginFormKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    try {
      final user = await CustomerAuthService.instance.authenticateOrRegister(
        phoneNumber: _loginPhoneController.text.trim(),
        fullName: '',
        api: widget.api,
        branchId: widget.branchId,
      );

      if (mounted) {
        widget.onAuthenticated?.call(user);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Đăng nhập thất bại: $e'),
            backgroundColor: const Color(0xFFC62828),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleRegister() async {
    if (!_registerFormKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    try {
      final user = await CustomerAuthService.instance.authenticateOrRegister(
        phoneNumber: _regPhoneController.text.trim(),
        fullName: _regNameController.text.trim(),
        address: _regAddressController.text.trim().isEmpty ? null : _regAddressController.text.trim(),
        api: widget.api,
        branchId: widget.branchId,
      );

      if (mounted) {
        widget.onAuthenticated?.call(user);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Đăng ký thất bại: $e'),
            backgroundColor: const Color(0xFFC62828),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

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
          const SizedBox(height: 16),

          // TabBar Đăng nhập / Đăng ký
          Container(
            height: 46,
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(14),
            ),
            child: TabBar(
              controller: _tabController,
              indicatorSize: TabBarIndicatorSize.tab,
              dividerColor: Colors.transparent,
              indicator: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              labelColor: AppColors.forest,
              labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
              unselectedLabelColor: AppColors.muted,
              tabs: const [
                Tab(text: 'Đăng nhập'),
                Tab(text: 'Đăng ký thành viên'),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // TabBarView Content
          SizedBox(
            height: 260,
            child: TabBarView(
              controller: _tabController,
              children: [
                // Tab 1: Đăng nhập
                Form(
                  key: _loginFormKey,
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text(
                          'Chào mừng bạn trở lại!',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Nhập số điện thoại để đồng bộ đơn thuốc và tích điểm thưởng.',
                          style: TextStyle(fontSize: 12, color: AppColors.muted),
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _loginPhoneController,
                          keyboardType: TextInputType.phone,
                          decoration: const InputDecoration(
                            labelText: 'Số điện thoại của bạn *',
                            prefixIcon: Icon(Icons.phone_android_outlined),
                            hintText: 'Ví dụ: 0908123456',
                          ),
                          validator: (val) {
                            if (val == null || val.trim().isEmpty) return 'Vui lòng nhập số điện thoại';
                            final clean = val.trim().replaceAll(RegExp(r'\D'), '');
                            if (clean.length < 9 || clean.length > 15) return 'Số điện thoại không hợp lệ (9-15 số)';
                            return null;
                          },
                        ),
                        const SizedBox(height: 20),
                        FilledButton(
                          onPressed: _isLoading ? null : _handleLogin,
                          child: _isLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Text('Đăng nhập ngay'),
                        ),
                      ],
                    ),
                  ),
                ),

                // Tab 2: Đăng ký thành viên
                Form(
                  key: _registerFormKey,
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        TextFormField(
                          controller: _regPhoneController,
                          keyboardType: TextInputType.phone,
                          decoration: const InputDecoration(
                            labelText: 'Số điện thoại *',
                            prefixIcon: Icon(Icons.phone_android_outlined),
                          ),
                          validator: (val) {
                            if (val == null || val.trim().isEmpty) return 'Vui lòng nhập số điện thoại';
                            final clean = val.trim().replaceAll(RegExp(r'\D'), '');
                            if (clean.length < 9 || clean.length > 15) return 'Số điện thoại không hợp lệ (9-15 số)';
                            return null;
                          },
                        ),
                        const SizedBox(height: 10),
                        TextFormField(
                          controller: _regNameController,
                          decoration: const InputDecoration(
                            labelText: 'Họ và tên người nhận thuốc *',
                            prefixIcon: Icon(Icons.badge_outlined),
                          ),
                          validator: (val) => val == null || val.trim().isEmpty ? 'Vui lòng nhập họ và tên' : null,
                        ),
                        const SizedBox(height: 10),
                        TextFormField(
                          controller: _regAddressController,
                          decoration: const InputDecoration(
                            labelText: 'Địa chỉ nhận hàng (Tùy chọn)',
                            prefixIcon: Icon(Icons.location_on_outlined),
                          ),
                        ),
                        const SizedBox(height: 16),
                        FilledButton(
                          onPressed: _isLoading ? null : _handleRegister,
                          child: _isLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Text('Đăng ký thành viên'),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Thông tin khách hàng được mã hóa và bảo mật an toàn theo tiêu chuẩn Y Tế.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 10, color: AppColors.muted),
          ),
        ],
      ),
    );
  }
}
