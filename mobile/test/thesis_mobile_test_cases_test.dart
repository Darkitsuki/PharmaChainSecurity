import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:pharmasecure_mobile/app.dart';
import 'package:pharmasecure_mobile/core/auth/auth_session.dart';
import 'package:pharmasecure_mobile/core/network/api_client.dart';
import 'package:pharmasecure_mobile/core/theme/app_theme.dart';
import 'package:pharmasecure_mobile/data/demo_data.dart';
import 'package:pharmasecure_mobile/screens/login_screen.dart';
import 'package:pharmasecure_mobile/screens/medicine_screen.dart';
import 'package:pharmasecure_mobile/screens/purchase_order_screen.dart';
import 'package:pharmasecure_mobile/services/drug_service.dart';
import 'package:pharmasecure_mobile/services/order_service.dart';
import 'package:pharmasecure_mobile/widgets/ui_components.dart';

void main() {
  group('Thesis Chapter 5 - Table 5.2 Mobile Automated Test Scenarios', () {
    // TC-MOB-01: Authentication with In-Memory Session
    testWidgets(
        'TC-MOB-01: Đăng nhập nvkho_cn1 nhận JWT, lưu RAM, gán Timer và mở ban làm việc Kho',
        (tester) async {
      String? sentAuthHeader;
      final mockClient = MockClient((request) async {
        if (request.url.path == '/api/v1/auth/login') {
          expect(request.method, 'POST');
          final body = jsonDecode(request.body) as Map<String, dynamic>;
          expect(body['username'], 'nvkho_cn1');
          expect(body['password'], 'Warehouse@123');

          return http.Response.bytes(
            utf8.encode(jsonEncode({
              'accessToken': 'jwt-ram-only-token-nvkho-cn1',
              'tokenType': 'Bearer',
              'expiresInSeconds': 3600,
              'user': {
                'userId': 'usr-warehouse-001',
                'username': 'nvkho_cn1',
                'fullName': 'Thủ kho Nguyễn Văn Minh',
                'role': 'WAREHOUSE',
                'branchId': 'br-00000000-0000-0000-0000-000000000001',
                'branchName': 'Chi nhánh Quận 1',
              }
            })),
            200,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }

        if (request.url.path == '/api/v1/auth/me') {
          expect(request.method, 'GET');
          sentAuthHeader = request.headers['Authorization'];
          return http.Response.bytes(
            utf8.encode(jsonEncode({
              'userId': 'usr-warehouse-001',
              'username': 'nvkho_cn1',
              'fullName': 'Thủ kho Nguyễn Văn Minh',
              'role': 'WAREHOUSE',
              'branchId': 'br-00000000-0000-0000-0000-000000000001',
              'branchName': 'Chi nhánh Quận 1',
            })),
            200,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }

        return http.Response('Not Found', 404);
      });

      final apiClient = ApiClient(
        baseUrl: 'https://pharmasecure.unit.test/api/v1',
        client: mockClient,
      );
      final session = AuthSession(apiClient);
      addTearDown(session.dispose);

      await tester.pumpWidget(PharmaSecureApp(session: session));
      await tester.pumpAndSettle();

      // Enter login credentials
      await tester.enterText(find.byType(TextFormField).first, 'nvkho_cn1');
      await tester.enterText(find.byType(TextFormField).last, 'Warehouse@123');
      await tester.tap(find.text('Đăng nhập'));
      await tester.pumpAndSettle();

      // 1. Verify token is in memory
      expect(session.token, 'jwt-ram-only-token-nvkho-cn1');
      expect(session.user?.role, 'WAREHOUSE');
      expect(sentAuthHeader, 'Bearer jwt-ram-only-token-nvkho-cn1');

      // 2. Verify initial section is inventory for WAREHOUSE role
      final shell = tester.widget<PharmaShell>(find.byType(PharmaShell));
      expect(shell.initialSection, AppSection.inventory);

      // 3. Open navigation drawer and verify RBAC: WAREHOUSE cannot access checkout
      await tester.tap(find.byTooltip('Open navigation menu'));
      await tester.pumpAndSettle();

      expect(find.text('Thủ kho Nguyễn Văn Minh'), findsOneWidget);
      expect(find.text('Bán hàng tại quầy'), findsNothing);
      expect(find.text('Hóa đơn bán hàng'), findsNothing);
      expect(
          find.descendant(
              of: find.byType(Drawer),
              matching: find.text('Tồn kho chi nhánh')),
          findsOneWidget);
      expect(
          find.descendant(
              of: find.byType(Drawer), matching: find.text('Đơn đặt mua hàng')),
          findsOneWidget);

      // Clean up session timer before test ends
      await session.signOut();
      await tester.pumpAndSettle();
    });

    // TC-MOB-02: Logout
    testWidgets('TC-MOB-02: Đăng xuất hủy token trong RAM và gọi POST /auth/logout',
        (tester) async {
      bool logoutCalled = false;
      final mockClient = MockClient((request) async {
        if (request.url.path == '/api/v1/auth/login') {
          return http.Response.bytes(
            utf8.encode(jsonEncode({
              'accessToken': 'jwt-logout-test-token',
              'tokenType': 'Bearer',
              'expiresInSeconds': 1800,
              'user': {
                'userId': 'usr-001',
                'username': 'nvkho_cn1',
                'fullName': 'Thủ kho Minh',
                'role': 'WAREHOUSE',
                'branchId': 'br-01',
                'branchName': 'Chi nhánh Quận 1',
              }
            })),
            200,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }
        if (request.url.path == '/api/v1/auth/me') {
          return http.Response.bytes(
            utf8.encode(jsonEncode({
              'userId': 'usr-001',
              'username': 'nvkho_cn1',
              'fullName': 'Thủ kho Minh',
              'role': 'WAREHOUSE',
              'branchId': 'br-01',
              'branchName': 'Chi nhánh Quận 1',
            })),
            200,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }
        if (request.url.path == '/api/v1/auth/logout') {
          expect(request.method, 'POST');
          expect(request.headers['Authorization'], 'Bearer jwt-logout-test-token');
          logoutCalled = true;
          return http.Response('', 204);
        }
        return http.Response('Not Found', 404);
      });

      final apiClient = ApiClient(
        baseUrl: 'https://pharmasecure.unit.test/api/v1',
        client: mockClient,
      );
      final session = AuthSession(apiClient);
      addTearDown(session.dispose);

      await session.signIn('nvkho_cn1', 'Pass@123');
      expect(session.token, isNotNull);

      await tester.pumpWidget(PharmaSecureApp(session: session));
      await tester.pumpAndSettle();
      expect(find.byType(PharmaShell), findsOneWidget);

      // Tap logout in AppBar
      await tester.tap(find.byTooltip('Đăng xuất'));
      await tester.pumpAndSettle();

      // Verify logout API called and token destroyed
      expect(logoutCalled, isTrue);
      expect(session.token, isNull);
      expect(session.user, isNull);
      expect(find.byType(LoginScreen), findsOneWidget);
    });

    // TC-MOB-03: Drug and Inventory Lookup (Catalog and Inventory modes)
    testWidgets(
        'TC-MOB-03: Tra cứu danh mục & tồn kho thực tế theo Lô/FEFO, lọc Tồn thấp & Cận hạn',
        (tester) async {
      final mockClient = MockClient((request) async {
        if (request.url.path == '/api/v1/drugs') {
          return http.Response.bytes(
            utf8.encode(jsonEncode({
              'items': [
                {
                  'drugId': 'dr-001',
                  'drugCode': 'PARA500',
                  'name': 'Paracetamol 500mg Kháng viêm',
                  'activeIngredient': 'Paracetamol',
                  'unit': 'Hộp',
                  'price': 35000.0,
                  'isActive': true,
                },
                {
                  'drugId': 'dr-002',
                  'drugCode': 'PANA-EX',
                  'name': 'Panadol Extra Giảm đau',
                  'activeIngredient': 'Paracetamol, Caffeine',
                  'unit': 'Hộp',
                  'price': 45000.0,
                  'isActive': true,
                },
              ],
              'page': 1,
              'pageSize': 50,
            })),
            200,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }

        if (request.url.path == '/api/v1/inventory') {
          return http.Response.bytes(
            utf8.encode(jsonEncode({
              'items': [
                {
                  'branchId': 'br-01',
                  'drugId': 'dr-001',
                  'drugName': 'Paracetamol 500mg Kháng viêm',
                  'batchId': 'bt-001',
                  'batchNo': 'L-PARA-2026',
                  'mfgDate': '2025-01-01T00:00:00',
                  'expiryDate': '2028-12-31T00:00:00',
                  'quantity': 150,
                  'availableQuantity': 150,
                },
                {
                  'branchId': 'br-01',
                  'drugId': 'dr-002',
                  'drugName': 'Panadol Extra Giảm đau',
                  'batchId': 'bt-002',
                  'batchNo': 'L-PANA-2026',
                  'mfgDate': '2025-02-01T00:00:00',
                  'expiryDate': DateTime.now()
                      .add(const Duration(days: 45))
                      .toIso8601String(),
                  'quantity': 6,
                  'availableQuantity': 6,
                },
              ],
              'page': 1,
              'pageSize': 100,
            })),
            200,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }

        if (request.url.path == '/api/v1/drugs/dr-001/batches') {
          return http.Response.bytes(
            utf8.encode(jsonEncode([
              {
                'batchId': 'bt-001',
                'drugId': 'dr-001',
                'batchNo': 'L-PARA-2026',
                'mfgDate': '2025-01-01T00:00:00',
                'expiryDate': '2028-12-31T00:00:00',
                'quantity': 150,
              }
            ])),
            200,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }

        return http.Response('Not Found', 404);
      });

      final drugService = DrugService(
        api: ApiClient(baseUrl: 'https://unit.test/api/v1', client: mockClient),
        tokenProvider: () => 'staff-test-token',
      );

      // Part A: Inventory Mode
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(MaterialApp(
        theme: pharmaTheme(),
        home: Scaffold(
          body: MedicineScreen(
            inventory: true,
            drugService: drugService,
            branchName: 'Chi nhánh Quận 1',
          ),
        ),
      ));
      await tester.pumpAndSettle();

      // Verify fetched data and stock quantities
      expect(find.text('Paracetamol 500mg Kháng viêm'), findsOneWidget);
      expect(find.text('150 Hộp'), findsOneWidget);
      expect(find.text('Panadol Extra Giảm đau'), findsOneWidget);
      expect(find.text('6 Hộp'), findsOneWidget);

      // Filter 'Tồn thấp' (< 10)
      await tester.tap(find.widgetWithText(ChoiceChip, 'Tồn thấp'));
      await tester.pumpAndSettle();
      expect(find.text('Panadol Extra Giảm đau'), findsOneWidget);
      expect(find.text('Paracetamol 500mg Kháng viêm'), findsNothing);

      // Filter 'Cận hạn' (<= 90 days)
      await tester.tap(find.widgetWithText(ChoiceChip, 'Cận hạn'));
      await tester.pumpAndSettle();
      expect(find.text('Panadol Extra Giảm đau'), findsOneWidget);
      expect(find.text('Paracetamol 500mg Kháng viêm'), findsNothing);

      // Part B: Offline Fallback
      final offlineService = DrugService(
        api: ApiClient(
          baseUrl: 'https://unit.test/api/v1',
          client: MockClient((_) async => throw http.ClientException('offline')),
        ),
      );

      final fallbackDrugs = await offlineService.getDrugs();
      expect(fallbackDrugs.isNotEmpty, isTrue);
      expect(fallbackDrugs.any((d) => d.drugCode == 'THUOC001'), isTrue);
    });

    // TC-MOB-04: Purchase Order Remote Creation
    testWidgets(
        'TC-MOB-04: Lập đơn đặt mua hàng từ xa trên Mobile gửi POST /purchase-orders',
        (tester) async {
      tester.view.physicalSize = const Size(800, 1400);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      bool orderCreated = false;
      final mockClient = MockClient((request) async {
        if (request.url.path == '/api/v1/suppliers') {
          return http.Response.bytes(
            utf8.encode(jsonEncode([
              {
                'id': 'sup-dhg-001',
                'supplierCode': 'NCC001',
                'supplierName':
                    'Công ty Cổ phần Dược phẩm Hậu Giang (DHG Pharma)',
                'phoneNumber': '02923891433',
                'isActive': true,
              }
            ])),
            200,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }

        if (request.url.path == '/api/v1/drugs') {
          return http.Response.bytes(
            utf8.encode(jsonEncode({
              'items': [
                {
                  'drugId': 'dr-para-500',
                  'drugCode': 'THUOC001',
                  'name': 'Paracetamol 500mg',
                  'unit': 'Hộp',
                  'price': 35000.0,
                  'isActive': true,
                }
              ]
            })),
            200,
            headers: {'content-type': 'application/json; charset=utf-8'},
          );
        }

        if (request.url.path == '/api/v1/purchase-orders') {
          if (request.method == 'GET') {
            return http.Response.bytes(
              utf8.encode(jsonEncode({
                'items': [],
                'page': 1,
                'pageSize': 20,
              })),
              200,
              headers: {'content-type': 'application/json; charset=utf-8'},
            );
          }

          if (request.method == 'POST') {
            expect(request.headers['Authorization'], 'Bearer warehouse-jwt-token');
            final body = jsonDecode(request.body) as Map<String, dynamic>;
            expect(body['supplierId'], 'sup-dhg-001');

            final items = body['items'] as List<dynamic>;
            expect(items.length, 1);
            expect(items.first['drugId'], 'dr-para-500');
            expect(items.first['quantity'], 100);
            expect(items.first['estimatedUnitPrice'], 30000);

            orderCreated = true;

            return http.Response.bytes(
              utf8.encode(jsonEncode({
                'id': 'po-new-001',
                'orderNo': 'PO20261106-001',
                'branchId': 'br-01',
                'supplierId': 'sup-dhg-001',
                'supplierName':
                    'Công ty Cổ phần Dược phẩm Hậu Giang (DHG Pharma)',
                'createdBy': 'nvkho_cn1',
                'creatorName': 'Thủ kho Minh',
                'status': 'PENDING',
                'totalEstimatedAmount': 3000000.0,
                'createdDate': '2026-11-06T10:00:00Z',
                'notes': 'Đơn bổ sung gấp',
                'items': [
                  {
                    'drugId': 'dr-para-500',
                    'drugName': 'Paracetamol 500mg',
                    'quantity': 100,
                    'estimatedUnitPrice': 30000.0,
                    'subTotal': 3000000.0,
                  }
                ]
              })),
              201,
              headers: {'content-type': 'application/json; charset=utf-8'},
            );
          }
        }

        return http.Response('Not Found', 404);
      });

      final apiClient = ApiClient(
        baseUrl: 'https://unit.test/api/v1',
        client: mockClient,
      );
      final orderService = OrderService(
        api: apiClient,
        tokenProvider: () => 'warehouse-jwt-token',
        defaultBranchId: 'br-01',
      );
      final drugService = DrugService(
        api: apiClient,
        tokenProvider: () => 'warehouse-jwt-token',
      );

      const user = AuthUser(
        userId: 'usr-01',
        username: 'nvkho_cn1',
        fullName: 'Thủ kho Minh',
        role: 'WAREHOUSE',
        branchId: 'br-01',
        branchName: 'Chi nhánh Quận 1',
      );

      await tester.pumpWidget(MaterialApp(
        theme: pharmaTheme(),
        home: Scaffold(
          body: PurchaseOrderScreen(
            user: user,
            orderService: orderService,
            drugService: drugService,
          ),
        ),
      ));
      await tester.pumpAndSettle();

      // Tap "Lập đơn đặt hàng" button
      await tester.tap(find.text('Lập đơn đặt hàng'));
      await tester.pumpAndSettle();

      // Enter order notes
      final notesField = find.widgetWithText(TextField, 'Ghi chú đơn đặt hàng');
      await tester.enterText(notesField, 'Đơn bổ sung gấp');

      // Enter quantity: 100, price: 30000
      final qtyField = find.widgetWithText(TextField, 'Số lượng đặt *');
      await tester.enterText(qtyField, '100');

      final priceField = find.widgetWithText(TextField, 'Đơn giá dự kiến (VNĐ) *');
      await tester.enterText(priceField, '30000');

      // Tap "Thêm mặt hàng này vào đơn"
      await tester.tap(find.text('Thêm mặt hàng này vào đơn'));
      await tester.pumpAndSettle();

      // Verify line item added
      expect(find.textContaining('100 x 30.000 ₫ = 3.000.000 ₫'), findsOneWidget);

      // Scroll down modal sheet and tap "Gửi đơn đặt hàng"
      await tester.drag(find.byType(SingleChildScrollView).last, const Offset(0, -350));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Gửi đơn đặt hàng'));
      await tester.pumpAndSettle();

      // Verify order creation completed and item appears in list with PENDING status
      expect(orderCreated, isTrue);
      expect(find.text('PO20261106-001'), findsOneWidget);
      expect(find.widgetWithText(StatusBadge, 'Chờ duyệt'), findsOneWidget);
    });
  });
}
