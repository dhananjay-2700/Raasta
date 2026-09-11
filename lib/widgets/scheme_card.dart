import 'package:flutter/material.dart';
import '../config/constants.dart';
import '../models/scheme_model.dart';
import 'badge_widget.dart';

class SchemeCard extends StatefulWidget {
  final SchemeModel scheme;
  final VoidCallback onCheckEligibility;

  const SchemeCard({
    super.key,
    required this.scheme,
    required this.onCheckEligibility,
  });

  @override
  State<SchemeCard> createState() => _SchemeCardState();
}

class _SchemeCardState extends State<SchemeCard> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final s = widget.scheme;

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    s.title,
                    style: theme.textTheme.titleLarge?.copyWith(fontSize: 16),
                  ),
                ),
                BadgeWidget(
                  text: s.tag,
                  backgroundColor: AppColors.secondaryLight,
                  textColor: AppColors.secondary,
                ),
                const SizedBox(width: 4),
                BadgeWidget(
                  text: s.scope,
                  backgroundColor: AppColors.primaryLight,
                  textColor: AppColors.primary,
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              s.description,
              style: theme.textTheme.bodyMedium,
            ),
            const SizedBox(height: AppSpacing.md),
            Container(
              padding: const EdgeInsets.all(AppSpacing.sm),
              decoration: BoxDecoration(
                color: AppColors.secondaryLight,
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Benefit Amount',
                        style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                      ),
                      Text(
                        s.benefitAmount,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.secondary,
                        ),
                      ),
                    ],
                  ),
                  Text(
                    s.benefitType,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.secondary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                const Icon(Icons.people_outline, size: 16, color: AppColors.textMuted),
                const SizedBox(width: 4),
                Text(
                  s.beneficiaries,
                  style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                ),
                const Spacer(),
                const Icon(Icons.timer_outlined, size: 16, color: AppColors.textMuted),
                const SizedBox(width: 4),
                Text(
                  'Deadline: ${s.deadline}',
                  style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            InkWell(
              onTap: () => setState(() => _isExpanded = !_isExpanded),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Text(
                      _isExpanded ? 'Hide Details' : 'View Eligibility & Documents',
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
            ),
            if (_isExpanded) ...[
              const Divider(),
              const Text(
                '✅ Eligibility Criteria:',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              ),
              const SizedBox(height: 4),
              ...s.eligibility.map((e) => Text('• $e', style: const TextStyle(fontSize: 13))),
              const SizedBox(height: AppSpacing.sm),
              const Text(
                '📋 Documents Required:',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              ),
              const SizedBox(height: 4),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: s.documents
                    .map((d) => Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(AppRadius.sm),
                          ),
                          child: Text(d, style: const TextStyle(fontSize: 12)),
                        ))
                    .toList(),
              ),
            ],
            const SizedBox(height: AppSpacing.md),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.secondary,
                ),
                onPressed: widget.onCheckEligibility,
                child: const Text('Check Eligibility'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
