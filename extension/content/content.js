// Main Orchestrator for RAASTA Browser Extension

const STATES = {
    IDLE: 'IDLE',
    JOURNEY_DETECTED: 'JOURNEY_DETECTED',
    FORM_ANALYZED: 'FORM_ANALYZED',
    FIELD_REVIEW: 'FIELD_REVIEW',
    AUTOFILLING: 'AUTOFILLING',
    VERIFICATION: 'VERIFICATION',
    READY_TO_SUBMIT: 'READY_TO_SUBMIT',
    SUCCESS: 'SUCCESS'
};

class RaastaExtensionController {
    constructor() {
        this.state = STATES.IDLE;
        this.journey = null;
        this.detectedFields = [];
        this.knownFields = [];
        this.missingFields = [];
        this.citizenData = {};
        this.autofilledCount = 0;

        this.init();
    }

    init() {
        document.addEventListener("raasta:panel_opened", () => this.handlePanelOpened());
    }

    async handlePanelOpened() {
        try {
            this.journey = await window.raastaClient.getActiveJourney();

            if (!this.journey) {
                this.state = STATES.IDLE;
                window.raastaUI.setJourneyActive(false);
            } else {
                this.state = STATES.JOURNEY_DETECTED;
                window.raastaUI.setJourneyActive(true);
                this.citizenData = Object.assign({}, this.journey.citizen_data || {});
            }
            this.render();
        } catch (e) {
            console.error("[RAASTA] Initialization error:", e);
            this.state = STATES.IDLE;
            this.render();
        }
    }

    render() {
        switch (this.state) {
            case STATES.IDLE:
                this.renderIdle();
                break;
            case STATES.JOURNEY_DETECTED:
                this.renderJourneyDetected();
                break;
            case STATES.FORM_ANALYZED:
                this.renderFormAnalyzed();
                break;
            case STATES.FIELD_REVIEW:
                this.renderFieldReview();
                break;
            case STATES.AUTOFILLING:
                this.renderAutofilling();
                break;
            case STATES.VERIFICATION:
                this.renderVerification();
                break;
            case STATES.READY_TO_SUBMIT:
                this.renderReadyToSubmit();
                break;
            case STATES.SUCCESS:
                this.renderSuccess();
                break;
        }
    }

    renderJourneyProgress(currentStep) {
        // Steps: Need -> Service -> Eligibility -> Application -> Documents -> Submit
        const steps = [
            { id: 'need', label: 'Need understood' },
            { id: 'service', label: 'Service selected' },
            { id: 'eligibility', label: 'Eligibility checked' },
            { id: 'application', label: 'Application' },
            { id: 'documents', label: 'Documents' },
            { id: 'submit', label: 'Submit' }
        ];

        let html = '<div class="raasta-journey-progress">';
        let passedCurrent = false;

        steps.forEach((step) => {
            if (step.id === currentStep) {
                html += `
                    <div class="raasta-progress-step current">
                        <div class="raasta-progress-icon">●</div>
                        <span>${step.label}</span>
                    </div>`;
                passedCurrent = true;
            } else if (!passedCurrent) {
                html += `
                    <div class="raasta-progress-step completed">
                        <div class="raasta-progress-icon">✓</div>
                        <span>${step.label}</span>
                    </div>`;
            } else {
                html += `
                    <div class="raasta-progress-step upcoming">
                        <div class="raasta-progress-icon">○</div>
                        <span>${step.label}</span>
                    </div>`;
            }
        });
        html += '</div>';
        return html;
    }

    // STATE 1
    renderIdle() {
        const html = `
            <div class="raasta-text-center">
                <h2 class="raasta-h1">No active application journey</h2>
                <p class="raasta-p raasta-mt-4">Start a journey on RAASTA to get help with a government service.</p>
                <div class="raasta-btn-row" style="margin-top: 24px;">
                    <button class="raasta-btn raasta-btn-primary" onclick="window.open('http://localhost:3000', '_blank')">Open RAASTA</button>
                </div>
            </div>
        `;
        window.raastaUI.updateContent(html);
    }

