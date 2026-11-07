import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:http/io_client.dart';

Future<http.Client> createHttpClient(Uri baseUrl, bool trustLocalDevCa) async {
  final context = SecurityContext(withTrustedRoots: true);

  if (trustLocalDevCa && kDebugMode) {
    try {
      final certificate = await rootBundle.load('assets/dev/localhost-ca.pem');
      context.setTrustedCertificatesBytes(certificate.buffer
          .asUint8List(certificate.offsetInBytes, certificate.lengthInBytes));
    } catch (_) {}
  }

  final httpClient = HttpClient(context: context)
    ..connectionTimeout = const Duration(seconds: 10);

  // Cho phép bỏ qua lỗi lệch tên miền chứng chỉ dev khi chạy Debug trên IP LAN
  if (trustLocalDevCa && kDebugMode) {
    httpClient.badCertificateCallback = (cert, host, port) => true;
  }

  return IOClient(httpClient);
}
