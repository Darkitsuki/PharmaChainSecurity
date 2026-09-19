import 'dart:convert';
import 'package:http/http.dart' as http;

/// API Client for mobile application communicating with PharmaSecure Web API.
/// Mobile MUST NOT connect directly to SQL Server (Rule 01, Section 3).
class ApiClient {
  final String baseUrl;
  final http.Client _httpClient;

  ApiClient({required this.baseUrl, http.Client? client})
      : _httpClient = client ?? http.Client();

  Future<Map<String, dynamic>> get(
    String endpoint, {
    String? token,
    String? correlationId,
  }) async {
    final uri = Uri.parse('$baseUrl$endpoint');
    final headers = {
      'Content-Type': 'application/json',
      'X-Correlation-ID': correlationId ?? DateTime.now().millisecondsSinceEpoch.toString(),
      if (token != null) 'Authorization': 'Bearer $token',
    };

    final response = await _httpClient.get(uri, headers: headers);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else {
      throw Exception('API Error: ${response.statusCode} - ${response.body}');
    }
  }

  void dispose() {
    _httpClient.close();
  }
}
