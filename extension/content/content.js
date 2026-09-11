// Main Orchestrator for RAASTA Voice-Driven Browser Extension

class RaastaExtensionController {
    constructor() {
        this.journey = null;
        this.detectedFields = [];
        this.knownFields = [];
        this.missingQueue = [];
        this.currentMissingIndex = 0;
        this.currentExtraction = null;
        this.knownFilled = false;

        this.init();
    }

    init() {
        document.addEventListener("raasta:panel_opened", () => this.handlePanelOpened());
    }

    async handlePanelOpened() {
        try {
            window.raastaUI.updateContent(`
                <div style="text-align: center; padding: 20px; color: #6c757d;">
                    <div>🛣️ Connecting to RAASTA...</div>
                </div>
            `);

            this.journey = await window.raastaClient.getActiveJourney();

            if (!this.journey) {
                window.raastaUI.updateContent(`
                    <p>No active RAASTA application journey found.</p>
                    <p style="font-size: 13px; color: #6c757d;">Please select a scheme on the RAASTA web app first, or use the test journey.</p>
                `);
                return;
            }

            // Run Form Detection
            this.detectedFields = window.formDetector.detectForms();
            if (this.detectedFields.length === 0) {
                window.raastaUI.updateContent(`
                    <div style="margin-bottom: 12px; font-weight: bold; color: #003366;">
                        ${this.journey.scheme_name}
                    </div>
                    <p>No recognizable application form controls found on this page.</p>
                `);
                return;
            }

            // Partition fields against citizen data
            const partitioned = window.fieldMapper.partitionFields(
                this.detectedFields,
                this.journey.citizen_data || {}
            );

            this.knownFields = partitioned.known;
            this.missingQueue = partitioned.missing;
            this.currentMissingIndex = 0;
            this.currentExtraction = null;

            this.renderMainView();

            // Speak initial greeting if missing fields exist
            if (this.missingQueue.length > 0) {
                const firstField = this.missingQueue[0];
                const greeting = `I found ${this.detectedFields.length} fields on this form. I already have your ${this.knownFields.map(f => f.display_name).join(' and ')}. ${firstField.question}`;
                window.raastaVoice.speak(greeting);
            }

        } catch (e) {
            console.error("[RAASTA Content] Initialization error:", e);
            window.raastaUI.updateContent(`<p style="color:red">Failed to initialize RAASTA Assistant.</p>`);
        }
    }

