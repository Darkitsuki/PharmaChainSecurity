import 'package:flutter/foundation.dart';
import '../core/network/api_client.dart';
import '../data/models/order_model.dart';

class OrderService extends ChangeNotifier {
  OrderService({this.api, this.tokenProvider, this.defaultBranchId});

  final ApiClient? api;
  final String? Function()? tokenProvider;
  final String? defaultBranchId;

  final List<CustomerOrderResult> _orderHistory = [];
  final List<PurchaseOrderSummary> _purchaseOrders = [];
  bool _isLoading = false;
  String? _lastError;

  List<CustomerOrderResult> get orderHistory => List.unmodifiable(_orderHistory);
  List<PurchaseOrderSummary> get purchaseOrders => List.unmodifiable(_purchaseOrders);
  bool get isLoading => _isLoading;
  String? get lastError => _lastError;

  Future<List<PurchaseOrderSummary>> fetchPurchaseOrders() async {
    final client = api;
    final token = tokenProvider?.call();
    if (client == null) {
      return _purchaseOrders;
    }

    if (token == null || token.isEmpty) {
      throw const ApiException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.', statusCode: 401);
    }

    _isLoading = true;
    _lastError = null;
    notifyListeners();

    try {
      final res = await client.get('/purchase-orders', token: token);
      final rawItems = res['items'] ?? res['data'];
      final List<dynamic> data = rawItems is List ? rawItems : [];
      final fetchedOrders = data
          .whereType<Map<String, dynamic>>()
          .map(PurchaseOrderSummary.fromJson)
          .toList();

      _purchaseOrders
        ..clear()
        ..addAll(fetchedOrders);
      _isLoading = false;
      notifyListeners();
      return _purchaseOrders;
    } catch (e) {
      debugPrint('OrderService.fetchPurchaseOrders error: $e');
      _lastError = e.toString();
      _isLoading = false;
      notifyListeners();
      if (e is ApiException) rethrow;
      throw ApiException(e.toString());
    }
  }

  Future<PurchaseOrderSummary> createPurchaseOrder({
    required String supplierId,
    DateTime? expectedDeliveryDate,
    String? notes,
    required List<PurchaseOrderLineInput> items,
  }) async {
    final client = api;
    final token = tokenProvider?.call();

    if (token == null || token.isEmpty) {
      throw const ApiException('Yêu cầu đăng nhập để lập đơn đặt mua thuốc.', statusCode: 401);
    }

    if (client == null) {
      throw const ApiException('Dịch vụ API chưa được cấu hình.');
    }

    _isLoading = true;
    _lastError = null;
    notifyListeners();

    try {
      final payload = {
        'supplierId': supplierId,
        'notes': notes,
        if (expectedDeliveryDate != null)
          'expectedDeliveryDate': expectedDeliveryDate.toIso8601String(),
        'items': items.map((e) => e.toJson()).toList(),
      };

      final res = await client.post('/purchase-orders', body: payload, token: token);
      final createdOrder = PurchaseOrderSummary.fromJson(res);
      _purchaseOrders.insert(0, createdOrder);
      _isLoading = false;
      notifyListeners();
      return createdOrder;
    } catch (e) {
      debugPrint('OrderService.createPurchaseOrder error: $e');
      _lastError = e.toString();
      _isLoading = false;
      notifyListeners();
      if (e is ApiException) rethrow;
      throw ApiException(e.toString());
    }
  }

