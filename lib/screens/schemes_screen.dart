import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/constants.dart';
import '../data/schemes_data.dart';
import '../models/scheme_model.dart';
import '../providers/chat_provider.dart';
import '../providers/form_provider.dart';
import '../providers/language_provider.dart';
import '../widgets/category_chips.dart';
import '../widgets/scheme_card.dart';
import '../widgets/stat_card.dart';

class SchemesScreen extends StatefulWidget {
  const SchemesScreen({super.key});

  @override
  State<SchemesScreen> createState() => _SchemesScreenState();
}

class _SchemesScreenState extends State<SchemesScreen> {
  String _selectedCategory = 'All Schemes';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  final List<String> _categories = [
    'All Schemes',
    'Agriculture',
    'Health',
    'Education',
    'Housing',
    'Business',
    'Women & Child',
    'Employment',
    'Social Welfare',
  ];

  List<SchemeModel> get _filteredSchemes {
    return schemesData.where((scheme) {
      final matchesCategory = _selectedCategory == 'All Schemes' ||
          scheme.category.toLowerCase().contains(_selectedCategory.toLowerCase().split(' ').first);

      final matchesQuery = _searchQuery.isEmpty ||
          scheme.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          scheme.description.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          scheme.benefitAmount.toLowerCase().contains(_searchQuery.toLowerCase());

      return matchesCategory && matchesQuery;
    }).toList();
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
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(lang.getText('schemes'), style: theme.textTheme.headlineMedium),
                const SizedBox(height: 4),
                Text(
                  lang.getText('schemes_desc'),
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 14),
                ),
                const SizedBox(height: AppSpacing.md),

                // STATS GRID
                SizedBox(
                  height: 115,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      SizedBox(width: 150, child: StatCard(label: lang.getText('stat_eligible_schemes'), value: '12', icon: Icons.verified_user_outlined, color: AppColors.secondary)),
                      SizedBox(width: AppSpacing.sm),
                      SizedBox(width: 150, child: StatCard(label: 'Applied', value: '3', icon: Icons.task_outlined, color: AppColors.primary)),
                      SizedBox(width: AppSpacing.sm),
                      SizedBox(width: 150, child: StatCard(label: 'New This Month', value: '5', icon: Icons.new_releases_outlined, color: AppColors.accent)),
                      SizedBox(width: AppSpacing.sm),
                      SizedBox(width: 150, child: StatCard(label: 'Deadlines Soon', value: '2', icon: Icons.alarm, color: AppColors.danger)),
                    ],
                  ),
                ),

                const SizedBox(height: AppSpacing.md),

                // SEARCH BAR
                TextField(
                  controller: _searchController,
                  onChanged: (val) => setState(() => _searchQuery = val),
                  decoration: InputDecoration(
                    hintText: 'Search schemes — e.g. PM Kisan, Ayushman, Mudra...',
                    prefixIcon: const Icon(Icons.search, color: AppColors.primary),
                    filled: true,
                    fillColor: AppColors.surface,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      borderSide: const BorderSide(color: AppColors.border),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                ),
              ],
            ),
          ),

          // CATEGORY CHIPS
          CategoryChips(
            categories: _categories,
            selectedCategory: _selectedCategory,
            onSelected: (cat) => setState(() => _selectedCategory = cat),
          ),

          const SizedBox(height: AppSpacing.md),

          // SCHEMES LIST
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Featured Schemes (${_filteredSchemes.length})',
                  style: theme.textTheme.titleLarge,
                ),
                const SizedBox(height: AppSpacing.sm),
                ..._filteredSchemes.map(
                  (scheme) => SchemeCard(
                    scheme: scheme,
                    onCheckEligibility: () {
                      chatProvider.openChat();
                      chatProvider.sendMessage(
                        "Check eligibility for ${scheme.title}",
                        Provider.of<FormProvider>(context, listen: false),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
