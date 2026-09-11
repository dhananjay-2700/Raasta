import 'package:flutter/material.dart';
import '../config/constants.dart';
import '../models/complaint_model.dart';
import 'badge_widget.dart';
import 'timeline_widget.dart';

class ComplaintCard extends StatefulWidget {
  final ComplaintModel complaint;
  final bool showTimeline;

  const ComplaintCard({
    super.key,
    required this.complaint,
    this.showTimeline = true,
  });

  @override
  State<ComplaintCard> createState() => _ComplaintCardState();
}

class _ComplaintCardState extends State<ComplaintCard> {
  bool _isExpanded = false;

  String _getCategoryEmoji(String cat) {
    switch (cat.toLowerCase()) {
      case 'pothole':
        return '🕳️';
      case 'garbage':
        return '🗑️';
      case 'water':
        return '💧';
      case 'streetlight':
        return '💡';
      default:
        return '📋';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = widget.complaint;

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  _getCategoryEmoji(c.category),
                  style: const TextStyle(fontSize: 22),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    c.title,
                    style: theme.textTheme.titleLarge?.copyWith(fontSize: 15),
                  ),
                ),
                BadgeWidget.status(c.status),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                const Icon(Icons.location_on_outlined, size: 16, color: AppColors.textMuted),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    c.location,
                    style: const TextStyle(fontSize: 13, color: AppColors.textMuted),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Text(
                  'ID: ${c.id} • Dept: ${c.department}',
                  style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                ),
                const Spacer(),
                BadgeWidget.status(c.priority),
              ],
            ),
            if (widget.showTimeline) ...[
              const SizedBox(height: AppSpacing.sm),
              InkWell(
                onTap: () => setState(() => _isExpanded = !_isExpanded),
                child: Row(
                  children: [
                    Text(
                      _isExpanded ? 'Hide Status Timeline' : 'View Status Timeline',
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                    Icon(
                      _isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                      color: AppColors.primary,
                      size: 20,
                    ),
                  ],
                ),
              ),
              if (_isExpanded) ...[
                const SizedBox(height: AppSpacing.md),
                TimelineWidget(steps: c.timeline),
              ],
            ],
          ],
        ),
      ),
    );
  }
}
