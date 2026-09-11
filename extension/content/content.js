// Main Orchestrator for Content Script

document.addEventListener("raasta:panel_opened", async () => {
    try {
        const journey = await window.raastaClient.getActiveJourney();
        
        if (!journey) {
            window.raastaUI.updateContent(`
                <p>No active RAASTA application journey found.</p>
                <p>Please start an application from the official RAASTA website first.</p>
            `);
            return;
        }

        // We have an active journey
        let html = `
            <div style="margin-bottom: 15px; font-weight: bold; color: #0056b3;">
                ${journey.scheme_name}
            </div>
        `;

        // Run detection
        const detectedFields = window.formDetector.detectForms();
        if (detectedFields.length === 0) {
            html += `<p>No recognizable forms found on this page.</p>`;
            window.raastaUI.updateContent(html);
            return;
        }

        // Map fields
        const mappings = window.fieldMapper.mapFields(detectedFields, journey.citizen_data);
        
        if (mappings.length === 0) {
            html += `<p>Found ${detectedFields.length} fields, but couldn't safely match them to your profile.</p>`;
            window.raastaUI.updateContent(html);
            return;
        }

        // Build review UI
        html += `<p>RAASTA found <strong>${mappings.length}</strong> fields it can help fill.</p>`;
        
        mappings.forEach(m => {
            html += `
                <div class="raasta-mapping-item">
                    <div class="raasta-field-title">✓ ${m.dom_field.label || m.dom_field.name}</div>
                    <div class="raasta-field-value">${m.value}</div>
                    <div class="raasta-field-source">Source: RAASTA Profile</div>
                </div>
            `;
        });

        html += `<button id="raasta-autofill-btn">Review & Autofill</button>`;
        html += `<div id="raasta-status-message"></div>`;

        window.raastaUI.updateContent(html);

        // Bind autofill action
        document.getElementById("raasta-autofill-btn").addEventListener("click", async () => {
            const btn = document.getElementById("raasta-autofill-btn");
            btn.disabled = true;
            btn.innerText = "Filling...";
            
            const result = await window.autofillEngine.fill(mappings);
            
            btn.style.display = "none";
            document.getElementById("raasta-status-message").innerText = 
                `✓ ${result.success_count} fields filled successfully. Please review and complete manually.`;
        });

    } catch (e) {
        console.error("RAASTA error:", e);
        window.raastaUI.updateContent(`<p style="color:red">An error occurred while connecting to RAASTA.</p>`);
    }
});
