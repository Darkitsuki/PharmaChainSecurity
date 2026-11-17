import 'package:flutter/foundation.dart';
import '../core/network/api_client.dart';
import '../data/models/dashboard_model.dart';

class DashboardService extends ChangeNotifier {
  DashboardService({this.api, this.tokenProvider});

  final ApiClient? api;
  final String? Function()? tokenProvider;

  String? get _token => tokenProvider?.call();

  bool _isLoading = false;
  String? _lastError;

  bool get isLoading => _isLoading;
  String? get lastError => _lastError;

  Future<SalesSummaryModel?> fetchSalesSummary({int days = 7}) async {
    final client = api;
    final token = _token;
    if (client == null || token == null || token.isEmpty) return null;

    try {
      final res = await client.get('/reports/sales-summary?days=$days', token: token);
      return SalesSummaryModel.fromJson(res);
    } catch (e) {
      debugPrint('DashboardService.fetchSalesSummary error: $e');
      _lastError = e.toString();
      return null;
    }
  }

  Future<List<InventoryAlertModel>> fetchExpiringAlerts({int days = 90}) async {
    final client = api;
    final token = _token;
    if (client == null || token == null || token.isEmpty) return [];

    try {
      final res = await client.get('/inventory/expiring-soon?days=$days', token: token);
      final raw = res['items'] ?? res['data'];
      if (raw is List) {
        return raw
            .whereType<Map<String, dynamic>>()
            .map(InventoryAlertModel.fromJson)
            .toList();
      }
    } catch (e) {
      debugPrint('DashboardService.fetchExpiringAlerts error: $e');
    }
    return [];
  }

  Future<List<InventoryAlertModel>> fetchLowStockAlerts({int threshold = 10}) async {
    final client = api;
    final token = _token;
    if (client == null || token == null || token.isEmpty) return [];

    try {
      final res = await client.get('/inventory/low-stock?threshold=$threshold', token: token);
      final raw = res['items'] ?? res['data'];
      if (raw is List) {
        return raw
            .whereType<Map<String, dynamic>>()
            .map(InventoryAlertModel.fromJson)
            .toList();
      }
    } catch (e) {
      debugPrint('DashboardService.fetchLowStockAlerts error: $e');
    }
    return [];
  }

  Future<List<DashboardRecentInvoiceModel>> fetchRecentInvoices({int pageSize = 5}) async {
    final client = api;
    final token = _token;
    if (client == null || token == null || token.isEmpty) return [];

    try {
      final res = await client.get('/invoices?page=1&pageSize=$pageSize', token: token);
      final raw = res['items'] ?? res['data'];
      if (raw is List) {
        return raw
            .whereType<Map<String, dynamic>>()
            .map(DashboardRecentInvoiceModel.fromJson)
            .toList();
      }
    } catch (e) {
      debugPrint('DashboardService.fetchRecentInvoices error: $e');
    }
    return [];
  }
}