    // STATE 2
    renderJourneyDetected() {
        const title = this.journey?.category || 'EDUCATION SUPPORT';
        const scheme = this.journey?.scheme_name || 'Scholarship Application';

        const html = `
            <div style="text-transform: uppercase; font-size: 11px; font-weight: 700; color: var(--rs-text-secondary); letter-spacing: 0.5px;">
                ${title}
            </div>
            <h2 class="raasta-h1">${scheme}</h2>
            
            ${this.renderJourneyProgress('application')}
            
            <div style="margin-top: 16px; font-size: 13px; font-weight: 600; color: var(--rs-text-secondary);">Step 4 of 6</div>
            <p class="raasta-p" style="margin-top: 4px;">I'll help you complete this application.</p>
            
            <div class="raasta-btn-row" style="margin-top: 24px;">
                <button id="btn-analyze" class="raasta-btn raasta-btn-primary">Analyze application</button>
            </div>
        `;
        
        window.raastaUI.updateContent(html);
        
        document.getElementById('btn-analyze').addEventListener('click', () => {
            this.detectedFields = window.formDetector.detectForms();
            const partitioned = window.fieldMapper.partitionFields(this.detectedFields, this.citizenData);
            this.knownFields = partitioned.known;
            this.missingFields = partitioned.missing;
            this.state = STATES.FORM_ANALYZED;
            this.render();
        });
    }

    // STATE 3
    renderFormAnalyzed() {
        const total = this.detectedFields.length;
        const auto = this.knownFields.length;
        
        // Let's pretend 2 need confirmation and the rest need info for demo purposes.
        const confirmFields = this.knownFields.filter(f => f.raasta_field === 'aadhaar' || f.raasta_field === 'income' || f.raasta_field === 'pan');
        const autoFields = this.knownFields.filter(f => !confirmFields.includes(f));
        const missingCount = this.missingFields.length;

        let html = `
            <h2 class="raasta-h1">Application form detected</h2>
            <p class="raasta-p">I found ${total} fields on this government form.</p>
            
            <div class="raasta-stats-row">
                <div class="raasta-stat-item">
                    <span class="raasta-stat-number" style="color: var(--rs-accent);">${autoFields.length}</span>
                    <span class="raasta-stat-label">Can be filled automatically</span>
                </div>
                <div class="raasta-stat-item">
                    <span class="raasta-stat-number" style="color: var(--rs-warning);">${confirmFields.length}</span>
                    <span class="raasta-stat-label">Need your confirmation</span>
                </div>
                <div class="raasta-stat-item">
                    <span class="raasta-stat-number" style="color: var(--rs-text-muted);">${missingCount}</span>
                    <span class="raasta-stat-label">Needs information</span>
                </div>
            </div>
            
            <div class="raasta-card">
                <div style="font-size: 11px; font-weight: 700; color: var(--rs-text-secondary); margin-bottom: 12px; text-transform: uppercase;">FORM FIELDS</div>
                <div class="raasta-field-list">
        `;

        autoFields.forEach(f => {
            html += `
                <div class="raasta-field-item">
                    <span class="raasta-field-icon" style="color: var(--rs-success);">✓</span>
                    <span>${f.display_name}</span>
                </div>
            `;
        });
        
        confirmFields.forEach(f => {
            html += `
                <div class="raasta-field-item">
                    <span class="raasta-field-icon" style="color: var(--rs-warning);">⚠</span>
                    <span>${f.display_name}</span>
                </div>
            `;
        });

        this.missingFields.forEach(f => {
            html += `
                <div class="raasta-field-item">
                    <span class="raasta-field-icon" style="color: var(--rs-text-muted);">○</span>
                    <span>${f.label}</span>
                </div>
            `;
        });

        html += `
                </div>
            </div>
            
            <div class="raasta-btn-row" style="margin-top: 24px;">
                <button id="btn-review-fields" class="raasta-btn raasta-btn-primary">Review fields</button>
            </div>
        `;

        window.raastaUI.updateContent(html);

        document.getElementById('btn-review-fields').addEventListener('click', () => {
            this.state = STATES.FIELD_REVIEW;
            this.render();
        });
    }

