import 'package:http/http.dart' as http;

Future<http.Client> createHttpClient(Uri baseUrl, bool trustLocalDevCa) async {
  // On web, SSL/TLS certificate trust is managed by the browser directly.
  return http.Client();
}
