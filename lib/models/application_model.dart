import 'complaint_model.dart';

class ApplicationModel {
  final String id;
  final String title;
  final String department;
  final int progress; // 0-100
  final String status; // Documents Pending, Form Incomplete, Under Review, Completed, etc.
  final String dueDate;
  final String appliedDate;
  final String lastUpdate;
  final String estCompletion;
  final List<TimelineStep> timeline;

  ApplicationModel({
    required this.id,
    required this.title,
    required this.department,
    required this.progress,
    required this.status,
    required this.dueDate,
    required this.appliedDate,
    required this.lastUpdate,
    required this.estCompletion,
    required this.timeline,
  });
}
