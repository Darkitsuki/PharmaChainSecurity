import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:pharmasecure_mobile/app.dart';
import 'package:pharmasecure_mobile/core/auth/auth_bootstrap.dart';
import 'package:pharmasecure_mobile/core/auth/auth_session.dart';
import 'package:pharmasecure_mobile/core/network/api_client.dart';
import 'package:pharmasecure_mobile/data/demo_data.dart';

Map<String, dynamic> profile([String role = 'OWNER']) => {
      'userId': 'test-user',
      'username': 'test-user',
      'fullName': 'Test User',
      'role': role,
      'branchId': 'test-branch',
      'branchName': 'Test Branch',
    };
http.Response loginResponse({String role = 'OWNER', int seconds = 600}) =>
    http.Response(
        jsonEncode({
          'accessToken': 'unit-test-only-token',
          'tokenType': 'Bearer',
          'expiresInSeconds': seconds,
          'user': profile(role)
        }),
        200);

AuthSession sessionFor(Future<http.Response> Function(http.Request) handler,
    {Duration timeout = const Duration(seconds: 15)}) {
  final auth = AuthSession(ApiClient(
      baseUrl: 'https://unit.test/api/v1',
      client: MockClient(handler),
      timeout: timeout));
  addTearDown(auth.dispose);
  return auth;
}

