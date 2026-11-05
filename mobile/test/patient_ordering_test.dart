import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:pharmasecure_mobile/core/network/api_client.dart';
import 'package:pharmasecure_mobile/data/models/cart_item.dart';
import 'package:pharmasecure_mobile/data/models/drug_model.dart';
import 'package:pharmasecure_mobile/data/models/order_model.dart';
import 'package:pharmasecure_mobile/services/cart_service.dart';
import 'package:pharmasecure_mobile/services/customer_auth_service.dart';
import 'package:pharmasecure_mobile/services/drug_service.dart';
import 'package:pharmasecure_mobile/services/order_service.dart';
import 'package:pharmasecure_mobile/services/staff_notification_service.dart';

void main() {
  group('CartService Tests', () {
    test('Cart starts empty', () {
      final cart = CartService();
      expect(cart.isEmpty, isTrue);
      expect(cart.totalQuantity, 0);
      expect(cart.totalPrice, 0.0);
      expect(cart.hasPrescriptionItems, isFalse);
    });

    test('Add item updates quantity and total price', () {
      final cart = CartService();
      const drug1 = DrugModel(
        drugId: 'D1',
        drugCode: 'PARA500',
        name: 'Paracetamol 500mg',
        unit: 'Hộp',
        price: 35000,
      );

      cart.addItem(drug1, quantity: 2);
      expect(cart.isEmpty, isFalse);
      expect(cart.totalQuantity, 2);
      expect(cart.totalPrice, 70000.0);
      expect(cart.items.length, 1);
      expect(cart.items.first.subtotal, 70000.0);

      // Add same item increases quantity
      cart.addItem(drug1, quantity: 1);
      expect(cart.totalQuantity, 3);
      expect(cart.totalPrice, 105000.0);
    });

    test('Detects prescription Rx items correctly', () {
      final cart = CartService();
      const otcDrug = DrugModel(
        drugId: 'D1',
        drugCode: 'PARA500',
        name: 'Paracetamol 500mg',
        unit: 'Hộp',
        price: 35000,
        prescriptionRequired: false,
      );
      const rxDrug = DrugModel(
        drugId: 'D2',
        drugCode: 'AUG625',
        name: 'Augmentin 625mg Kháng sinh',
        unit: 'Hộp',
        price: 180000,
        prescriptionRequired: true,
      );

      cart.addItem(otcDrug);
      expect(cart.hasPrescriptionItems, isFalse);

      cart.addItem(rxDrug);
      expect(cart.hasPrescriptionItems, isTrue);
    });

    test('Update quantity and remove items', () {
      final cart = CartService();
      const drug = DrugModel(
        drugId: 'D1',
        drugCode: 'PARA',
        name: 'Panadol',
        unit: 'Hộp',
        price: 45000,
      );
      cart.addItem(drug, quantity: 2);

      cart.updateQuantity(cart.items.first, 5);
      expect(cart.totalQuantity, 5);
      expect(cart.totalPrice, 225000.0);

      // Setting quantity to 0 removes the item
      cart.updateQuantity(cart.items.first, 0);
      expect(cart.isEmpty, isTrue);
    });

    test('Clear empties all items', () {
      final cart = CartService();
      cart.addItem(const DrugModel(drugId: '1', drugCode: 'A', name: 'A', unit: 'H', price: 10000));
      cart.addItem(const DrugModel(drugId: '2', drugCode: 'B', name: 'B', unit: 'H', price: 20000));
      expect(cart.items.length, 2);

      cart.clear();
      expect(cart.isEmpty, isTrue);
      expect(cart.totalQuantity, 0);
    });
  });

  group('DrugService Tests', () {
    test('getDrugs returns list from ApiClient', () async {
      final client = MockClient((request) async {
        expect(request.url.path, '/api/v1/drugs');
        return http.Response.bytes(
          utf8.encode(jsonEncode({
            'items': [
              {
                'drugId': 'DRUG001',
                'drugCode': 'PARA500',
                'name': 'Paracetamol 500mg',
                'activeIngredient': 'Paracetamol',
                'unit': 'Hộp',
                'price': 35000,
                'isActive': true,
              }
            ],
            'page': 1,
            'pageSize': 50,
          })),
          200,
          headers: {'content-type': 'application/json; charset=utf-8'},
        );
      });

      final service = DrugService(
        api: ApiClient(baseUrl: 'https://unit.test/api/v1', client: client),
        tokenProvider: () => 'test-bearer-token',
      );

      final drugs = await service.getDrugs();
      expect(drugs.length, 1);
      expect(drugs.first.name, 'Paracetamol 500mg');
      expect(drugs.first.price, 35000.0);
    });

    test('getDrugs falls back to local catalog when API fails', () async {
      final client = MockClient((request) async {
        return http.Response('Server Error', 500);
      });

      final service = DrugService(
        api: ApiClient(baseUrl: 'https://unit.test/api/v1', client: client),
        tokenProvider: () => 'token',
      );

      final drugs = await service.getDrugs();
      expect(drugs.isNotEmpty, isTrue);
      expect(drugs.any((d) => d.name.contains('Paracetamol')), isTrue);
    });
  });

  group('OrderService Tests', () {
    test('placeOrder succeeds with ApiClient and returns signed order', () async {
      final client = MockClient((request) async {
        if (request.url.path.contains('/customers')) {
          return http.Response.bytes(
            utf8.encode(jsonEncode({'items': []})),
            200,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }
        if (request.url.path.contains('/checkout')) {
          return http.Response.bytes(
            utf8.encode(jsonEncode({
              'invoiceId': 'INV-TEST-001',
              'invoiceNumber': 'HD-CN01-20261101-0001',
              'totalAmount': 70000.0,
              'hashValueSha256': 'sha256:abc123456789def',
            })),
            201,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }
        return http.Response('Not Found', 404);
      });

      final service = OrderService(
        api: ApiClient(baseUrl: 'https://unit.test/api/v1', client: client),
        tokenProvider: () => 'test-token',
        defaultBranchId: 'br-01',
      );

      const drug = DrugModel(drugId: 'D1', drugCode: 'PARA', name: 'Paracetamol', unit: 'Hộp', price: 35000);
      final request = CustomerOrderRequest(
        customerName: 'Trần Văn Bệnh Nhân',
        phoneNumber: '0901234567',
        deliveryMethod: DeliveryMethod.delivery,
        deliveryAddress: '123 Nguyễn Huệ, Q.1',
        branchId: 'br-01',
        branchName: 'Chi nhánh Quận 1',
        paymentMethod: PaymentMethod.cod,
        items: [CartItem(drug: drug, quantity: 2)],
      );

      final result = await service.placeOrder(request);
      expect(result.invoiceNumber, 'HD-CN01-20261101-0001');
      expect(result.totalAmount, 70000.0);
      expect(result.customerName, 'Trần Văn Bệnh Nhân');
      expect(result.deliveryMethod, DeliveryMethod.delivery);
      expect(service.orderHistory.length, 1);
    });

    test('placeOrder succeeds for anonymous patient without token via /patient/checkout', () async {
      final client = MockClient((request) async {
        if (request.url.path == '/api/v1/patient/checkout') {
          return http.Response.bytes(
            utf8.encode(jsonEncode({
              'invoiceId': 'INV-PATIENT-001',
              'invoiceNumber': 'HD-ONLINE-001',
              'totalAmount': 70000.0,
              'hashValueSha256': 'sha256:patient-hash-123',
            })),
            201,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }
        return http.Response('Not Found', 404);
      });

      final service = OrderService(
        api: ApiClient(baseUrl: 'https://unit.test/api/v1', client: client),
        tokenProvider: () => null,
        defaultBranchId: 'br-01',
      );

      const drug = DrugModel(drugId: 'D1', drugCode: 'PARA', name: 'Paracetamol', unit: 'Hộp', price: 35000);
      final request = CustomerOrderRequest(
        customerName: 'Bệnh Nhân Online',
        phoneNumber: '0908888777',
        deliveryMethod: DeliveryMethod.delivery,
        branchId: 'br-01',
        branchName: 'Chi nhánh Quận 1',
        paymentMethod: PaymentMethod.cod,
        items: [CartItem(drug: drug, quantity: 2)],
      );

      final result = await service.placeOrder(request);
      expect(result.invoiceNumber, 'HD-ONLINE-001');
      expect(result.totalAmount, 70000.0);
      expect(service.orderHistory.length, 1);
    });

    test('placeOrder fallback generates local signed order when offline', () async {
      final service = OrderService();
      const drug = DrugModel(drugId: 'D1', drugCode: 'PARA', name: 'Paracetamol', unit: 'Hộp', price: 35000);
      final request = CustomerOrderRequest(
        customerName: 'Lê Thị Khách',
        phoneNumber: '0909999888',
        deliveryMethod: DeliveryMethod.pickup,
        branchId: 'br-01',
        branchName: 'Chi nhánh Quận 1',
        paymentMethod: PaymentMethod.qrTransfer,
        items: [CartItem(drug: drug, quantity: 1)],
      );

      final result = await service.placeOrder(request);
      expect(result.invoiceNumber.startsWith('HD-'), isTrue);
      expect(result.totalAmount, 35000.0);
      expect(result.deliveryMethod, DeliveryMethod.pickup);
      expect(result.hashValueSha256.startsWith('sha256:'), isTrue);
      expect(service.orderHistory.length, 1);
    });
  });

  group('CustomerAuthService Tests', () {
    test('authenticateOrRegister creates user and maintains session', () async {
      final auth = CustomerAuthService.instance;
      auth.logout();
      expect(auth.isLoggedIn, isFalse);

      final user = await auth.authenticateOrRegister(
        phoneNumber: '0908123456',
        fullName: 'Nguyễn Văn An',
        address: '123 Hai Bà Trưng, Q.1',
      );

      expect(user.phoneNumber, '0908123456');
      expect(user.fullName, 'Nguyễn Văn An');
      expect(auth.isLoggedIn, isTrue);
      expect(auth.currentUser?.id, user.id);

      auth.logout();
      expect(auth.isLoggedIn, isFalse);
    });

    test('authenticateOrRegister calls API when api is provided', () async {
      final client = MockClient((request) async {
        if (request.url.path == '/api/v1/customers/identify') {
          return http.Response.bytes(
            utf8.encode(jsonEncode({
              'id': 'cus-server-001',
              'customerCode': 'KH0908123456',
              'fullName': 'Nguyễn Văn An',
              'phoneNumber': '0908123456',
              'address': '123 Hai Bà Trưng, Q.1',
              'points': 50,
              'totalSpent': 500000.0,
            })),
            200,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }
        return http.Response('Not Found', 404);
      });

      final auth = CustomerAuthService.instance;
      auth.logout();

      final api = ApiClient(baseUrl: 'https://unit.test/api/v1', client: client);
      final user = await auth.authenticateOrRegister(
        phoneNumber: '0908123456',
        fullName: 'Nguyễn Văn An',
        address: '123 Hai Bà Trưng, Q.1',
        api: api,
      );

      expect(user.id, 'cus-server-001');
      expect(user.customerCode, 'KH0908123456');
      expect(user.points, 50);
      expect(user.totalSpent, 500000.0);
      expect(auth.isLoggedIn, isTrue);
    });
  });

  group('StaffNotificationService Tests', () {
    test('notifyNewOrder stores notification and increments counter', () {
      final notifService = StaffNotificationService.instance;
      notifService.clearNotifications();
      expect(notifService.unreadCount, 0);

      final order = CustomerOrderResult(
        invoiceId: 'INV-001',
        invoiceNumber: 'HD-CN01-001',
        totalAmount: 150000,
        hashValueSha256: 'sha256:abc',
        customerName: 'Bệnh Nhân Test',
        phoneNumber: '0901112233',
        branchName: 'Chi nhánh Quận 1',
        deliveryMethod: DeliveryMethod.delivery,
        createdAt: DateTime.now(),
      );

      notifService.notifyNewOrder(order, branchId: 'br-01');
      expect(notifService.unreadCount, 1);
      expect(notifService.notifications.first.invoiceNumber, 'HD-CN01-001');
      expect(notifService.notifications.first.branchId, 'br-01');

      notifService.clearNotifications();
      expect(notifService.unreadCount, 0);
    });
  });
}

