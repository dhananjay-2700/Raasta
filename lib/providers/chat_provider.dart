import 'package:flutter/material.dart';
import '../models/chat_message_model.dart';
import '../providers/form_provider.dart';
import '../services/ai_service.dart';

class ChatProvider extends ChangeNotifier {
  bool _isExpanded = false;
  bool _isLoading = false;
  final List<ChatMessageModel> _messages = [];

  // Navigation callback set by MainScreen
  Function(int)? onNavigateTab;
  Function(String)? onNavigateToApply;

  // Last navigation action from AI response
  AINavAction? _pendingNavAction;
  String? _pendingNavServiceId;

  bool get isExpanded => _isExpanded;
  bool get isLoading => _isLoading;
  List<ChatMessageModel> get messages => _messages;
  AINavAction? get pendingNavAction => _pendingNavAction;
  String? get pendingNavServiceId => _pendingNavServiceId;

  ChatProvider() {
    _messages.add(
      ChatMessageModel(
        id: '1',
        text: "🇮🇳 Namaste! I'm **Smart Bharat AI**, powered by **google/gemma-4-31B-it**.\n\n"
            "• 🔍 Say **\"passport\"** or **\"aadhaar\"** → I'll open that service\n"
            "• 🎁 Say **\"PM Kisan\"** or **\"Ayushman\"** → I'll show that scheme\n"
            "• 🧭 Say **\"track\"**, **\"report\"**, **\"documents\"** → I'll navigate there\n"
            "• 🤖 On a form, tell me your details → I'll auto-fill!\n\n"
            "How can I help you today?",
        isUser: false,
        timestamp: DateTime.now(),
      ),
    );
  }

  void clearPendingNav() {
    _pendingNavAction = null;
    _pendingNavServiceId = null;
  }

  void toggleChat() {
    _isExpanded = !_isExpanded;
    notifyListeners();
  }

  void openChat() {
    _isExpanded = true;
    notifyListeners();
  }

  void closeChat() {
    _isExpanded = false;
    notifyListeners();
  }

  Future<void> sendMessage(String text, FormProvider formProvider) async {
    if (text.trim().isEmpty || _isLoading) return;

    final userMsg = ChatMessageModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      text: text.trim(),
      isUser: true,
      timestamp: DateTime.now(),
    );

    _messages.add(userMsg);
    _isLoading = true;
    notifyListeners();

    try {
      final aiResponse = await AIService.getResponse(text, formProvider);

      // Handle auto-fill
      if (aiResponse.autoFilledFields != null && aiResponse.autoFilledFields!.isNotEmpty) {
        formProvider.fillMultipleFields(aiResponse.autoFilledFields!, source: 'AI Agent');
      }

      // Handle navigation
      if (aiResponse.navAction != AINavAction.none) {
        _pendingNavAction = aiResponse.navAction;
        _pendingNavServiceId = aiResponse.navServiceId;

        // Execute navigation callback
        if (aiResponse.navAction == AINavAction.goToApplyService && aiResponse.navServiceId != null) {
          onNavigateToApply?.call(aiResponse.navServiceId!);
        } else {
          final tabIndex = _navActionToTabIndex(aiResponse.navAction);
          if (tabIndex != null) {
            onNavigateTab?.call(tabIndex);
          }
        }
      }

      final botMsg = ChatMessageModel(
        id: (DateTime.now().millisecondsSinceEpoch + 1).toString(),
        text: aiResponse.text,
        isUser: false,
        timestamp: DateTime.now(),
        autoFilledFields: aiResponse.autoFilledFields,
      );

      _messages.add(botMsg);
    } catch (e) {
      _messages.add(
        ChatMessageModel(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          text: "I'm sorry, I encountered an issue processing your request. Please try again.",
          isUser: false,
          timestamp: DateTime.now(),
        ),
      );
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  int? _navActionToTabIndex(AINavAction action) {
    switch (action) {
      case AINavAction.goToServices:
        return 1;
      case AINavAction.goToSchemes:
        return 2;
      case AINavAction.goToTrack:
      case AINavAction.goToReport:
        return 3;
      case AINavAction.goToDocuments:
        return 4; // We'll handle this through profile or dedicated tab
      case AINavAction.goToProfile:
        return 4;
      default:
        return null;
    }
  }
}
