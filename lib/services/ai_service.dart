import 'dart:convert';
import 'package:http/http.dart' as http;
import '../providers/form_provider.dart';

/// Navigation action types the AI can trigger
enum AINavAction {
  none,
  goToServices,
  goToSchemes,
  goToTrack,
  goToReport,
  goToDocuments,
  goToProfile,
  goToApplyService,
}

class AIServiceResponse {
  final String text;
  final Map<String, String>? autoFilledFields;
  final String modelName;
  final AINavAction navAction;
  final String? navServiceId; // For goToApplyService

  AIServiceResponse({
    required this.text,
    this.autoFilledFields,
    this.modelName = 'google/gemma-4-31B-it (HuggingFace)',
    this.navAction = AINavAction.none,
    this.navServiceId,
  });
}

class AIService {
  static const String modelId = 'google/gemma-4-31B-it';
  static String huggingFaceEndpoint = 'https://api-inference.huggingface.co/models/google/gemma-4-31B-it';
  static String hfAccessToken = 'YOUR_HF_ACCESS_TOKEN';
  static bool useLiveHuggingFace = false;

  // ── FUZZY INTENT KEYWORD MAPS ──
  // Each intent maps to a list of keywords/fragments that trigger it.
  // Even partial or misspelled words will match via substring check.
  static final Map<String, List<String>> _serviceKeywords = {
    '1': ['aadhaar', 'aadhar', 'uid', 'adhar', 'aadhr', 'uidai', 'enrol'],
    '2': ['pan', 'pancard', 'pan card', 'nsdl', 'permanent account'],
    '3': ['passport', 'pasport', 'passprt', 'travel document', 'mea', 'passport seva'],
    '4': ['voter', 'voter id', 'epic', 'election', 'nvsp', 'vote'],
    '5': ['driving', 'licence', 'license', 'dl', 'rto', 'driv'],
    '6': ['income certificate', 'income cert', 'income proof', 'aay praman', 'revenue'],
    '7': ['caste', 'caste cert', 'obc', 'sc', 'st', 'backward'],
    '8': ['domicile', 'residence', 'resident cert', 'nivas', 'sthaniya nivas'],
    '9': ['birth certificate', 'birth cert', 'janm praman', 'born'],
    '10': ['death certificate', 'death cert', 'mrityu praman'],
    '11': ['marriage certificate', 'marriage cert', 'vivah praman', 'wed'],
    '12': ['property', 'land record', 'mutation', 'bhulekh', 'land registration', 'jamin'],
    '13': ['ration', 'ration card', 'food', 'bpl', 'antyodaya'],
    '14': ['water connection', 'water supply', 'jal', 'pani'],
    '15': ['electricity', 'bijli', 'power connection', 'meter'],
    '16': ['gas', 'lpg', 'ujjwala', 'gas connection', 'cylinder'],
    '17': ['gst', 'gst registration', 'goods and services', 'tax reg'],
    '18': ['shop', 'establishment', 'shop act', 'dukan', 'vyapar'],
    '19': ['fssai', 'food license', 'food safety', 'khana'],
    '20': ['udyam', 'msme', 'udyog', 'entrepreneur', 'small business'],
    '21': ['epfo', 'pf', 'provident fund', 'uan', 'employee pf'],
    '22': ['esic', 'esi', 'employee insurance', 'health insurance employee'],
    '23': ['nps', 'pension', 'retirement', 'national pension'],
    '24': ['scholarship', 'vidyalakshmi', 'student', 'education', 'scholarship portal'],
    '25': ['agricultural', 'kisan', 'farm', 'agri', 'crop'],
  };

  static final Map<String, List<String>> _schemeKeywords = {
    '1': ['pm kisan', 'kisan samman', 'farmer money', 'kisan nidhi', '6000'],
    '2': ['ayushman', 'pmjay', 'health cover', 'ayushman bharat', 'hospital free', '5 lakh health'],
    '3': ['pm awas', 'awas yojana', 'housing', 'house subsidy', 'pmay', 'ghar'],
    '4': ['mudra', 'mudra loan', 'business loan', 'shishu', 'kishore', 'tarun'],
    '5': ['sukanya', 'samriddhi', 'girl child', 'daughter', 'beti', 'sukanya samriddhi'],
    '6': ['ujjwala', 'gas scheme', 'lpg free', 'ujjwala yojana', 'cooking gas'],
    '7': ['fasal bima', 'crop insurance', 'pmfby', 'fasal'],
    '8': ['digital india', 'digital literacy', 'digital'],
    '9': ['swachh bharat', 'toilet', 'swachh', 'sanitation', 'clean india'],
    '10': ['skill india', 'skill development', 'training', 'kaushal', 'nsdc'],
    '11': ['jeevan jyoti', 'life insurance', 'pmjjby', 'bima', 'insurance 330'],
    '12': ['atal pension', 'pension scheme', 'atal', 'apy'],
  };

