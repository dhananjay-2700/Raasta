class ServiceModel {
  final String id;
  final String title;
  final String category;
  final String fee;
  final String timeline;
  final int popularity;
  final String portal;
  final String icon;
  final String description;
  final List<String> documents;

  ServiceModel({
    required this.id,
    required this.title,
    required this.category,
    required this.fee,
    required this.timeline,
    required this.popularity,
    required this.portal,
    required this.icon,
    required this.description,
    required this.documents,
  });
}
