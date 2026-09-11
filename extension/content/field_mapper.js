// Maps detected DOM fields to RAASTA canonical fields

class FieldMapper {
    constructor() {
        this.canonicalRules = [
            {
                raasta_field: "full_name",
                display_name: "Full Name",
                question: "What is your full name?",
                keywords: ["full name", "applicant name", "name of applicant", "candidate name", "first name", "नाम", "applicant's name"],
                base_confidence: 0.95
            },
            {
                raasta_field: "date_of_birth",
                display_name: "Date of Birth",
                question: "What is your date of birth?",
                keywords: ["date of birth", "dob", "birth date", "birthdate", "जन्म तिथि", "जन्म तारीख"],
                base_confidence: 0.96
            },
            {
                raasta_field: "age",
                display_name: "Age",
                question: "What is your age in years?",
                keywords: ["age", "उम्र", "years old"],
                base_confidence: 0.92
            },
            {
                raasta_field: "gender",
                display_name: "Gender",
                question: "What is your gender?",
                keywords: ["gender", "sex", "लिंग"],
                base_confidence: 0.95
            },
            {
                raasta_field: "state",
                display_name: "State",
                question: "What state do you reside in?",
                keywords: ["state of residence", "state domicile", "domicile state", "state", "राज्य", "province"],
                base_confidence: 0.94
            },
            {
                raasta_field: "district",
                display_name: "District",
                question: "Which district do you reside in?",
                keywords: ["district", "जिला", "county", "city/district", "home district"],
                base_confidence: 0.94
            },
            {
                raasta_field: "annual_income",
                display_name: "Annual Family Income",
                question: "What is your total annual family income?",
                keywords: ["annual family income", "household income", "family's yearly income", "वार्षिक पारिवारिक आय", "family income", "annual income", "yearly income", "total annual income", "total family income"],
                base_confidence: 0.95
            },
            {
                raasta_field: "college_name",
                display_name: "College Name",
                question: "What is the name of your college or institution?",
                keywords: ["college name", "institution", "college", "school name", "university", "कॉलेज", "institute", "name of institution"],
                base_confidence: 0.93
            },
            {
                raasta_field: "education_level",
                display_name: "Education Level",
                question: "What is your current education level?",
                keywords: ["education level", "current education", "qualification", "degree", "शिक्षा", "class"],
                base_confidence: 0.90
            },
            {
                raasta_field: "mobile_number",
                display_name: "Mobile Number",
                question: "What is your 10-digit mobile number?",
                keywords: ["mobile number", "phone number", "contact number", "mobile", "फोन", "मोबाइल", "phone"],
                base_confidence: 0.95
            },
            {
                raasta_field: "address",
                display_name: "Residential Address",
                question: "What is your residential address?",
                keywords: ["residential address", "permanent address", "address", "पता", "street address", "residence"],
                base_confidence: 0.90
            },
            {
                raasta_field: "social_category",
                display_name: "Social Category",
                question: "What is your social category?",
                keywords: ["social category", "category", "caste", "वर्ग", "community"],
                base_confidence: 0.90
            },
            {
                raasta_field: "disability_status",
                display_name: "Disability Status",
                question: "Do you have any disability?",
                keywords: ["disability status", "disability", "differently abled", "pwd", "दिव्यांग"],
                base_confidence: 0.90
            },
            {
                raasta_field: "is_farmer",
                display_name: "Farmer Status",
                question: "Are you a farmer?",
                keywords: ["farmer", "kisan", "किसान", "agricultural occupation"],
                base_confidence: 0.92
            },
            {
                raasta_field: "landholding_status",
                display_name: "Landholding Status",
                question: "What is your landholding status?",
                keywords: ["landholding", "land holding", "land size", "भूमि"],
                base_confidence: 0.90
            },
            {
                raasta_field: "has_existing_lpg_connection",
                display_name: "LPG Connection Status",
                question: "Do you have an existing LPG connection?",
                keywords: ["lpg connection", "gas connection", "lpg", "गैस"],
                base_confidence: 0.90
            },
            {
                raasta_field: "owns_pucca_house",
                display_name: "Pucca House Ownership",
                question: "Do you own a pucca house?",
                keywords: ["pucca house", "house type", "pucca मकान", "dwelling"],
                base_confidence: 0.90
            }
        ];
    }

