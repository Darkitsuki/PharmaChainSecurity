import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pharmasecure_mobile/app.dart';
import 'package:pharmasecure_mobile/core/theme/app_theme.dart';

void main() {
  testWidgets('Drawer opens staff screen', (tester) async {
    await tester.pumpWidget(
        MaterialApp(theme: pharmaTheme(), home: PharmaShell(onExit: () {})));
    await tester.tap(find.byTooltip('Open navigation menu'));
    await tester.pumpAndSettle();
    final drawerScroll = find
        .descendant(of: find.byType(Drawer), matching: find.byType(Scrollable))
        .first;
    await tester.scrollUntilVisible(find.text('Quản lý nhân viên'), 150,
        scrollable: drawerScroll);
    await tester.tap(find.text('Quản lý nhân viên'));
    await tester.pumpAndSettle();
    expect(find.text('Quản lý nhân viên'), findsOneWidget);
    await tester.scrollUntilVisible(find.text('Nguyễn Hoàng'), 150,
        scrollable: find.byType(Scrollable).first);
    expect(find.text('Nguyễn Hoàng'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
