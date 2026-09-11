// Service worker for RAASTA extension
console.log("RAASTA Background Service Worker loaded.");

const MOCK_MODE = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_ACTIVE_JOURNEY") {
        if (MOCK_MODE) {
            // Mock journey context for the hackathon MVP
            const mockJourney = {
                journey_id: "journey-12345",
                scheme_id: "PM_USP_CSS",
                scheme_name: "PM-USP Scholarship",
                status: "ready_to_apply",
                citizen_data: {
                    full_name: { value: "Rahul Sharma", source: "Citizen Profile" },
                    annual_income: { value: 400000, source: "Citizen Conversation" },
                    state: { value: "Rajasthan", source: "Citizen Profile" },
                    relationship: { value: "daughter", source: "Citizen Conversation" },
                    education_level: { value: "college", source: "Citizen Conversation" },
                    purpose: { value: "fees", source: "Citizen Conversation" }
                }
            };
            sendResponse({ success: true, journey: mockJourney });
            return true;
        }

        // Live Mode: Fetch from backend
        fetch("http://127.0.0.1:8000/api/raasta/journey/active")
            .then(response => {
                if (!response.ok) {
                    throw new Error("No active journey found");
                }
                return response.json();
            })
            .then(data => {
                sendResponse({ success: true, journey: data.journey });
            })
            .catch(err => {
                console.error("RAASTA Background Error:", err);
                sendResponse({ success: false, error: err.toString() });
            });
        
        return true; // Keep channel open for async response
    }
});
