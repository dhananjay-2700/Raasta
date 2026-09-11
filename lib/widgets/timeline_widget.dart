import 'package:flutter/material.dart';
import '../config/constants.dart';
import '../models/complaint_model.dart';

class TimelineWidget extends StatelessWidget {
  final List<TimelineStep> steps;

  const TimelineWidget({super.key, required this.steps});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(steps.length, (index) {
        final step = steps[index];
        final isLast = index == steps.length - 1;

        Color circleColor = AppColors.border;
        IconData circleIcon = Icons.circle;

        if (step.isCompleted) {
          circleColor = AppColors.secondary;
          circleIcon = Icons.check;
        } else if (step.isCurrent) {
          circleColor = AppColors.primary;
          circleIcon = Icons.sync;
        }

        return IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                children: [
                  Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: circleColor,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      circleIcon,
                      size: 14,
                      color: Colors.white,
                    ),
                  ),
                  if (!isLast)
                    Expanded(
                      child: Container(
                        width: 2,
                        color: step.isCompleted ? AppColors.secondary : AppColors.border,
                      ),
                    ),
                ],
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.md),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        step.title,
                        style: TextStyle(
                          fontWeight: step.isCurrent || step.isCompleted ? FontWeight.bold : FontWeight.normal,
                          color: step.isCurrent
                              ? AppColors.primary
                              : (step.isCompleted ? AppColors.textPrimary : AppColors.textMuted),
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        step.date,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
}