void main() {
  test('API configuration requires HTTPS, versioned path and no credentials',
      () {
    expect(parseApiUrl('https://localhost:55198/api/v1').host, 'localhost');
    for (final url in [
      '',
      'http://localhost/api/v1',
      'https://user:password@example.test/api/v1',
      'https://example.test/api/v1?token=x',
      'https://example.test/api'
    ]) {
      expect(() => parseApiUrl(url), throwsFormatException);
    }
  });

  test('Login sends credentials once, verifies bearer with me, then logout 204',
      () async {
    final paths = <String>[];
    final auth = sessionFor((request) async {
      paths.add(request.url.path);
      expect(request.followRedirects, isFalse);
      if (request.url.path.endsWith('/login')) {
        expect(request.method, 'POST');
        expect(jsonDecode(request.body),
            {'username': 'test-user', 'password': 'test-password'});
        expect(request.headers['Authorization'], isNull);
        return loginResponse();
      }
      expect(request.headers['Authorization'], 'Bearer unit-test-only-token');
      if (request.url.path.endsWith('/me')) {
        expect(request.method, 'GET');
        return http.Response(jsonEncode(profile()), 200);
      }
      expect(request.method, 'POST');
      return http.Response('', 204);
    });
    await auth.signIn(' test-user ', 'test-password');
    expect(auth.user?.branchId, 'test-branch');
    expect(auth.error, isNull);
    await auth.signOut();
    expect(auth.user, isNull);
    expect(auth.error, isNull);
    expect(paths,
        ['/api/v1/auth/login', '/api/v1/auth/me', '/api/v1/auth/logout']);
  });

  for (final status in [401, 500]) {
    test('Login HTTP $status does not authenticate or expose raw response',
        () async {
      var calls = 0;
      final auth = sessionFor((_) async {
        calls++;
        return http.Response('sensitive-server-diagnostics', status);
      });
      await auth.signIn('test-user', 'wrong-test-password');
      expect(auth.user, isNull);
      expect(auth.error, isNotNull);
      expect(auth.error, isNot(contains('sensitive-server-diagnostics')));
      expect(auth.busy, isFalse);
      expect(calls, 1);
    });
  }

  test('Network failure never authenticates', () async {
    final auth = sessionFor((_) async => throw http.ClientException('offline'));
    await auth.signIn('test-user', 'test-password');
    expect(auth.user, isNull);
    expect(auth.error, contains('kết nối'));
    expect(auth.busy, isFalse);
  });

  test('Login 200 followed by me 401 is rejected', () async {
    final auth = sessionFor((request) async =>
        request.method == 'POST' ? loginResponse() : http.Response('', 401));
    await auth.signIn('test-user', 'test-password');
    expect(auth.user, isNull);
    expect(auth.error, isNotNull);
  });

  test('Unknown server role is denied rather than promoted to OWNER', () async {
    final auth = sessionFor((_) async => loginResponse(role: 'UNKNOWN'));
    await auth.signIn('test-user', 'test-password');
    expect(auth.user, isNull);
    expect(auth.error, isNotNull);
  });

  test('Resume me 401 clears session', () async {
    var reads = 0;
    final auth = sessionFor((request) async {
      if (request.method == 'POST') return loginResponse();
      return ++reads == 1
          ? http.Response(jsonEncode(profile()), 200)
          : http.Response('', 401);
    });
    await auth.signIn('test-user', 'test-password');
    expect(auth.user, isNotNull);
    await auth.validate();
    expect(auth.user, isNull);
    expect(auth.error, isNotNull);
  });

  test('Offline logout clears memory before request times out', () async {
    final pending = Completer<http.Response>();
    final auth = sessionFor((request) async {
      if (request.url.path.endsWith('/logout')) return pending.future;
      return request.method == 'POST'
          ? loginResponse()
          : http.Response(jsonEncode(profile()), 200);
    }, timeout: const Duration(milliseconds: 20));
    await auth.signIn('test-user', 'test-password');
    final logout = auth.signOut();
    expect(auth.user, isNull);
    await logout;
    expect(auth.user, isNull);
    expect(auth.busy, isFalse);
    expect(auth.error, contains('chưa xác nhận'));
    pending.complete(http.Response('', 204));
  });

  test('Duplicate submit is prevented and late login cannot restore logout',
      () async {
    final pending = Completer<http.Response>();
    final started = Completer<void>();
    var calls = 0;
    final auth = sessionFor((_) {
      calls++;
      started.complete();
      return pending.future;
    });
    final login = auth.signIn('test-user', 'test-password');
    await auth.signIn('test-user', 'test-password');
    await started.future;
    expect(calls, 1);
    await auth.signOut();
    pending.complete(loginResponse());
    await login;
    expect(auth.user, isNull);
    expect(auth.busy, isFalse);
  });

  for (final entry in {
    'OWNER': AppSection.reports,
    'WAREHOUSE': AppSection.inventory,
    'SALES': AppSection.checkout
  }.entries) {
    testWidgets('${entry.key} gets Web landing and allowed navigation only',
        (tester) async {
      final auth = sessionFor((request) async => request.method == 'POST'
          ? loginResponse(role: entry.key)
          : http.Response(jsonEncode(profile(entry.key)), 200));
      await tester.pumpWidget(PharmaSecureApp(session: auth));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextFormField).first, 'test-user');
      await tester.enterText(find.byType(TextFormField).last, 'test-password');
      await tester.ensureVisible(find.text('Đăng nhập'));
      await tester.tap(find.text('Đăng nhập'));
      await tester.pumpAndSettle();
      expect(
          tester.widget<PharmaShell>(find.byType(PharmaShell)).initialSection,
          entry.value);
      await tester.tap(find.byTooltip('Open navigation menu'));
      await tester.pumpAndSettle();
      expect(find.text('Test User'), findsOneWidget);
      expect(find.text('Test Branch · test-branch'), findsOneWidget);
      if (entry.key != 'OWNER') {
        expect(find.text('Danh mục thuốc'), findsNothing);
        expect(find.text('Quản lý nhân viên'), findsNothing);
      }
      await tester.tap(find.widgetWithText(OutlinedButton, 'Đăng xuất'));
      await tester.pumpAndSettle();
      expect(find.byType(PharmaShell), findsNothing);
      expect(find.byType(TextFormField), findsNWidgets(2));
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('Token expiry removes authenticated UI', (tester) async {
    final auth = sessionFor((request) async => request.method == 'POST'
        ? loginResponse(seconds: 2)
        : http.Response(jsonEncode(profile()), 200));
    await auth.signIn('test-user', 'test-password');
    await tester.pumpWidget(PharmaSecureApp(session: auth));
    await tester.pumpAndSettle();
    expect(find.byType(PharmaShell), findsOneWidget);
    await tester.pump(const Duration(seconds: 3));
    await tester.pumpAndSettle();
    expect(find.byType(PharmaShell), findsNothing);
    expect(auth.user, isNull);
    expect(find.textContaining('Phiên đã hết hạn'), findsOneWidget);
  });

  testWidgets('Failed login shows error, clears password and stays on login',
      (tester) async {
    final auth = sessionFor((_) async => http.Response('', 401));
    await tester.pumpWidget(PharmaSecureApp(session: auth));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextFormField).first, 'test-user');
    await tester.enterText(
        find.byType(TextFormField).last, 'wrong-test-password');
    await tester.ensureVisible(find.text('Đăng nhập'));
    await tester.tap(find.text('Đăng nhập'));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('auth-error')), findsOneWidget);
    expect(find.byType(PharmaShell), findsNothing);
    expect(
        tester
            .widget<TextFormField>(find.byType(TextFormField).last)
            .controller!
            .text,
        isEmpty);
    expect(auth.user, isNull);
  });
}
