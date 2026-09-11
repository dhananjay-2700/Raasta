class DocumentModel {
  final String id;
  final String name;
  final String type;
  final String category; // Identity, Certificates, Education, Property, Vehicle, Health, Finance
  final String size;
  final String uploadedDate;
  final String? expiryDate;
  final String status; // Verified, Expiring Soon, Uploaded
  final bool isShared;

  DocumentModel({
    required this.id,
    required this.name,
    required this.type,
    required this.category,
    required this.size,
    required this.uploadedDate,
    this.expiryDate,
    required this.status,
    this.isShared = false,
  });
}
