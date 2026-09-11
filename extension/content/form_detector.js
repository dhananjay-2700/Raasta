// Detects form controls and normalizes them for mapping

class FormDetector {
    constructor() {}

    detectForms() {
        const fields = [];
        const inputs = document.querySelectorAll(
            'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), select, textarea'
        );

        inputs.forEach((input, index) => {
            let labelText = '';
            const ariaLabel = input.getAttribute('aria-label') || '';
            
            // 1. Check aria-label
            if (ariaLabel) {
                labelText = ariaLabel;
            }

            // 2
            const ariaLabelledBy = input.getAttribute('aria-labelledby');
            if (!labelText && ariaLabelledBy) {
                const labelEl = document.getElementById(ariaLabelledBy);
                if (labelEl) labelText = labelEl.innerText;
            }

            // 3. Check for explicit <label for="id">
            if (!labelText && input.id) {
                const label = document.querySelector('label[for="' + input.id + '"]');
                if (label) labelText = label.innerText;
            }

            // 4. Check for implicit <label><input></label>
            if (!labelText && input.closest('label')) {
                const label = input.closest('label').cloneNode(true);
                const inputInLabel = label.querySelector('input, select, textarea');
                if (inputInLabel) inputInLabel.remove();
                labelText = label.innerText;
            }

            // 5. Check enclosing fieldset legend
            let fieldsetLegend = '';
            const fieldset = input.closest('fieldset');
            if (fieldset && fieldset.querySelector) {
                const legend = fieldset.querySelector('legend');
                if (legend) fieldsetLegend = legend.innerText.trim();
            }
            
            // 6. Fallback to placeholder or name
            if (!labelText) {
                labelText = input.placeholder || input.name || '';
            }

            // 7. Look for surrounding text context (e.g. table cells, form rows)
            let contextText = '';
            const parentDiv = input.closest('.form-group, div, tr, li');
            if (parentDiv) {
                contextText = parentDiv.innerText.replace(/\s+/g, ' ').trim();
            }

            // Clean up label: remove trailing * and :
            const cleanLabel = labelText.replace(/[\*\\:]/g, '').trim();

            fields.push({
                element: input,
                field_id: input.id || ('field_' + index),
                element_type: input.tagName.toLowerCase(),
                input_type: input.type || 'text',
                label: cleanLabel || input.name || ('Field ' + (index + 1)),
                name: input.name || '',
                placeholder: input.placeholder || '',
                aria_label: ariaLabel,
                fieldset_legend: fieldsetLegend,
                context: contextText,
                required: input.required || input.hasAttribute('aria-required') || labelText.includes('*')
            });
        });

        return fields;
    }
}

window.formDetector = new FormDetector();
