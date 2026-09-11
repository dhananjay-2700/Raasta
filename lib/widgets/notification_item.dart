import 'package:flutter/material.dart';
import '../config/constants.dart';
import '../models/notification_model.dart';
import 'badge_widget.dart';

class NotificationItem extends StatelessWidget {
  final NotificationModel notification;
  final VoidCallback onTap;

  const NotificationItem({
    super.key,
    required this.notification,
    required this.onTap,
  });

  IconData _getTypeIcon(String type) {
    switch (type.toLowerCase()) {
      case 'success':
        return Icons.check_circle;
      case 'warning':
        return Icons.warning_amber_rounded;
      default:
        return Icons.info;
    }
  }

  Color _getTypeColor(String type) {
    switch (type.toLowerCase()) {
      case 'success':
        return AppColors.secondary;
      case 'warning':
        return AppColors.warning;
      default:
        return AppColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final n = notification;
    final typeColor = _getTypeColor(n.type);

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      color: n.isRead ? AppColors.background : AppColors.primaryLight.withOpacity(0.3),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(AppSpacing.sm),
                decoration: BoxDecoration(
                  color: typeColor.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(_getTypeIcon(n.type), color: typeColor, size: 20),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            n.title,
                            style: theme.textTheme.titleLarge?.copyWith(
                              fontSize: 15,
                              fontWeight: n.isRead ? FontWeight.w500 : FontWeight.bold,
                            ),
                          ),
                        ),
                        if (!n.isRead)
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      n.description,
                      style: theme.textTheme.bodyMedium,
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Row(
                      children: [
                        BadgeWidget(
                          text: n.category,
                          backgroundColor: AppColors.surface,
                          textColor: AppColors.textMuted,
                        ),
                        const Spacer(),
                        Text(
                          n.timeAgo,
                          style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                        ),
                      ],
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
}
