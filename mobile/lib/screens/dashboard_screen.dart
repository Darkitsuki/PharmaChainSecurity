import 'package:flutter/material.dart';
import '../core/auth/auth_session.dart';
import '../core/theme/app_theme.dart';
import '../data/demo_data.dart';
import '../data/models/dashboard_model.dart';
import '../services/dashboard_service.dart';
import '../widgets/ui_components.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({
    super.key,
    required this.onNavigate,
    this.report = false,
    this.dashboardService,
    this.user,
  });

  final ValueChanged<AppSection> onNavigate;
  final bool report;
  final DashboardService? dashboardService;
  final AuthUser? user;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int days = 7;
  bool _isLoading = false;
  SalesSummaryModel? _salesSummary;
  List<InventoryAlertModel> _expiringAlerts = [];
  List<InventoryAlertModel> _lowStockAlerts = [];
  List<DashboardRecentInvoiceModel> _recentInvoices = [];

  bool get _isLive => _salesSummary != null;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void didUpdateWidget(covariant DashboardScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.dashboardService != widget.dashboardService ||
        oldWidget.user != widget.user) {
      _loadData();
    }
  }

  Future<void> _loadData() async {
    if (widget.dashboardService == null) return;
    setState(() => _isLoading = true);
    try {
      final summaryFuture = widget.dashboardService!.fetchSalesSummary(days: days);
      final expiringFuture = widget.dashboardService!.fetchExpiringAlerts(days: 90);
      final lowStockFuture = widget.dashboardService!.fetchLowStockAlerts(threshold: 10);
      final invoicesFuture = widget.dashboardService!.fetchRecentInvoices(pageSize: 5);

      final results = await Future.wait([
        summaryFuture,
        expiringFuture,
        lowStockFuture,
        invoicesFuture,
      ]);

      if (mounted) {
        setState(() {
          _salesSummary = results[0] as SalesSummaryModel?;
          _expiringAlerts = (results[1] as List<InventoryAlertModel>?) ?? [];
          _lowStockAlerts = (results[2] as List<InventoryAlertModel>?) ?? [];
          _recentInvoices = (results[3] as List<DashboardRecentInvoiceModel>?) ?? [];
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _formatVnd(num amount) {
    if (amount >= 1000000) {
      final millions = (amount / 1000000).toStringAsFixed(1).replaceAll('.0', '');
      return '$millions triệu';
    }
    return money(amount.toInt());
  }

  @override
  Widget build(BuildContext context) {
    final branchName = widget.user?.branchName ?? 'Chi nhánh Quận 1';
    final branchCode = widget.user?.branchId.substring(0, 8) ?? 'CN01';

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // 1. Tiêu đề trang
          PageHeading(
            widget.report ? 'Báo cáo doanh thu' : (_isLive ? 'Tổng quan chi nhánh' : 'Tổng quan minh họa'),
            widget.report
                ? 'Theo dõi doanh thu và mặt hàng bán chạy'
                : 'Tổng quan hoạt động · $branchName',
          ),

          // 2. Thẻ thông tin chi nhánh
          Panel(
            child: Row(
              children: [
                const Icon(Icons.store_outlined, color: AppColors.forest, size: 28),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        branchName,
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        '$branchCode · Trực tuyến',
                        style: const TextStyle(fontSize: 12, color: AppColors.muted),
                      ),
                    ],
                  ),
                ),
                StatusBadge(_isLive ? 'CSDL ORACLE' : 'Mẫu'),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // 3. Bộ lọc ngày (khi xem báo cáo hoặc tổng quan)
          Wrap(
            spacing: 8,
            children: [7, 30, 90].map((d) {
              return ChoiceChip(
                label: Text('$d ngày'),
                selected: days == d,
                onSelected: (_) {
                  setState(() => days = d);
                  _loadData();
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 6),
          Text(
            _isLive
                ? 'Dữ liệu trực tiếp từ CSDL Oracle · Kéo xuống để làm mới'
                : 'Đang tải hoặc chưa kết nối API; hiển thị giao diện minh họa.',
            style: const TextStyle(fontSize: 11, color: AppColors.muted),
          ),
          const SizedBox(height: 16),

          // 4. Lưới thẻ KPI thống kê
          if (_isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: CircularProgressIndicator(),
              ),
            )
          else if (_isLive)
            StatsGrid(children: [
              StatCard(
                'Doanh thu',
                _formatVnd(_salesSummary!.totalRevenue),
                Icons.payments_outlined,
                caption: '$days ngày qua',
              ),
              StatCard(
                'Hóa đơn',
                '${_salesSummary!.totalInvoices}',
                Icons.receipt_long_outlined,
                caption: 'Đã hoàn tất',
              ),
              StatCard(
                'Lô cận hạn',
                '${_expiringAlerts.length} lô',
                Icons.event_outlined,
                caption: 'Hạn dưới 90 ngày (FEFO)',
              ),
              StatCard(
                'Mặt hàng tồn thấp',
                '${_lowStockAlerts.length}',
                Icons.inventory_2_outlined,
                caption: 'Tồn dưới ngưỡng',
              ),
            ])
          else
            const StatsGrid(children: [
              StatCard('Doanh thu mẫu', '12,8 triệu', Icons.payments_outlined, caption: '7 ngày minh họa'),
              StatCard('Hóa đơn', '48', Icons.receipt_long_outlined),
              StatCard('Lô cận hạn', '1', Icons.event_outlined),
              StatCard('Mặt hàng tồn thấp', '1', Icons.inventory_2_outlined),
            ]),

          const SizedBox(height: 24),

          // 5. Biểu đồ xu hướng doanh thu
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Xu hướng doanh thu',
                        style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
                    Text('$days ngày qua',
                        style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  _isLive
                      ? 'Biểu đồ doanh thu thực tế từ hóa đơn CSDL Oracle'
                      : '7 ngày · Đơn vị: triệu đồng · Dữ liệu mẫu',
                  style: const TextStyle(fontSize: 11, color: AppColors.muted),
                ),
                const SizedBox(height: 20),

                // Rendering biểu đồ cột
                if (_isLive && _salesSummary!.dailySales.isNotEmpty)
                  _buildLiveDailySalesChart(_salesSummary!.dailySales)
                else
                  _buildDemoChart(),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // 6. Truy cập nhanh
          if (!widget.report) ...[
            const Text('Truy cập nhanh',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                AppSection.checkout,
                AppSection.catalog,
                AppSection.inventory,
                AppSection.receipts,
              ].map((s) => ActionChip(
                    avatar: Icon(s.icon, size: 18, color: AppColors.forest),
                    label: Text(s.title),
                    onPressed: () => widget.onNavigate(s),
                  )).toList(),
            ),
            const SizedBox(height: 24),
          ],

          // 7. Thuốc bán chạy
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Thuốc bán chạy',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
                const SizedBox(height: 10),
                if (_isLive && _salesSummary!.topSellingDrugs.isNotEmpty)
                  for (final drug in _salesSummary!.topSellingDrugs.take(5))
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.medication_outlined, color: AppColors.forest),
                      title: Text(drug.drugName,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                      subtitle: Text('Đã bán: ${drug.totalQuantitySold} · Doanh thu: ${money(drug.totalRevenue.toInt())}',
                          style: const TextStyle(fontSize: 12)),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => widget.onNavigate(AppSection.catalog),
                    )
                else if (_isLive)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Text('Chưa có mặt hàng nào bán trong kỳ báo cáo đã chọn.',
                        style: TextStyle(color: AppColors.muted, fontSize: 13)),
                  )
                else
                  for (final m in demoMedicines.take(3))
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.medication_outlined, color: AppColors.forest),
                      title: Text(m.name,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                      subtitle: Text('${money(m.price)} / ${m.unit}',
                          style: const TextStyle(fontSize: 12)),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => widget.onNavigate(AppSection.catalog),
                    ),
              ],
            ),
          ),

          const SizedBox(height: 18),

          // 8. Hóa đơn gần đây
          Panel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Hóa đơn gần đây',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
                const SizedBox(height: 8),
                if (_isLive && _recentInvoices.isNotEmpty)
                  for (final inv in _recentInvoices)
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: inv.paymentStatus == 'PAID' ? AppColors.mint : const Color(0xFFFEF3C7),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          inv.paymentStatus == 'PAID' ? Icons.check_circle_outline : Icons.schedule,
                          color: inv.paymentStatus == 'PAID' ? AppColors.forest : const Color(0xFFB45309),
                          size: 18,
                        ),
                      ),
                      title: Text(inv.invoiceNumber,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                      subtitle: Text(
                        '${money(inv.totalAmount.toInt())} · ${inv.paymentStatus == 'PAID' ? 'Đã thanh toán' : 'Chờ thu tiền'}',
                        style: const TextStyle(fontSize: 12),
                      ),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => widget.onNavigate(AppSection.invoices),
                    )
                else if (_isLive)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Text('Chưa có hóa đơn nào được tạo gần đây.',
                        style: TextStyle(color: AppColors.muted, fontSize: 13)),
                  )
                else
                  for (final r in demoRecords[AppSection.invoices]!)
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(r.code,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                      subtitle: Text(r.title),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => widget.onNavigate(AppSection.invoices),
                    ),
              ],
            ),
          ),

          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildLiveDailySalesChart(List<DailySalesModel> sales) {
    final maxRevenue = sales.fold(100000.0, (prev, s) => s.revenue > prev ? s.revenue : prev);

    return SizedBox(
      height: 155,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: sales.map((item) {
          final heightPercent = (item.revenue / maxRevenue).clamp(0.08, 1.0);
          final barHeight = heightPercent * 115;
          final shortDate = item.date.length >= 5 ? item.date.substring(item.date.length - 5) : item.date;

          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Tooltip(
                    message: '${item.date}: ${money(item.revenue.toInt())} (${item.invoiceCount} HĐ)',
                    child: Container(
                      height: barHeight,
                      decoration: BoxDecoration(
                        color: item.revenue > 0 ? AppColors.forest : Colors.grey.shade300,
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(5)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    shortDate,
                    style: const TextStyle(fontSize: 9, color: AppColors.muted),
                    maxLines: 1,
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildDemoChart() {
    const heights = [55.0, 83.0, 65.0, 112.0, 93.0, 123.0, 102.0];
    return SizedBox(
      height: 155,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: List.generate(7, (i) {
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 5),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Container(
                    height: heights[i],
                    decoration: BoxDecoration(
                      color: i == 5 ? AppColors.coral : AppColors.forest,
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    i == 6 ? 'CN' : 'T${i + 2}',
                    style: const TextStyle(fontSize: 10, color: AppColors.muted),
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}
