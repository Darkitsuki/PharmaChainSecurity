import 'package:flutter/foundation.dart';
import '../core/network/api_client.dart';

class CustomerUser {
  const CustomerUser({
    required this.id,
    required this.fullName,
    required this.phoneNumber,
    this.customerCode,
    this.address,
    this.email,
    this.points = 0,
    this.totalSpent = 0.0,
  });

  final String id;
  final String fullName;
  final String phoneNumber;
  final String? customerCode;
  final String? address;
  final String? email;
  final int points;
  final double totalSpent;

  factory CustomerUser.fromJson(Map<String, dynamic> json) {
    return CustomerUser(
      id: json['id'] as String? ?? 'CUST-${DateTime.now().millisecondsSinceEpoch}',
      customerCode: json['customerCode'] as String? ?? json['code'] as String?,
      fullName: json['fullName'] as String? ?? json['name'] as String? ?? 'Khách hàng',
      phoneNumber: json['phoneNumber'] as String? ?? json['phone'] as String? ?? '',
      address: json['address'] as String?,
      email: json['email'] as String?,
      points: (json['points'] as num?)?.toInt() ?? 0,
      totalSpent: (json['totalSpent'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'customerCode': customerCode,
        'fullName': fullName,
        'phoneNumber': phoneNumber,
        'address': address,
        'email': email,
        'points': points,
        'totalSpent': totalSpent,
      };
}

class CustomerAuthService extends ChangeNotifier {
  CustomerAuthService._();
  static final CustomerAuthService instance = CustomerAuthService._();

  ApiClient? _api;
  CustomerUser? _currentUser;

  CustomerUser? get currentUser => _currentUser;
  bool get isLoggedIn => _currentUser != null;

  void setApi(ApiClient? api) {
    _api = api;
  }

  void setCustomer(CustomerUser user) {
    _currentUser = user;
    notifyListeners();
  }

  void logout() {
    _currentUser = null;
    notifyListeners();
  }

  Future<CustomerUser> authenticateOrRegister({
    required String phoneNumber,
    required String fullName,
    String? address,
    String? password,
    ApiClient? api,
    String? token,
    String? branchId,
  }) async {
    final client = api ?? _api;
    final cleanPhone = phoneNumber.trim();
    final cleanName = fullName.trim().isEmpty ? 'Khách hàng $cleanPhone' : fullName.trim();
    final cleanAddress = address?.trim();

    if (client != null) {
      try {
        final res = await client.post('/customers/identify', body: {
          'phoneNumber': cleanPhone,
          'fullName': cleanName,
          if (cleanAddress != null && cleanAddress.isNotEmpty) 'address': cleanAddress,
          if (branchId != null) 'branchId': branchId,
        });

        final user = CustomerUser.fromJson(res);
        setCustomer(user);
        return user;
      } catch (e) {
        debugPrint('CustomerAuthService.identify API error: $e');
        // Fallback to local session on API error or offline mode
      }
    }

    // Local / Offline Simulation mode
    final localUser = CustomerUser(
      id: 'CUST-${cleanPhone.replaceAll(RegExp(r'\D'), '')}',
      customerCode: 'KH-$cleanPhone',
      fullName: cleanName,
      phoneNumber: cleanPhone,
      address: cleanAddress ?? '123 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP.HCM',
      email: '$cleanPhone@pharmasecure.vn',
      points: 0,
      totalSpent: 0.0,
    );
    setCustomer(localUser);
    return localUser;
  }
}
