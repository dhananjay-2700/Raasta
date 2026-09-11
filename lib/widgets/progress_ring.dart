import 'dart:math';
import 'package:flutter/material.dart';
import '../config/constants.dart';

class ProgressRing extends StatelessWidget {
  final int percentage;
  final double size;
  final double strokeWidth;

  const ProgressRing({
    super.key,
    required this.percentage,
    this.size = 100,
    this.strokeWidth = 10,
  });

  Color _getRingColor() {
    if (percentage >= 70) return AppColors.secondary;
    if (percentage >= 40) return AppColors.warning;
    return AppColors.danger;
  }

  @override
  Widget build(BuildContext context) {
    final ringColor = _getRingColor();

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: Size(size, size),
            painter: _RingPainter(
              percentage: percentage,
              strokeWidth: strokeWidth,
              color: ringColor,
              backgroundColor: AppColors.surfaceHover,
            ),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '$percentage%',
                style: TextStyle(
                  fontSize: size * 0.25,
                  fontWeight: FontWeight.bold,
                  color: ringColor,
                ),
              ),
              Text(
                'Complete',
                style: TextStyle(
                  fontSize: size * 0.11,
                  color: AppColors.textMuted,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  final int percentage;
  final double strokeWidth;
  final Color color;
  final Color backgroundColor;

  _RingPainter({
    required this.percentage,
    required this.strokeWidth,
    required this.color,
    required this.backgroundColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (min(size.width, size.height) - strokeWidth) / 2;

    final bgPaint = Paint()
      ..color = backgroundColor
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke;

    final fgPaint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, bgPaint);

    final sweepAngle = 2 * pi * (percentage / 100);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -pi / 2,
      sweepAngle,
      false,
      fgPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _RingPainter oldDelegate) =>
      oldDelegate.percentage != percentage || oldDelegate.color != color;
}
