// Main Orchestrator for RAASTA Browser Extension: Batch Form Reading, Smart ID Suggestions & Automated Document Autofill

class RaastaExtensionController {
    constructor() {
        this.journey = null;
        this.detectedFields = [];
        this.knownFields = [];
        this.missingFields = [];
        this.suggestedDocs = [];
        this.uploadedDocs = [];
        this.citizenData = {};
        this.autofilledCount = 0;

        this.init();
    }

    init() {
        document.addEventListener("raasta:panel_opened", () => this.handlePanelOpened());
    }

    async handlePanelOpened() {
        try {
            window.raastaUI.updateContent(`
                <div style="text-align: center; padding: 24px; color: #4a5568;">
                    <div style="font-size: 28px; margin-bottom: 8px;">🛣️</div>
                    <div style="font-weight: 600; color: #003366;">Scanning form fields...</div>
                    <div style="font-size: 12px; color: #718096; margin-top: 4px;">Connecting to RAASTA Journey Engine</div>
                </div>
            `);

            this.journey = await window.raastaClient.getActiveJourney();

            if (!this.journey) {
                window.raastaUI.updateContent(`
                    <div style="text-align: center; padding: 20px;">
                        <p style="font-weight: 600; color: #e53e3e;">No active RAASTA application journey found.</p>
                        <p style="font-size: 13px; color: #6c757d; line-height: 1.5;">Please select a scheme on the RAASTA web app first, or navigate to a government form.</p>
                    </div>
                `);
                return;
            }

            // Initialize citizen data from active journey
            this.citizenData = Object.assign({}, this.journey.citizen_data || {});

            // 1. READ ALL FORM FIELDS AT ONCE
            this.detectedFields = window.formDetector.detectForms();
            if (this.detectedFields.length === 0) {
                window.raastaUI.updateContent(`
                    <div style="margin-bottom: 12px; font-weight: bold; color: #003366; font-size: 15px;">
                        🏛️ ${this.journey.scheme_name}
                    </div>
                    <div style="padding: 16px; background: #fffaf0; border-radius: 8px; border: 1px solid #feebc8; font-size: 13px; color: #7b341e;">
                        No recognizable form inputs or controls found on this page.
                    </div>
                `);
                return;
            }

            // 2. SUGGEST GOVERNMENT IDS BASED ON ALL DETECTED FIELDS
            this.suggestedDocs = window.fieldMapper.suggestDocuments(this.detectedFields);

            // 3. RE-PARTITION FIELDS
            this.updatePartition();

            // 4. RENDER DASHBOARD
            this.renderMainView();

        } catch (e) {
            console.error("[RAASTA Content] Initialization error:", e);
            window.raastaUI.updateContent(`<p style="color:red; padding: 16px;">Failed to scan page controls. Please try again.</p>`);
        }
    }

    updatePartition() {
        const partitioned = window.fieldMapper.partitionFields(
            this.detectedFields,
            this.citizenData
        );
        this.knownFields = partitioned.known;
        this.missingFields = partitioned.missing;
    }

