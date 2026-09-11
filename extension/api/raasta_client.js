// RAASTA Client - Handles communication with backend and background script

class RaastaClient {
    constructor() {}

    async getActiveJourney() {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ action: "GET_ACTIVE_JOURNEY" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("RAASTA Client Error:", chrome.runtime.lastError);
                    resolve(null);
                } else if (response && response.success) {
                    resolve(response.journey);
                } else {
                    resolve(null);
                }
            });
        });
    }
}

window.raastaClient = new RaastaClient();
