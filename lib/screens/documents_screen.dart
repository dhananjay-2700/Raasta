import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/constants.dart';
import '../data/documents_data.dart';
import '../models/document_model.dart';
import '../providers/language_provider.dart';
import '../widgets/category_chips.dart';
import '../widgets/document_card.dart';
import '../widgets/stat_card.dart';

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({super.key});

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedCategory = 'All';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _docNameController = TextEditingController();
  String _selectedType = 'Aadhaar Card';

  final List<String> _categories = [
    'All',
    'Identity',
    'Certificates',
    'Education',
    'Property',
    'Vehicle',
    'Health',
    'Finance',
  ];

  final List<String> _docTypes = [
    'Aadhaar Card',
    'PAN Card',
    'Driving Licence',
    'Passport',
    'Income Certificate',
    'Marksheet',
    'Degree Certificate',
    'Vehicle Insurance',
    'PUC Certificate',
    'Electricity Bill',
    'Rent Agreement',
    'Health Card',
    'Bank Passbook',
    'Form 16',
    'Voter ID',
    'Caste Certificate',
    'Domicile Certificate',
    'Other Document',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    _docNameController.dispose();
    super.dispose();
  }

  List<DocumentModel> get _filteredDocs {
    return documentsData.where((doc) {
      final matchesCategory = _selectedCategory == 'All' ||
          doc.category.toLowerCase() == _selectedCategory.toLowerCase();

      final matchesQuery = _searchQuery.isEmpty ||
          doc.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          doc.type.toLowerCase().contains(_searchQuery.toLowerCase());

      return matchesCategory && matchesQuery;
    }).toList();
  }

  void _showDocumentDialog(DocumentModel doc) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(doc.name),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Type: ${doc.type} • Size: ${doc.size}'),
            Text('Category: ${doc.category}'),
            Text('Uploaded: ${doc.uploadedDate}'),
            if (doc.expiryDate != null) Text('Expiry: ${doc.expiryDate}'),
            const SizedBox(height: AppSpacing.md),
            Container(
              height: 150,
              width: double.infinity,
              color: AppColors.surfaceHover,
              alignment: Alignment.center,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.description, size: 48, color: AppColors.primary),
                  const SizedBox(height: 8),
                  Text('Digital Vault Verified Document (${doc.type})', style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final lang = Provider.of<LanguageProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(lang.getText('documents')),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textMuted,
          indicatorColor: AppColors.primary,
          tabs: [
            Tab(text: lang.getText('documents')),
            Tab(text: lang.getText('upload_document')),
            Tab(text: lang.getText('share')),
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
                    children: const [
                      SizedBox(width: 140, child: StatCard(label: 'Total Documents', value: '18', icon: Icons.folder, color: AppColors.primary)),
                      SizedBox(width: AppSpacing.sm),
                      SizedBox(width: 140, child: StatCard(label: 'Verified', value: '14', icon: Icons.verified, color: AppColors.secondary)),
                      SizedBox(width: AppSpacing.sm),
                      SizedBox(width: 140, child: StatCard(label: 'Expiring Soon', value: '2', icon: Icons.warning, color: AppColors.warning)),
                      SizedBox(width: AppSpacing.sm),
                      SizedBox(width: 140, child: StatCard(label: 'Shared Docs', value: '4', icon: Icons.share, color: AppColors.accent)),
                    ],
                  ),
                ),

                const SizedBox(height: AppSpacing.sm),

                // EXPIRY ALERT BANNER
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.warningLight,
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    border: Border.all(color: AppColors.warning.withOpacity(0.4)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.warning_amber_rounded, color: AppColors.warning, size: 20),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Documents Expiring Soon: Driving Licence, Vehicle Insurance — Renew before expiry.',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.warning),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // TAB 1: MY DOCUMENTS
                Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                      child: TextField(
                        controller: _searchController,
                        onChanged: (val) => setState(() => _searchQuery = val),
                        decoration: InputDecoration(
                          hintText: 'Search documents by name...',
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
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    CategoryChips(
                      categories: _categories,
                      selectedCategory: _selectedCategory,
                      onSelected: (cat) => setState(() => _selectedCategory = cat),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Expanded(
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                        itemCount: _filteredDocs.length,
                        itemBuilder: (context, index) {
                          final doc = _filteredDocs[index];
                          return DocumentCard(
                            document: doc,
                            onView: () => _showDocumentDialog(doc),
                            onDownload: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Downloading ${doc.name} (${doc.type})...')),
                              );
                            },
                            onShare: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Secure DigiLocker link generated for ${doc.name}')),
                              );
                            },
                          );
                        },
                      ),
                    ),
                  ],
                ),

                // TAB 2: UPLOAD DOCUMENT
                SingleChildScrollView(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Upload New Document', style: theme.textTheme.titleLarge),
                      const SizedBox(height: AppSpacing.md),

                      DropdownButtonFormField<String>(
                        initialValue: _selectedType,
                        decoration: InputDecoration(
                          labelText: 'Document Type',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                        ),
                        items: _docTypes.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedType = val);
                        },
                      ),
                      const SizedBox(height: AppSpacing.md),

                      TextField(
                        controller: _docNameController,
                        decoration: InputDecoration(
                          labelText: 'Document Custom Name',
                          hintText: 'e.g. My Driving Licence 2026',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),

                      // UPLOAD ZONE
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(AppSpacing.xl),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(AppRadius.md),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: const Column(
                          children: [
                            Icon(Icons.cloud_upload_outlined, color: AppColors.primary, size: 48),
                            SizedBox(height: 8),
                            Text('Click to upload or drag & drop', style: TextStyle(fontWeight: FontWeight.bold)),
                            Text('PDF, JPG, PNG up to 10MB', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                          ],
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xl),

                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Document uploaded & encrypted in DigiLocker!')),
                            );
                            _tabController.animateTo(0);
                          },
                          child: const Text('Encrypt & Save to Vault'),
                        ),
                      ),
                    ],
                  ),
                ),

                // TAB 3: SHARED DOCUMENTS
                ListView(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  children: documentsData
                      .where((d) => d.isShared)
                      .map(
                        (doc) => Card(
                          margin: const EdgeInsets.only(bottom: AppSpacing.sm),
                          child: ListTile(
                            leading: const Icon(Icons.share, color: AppColors.primary),
                            title: Text(doc.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                            subtitle: Text('Shared with: Government Verification Portal • ${doc.uploadedDate}'),
                            trailing: OutlinedButton(
                              onPressed: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Access revoked for ${doc.name}')),
                                );
                              },
                              style: OutlinedButton.styleFrom(minimumSize: const Size(60, 32)),
                              child: const Text('Revoke', style: TextStyle(fontSize: 12, color: AppColors.danger)),
                            ),
                          ),
                        ),
                      )
                      .toList(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
