// Detects form controls and normalizes them for mapping

class FormDetector {
    constructor() {}

    detectForms() {
        const fields = [];
        const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea');

        inputs.forEach((input, index) => {
            // Find associated label
            let labelText = "";
            
            // 1. Check aria-label
            if (input.getAttribute("aria-label")) {
                labelText = input.getAttribute("aria-label");
            }

            // 2. Check for explicit <label for="id">
            if (!labelText && input.id) {
                const label = document.querySelector(`label[for="${input.id}"]`);
                if (label) labelText = label.innerText;
            }

            // 3. Check for implicit <label><input></label>
            if (!labelText && input.closest('label')) {
                const label = input.closest('label').cloneNode(true);
                const inputInLabel = label.querySelector('input, select, textarea');
                if (inputInLabel) inputInLabel.remove();
                labelText = label.innerText;
            }
            
            // 4. Fallback to placeholder or name
            if (!labelText) {
                labelText = input.placeholder || input.name || "";
            }

            // Look for surrounding text context if label is still weak
            let contextText = "";
            const parentDiv = input.closest('div, tr, li');
            if (parentDiv) {
                contextText = parentDiv.innerText.replace(/\n/g, ' ').trim();
            }

            fields.push({
                element: input,
                field_id: input.id || `field_${index}`,
                element_type: input.tagName.toLowerCase(),
                input_type: input.type || "text",
                label: labelText.trim(),
                name: input.name || "",
                placeholder: input.placeholder || "",
                context: contextText,
                required: input.required || false
            });
        });

        return fields;
    }
}

window.formDetector = new FormDetector();
