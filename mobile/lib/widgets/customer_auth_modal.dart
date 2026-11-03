import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../services/customer_auth_service.dart';

class CustomerAuthModal extends StatefulWidget {
  const CustomerAuthModal({
    super.key,
    this.initialPhone = '',
    this.initialName = '',
    this.onAuthenticated,
  });

  final String initialPhone;
  final String initialName;
  final ValueChanged<CustomerUser>? onAuthenticated;

  static Future<CustomerUser?> show(
    BuildContext context, {
    String initialPhone = '',
    String initialName = '',
  }) {
    return showModalBottomSheet<CustomerUser>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => CustomerAuthModal(
        initialPhone: initialPhone,
        initialName: initialName,
        onAuthenticated: (user) => Navigator.pop(ctx, user),
      ),
    );
  }

  @override
  State<CustomerAuthModal> createState() => _CustomerAuthModalState();
}

class _CustomerAuthModalState extends State<CustomerAuthModal> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _phoneController;
  late final TextEditingController _nameController;
  final _passwordController = TextEditingController(text: '123456');
  final _addressController = TextEditingController();

  bool _isNewCustomer = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _phoneController = TextEditingController(text: widget.initialPhone.isEmpty ? '0908123456' : widget.initialPhone);
    _nameController = TextEditingController(text: widget.initialName.isEmpty ? 'Nguyễn Văn An' : widget.initialName);
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _nameController.dispose();
    _passwordController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final user = await CustomerAuthService.instance.authenticateOrRegister(
        phoneNumber: _phoneController.text.trim(),
        fullName: _nameController.text.trim(),
        address: _addressController.text.trim().isEmpty ? null : _addressController.text.trim(),
        password: _passwordController.text.trim(),
      );

      if (mounted) {
        widget.onAuthenticated?.call(user);
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
      padding: EdgeInsets.fromLTRB(24, 20, 24, 20 + bottomInset),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
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
              const SizedBox(height: 18),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.mint,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.person_outline, color: AppColors.forest, size: 24),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Xác thực tài khoản Người mua',
                            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
                        SizedBox(height: 2),
                        Text('Đăng nhập hoặc đăng ký để bảo mật đơn thuốc',
                            style: TextStyle(fontSize: 11, color: AppColors.muted)),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Phone number input
              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Số điện thoại của bạn *',
                  prefixIcon: Icon(Icons.phone_android_outlined),
                  hintText: 'Ví dụ: 0908123456',
                ),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) return 'Vui lòng nhập số điện thoại';
                  if (val.trim().length < 9) return 'Số điện thoại không hợp lệ';
                  return null;
                },
              ),
              const SizedBox(height: 14),

              // Full name input
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Họ và tên người nhận thuốc *',
                  prefixIcon: Icon(Icons.badge_outlined),
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'Vui lòng nhập họ và tên' : null,
              ),
              const SizedBox(height: 14),

              // Optional address
              TextFormField(
                controller: _addressController,
                decoration: const InputDecoration(
                  labelText: 'Địa chỉ giao hàng (Tùy chọn)',
                  prefixIcon: Icon(Icons.location_on_outlined),
                  hintText: 'Ví dụ: 123 Hai Bà Trưng, Quận 1',
                ),
              ),
              const SizedBox(height: 14),

              // Password input
              TextFormField(
                controller: _passwordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Mật khẩu bảo vệ tài khoản',
                  prefixIcon: Icon(Icons.lock_outline),
                ),
                validator: (val) => val == null || val.length < 4 ? 'Mật khẩu tối thiểu 4 ký tự' : null,
              ),
              const SizedBox(height: 14),

              Row(
                children: [
                  Checkbox(
                    value: _isNewCustomer,
                    activeColor: AppColors.forest,
                    onChanged: (val) => setState(() => _isNewCustomer = val ?? false),
                  ),
                  const Expanded(
                    child: Text('Tôi là khách hàng mới (Đăng ký thành viên tích điểm)',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              FilledButton(
                onPressed: _isLoading ? null : _handleSubmit,
                child: _isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text(_isNewCustomer ? 'Đăng ký & Tiến hành Đặt thuốc' : 'Đăng nhập & Tiếp tục'),
              ),
              const SizedBox(height: 10),
              const Text(
                'Cam kết bảo mật thông tin đơn thuốc & lịch sử khám bệnh theo tiêu chuẩn Bộ Y Tế.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 10, color: AppColors.muted),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

