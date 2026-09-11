import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/constants.dart';
import '../data/services_data.dart';
import '../models/service_model.dart';
import '../providers/language_provider.dart';
import '../widgets/category_chips.dart';
import '../widgets/service_card.dart';

class ServicesScreen extends StatefulWidget {
  final Function(String serviceId) onApplyService;

  const ServicesScreen({super.key, required this.onApplyService});

  @override
  State<ServicesScreen> createState() => _ServicesScreenState();
}

class _ServicesScreenState extends State<ServicesScreen> {
  String _selectedCategory = 'All Services';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  final List<String> _categories = [
    'All Services',
    'Identity',
    'Certificates',
    'Licenses',
    'Health',
    'Education',
    'Employment',
    'Tax & Finance',
    'Business',
  ];

  List<ServiceModel> get _filteredServices {
    return servicesData.where((service) {
      final matchesCategory = _selectedCategory == 'All Services' ||
          service.category.toLowerCase() == _selectedCategory.toLowerCase().replaceAll(' & ', 'tax');

      final matchesQuery = _searchQuery.isEmpty ||
          service.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          service.portal.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          service.description.toLowerCase().contains(_searchQuery.toLowerCase());

      return matchesCategory && matchesQuery;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final popularServices = servicesData.where((s) => s.popularity >= 90).take(4).toList();
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
                Text(lang.getText('services'), style: theme.textTheme.headlineMedium),
                const SizedBox(height: 4),
                Text(
                  lang.getText('services_desc'),
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 14),
                ),
                const SizedBox(height: AppSpacing.md),

                // SEARCH BAR
                TextField(
                  controller: _searchController,
                  onChanged: (val) => setState(() => _searchQuery = val),
                  decoration: InputDecoration(
                    hintText: lang.getText('search_hint'),
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

          // CATEGORY FILTERS
          CategoryChips(
            categories: _categories,
            selectedCategory: _selectedCategory,
            onSelected: (cat) => setState(() => _selectedCategory = cat),
          ),

          const SizedBox(height: AppSpacing.md),

          // POPULAR SERVICES BANNER (when All & no query)
          if (_selectedCategory == 'All Services' && _searchQuery.isEmpty) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              child: Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  border: const Border(left: BorderSide(color: AppColors.primary, width: 4)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '🔥 Most Popular Services',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primaryDark),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    const Text(
                      'Frequently accessed digital services by citizens across India.',
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Wrap(
                      spacing: AppSpacing.sm,
                      runSpacing: AppSpacing.sm,
                      children: popularServices
                          .map((s) => ActionChip(
                                avatar: Text(s.icon, style: const TextStyle(fontSize: 16)),
                                label: Text('${s.title} (${s.fee})', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                backgroundColor: Colors.white,
                                onPressed: () => widget.onApplyService(s.id),
                              ))
                          .toList(),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
          ],

          // SERVICES LIST
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'All Services (${_filteredServices.length})',
                  style: theme.textTheme.titleLarge,
                ),
                const SizedBox(height: AppSpacing.sm),
                if (_filteredServices.isEmpty)
                  const Padding(
                    padding: EdgeInsets.all(AppSpacing.xl),
                    child: Center(
                      child: Text('No services found matching your query.', style: TextStyle(color: AppColors.textMuted)),
                    ),
                  )
                else
                  ..._filteredServices.map(
                    (service) => ServiceCard(
                      service: service,
                      onApply: () => widget.onApplyService(service.id),
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
