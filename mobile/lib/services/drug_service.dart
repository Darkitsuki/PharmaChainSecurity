import 'package:flutter/foundation.dart';
import '../core/network/api_client.dart';
import '../data/demo_data.dart';
import '../data/models/drug_model.dart';

class DrugService {
  DrugService({this.api, this.tokenProvider});

  final ApiClient? api;
  final String? Function()? tokenProvider;

  String? get _token => tokenProvider?.call();

  String _formatDate(DateTime dt) {
    final d = dt.day.toString().padLeft(2, '0');
    final m = dt.month.toString().padLeft(2, '0');
    final y = dt.year.toString();
    return '$d/$m/$y';
  }

  Future<List<DrugModel>> getDrugs({
    String? search,
    int page = 1,
    int pageSize = 50,
    bool includeInactive = false,
    bool withInventory = false,
  }) async {
    final client = api;
    if (client != null) {
      try {
        final queryParams = <String>[
          'page=$page',
          'pageSize=$pageSize',
          if (search != null && search.trim().isNotEmpty)
            'search=${Uri.encodeQueryComponent(search.trim())}',
        ].join('&');

        final response = await client.get('/drugs?$queryParams', token: _token);
        final items = response['items'] as List<dynamic>?;
        if (items != null) {
          var drugs = items
              .map((item) => DrugModel.fromJson(item as Map<String, dynamic>))
              .where((d) => includeInactive ? true : d.isActive)
              .toList();

          // If authenticated or withInventory, try enriching with branch inventory data
          if (_token != null || withInventory) {
            try {
              final invResponse = await client.get('/inventory?page=1&pageSize=100', token: _token);
              final invItems = invResponse['items'] as List<dynamic>?;
              if (invItems != null && invItems.isNotEmpty) {
                // Group inventory records by drugId
                final invMap = <String, List<Map<String, dynamic>>>{};
                for (final item in invItems) {
                  if (item is Map<String, dynamic>) {
                    final dId = item['drugId'] as String? ?? '';
                    if (dId.isNotEmpty) {
                      invMap.putIfAbsent(dId, () => []).add(item);
                    }
                  }
                }

                final now = DateTime.now();
                drugs = drugs.map((drug) {
                  final records = invMap[drug.drugId];
                  if (records == null || records.isEmpty) {
                    return drug;
                  }

                  int totalStock = 0;
                  bool hasExpiring = false;
                  DateTime? nearestExpiry;
                  String bestBatchNo = drug.batch;

                  // Find FEFO (earliest expiry with available quantity > 0)
                  for (final rec in records) {
                    final qty = (rec['availableQuantity'] as num?)?.toInt() ??
                        (rec['quantity'] as num?)?.toInt() ??
                        0;
                    totalStock += qty;

                    final rawExp = rec['expiryDate'] as String?;
                    final expDate = rawExp != null ? DateTime.tryParse(rawExp) : null;
                    if (expDate != null && qty > 0) {
                      final days = expDate.difference(now).inDays;
                      if (!expDate.isBefore(now) && days <= 90) {
                        hasExpiring = true;
                      }
                      if (nearestExpiry == null || expDate.isBefore(nearestExpiry)) {
                        nearestExpiry = expDate;
                        bestBatchNo = rec['batchNo'] as String? ?? bestBatchNo;
                      }
                    }
                  }

                  return drug.copyWith(
                    stock: totalStock,
                    batch: bestBatchNo,
                    expiry: nearestExpiry != null ? _formatDate(nearestExpiry) : drug.expiry,
                    expiring: hasExpiring,
                  );
                }).toList();
              }
            } catch (invErr) {
              // Gracefully handle if /inventory is not mocked or fails
              debugPrint('DrugService inventory enrichment skipped: $invErr');
            }
          }

          return drugs;
        }
      } catch (e) {
        debugPrint('DrugService.getDrugs error: $e');
        // Fallback to local catalog if network or backend unavailable
      }
    } else {
      debugPrint('DrugService.getDrugs: ApiClient is null!');
    }

    // Fallback catalog from demoMedicines
    var list = demoMedicines
        .where((m) => includeInactive ? true : m.active)
        .map((m) => DrugModel(
              drugId: m.code,
              drugCode: m.code,
              name: m.name,
              activeIngredient: m.ingredient,
              unit: m.unit,
              price: m.price.toDouble(),
              isActive: m.active,
              stock: m.stock,
              batch: m.batch,
              expiry: m.expiry,
              expiring: m.expiring,
            ))
        .toList();

    if (search != null && search.trim().isNotEmpty) {
      final q = search.trim().toLowerCase();
      list = list
          .where((d) =>
              d.name.toLowerCase().contains(q) ||
              d.drugCode.toLowerCase().contains(q) ||
              (d.activeIngredient?.toLowerCase().contains(q) ?? false))
          .toList();
    }
    return list;
  }

  Future<List<DrugBatchModel>> getBatches(String drugId) async {
    final client = api;
    if (client != null) {
      try {
        final response = await client.get('/drugs/$drugId/batches', token: _token);
        final rawBatches = response['batches'] ?? response['items'] ?? response['data'];
        if (rawBatches is List) {
          final batches = rawBatches
              .whereType<Map<String, dynamic>>()
              .map(DrugBatchModel.fromJson)
              .where((b) => b.isAvailable)
              .toList()
            ..sort((a, b) => a.expiryDate.compareTo(b.expiryDate));
          return batches;
        }
      } catch (_) {
        // Fallback to local batch
      }
    }

    // Fallback batch
    final match = demoMedicines.firstWhere(
      (m) => m.code == drugId,
      orElse: () => demoMedicines.first,
    );

    return [
      DrugBatchModel(
        batchId: 'BATCH-${match.code}-01',
        drugId: match.code,
        batchNo: match.batch,
        expiryDate: DateTime.now().add(const Duration(days: 365)),
        stockQuantity: match.stock > 0 ? match.stock : 100,
      )
    ];
  }
}
