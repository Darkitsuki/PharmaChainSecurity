import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pharmasecure_mobile/app.dart';
import 'package:pharmasecure_mobile/core/theme/app_theme.dart';
import 'package:pharmasecure_mobile/data/demo_data.dart';

void main() {
  testWidgets('Missing API configuration cannot bypass authentication',
      (tester) async {
    await tester.pumpWidget(const PharmaSecureApp());
    await tester.pumpAndSettle();
    final login = tester.widget<FilledButton>(
        find.widgetWithText(FilledButton, 'Đăng nhập'));
    expect(login.onPressed, isNull);
    expect(find.byKey(const Key('auth-error')), findsOneWidget);
    expect(find.text('Xem giao diện mẫu'), findsNothing);
    expect(find.byType(PharmaShell), findsNothing);
    expect(tester.takeException(), isNull);
  });

  for (final width in [320.0, 1100.0]) {
    testWidgets('All preview screens render and scroll at width $width',
        (tester) async {
      tester.view.physicalSize = Size(width, 900);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      for (final section in AppSection.values) {
        await tester.pumpWidget(MaterialApp(
            key: UniqueKey(),
            theme: pharmaTheme(),
            home: PharmaShell(initialSection: section, onExit: () {})));
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull, reason: section.title);
        await tester.drag(find.byType(ListView).last, const Offset(0, -1400));
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull,
            reason: '${section.title} after scrolling');
      }
    });
  }

  testWidgets('Catalog search shows empty state and form cannot save',
      (tester) async {
    await tester.pumpWidget(MaterialApp(
        theme: pharmaTheme(),
        home: PharmaShell(initialSection: AppSection.catalog, onExit: () {})));
    await tester.enterText(find.byType(TextField), 'khong-co-thuoc-nay');
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(
        find.text('Không tìm thấy dữ liệu phù hợp.'), 150,
        scrollable: find.byType(Scrollable).first);
    expect(find.text('Không tìm thấy dữ liệu phù hợp.'), findsOneWidget);
    tester
        .state<ScrollableState>(find.byType(Scrollable).first)
        .position
        .jumpTo(0);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Xem mẫu thêm thuốc'));
    await tester.pumpAndSettle();
    final save = tester.widget<FilledButton>(
        find.widgetWithText(FilledButton, 'Lưu · Chưa kết nối'));
    expect(save.onPressed, isNull);
    expect(tester.takeException(), isNull);
  });
}
