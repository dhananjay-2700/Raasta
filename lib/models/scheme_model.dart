class SchemeModel {
  final String id;
  final String title;
  final String category;
  final String benefitAmount;
  final String benefitType;
  final List<String> eligibility;
  final List<String> documents;
  final String deadline;
  final String beneficiaries;
  final String scope; // Central / State (MP)
  final String tag;   // Recommended / Popular / Deadline Soon / Trending / New / State Scheme
  final String description;

  SchemeModel({
    required this.id,
    required this.title,
    required this.category,
    required this.benefitAmount,
    required this.benefitType,
    required this.eligibility,
    required this.documents,
    required this.deadline,
    required this.beneficiaries,
    required this.scope,
    required this.tag,
    required this.description,
  });
}
