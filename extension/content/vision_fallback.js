// Vision/OCR fallback stub
// To be implemented when DOM extraction fails on poorly structured government sites

class VisionFallback {
    constructor() {}

    async runFallbackExtraction() {
        console.log("Vision fallback invoked, but returning null for MVP.");
        return null;
    }
}

window.visionFallback = new VisionFallback();
