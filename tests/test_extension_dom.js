const fs = require('fs');
const path = require('path');

// 1. Minimal DOM Parser for mock_gov_site.html to run form_detector in Node
const html = fs.readFileSync(path.join(__dirname, '../extension/mock_gov_site.html'), 'utf8');

// Parse inputs and labels
class MockElement {
    constructor(tag, attrs = {}, text = '') {
        this.tagName = tag;
        this.attributes = attrs;
        this.id = attrs.id || '';
        this.name = attrs.name || '';
        this.type = attrs.type || (tag === 'select' ? 'select-one' : 'text');
        this.placeholder = attrs.placeholder || '';
        this.required = attrs.required || false;
        this.innerText = text;
        this.value = '';
        this.checked = false;
        this.style = {};
    }

    getAttribute(name) {
        return this.attributes[name] || null;
    }

    hasAttribute(name) {
        return name in this.attributes;
    }

    closest(selector) {
        // Simple mock for .form-group
        return { innerText: this.innerText };
    }

    dispatchEvent(ev) {}
    focus() {}
    blur() {}
    scrollIntoView() {}
}

class MockDocument {
    constructor(elements, labels) {
        this.elements = elements;
        this.labels = labels;
    }

    querySelectorAll(selector) {
        // matches input:not(...), select, textarea
        return this.elements;
    }

    querySelector(selector) {
        if (selector.startsWith('label[for="')) {
            const id = selector.match(/label\[for="([^"]+)"\]/)[1];
            return this.labels[id] || null;
        }
        return null;
    }

    getElementById(id) {
        return this.elements.find(e => e.id === id) || null;
    }
}

// Extract form elements from mock_gov_site.html
const labels = {
    'applicantName': { innerText: 'Full Name of Applicant *' },
    'dob': { innerText: 'Date of Birth *' },
    'state': { innerText: 'State of Residence *' },
    'district': { innerText: 'District *' },
    'familyIncome': { innerText: 'Annual Family Income (in ₹) *' },
    'address': { innerText: 'Residential Address *' },
    'college': { innerText: 'College / Institution Name *' },
    'mobile': { innerText: 'Mobile Number *' }
};

const elements = [
    new MockElement('input', { type: 'text', id: 'applicantName', name: 'applicantName', placeholder: 'Enter full name as per Aadhaar' }, 'Full Name of Applicant *'),
    new MockElement('input', { type: 'date', id: 'dob', name: 'dob' }, 'Date of Birth *'),
    new MockElement('select', { id: 'state', name: 'state' }, 'State of Residence *'),
    new MockElement('input', { type: 'text', id: 'district', name: 'district', placeholder: 'Enter district name' }, 'District *'),
    new MockElement('input', { type: 'number', id: 'familyIncome', name: 'familyIncome', placeholder: 'e.g. 400000' }, 'Annual Family Income (in ₹) *'),
    new MockElement('input', { type: 'text', id: 'address', name: 'address', placeholder: 'House no, Street, Locality' }, 'Residential Address *'),
    new MockElement('input', { type: 'text', id: 'college', name: 'college', placeholder: 'Enter college or university name' }, 'College / Institution Name *'),
    new MockElement('input', { type: 'text', id: 'mobile', name: 'mobile', placeholder: '10-digit mobile number' }, 'Mobile Number *')
];

global.document = new MockDocument(elements, labels);
global.window = {};

// Load form_detector and field_mapper
const detectorCode = fs.readFileSync(path.join(__dirname, '../extension/content/form_detector.js'), 'utf8');
eval(detectorCode);

const mapperCode = fs.readFileSync(path.join(__dirname, '../extension/content/field_mapper.js'), 'utf8');
eval(mapperCode);

console.log('=== TEST 1: FORM DETECTION ===');
const detected = window.formDetector.detectForms();
console.log(`Detected count: ${detected.length}`);
detected.forEach((d, i) => {
    console.log(`[Field ${i+1}] field_id: "${d.field_id}", label: "${d.label}", name: "${d.name}", type: "${d.input_type}", required: ${d.required}`);
});

console.log('\n=== TEST 2: FIELD MAPPING ===');
detected.forEach(d => {
    const match = window.fieldMapper.matchField(d);
    console.log(`Field "${d.label}" -> ${match ? match.raasta_field : 'UNMATCHED'} (confidence: ${match ? match.confidence : 0}, status: ${match ? match.status : 'none'})`);
});

console.log('\n=== TEST 2 (Ambiguity Check): "Income" and "Name" ===');
const ambiguousField1 = { label: 'Income', name: 'income', placeholder: '', aria_label: '', fieldset_legend: '', context: '' };
const match1 = window.fieldMapper.matchField(ambiguousField1);
console.log(`Ambiguous "Income" -> ${match1 ? match1.raasta_field : 'UNMATCHED'} (confidence: ${match1 ? match1.confidence : 0}, status: ${match1 ? match1.status : 'none'})`);
if (!match1 || match1.status !== "needs_confirmation" || match1.confidence > 0.70) {
    throw new Error('Ambiguous "Income" must match annual_income with needs_confirmation and confidence <= 0.70');
}

const monthlyField = { label: 'Monthly Income', name: 'monthly_income', placeholder: '', aria_label: '', fieldset_legend: '', context: '' };
const matchMonthly = window.fieldMapper.matchField(monthlyField);
console.log(`Excluded "Monthly Income" -> ${matchMonthly ? matchMonthly.raasta_field : 'UNMATCHED'} (confidence: ${matchMonthly ? matchMonthly.confidence : 0})`);
if (matchMonthly && matchMonthly.raasta_field === 'annual_income') {
    throw new Error('Monthly Income must NOT match annual_income!');
}

const salaryField = { label: 'Individual Salary', name: 'salary', placeholder: '', aria_label: '', fieldset_legend: '', context: '' };
const matchSalary = window.fieldMapper.matchField(salaryField);
console.log(`Excluded "Individual Salary" -> ${matchSalary ? matchSalary.raasta_field : 'UNMATCHED'} (confidence: ${matchSalary ? matchSalary.confidence : 0})`);
if (matchSalary && matchSalary.raasta_field === 'annual_income') {
    throw new Error('Individual Salary must NOT match annual_income!');
}

const ambiguousField2 = { label: 'Name', name: 'name', placeholder: '', aria_label: '', fieldset_legend: '', context: '' };
const match2 = window.fieldMapper.matchField(ambiguousField2);
console.log(`Ambiguous "Name" -> ${match2 ? match2.raasta_field : 'UNMATCHED'} (confidence: ${match2 ? match2.confidence : 0}, status: ${match2 ? match2.status : 'none'})`);

console.log('\n=== TEST 4: MISSING FIELD QUEUE ===');
const testCitizenData = {
    full_name: { value: 'Rahul Sharma', source: 'Citizen Conversation' },
    state: { value: 'Rajasthan', source: 'Citizen Profile' },
    annual_income: { value: 400000, source: 'Citizen Conversation' }
};

const partition = window.fieldMapper.partitionFields(detected, testCitizenData);
console.log('KNOWN FIELDS:');
partition.known.forEach(k => console.log(`  - ${k.display_name} (${k.raasta_field}) = ${k.value}`));

console.log('MISSING FIELDS:');
partition.missing.forEach(m => console.log(`  - ${m.display_name} (${m.raasta_field}) -> Question: "${m.question}"`));
