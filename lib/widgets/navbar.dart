import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/constants.dart';
import '../providers/language_provider.dart';

class BottomNavBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const BottomNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final lang = Provider.of<LanguageProvider>(context);

    return NavigationBar(
      selectedIndex: currentIndex,
      onDestinationSelected: onTap,
      backgroundColor: AppColors.background,
      elevation: 8,
      indicatorColor: AppColors.primaryLight,
      destinations: [
        NavigationDestination(
          icon: const Icon(Icons.dashboard_outlined),
          selectedIcon: const Icon(Icons.dashboard, color: AppColors.primary),
          label: lang.getText('dashboard'),
        ),
        NavigationDestination(
          icon: const Icon(Icons.business_outlined),
          selectedIcon: const Icon(Icons.business, color: AppColors.primary),
          label: lang.getText('services_short'),
        ),
        NavigationDestination(
          icon: const Icon(Icons.card_giftcard_outlined),
          selectedIcon: const Icon(Icons.card_giftcard, color: AppColors.primary),
          label: lang.getText('schemes_short'),
        ),
        NavigationDestination(
          icon: const Icon(Icons.manage_search_outlined),
          selectedIcon: const Icon(Icons.manage_search, color: AppColors.primary),
          label: lang.getText('track_short'),
        ),
        NavigationDestination(
          icon: const Icon(Icons.person_outline),
          selectedIcon: const Icon(Icons.person, color: AppColors.primary),
          label: lang.getText('profile_short'),
        ),
      ],
    );
  }
}