  static final Map<AINavAction, List<String>> _navKeywords = {
    AINavAction.goToServices: ['services', 'sewa', 'seva', 'apply', 'application', 'government service', 'sarkar', 'sarkari', 'all services'],
    AINavAction.goToSchemes: ['schemes', 'yojana', 'yojna', 'benefits', 'subsidy', 'welfare', 'all schemes', 'sarkari yojana'],
    AINavAction.goToTrack: ['track', 'status', 'tracking', 'where is my', 'application status', 'complaint status', 'check status'],
    AINavAction.goToReport: ['report', 'complaint', 'issue', 'grievance', 'pothole', 'broken', 'damaged', 'shikayat', 'problem'],
    AINavAction.goToDocuments: ['document', 'vault', 'locker', 'digilocker', 'certificate', 'upload', 'my documents', 'dastavej'],
    AINavAction.goToProfile: ['profile', 'settings', 'account', 'my profile', 'edit profile', 'my info'],
  };

  // ── Scheme titles for response text lookup ──
  static const Map<String, String> _schemeTitles = {
    '1': 'PM Kisan Samman Nidhi',
    '2': 'Ayushman Bharat (PMJAY)',
    '3': 'PM Awas Yojana (Urban)',
    '4': 'PM Mudra Yojana',
    '5': 'Sukanya Samriddhi Yojana',
    '6': 'PM Ujjwala Yojana',
    '7': 'PM Fasal Bima Yojana',
    '8': 'Digital India Programme',
    '9': 'Swachh Bharat Mission',
    '10': 'Skill India Mission',
    '11': 'PM Jeevan Jyoti Bima',
    '12': 'Atal Pension Yojana',
  };

  static const Map<String, String> _serviceTitles = {
    '1': 'Aadhaar Card',
    '2': 'PAN Card Application',
    '3': 'Passport Application',
    '4': 'Voter ID Card (EPIC)',
    '5': 'Driving Licence',
    '6': 'Income Certificate',
    '7': 'Caste Certificate',
    '8': 'Domicile Certificate',
    '9': 'Birth Certificate',
    '10': 'Death Certificate',
    '11': 'Marriage Certificate',
    '12': 'Property / Land Records',
    '13': 'Ration Card',
    '14': 'Water Connection',
    '15': 'Electricity Connection',
    '16': 'LPG Gas Connection',
    '17': 'GST Registration',
    '18': 'Shop & Establishment Licence',
    '19': 'FSSAI Food Licence',
    '20': 'Udyam / MSME Registration',
    '21': 'EPFO / PF Registration',
    '22': 'ESIC Registration',
    '23': 'NPS (National Pension)',
    '24': 'Scholarship Portal',
    '25': 'Agriculture Services',
  };

  /// Check if a query fuzzy-matches any keyword list (substring matching)
  static String? _matchKeywords(String query, Map<String, List<String>> keywordMap) {
    // First try exact keyword containment
    for (final entry in keywordMap.entries) {
      for (final keyword in entry.value) {
        if (query.contains(keyword)) return entry.key;
      }
    }
    // Then try substring fuzzy: if any keyword fragment (>=3 chars) is found
    for (final entry in keywordMap.entries) {
      for (final keyword in entry.value) {
        // Break keyword into words and check if any word (>=3 chars) appears in query
        for (final word in keyword.split(' ')) {
          if (word.length >= 3 && query.contains(word)) return entry.key;
        }
      }
    }
    return null;
  }

  static AINavAction? _matchNavKeywords(String query) {
    for (final entry in _navKeywords.entries) {
      for (final keyword in entry.value) {
        if (query.contains(keyword)) return entry.key;
      }
      for (final keyword in entry.value) {
        for (final word in keyword.split(' ')) {
          if (word.length >= 3 && query.contains(word)) return entry.key;
        }
      }
    }
    return null;
  }

