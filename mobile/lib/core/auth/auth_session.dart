import 'dart:async';
import 'package:flutter/foundation.dart';
import '../network/api_client.dart';

class AuthUser {
  const AuthUser(
      {required this.userId,
      required this.username,
      required this.fullName,
      required this.role,
      required this.branchId,
      required this.branchName});
  final String userId, username, fullName, role, branchId, branchName;

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    String field(String key) {
      final value = json[key];
      if (value is! String || value.isEmpty) throw const FormatException();
      return value;
    }

    final user = AuthUser(
        userId: field('userId'),
        username: field('username'),
        fullName: field('fullName'),
        role: field('role'),
        branchId: field('branchId'),
        branchName: field('branchName'));
    if (!['OWNER', 'SALES', 'WAREHOUSE'].contains(user.role)) {
      throw const FormatException();
    }
    return user;
  }
}

/// Memory-only session. No password/token is written to disk or logs.
class AuthSession extends ChangeNotifier {
  AuthSession(this.api);
  final ApiClient api;
  AuthUser? user;
  bool busy = false;
  String? error;
  String? _token;
  DateTime? _expiresAt;
  Timer? _expiryTimer;
  int _generation = 0;
  bool _disposed = false;

  void _emit() {
    if (!_disposed) notifyListeners();
  }

  void _clear() {
    _token = null;
    user = null;
    _expiresAt = null;
    _expiryTimer?.cancel();
  }

  Future<void> signIn(String username, String password) async {
    if (busy || _disposed) return;
    final generation = ++_generation;
    _clear();
    busy = true;
    error = null;
    _emit();
    try {
      final login = await api.post('/auth/login', body: {
        'username': username.trim(),
        'password': password,
      });
      if (generation != _generation || _disposed) return;
      final token = login['accessToken'];
      final seconds = login['expiresInSeconds'];
      if (token is! String ||
          token.isEmpty ||
          login['tokenType'] != 'Bearer' ||
          seconds is! int ||
          seconds <= 0) {
        throw const FormatException();
      }
      final loginUser =
          AuthUser.fromJson(login['user'] as Map<String, dynamic>);
      final expiresAt = DateTime.now().add(Duration(seconds: seconds));
      final verified =
          AuthUser.fromJson(await api.get('/auth/me', token: token));
      if (generation != _generation || _disposed) return;
      if (verified.userId != loginUser.userId ||
          !DateTime.now().isBefore(expiresAt)) {
        throw const FormatException();
      }
      _token = token;
      _expiresAt = expiresAt;
      user = verified;
      _expiryTimer = Timer(expiresAt.difference(DateTime.now()), () {
        ++_generation;
        _clear();
        busy = false;
        error = 'Phiên đã hết hạn. Vui lòng đăng nhập lại.';
        _emit();
      });
    } catch (e) {
      if (generation != _generation || _disposed) return;
      _clear();
      error = e is ApiException
          ? e.message
          : 'Dữ liệu xác thực từ máy chủ không hợp lệ.';
    } finally {
      if (generation == _generation && !_disposed) {
        busy = false;
        _emit();
      }
    }
  }

  /// Revalidate with the server when the app resumes. Fail closed on error.
  Future<void> validate() async {
    if (_token == null || busy || _disposed) return;
    final generation = _generation;
    busy = true;
    _emit();
    try {
      if (_expiresAt == null || !DateTime.now().isBefore(_expiresAt!)) {
        throw const ApiException('Phiên đã hết hạn. Vui lòng đăng nhập lại.',
            statusCode: 401);
      }
      final verified =
          AuthUser.fromJson(await api.get('/auth/me', token: _token));
      if (generation == _generation && !_disposed) user = verified;
    } catch (e) {
      if (generation != _generation || _disposed) return;
      _clear();
      error = e is ApiException
          ? e.message
          : 'Không thể xác minh phiên. Vui lòng đăng nhập lại.';
    } finally {
      if (generation == _generation && !_disposed) {
        busy = false;
        _emit();
      }
    }
  }

  Future<void> signOut() async {
    if (_disposed) return;
    final token = _token;
    final generation = ++_generation;
    _clear(); // Clear locally immediately, even while the server is unreachable.
    busy = token != null;
    error = null;
    _emit();
    try {
      if (token != null) await api.post('/auth/logout', token: token);
    } catch (_) {
      if (generation == _generation && !_disposed) {
        error =
            'Phiên trên máy đã được xóa; chưa xác nhận đăng xuất với máy chủ.';
      }
    } finally {
      if (generation == _generation && !_disposed) {
        busy = false;
        _emit();
      }
    }
  }

  @override
  void dispose() {
    _disposed = true;
    ++_generation;
    _clear();
    api.dispose();
    super.dispose();
  }
}
