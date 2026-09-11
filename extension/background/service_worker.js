// Service worker for RAASTA extension
console.log("RAASTA Background Service Worker loaded.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_ACTIVE_JOURNEY") {
        // Mock journey context for the hackathon MVP
        const mockJourney = {
            journey_id: "journey-12345",
            scheme_id: "PM_USP_CSS",
            scheme_name: "PM-USP Scholarship",
            status: "ready_to_apply",
            citizen_data: {
                full_name: "Rahul Sharma",
                annual_income: 400000,
                state: "Rajasthan",
                relationship: "daughter",
                education_level: "college",
                purpose: "fees"
            }
        };
        sendResponse({ success: true, journey: mockJourney });
    }
    return true; // Keep channel open for async response if needed
});
