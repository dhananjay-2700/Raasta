import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/constants.dart';
import '../data/complaints_data.dart';
import '../providers/language_provider.dart';
import '../widgets/complaint_card.dart';

class ReportScreen extends StatefulWidget {
  const ReportScreen({super.key});

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedIssueType = 'Pothole/Road Damage';
  bool _isSuccess = false;
  String _lastSubmittedId = '';

  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descController = TextEditingController();
  final TextEditingController _locationController = TextEditingController(text: 'MG Road, Sector 14, Gurugram');

  final List<Map<String, String>> _issueTypes = [
    {'label': 'Pothole/Road Damage', 'emoji': '🕳️', 'dept': 'PWD'},
    {'label': 'Garbage/Waste', 'emoji': '🗑️', 'dept': 'Municipal Corp'},
    {'label': 'Water Supply Issue', 'emoji': '💧', 'dept': 'Water Board'},
    {'label': 'Street Light Issue', 'emoji': '💡', 'dept': 'Electricity Dept'},
    {'label': 'Drainage/Sewage', 'emoji': '🚰', 'dept': 'Drainage Dept'},
    {'label': 'Illegal Parking', 'emoji': '🚗', 'dept': 'Traffic Police'},
    {'label': 'Public Sanitation', 'emoji': '🚻', 'dept': 'Health Dept'},
    {'label': 'Noise Pollution', 'emoji': '📢', 'dept': 'Police/PCB'},
    {'label': 'Tree Fall/Green', 'emoji': '🌳', 'dept': 'Forest Dept'},
    {'label': 'Encroachment', 'emoji': '🏗️', 'dept': 'Municipal Corp'},
    {'label': 'Power Outage', 'emoji': '⚡', 'dept': 'Electricity Dept'},
    {'label': 'Other Issue', 'emoji': '📋', 'dept': 'General'},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _titleController.dispose();
    _descController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  void _submitComplaint() {
    if (_titleController.text.trim().isEmpty) return;

    setState(() {
      _lastSubmittedId = 'CMP-890${(DateTime.now().second % 9) + 1}';
      _isSuccess = true;
    });

    _tabController.animateTo(1); // Move to My Complaints tab
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final lang = Provider.of<LanguageProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(lang.getText('report')),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textMuted,
          indicatorColor: AppColors.primary,
          tabs: [
            Tab(text: lang.getText('report_new')),
            Tab(text: lang.getText('my_complaints')),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // TAB 1: REPORT NEW ISSUE
          SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(lang.getText('select_category'), style: theme.textTheme.titleLarge),
                const SizedBox(height: AppSpacing.sm),
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    childAspectRatio: 1.1,
                    crossAxisSpacing: 8,
                    mainAxisSpacing: 8,
                  ),
                  itemCount: _issueTypes.length,
                  itemBuilder: (context, index) {
                    final type = _issueTypes[index];
                    final isSelected = type['label'] == _selectedIssueType;
                    return InkWell(
                      onTap: () => setState(() => _selectedIssueType = type['label']!),
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      child: Container(
                        decoration: BoxDecoration(
                          color: isSelected ? AppColors.primaryLight : AppColors.surface,
                          borderRadius: BorderRadius.circular(AppRadius.md),
                          border: Border.all(
                            color: isSelected ? AppColors.primary : AppColors.border,
                            width: isSelected ? 2 : 1,
                          ),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(type['emoji']!, style: const TextStyle(fontSize: 24)),
                            const SizedBox(height: 4),
                            Text(
                              type['label']!,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                color: isSelected ? AppColors.primaryDark : AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),

                const SizedBox(height: AppSpacing.lg),

                Text(lang.getText('describe_issue').split('...').first, style: theme.textTheme.titleLarge),
                const SizedBox(height: AppSpacing.sm),

                TextField(
                  controller: _titleController,
                  decoration: InputDecoration(
                    labelText: 'Issue Title *',
                    hintText: 'e.g. Large pothole near Sector 14 Metro',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),

                TextField(
                  controller: _descController,
                  maxLines: 3,
                  decoration: InputDecoration(
                    labelText: 'Description *',
                    hintText: 'Describe the issue in detail...',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),

                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _locationController,
                        decoration: InputDecoration(
                          labelText: 'Location *',
                          prefixIcon: const Icon(Icons.location_on, color: AppColors.primary),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                        ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    ElevatedButton.icon(
                      onPressed: () {
                        setState(() {
                          _locationController.text = 'Sector 14, Gurugram (GPS Verified)';
                        });
                      },
                      icon: const Icon(Icons.my_location, size: 16),
                      label: const Text('GPS', style: TextStyle(fontSize: 12)),
                      style: ElevatedButton.styleFrom(
                        minimumSize: const Size(60, 48),
                        backgroundColor: AppColors.secondary,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: AppSpacing.md),

                // UPLOAD PHOTOS ZONE
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    border: Border.all(color: AppColors.border, style: BorderStyle.solid),
                  ),
                  child: const Column(
                    children: [
                      Icon(Icons.camera_alt_outlined, color: AppColors.primary, size: 36),
                      SizedBox(height: 6),
                      Text('Click to capture or upload photos', style: TextStyle(fontWeight: FontWeight.bold)),
                      Text('PNG, JPG up to 10MB. Max 5 photos.', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                    ],
                  ),
                ),

                const SizedBox(height: AppSpacing.lg),

                // MAP PLACEHOLDER
                Container(
                  height: 120,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                  ),
                  child: const Center(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.map, color: AppColors.primary),
                        SizedBox(width: 8),
                        Text('12 active civic reports nearby on Map', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryDark)),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: AppSpacing.xl),

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _submitComplaint,
                    style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 48)),
                    child: Text(lang.getText('submit_complaint')),
                  ),
                ),
              ],
            ),
          ),

          // TAB 2: MY COMPLAINTS
          SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_isSuccess)
                  Container(
                    margin: const EdgeInsets.only(bottom: AppSpacing.md),
                    padding: const EdgeInsets.all(AppSpacing.md),
                    decoration: BoxDecoration(
                      color: AppColors.secondaryLight,
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      border: Border.all(color: AppColors.secondary),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle, color: AppColors.secondary),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: Text(
                            'Complaint Submitted Successfully! Complaint ID: $_lastSubmittedId',
                            style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.secondary),
                          ),
                        ),
                      ],
                    ),
                  ),

                ...complaintsData.map((c) => ComplaintCard(complaint: c, showTimeline: true)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
