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
    );
  }
}

