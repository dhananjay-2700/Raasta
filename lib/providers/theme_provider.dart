import 'package:flutter/material.dart';

class ThemeProvider extends ChangeNotifier {
  bool _isHighContrast = false;
  bool _isLargeText = false;

  bool get isHighContrast => _isHighContrast;
  bool get isLargeText => _isLargeText;

  void toggleHighContrast() {
    _isHighContrast = !_isHighContrast;
    notifyListeners();
  }

  void toggleLargeText() {
    _isLargeText = !_isLargeText;
    notifyListeners();
  }

  void setHighContrast(bool value) {
    _isHighContrast = value;
    notifyListeners();
  }

  void setLargeText(bool value) {
    _isLargeText = value;
    notifyListeners();
  }
}
