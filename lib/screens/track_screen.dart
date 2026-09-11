import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/constants.dart';
import '../data/applications_data.dart';
import '../data/complaints_data.dart';
import '../providers/language_provider.dart';
import '../widgets/application_card.dart';
import '../widgets/badge_widget.dart';
import '../widgets/complaint_card.dart';
import '../widgets/stat_card.dart';

class TrackScreen extends StatefulWidget {
  final Function(String serviceId)? onResumeApplication;

  const TrackScreen({super.key, this.onResumeApplication});

  @override
  State<TrackScreen> createState() => _TrackScreenState();
}

class _TrackScreenState extends State<TrackScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lang = Provider.of<LanguageProvider>(context);

    final filteredApps = applicationsData
        .where((app) =>
            _searchQuery.isEmpty ||
            app.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            app.id.toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList();

    return Scaffold(
      appBar: AppBar(
        title: Text(lang.getText('track')),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textMuted,
          indicatorColor: AppColors.primary,
          tabs: [
            Tab(text: '${lang.getText('applications')} (${applicationsData.length})'),
            Tab(text: '${lang.getText('complaints')} (${complaintsData.length})'),
            Tab(text: lang.getText('services_short')),
          ],
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              children: [
                // STATS GRID
                SizedBox(
                  height: 115,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      SizedBox(width: 140, child: StatCard(label: lang.getText('applications'), value: '5', icon: Icons.assignment, color: AppColors.primary)),
                      const SizedBox(width: AppSpacing.sm),
                      SizedBox(width: 140, child: StatCard(label: lang.getText('stat_open_complaints'), value: '3', icon: Icons.report_problem, color: AppColors.accent)),
                      const SizedBox(width: AppSpacing.sm),
                      SizedBox(width: 140, child: StatCard(label: lang.getText('services_short'), value: '3', icon: Icons.room_service, color: AppColors.warning)),
                      const SizedBox(width: AppSpacing.sm),
                      SizedBox(width: 140, child: StatCard(label: lang.getText('status_resolved'), value: '1', icon: Icons.check_circle, color: AppColors.secondary)),
                    ],
                  ),
                ),

                const SizedBox(height: AppSpacing.sm),

                // SEARCH BAR
                TextField(
                  controller: _searchController,
                  onChanged: (val) => setState(() => _searchQuery = val),
                  decoration: InputDecoration(
                    hintText: lang.getText('search_applications'),
                    prefixIcon: const Icon(Icons.search, color: AppColors.primary),
                    filled: true,
                    fillColor: AppColors.surface,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      borderSide: const BorderSide(color: AppColors.border),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  ),
                ),
              ],
            ),
          ),

          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // APPLICATIONS TAB
                ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                  itemCount: filteredApps.length,
                  itemBuilder: (context, index) {
                    final app = filteredApps[index];
                    return ApplicationCard(
                      application: app,
                      onResume: () {
                        if (widget.onResumeApplication != null) {
                          widget.onResumeApplication!('7');
                        }
                      },
                    );
                  },
                ),

                // COMPLAINTS TAB
                ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                  itemCount: complaintsData.length,
                  itemBuilder: (context, index) {
                    return ComplaintCard(complaint: complaintsData[index], showTimeline: true);
                  },
                ),

                // SERVICE REQUESTS TAB
                ListView(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  children: [
                    _serviceRequestCard('SR-4410', 'Aadhaar Address Update', 'Completed', 'Jun 20, 2026'),
                    _serviceRequestCard('SR-4388', 'PAN-Aadhaar Linking', 'Completed', 'Jun 15, 2026'),
                    _serviceRequestCard('SR-4320', 'Birth Certificate Request', 'Processing', 'Jun 10, 2026'),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _serviceRequestCard(String id, String title, String status, String date) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: ListTile(
        leading: const Icon(Icons.receipt_long, color: AppColors.primary),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        subtitle: Text('ID: $id • Date: $date', style: const TextStyle(fontSize: 12)),
        trailing: BadgeWidget.status(status),
      ),
    );
  }
}
