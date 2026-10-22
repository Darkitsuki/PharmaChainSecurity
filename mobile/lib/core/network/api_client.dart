import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode});
  final String message;
  final int? statusCode;
  @override
  String toString() => message;
}

class ApiClient {
  ApiClient(
      {required this.baseUrl,
      http.Client? client,
      this.timeout = const Duration(seconds: 15)})
      : _httpClient = client ?? http.Client();
  final String baseUrl;
  final http.Client _httpClient;
  final Duration timeout;

  Future<Map<String, dynamic>> get(String endpoint,
          {String? token, String? correlationId}) =>
      _send('GET', endpoint, token: token, correlationId: correlationId);

  Future<Map<String, dynamic>> post(String endpoint,
          {Map<String, dynamic>? body, String? token}) =>
      _send('POST', endpoint, body: body, token: token);

  Future<Map<String, dynamic>> _send(String method, String endpoint,
      {Map<String, dynamic>? body,
      String? token,
      String? correlationId}) async {
    try {
      final request = http.Request(method, Uri.parse('$baseUrl$endpoint'))
        ..followRedirects = false
        ..headers.addAll({
          'Content-Type': 'application/json',
          'X-Correlation-ID':
              correlationId ?? DateTime.now().microsecondsSinceEpoch.toString(),
          if (token != null) 'Authorization': 'Bearer $token',
        });
      if (body != null) request.body = jsonEncode(body);
      final response = await (() async =>
              http.Response.fromStream(await _httpClient.send(request)))()
          .timeout(timeout);
      if (response.statusCode < 200 || response.statusCode >= 300) {
        // Never surface raw responses: they may contain diagnostics or secrets.
        throw ApiException(
            switch (response.statusCode) {
              400 => 'Thông tin gửi lên không hợp lệ.',
              401 => 'Thông tin đăng nhập không hợp lệ hoặc phiên đã hết hạn.',
              403 => 'Tài khoản không có quyền truy cập.',
              404 => 'Không tìm thấy tài khoản hoặc API.',
              429 => 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
              >= 500 => 'Máy chủ gặp lỗi. Vui lòng thử lại sau.',
              _ => 'Yêu cầu không thành công (HTTP ${response.statusCode}).',
            },
            statusCode: response.statusCode);
      }
      if (response.statusCode == 204) return {};
      final decoded = jsonDecode(utf8.decode(response.bodyBytes));
      if (decoded is! Map<String, dynamic>) throw const FormatException();
      return decoded;
    } on ApiException {
      rethrow;
    } on TimeoutException {
      throw const ApiException(
          'Kết nối quá thời gian. Kiểm tra mạng và thử lại.');
    } on FormatException {
      throw const ApiException('Phản hồi máy chủ không hợp lệ.');
    } catch (_) {
      throw const ApiException(
          'Không thể kết nối an toàn. Kiểm tra mạng, API URL và chứng chỉ TLS.');
    }
  }

  void dispose() => _httpClient.close();
}
