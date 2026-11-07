class DrugModel {
  const DrugModel({
    required this.drugId,
    required this.drugCode,
    required this.name,
    this.activeIngredient,
    required this.unit,
    required this.price,
    this.isActive = true,
    this.category = 'Thuốc thiết yếu',
    this.prescriptionRequired = false,
    this.stock = 100,
    this.batch = 'Lô tiêu chuẩn',
    this.expiry = 'Xem bao bì',
    this.expiring = false,
  });

  final String drugId;
  final String drugCode;
  final String name;
  final String? activeIngredient;
  final String unit;
  final double price;
  final bool isActive;
  final String category;
  final bool prescriptionRequired;
  final int stock;
  final String batch;
  final String expiry;
  final bool expiring;

  factory DrugModel.fromJson(Map<String, dynamic> json) {
    final name = json['name'] as String? ?? '';
    // Infer if prescription required based on active ingredient or name if not provided
    final isRx = json['prescriptionRequired'] as bool? ??
        (name.toLowerCase().contains('kháng sinh') ||
            name.toLowerCase().contains('amoxicillin') ||
            name.toLowerCase().contains('azithromycin') ||
            name.toLowerCase().contains('ciprofloxacin') ||
            name.toLowerCase().contains('prednisolon'));

    return DrugModel(
      drugId: json['drugId'] as String? ?? json['id'] as String? ?? '',
      drugCode: json['drugCode'] as String? ?? json['code'] as String? ?? '',
      name: name,
      activeIngredient: json['activeIngredient'] as String?,
      unit: json['unit'] as String? ?? 'Hộp',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      isActive: json['isActive'] as bool? ?? true,
      category: json['category'] as String? ?? _inferCategory(name),
      prescriptionRequired: isRx,
      stock: (json['stockQuantity'] as num?)?.toInt() ?? (json['stock'] as num?)?.toInt() ?? 100,
      batch: json['batchNo'] as String? ?? json['batch'] as String? ?? 'Lô tiêu chuẩn',
      expiry: json['expiryDate'] as String? ?? json['expiry'] as String? ?? 'Xem bao bì',
      expiring: json['expiring'] as bool? ?? false,
    );
  }

  static String _inferCategory(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('para') || lower.contains('hapa') || lower.contains('panadol') || lower.contains('efferalgan') || lower.contains('ibuprofen')) {
      return 'Hạ sốt - Giảm đau';
    }
    if (lower.contains('ho') || lower.contains('eugica') || lower.contains('prospan') || lower.contains('siro')) {
      return 'Hô hấp - Trị ho';
    }
    if (lower.contains('dạ dày') || lower.contains('gaviscon') || lower.contains('omeprazol') || lower.contains('men vi sinh')) {
      return 'Tiêu hóa - Dạ dày';
    }
    if (lower.contains('vitamin') || lower.contains('berocca') || lower.contains('kẽm') || lower.contains('canxi')) {
      return 'Vitamin & Khoáng chất';
    }
    if (lower.contains('da') || lower.contains('kem') || lower.contains('gel')) {
      return 'Chăm sóc da - Da liễu';
    }
    return 'Dược phẩm thiết yếu';
  }
}

class DrugBatchModel {
  const DrugBatchModel({
    required this.batchId,
    required this.drugId,
    required this.batchNo,
    this.mfgDate,
    required this.expiryDate,
    required this.stockQuantity,
  });

  final String batchId;
  final String drugId;
  final String batchNo;
  final DateTime? mfgDate;
  final DateTime expiryDate;
  final int stockQuantity;

  factory DrugBatchModel.fromJson(Map<String, dynamic> json) {
    return DrugBatchModel(
      batchId: json['batchId'] as String? ?? json['id'] as String? ?? '',
      drugId: json['drugId'] as String? ?? '',
      batchNo: json['batchNo'] as String? ?? '',
      mfgDate: json['mfgDate'] != null ? DateTime.tryParse(json['mfgDate'] as String) : null,
      expiryDate: json['expiryDate'] != null
          ? DateTime.tryParse(json['expiryDate'] as String) ?? DateTime.now().add(const Duration(days: 365))
          : DateTime.now().add(const Duration(days: 365)),
      stockQuantity: (json['stockQuantity'] as num?)?.toInt() ?? 0,
    );
  }

  bool get isExpired => expiryDate.isBefore(DateTime.now());
  bool get isAvailable => stockQuantity > 0 && !isExpired;
}

