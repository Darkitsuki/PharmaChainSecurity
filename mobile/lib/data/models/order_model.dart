import 'cart_item.dart';

enum DeliveryMethod {
  delivery('Giao hàng tận nơi', 'Shipper giao thuốc nhanh đến tận nhà'),
  pickup('Nhận tại nhà thuốc', 'Ghé chi nhánh nhà thuốc gần nhất lấy thuốc');

  const DeliveryMethod(this.title, this.subtitle);
  final String title;
  final String subtitle;
}

enum PaymentMethod {
  cod('Tiền mặt khi nhận (COD)', 'Thanh toán trực tiếp cho nhân viên giao hàng'),
  qrTransfer('Chuyển khoản QR (VietQR)', 'Quét mã QR qua ứng dụng ngân hàng');

  const PaymentMethod(this.title, this.subtitle);
  final String title;
  final String subtitle;
}

class CustomerOrderRequest {
  const CustomerOrderRequest({
    required this.customerName,
    required this.phoneNumber,
    required this.deliveryMethod,
    this.deliveryAddress,
    required this.branchId,
    required this.branchName,
    required this.paymentMethod,
    this.notes,
    this.prescriptionImageName,
    required this.items,
  });

  final String customerName;
  final String phoneNumber;
  final DeliveryMethod deliveryMethod;
  final String? deliveryAddress;
  final String branchId;
  final String branchName;
  final PaymentMethod paymentMethod;
  final String? notes;
  final String? prescriptionImageName;
  final List<CartItem> items;

  double get totalAmount => items.fold(0.0, (sum, item) => sum + item.subtotal);
}

class OrderItemDetail {
  const OrderItemDetail({
    required this.drugId,
    required this.drugCode,
    required this.drugName,
    required this.batchId,
    required this.quantity,
    required this.unitPrice,
    required this.subTotal,
  });

  final String drugId;
  final String drugCode;
  final String drugName;
  final String batchId;
  final int quantity;
  final double unitPrice;
  final double subTotal;

