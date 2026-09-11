import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/constants.dart';
import '../providers/chat_provider.dart';
import '../providers/form_provider.dart';

class ChatWidget extends StatefulWidget {
  const ChatWidget({super.key});

  @override
  State<ChatWidget> createState() => _ChatWidgetState();
}

class _ChatWidgetState extends State<ChatWidget> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Widget _buildMarkdownText(String text, Color textColor) {
    // Simple markdown parser for **bold** text
    final parts = text.split('**');
    final List<TextSpan> spans = [];

    for (int i = 0; i < parts.length; i++) {
      final isBold = i % 2 == 1;
      spans.add(
        TextSpan(
          text: parts[i],
          style: TextStyle(
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            color: textColor,
            fontSize: 14,
            height: 1.4,
          ),
        ),
      );
    }

    return RichText(text: TextSpan(children: spans));
  }

  @override
  Widget build(BuildContext context) {
    final chatProvider = Provider.of<ChatProvider>(context);
    final formProvider = Provider.of<FormProvider>(context);

    final isMobile = MediaQuery.of(context).size.width < 600;

    if (!chatProvider.isExpanded) {
      // SLEEK CIRCULAR FAB FLOATING DIRECTLY ATOP THE NAVIGATION BAR ABOVE PROFILE
      return Positioned(
        bottom: 4,
        right: 16,
        child: ScaleTransition(
          scale: _pulseAnimation,
          child: FloatingActionButton.small(
            onPressed: () => chatProvider.openChat(),
            backgroundColor: AppColors.primary,
            elevation: 4,
            shape: const CircleBorder(),
            tooltip: 'Smart Bharat AI Assistant',
            child: const Icon(Icons.smart_toy, color: Colors.white, size: 20),
          ),
        ),
      );
    }

    // CHAT EXPANDED STATE
    return Positioned(
      bottom: isMobile ? 70 : 80,
      right: isMobile ? 0 : 16,
      top: isMobile ? 60 : null,
      child: Material(
        elevation: 12,
        borderRadius: BorderRadius.circular(isMobile ? 0 : AppRadius.xl),
        clipBehavior: Clip.antiAlias,
        child: Container(
          width: isMobile ? MediaQuery.of(context).size.width : 420,
          height: isMobile ? null : 600,
          decoration: BoxDecoration(
            color: AppColors.background,
            border: Border.all(color: AppColors.border, width: 1),
          ),
          child: Column(
            children: [
              // CHAT HEADER
              Container(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.primary, AppColors.primaryDark],
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: const BoxDecoration(
                        color: Colors.white24,
                        shape: BoxShape.circle,
                      ),
                      child: const Text('🇮🇳', style: TextStyle(fontSize: 18)),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Smart Bharat AI',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          Text(
                            formProvider.isFormActive ? '⚡ Gemma 4-31B-it Agentic Mode' : 'Powered by google/gemma-4-31B-it',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white),
                      onPressed: () => chatProvider.closeChat(),
                    ),
                  ],
                ),
              ),

              // AGENTIC ACTIVE BANNER IF FORM IS MOUNTED
              if (formProvider.isFormActive)
                Container(
                  padding: const EdgeInsets.all(8),
                  color: AppColors.secondaryLight,
                  child: Row(
                    children: [
                      const Icon(Icons.auto_awesome, color: AppColors.secondary, size: 16),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'Agentic Mode: Tell me your details & I\'ll fill the ${formProvider.formMeta?.title ?? 'form'}!',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.secondary),
                        ),
                      ),
                    ],
                  ),
                ),

              // MESSAGES LIST
              Expanded(
                child: ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(AppSpacing.md),
                  itemCount: chatProvider.messages.length + (chatProvider.isLoading ? 1 : 0),
                  itemBuilder: (context, index) {
                    if (index == chatProvider.messages.length && chatProvider.isLoading) {
                      // BOUNCING DOTS TYPING INDICATOR
                      return Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: AppColors.surfaceHover,
                                borderRadius: BorderRadius.circular(AppRadius.md),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Text('AI is thinking', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                                  const SizedBox(width: 8),
                                  SizedBox(
                                    width: 14,
                                    height: 14,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    }

                    final msg = chatProvider.messages[index];

                    return Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.md),
                      child: Align(
                        alignment: msg.isUser ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          constraints: BoxConstraints(
                            maxWidth: isMobile ? 280 : 340,
                          ),
                          padding: const EdgeInsets.all(AppSpacing.md),
                          decoration: BoxDecoration(
                            color: msg.isUser ? AppColors.primary : AppColors.surface,
                            borderRadius: BorderRadius.circular(AppRadius.md).copyWith(
                              bottomRight: msg.isUser ? Radius.zero : const Radius.circular(AppRadius.md),
                              bottomLeft: msg.isUser ? const Radius.circular(AppRadius.md) : Radius.zero,
                            ),
                            border: msg.isUser ? null : Border.all(color: AppColors.borderLight),
                          ),
                          child: _buildMarkdownText(
                            msg.text,
                            msg.isUser ? Colors.white : AppColors.textPrimary,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),

              // SUGGESTION CHIPS (only if 1 message)
              if (chatProvider.messages.length <= 1)
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
                  child: Row(
                    children: [
                      _suggestionChip("How do I apply for a passport?", chatProvider, formProvider),
                      _suggestionChip("Check scheme eligibility", chatProvider, formProvider),
                      _suggestionChip("Report a civic issue", chatProvider, formProvider),
                      _suggestionChip("Documents for Aadhaar?", chatProvider, formProvider),
                    ],
                  ),
                ),

              // INPUT BAR
              Container(
                padding: const EdgeInsets.all(AppSpacing.sm),
                decoration: const BoxDecoration(
                  color: AppColors.background,
                  border: Border(top: BorderSide(color: AppColors.borderLight)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _textController,
                        style: const TextStyle(fontSize: 14),
                        decoration: InputDecoration(
                          hintText: formProvider.isFormActive
                              ? 'Type details to auto-fill (e.g. My name is...)'
                              : 'Ask about services, schemes...',
                          hintStyle: const TextStyle(fontSize: 13, color: AppColors.textMuted),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(AppRadius.md),
                            borderSide: const BorderSide(color: AppColors.border),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(AppRadius.md),
                            borderSide: const BorderSide(color: AppColors.primary),
                          ),
                        ),
                        onSubmitted: (val) {
                          if (val.trim().isNotEmpty) {
                            chatProvider.sendMessage(val, formProvider);
                            _textController.clear();
                            _scrollToBottom();
                          }
                        },
                      ),
                    ),
                    const SizedBox(width: AppSpacing.xs),
                    IconButton(
                      icon: const Icon(Icons.send, color: AppColors.primary),
                      onPressed: () {
                        if (_textController.text.trim().isNotEmpty) {
                          chatProvider.sendMessage(_textController.text, formProvider);
                          _textController.clear();
                          _scrollToBottom();
                        }
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _suggestionChip(String label, ChatProvider chatProvider, FormProvider formProvider) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: ActionChip(
        label: Text(label, style: const TextStyle(fontSize: 12, color: AppColors.primary)),
        backgroundColor: AppColors.primaryLight,
        side: BorderSide.none,
        onPressed: () {
          chatProvider.sendMessage(label, formProvider);
          _scrollToBottom();
        },
      ),
    );
  }
}