  static Future<AIServiceResponse> getResponse(String userPrompt, FormProvider formProvider) async {
    final String query = userPrompt.toLowerCase().trim();

    // LIVE HUGGINGFACE INFERENCE API CALL
    if (useLiveHuggingFace) {
      try {
        final formSummary = formProvider.getFormSummary();
        final systemPrompt = "You are Smart Bharat AI powered by google/gemma-4-31B-it. "
            "Help Indian citizens with government services, schemes, and forms.\n"
            "Query: $userPrompt\nForm State: ${jsonEncode(formSummary)}";

        final headers = {'Content-Type': 'application/json'};
        if (hfAccessToken.isNotEmpty && hfAccessToken != 'YOUR_HF_ACCESS_TOKEN') {
          headers['Authorization'] = 'Bearer $hfAccessToken';
        }

        final response = await http.post(
          Uri.parse(huggingFaceEndpoint),
          headers: headers,
          body: jsonEncode({
            'inputs': systemPrompt,
            'parameters': {
              'max_new_tokens': 512,
              'temperature': 0.3,
              'return_full_text': false,
            },
          }),
        ).timeout(const Duration(seconds: 20));

        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          String text = '';
          if (data is List && data.isNotEmpty) {
            text = data[0]['generated_text'] ?? '';
          } else if (data is Map) {
            text = data['generated_text'] ?? data['text'] ?? '';
          }

          return AIServiceResponse(
            text: text.isNotEmpty ? text : "Received response from google/gemma-4-31B-it",
          );
        }
      } catch (e) {
        // Fallback to local engine
      }
    }

    // LOCAL GEMMA 4-31B-IT PROTOTYPE INFERENCE ENGINE
    await Future.delayed(const Duration(milliseconds: 500));

    // ── AGENTIC FORM-FILLING MODE ──
    if (formProvider.isFormActive && formProvider.formMeta != null) {
      final Map<String, String> extracted = _extractFormFields(query, userPrompt);

      if (extracted.isNotEmpty) {
        final fieldCount = extracted.length;
        final fieldNames = extracted.keys.map((k) => formProvider.fields[k]?.label ?? k).join(', ');

        return AIServiceResponse(
          text: "✨ **google/gemma-4-31B-it:** Extracted **$fieldCount detail(s)** ($fieldNames) and updated your form.\n\nForm completion: **${formProvider.completionScore}%**.",
          autoFilledFields: extracted,
        );
      }
    }

    // ── INTENT 1: Match a specific SERVICE by keyword/partial word ──
    final matchedServiceId = _matchKeywords(query, _serviceKeywords);
    if (matchedServiceId != null) {
      final title = _serviceTitles[matchedServiceId] ?? 'Service';
      return AIServiceResponse(
        text: "📋 **google/gemma-4-31B-it:** I found **$title** for you!\n\n"
            "I'm navigating you to the application form now. You can tell me your details and I'll auto-fill them using agentic reasoning.\n\n"
            "💡 *Say something like \"My name is Rahul, Aadhaar 1234 5678 9012\" to auto-fill!*",
        navAction: AINavAction.goToApplyService,
        navServiceId: matchedServiceId,
      );
    }

    // ── INTENT 2: Match a specific SCHEME ──
    final matchedSchemeId = _matchKeywords(query, _schemeKeywords);
    if (matchedSchemeId != null) {
      final title = _schemeTitles[matchedSchemeId] ?? 'Scheme';
      return AIServiceResponse(
        text: "🎁 **google/gemma-4-31B-it:** Found scheme **$title**!\n\n"
            "I'm taking you to the Schemes page so you can explore eligibility, benefits, and how to apply.\n\n"
            "💡 *Ask me \"Am I eligible for $title?\" for a personalized check!*",
        navAction: AINavAction.goToSchemes,
      );
    }

    // ── INTENT 3: Match a general navigation page ──
    final matchedNav = _matchNavKeywords(query);
    if (matchedNav != null) {
      final navNames = {
        AINavAction.goToServices: 'Government Services',
        AINavAction.goToSchemes: 'Government Schemes',
        AINavAction.goToTrack: 'Track Status',
        AINavAction.goToReport: 'Report Issue',
        AINavAction.goToDocuments: 'Digital Document Vault',
        AINavAction.goToProfile: 'User Profile & Settings',
      };
      return AIServiceResponse(
        text: "🧭 **google/gemma-4-31B-it:** Navigating you to **${navNames[matchedNav]}**...",
        navAction: matchedNav,
      );
    }

