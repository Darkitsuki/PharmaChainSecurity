import 'package:flutter/foundation.dart';
import '../core/network/api_client.dart';

class CustomerUser {
  const CustomerUser({
    required this.id,
    required this.fullName,
    required this.phoneNumber,
    this.address,
    this.email,
  });

  final String id;
  final String fullName;
  final String phoneNumber;
  final String? address;
  final String? email;

  factory CustomerUser.fromJson(Map<String, dynamic> json) {
    return CustomerUser(
      id: json['id'] as String? ?? 'CUST-${DateTime.now().millisecondsSinceEpoch}',
      fullName: json['fullName'] as String? ?? json['name'] as String? ?? 'Khách hàng',
      phoneNumber: json['phoneNumber'] as String? ?? json['phone'] as String? ?? '',
      address: json['address'] as String?,
      email: json['email'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'fullName': fullName,
        'phoneNumber': phoneNumber,
        'address': address,
        'email': email,
      };
}

class CustomerAuthService extends ChangeNotifier {
  CustomerAuthService._();
  static final CustomerAuthService instance = CustomerAuthService._();

  CustomerUser? _currentUser;
  CustomerUser? get currentUser => _currentUser;
  bool get isLoggedIn => _currentUser != null;

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
  }) async {
    final cleanPhone = phoneNumber.trim();
    final cleanName = fullName.trim().isEmpty ? 'Khách hàng $cleanPhone' : fullName.trim();
    final cleanAddress = address?.trim();

    if (api != null && token != null) {
      try {
        // 1. Search existing customer by phone
        final searchRes = await api.get('/customers?phone=${Uri.encodeComponent(cleanPhone)}', token: token);
        final items = searchRes['items'] ?? searchRes['data'];
        if (items is List && items.isNotEmpty) {
          final first = items.first;
          if (first is Map) {
            final user = CustomerUser(
              id: first['id'] as String? ?? 'CUST-$cleanPhone',
              fullName: first['fullName'] as String? ?? cleanName,
              phoneNumber: first['phoneNumber'] as String? ?? cleanPhone,
              address: first['address'] as String? ?? cleanAddress,
              email: first['email'] as String?,
            );
            setCustomer(user);
            return user;
          }
        }

        // 2. Register new customer if not found
        final newRes = await api.post('/customers', body: {
          'fullName': cleanName,
          'phoneNumber': cleanPhone,
          'address': cleanAddress ?? 'Chi nhánh Quận 1',
          'email': '$cleanPhone@pharmasecure.vn',
        }, token: token);

        final user = CustomerUser(
          id: newRes['id'] as String? ?? 'CUST-$cleanPhone',
          fullName: cleanName,
          phoneNumber: cleanPhone,
          address: cleanAddress,
          email: '$cleanPhone@pharmasecure.vn',
        );
        setCustomer(user);
        return user;
      } catch (_) {
        // Fallback to local session on API error
      }
    }

    // Local / Offline Simulation mode
    final localUser = CustomerUser(
      id: 'CUST-${cleanPhone.replaceAll(RegExp(r'\D'), '')}',
      fullName: cleanName,
      phoneNumber: cleanPhone,
      address: cleanAddress ?? '123 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP.HCM',
      email: '$cleanPhone@pharmasecure.vn',
    );
    setCustomer(localUser);
    return localUser;
  }
}

