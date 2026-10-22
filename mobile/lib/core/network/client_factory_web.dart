import 'package:http/http.dart' as http;

Future<http.Client> createHttpClient(Uri baseUrl, bool trustLocalDevCa) async {
  if (trustLocalDevCa) {
    throw const FormatException('Browser trust is configured by the browser.');
  }
  return http.Client();
}
