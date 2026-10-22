import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:pharmasecure_mobile/app.dart';
import 'package:pharmasecure_mobile/core/auth/auth_bootstrap.dart';
import 'package:pharmasecure_mobile/core/network/api_client.dart';

// Optional read-only Android smoke probe. Never sends login credentials.
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  const url = String.fromEnvironment('API_BASE_URL');
  final uri = parseApiUrl(url);
  if (!kDebugMode || uri.host != 'localhost' || uri.port != 55198) {
    throw StateError('This probe is restricted to the local debug backend.');
  }
  final session = await createAuthSession();
  try {
    await session.api.get('/auth/me');
    debugPrint('LOCAL_AUTH_TLS_PROBE: FAIL unexpected unauthenticated success');
  } on ApiException catch (error) {
    debugPrint(error.statusCode == 401
        ? 'LOCAL_AUTH_TLS_PROBE: PASS HTTP 401, strict TLS'
        : 'LOCAL_AUTH_TLS_PROBE: FAIL network/TLS or unexpected HTTP status');
  } finally {
    session.dispose();
  }
  runApp(const PharmaSecureApp());
}
