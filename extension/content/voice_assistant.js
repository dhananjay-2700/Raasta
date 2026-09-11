// RAASTA Voice Assistant for Browser Extension
// Leverages native Web Speech API (SpeechRecognition + SpeechSynthesis)

class RaastaVoiceAssistant {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.speechSynthesis = window.speechSynthesis || null;
        this.currentUtterance = null;
        this.state = 'IDLE'; // IDLE, LISTENING, PROCESSING, CONFIRMING, ERROR

        this.initRecognition();
    }

    isSupported() {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        return !!SpeechRec;
    }

    initRecognition() {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
            console.warn('[RAASTA Voice] Web Speech Recognition not supported in this browser.');
            return;
        }

        try {
            this.recognition = new SpeechRec();
            this.recognition.lang = 'en-IN';
            this.recognition.continuous = false; // Capture one clear phrase per question
            this.recognition.interimResults = true;
        } catch (e) {
            console.error('[RAASTA Voice] Failed to initialize SpeechRecognition:', e);
        }
    }

    startListening({ onInterim, onComplete, onError }) {
        if (!this.recognition) {
            this.initRecognition();
        }

        if (!this.recognition) {
            if (onError) onError('Speech recognition is not supported in this browser.');
            return;
        }

        // Stop any active speech synthesis before listening
        this.stopSpeaking();

        try {
            this.isListening = true;
            this.state = 'LISTENING';

            let finalTranscript = '';

            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const seg = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += seg;
                    } else {
                        interimTranscript += seg;
                    }
                }
                const fullText = (finalTranscript + ' ' + interimTranscript).trim();
                if (onInterim) onInterim(fullText);
            };

            this.recognition.onerror = (event) => {
                console.warn('[RAASTA Voice] Recognition error:', event.error);
                this.isListening = false;
                this.state = 'ERROR';
                if (onError) onError(event.error);
            };

            this.recognition.onend = () => {
                this.isListening = false;
                if (finalTranscript.trim().length > 0) {
                    this.state = 'PROCESSING';
                    if (onComplete) onComplete(finalTranscript.trim());
                } else {
                    this.state = 'IDLE';
                }
            };

            this.recognition.start();
        } catch (e) {
            console.error('[RAASTA Voice] Error starting recognition:', e);
            this.isListening = false;
            this.state = 'ERROR';
            if (onError) onError(e.message || 'Failed to start listening.');
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.abort();
            } catch (e) {}
            this.isListening = false;
            this.state = 'IDLE';
        }
    }

    getSmoothVoice() {
        if (!this.speechSynthesis) return null;
        const voices = this.speechSynthesis.getVoices() || [];
        const preferredOrder = [
            v => v.name.includes("Natural") && (v.lang.includes("en-IN") || v.lang.includes("en")),
            v => v.name.includes("Google") && (v.lang.includes("en-IN") || v.lang.includes("en")),
            v => v.name.includes("Neerja") || v.name.includes("Prabhat") || v.name.includes("Veena") || v.name.includes("Rishi"),
            v => v.name.includes("Samantha") || v.name.includes("Karen") || v.name.includes("Victoria") || v.name.includes("Serena"),
            v => v.lang.startsWith("en-IN"),
            v => v.lang.startsWith("en")
        ];
        for (const testFn of preferredOrder) {
            const match = voices.find(testFn);
            if (match) return match;
        }
        return voices[0] || null;
    }

    speak(text, onEnd) {
        if (!this.speechSynthesis) {
            if (onEnd) onEnd();
            return;
        }

        this.stopSpeaking();

        try {
            const utterance = new SpeechSynthesisUtterance(text);
            const bestVoice = this.getSmoothVoice();
            if (bestVoice) {
                utterance.voice = bestVoice;
                utterance.lang = bestVoice.lang;
            } else {
                utterance.lang = 'en-IN';
            }
            utterance.rate = 0.96;
            utterance.pitch = 1.04;

            utterance.onend = () => {
                this.currentUtterance = null;
                if (onEnd) onEnd();
            };

            utterance.onerror = (e) => {
                console.warn('[RAASTA Voice] Speech synthesis error:', e);
                this.currentUtterance = null;
                if (onEnd) onEnd();
            };

            this.currentUtterance = utterance;
            this.speechSynthesis.speak(utterance);
        } catch (e) {
            console.warn('[RAASTA Voice] Speech synthesis failed:', e);
            if (onEnd) onEnd();
        }
    }

    stopSpeaking() {
        if (this.speechSynthesis && this.speechSynthesis.speaking) {
            try {
                this.speechSynthesis.cancel();
            } catch (e) {}
            this.currentUtterance = null;
        }
    }
}

window.raastaVoice = new RaastaVoiceAssistant();
