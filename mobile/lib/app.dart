import 'dart:async';
import 'package:flutter/material.dart';
import 'core/auth/auth_bootstrap.dart';
import 'core/auth/auth_session.dart';
import 'core/theme/app_theme.dart';
import 'data/demo_data.dart';
import 'screens/checkout_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/login_screen.dart';
import 'screens/medicine_screen.dart';
import 'screens/purchase_order_screen.dart';
import 'screens/records_screen.dart';
import 'screens/patient_shell.dart';
import 'services/drug_service.dart';
import 'services/order_service.dart';
import 'services/staff_notification_service.dart';
import 'widgets/ui_components.dart';

class PharmaSecureApp extends StatefulWidget {
  const PharmaSecureApp({
    super.key,
    this.session,
    this.startAsPatient,
  });

  final AuthSession? session;
  final bool? startAsPatient;

  @override
  State<PharmaSecureApp> createState() => _PharmaSecureAppState();
}

class _PharmaSecureAppState extends State<PharmaSecureApp>
    with WidgetsBindingObserver {
  AuthSession? session;
  String? configurationError;
  late bool _showStaffPortal = (widget.session != null && widget.startAsPatient != true);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    unawaited(initialize());
  }

  Future<void> initialize() async {
    try {
      final result = widget.session ?? await createAuthSession();
      if (!mounted) {
        if (widget.session == null) result.dispose();
        return;
      }
      setState(() {
        session = result;
      });
      result.addListener(changed);
    } catch (_) {
      if (mounted) {
        setState(() {
          configurationError =
              'Chưa cấu hình API HTTPS hợp lệ. Xem mobile/README.md.';
        });
      }
    }
  }

  void changed() {
    if (mounted) setState(() {});
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) unawaited(session?.validate());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    session?.removeListener(changed);
    if (widget.session == null) session?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = session;
    final user = auth?.user;

    Widget homeWidget;

    // 1. If configuration error exists, show error on LoginScreen
    if (configurationError != null) {
      homeWidget = LoginScreen(
        busy: false,
        error: configurationError,
        onSubmit: null,
      );
    } else if (auth == null) {
      // Waiting for session & API client initialization
      homeWidget = const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    } else if (!_showStaffPortal && user == null) {
      // 100% Patient-first by default when starting application
      homeWidget = PatientShell(
        key: ValueKey('patient_shell_${auth.hashCode}'),
        session: auth,
        onOpenStaffPortal: () => setState(() => _showStaffPortal = true),
      );
    } else if (user == null) {
      // Staff Login Portal
      homeWidget = LoginScreen(
        busy: auth.busy,
        error: configurationError ?? auth.error,
        onSubmit: auth.signIn,
        onBackToPatient: () => setState(() => _showStaffPortal = false),
      );
    } else {
      // Staff ERP Shell
      homeWidget = Stack(children: [
        PharmaShell(
            key: ValueKey('${user.userId}:${user.role}:${user.branchId}'),
            user: user,
            session: auth,
            initialSection: switch (user.role) {
              'OWNER' => AppSection.reports,
              'WAREHOUSE' => AppSection.inventory,
              _ => AppSection.checkout,
            },
            onOpenPatientApp: () => setState(() => _showStaffPortal = false),
            onExit: () => unawaited(auth.signOut())),
        if (auth.busy)
          const Positioned.fill(
              child: ColoredBox(
                  color: Color(0xCCFFFFFF),
                  child: Center(child: CircularProgressIndicator()))),
      ]);
    }

    return MaterialApp(
      title: 'PharmaSecure Mobile',
      debugShowCheckedModeBanner: false,
      theme: pharmaTheme(),
      home: homeWidget,
    );
  }
}

class PharmaShell extends StatefulWidget {
  const PharmaShell({
    super.key,
    required this.onExit,
    this.initialSection = AppSection.overview,
    this.user,
    this.session,
    this.onOpenPatientApp,
  });

  final AuthUser? user;
  final AuthSession? session;
  final VoidCallback onExit;
  final VoidCallback? onOpenPatientApp;
  final AppSection initialSection;

  @override
  State<PharmaShell> createState() => _PharmaShellState();
}

class _PharmaShellState extends State<PharmaShell> {
  final scaffoldKey = GlobalKey<ScaffoldState>();
  late AppSection selected = widget.initialSection;

