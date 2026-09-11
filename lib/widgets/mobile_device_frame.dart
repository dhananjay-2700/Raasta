import 'package:flutter/material.dart';
import '../config/constants.dart';

class MobileDeviceFrame extends StatefulWidget {
  final Widget child;

  const MobileDeviceFrame({super.key, required this.child});

  @override
  State<MobileDeviceFrame> createState() => _MobileDeviceFrameState();
}

class _MobileDeviceFrameState extends State<MobileDeviceFrame> {
  bool _forceMobileFrame = true;

  @override
  Widget build(BuildContext context) {
    final screenSize = MediaQuery.of(context).size;
    final isDesktopScreen = screenSize.width > 680;

    // Direct native view on mobile devices or when frame is toggled off
    if (!isDesktopScreen || !_forceMobileFrame) {
      return widget.child;
    }

    // Dynamic responsive dimensions for showcase on desktop
    final double maxFrameHeight = (screenSize.height - 90).clamp(580.0, 840.0);
    final double frameWidth = (maxFrameHeight * 0.52).clamp(380.0, 480.0);

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A), // Dark slate presentation backdrop
      body: SafeArea(
        child: Column(
          children: [
            // PRESENTATION HEADER CONTROLS
            Container(
              height: 50,
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                children: [
                  Expanded(
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(AppRadius.full),
                          border: Border.all(color: Colors.white24),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('🇮🇳', style: TextStyle(fontSize: 16)),
                            SizedBox(width: 8),
                            Text(
                              'BridgeBharat — Civic Companion Showcase',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            SizedBox(width: 8),
                            Text(
                              '• google/gemma-4-31B-it',
                              style: TextStyle(color: AppColors.accent, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Tooltip(
                    message: 'Toggle Fullscreen / Mobile Mode',
                    child: OutlinedButton.icon(
                      onPressed: () => setState(() => _forceMobileFrame = !_forceMobileFrame),
                      icon: Icon(
                        _forceMobileFrame ? Icons.fullscreen : Icons.phone_android,
                        color: Colors.white,
                        size: 16,
                      ),
                      label: Text(
                        _forceMobileFrame ? 'Fullscreen App View' : 'Device Frame View',
                        style: const TextStyle(color: Colors.white, fontSize: 12),
                      ),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Colors.white38),
                        backgroundColor: Colors.white.withOpacity(0.08),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.full)),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // PHONE FRAME CONTAINER WITH RESPONSIVE SCALING
            Expanded(
              child: Center(
                child: Container(
                  width: frameWidth,
                  height: maxFrameHeight,
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: Colors.black,
                    borderRadius: BorderRadius.circular(46),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.7),
                        blurRadius: 36,
                        spreadRadius: 6,
                        offset: const Offset(0, 16),
                      ),
                      BoxShadow(
                        color: AppColors.primary.withOpacity(0.25),
                        blurRadius: 50,
                        spreadRadius: 2,
                      ),
                    ],
                    border: Border.all(color: const Color(0xFF334155), width: 5),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(41),
                    child: Stack(
                      children: [
                        // ACTUAL MOBILE APP CONTENT
                        widget.child,

                        // TOP NOTCH / DYNAMIC ISLAND OVERLAY
                        Positioned(
                          top: 0,
                          left: 0,
                          right: 0,
                          child: IgnorePointer(
                            child: Container(
                              height: 28,
                              padding: const EdgeInsets.symmetric(horizontal: 20),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    '9:41',
                                    style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 11),
                                  ),
                                  Container(
                                    width: 80,
                                    height: 16,
                                    decoration: BoxDecoration(
                                      color: Colors.black,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                  ),
                                  const Row(
                                    children: [
                                      Icon(Icons.signal_cellular_4_bar, size: 11, color: Colors.black87),
                                      SizedBox(width: 3),
                                      Icon(Icons.wifi, size: 11, color: Colors.black87),
                                      SizedBox(width: 3),
                                      Icon(Icons.battery_full, size: 13, color: Colors.black87),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),

                        // BOTTOM HOME INDICATOR BAR
                        Positioned(
                          bottom: 4,
                          left: 0,
                          right: 0,
                          child: IgnorePointer(
                            child: Center(
                              child: Container(
                                width: 120,
                                height: 4,
                                decoration: BoxDecoration(
                                  color: Colors.black38,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
