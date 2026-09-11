import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/constants.dart';
import '../data/user_data.dart';
import '../providers/language_provider.dart';
import '../providers/theme_provider.dart';
import '../widgets/badge_widget.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final themeProvider = Provider.of<ThemeProvider>(context);
    final languageProvider = Provider.of<LanguageProvider>(context);
    final lang = languageProvider;

    return Scaffold(
      appBar: AppBar(
        title: Text(lang.getText('profile')),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textMuted,
          indicatorColor: AppColors.primary,
          tabs: [
            Tab(text: lang.getText('tab_personal_info')),
            Tab(text: lang.getText('tab_linked_ids')),
            Tab(text: lang.getText('tab_accessibility')),
            Tab(text: lang.getText('tab_language')),
            Tab(text: lang.getText('tab_settings')),
          ],
        ),
      ),
      body: Column(
        children: [
          // PROFILE HEADER CARD
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            color: AppColors.primaryLight.withOpacity(0.4),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 32,
                  backgroundColor: AppColors.primary,
                  child: const Text('RK', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(currentUserData.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                          const SizedBox(width: 6),
                          const Icon(Icons.verified, color: AppColors.secondary, size: 18),
                        ],
                      ),
                      Text('${currentUserData.email} • ${currentUserData.phone}', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                      const SizedBox(height: 4),
                      Wrap(
                        spacing: 4,
                        children: [
                          BadgeWidget(text: lang.getText('verified_citizen'), backgroundColor: AppColors.secondaryLight, textColor: AppColors.secondary),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // TAB 1: PERSONAL INFO
                SingleChildScrollView(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(lang.getText('tab_personal_info'), style: theme.textTheme.titleLarge),
                      const SizedBox(height: AppSpacing.sm),
                      _infoTile(lang.getText('full_name'), currentUserData.name),
                      _infoTile(lang.getText('date_of_birth'), currentUserData.dob),
                      _infoTile(lang.getText('gender'), currentUserData.gender),
                      _infoTile(lang.getText('phone'), currentUserData.phone),
                      _infoTile(lang.getText('email'), currentUserData.email),

                      const SizedBox(height: AppSpacing.lg),
                      Text(lang.getText('address'), style: theme.textTheme.titleLarge),
                      const SizedBox(height: AppSpacing.sm),
                      _infoTile(lang.getText('address'), currentUserData.address),
                      _infoTile(lang.getText('state'), currentUserData.state),
                      _infoTile(lang.getText('district'), currentUserData.district),
                      _infoTile(lang.getText('pincode'), currentUserData.pincode),
                    ],
                  ),
                ),

                // TAB 2: LINKED IDS
                ListView.builder(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  itemCount: currentUserData.linkedIds.length,
                  itemBuilder: (context, index) {
                    final id = currentUserData.linkedIds[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
                      child: ListTile(
                        leading: Text(id.icon, style: const TextStyle(fontSize: 28)),
                        title: Text(id.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('ID: ${id.number}'),
                        trailing: BadgeWidget.status(id.status),
                      ),
                    );
                  },
                ),

                // TAB 3: ACCESSIBILITY
                ListView(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  children: [
                    Text(lang.getText('tab_accessibility'), style: theme.textTheme.titleLarge),
                    const SizedBox(height: AppSpacing.sm),
                    SwitchListTile(
                      title: Text(lang.getText('high_contrast')),
                      value: themeProvider.isHighContrast,
                      onChanged: (val) => themeProvider.setHighContrast(val),
                    ),
                    const Divider(),
                    SwitchListTile(
                      title: Text(lang.getText('large_text')),
                      value: themeProvider.isLargeText,
                      onChanged: (val) => themeProvider.setLargeText(val),
                    ),
                  ],
                ),

                // TAB 4: LANGUAGE — This is the language selector
                ListView.builder(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  itemCount: languageProvider.languages.length,
                  itemBuilder: (context, index) {
                    final langItem = languageProvider.languages[index];
                    final isSelected = langItem['name'] == languageProvider.selectedLanguage;
                    return Card(
                      color: isSelected ? AppColors.primaryLight : AppColors.background,
                      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
                      child: ListTile(
                        leading: Icon(
                          isSelected ? Icons.check_circle : Icons.circle_outlined,
                          color: isSelected ? AppColors.primary : AppColors.textMuted,
                        ),
                        title: Text(
                          langItem['name']!,
                          style: TextStyle(
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            color: isSelected ? AppColors.primaryDark : AppColors.textPrimary,
                          ),
                        ),
                        subtitle: Text(
                          langItem['native']!,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            color: isSelected ? AppColors.primary : AppColors.textMuted,
                          ),
                        ),
                        trailing: isSelected
                            ? Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.secondary,
                                  borderRadius: BorderRadius.circular(AppRadius.full),
                                ),
                                child: const Text('✓ Active', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                              )
                            : null,
                        onTap: () {
                          languageProvider.selectLanguage(langItem['name']!);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('✅ Language changed to ${langItem['native']}'),
                              backgroundColor: AppColors.secondary,
                            ),
                          );
                        },
                      ),
                    );
                  },
                ),

                // TAB 5: SETTINGS
                ListView(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  children: [
                    Text(lang.getText('tab_settings'), style: theme.textTheme.titleLarge),
                    const SizedBox(height: AppSpacing.sm),
                    SwitchListTile(title: Text(lang.getText('notifications')), value: true, onChanged: (v) {}),
                    const Divider(),
                    const SizedBox(height: AppSpacing.xl),
                    OutlinedButton.icon(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(lang.getText('sign_out'))),
                        );
                      },
                      icon: const Icon(Icons.logout, color: AppColors.danger),
                      label: Text(lang.getText('sign_out'), style: const TextStyle(color: AppColors.danger)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoTile(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}
