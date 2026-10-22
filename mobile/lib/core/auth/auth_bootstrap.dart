import '../network/api_client.dart';
import '../network/client_factory.dart';
import 'auth_session.dart';

Uri parseApiUrl(String value) {
  final uri = Uri.parse(value);
  if (uri.scheme != 'https' ||
      uri.host.isEmpty ||
      uri.userInfo.isNotEmpty ||
      uri.hasQuery ||
      uri.hasFragment ||
      uri.path != '/api/v1') {
    throw const FormatException('API_BASE_URL must be an HTTPS /api/v1 URL.');
  }
  return uri;
}

Future<AuthSession> createAuthSession() async {
  const url = String.fromEnvironment('API_BASE_URL');
  const trustLocalDevCa = bool.fromEnvironment('TRUST_LOCAL_DEV_CA');
  final uri = parseApiUrl(url);
  return AuthSession(ApiClient(
      baseUrl: uri.toString(),
      client: await createHttpClient(uri, trustLocalDevCa)));
}
