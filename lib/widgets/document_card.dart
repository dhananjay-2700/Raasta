import 'package:flutter/material.dart';
import '../config/constants.dart';
import '../models/document_model.dart';
import 'badge_widget.dart';

class DocumentCard extends StatelessWidget {
  final DocumentModel document;
  final VoidCallback onView;
  final VoidCallback onDownload;
  final VoidCallback onShare;

  const DocumentCard({
    super.key,
    required this.document,
    required this.onView,
    required this.onDownload,
    required this.onShare,
  });

  String _getTypeEmoji(String type) {
    switch (type.toUpperCase()) {
      case 'PDF':
        return '📄';
      case 'JPG':
      case 'PNG':
        return '🖼️';
      default:
        return '📁';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final doc = document;

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              alignment: Alignment.center,
              child: Text(
                _getTypeEmoji(doc.type),
                style: const TextStyle(fontSize: 22),
              ),
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
                          doc.name,
                          style: theme.textTheme.titleLarge?.copyWith(fontSize: 15),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 4),
                      BadgeWidget.status(doc.status),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${doc.category} • ${doc.size} • Uploaded ${doc.uploadedDate}',
                    style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                  ),
                  if (doc.expiryDate != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      'Expires: ${doc.expiryDate}',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: doc.status == 'Expiring Soon' ? AppColors.warning : AppColors.textMuted,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            IconButton(
              icon: const Icon(Icons.visibility_outlined, size: 20, color: AppColors.primary),
              onPressed: onView,
              tooltip: 'View Document',
            ),
            IconButton(
              icon: const Icon(Icons.download_outlined, size: 20, color: AppColors.primary),
              onPressed: onDownload,
              tooltip: 'Download',
            ),
            IconButton(
              icon: const Icon(Icons.share_outlined, size: 20, color: AppColors.primary),
              onPressed: onShare,
              tooltip: 'Share Document',
            ),
          ],
        ),
      ),
    );
  }
}
