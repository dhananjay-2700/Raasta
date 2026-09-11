// Service worker for RAASTA extension
console.log("RAASTA Background Service Worker loaded.");



chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 1. GET ACTIVE JOURNEY
    if (request.action === "GET_ACTIVE_JOURNEY") {
        fetch("http://127.0.0.1:8000/api/raasta/journey/active")
            .then(response => {
                if (!response.ok) {
                    throw new Error("No active journey on server");
                }
                return response.json();
            })
            .then(data => {
                sendResponse({ success: true, journey: data.journey || null });
            })
            .catch(err => {
                console.warn("RAASTA Backend fetch failed:", err.message);
                sendResponse({ success: false, error: err.message, journey: null });
            });
        
        return true; // Async channel
    }

    // 2. EXTRACT FIELD VALUE FROM SPOKEN TEXT
    if (request.action === "EXTRACT_FIELD") {
        fetch("http://127.0.0.1:8000/api/raasta/extract-field", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ field: request.field, text: request.text })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Backend extraction error");
                }
                return response.json();
            })
            .then(data => {
                sendResponse({ success: true, extraction: data });
            })
            .catch(err => {
                console.warn("Backend extraction request failed, falling back to local normalizer:", err);
                // Graceful local normalization fallback
                const fallbackVal = localFallbackNormalize(request.field, request.text);
                sendResponse({
                    success: true,
                    extraction: {
                        field: request.field,
                        value: fallbackVal,
                        confidence: 0.88,
                        status: "success"
                    }
                });
            });

        return true; // Async channel
    }
});

function localFallbackNormalize(field, text) {
    const clean = text.trim();
    if (field === "date_of_birth" || field === "dob") {
        // e.g. "14 March 2006"
        const d = new Date(clean);
        if (!isNaN(d.getTime())) {
            return d.toISOString().split("T")[0];
        }
    }
    if (field === "annual_income") {
        const nums = clean.replace(/[^0-9]/g, "");
        if (clean.toLowerCase().includes("lakh") && nums) {
            return parseInt(nums) * 100000;
        }
        if (nums) return parseInt(nums);
    }
    if (field === "mobile_number") {
        const nums = clean.replace(/[^0-9]/g, "");
        if (nums.length >= 10) return nums.slice(-10);
    }
    return clean;
}
