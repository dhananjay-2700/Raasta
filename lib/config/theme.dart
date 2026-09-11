import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'constants.dart';

class AppTheme {
  static ThemeData lightTheme({bool largeText = false}) {
    final double textMultiplier = largeText ? 1.25 : 1.0;

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: AppColors.primary,
      scaffoldBackgroundColor: AppColors.background,
      colorScheme: const ColorScheme.light(
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        surface: AppColors.surface,
        error: AppColors.danger,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: AppColors.textPrimary,
      ),
      textTheme: GoogleFonts.notoSansTextTheme().copyWith(
        displayLarge: TextStyle(
          fontSize: 28 * textMultiplier,
          fontWeight: FontWeight.bold,
          color: AppColors.textPrimary,
        ),
        headlineMedium: TextStyle(
          fontSize: 22 * textMultiplier,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
        titleLarge: TextStyle(
          fontSize: 18 * textMultiplier,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
        bodyLarge: TextStyle(
          fontSize: 18 * textMultiplier,
          fontWeight: FontWeight.normal,
          color: AppColors.textPrimary,
        ),
        bodyMedium: TextStyle(
          fontSize: 14 * textMultiplier,
          fontWeight: FontWeight.normal,
          color: AppColors.textSecondary,
        ),
        bodySmall: TextStyle(
          fontSize: 13 * textMultiplier,
          fontWeight: FontWeight.normal,
          color: AppColors.textMuted,
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.background,
        elevation: 0,
        scrolledUnderElevation: 1,
        iconTheme: IconThemeData(color: AppColors.textPrimary),
        titleTextStyle: TextStyle(
          color: AppColors.textPrimary,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.background,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          side: const BorderSide(color: AppColors.borderLight, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          minimumSize: const Size(48, 48),
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          side: const BorderSide(color: AppColors.primary, width: 1.5),
          minimumSize: const Size(48, 48),
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
      ),
    );
  }

  static ThemeData highContrastTheme({bool largeText = false}) {
    final double textMultiplier = largeText ? 1.25 : 1.0;

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      primaryColor: HighContrastColors.primary,
      scaffoldBackgroundColor: HighContrastColors.background,
      colorScheme: const ColorScheme.dark(
        primary: HighContrastColors.primary,
        secondary: HighContrastColors.secondary,
        surface: HighContrastColors.surface,
        error: HighContrastColors.danger,
        onPrimary: Colors.black,
        onSecondary: Colors.black,
        onSurface: HighContrastColors.textPrimary,
      ),
      textTheme: GoogleFonts.notoSansTextTheme().copyWith(
        displayLarge: TextStyle(
          fontSize: 28 * textMultiplier,
          fontWeight: FontWeight.bold,
          color: HighContrastColors.textPrimary,
        ),
        headlineMedium: TextStyle(
          fontSize: 22 * textMultiplier,
          fontWeight: FontWeight.w600,
          color: HighContrastColors.textPrimary,
        ),
        titleLarge: TextStyle(
          fontSize: 18 * textMultiplier,
          fontWeight: FontWeight.w600,
          color: HighContrastColors.textPrimary,
        ),
        bodyLarge: TextStyle(
          fontSize: 18 * textMultiplier,
          fontWeight: FontWeight.normal,
          color: HighContrastColors.textPrimary,
        ),
        bodyMedium: TextStyle(
          fontSize: 14 * textMultiplier,
          fontWeight: FontWeight.normal,
          color: HighContrastColors.textSecondary,
        ),
        bodySmall: TextStyle(
          fontSize: 13 * textMultiplier,
          fontWeight: FontWeight.normal,
          color: HighContrastColors.textMuted,
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: HighContrastColors.background,
        elevation: 0,
        iconTheme: IconThemeData(color: HighContrastColors.textPrimary),
        titleTextStyle: TextStyle(
          color: HighContrastColors.textPrimary,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
      cardTheme: CardThemeData(
        color: HighContrastColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          side: const BorderSide(color: HighContrastColors.border, width: 2),
        ),
      ),
    );
  }
}