  factory OrderItemDetail.fromJson(Map<String, dynamic> json) {
    return OrderItemDetail(
      drugId: json['drugId'] as String? ?? '',
      drugCode: json['drugCode'] as String? ?? '',
      drugName: json['drugName'] as String? ?? '',
      batchId: json['batchId'] as String? ?? '',
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0.0,
      subTotal: (json['subTotal'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class CustomerOrderResult {
  const CustomerOrderResult({
    required this.invoiceId,
    required this.invoiceNumber,
    required this.totalAmount,
    required this.hashValueSha256,
    required this.customerName,
    required this.phoneNumber,
    required this.branchName,
    this.deliveryAddress,
    required this.deliveryMethod,
    required this.createdAt,
    this.isPrescriptionOrder = false,
    this.status = 'COMPLETED',
    this.paymentStatus = 'PENDING',
    this.paymentMethod = 'CASH',
    this.paidAmount = 0.0,
    this.paidAt,
    this.cancelReason,
    this.cancelledDate,
    this.items = const [],
  });

  final String invoiceId;
  final String invoiceNumber;
  final double totalAmount;
  final String hashValueSha256;
  final String customerName;
  final String phoneNumber;
  final String branchName;
  final String? deliveryAddress;
  final DeliveryMethod deliveryMethod;
  final DateTime createdAt;
  final bool isPrescriptionOrder;
  final String status;
  final String paymentStatus;
  final String paymentMethod;
  final double paidAmount;
  final DateTime? paidAt;
  final String? cancelReason;
  final DateTime? cancelledDate;
  final List<OrderItemDetail> items;

  bool get isCancelled => status.toUpperCase() == 'CANCELLED';
  bool get isPaid => paymentStatus.toUpperCase() == 'PAID';
  bool get isPendingPayment => !isCancelled && !isPaid;

  factory CustomerOrderResult.fromJson(
    Map<String, dynamic> json, {
    required String customerName,
    required String phoneNumber,
    required String branchName,
    String? deliveryAddress,
    required DeliveryMethod deliveryMethod,
    bool isPrescriptionOrder = false,
  }) {
    return CustomerOrderResult(
      invoiceId: json['invoiceId'] as String? ?? json['id'] as String? ?? '',
      invoiceNumber: json['invoiceNumber'] as String? ?? json['invoiceNo'] as String? ?? '',
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0.0,
      hashValueSha256: json['hashValueSha256'] as String? ?? '',
      customerName: customerName,
      phoneNumber: phoneNumber,
      branchName: branchName,
      deliveryAddress: deliveryAddress,
      deliveryMethod: deliveryMethod,
      createdAt: DateTime.now(),
      isPrescriptionOrder: isPrescriptionOrder,
      status: json['status'] as String? ?? 'COMPLETED',
      paymentStatus: json['paymentStatus'] as String? ?? 'PENDING',
      paymentMethod: json['paymentMethod'] as String? ?? 'CASH',
    );
  }

  factory CustomerOrderResult.fromApiJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? [];
    final itemsList = rawItems
        .whereType<Map<String, dynamic>>()
        .map(OrderItemDetail.fromJson)
        .toList();

    final rawCreatedDate = json['createdDate'] as String?;
    final createdAt = rawCreatedDate != null
        ? DateTime.tryParse(rawCreatedDate)?.toLocal() ?? DateTime.now()
        : DateTime.now();

    final rawPaidAt = json['paidAt'] as String?;
    final paidAt = rawPaidAt != null ? DateTime.tryParse(rawPaidAt)?.toLocal() : null;

    final rawCancelledDate = json['cancelledDate'] as String?;
    final cancelledDate = rawCancelledDate != null ? DateTime.tryParse(rawCancelledDate)?.toLocal() : null;

    final deliveryAddress = json['deliveryAddress'] as String?;

    return CustomerOrderResult(
      invoiceId: json['invoiceId'] as String? ?? json['id'] as String? ?? '',
      invoiceNumber: json['invoiceNumber'] as String? ?? json['invoiceNo'] as String? ?? '',
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 0.0,
      hashValueSha256: json['hashValueSha256'] as String? ?? '',
      customerName: json['customerName'] as String? ?? 'Khách hàng',
      phoneNumber: json['phoneNumber'] as String? ?? '',
      branchName: json['branchName'] as String? ?? 'Nhà thuốc PharmaSecure',
      deliveryAddress: deliveryAddress,
      deliveryMethod: (deliveryAddress != null && deliveryAddress.trim().isNotEmpty)
          ? DeliveryMethod.delivery
          : DeliveryMethod.pickup,
      createdAt: createdAt,
      status: json['status'] as String? ?? 'COMPLETED',
      paymentStatus: json['paymentStatus'] as String? ?? 'PENDING',
      paymentMethod: json['paymentMethod'] as String? ?? 'CASH',
      paidAmount: (json['paidAmount'] as num?)?.toDouble() ?? 0.0,
      paidAt: paidAt,
      cancelReason: json['cancelReason'] as String?,
      cancelledDate: cancelledDate,
      items: itemsList,
    );
  }
}

class PurchaseOrderLineInput {
  const PurchaseOrderLineInput({
    required this.drugId,
    required this.quantity,
    required this.estimatedUnitPrice,
    this.notes,
  });

  final String drugId;
  final int quantity;
  final double estimatedUnitPrice;
  final String? notes;

  Map<String, dynamic> toJson() => {
        'drugId': drugId,
        'quantity': quantity,
        'estimatedUnitPrice': estimatedUnitPrice,
        if (notes != null) 'notes': notes,
      };
}

class PurchaseOrderSummary {
  const PurchaseOrderSummary({
    required this.id,
    required this.orderNo,
    required this.branchId,
    required this.supplierId,
    required this.status,
    required this.totalEstimatedAmount,
    required this.createdDate,
    this.notes,
  });

  final String id;
  final String orderNo;
  final String branchId;
  final String supplierId;
  final String status;
  final double totalEstimatedAmount;
  final DateTime createdDate;
  final String? notes;

  factory PurchaseOrderSummary.fromJson(Map<String, dynamic> json) {
    final rawCreatedDate = json['createdDate'] as String?;
    final createdDate = rawCreatedDate != null
        ? (DateTime.tryParse(rawCreatedDate)?.toLocal() ?? DateTime.now())
        : DateTime.now();

    return PurchaseOrderSummary(
      id: json['id'] as String? ?? '',
      orderNo: json['orderNo'] as String? ?? '',
      branchId: json['branchId'] as String? ?? '',
      supplierId: json['supplierId'] as String? ?? '',
      status: json['status'] as String? ?? 'DRAFT',
      totalEstimatedAmount:
          (json['totalEstimatedAmount'] as num?)?.toDouble() ?? 0.0,
      createdDate: createdDate,
      notes: json['notes'] as String?,
    );
  }
}