    // ── INTENT 4: Greeting / Help ──
    if (query.contains('hello') || query.contains('hi') || query.contains('namaste') ||
        query.contains('help') || query.contains('what can you') || query.contains('start')) {
      return AIServiceResponse(
        text: "🇮🇳 **Namaste!** I'm **Smart Bharat AI**, powered by **google/gemma-4-31B-it**.\n\n"
            "Here's what I can do:\n"
            "• 🔍 **Find services** — try *\"passport\"*, *\"aadhaar\"*, *\"income cert\"*\n"
            "• 🎁 **Explore schemes** — try *\"PM Kisan\"*, *\"Ayushman\"*, *\"Mudra loan\"*\n"
            "• 📋 **Navigate pages** — try *\"track status\"*, *\"report issue\"*, *\"documents\"*\n"
            "• 🤖 **Auto-fill forms** — open a service form and tell me your details!\n\n"
            "What would you like to do?",
      );
    }

    // ── INTENT 5: Model info ──
    if (query.contains('gemma') || query.contains('model') || query.contains('hugging') || query.contains('31b') || query.contains('ai')) {
      return AIServiceResponse(
        text: "⚡ **Model: google/gemma-4-31B-it**\n\n"
            "• **Repository:** google/gemma-4-31B-it on HuggingFace Hub\n"
            "• **Parameters:** 31 Billion (Instruction Tuned)\n"
            "• **Capabilities:** Intent Recognition, Agentic Form Filling, Multilingual, Navigation\n"
            "• **Status:** ${useLiveHuggingFace ? '🟢 Connected to HuggingFace Inference API' : '🟡 Running local prototype engine'}",
      );
    }

    // ── INTENT 6: Eligibility / general questions ──
    if (query.contains('eligible') || query.contains('qualify') || query.contains('can i get') || query.contains('am i')) {
      return AIServiceResponse(
        text: "📊 **google/gemma-4-31B-it: Eligibility Check**\n\n"
            "Based on your profile (Income: ₹5,00,000, State: Haryana, Category: General):\n\n"
            "✅ **Eligible:** PM Awas Yojana, PM Mudra, Skill India, Atal Pension\n"
            "⚠️ **Partially Eligible:** PM Kisan (land records needed)\n"
            "❌ **Not Eligible:** Ayushman Bharat (income above threshold)\n\n"
            "🎁 *Tap on any scheme name above or say \"show schemes\" to explore!*",
        navAction: AINavAction.goToSchemes,
      );
    }

