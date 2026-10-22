import 'dart:io';

// Read-only host probe; no credentials, database access or authentication writes.
// Run from mobile/: dart run tool/check_local_connection.dart
Future<void> main() async {
  final context = SecurityContext(withTrustedRoots: true)
    ..setTrustedCertificates('assets/dev/localhost-ca.pem');
  final client = HttpClient(context: context)
    ..connectionTimeout = const Duration(seconds: 10);
  var passed = true;
  try {
    for (final entry in {'/health/live': 200, '/api/v1/auth/me': 401}.entries) {
      final request =
          await client.getUrl(Uri.parse('https://localhost:55198${entry.key}'));
      request.followRedirects = false;
      final response =
          await request.close().timeout(const Duration(seconds: 15));
      stdout.writeln(
          '${entry.key}: HTTP ${response.statusCode} (expected ${entry.value})');
      await response.drain<void>();
      passed = passed && response.statusCode == entry.value;
    }
  } catch (_) {
    stdout.writeln(
        'TLS/network probe failed. Check backend, port and public dev certificate.');
    passed = false;
  } finally {
    client.close(force: true);
  }
  exitCode = passed ? 0 : 1;
}