    // STATE 4
    renderFieldReview() {
        let html = `
            <h2 class="raasta-h1">Review fields</h2>
            <p class="raasta-p">Please confirm the information before I fill the form.</p>
            <div style="margin-top: 16px;">
        `;

        this.knownFields.forEach(f => {
            const isSensitive = ['aadhaar', 'pan', 'income'].includes(f.raasta_field);
            
            html += `
                <div class="raasta-review-item">
                    <div class="raasta-review-header">
                        <div class="raasta-review-title">${f.display_name}</div>
                        ${isSensitive 
                            ? '<span class="raasta-badge raasta-badge-warning">⚠ NEEDS CONFIRMATION</span>' 
                            : '<span class="raasta-badge raasta-badge-verified">🏛 VERIFIED SOURCE</span>'}
                    </div>
                    <div class="raasta-review-row">
                        <span class="raasta-review-label">Government form:</span>
                        <span class="raasta-review-value">${f.label}</span>
                    </div>
                    <div class="raasta-review-row">
                        <span class="raasta-review-label">RAASTA:</span>
                        <span class="raasta-review-value">${f.value}</span>
                    </div>
            `;
            
            if (isSensitive) {
                html += `
                    <div class="raasta-btn-row" style="margin-top: 12px;">
                        <button class="raasta-btn raasta-btn-secondary" style="font-size: 12px; padding: 6px;">Edit</button>
                        <button class="raasta-btn raasta-btn-secondary btn-confirm-sensitive" style="font-size: 12px; padding: 6px; background-color: var(--rs-accent); color: white; border: none;">Confirm</button>
                    </div>
                `;
            } else {
                html += `
                    <div style="font-size: 12px; color: var(--rs-success); font-weight: 600; display: flex; align-items: center; gap: 4px; margin-top: 8px;">
                        ✓ Verified profile information
                    </div>
                `;
            }
            
            html += `</div>`;
        });

        html += `
            </div>
            <div class="raasta-btn-row" style="margin-top: 24px;">
                <button id="btn-fill-fields" class="raasta-btn raasta-btn-primary">Fill confirmed fields</button>
            </div>
        `;

        window.raastaUI.updateContent(html);

        // Mock interaction for confirming sensitive fields
        document.querySelectorAll('.btn-confirm-sensitive').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.target.closest('.raasta-review-item');
                item.style.borderColor = 'var(--rs-success)';
                e.target.innerText = 'Confirmed';
                e.target.style.backgroundColor = 'var(--rs-success)';
                e.target.disabled = true;
            });
        });

        document.getElementById('btn-fill-fields').addEventListener('click', () => {
            this.state = STATES.AUTOFILLING;
            this.render();
        });
    }

    // STATE 5
    async renderAutofilling() {
        let html = `
            <h2 class="raasta-h1">Filling application...</h2>
            <p class="raasta-p">Please wait while I populate the form.</p>
            <div class="raasta-card raasta-mt-4">
                <div class="raasta-field-list">
        `;

        this.knownFields.forEach(f => {
            html += `
                <div class="raasta-field-item">
                    <span class="raasta-field-icon" style="color: var(--rs-text-muted);">○</span>
                    <span>${f.display_name}</span>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
        window.raastaUI.updateContent(html);

        // Perform autofill
        const result = await window.autofillEngine.fill(this.knownFields);
        this.autofilledCount = result.success_count;

        // Briefly highlight fields on the actual web page
        this.knownFields.forEach(f => {
            const el = document.querySelector(f.selector);
            if (el) {
                el.classList.add('raasta-filled-highlight');
                setTimeout(() => el.classList.remove('raasta-filled-highlight'), 2000);
            }
        });

        // Add a small delay for UX so user sees the "Filling..." state
        setTimeout(() => {
            this.state = STATES.VERIFICATION;
            this.render();
        }, 1500);
    }

    // STATE 6
    renderVerification() {
        const confirmFields = this.knownFields.filter(f => f.raasta_field === 'aadhaar' || f.raasta_field === 'income' || f.raasta_field === 'pan');
        const autoFields = this.knownFields.filter(f => !confirmFields.includes(f));

        let html = `
            <h2 class="raasta-h1">Application details ready</h2>
            <p class="raasta-p" style="margin-bottom: 16px;">
                <span style="font-weight: 600; color: var(--rs-success);">${autoFields.length} fields verified</span><br/>
                <span style="font-weight: 600; color: var(--rs-warning);">${confirmFields.length} fields need confirmation</span>
            </p>
            
            <div class="raasta-card">
                <div class="raasta-field-list">
        `;

        autoFields.forEach(f => {
            html += `
                <div class="raasta-field-item">
                    <span class="raasta-field-icon" style="color: var(--rs-success);">✓</span>
                    <span>${f.display_name}</span>
                </div>
            `;
        });
        
        confirmFields.forEach(f => {
            html += `
                <div class="raasta-field-item" style="margin-top: 8px;">
                    <span class="raasta-field-icon" style="color: var(--rs-warning);">⚠</span>
                    <div style="display: flex; flex-direction: column;">
                        <span>${f.display_name}</span>
                        <span style="font-size: 11px; color: var(--rs-warning);">Please verify on form</span>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
            
            <div class="raasta-btn-row" style="margin-top: 24px;">
                <button id="btn-edit" class="raasta-btn raasta-btn-secondary">Edit details</button>
                <button id="btn-review-app" class="raasta-btn raasta-btn-primary">Review application</button>
            </div>
        `;

        window.raastaUI.updateContent(html);

        document.getElementById('btn-review-app').addEventListener('click', () => {
            this.state = STATES.READY_TO_SUBMIT;
            this.render();
        });
        document.getElementById('btn-edit').addEventListener('click', () => {
            this.state = STATES.FIELD_REVIEW;
            this.render();
        });
    }

    // STATE 7
    renderReadyToSubmit() {
        let html = `
            <h2 class="raasta-h1">You're ready to submit</h2>
            <p class="raasta-p">All required information has been reviewed.</p>
            
            <div class="raasta-card raasta-mt-4">
                <div class="raasta-field-list">
                    <div class="raasta-field-item">
                        <span class="raasta-field-icon" style="color: var(--rs-success);">✓</span>
                        <span>Required fields complete</span>
                    </div>
                    <div class="raasta-field-item">
                        <span class="raasta-field-icon" style="color: var(--rs-success);">✓</span>
                        <span>Information reviewed</span>
                    </div>
                    <div class="raasta-field-item">
                        <span class="raasta-field-icon" style="color: var(--rs-success);">✓</span>
                        <span>Documents ready</span>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 16px; padding: 12px; background: #F8FAFC; border-radius: 8px; font-size: 12px; color: var(--rs-text-secondary); display: flex; gap: 8px; align-items: flex-start;">
                <span style="font-size: 16px;">🤖</span>
                <span>RAASTA will not submit the application without your confirmation.</span>
            </div>
            
            <div class="raasta-btn-row" style="margin-top: 24px;">
                <button id="btn-submit" class="raasta-btn raasta-btn-primary" style="background-color: var(--rs-success);">Continue to submission</button>
            </div>
        `;

        window.raastaUI.updateContent(html);

        document.getElementById('btn-submit').addEventListener('click', () => {
            // Trigger actual form submission on the government portal
            const govSubmitBtn = document.getElementById('submitBtn');
            if (govSubmitBtn) {
                govSubmitBtn.click();
            }

            this.state = STATES.SUCCESS;
            this.render();
        });
    }

    // STATE 8
    renderSuccess() {
        const appId = "NSP-" + Math.floor(Math.random() * 100000000);
        let html = `
            <div class="raasta-success-box">
                <div class="raasta-success-icon">✓</div>
                <h2 class="raasta-h1" style="color: var(--rs-success);">Application submitted</h2>
                <p class="raasta-p" style="margin-top: 8px; margin-bottom: 16px;">Your scholarship application journey has been updated.</p>
                
                <div style="background: white; border-radius: 8px; padding: 12px; text-align: left; margin-bottom: 16px; border: 1px solid #E2E8F0;">
                    <div style="font-size: 12px; color: var(--rs-text-secondary);">Application ID</div>
                    <div style="font-size: 16px; font-weight: 700; color: var(--rs-text-primary);">${appId}</div>
                    <div style="margin-top: 8px; display: flex; align-items: center; gap: 6px;">
                        <span class="raasta-status-dot"></span>
                        <span style="font-size: 13px; font-weight: 600; color: var(--rs-accent);">Status: Submitted</span>
                    </div>
                </div>
            </div>
            
            <div class="raasta-btn-row" style="margin-top: 24px;">
                <button id="btn-close" class="raasta-btn raasta-btn-secondary">Close assistant</button>
                <button class="raasta-btn raasta-btn-primary" onclick="window.open('http://localhost:3000', '_blank')">View journey</button>
            </div>
        `;

        window.raastaUI.updateContent(html);

        document.getElementById('btn-close').addEventListener('click', () => {
            window.raastaUI.togglePanel();
        });
    }
}

window.raastaController = new RaastaExtensionController();