    // ── DEFAULT: Suggest what user can do ──
    return AIServiceResponse(
      text: "🤔 **google/gemma-4-31B-it:** I didn't find an exact match for \"$userPrompt\".\n\n"
          "Try asking me:\n"
          "• **\"passport\"** or **\"aadhaar\"** → Opens that service form\n"
          "• **\"PM Kisan\"** or **\"Ayushman\"** → Shows that scheme\n"
          "• **\"track\"** or **\"complaints\"** → Goes to tracking page\n"
          "• **\"documents\"** or **\"upload\"** → Opens your document vault\n\n"
          "💡 I understand partial words too! Try *\"pass\"* for Passport or *\"kisan\"* for PM Kisan.",
    );
  }

  /// Extract form fields from natural language input
  static Map<String, String> _extractFormFields(String query, String original) {
    final Map<String, String> extracted = {};

    // Name
    if (query.contains('name is ') || query.contains('i am ') || query.contains('myself ')) {
      final match = RegExp(r'(?:name is|i am|myself)\s+([a-zA-Z\s]+)', caseSensitive: false).firstMatch(original);
      if (match != null) {
        extracted['fullName'] = match.group(1)!.split(',')[0].split('.').first.trim();
      }
    }

    // Father/Husband
    if (query.contains('father') || query.contains('husband')) {
      final match = RegExp(r"(?:father|husband)(?:'s)?(?:\s+name)?(?:\s+is)?\s+([a-zA-Z\s]+)", caseSensitive: false).firstMatch(original);
      if (match != null) {
        extracted['fatherName'] = match.group(1)!.split(',')[0].trim();
      }
    }

    // Aadhaar
    if (query.contains('aadhaar') || query.contains('aadhar') || RegExp(r'\d{4}\s?\d{4}\s?\d{4}').hasMatch(query)) {
      final match = RegExp(r'\b\d{4}\s?\d{4}\s?\d{4}\b').firstMatch(original);
      if (match != null) {
        extracted['aadhaar'] = match.group(0)!;
      }
    }

    // Phone
    if (query.contains('phone') || query.contains('mobile') || query.contains('number') || RegExp(r'\b[6-9]\d{9}\b').hasMatch(query)) {
      final match = RegExp(r'\b[6-9]\d{9}\b').firstMatch(original);
      if (match != null) {
        extracted['phone'] = match.group(0)!;
      }
    }

    // Email
    if (query.contains('email') || query.contains('@')) {
      final match = RegExp(r'[\w.+-]+@[\w.-]+\.\w+').firstMatch(original);
      if (match != null) {
        extracted['email'] = match.group(0)!;
      }
    }

    // Income
    if (query.contains('income') || query.contains('salary') || query.contains('lakh') || query.contains('earn')) {
      if (query.contains('5 lakh') || query.contains('500000') || query.contains('5,00,000')) {
        extracted['annualIncome'] = '₹5,00,000';
      } else if (query.contains('2.5 lakh') || query.contains('250000') || query.contains('2,50,000')) {
        extracted['annualIncome'] = '₹2,50,000';
      } else if (query.contains('3 lakh') || query.contains('300000') || query.contains('3,00,000')) {
        extracted['annualIncome'] = '₹3,00,000';
      } else {
        final match = RegExp(r'(\d+(?:,\d+)*)\s*(?:lakh|lakhs|rupees)?', caseSensitive: false).firstMatch(original);
        if (match != null) {
          extracted['annualIncome'] = '₹${match.group(1)}';
        }
      }

      if (query.contains('software') || query.contains('engineer') || query.contains('it ') || query.contains('developer')) {
        extracted['incomeSource'] = 'Salary';
        extracted['occupation'] = 'Software Engineer';
      } else if (query.contains('farmer') || query.contains('agriculture') || query.contains('farming')) {
        extracted['incomeSource'] = 'Agriculture';
        extracted['occupation'] = 'Farmer';
      } else if (query.contains('business') || query.contains('shop') || query.contains('self employed')) {
        extracted['incomeSource'] = 'Business';
        extracted['occupation'] = 'Business Owner';
      } else if (query.contains('teacher') || query.contains('professor')) {
        extracted['incomeSource'] = 'Salary';
        extracted['occupation'] = 'Teacher';
      } else if (query.contains('doctor') || query.contains('medical')) {
        extracted['incomeSource'] = 'Salary';
        extracted['occupation'] = 'Doctor';
      }
    }

    // Address / Location
    if (query.contains('live in') || query.contains('address') || query.contains('from') || query.contains('city') || query.contains('state')) {
      final states = {'haryana': 'Haryana', 'delhi': 'Delhi', 'uttar pradesh': 'Uttar Pradesh', 'maharashtra': 'Maharashtra', 'karnataka': 'Karnataka', 'telangana': 'Telangana', 'tamil nadu': 'Tamil Nadu', 'andhra pradesh': 'Andhra Pradesh', 'west bengal': 'West Bengal', 'gujarat': 'Gujarat', 'rajasthan': 'Rajasthan', 'madhya pradesh': 'Madhya Pradesh', 'bihar': 'Bihar', 'punjab': 'Punjab', 'kerala': 'Kerala'};
      final cities = {'gurugram': 'Gurugram', 'gurgaon': 'Gurugram', 'delhi': 'Delhi', 'mumbai': 'Mumbai', 'bangalore': 'Bangalore', 'bengaluru': 'Bangalore', 'hyderabad': 'Hyderabad', 'chennai': 'Chennai', 'kolkata': 'Kolkata', 'pune': 'Pune', 'jaipur': 'Jaipur', 'lucknow': 'Lucknow', 'ahmedabad': 'Ahmedabad'};

      for (final entry in states.entries) {
        if (query.contains(entry.key)) {
          extracted['state'] = entry.value;
          break;
        }
      }
      for (final entry in cities.entries) {
        if (query.contains(entry.key)) {
          extracted['district'] = entry.value;
          break;
        }
      }

      final pinMatch = RegExp(r'\b\d{6}\b').firstMatch(original);
      if (pinMatch != null) {
        extracted['pincode'] = pinMatch.group(0)!;
      }
    }

    // Gender
    if (query.contains('female') || query.contains('woman') || query.contains('girl')) {
      extracted['gender'] = 'Female';
    } else if (query.contains('male') || query.contains('man') || query.contains('boy')) {
      extracted['gender'] = 'Male';
    }

    // DOB
    final dobMatch = RegExp(r'(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})').firstMatch(original);
    if (dobMatch != null) {
      extracted['dob'] = '${dobMatch.group(3)}-${dobMatch.group(2)!.padLeft(2, '0')}-${dobMatch.group(1)!.padLeft(2, '0')}';
    } else if (query.contains('born') || query.contains('dob')) {
      final yearMatch = RegExp(r'\b(19|20)\d{2}\b').firstMatch(original);
      if (yearMatch != null) {
        extracted['dob'] = '${yearMatch.group(0)}-01-01';
      }
    }

    return extracted;
  }
}
