import '../core/network/api_client.dart';
import '../data/models/order_model.dart';

class OrderService {
  OrderService({this.api, this.tokenProvider, this.defaultBranchId});

  final ApiClient? api;
  final String? Function()? tokenProvider;
  final String? defaultBranchId;

  final List<CustomerOrderResult> _orderHistory = [];

  List<CustomerOrderResult> get orderHistory => List.unmodifiable(_orderHistory);

  Future<CustomerOrderResult> placeOrder(CustomerOrderRequest request) async {
    final client = api;
    final token = tokenProvider?.call();

    if (client != null && token != null) {
      try {
        // 1. Try to find or register customer by phone number
        String? customerId;
        try {
          final customerSearch = await client.get('/customers?phone=${Uri.encodeComponent(request.phoneNumber)}', token: token);
          final customerItems = customerSearch['items'] ?? customerSearch['data'];
          if (customerItems is List && customerItems.isNotEmpty) {
            final firstItem = customerItems.first;
            if (firstItem is Map) {
              customerId = firstItem['id'] as String?;
            }
          }
        } catch (_) {
          // Ignore lookup errors
        }

        if (customerId == null) {
          try {
            final newCustomer = await client.post('/customers', body: {
              'fullName': request.customerName,
              'phoneNumber': request.phoneNumber,
              'address': request.deliveryAddress ?? request.branchName,
              'email': '${request.phoneNumber}@pharmasecure.vn',
            }, token: token);
            customerId = newCustomer['id'] as String?;
          } catch (_) {
            // If conflict or validation error, proceed without customerId or use phone
          }
        }

        // 2. Prepare checkout lines
        final lines = <Map<String, dynamic>>[];
        for (final item in request.items) {
          // If batch not selected, fetch first available batch
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

          if (batchId.isEmpty) {
            batchId = 'BATCH-${item.drug.drugCode}-01';
          }

          lines.add({
            'drugId': item.drug.drugId,
            'batchId': batchId,
            'quantity': item.quantity,
          });
        }

        // 3. Post checkout
        final checkoutRes = await client.post('/checkout', body: {
          'lines': lines,
          'customerId': customerId,
        }, token: token);

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
        return result;
      } catch (e) {
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
    return result;
  }
}

