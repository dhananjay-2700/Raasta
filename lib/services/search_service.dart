import '../data/services_data.dart';
import '../data/user_data.dart';
import '../models/service_model.dart';

class SearchResult {
  final ServiceModel? matchedService;
  final Map<String, String> preFilledDetails;

  SearchResult({this.matchedService, required this.preFilledDetails});
}

class SearchService {
  static SearchResult classifyAndExtract(String query) {
    final q = query.toLowerCase().trim();

    ServiceModel? matched;
    final Map<String, String> details = {};

    if (q.contains('income') || q.contains('income cert')) {
      matched = servicesData.firstWhere((s) => s.id == '7'); // Income Certificate
    } else if (q.contains('passport')) {
      matched = servicesData.firstWhere((s) => s.id == '3'); // Passport
    } else if (q.contains('aadhaar')) {
      matched = servicesData.firstWhere((s) => s.id == '1'); // Aadhaar
    } else if (q.contains('driving') || q.contains('licence') || q.contains('dl')) {
      matched = servicesData.firstWhere((s) => s.id == '11'); // Driving Licence
    }

    if (matched != null) {
      // Auto pre-fill details from user profile data
      details['fullName'] = currentUserData.name;
      details['phone'] = currentUserData.phone.replaceAll('+91 ', '').replaceAll(' ', '');
      details['email'] = currentUserData.email;
      details['aadhaar'] = '1234 5678 4321';
      details['address'] = currentUserData.address;
      details['state'] = currentUserData.state;
      details['district'] = currentUserData.district;
      details['pincode'] = currentUserData.pincode;
      details['dob'] = '1995-08-15';
      details['gender'] = currentUserData.gender;
      details['occupation'] = currentUserData.occupation;
      details['annualIncome'] = '₹5,00,000';
      details['incomeSource'] = 'Salary';
      details['fatherName'] = 'Suresh Kumar';
      details['motherName'] = 'Sunita Devi';
    }

    return SearchResult(matchedService: matched, preFilledDetails: details);
  }
}
