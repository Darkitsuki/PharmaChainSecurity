import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:http/io_client.dart';

Future<http.Client> createHttpClient(Uri baseUrl, bool trustLocalDevCa) async {
  final context = SecurityContext(withTrustedRoots: true);
  if (trustLocalDevCa) {
    if (!kDebugMode ||
        baseUrl.scheme != 'https' ||
        baseUrl.host != 'localhost') {
      throw const FormatException(
          'Local CA is only allowed for debug localhost.');
    }
    final certificate = await rootBundle.load('assets/dev/localhost-ca.pem');
    context.setTrustedCertificatesBytes(certificate.buffer
        .asUint8List(certificate.offsetInBytes, certificate.lengthInBytes));
  }
  // Chain, hostname and validity checks remain enabled. No TLS bypass callback.
  return IOClient(HttpClient(context: context)
    ..connectionTimeout = const Duration(seconds: 10));
}
