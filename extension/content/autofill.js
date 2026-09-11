// Handles safe injection of values into the DOM

class AutofillEngine {
    constructor() {}

    async fill(approvedMappings) {
        let successCount = 0;

        for (const mapping of approvedMappings) {
            const el = mapping.dom_field.element;
            const val = mapping.value;

            try {
                // Focus the element
                el.focus();

                // Set value based on type
                if (el.tagName.toLowerCase() === 'select') {
                    // Try to find matching option text
                    let optionFound = false;
                    for (const option of el.options) {
                        if (option.text.toLowerCase().includes(val.toString().toLowerCase()) || 
                            option.value.toLowerCase() === val.toString().toLowerCase()) {
                            el.value = option.value;
                            optionFound = true;
                            break;
                        }
                    }
                    if (!optionFound) el.value = val;
                } else if (el.type === 'checkbox' || el.type === 'radio') {
                    if (val === true || val.toString().toLowerCase() === 'true' || val.toString().toLowerCase() === 'yes') {
                        el.checked = true;
                    } else {
                        el.checked = false;
                    }
                } else {
                    el.value = val;
                }

                // Dispatch native events to trigger React/Vue listeners
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                el.blur();

                // Verification step
                if (el.value || el.checked) {
                    successCount++;
                    // Optional visual highlight
                    el.style.border = "2px solid #28a745";
                    el.style.backgroundColor = "#e8f5e9";
                }
            } catch (e) {
                console.error("Autofill failed for field:", mapping.raasta_field, e);
            }
        }

        return {
            success_count: successCount,
            total_attempted: approvedMappings.length
        };
    }
}

window.autofillEngine = new AutofillEngine();
