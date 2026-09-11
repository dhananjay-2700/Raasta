import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/constants.dart';
import '../models/scheme_model.dart';
import '../providers/chat_provider.dart';
import '../providers/form_provider.dart';
import '../providers/language_provider.dart';

class SchemesCarousel extends StatefulWidget {
  final List<SchemeModel> schemes;
  final Function(int)? onNavigateTab;

  const SchemesCarousel({
    super.key,
    required this.schemes,
    this.onNavigateTab,
  });

  @override
  State<SchemesCarousel> createState() => _SchemesCarouselState();
}

class _SchemesCarouselState extends State<SchemesCarousel> {
  late PageController _pageController;
  int _currentPage = 0;
  Timer? _autoScrollTimer;

  // Curated gradient themes for carousel cards
  final List<List<Color>> _cardGradients = [
    [const Color(0xFF0F172A), const Color(0xFF1E293B)], // Dark Navy / Slate
    [const Color(0xFF065F46), const Color(0xFF047857)], // Emerald Green
    [const Color(0xFF1E1B4B), const Color(0xFF312E81)], // Deep Indigo
    [const Color(0xFF7C2D12), const Color(0xFF9A3412)], // Warm Terracotta / Orange
    [const Color(0xFF831843), const Color(0xFF9F1239)], // Rose / Magenta
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController(viewportFraction: 0.92);

    // Auto scroll timer every 4 seconds
    _autoScrollTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (widget.schemes.isEmpty) return;
      final nextPage = (_currentPage + 1) % widget.schemes.length;
      if (_pageController.hasClients) {
        _pageController.animateToPage(
          nextPage,
          duration: const Duration(milliseconds: 450),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _autoScrollTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lang = Provider.of<LanguageProvider>(context);
    final chatProvider = Provider.of<ChatProvider>(context, listen: false);
    final formProvider = Provider.of<FormProvider>(context, listen: false);

    if (widget.schemes.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // SECTION HEADER WITH TITLE & INDICATOR DOTS
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: AppColors.secondary.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                    child: const Icon(Icons.local_fire_department, color: AppColors.secondary, size: 20),
                  ),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      lang.getText('new_schemes'),
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
            TextButton(
              onPressed: () => widget.onNavigateTab?.call(2),
              child: Text(lang.getText('view_all')),
            ),
          ],
        ),

        const SizedBox(height: AppSpacing.xs),

        // CAROUSEL SLIDER CONTAINER
        SizedBox(
          height: 210,
          child: PageView.builder(
            controller: _pageController,
            onPageChanged: (index) => setState(() => _currentPage = index),
            itemCount: widget.schemes.length,
            itemBuilder: (context, index) {
              final scheme = widget.schemes[index];
              final gradient = _cardGradients[index % _cardGradients.length];

              return Padding(
                padding: const EdgeInsets.only(right: 10),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: gradient,
                    ),
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                    boxShadow: [
                      BoxShadow(
                        color: gradient[0].withOpacity(0.4),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // TOP ROW: BADGES & SCOPE
                      Row(
                        children: [
                          Flexible(
                            child: SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: AppColors.accent,
                                      borderRadius: BorderRadius.circular(AppRadius.full),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.star, color: Colors.white, size: 12),
                                        const SizedBox(width: 4),
                                        Text(
                                          scheme.tag.toUpperCase(),
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: Colors.white24,
                                      borderRadius: BorderRadius.circular(AppRadius.full),
                                    ),
                                    child: Text(
                                      '${scheme.scope} Govt',
                                      style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            scheme.benefitAmount,
                            style: const TextStyle(
                              color: Colors.amberAccent,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),

                      // MIDDLE ROW: SCHEME TITLE & DESCRIPTION
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            scheme.title,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            scheme.description,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 11,
                              height: 1.2,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),

                      // BOTTOM ROW: ACTION BUTTONS
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () {
                                chatProvider.sendMessage(
                                  "Check eligibility for ${scheme.title}",
                                  formProvider,
                                );
                                chatProvider.openChat();
                              },
                              icon: const Icon(Icons.check_circle_outline, size: 14),
                              label: Text(
                                lang.getText('check_eligibility'),
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white,
                                foregroundColor: gradient[0],
                                minimumSize: const Size(0, 36),
                                padding: const EdgeInsets.symmetric(horizontal: 8),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(AppRadius.md),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          OutlinedButton(
                            onPressed: () => widget.onNavigateTab?.call(2),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: Colors.white54),
                              foregroundColor: Colors.white,
                              minimumSize: const Size(0, 36),
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(AppRadius.md),
                              ),
                            ),
                            child: Text(
                              lang.getText('apply_now'),
                              style: const TextStyle(fontSize: 11),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),

        const SizedBox(height: 10),

        // PAGE INDICATOR DOTS
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            widget.schemes.length,
            (dotIndex) => AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: _currentPage == dotIndex ? 18 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: _currentPage == dotIndex ? AppColors.primary : AppColors.borderLight,
                borderRadius: BorderRadius.circular(AppRadius.full),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
