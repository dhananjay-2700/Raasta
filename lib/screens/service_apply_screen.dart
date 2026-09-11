import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/constants.dart';
import '../data/services_data.dart';
import '../providers/chat_provider.dart';
import '../providers/form_provider.dart';
import '../widgets/progress_ring.dart';

class ServiceApplyScreen extends StatefulWidget {
  final String serviceId;
  final VoidCallback onBack;

  const ServiceApplyScreen({
    super.key,
    required this.serviceId,
    required this.onBack,
  });

  @override
  State<ServiceApplyScreen> createState() => _ServiceApplyScreenState();
}

class _ServiceApplyScreenState extends State<ServiceApplyScreen> {
  bool _isSubmitted = false;
  String _generatedAppId = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initForm();
    });
  }

  void _initForm() {
    final formProvider = Provider.of<FormProvider>(context, listen: false);

    // Find service
    final service = servicesData.firstWhere(
      (s) => s.id == widget.serviceId,
      orElse: () => servicesData.firstWhere((s) => s.id == '7'), // Income Certificate default
    );

    List<FormFieldData> fields = [];

    if (service.title.toLowerCase().contains('passport')) {
      fields = [
        FormFieldData(name: 'fullName', label: 'Full Name', required: true),
        FormFieldData(name: 'surname', label: 'Surname', required: true),
        FormFieldData(name: 'dob', label: 'Date of Birth', type: 'date', required: true),
        FormFieldData(name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true),
        FormFieldData(name: 'placeOfBirth', label: 'Place of Birth', required: true),
        FormFieldData(name: 'aadhaar', label: 'Aadhaar Number', required: true),
        FormFieldData(name: 'pan', label: 'PAN Number', required: false),
        FormFieldData(name: 'phone', label: 'Mobile Number', type: 'tel', required: true),
        FormFieldData(name: 'email', label: 'Email Address', type: 'email', required: true),
        FormFieldData(name: 'address', label: 'Residential Address', type: 'textarea', required: true),
        FormFieldData(name: 'state', label: 'State', required: true),
        FormFieldData(name: 'district', label: 'District', required: true),
        FormFieldData(name: 'pincode', label: 'Pincode', type: 'tel', required: true),
        FormFieldData(name: 'fatherName', label: 'Father\'s Name', required: true),
        FormFieldData(name: 'motherName', label: 'Mother\'s Name', required: true),
      ];
    } else if (service.title.toLowerCase().contains('aadhaar')) {
      fields = [
        FormFieldData(name: 'fullName', label: 'Full Name', required: true),
        FormFieldData(name: 'dob', label: 'Date of Birth', type: 'date', required: true),
        FormFieldData(name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true),
        FormFieldData(name: 'phone', label: 'Mobile Number', type: 'tel', required: true),
        FormFieldData(name: 'email', label: 'Email Address', type: 'email', required: false),
        FormFieldData(name: 'address', label: 'Full Address', type: 'textarea', required: true),
        FormFieldData(name: 'state', label: 'State', required: true),
        FormFieldData(name: 'district', label: 'District', required: true),
        FormFieldData(name: 'pincode', label: 'Pincode', type: 'tel', required: true),
        FormFieldData(name: 'fatherName', label: 'Father\'s/Guardian\'s Name', required: true),
      ];
    } else {
      // Default: Income Certificate form
      fields = [
        FormFieldData(name: 'fullName', label: 'Full Name', required: true),
        FormFieldData(name: 'fatherName', label: 'Father\'s / Husband\'s Name', required: true),
        FormFieldData(name: 'dob', label: 'Date of Birth', type: 'date', required: true),
        FormFieldData(name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true),
        FormFieldData(name: 'aadhaar', label: 'Aadhaar Number', type: 'tel', required: true),
        FormFieldData(name: 'phone', label: 'Mobile Number', type: 'tel', required: true),
        FormFieldData(name: 'email', label: 'Email Address', type: 'email', required: false),
        FormFieldData(name: 'address', label: 'Residential Address', type: 'textarea', required: true),
        FormFieldData(name: 'state', label: 'State', required: true),
        FormFieldData(name: 'district', label: 'District', required: true),
        FormFieldData(name: 'pincode', label: 'Pincode', type: 'tel', required: true),
        FormFieldData(name: 'occupation', label: 'Applicant Occupation', required: true),
        FormFieldData(name: 'annualIncome', label: 'Total Annual Income (₹)', required: true),
        FormFieldData(name: 'incomeSource', label: 'Primary Income Source', type: 'select', options: ['Salary', 'Business', 'Agriculture', 'Pension', 'Self-Employed', 'Other'], required: true),
        FormFieldData(name: 'purpose', label: 'Purpose of Certificate', required: false),
      ];
    }

    final meta = FormMeta(
      title: '${service.title} Application',
      serviceId: service.id,
      serviceName: service.title,
      department: service.portal,
      fee: service.fee,
      timeline: service.timeline,
      fields: fields,
    );

    formProvider.registerForm(meta);
  }

  @override
  void dispose() {
    // Unregister form when unmounting
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        Provider.of<FormProvider>(context, listen: false).unregisterForm();
      }
    });
    super.dispose();
  }

  void _handleSubmit() {
    final formProvider = Provider.of<FormProvider>(context, listen: false);
    if (formProvider.completionScore < 70) return;

    setState(() {
      _isSubmitted = true;
      _generatedAppId = 'APP-2026-${(1000 + (DateTime.now().millisecond * 7) % 8999)}';
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final formProvider = Provider.of<FormProvider>(context);
    final chatProvider = Provider.of<ChatProvider>(context, listen: false);

    if (_isSubmitted) {
      // POST-SUBMISSION SUCCESS SCREEN
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: const BoxDecoration(
                    color: AppColors.secondaryLight,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check_circle, color: AppColors.secondary, size: 64),
                ),
                const SizedBox(height: AppSpacing.lg),
                Text('Application Submitted Successfully!', style: theme.textTheme.headlineMedium, textAlign: TextAlign.center),
                const SizedBox(height: AppSpacing.sm),
                Text('Your official Application Reference ID is:', style: theme.textTheme.bodyMedium),
                const SizedBox(height: AppSpacing.xs),
                SelectableText(
                  _generatedAppId,
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.primary),
                ),
                const SizedBox(height: AppSpacing.lg),
                Container(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Service:'),
                          Text(formProvider.formMeta?.serviceName ?? 'Government Service', style: const TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Status:'),
                          const Text('Under Review (90%)', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Estimated Completion:'),
                          Text(formProvider.formMeta?.timeline ?? '7-15 days'),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),
                ElevatedButton(
                  onPressed: widget.onBack,
                  child: const Text('Return to Services'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final meta = formProvider.formMeta;
    if (meta == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: widget.onBack,
        ),
        title: Text(meta.title),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // FORM HEADER INFO
            Card(
              color: AppColors.primaryLight,
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(meta.serviceName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primaryDark)),
                          const SizedBox(height: 4),
                          Text('Department: ${meta.department} • Fee: ${meta.fee} • Timeline: ${meta.timeline}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: AppSpacing.md),

            // AI AGENT GRADIENT BANNER
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.primaryLight, AppColors.secondaryLight],
                ),
                borderRadius: BorderRadius.circular(AppRadius.lg),
                border: Border.all(color: AppColors.primary.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: const BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.smart_toy, color: Colors.white, size: 20),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('🤖 Gemma 4 AI Agent is ready to help!', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.primaryDark)),
                            Text('Click the floating chat icon (bottom-right) and tell Gemma 4 your details — it\'ll auto-fill this form for you.', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  const Text('Example prompts to try in AI chat:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: [
                      _promptChip('"My name is Rahul Kumar, father Suresh Kumar"', chatProvider, formProvider),
                      _promptChip('"I live in Sector 14, Gurugram, Haryana 122001"', chatProvider, formProvider),
                      _promptChip('"Aadhaar 1234 5678 9012, phone 9876543210"', chatProvider, formProvider),
                      _promptChip('"I\'m a software engineer, annual income 5 lakh"', chatProvider, formProvider),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.lg),

            // PROGRESS & REQUIRED FIELDS CHECKLIST CARD
            Card(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Row(
                  children: [
                    ProgressRing(percentage: formProvider.completionScore, size: 80, strokeWidth: 8),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Form Completion Status', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          const SizedBox(height: 4),
                          Text(
                            formProvider.completionScore >= 70
                                ? '✅ Ready to submit! (>=70% required)'
                                : '⚠️ Fill at least 70% to enable submission.',
                            style: TextStyle(
                              fontSize: 12,
                              color: formProvider.completionScore >= 70 ? AppColors.secondary : AppColors.warning,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: AppSpacing.xs),

                          // STATUS LEGEND
                          const Row(
                            children: [
                              Icon(Icons.auto_awesome, color: AppColors.secondary, size: 14),
                              Text(' AI Filled  ', style: TextStyle(fontSize: 11, color: AppColors.secondary, fontWeight: FontWeight.bold)),
                              Icon(Icons.check_circle, color: AppColors.primary, size: 14),
                              Text(' Manual  ', style: TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.bold)),
                              Icon(Icons.error_outline, color: AppColors.danger, size: 14),
                              Text(' Missing', style: TextStyle(fontSize: 11, color: AppColors.danger, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: AppSpacing.lg),

            // DYNAMIC FORM FIELDS
            Text('Application Form Fields', style: theme.textTheme.titleLarge),
            const SizedBox(height: AppSpacing.sm),

            ...formProvider.fields.values.map((field) => _buildFormField(field, formProvider)),

            const SizedBox(height: AppSpacing.xl),

            // ACTION BUTTONS
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: formProvider.completionScore >= 70 ? _handleSubmit : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: formProvider.completionScore >= 70 ? AppColors.primary : Colors.grey,
                      minimumSize: const Size(double.infinity, 50),
                    ),
                    child: Text('Submit Application (${formProvider.completionScore}%)'),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                OutlinedButton(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Draft saved successfully!')),
                    );
                  },
                  child: const Text('Save Draft'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _promptChip(String text, ChatProvider chatProvider, FormProvider formProvider) {
    return ActionChip(
      label: Text(text, style: const TextStyle(fontSize: 11, color: AppColors.primaryDark)),
      backgroundColor: Colors.white,
      side: BorderSide.none,
      onPressed: () {
        chatProvider.openChat();
        chatProvider.sendMessage(text.replaceAll('"', ''), formProvider);
      },
    );
  }

  Widget _buildFormField(FormFieldData field, FormProvider formProvider) {
    final isAiFilled = field.status == 'filled';
    final isManualFilled = field.status == 'manual';
    final isMissing = field.required && field.value.trim().isEmpty;

    Color borderColor = AppColors.border;
    Color fillColor = AppColors.background;
    Widget? statusIcon;

    if (isAiFilled) {
      borderColor = AppColors.secondary;
      fillColor = AppColors.secondaryLight.withOpacity(0.5);
      statusIcon = const Icon(Icons.auto_awesome, color: AppColors.secondary, size: 18);
    } else if (isManualFilled) {
      borderColor = AppColors.primary;
      fillColor = AppColors.primaryLight.withOpacity(0.5);
      statusIcon = const Icon(Icons.check_circle, color: AppColors.primary, size: 18);
    } else if (isMissing) {
      borderColor = AppColors.danger.withOpacity(0.5);
      statusIcon = const Icon(Icons.error_outline, color: AppColors.danger, size: 18);
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                field.label,
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
              ),
              if (field.required)
                const Text(' *', style: TextStyle(color: AppColors.danger, fontWeight: FontWeight.bold)),
              const Spacer(),
              if (statusIcon != null) statusIcon,
            ],
          ),
          const SizedBox(height: 6),
          if (field.type == 'select')
            DropdownButtonFormField<String>(
              initialValue: field.options!.contains(field.value) ? field.value : null,
              decoration: _inputDecoration(fillColor, borderColor),
              items: field.options!
                  .map((opt) => DropdownMenuItem(value: opt, child: Text(opt)))
                  .toList(),
              onChanged: (val) {
                if (val != null) formProvider.updateFieldManually(field.name, val);
              },
            )
          else
            TextFormField(
              initialValue: field.value,
              key: ValueKey('${field.name}_${field.value}'),
              keyboardType: field.type == 'tel' ? TextInputType.phone : TextInputType.text,
              maxLines: field.type == 'textarea' ? 3 : 1,
              decoration: _inputDecoration(fillColor, borderColor),
              onChanged: (val) => formProvider.updateFieldManually(field.name, val),
            ),
          if (isAiFilled)
            Padding(
              padding: const EdgeInsets.only(top: 4, left: 4),
              child: Text(
                'Source: ${field.source} • Verified',
                style: const TextStyle(fontSize: 11, color: AppColors.secondary, fontWeight: FontWeight.w600),
              ),
            ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(Color fillColor, Color borderColor) {
    return InputDecoration(
      filled: true,
      fillColor: fillColor,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: BorderSide(color: borderColor, width: 1.5),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide: const BorderSide(color: AppColors.primary, width: 2),
      ),
    );
  }
}