    matchField(domField) {
        const searchTerms = [
            domField.label,
            domField.name,
            domField.placeholder,
            domField.aria_label,
            domField.fieldset_legend,
            domField.context
        ].filter(Boolean).join(" ").toLowerCase();

        const isMonthlyOrIndividual = /\b(monthly|individual|salary|per month|stipend)\b/i.test(searchTerms);

        let bestMatch = null;
        let highestScore = 0;

        for (const rule of this.canonicalRules) {
            // Exclude annual_income if input specifically mentions monthly/individual/salary
            if (rule.raasta_field === "annual_income" && isMonthlyOrIndividual) {
                continue;
            }

            for (const kw of rule.keywords) {
                if (searchTerms.includes(kw.toLowerCase())) {
                    let score = rule.base_confidence;
                    if (domField.label && domField.label.toLowerCase().includes(kw.toLowerCase())) {
                        score += 0.03;
                    }
                    if (score > highestScore) {
                        highestScore = Math.min(score, 0.99);
                        bestMatch = {
                            raasta_field: rule.raasta_field,
                            display_name: rule.display_name,
                            question: rule.question,
                            confidence: Math.round(highestScore * 100) / 100,
                            status: highestScore >= 0.80 ? "matched" : "needs_confirmation"
                        };
                    }
                }
            }
        }

        // Ambiguous standalone "income" fallback (assigns lower confidence and needs_confirmation)
        if (!bestMatch && !isMonthlyOrIndividual && /\b(income|आय)\b/i.test(searchTerms)) {
            const incomeRule = this.canonicalRules.find(r => r.raasta_field === "annual_income");
            if (incomeRule) {
                bestMatch = {
                    raasta_field: "annual_income",
                    display_name: incomeRule.display_name,
                    question: incomeRule.question,
                    confidence: 0.65,
                    status: "needs_confirmation"
                };
            }
        }

        return bestMatch;
    }

    partitionFields(detectedFields, citizenData = {}) {
        const known = [];
        const missing = [];
        const unmapped = [];

        detectedFields.forEach(domField => {
            const match = this.matchField(domField);

            if (!match) {
                unmapped.push(domField);
                return;
            }

            const citizenEntity = citizenData[match.raasta_field];
            const hasValue = citizenEntity !== undefined && citizenEntity !== null && 
                (typeof citizenEntity === 'object' ? (citizenEntity.value !== undefined && citizenEntity.value !== null && citizenEntity.value !== "") : citizenEntity !== "");

            if (hasValue) {
                const val = typeof citizenEntity === 'object' && 'value' in citizenEntity ? citizenEntity.value : citizenEntity;
                const source = typeof citizenEntity === 'object' && 'source' in citizenEntity ? citizenEntity.source : "Citizen Conversation";
                known.push({
                    dom_field: domField,
                    raasta_field: match.raasta_field,
                    display_name: match.display_name,
                    value: val,
                    source: source,
                    confidence: match.confidence,
                    status: match.status
                });
            } else {
                missing.push({
                    dom_field: domField,
                    raasta_field: match.raasta_field,
                    display_name: match.display_name,
                    question: match.question,
                    confidence: match.confidence,
                    status: match.status
                });
            }
        });

        return { known, missing, unmapped };
    }

    // Backward compatibility for existing code
    mapFields(detectedFields, citizenData) {
        const res = this.partitionFields(detectedFields, citizenData);
        return res.known;
    }
}

window.fieldMapper = new FieldMapper();
