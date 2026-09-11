class NotificationModel {
  final String id;
  final String title;
  final String description;
  final String timeAgo;
  final String category; // Applications, Complaints, Schemes, Documents, General
  final String type; // success, warning, info
  bool isRead;

  NotificationModel({
    required this.id,
    required this.title,
    required this.description,
    required this.timeAgo,
    required this.category,
    required this.type,
    this.isRead = false,
  });
}
