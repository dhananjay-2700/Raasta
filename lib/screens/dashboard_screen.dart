import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/constants.dart';
import '../data/applications_data.dart';
import '../data/complaints_data.dart';
import '../data/schemes_data.dart';
import '../providers/chat_provider.dart';
import '../providers/form_provider.dart';
import '../providers/language_provider.dart';
import '../services/search_service.dart';
import '../widgets/application_card.dart';
import '../widgets/badge_widget.dart';
import '../widgets/schemes_carousel.dart';
import '../widgets/stat_card.dart';

class DashboardScreen extends StatefulWidget {
  final Function(int) onNavigateTab;
  final Function(String serviceId) onNavigateToApply;

  const DashboardScreen({
    super.key,
    required this.onNavigateTab,
    required this.onNavigateToApply,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final TextEditingController _searchController = TextEditingController();

  void _handleSearchSubmit(String query) {
    if (query.trim().isEmpty) return;

    final result = SearchService.classifyAndExtract(query);
    if (result.matchedService != null) {
      final formProvider = Provider.of<FormProvider>(context, listen: false);
      formProvider.setPreFilledFields(result.preFilledDetails);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('✨ Matched "${result.matchedService!.title}" & pre-filled your details!'),
          backgroundColor: AppColors.secondary,
        ),
      );
      widget.onNavigateToApply(result.matchedService!.id);
    } else {
      widget.onNavigateTab(1);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final chatProvider = Provider.of<ChatProvider>(context, listen: false);
    final lang = Provider.of<LanguageProvider>(context);

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // HERO SECTION
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [AppColors.primary, AppColors.primaryDark],
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        lang.getText('welcome_back'),
                        style: theme.textTheme.displayLarge?.copyWith(
                          color: Colors.white,
                          fontSize: 22,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white24,
                        borderRadius: BorderRadius.circular(AppRadius.full),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.verified, color: Colors.white, size: 14),
                          const SizedBox(width: 4),
                          Text(lang.getText('verified_citizen'), style: const TextStyle(color: Colors.white, fontSize: 12)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  lang.getText('hero_subtitle'),
                  style: const TextStyle(color: Colors.white70, fontSize: 14),
                ),
                const SizedBox(height: AppSpacing.lg),

                // AI SEARCH BAR
                TextField(
                  controller: _searchController,
                  onSubmitted: _handleSearchSubmit,
                  style: const TextStyle(fontSize: 15),
                  decoration: InputDecoration(
                    hintText: lang.getText('search_hint'),
                    hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                    filled: true,
                    fillColor: Colors.white,
                    prefixIcon: const Icon(Icons.search, color: AppColors.primary),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.arrow_forward, color: AppColors.primary),
                      onPressed: () => _handleSearchSubmit(_searchController.text),
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppRadius.lg),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // STATS GRID
                SizedBox(
                  height: 115,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      SizedBox(
                        width: 160,
                        child: StatCard(
                          label: lang.getText('stat_active_apps'),
                          value: '3',
                          icon: Icons.assignment_outlined,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      SizedBox(
                        width: 160,
                        child: StatCard(
                          label: lang.getText('stat_open_complaints'),
                          value: '2',
                          icon: Icons.report_problem_outlined,
                          color: AppColors.accent,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      SizedBox(
                        width: 160,
                        child: StatCard(
                          label: lang.getText('stat_docs_stored'),
                          value: '7',
                          icon: Icons.folder_outlined,
                          color: AppColors.secondary,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      SizedBox(
                        width: 160,
                        child: StatCard(
                          label: lang.getText('stat_eligible_schemes'),
                          value: '12',
                          icon: Icons.card_giftcard,
                          color: AppColors.warning,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: AppSpacing.xl),

                // QUICK ACTIONS
                Text(lang.getText('quick_actions'), style: theme.textTheme.titleLarge),
                const SizedBox(height: AppSpacing.sm),
                Wrap(
                  spacing: AppSpacing.sm,
                  runSpacing: AppSpacing.sm,
                  children: [
                    _actionChip(context, lang.getText('services_short'), Icons.business, AppColors.primary, () => widget.onNavigateTab(1)),
                    _actionChip(context, lang.getText('schemes_short'), Icons.card_giftcard, AppColors.secondary, () => widget.onNavigateTab(2)),
                    _actionChip(context, lang.getText('report'), Icons.warning_amber_rounded, AppColors.accent, () => widget.onNavigateTab(3)),
                    _actionChip(context, lang.getText('track_short'), Icons.manage_search, AppColors.warning, () => widget.onNavigateTab(3)),
                    _actionChip(context, lang.getText('documents'), Icons.upload_file, AppColors.danger, () => widget.onNavigateTab(4)),
                  ],
                ),

                const SizedBox(height: AppSpacing.xl),

                // CONTINUE APPLICATIONS
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        lang.getText('continue_apps'),
                        style: theme.textTheme.titleLarge,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    TextButton(
                      onPressed: () => widget.onNavigateTab(3),
                      child: Text(lang.getText('view_all')),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xs),
                ...applicationsData.take(3).map(
                      (app) => ApplicationCard(
                        application: app,
                        onResume: () => widget.onNavigateToApply('3'),
                      ),
                    ),

                const SizedBox(height: AppSpacing.lg),

                // NEW & FEATURED SCHEMES CAROUSEL
                SchemesCarousel(
                  schemes: schemesData.take(5).toList(),
                  onNavigateTab: widget.onNavigateTab,
                ),

                const SizedBox(height: AppSpacing.lg),

                // ACTIVE COMPLAINTS
                Text(lang.getText('active_complaints'), style: theme.textTheme.titleLarge),
                const SizedBox(height: AppSpacing.sm),
                ...complaintsData.take(2).map(
                      (c) => Card(
                        margin: const EdgeInsets.only(bottom: AppSpacing.sm),
                        child: ListTile(
                          leading: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppColors.accentLight,
                              borderRadius: BorderRadius.circular(AppRadius.md),
                            ),
                            child: const Icon(Icons.report_problem, color: AppColors.accent, size: 20),
                          ),
                          title: Text(c.title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                          subtitle: Text('${c.location} • ${c.department}', style: const TextStyle(fontSize: 12)),
                          trailing: BadgeWidget.status(c.status),
                          onTap: () => widget.onNavigateTab(3),
                        ),
                      ),
                    ),

                const SizedBox(height: AppSpacing.xl),

                // BOTTOM AI CARD
                Card(
                  color: AppColors.primaryLight,
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: const BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.smart_toy, color: Colors.white, size: 24),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                lang.getText('ask_gemma'),
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                lang.getText('ask_gemma_desc'),
                                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ),
                        ElevatedButton(
                          onPressed: () => chatProvider.openChat(),
                          style: ElevatedButton.styleFrom(
                            minimumSize: const Size(70, 36),
                            padding: const EdgeInsets.symmetric(horizontal: 10),
                          ),
                          child: Text(lang.getText('ask_ai'), style: const TextStyle(fontSize: 13)),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _actionChip(BuildContext context, String label, IconData icon, Color color, VoidCallback onTap) {
    return ActionChip(
      avatar: Icon(icon, color: color, size: 18),
      label: Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
      backgroundColor: color.withOpacity(0.1),
      side: BorderSide(color: color.withOpacity(0.3)),
      onPressed: onTap,
    );
  }
}
