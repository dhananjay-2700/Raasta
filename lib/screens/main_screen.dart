import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/constants.dart';
import '../providers/chat_provider.dart';
import '../providers/notification_provider.dart';
import '../providers/theme_provider.dart';
import '../widgets/chat_widget.dart';
import '../widgets/navbar.dart';
import 'dashboard_screen.dart';
import 'notifications_screen.dart';
import 'profile_screen.dart';
import 'schemes_screen.dart';
import 'service_apply_screen.dart';
import 'services_screen.dart';
import 'track_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;
  String? _applyServiceId;

  @override
  void initState() {
    super.initState();
    // Wire up AI chat navigation callbacks after first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final chatProvider = Provider.of<ChatProvider>(context, listen: false);
      chatProvider.onNavigateTab = _onTabTapped;
      chatProvider.onNavigateToApply = _navigateToApply;
    });
  }

  void _onTabTapped(int index) {
    setState(() {
      _currentIndex = index;
      _applyServiceId = null;
    });
  }

  void _navigateToApply(String serviceId) {
    setState(() {
      _applyServiceId = serviceId;
    });
  }

  Widget _buildBody() {
    if (_applyServiceId != null) {
      return ServiceApplyScreen(
        serviceId: _applyServiceId!,
        onBack: () => setState(() => _applyServiceId = null),
      );
    }

    switch (_currentIndex) {
      case 0:
        return DashboardScreen(
          onNavigateTab: _onTabTapped,
          onNavigateToApply: _navigateToApply,
        );
      case 1:
        return ServicesScreen(onApplyService: _navigateToApply);
      case 2:
        return const SchemesScreen();
      case 3:
        return TrackScreen(onResumeApplication: _navigateToApply);
      case 4:
        return const ProfileScreen();
      default:
        return DashboardScreen(
          onNavigateTab: _onTabTapped,
          onNavigateToApply: _navigateToApply,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    final notificationProvider = Provider.of<NotificationProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [AppColors.primary, AppColors.secondary]),
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
              child: const Text('BB', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
            ),
            const SizedBox(width: 8),
            const Flexible(
              child: Text(
                'BridgeBharat',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        actions: [
          // Accessibility Toggles
          IconButton(
            icon: Icon(
              themeProvider.isHighContrast ? Icons.wb_sunny : Icons.wb_sunny_outlined,
              color: themeProvider.isHighContrast ? AppColors.warning : null,
            ),
            tooltip: 'Toggle High Contrast Mode',
            onPressed: () => themeProvider.toggleHighContrast(),
          ),
          IconButton(
            icon: Icon(
              Icons.format_size,
              color: themeProvider.isLargeText ? AppColors.primary : null,
            ),
            tooltip: 'Toggle Large Text Mode (+25%)',
            onPressed: () => themeProvider.toggleLargeText(),
          ),

          // Notifications Button
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const NotificationsScreen()),
                  );
                },
              ),
              if (notificationProvider.unreadCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: AppColors.danger,
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      '${notificationProvider.unreadCount}',
                      style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: Stack(
        children: [
          _buildBody(),
          const ChatWidget(),
        ],
      ),
      bottomNavigationBar: BottomNavBar(
        currentIndex: _currentIndex,
        onTap: _onTabTapped,
      ),
    );
  }
}
