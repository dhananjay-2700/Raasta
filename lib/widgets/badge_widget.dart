import 'package:flutter/material.dart';
import '../config/constants.dart';

class BadgeWidget extends StatelessWidget {
  final String text;
  final Color backgroundColor;
  final Color textColor;
  final IconData? icon;

  const BadgeWidget({
    super.key,
    required this.text,
    required this.backgroundColor,
    required this.textColor,
    this.icon,
  });

  factory BadgeWidget.status(String status) {
    switch (status.toLowerCase()) {
      case 'resolved':
      case 'completed':
      case 'verified':
        return BadgeWidget(
          text: status,
          backgroundColor: AppColors.secondaryLight,
          textColor: AppColors.secondary,
          icon: Icons.check_circle_outline,
        );
      case 'in progress':
      case 'under review':
      case 'assigned':
      case 'processing':
        return BadgeWidget(
          text: status,
          backgroundColor: AppColors.primaryLight,
          textColor: AppColors.primary,
          icon: Icons.sync,
        );
      case 'documents pending':
      case 'form incomplete':
      case 'expiring soon':
        return BadgeWidget(
          text: status,
          backgroundColor: AppColors.warningLight,
          textColor: AppColors.warning,
          icon: Icons.warning_amber_rounded,
        );
      case 'high':
        return const BadgeWidget(
          text: 'High Priority',
          backgroundColor: AppColors.dangerLight,
          textColor: AppColors.danger,
          icon: Icons.priority_high,
        );
      default:
        return BadgeWidget(
          text: status,
          backgroundColor: AppColors.surface,
          textColor: AppColors.textSecondary,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(AppRadius.full),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 13, color: textColor),
            const SizedBox(width: 4),
          ],
          Text(
            text,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }
}
