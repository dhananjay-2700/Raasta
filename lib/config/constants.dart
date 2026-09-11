import 'package:flutter/material.dart';

class AppColors {
  // Primary — Government Blue
  static const Color primary = Color(0xFF0B5FFF);
  static const Color primaryDark = Color(0xFF08419C);
  static const Color primaryLight = Color(0xFFE8F0FF);

  // Secondary — Saffron/Success Green
  static const Color secondary = Color(0xFF0E7C3A);
  static const Color secondaryLight = Color(0xFFE6F5EC);

  // Accent — Orange
  static const Color accent = Color(0xFFFF6B00);
  static const Color accentLight = Color(0xFFFFF3E8);

  // Danger — Red
  static const Color danger = Color(0xFFB3261E);
  static const Color dangerLight = Color(0xFFFDECEA);

  // Warning — Amber
  static const Color warning = Color(0xFF8A5B00);
  static const Color warningLight = Color(0xFFFFF8E6);

  // Text
  static const Color textPrimary = Color(0xFF1A1A1A);
  static const Color textSecondary = Color(0xFF4B4B4B);
  static const Color textMuted = Color(0xFF6B7280);

  // Surface
  static const Color background = Color(0xFFFFFFFF);
  static const Color surface = Color(0xFFF5F6F8);
  static const Color surfaceHover = Color(0xFFEBEDF0);
  static const Color border = Color(0xFFD0D3D8);
  static const Color borderLight = Color(0xFFE5E7EB);
}

class HighContrastColors {
  static const Color primary = Color(0xFF66B2FF);
  static const Color secondary = Color(0xFF66FF99);
  static const Color accent = Color(0xFFFFB366);
  static const Color danger = Color(0xFFFF6666);
  static const Color warning = Color(0xFFFFD966);
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFFE0E0E0);
  static const Color textMuted = Color(0xFFB0B0B0);
  static const Color background = Color(0xFF000000);
  static const Color surface = Color(0xFF111111);
  static const Color border = Color(0xFFFFFFFF);
}

class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;
  static const double xxxl = 64;
}

class AppRadius {
  static const double sm = 6;
  static const double md = 8;
  static const double lg = 12;
  static const double xl = 16;
  static const double full = 9999;
}
