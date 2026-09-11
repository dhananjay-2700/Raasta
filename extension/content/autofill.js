// Handles safe injection of values into the DOM

class AutofillEngine {
    constructor() {}

    async fillField(mapping) {
        if (!mapping || !mapping.dom_field || !mapping.dom_field.element) {
            return false;
        }

        const el = mapping.dom_field.element;
        let val = mapping.value;

        try {
            // Scroll into view gently and focus
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();

            // Format appropriately based on input type
            if (el.tagName.toLowerCase() === 'select') {
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
            } else if (el.type === 'date') {
                // Ensure YYYY-MM-DD
                let dateStr = val.toString().trim();
                if (dateStr.includes('/')) {
                    const parts = dateStr.split('/');
                    if (parts.length === 3 && parts[2].length === 4) {
                        dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                    }
                }
                el.value = dateStr;
            } else if (el.type === 'number') {
                // Strip currency or text if input expects numeric
                const cleanNum = val.toString().replace(/[^0-9.]/g, '');
                el.value = cleanNum || val;
            } else {
                el.value = val;
            }

            // React 16+ controlled component compatibility
            const tracker = el._valueTracker;
            if (tracker) {
                tracker.setValue(val);
            }

            // Dispatch native input/change events with bubbling
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            el.blur();

            // Verification check
            const isFilled = el.value || el.checked;
            if (isFilled) {
                el.style.transition = "border 0.3s, background-color 0.3s";
                el.style.border = "2px solid #28a745";
                el.style.backgroundColor = "#e8f5e9";
                return true;
            }
            return false;
        } catch (e) {
            console.error("[RAASTA Autofill] Failed to fill field:", mapping.raasta_field, e);
            return false;
        }
    }

    async fill(approvedMappings) {
        let successCount = 0;

        for (const mapping of approvedMappings) {
            const ok = await this.fillField(mapping);
            if (ok) successCount++;
        }

        return {
            success_count: successCount,
            total_attempted: approvedMappings.length
        };
    }
}

window.autofillEngine = new AutofillEngine();
