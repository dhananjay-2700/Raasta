import 'package:flutter_test/flutter_test.dart';
import 'package:bridgebharat/app.dart';

void main() {
  testWidgets('BridgeBharatApp renders successfully', (WidgetTester tester) async {
    await tester.pumpWidget(const BridgeBharatApp());
    expect(find.byType(BridgeBharatApp), findsOneWidget);
  });
}