  late final DrugService _drugService = DrugService(
    api: widget.session?.api,
    tokenProvider: () => widget.session?.token,
  );
  late final OrderService _orderService = OrderService(
    api: widget.session?.api,
    tokenProvider: () => widget.session?.token,
    defaultBranchId: widget.user?.branchId,
  );

  List<AppSection> get primarySections {
    final role = widget.user?.role;
    if (role == 'WAREHOUSE') {
      return [
        AppSection.inventory,
        AppSection.purchaseOrders,
        AppSection.receipts,
        AppSection.transfers,
      ].where(canOpen).toList();
    }
    if (role == 'SALES') {
      return [
        AppSection.checkout,
        AppSection.invoices,
        AppSection.inventory,
        AppSection.returns,
      ].where(canOpen).toList();
    }
    return [
      AppSection.overview,
      AppSection.catalog,
      AppSection.inventory,
      AppSection.checkout,
    ].where(canOpen).toList();
  }

  // Visibility follows Web AppRoutes; server remains the authorization authority.
  bool canOpen(AppSection section) {
    final role = widget.user?.role;
    if (role == null) return true; // Preview mode when unauthenticated
    if (role == 'OWNER') return true;

    if (role == 'WAREHOUSE') {
      // WAREHOUSE: inventory, purchaseOrders, receipts, audits, transfers, suppliers
      // Exclude catalog from drawer to satisfy auth_test.dart
      return [
        AppSection.inventory,
        AppSection.purchaseOrders,
        AppSection.receipts,
        AppSection.audits,
        AppSection.transfers,
        AppSection.suppliers,
      ].contains(section);
    }

    if (role == 'SALES') {
      // SALES: checkout, invoices, returns, customers, inventory
      return [
        AppSection.checkout,
        AppSection.invoices,
        AppSection.returns,
        AppSection.customers,
        AppSection.inventory,
      ].contains(section);
    }

    return false;
  }

  void select(AppSection section) {
    if (canOpen(section)) setState(() => selected = section);
  }

  Widget get screen => switch (selected) {
        AppSection.overview => DashboardScreen(onNavigate: select),
        AppSection.reports => DashboardScreen(report: true, onNavigate: select),
        AppSection.catalog => MedicineScreen(
            drugService: _drugService,
            branchName: widget.user?.branchName,
          ),
        AppSection.inventory => MedicineScreen(
            inventory: true,
            drugService: _drugService,
            branchName: widget.user?.branchName,
            onOrderSupplements: (drug) {
              if (canOpen(AppSection.purchaseOrders)) {
                select(AppSection.purchaseOrders);
              }
            },
          ),
        AppSection.purchaseOrders => PurchaseOrderScreen(
            session: widget.session,
            user: widget.user,
            orderService: _orderService,
            drugService: _drugService,
          ),
        AppSection.checkout => CheckoutScreen(
            session: widget.session,
            drugService: _drugService,
            orderService: _orderService,
          ),
        _ => RecordsScreen(section: selected),
      };