    renderMainView() {
        let html = `
            <div style="margin-bottom: 12px; font-weight: bold; color: #003366; font-size: 15px;">
                🏛️ ${this.journey.scheme_name}
            </div>
            <div style="font-size: 13px; color: #4a5568; margin-bottom: 12px;">
                Detected <strong>${this.detectedFields.length}</strong> fields on this page.
            </div>
        `;

        // 1. KNOWN INFORMATION SECTION
        if (this.knownFields.length > 0) {
            html += `
                <div class="raasta-section-title">
                    <span>Known Information (${this.knownFields.length})</span>
                    <span class="raasta-badge raasta-badge-known">From Journey</span>
                </div>
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

            if (!this.knownFilled) {
                html += `
                    <button id="raasta-fill-known-btn" class="raasta-btn raasta-btn-success" style="width: 100%; margin-bottom: 16px;">
                        Autofill Known Details
                    </button>
                `;
            } else {
                html += `
                    <div style="font-size: 12px; color: #2e7d32; font-weight: 600; margin-bottom: 14px;">
                        ✓ Known details populated into form.
                    </div>
                `;
            }
        }

        // 2. MISSING INFORMATION & VOICE ASSISTANT
        if (this.missingQueue.length > 0 && this.currentMissingIndex < this.missingQueue.length) {
            const currentItem = this.missingQueue[this.currentMissingIndex];

            html += `
                <div class="raasta-section-title">
                    <span>Missing Information (${this.missingQueue.length - this.currentMissingIndex} remaining)</span>
                    <span class="raasta-badge raasta-badge-missing">Voice Prompt</span>
                </div>

                <div class="raasta-voice-card">
                    <div class="raasta-voice-header">
                        <span class="raasta-mic-icon">🎙️</span>
                        <span class="raasta-voice-status" id="raasta-voice-status">RAASTA Voice Agent</span>
                    </div>

                    <div class="raasta-voice-question" id="raasta-current-question">
                        "${currentItem.question}"
                    </div>

                    <div class="raasta-transcript-box" id="raasta-transcript-box">
                        Press button and speak your answer...
                    </div>

                    <div id="raasta-voice-action-container">
                        <button id="raasta-mic-btn" class="raasta-btn-mic">
                            🎙️ Start Speaking
                        </button>
                    </div>

                    <div id="raasta-confirmation-container" style="display: none;"></div>
                </div>
            `;
        } else if (this.missingQueue.length > 0 && this.currentMissingIndex >= this.missingQueue.length) {
            html += `
                <div id="raasta-status-message">
                    🎉 All missing fields have been collected and filled!
                </div>
                <p style="font-size: 12px; color: #4a5568; margin-top: 10px; text-align: center;">
                    Please manually review all details before submitting the official application.
                </p>
            `;
        } else {
            html += `
                <div id="raasta-status-message">
                    ✓ All detected fields already match your verified journey facts.
                </div>
            `;
        }

        window.raastaUI.updateContent(html);
        this.bindEvents();
    }

    bindEvents() {
        // Autofill Known Button
        const fillKnownBtn = document.getElementById("raasta-fill-known-btn");
        if (fillKnownBtn) {
            fillKnownBtn.addEventListener("click", async () => {
                fillKnownBtn.disabled = true;
                fillKnownBtn.innerText = "Filling...";
                await window.autofillEngine.fill(this.knownFields);
                this.knownFilled = true;
                this.renderMainView();
            });
        }

        // Voice Assistant Mic Button
        const micBtn = document.getElementById("raasta-mic-btn");
        if (micBtn) {
            micBtn.addEventListener("click", () => this.handleMicToggle());
        }
    }

    handleMicToggle() {
        const micBtn = document.getElementById("raasta-mic-btn");
        const transcriptBox = document.getElementById("raasta-transcript-box");
        const statusText = document.getElementById("raasta-voice-status");

        if (window.raastaVoice.isListening) {
            window.raastaVoice.stopListening();
            micBtn.classList.remove("listening");
            micBtn.innerText = "🎙️ Start Speaking";
            if (statusText) statusText.innerText = "Stopped";
            return;
        }

        micBtn.classList.add("listening");
        micBtn.innerText = "🔴 Listening... (Speak now)";
        if (statusText) statusText.innerText = "Listening...";
        if (transcriptBox) transcriptBox.innerText = "Listening to your voice...";

        window.raastaVoice.startListening({
            onInterim: (text) => {
                if (transcriptBox) {
                    transcriptBox.innerText = `"${text}"`;
                }
            },
            onComplete: async (finalTranscript) => {
                micBtn.classList.remove("listening");
                micBtn.innerText = "🎙️ Start Speaking";
                if (statusText) statusText.innerText = "Extracting answer...";
                if (transcriptBox) {
                    transcriptBox.innerText = `You said: "${finalTranscript}"`;
                }

                await this.processVoiceAnswer(finalTranscript);
            },
            onError: (err) => {
                micBtn.classList.remove("listening");
                micBtn.innerText = "🎙️ Start Speaking";
                if (statusText) statusText.innerText = "Error listening";
                if (transcriptBox) {
                    transcriptBox.innerText = `Microphone error: ${err}. Please click and try again.`;
                }
            }
        });
    }

    async processVoiceAnswer(transcript) {
        const currentItem = this.missingQueue[this.currentMissingIndex];
        const statusText = document.getElementById("raasta-voice-status");
        const confirmContainer = document.getElementById("raasta-confirmation-container");
        const actionContainer = document.getElementById("raasta-voice-action-container");

        // Send to RAASTA extraction endpoint
        const extraction = await window.raastaClient.extractFieldValue(currentItem.raasta_field, transcript);
        this.currentExtraction = extraction;

        if (statusText) statusText.innerText = "Awaiting Confirmation";
        if (actionContainer) actionContainer.style.display = "none";

        // Render Confirmation Box
        if (confirmContainer) {
            confirmContainer.style.display = "block";
            confirmContainer.innerHTML = `
                <div class="raasta-confirmation-box">
                    <div class="raasta-confirmation-label">RAASTA understood:</div>
                    <div class="raasta-confirmation-value">${currentItem.display_name}: ${extraction.value}</div>
                    <div style="font-size: 11px; color: #718096; margin-top: 3px;">Confidence: ${Math.round(extraction.confidence * 100)}%</div>
                </div>
                <div class="raasta-btn-row">
                    <button id="raasta-confirm-use-btn" class="raasta-btn raasta-btn-success">Use This</button>
                    <button id="raasta-confirm-retry-btn" class="raasta-btn raasta-btn-secondary">Speak Again</button>
                </div>
            `;

            document.getElementById("raasta-confirm-use-btn").addEventListener("click", () => this.handleConfirmUse());
            document.getElementById("raasta-confirm-retry-btn").addEventListener("click", () => this.handleConfirmRetry());

            // Voice confirm
            window.raastaVoice.speak(`I heard ${currentItem.display_name} as ${extraction.value}. Should I use this?`);
        }
    }

    async handleConfirmUse() {
        const currentItem = this.missingQueue[this.currentMissingIndex];
        const mappingToFill = {
            dom_field: currentItem.dom_field,
            raasta_field: currentItem.raasta_field,
            value: this.currentExtraction.value
        };

        // Fill the specific field in DOM
        await window.autofillEngine.fillField(mappingToFill);

        // Move to next field in queue
        this.currentMissingIndex++;
        this.currentExtraction = null;

        this.renderMainView();

        // If there's another missing field, ask next question
        if (this.currentMissingIndex < this.missingQueue.length) {
            const nextItem = this.missingQueue[this.currentMissingIndex];
            setTimeout(() => {
                window.raastaVoice.speak(nextItem.question);
            }, 400);
        } else {
            // Done!
            setTimeout(() => {
                window.raastaVoice.speak("I have filled all verified information. Please review the application before submitting.");
            }, 400);
        }
    }

    handleConfirmRetry() {
        this.currentExtraction = null;
        this.renderMainView();
        const currentItem = this.missingQueue[this.currentMissingIndex];
        window.raastaVoice.speak(currentItem.question);
    }
}

window.raastaController = new RaastaExtensionController();
