class TimelineStep {
  final String title;
  final String date;
  final bool isCompleted;
  final bool isCurrent;

  TimelineStep({
    required this.title,
    required this.date,
    this.isCompleted = false,
    this.isCurrent = false,
  });
}

class ComplaintModel {
  final String id;
  final String title;
  final String category; // pothole, garbage, water, streetlight, etc.
  final String location;
  final String status; // Resolved, In Progress, Assigned, Verified
  final String date;
  final String department;
  final String priority; // High, Medium, Low
  final List<TimelineStep> timeline;

  ComplaintModel({
    required this.id,
    required this.title,
    required this.category,
    required this.location,
    required this.status,
    required this.date,
    required this.department,
    required this.priority,
    required this.timeline,
  });
}
