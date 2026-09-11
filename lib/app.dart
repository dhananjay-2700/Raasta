import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'config/theme.dart';
import 'providers/chat_provider.dart';
import 'providers/form_provider.dart';
import 'providers/language_provider.dart';
import 'providers/notification_provider.dart';
import 'providers/theme_provider.dart';
import 'screens/main_screen.dart';
import 'widgets/mobile_device_frame.dart';

class BridgeBharatApp extends StatelessWidget {
  const BridgeBharatApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => LanguageProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
        ChangeNotifierProvider(create: (_) => FormProvider()),
        ChangeNotifierProvider(create: (_) => ChatProvider()),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, _) {
          return MaterialApp(
            title: 'BridgeBharat Mobile App',
            debugShowCheckedModeBanner: false,
            theme: themeProvider.isHighContrast
                ? AppTheme.highContrastTheme(largeText: themeProvider.isLargeText)
                : AppTheme.lightTheme(largeText: themeProvider.isLargeText),
            home: const MobileDeviceFrame(child: MainScreen()),
          );
        },
      ),
    );
  }
}
