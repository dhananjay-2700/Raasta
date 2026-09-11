// Maps detected DOM fields to RAASTA canonical fields

class FieldMapper {
    constructor() {
        this.canonicalMappingRules = [
            {
                raasta_field: "full_name",
                keywords: ["full name", "applicant name", "name of applicant", "first name", "name"]
            },
            {
                raasta_field: "annual_income",
                keywords: ["annual family income", "household income", "family's yearly income", "income", "annual income"]
            },
            {
                raasta_field: "state",
                keywords: ["state of residence", "state", "province"]
            },
            {
                raasta_field: "education_level",
                keywords: ["education level", "college", "school", "degree", "qualification"]
            }
        ];
    }

    mapFields(detectedFields, citizenData) {
        const mappings = [];

        detectedFields.forEach(field => {
            let matchedField = null;
            let highestConfidence = 0;

            const searchString = `${field.label} ${field.name} ${field.placeholder} ${field.context}`.toLowerCase();

            // Simple keyword matching heuristic
            this.canonicalMappingRules.forEach(rule => {
                for (const kw of rule.keywords) {
                    if (searchString.includes(kw)) {
                        // We found a potential match. See if citizen data actually has this field.
                        if (citizenData[rule.raasta_field] !== undefined) {
                            matchedField = rule.raasta_field;
                            highestConfidence = 0.85; // Heuristic confidence
                            break;
                        }
                    }
                }
            });

            if (matchedField) {
                const entity = citizenData[matchedField];
                // Handle both flat mock objects and rich pipeline objects
                const val = typeof entity === 'object' && entity !== null && 'value' in entity ? entity.value : entity;
                const source = typeof entity === 'object' && entity !== null && 'source' in entity ? entity.source : "Citizen Profile";
                
                mappings.push({
                    dom_field: field,
                    raasta_field: matchedField,
                    value: val,
                    source: source,
                    confidence: highestConfidence,
                    status: "approved_by_default" // Could be needs_confirmation if low confidence
                });
            }
        });

        return mappings;
    }
}

window.fieldMapper = new FieldMapper();
