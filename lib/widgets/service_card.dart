import 'package:flutter/material.dart';
import '../config/constants.dart';
import '../models/service_model.dart';
import 'badge_widget.dart';

class ServiceCard extends StatelessWidget {
  final ServiceModel service;
  final VoidCallback onApply;
  final VoidCallback? onDetails;

  const ServiceCard({
    super.key,
    required this.service,
    required this.onApply,
    this.onDetails,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(AppRadius.md),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    service.icon,
                    style: const TextStyle(fontSize: 24),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        service.title,
                        style: theme.textTheme.titleLarge?.copyWith(fontSize: 16),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Portal: ${service.portal}',
                        style: theme.textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                if (service.popularity >= 90)
                  const BadgeWidget(
                    text: '🔥 Popular',
                    backgroundColor: AppColors.accentLight,
                    textColor: AppColors.accent,
                  ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              service.description,
              style: theme.textTheme.bodyMedium,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Icon(Icons.currency_rupee, size: 16, color: AppColors.secondary),
                Text(
                  service.fee,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AppColors.secondary,
                  ),
                ),
                const SizedBox(width: AppSpacing.lg),
                const Icon(Icons.access_time, size: 16, color: AppColors.textMuted),
                const SizedBox(width: 4),
                Text(
                  service.timeline,
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                ),
                const Spacer(),
                Text(
                  '${service.documents.length} docs',
                  style: const TextStyle(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.w500),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: service.documents
                  .take(3)
                  .map(
                    (doc) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(AppRadius.sm),
                      ),
                      child: Text(
                        '📋 $doc',
                        style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                      ),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: AppSpacing.md),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: onApply,
                    child: const Text('Apply Now'),
                  ),
                ),
                if (onDetails != null) ...[
                  const SizedBox(width: AppSpacing.sm),
                  OutlinedButton(
                    onPressed: onDetails,
                    child: const Text('Details'),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
