import 'package:flutter/material.dart';

class FormFieldData {
  final String name;
  final String label;
  String value;
  String status; // 'filled' (AI), 'manual' (User), 'missing'
  String source;
  final bool required;
  final String type; // text, select, date, tel, email, textarea
  final List<String>? options;

  FormFieldData({
    required this.name,
    required this.label,
    this.value = '',
    this.status = 'missing',
    this.source = '',
    this.required = true,
    this.type = 'text',
    this.options,
  });
}

class FormMeta {
  final String title;
  final String serviceId;
  final String serviceName;
  final String department;
  final String fee;
  final String timeline;
  final List<FormFieldData> fields;

  FormMeta({
    required this.title,
    required this.serviceId,
    required this.serviceName,
    required this.department,
    required this.fee,
    required this.timeline,
    required this.fields,
  });
}

class FormProvider extends ChangeNotifier {
  FormMeta? _formMeta;
  Map<String, FormFieldData> _fields = {};
  bool _isFormActive = false;
  Map<String, String> _preFilledFields = {};

  FormMeta? get formMeta => _formMeta;
  Map<String, FormFieldData> get fields => _fields;
  bool get isFormActive => _isFormActive;
  Map<String, String> get preFilledFields => _preFilledFields;

  int get completionScore {
    if (_fields.isEmpty) return 0;
    final requiredFields = _fields.values.where((f) => f.required).toList();
    if (requiredFields.isEmpty) return 100;
    final filledCount = requiredFields.where((f) => f.value.trim().isNotEmpty).length;
    return ((filledCount / requiredFields.length) * 100).round();
  }

  void setPreFilledFields(Map<String, String> data) {
    _preFilledFields = data;
    notifyListeners();
  }

  void registerForm(FormMeta meta) {
    _formMeta = meta;
    _fields = {};
    for (var f in meta.fields) {
      // Check pre-filled fields
      String val = f.value;
      String status = f.status;
      String src = f.source;

      if (_preFilledFields.containsKey(f.name) && _preFilledFields[f.name]!.isNotEmpty) {
        val = _preFilledFields[f.name]!;
        status = 'filled';
        src = 'AI Search Pre-fill';
      }

      _fields[f.name] = FormFieldData(
        name: f.name,
        label: f.label,
        value: val,
        status: val.isNotEmpty ? status : (f.required ? 'missing' : 'optional'),
        source: src,
        required: f.required,
        type: f.type,
        options: f.options,
      );
    }
    _isFormActive = true;
    notifyListeners();
  }

  void unregisterForm() {
    _formMeta = null;
    _fields = {};
    _isFormActive = false;
    notifyListeners();
  }

  void fillField(String fieldName, String value, {String source = 'AI Agent'}) {
    if (_fields.containsKey(fieldName)) {
      _fields[fieldName]!.value = value;
      _fields[fieldName]!.status = 'filled';
      _fields[fieldName]!.source = source;
      notifyListeners();
    }
  }

  void fillMultipleFields(Map<String, String> fieldValues, {String source = 'AI Agent'}) {
    bool updated = false;
    fieldValues.forEach((key, val) {
      // Direct match or case-insensitive match
      String? targetKey;
      if (_fields.containsKey(key)) {
        targetKey = key;
      } else {
        final match = _fields.keys.firstWhere(
          (k) => k.toLowerCase() == key.toLowerCase() || _fields[k]!.label.toLowerCase() == key.toLowerCase(),
          orElse: () => '',
        );
        if (match.isNotEmpty) targetKey = match;
      }

      if (targetKey != null && targetKey.isNotEmpty) {
        _fields[targetKey]!.value = val;
        _fields[targetKey]!.status = 'filled';
        _fields[targetKey]!.source = source;
        updated = true;
      }
    });

    if (updated) {
      notifyListeners();
    }
  }

  void updateFieldManually(String fieldName, String value) {
    if (_fields.containsKey(fieldName)) {
      final field = _fields[fieldName]!;
      field.value = value;
      field.status = value.trim().isEmpty ? (field.required ? 'missing' : 'optional') : 'manual';
      field.source = 'User Input';
      notifyListeners();
    }
  }

  Map<String, dynamic> getFormSummary() {
    if (!_isFormActive || _formMeta == null) return {};

    final List<Map<String, dynamic>> allFieldsList = [];
    _fields.forEach((key, field) {
      allFieldsList.add({
        'name': field.name,
        'label': field.label,
        'value': field.value,
        'filled': field.value.isNotEmpty,
        'required': field.required,
        'status': field.status,
      });
    });

    return {
      'title': _formMeta!.title,
      'service': _formMeta!.serviceName,
      'totalFields': _fields.length,
      'completionScore': completionScore,
      'allFields': allFieldsList,
    };
  }
}
