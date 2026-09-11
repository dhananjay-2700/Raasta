import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/constants.dart';
import '../providers/language_provider.dart';
import '../providers/notification_provider.dart';
import '../widgets/category_chips.dart';
import '../widgets/notification_item.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  String _selectedCategory = 'All';

  final List<String> _categories = [
    'All',
    'Applications',
    'Complaints',
    'Schemes',
    'Documents',
    'General',
  ];

  @override
  Widget build(BuildContext context) {
    final notificationProvider = Provider.of<NotificationProvider>(context);

    final filtered = notificationProvider.notifications.where((n) {
      return _selectedCategory == 'All' || n.category.toLowerCase() == _selectedCategory.toLowerCase();
    }).toList();

    final lang = Provider.of<LanguageProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text('${lang.getText('notifications')} (${notificationProvider.unreadCount})'),
        actions: [
          TextButton(
            onPressed: () => notificationProvider.markAllAsRead(),
            child: Text(lang.getText('mark_all_read')),
          ),
        ],
      ),
      body: Column(
        children: [
          const SizedBox(height: AppSpacing.sm),
          CategoryChips(
            categories: _categories,
            selectedCategory: _selectedCategory,
            onSelected: (cat) => setState(() => _selectedCategory = cat),
          ),
          const SizedBox(height: AppSpacing.md),

          Expanded(
            child: filtered.isEmpty
                ? const Center(child: Text('No notifications found.', style: TextStyle(color: AppColors.textMuted)))
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final n = filtered[index];
                      return NotificationItem(
                        notification: n,
                        onTap: () => notificationProvider.markAsRead(n.id),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
