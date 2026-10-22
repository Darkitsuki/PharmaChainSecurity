import 'package:flutter/material.dart';
import '../core/theme/app_theme.dart';
import '../widgets/ui_components.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen(
      {super.key, required this.onSubmit, this.busy = false, this.error});
  final Future<void> Function(String username, String password)? onSubmit;
  final bool busy;
  final String? error;
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool obscure = true;
  final username = TextEditingController();
  final password = TextEditingController();
  final formKey = GlobalKey<FormState>();
  Future<void> submit() async {
    if (widget.busy ||
        widget.onSubmit == null ||
        !formKey.currentState!.validate()) {
      return;
    }
    FocusScope.of(context).unfocus();
    await widget.onSubmit!(username.text, password.text);
    if (mounted) password.clear();
  }

  @override
  void dispose() {
    username.dispose();
    password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      body: SafeArea(
          child: Center(
              child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 440),
                      child: Form(
                          key: formKey,
                          child: Column(children: [
                            const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.local_pharmacy_outlined,
                                      color: AppColors.forest),
                                  SizedBox(width: 10),
                                  Text('PharmaSecure',
                                      style: TextStyle(
                                          fontSize: 22,
                                          fontWeight: FontWeight.w800))
                                ]),
                            const SizedBox(height: 8),
                            const Text('QUẢN TRỊ CHUỖI NHÀ THUỐC',
                                style: TextStyle(
                                    fontSize: 10,
                                    letterSpacing: 2,
                                    color: AppColors.muted)),
                            const SizedBox(height: 32),
                            Panel(
                                padding: const EdgeInsets.all(24),
                                child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.stretch,
                                    children: [
                                      const Center(
                                          child: StatusBadge(
                                              'CỔNG XÁC THỰC NỘI BỘ')),
                                      const SizedBox(height: 22),
                                      const Icon(Icons.shield_outlined,
                                          size: 48, color: AppColors.forest),
                                      const SizedBox(height: 14),
                                      const Text('PharmaSecure ERP',
                                          textAlign: TextAlign.center,
                                          style: TextStyle(
                                              fontSize: 24,
                                              fontWeight: FontWeight.w800)),
                                      const SizedBox(height: 8),
                                      const Text(
                                          'Hệ thống Quản trị Chuỗi Nhà thuốc\n& An toàn Dữ liệu',
                                          textAlign: TextAlign.center,
                                          style: TextStyle(
                                              color: AppColors.muted,
                                              height: 1.5)),
                                      const SizedBox(height: 26),
                                      TextFormField(
                                          controller: username,
                                          enabled: !widget.busy,
                                          autocorrect: false,
                                          textInputAction: TextInputAction.next,
                                          validator: (value) => value == null ||
                                                  value.trim().isEmpty
                                              ? 'Nhập tên đăng nhập.'
                                              : null,
                                          decoration: const InputDecoration(
                                              labelText:
                                                  'Tên đăng nhập / Mã nhân viên',
                                              prefixIcon:
                                                  Icon(Icons.person_outline))),
                                      const SizedBox(height: 18),
                                      TextFormField(
                                          controller: password,
                                          enabled: !widget.busy,
                                          onFieldSubmitted: (_) => submit(),
                                          validator: (value) =>
                                              value == null || value.isEmpty
                                                  ? 'Nhập mật khẩu.'
                                                  : null,
                                          obscureText: obscure,
                                          enableSuggestions: false,
                                          autocorrect: false,
                                          decoration: InputDecoration(
                                              labelText: 'Mật khẩu',
                                              prefixIcon: const Icon(
                                                  Icons.lock_outline),
                                              suffixIcon: IconButton(
                                                  tooltip: obscure
                                                      ? 'Hiện mật khẩu'
                                                      : 'Ẩn mật khẩu',
                                                  onPressed: () => setState(
                                                      () => obscure = !obscure),
                                                  icon: Icon(obscure
                                                      ? Icons
                                                          .visibility_outlined
                                                      : Icons
                                                          .visibility_off_outlined)))),
                                      const SizedBox(height: 20),
                                      if (widget.error != null) ...[
                                        Text(widget.error!,
                                            key: const Key('auth-error'),
                                            style: const TextStyle(
                                                color: Colors.red),
                                            textAlign: TextAlign.center),
                                        const SizedBox(height: 12),
                                      ],
                                      FilledButton(
                                          onPressed: widget.busy ||
                                                  widget.onSubmit == null
                                              ? null
                                              : submit,
                                          child: widget.busy
                                              ? const SizedBox(
                                                  width: 20,
                                                  height: 20,
                                                  child:
                                                      CircularProgressIndicator(
                                                          strokeWidth: 2))
                                              : const Text('Đăng nhập')),
                                      const SizedBox(height: 14),
                                      const Text(
                                          'Sử dụng tài khoản được cấp. Phiên chỉ lưu trong bộ nhớ; đóng ứng dụng sẽ cần đăng nhập lại.',
                                          textAlign: TextAlign.center,
                                          style: TextStyle(
                                              fontSize: 12,
                                              color: AppColors.muted)),
                                    ])),
                            const SizedBox(height: 26),
                            const Text(
                                'PharmaSecure Mobile\nXác thực thật · Các màn hình nghiệp vụ vẫn là dữ liệu mẫu',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                    color: AppColors.muted,
                                    fontSize: 11,
                                    height: 1.7)),
                          ])))))));
}
