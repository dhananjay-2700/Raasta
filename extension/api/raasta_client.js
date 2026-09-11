// RAASTA Client - Handles communication with backend and background script

class RaastaClient {
    constructor() {}

    async getActiveJourney() {
        return new Promise((resolve) => {
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

    async extractFieldValue(field, text) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: "EXTRACT_FIELD", field: field, text: text }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("RAASTA Client Error:", chrome.runtime.lastError);
                    resolve({ field, value: text, confidence: 0.70, status: "error" });
                } else if (response && response.success && response.extraction) {
                    resolve(response.extraction);
                } else {
                    resolve({ field, value: text, confidence: 0.70, status: "error" });
                }
            });
        });
    }

    async extractDocument(docType = "auto", fileData = "", fileName = "", text = "") {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({
                action: "EXTRACT_DOCUMENT",
                document_type: docType,
                file_name: fileName,
                file_content_base64: fileData,
                text: text
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("RAASTA Client Error:", chrome.runtime.lastError);
                    resolve({ success: false, error: chrome.runtime.lastError.message });
                } else if (response && response.success && response.extraction) {
                    resolve({ success: true, ...response.extraction });
                } else {
                    resolve({ success: false, error: "Extraction failed" });
                }
            });
        });
    }
}

window.raastaClient = new RaastaClient();
