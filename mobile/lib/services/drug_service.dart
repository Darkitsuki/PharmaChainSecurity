import '../core/network/api_client.dart';
import '../data/demo_data.dart';
import '../data/models/drug_model.dart';

class DrugService {
  DrugService({this.api, this.tokenProvider});

  final ApiClient? api;
  final String? Function()? tokenProvider;

  String? get _token => tokenProvider?.call();

  Future<List<DrugModel>> getDrugs({String? search, int page = 1, int pageSize = 50}) async {
    final client = api;
    final token = _token;
    if (client != null && token != null) {
      try {
        final queryParams = <String>[
          'page=$page',
          'pageSize=$pageSize',
          if (search != null && search.trim().isNotEmpty) 'search=${Uri.encodeQueryComponent(search.trim())}',
        ].join('&');

        final response = await client.get('/drugs?$queryParams', token: token);
        final items = response['items'] as List<dynamic>?;
        if (items != null) {
          return items
              .map((item) => DrugModel.fromJson(item as Map<String, dynamic>))
              .where((d) => d.isActive)
              .toList();
        }
      } catch (_) {
        // Fallback to local catalog if network or backend unavailable
      }
    }

    // Fallback catalog from demoMedicines
    var list = demoMedicines.where((m) => m.active).map((m) => DrugModel(
          drugId: m.code,
          drugCode: m.code,
          name: m.name,
          activeIngredient: m.ingredient,
          unit: m.unit,
          price: m.price.toDouble(),
          isActive: m.active,
        )).toList();

    if (search != null && search.trim().isNotEmpty) {
      final q = search.trim().toLowerCase();
      list = list.where((d) =>
          d.name.toLowerCase().contains(q) ||
          d.drugCode.toLowerCase().contains(q) ||
          (d.activeIngredient?.toLowerCase().contains(q) ?? false)).toList();
    }
    return list;
  }

  Future<List<DrugBatchModel>> getBatches(String drugId) async {
    final client = api;
    final token = _token;
    if (client != null && token != null) {
      try {
        final response = await client.get('/drugs/$drugId/batches', token: token);
        final rawBatches = response['batches'] ?? response['items'];
        if (rawBatches is List) {
          return rawBatches
              .map((b) => DrugBatchModel.fromJson(b as Map<String, dynamic>))
              .where((b) => b.isAvailable)
              .toList();
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

