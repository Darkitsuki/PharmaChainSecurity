import 'package:flutter/foundation.dart';
import '../data/models/order_model.dart';

class StaffNotificationItem {
  StaffNotificationItem({
    required this.id,
    required this.orderId,
    required this.invoiceNumber,
    required this.customerName,
    required this.phoneNumber,
    required this.branchName,
    required this.branchId,
    required this.totalAmount,
    required this.createdAt,
    this.isPrescriptionOrder = false,
  });

  final String id;
  final String orderId;
  final String invoiceNumber;
  final String customerName;
  final String phoneNumber;
  final String branchName;
  final String branchId;
  final double totalAmount;
  final DateTime createdAt;
  final bool isPrescriptionOrder;
}

class StaffNotificationService extends ChangeNotifier {
  StaffNotificationService._();
  static final StaffNotificationService instance = StaffNotificationService._();

  final List<StaffNotificationItem> _notifications = [];
  List<StaffNotificationItem> get notifications => List.unmodifiable(_notifications);

  int get unreadCount => _notifications.length;

  void notifyNewOrder(CustomerOrderResult order, {String? branchId}) {
    final item = StaffNotificationItem(
      id: 'NOTIF-${DateTime.now().millisecondsSinceEpoch}',
      orderId: order.invoiceId,
      invoiceNumber: order.invoiceNumber,
      customerName: order.customerName,
      phoneNumber: order.phoneNumber,
      branchName: order.branchName,
      branchId: branchId ?? 'br-00000000-0000-0000-0000-000000000001',
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      isPrescriptionOrder: order.isPrescriptionOrder,
    );

    _notifications.insert(0, item);
    notifyListeners();
  }

  void clearNotifications() {
    _notifications.clear();
    notifyListeners();
  }

  void removeNotification(String id) {
    _notifications.removeWhere((item) => item.id == id);
    notifyListeners();
  }
}

