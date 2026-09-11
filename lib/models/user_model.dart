class LinkedId {
  final String title;
  final String number;
  final String status;
  final String icon;

  LinkedId({
    required this.title,
    required this.number,
    required this.status,
    required this.icon,
  });
}

class UserModel {
  final String name;
  final String email;
  final String phone;
  final String dob;
  final String gender;
  final String occupation;
  final String category;
  final String address;
  final String state;
  final String district;
  final String pincode;
  final String memberSince;
  final List<LinkedId> linkedIds;
  final List<String> recentActivity;

  UserModel({
    required this.name,
    required this.email,
    required this.phone,
    required this.dob,
    required this.gender,
    required this.occupation,
    required this.category,
    required this.address,
    required this.state,
    required this.district,
    required this.pincode,
    required this.memberSince,
    required this.linkedIds,
    required this.recentActivity,
  });
}
