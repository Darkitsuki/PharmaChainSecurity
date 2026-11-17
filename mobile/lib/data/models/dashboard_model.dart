class DailySalesModel {
  const DailySalesModel({
    required this.date,
    required this.revenue,
    required this.invoiceCount,
  });

  final String date;
  final double revenue;
  final int invoiceCount;

  factory DailySalesModel.fromJson(Map<String, dynamic> json) {
    return DailySalesModel(
      date: json['date'] as String? ?? '',
      revenue: (json['revenue'] as num?)?.toDouble() ?? 0.0,
      invoiceCount: (json['invoiceCount'] as num?)?.toInt() ?? 0,
    );
  }
}

class TopDrugModel {
  const TopDrugModel({
    required this.drugId,
    required this.drugCode,
    required this.drugName,
    required this.totalQuantitySold,
    required this.totalRevenue,
  });

  final String drugId;
  final String drugCode;
  final String drugName;
  final int totalQuantitySold;
  final double totalRevenue;

  factory TopDrugModel.fromJson(Map<String, dynamic> json) {
    return TopDrugModel(
      drugId: json['drugId'] as String? ?? '',
      drugCode: json['drugCode'] as String? ?? '',
      drugName: json['drugName'] as String? ?? '',
      totalQuantitySold: (json['totalQuantitySold'] as num?)?.toInt() ?? 0,
      totalRevenue: (json['totalRevenue'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class SalesSummaryModel {
  const SalesSummaryModel({
    required this.totalRevenue,
    required this.totalInvoices,
    required this.todayRevenue,
    required this.todayInvoices,
    required this.monthRevenue,
    required this.monthInvoices,
    required this.dailySales,
    required this.topSellingDrugs,
  });

  final double totalRevenue;
  final int totalInvoices;
  final double todayRevenue;
  final int todayInvoices;
  final double monthRevenue;
  final int monthInvoices;
  final List<DailySalesModel> dailySales;
  final List<TopDrugModel> topSellingDrugs;

  factory SalesSummaryModel.fromJson(Map<String, dynamic> json) {
    final rawDaily = json['dailySales'] as List<dynamic>? ?? [];
    final rawTop = json['topSellingDrugs'] as List<dynamic>? ?? [];

    return SalesSummaryModel(
      totalRevenue: (json['totalRevenue'] as num?)?.toDouble() ?? 0.0,
      totalInvoices: (json['totalInvoices'] as num?)?.toInt() ?? 0,
      todayRevenue: (json['todayRevenue'] as num?)?.toDouble() ?? 0.0,
      todayInvoices: (json['todayInvoices'] as num?)?.toInt() ?? 0,
      monthRevenue: (json['monthRevenue'] as num?)?.toDouble() ?? 0.0,
      monthInvoices: (json['monthInvoices'] as num?)?.toInt() ?? 0,
      dailySales: rawDaily.whereType<Map<String, dynamic>>().map(DailySalesModel.fromJson).toList(),
      topSellingDrugs: rawTop.whereType<Map<String, dynamic>>().map(TopDrugModel.fromJson).toList(),
    );
  }
}

class InventoryAlertModel {
  const InventoryAlertModel({
    required this.branchId,
    required this.drugId,
    required this.drugCode,
    required this.drugName,
    required this.batchId,
    required this.batchNo,
    required this.expiryDate,
    required this.quantity,
  });

  final String branchId;
  final String drugId;
  final String drugCode;
  final String drugName;
  final String batchId;
  final String batchNo;
  final DateTime? expiryDate;
  final int quantity;

  factory InventoryAlertModel.fromJson(Map<String, dynamic> json) {
    final rawDate = json['expiryDate'] as String?;
    return InventoryAlertModel(
      branchId: json['branchId'] as String? ?? '',
      drugId: json['drugId'] as String? ?? '',
      drugCode: json['drugCode'] as String? ?? '',
      drugName: json['drugName'] as String? ?? '',
      batchId: json['batchId'] as String? ?? '',
      batchNo: json['batchNo'] as String? ?? '',
      expiryDate: rawDate != null ? DateTime.tryParse(rawDate) : null,
      quantity: (json['quantity'] as num?)?.toInt() ?? 0,
    );
  }
}

class DashboardRecentInvoiceModel {
  const DashboardRecentInvoiceModel({
    required this.invoiceId,
    required this.invoiceNumber,
    required this.createdDate,
    required this.totalAmount,
    required this.status,
    required this.paymentStatus,
    this.cashierName,
  });

  final String invoiceId;
  final String invoiceNumber;
  final DateTime createdDate;
  final double totalAmount;
  final String status;
  final String paymentStatus;
  final String? cashierName;

  factory DashboardRecentInvoiceModel.fromJson(Map<String, dynamic> json) {
    final rawDate = json['createdDate'] as String?;
    return DashboardRecentInvoiceModel(
      invoiceId: json['invoiceId'] as String? ?? '',
      invoiceNumber: json['invoiceNumber'] as String? ?? '',
      createdDate: rawDate != null ? DateTime.tryParse(rawDate) ?? DateTime.now() : DateTime.now(),
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0.0,
      status: json['status'] as String? ?? 'COMPLETED',
      paymentStatus: json['paymentStatus'] as String? ?? 'PAID',
      cashierName: json['cashierName'] as String?,
    );
  }
}