  Future<List<CustomerOrderResult>> fetchCustomerOrders(String phoneNumber) async {
    final client = api;
    final cleanPhone = phoneNumber.trim();
    if (cleanPhone.isEmpty) {
      _orderHistory.clear();
      notifyListeners();
      return [];
    }

    if (client != null) {
      _isLoading = true;
      _lastError = null;
      notifyListeners();

      try {
        final res = await client.get('/patient/orders?phoneNumber=$cleanPhone');
        final rawItems = res['items'] ?? res['data'];
        final List<dynamic> data = rawItems is List ? rawItems : [];
        final fetchedOrders = data
            .whereType<Map<String, dynamic>>()
            .map(CustomerOrderResult.fromApiJson)
            .toList();

        _orderHistory
          ..clear()
          ..addAll(fetchedOrders);
        _isLoading = false;
        notifyListeners();
        return _orderHistory;
      } catch (e) {
        debugPrint('OrderService.fetchCustomerOrders error: $e');
        _lastError = e.toString();
        _isLoading = false;
        notifyListeners();
        return _orderHistory;
      }
    }

    return _orderHistory;
  }

  Future<CustomerOrderResult> placeOrder(CustomerOrderRequest request) async {
    final client = api;
    final token = tokenProvider?.call();

    if (client != null) {
      try {
        // 1. Prepare checkout lines (resolve batches if empty)
        final lines = <Map<String, dynamic>>[];
        for (final item in request.items) {
          String batchId = item.batch?.batchId ?? '';
          if (batchId.isEmpty) {
            try {
              final batchesRes = await client.get('/drugs/${item.drug.drugId}/batches', token: token);
              final rawBatches = batchesRes['batches'] ?? batchesRes['items'];
              if (rawBatches is List && rawBatches.isNotEmpty) {
                final firstBatch = rawBatches.first;
                if (firstBatch is Map) {
                  batchId = firstBatch['batchId'] as String? ?? firstBatch['id'] as String? ?? '';
                }
              }
            } catch (_) {}
          }

          lines.add({
            'drugId': item.drug.drugId,
            'batchId': batchId,
            'quantity': item.quantity,
          });
        }

        // 2. Post checkout: use /invoices/checkout for staff, /patient/checkout for online patient
        final isStaff = token != null && token.isNotEmpty;
        final endpoint = isStaff ? '/invoices/checkout' : '/patient/checkout';
        final payload = isStaff
            ? {
                'lines': lines,
                'paymentMethod': request.paymentMethod == PaymentMethod.qrTransfer ? 'QR_CODE' : 'CASH',
              }
            : {
                'phoneNumber': request.phoneNumber,
                'customerName': request.customerName,
                'branchId': request.branchId,
                'deliveryAddress': request.deliveryAddress,
                'paymentMethod': request.paymentMethod == PaymentMethod.qrTransfer ? 'QR_CODE' : 'CASH',
                'lines': lines,
              };

        final checkoutRes = await client.post(endpoint, body: payload, token: token);

        final result = CustomerOrderResult.fromJson(
          checkoutRes,
          customerName: request.customerName,
          phoneNumber: request.phoneNumber,
          branchName: request.branchName,
          deliveryAddress: request.deliveryAddress,
          deliveryMethod: request.deliveryMethod,
          isPrescriptionOrder: request.prescriptionImageName != null,
        );

        _orderHistory.insert(0, result);
        notifyListeners();
        return result;
      } catch (e) {
        debugPrint('OrderService.placeOrder error: $e');
        if (e is ApiException) rethrow;
      }
    }

    // Local / Offline Simulated Order for UI preview
    final simulatedId = 'INV-${DateTime.now().millisecondsSinceEpoch}';
    final simulatedNo = 'HD-${request.branchId.toUpperCase()}-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
    const simulatedHash = 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    final result = CustomerOrderResult(
      invoiceId: simulatedId,
      invoiceNumber: simulatedNo,
      totalAmount: request.totalAmount,
      hashValueSha256: simulatedHash,
      customerName: request.customerName,
      phoneNumber: request.phoneNumber,
      branchName: request.branchName,
      deliveryAddress: request.deliveryAddress,
      deliveryMethod: request.deliveryMethod,
      createdAt: DateTime.now(),
      isPrescriptionOrder: request.prescriptionImageName != null,
    );

    _orderHistory.insert(0, result);
    notifyListeners();
    return result;
  }
}