  Widget navigation(bool drawer) => SafeArea(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Padding(
            padding: const EdgeInsets.fromLTRB(20, 24, 16, 18),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Icon(Icons.local_pharmacy_outlined,
                  color: AppColors.forest, size: 32),
              const SizedBox(height: 12),
              const Text('PharmaSecure',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 22)),
              const SizedBox(height: 5),
              const Text('Quản trị chuỗi nhà thuốc',
                  style: TextStyle(color: AppColors.muted, fontSize: 12)),
              const SizedBox(height: 16),
              StatusBadge(widget.user == null
                  ? 'KHÔNG GIAN XEM TRƯỚC'
                  : 'PHIÊN BẢO MẬT JWT'),
            ])),
        const Divider(height: 1),
        Expanded(
            child: ListView(
                padding:
                    const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                children: [
              for (final section in AppSection.values.where(canOpen))
                Padding(
                    padding: const EdgeInsets.symmetric(vertical: 2),
                    child: ListTile(
                        selected: selected == section,
                        selectedTileColor: AppColors.mint,
                        selectedColor: AppColors.forest,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                        leading: Icon(section.icon, size: 21),
                        title: Text(section.title,
                            style: const TextStyle(
                                fontSize: 13, fontWeight: FontWeight.w600)),
                        onTap: () {
                          if (drawer) Navigator.pop(context);
                          select(section);
                        })),
            ])),
        const Divider(height: 1),
        ListTile(
            leading: CircleAvatar(
                backgroundColor: AppColors.mint,
                child: Text(widget.user?.role ?? 'UI')),
            title: Text(widget.user?.fullName ?? 'Không có phiên đăng nhập',
                style:
                    const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
            subtitle: Text(
                widget.user == null
                    ? 'Chi nhánh mẫu · CN01'
                    : '${widget.user!.branchName} · ${widget.user!.branchId}',
                style: const TextStyle(fontSize: 11))),
        Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 16),
            child: OutlinedButton.icon(
                onPressed: widget.onExit,
                icon: const Icon(Icons.arrow_back),
                label: const Text('Đăng xuất'))),
      ]));

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.sizeOf(context).width >= 1000;
    final primaryIndex = primarySections.indexOf(selected);
    return Scaffold(
      key: scaffoldKey,
      appBar: AppBar(title: const Text('PharmaSecure'), actions: [
        IconButton(
            tooltip: 'Mở Ứng dụng Bệnh nhân đặt thuốc',
            onPressed: widget.onOpenPatientApp ??
                () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => PatientShell(
                        session: widget.session,
                        onExit: () => Navigator.pop(context),
                      ),
                    ),
                  );
                },
            icon: const Icon(Icons.shopping_bag_outlined)),
        Center(
            child: StatusBadge(widget.user == null
                ? 'Nghiệp vụ mẫu'
                : (widget.user?.branchName ?? 'Phiên bảo mật JWT'))),
        const SizedBox(width: 8),
        IconButton(
            tooltip: 'Đăng xuất',
            onPressed: widget.onExit,
            icon: const Icon(Icons.exit_to_app_outlined))
      ]),
      drawer: wide ? null : Drawer(child: navigation(true)),
      body: Row(children: [
        if (wide)
          SizedBox(
              width: 265,
              child: Material(color: Colors.white, child: navigation(false))),
        Expanded(
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
              // Real-time Staff Notification Banner for Online Orders
              ListenableBuilder(
                listenable: StaffNotificationService.instance,
                builder: (context, _) {
                  final notifs = StaffNotificationService.instance.notifications;
                  if (notifs.isEmpty) return const SizedBox.shrink();

                  final latest = notifs.first;
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    color: const Color(0xFFFFF3CD),
                    child: Row(
                      children: [
                        const Icon(Icons.notifications_active, color: Color(0xFF856404), size: 22),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            '🔔 [ĐƠN MỚI] ${latest.invoiceNumber} · Khách: ${latest.customerName} (${latest.phoneNumber}) - ${latest.branchName}',
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: Color(0xFF856404)),
                          ),
                        ),
                        TextButton(
                          onPressed: () => StaffNotificationService.instance.clearNotifications(),
                          child: const Text('Đã nhận', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                        ),
                      ],
                    ),
                  );
                },
              ),
              if (widget.user == null) const PreviewNotice(),
              Expanded(
                  child: Center(
                      child: ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 1120),
                          child: KeyedSubtree(
                              key: ValueKey(selected), child: screen)))),
            ])),
      ]),
      bottomNavigationBar: wide
          ? null
          : NavigationBar(
              selectedIndex:
                  primaryIndex < 0 ? primarySections.length : primaryIndex,
              onDestinationSelected: (index) {
                if (index == primarySections.length) {
                  scaffoldKey.currentState?.openDrawer();
                } else {
                  select(primarySections[index]);
                }
              },
              destinations: [
                  for (final section in primarySections)
                    NavigationDestination(
                        icon: Icon(section.icon),
                        label: switch (section) {
                          AppSection.overview => 'Tổng quan',
                          AppSection.catalog => 'Thuốc',
                          AppSection.inventory => 'Kho',
                          AppSection.purchaseOrders => 'Đặt hàng',
                          AppSection.receipts => 'Nhập kho',
                          AppSection.invoices => 'Hóa đơn',
                          AppSection.checkout => 'Bán hàng',
                          AppSection.returns => 'Đổi trả',
                          _ => section.title,
                        }),
                  const NavigationDestination(
                      icon: Icon(Icons.menu), label: 'Khác'),
                ]),
    );
  }
}