    renderMainView() {
        this.updatePartition();

        let html = `
            <!-- Scheme Header -->
            <div style="margin-bottom: 14px; border-bottom: 1px solid #edf2f7; padding-bottom: 10px;">
                <div style="font-weight: 800; color: #003366; font-size: 16px; display: flex; align-items: center; gap: 6px;">
                    <span>🏛️</span>
                    <span>${this.journey.scheme_name}</span>
                </div>
                <div style="font-size: 12px; color: #4a5568; margin-top: 4px; display: flex; justify-content: space-between; align-items: center;">
                    <span>All <strong>${this.detectedFields.length}</strong> fields scanned at once</span>
                    <span class="raasta-badge ${this.missingFields.length === 0 ? 'raasta-badge-known' : 'raasta-badge-missing'}">
                        ${this.knownFields.length} of ${this.detectedFields.length} ready
                    </span>
                </div>
            </div>
        `;

        // 1. BATCH FORM READ SUMMARY (ALL AT ONCE)
        html += `
            <div class="raasta-section-title">
                <span>All Detected Fields (${this.detectedFields.length})</span>
                <span style="font-size: 11px; text-transform: none; color: #3182ce; cursor: pointer;" id="raasta-toggle-fields-btn">Hide List ▴</span>
            </div>
            <div id="raasta-all-fields-list" class="raasta-fields-summary-grid">
        `;

        this.detectedFields.forEach(f => {
            const mapped = window.fieldMapper.matchField(f);
            const isKnown = mapped && this.citizenData[mapped.raasta_field];
            html += `
                <div class="raasta-field-chip ${isKnown ? 'chip-known' : 'chip-missing'}">
                    <span class="chip-icon">${isKnown ? '✓' : '○'}</span>
                    <span class="chip-label" title="${f.label}">${f.label}</span>
                </div>
            `;
        });

        html += `</div>`;

        // 2. SUGGESTED GOVERNMENT IDS ACCORDING TO FORM FIELDS
        if (this.suggestedDocs.length > 0) {
            html += `
                <div class="raasta-section-title" style="margin-top: 16px;">
                    <span>Suggested Government IDs</span>
                    <span class="raasta-badge" style="background:#e0f2fe; color:#0369a1;">Smart Recommendations</span>
                </div>
                <div class="raasta-doc-suggestions-container">
            `;

            this.suggestedDocs.forEach(doc => {
                const isUploaded = this.uploadedDocs.some(d => d.type === doc.name || d.type === doc.id);
                html += `
                    <div class="raasta-doc-card ${isUploaded ? 'doc-card-uploaded' : ''}">
                        <div class="raasta-doc-header">
                            <span class="raasta-doc-icon">${doc.icon}</span>
                            <div class="raasta-doc-info">
                                <div class="raasta-doc-title">${doc.name}</div>
                                <div class="raasta-doc-desc">${doc.description}</div>
                            </div>
                            <span class="raasta-doc-badge badge-${doc.badge_type}">${isUploaded ? '✓ Uploaded' : doc.badge}</span>
                        </div>
                        <div class="raasta-doc-actions">
                            <button class="raasta-btn-doc-quick" data-doc-type="${doc.id}">
                                ${isUploaded ? 'Re-upload ' + doc.name : '⚡ Upload ' + doc.name}
                            </button>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        }

        // 3. UPLOAD FILES OPTION
        html += `
            <div class="raasta-section-title" style="margin-top: 18px;">
                <span>Upload Government IDs / Documents</span>
                <span class="raasta-badge raasta-badge-known">Automatic OCR</span>
            </div>

            <div class="raasta-upload-zone" id="raasta-drop-zone">
                <input type="file" id="raasta-file-input" accept=".pdf,.png,.jpg,.jpeg" style="display: none;" />
                <div style="font-size: 30px; margin-bottom: 6px;">📂</div>
                <div style="font-size: 13px; font-weight: 600; color: #2d3748;">
                    Click to browse or drop your Government ID here
                </div>
                <div style="font-size: 11px; color: #718096; margin-top: 3px;">
                    Supports Aadhaar, PAN, Income Certificate, Photo (PDF, JPG, PNG)
                </div>
                <button id="raasta-browse-btn" class="raasta-btn raasta-btn-primary" style="margin-top: 10px; width: auto; padding: 7px 18px;">
                    📁 Choose File to Upload
                </button>
            </div>
        `;

        // 4. EXTRACTED DETAILS & ONE-CLICK AUTOFILL
        if (this.knownFields.length > 0) {
            html += `
                <div class="raasta-section-title" style="margin-top: 18px;">
                    <span>Extracted Verified Details (${this.knownFields.length} Ready to Fill)</span>
                </div>
                <div class="raasta-extracted-list">
            `;

            this.knownFields.forEach(f => {
                html += `
                    <div class="raasta-mapping-item">
                        <div class="raasta-field-title">✓ ${f.display_name}</div>
                        <div class="raasta-field-value">${f.value}</div>
                        <div class="raasta-field-source">Source: ${f.source}</div>
                    </div>
                `;
            });

            html += `
                </div>
                <button id="raasta-autofill-all-btn" class="raasta-btn raasta-btn-success" style="width: 100%; margin-top: 14px; padding: 12px; font-size: 14px;">
                    ⚡ Autofill All Details from IDs (${this.knownFields.length} Fields)
                </button>
            `;
        }

        if (this.autofilledCount > 0) {
            html += `
                <div id="raasta-status-message" style="margin-top: 14px;">
                    🎉 Successfully autofilled ${this.autofilledCount} fields on this portal!
                </div>
            `;
        }

        window.raastaUI.updateContent(html);
        this.bindEvents();
    }

    bindEvents() {
        // Toggle fields list
        const toggleBtn = document.getElementById("raasta-toggle-fields-btn");
        const fieldsList = document.getElementById("raasta-all-fields-list");
        if (toggleBtn && fieldsList) {
            toggleBtn.addEventListener("click", () => {
                if (fieldsList.style.display === "none") {
                    fieldsList.style.display = "flex";
                    toggleBtn.innerText = "Hide List ▴";
                } else {
                    fieldsList.style.display = "none";
                    toggleBtn.innerText = "Show List ▾";
                }
            });
        }

        // Browse File Button & Hidden Input
        const browseBtn = document.getElementById("raasta-browse-btn");
        const fileInput = document.getElementById("raasta-file-input");
        const dropZone = document.getElementById("raasta-drop-zone");

        if (browseBtn && fileInput) {
            browseBtn.addEventListener("click", () => fileInput.click());
            fileInput.addEventListener("change", (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    this.handleFileSelected(e.target.files[0]);
                }
            });
        }

        // Drag & Drop
        if (dropZone) {
            dropZone.addEventListener("dragover", (e) => {
                e.preventDefault();
                dropZone.style.borderColor = "#3182ce";
                dropZone.style.backgroundColor = "#ebf8ff";
            });
            dropZone.addEventListener("dragleave", () => {
                dropZone.style.borderColor = "#cbd5e0";
                dropZone.style.backgroundColor = "#f7fafc";
            });
            dropZone.addEventListener("drop", (e) => {
                e.preventDefault();
                dropZone.style.borderColor = "#cbd5e0";
                dropZone.style.backgroundColor = "#f7fafc";
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    this.handleFileSelected(e.dataTransfer.files[0]);
                }
            });
        }

        // Quick Document Buttons
        const quickBtns = document.querySelectorAll(".raasta-btn-doc-quick");
        quickBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const docType = btn.getAttribute("data-doc-type");
                this.handleSampleDocUpload(docType);
            });
        });

        // Autofill All Button
        const autofillBtn = document.getElementById("raasta-autofill-all-btn");
        if (autofillBtn) {
            autofillBtn.addEventListener("click", async () => {
                autofillBtn.disabled = true;
                autofillBtn.innerText = "Filling form fields...";
                const result = await window.autofillEngine.fill(this.knownFields);
                this.autofilledCount = result.success_count;
                this.renderMainView();
            });
        }
    }

    async handleFileSelected(file) {
        if (!file) return;

        // Show uploading indicator
        window.raastaUI.updateContent(`
            <div style="text-align: center; padding: 30px; color: #4a5568;">
                <div style="font-size: 32px; margin-bottom: 10px;">⏳</div>
                <div style="font-weight: 700; color: #003366; font-size: 15px;">Extracting ${file.name}...</div>
                <div style="font-size: 12px; color: #718096; margin-top: 4px;">RAASTA is reading your government document</div>
            </div>
        `);

        try {
            // Read file as Base64 / Text
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = reader.result;
                const extractionRes = await window.raastaClient.extractDocument("auto", base64, file.name, "");

                this.applyExtractedData(extractionRes, file.name);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error("File read error:", err);
            this.renderMainView();
        }
    }

    async handleSampleDocUpload(docType) {
        window.raastaUI.updateContent(`
            <div style="text-align: center; padding: 30px; color: #4a5568;">
                <div style="font-size: 32px; margin-bottom: 10px;">🔍</div>
                <div style="font-weight: 700; color: #003366; font-size: 15px;">Extracting ${docType.toUpperCase()} Card...</div>
                <div style="font-size: 12px; color: #718096; margin-top: 4px;">Running verified OCR & field mapping</div>
            </div>
        `);

        const extractionRes = await window.raastaClient.extractDocument(docType, "", `${docType}_document.pdf`, "");
        this.applyExtractedData(extractionRes, `${docType}_document.pdf`);
    }

    applyExtractedData(extractionRes, fileName) {
        if (extractionRes && extractionRes.extracted_fields) {
            // Merge extracted facts into citizenData
            for (const [k, v] of Object.entries(extractionRes.extracted_fields)) {
                this.citizenData[k] = v;
            }

            this.uploadedDocs.push({
                type: extractionRes.document_type || "Government ID",
                name: fileName,
                fieldsCount: Object.keys(extractionRes.extracted_fields).length,
                timestamp: Date.now()
            });

            // Automatically fill matching fields on the form
            this.updatePartition();
            window.autofillEngine.fill(this.knownFields).then(res => {
                this.autofilledCount = res.success_count;
                this.renderMainView();
            });
        } else {
            this.renderMainView();
        }
    }
}

window.raastaController = new RaastaExtensionController();
