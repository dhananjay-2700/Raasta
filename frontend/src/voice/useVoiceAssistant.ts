import { useState, useEffect, useCallback, useRef } from 'react';

export type VoiceState = 'IDLE' | 'ACTIVATING' | 'LISTENING' | 'PROCESSING';

interface UseVoiceAssistantProps {
  onWakeWord?: () => void;
  onTranscriptChange?: (text: string) => void;
  onTranscriptComplete?: (text: string) => void;
}

export function useVoiceAssistant({ onWakeWord, onTranscriptChange, onTranscriptComplete }: UseVoiceAssistantProps = {}) {
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [error, setError] = useState<string | null>(null);
  
  // Refs for the two different SpeechRecognition instances
  const wakeWordRecognitionRef = useRef<any>(null);
  const commandRecognitionRef = useRef<any>(null);

  // We use this flag to prevent the wake word listener from restarting 
  // immediately if we intentionally stopped it to capture a command.
  const isTransitioningRef = useRef<boolean>(false);

  // ---------------------------------------------------------
  // 1. WAKE WORD DETECTION (NATIVE WEB SPEECH API)
  // ---------------------------------------------------------
  
  const startWakeWordListener = useCallback(() => {
    // Only start if we are in IDLE state and not intentionally transitioning out of it
    if (voiceState !== 'IDLE' || isTransitioningRef.current) return;
    
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      // Clean up previous instance if any
      if (wakeWordRecognitionRef.current) {
        try { wakeWordRecognitionRef.current.abort(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN'; 
      recognition.continuous = true; 
      recognition.interimResults = true; 

      recognition.onresult = (event: any) => {
        // If we somehow get a result when we are no longer supposed to be listening for the wake word
        if (voiceState !== 'IDLE' || isTransitioningRef.current) return;

        let latestTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          latestTranscript += event.results[i][0].transcript;
        }

        const normalized = latestTranscript.toLowerCase();
        // Check for "raasta" in the continuous stream
        // Web Speech API often misinterprets non-English words. Add phonetic fallbacks:
        if (
          normalized.includes('raasta') || 
          normalized.includes('rasta') || 
          normalized.includes('pasta') ||
          normalized.includes('roster') ||
          normalized.includes('raster') ||
          normalized.includes('rust a')
        ) {
          handleWakeWordDetected(recognition);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError("Microphone permission denied. Please allow access.");
          // Don't auto-restart on permission denial
          return;
        }
      };

      recognition.onend = () => {
        // Automatically restart the continuous listener if we are still supposed to be IDLE
        // This ensures it keeps running indefinitely in the background.
        if (voiceState === 'IDLE' && !isTransitioningRef.current) {
          setTimeout(() => {
            startWakeWordListener();
          }, 250); // Small delay to prevent CPU thrashing
        }
      };

      recognition.start();
      wakeWordRecognitionRef.current = recognition;
      setError(null);
    } catch (e) {
      console.error("[VoiceAssistant] Failed to start wake word listener:", e);
    }
  }, [voiceState]);

  // Keep the wake word listener running whenever we are in the IDLE state
  useEffect(() => {
    if (voiceState === 'IDLE') {
      isTransitioningRef.current = false;
      
      // Explicitly request microphone permission first to force the browser prompt
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then((stream) => {
            // Permission granted, close the stream we just opened to free the mic
            stream.getTracks().forEach(track => track.stop());
            // Now start the SpeechRecognition which will no longer be blocked
            startWakeWordListener();
          })
          .catch((err) => {
            console.error("Microphone access denied or not available:", err);
            setError("Microphone permission required for voice assistant.");
          });
      } else {
        // Fallback if getUserMedia is not supported (unlikely in modern browsers)
        startWakeWordListener();
      }
    } else {
      // We are no longer IDLE (e.g. LISTENING to a command). 
      // Stop the wake word listener to avoid overlapping microphone captures.
      if (wakeWordRecognitionRef.current) {
        try { wakeWordRecognitionRef.current.abort(); } catch (e) {}
        wakeWordRecognitionRef.current = null;
      }
    }
    
    return () => {
      if (wakeWordRecognitionRef.current) {
        try { wakeWordRecognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, [voiceState, startWakeWordListener]);

  // ---------------------------------------------------------
  // 2. STATE TRANSITIONS & COMMAND LIFECYCLE
  // ---------------------------------------------------------

  const handleWakeWordDetected = useCallback((recognitionInstance: any) => {
    // Prevent duplicate triggers
    if (isTransitioningRef.current || voiceState !== 'IDLE') return;
    isTransitioningRef.current = true;
    
    // Immediately stop the background wake word listener
    try { recognitionInstance.abort(); } catch (e) {}
    wakeWordRecognitionRef.current = null;

    setVoiceState('ACTIVATING');
    if (onWakeWord) {
      onWakeWord();
    }
    
    // Brief visual activation (SiriOrb expanding) before capturing the actual command
    setTimeout(() => {
      startCommandListening();
    }, 600);
  }, [voiceState, onWakeWord]);

  const startCommandListening = useCallback(() => {
    setVoiceState('LISTENING');
    setError(null);

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN'; 
      recognition.continuous = false; // Stop after one phrase
      recognition.interimResults = true; 

      let finalTranscript = '';
      let lastInterimTranscript = '';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptSegment = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptSegment;
          } else {
            interimTranscript += transcriptSegment;
          }
        }

        lastInterimTranscript = interimTranscript;
        const currentText = (finalTranscript + ' ' + interimTranscript).trim();
        // Note: the word "raasta" might accidentally be spoken as part of the command. 
        // This won't trigger an infinite loop because the wake word listener is currently stopped.
        if (onTranscriptChange) {
          onTranscriptChange(currentText);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("[VoiceAssistant] Command recognition error:", event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError("Microphone permission denied.");
        }
        // Return to idle safely
        setVoiceState('IDLE');
      };

      recognition.onend = () => {
        const finalText = (finalTranscript + ' ' + lastInterimTranscript).trim();
        // Once the user stops speaking the command
        if (finalText.length > 0) {
          setVoiceState('PROCESSING');
          if (onTranscriptComplete) {
            onTranscriptComplete(finalText);
          }
          
          // In the actual app, this might wait for a backend response before returning to IDLE.
          // For now, we transition back to IDLE, which will automatically restart the wake word listener.
          setTimeout(() => {
            setVoiceState('IDLE');
          }, 1000);
        } else {
          // If no speech was detected for the command, return to IDLE
          setVoiceState('IDLE');
        }
      };

      recognition.start();
      commandRecognitionRef.current = recognition;
    } catch (e) {
      console.error("[VoiceAssistant] Failed to start command recognition:", e);
      setError("Microphone initialization failed.");
      setVoiceState('IDLE');
    }
  }, [onTranscriptChange, onTranscriptComplete]);

  const [cachedVoices, setCachedVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Unlock Audio playback on first user gesture to prevent Browser Autoplay policy blocks
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const unlockAudio = () => {
      try {
        const dummyAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
        dummyAudio.play().then(() => {
          dummyAudio.pause();
        }).catch(() => {});
      } catch (e) {}
    };

    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        setCachedVoices(v);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const getSmoothVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const MALE_OR_ROBOTIC_NAMES = [
      "fred", "alex", "rishi", "daniel", "albert", "diego", "jorge", "thomas", 
      "luca", "oliver", "bad news", "bells", "cellos", "deranged", "hysterical", 
      "pipe organ", "trinoids", "whisper", "zarvox", "ralph", "bruce", "junior"
    ];

    const isRoboticOrMale = (v: SpeechSynthesisVoice) => {
      const name = v.name.toLowerCase();
      return MALE_OR_ROBOTIC_NAMES.some(robotic => name.includes(robotic));
    };

    const preferredOrder = [
      // 1. Indian English / India Google & native smooth voices (Google English India, Neerja, Veena, Heera, Kalpana)
      (v: SpeechSynthesisVoice) => (v.lang.includes("en-IN") || v.lang.includes("en_IN") || v.name.includes("India")) && !isRoboticOrMale(v),
      (v: SpeechSynthesisVoice) => (v.name.includes("Neerja") || v.name.includes("Veena") || v.name.includes("Heera") || v.name.includes("Kalpana")) && !isRoboticOrMale(v),
      // 2. Google English voices
      (v: SpeechSynthesisVoice) => v.name.includes("Google") && (v.name.includes("India") || v.name.includes("US English") || v.name.includes("UK English Female") || v.lang.startsWith("en")),
      (v: SpeechSynthesisVoice) => v.name.includes("Google") && !isRoboticOrMale(v),
      // 3. Natural / Neural Female Voices (Edge / Windows)
      (v: SpeechSynthesisVoice) => (v.name.includes("Natural") || v.name.includes("Online") || v.name.includes("Neural")) && v.lang.startsWith("en") && !isRoboticOrMale(v),
      // 4. Preferred Smooth Female Voices (Samantha, Victoria, Karen, Siri, Serena, Moira, Zira)
      (v: SpeechSynthesisVoice) => (
        v.name.includes("Samantha") ||
        v.name.includes("Victoria") ||
        v.name.includes("Karen") ||
        v.name.includes("Siri") ||
        v.name.includes("Serena") ||
        v.name.includes("Moira") ||
        v.name.includes("Zira")
      ) && v.lang.startsWith("en"),
      // 5. Any English voice that is NOT robotic/male
      (v: SpeechSynthesisVoice) => v.lang.startsWith("en") && !isRoboticOrMale(v),
      // 6. Any voice that is NOT robotic/male
      (v: SpeechSynthesisVoice) => !isRoboticOrMale(v),
    ];

    for (const testFn of preferredOrder) {
      const match = voices.find(testFn);
      if (match) return match;
    }
    return voices.find(v => !isRoboticOrMale(v)) || voices[0] || null;
  }, [cachedVoices]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }, []);

  const speak = useCallback((text: string) => {
    // RAASTA is muted per user request. Stop any current audio and stay quiet.
    stopSpeaking();
  }, [stopSpeaking]);

  // Clean up command listener on unmount
  useEffect(() => {
    return () => {
      if (commandRecognitionRef.current) {
        try { commandRecognitionRef.current.abort(); } catch (e) {}
      }
      stopSpeaking();
    };
  }, [stopSpeaking]);

  return {
    voiceState,
    error,
    speak,
    stopSpeaking,
    forceWakeWord: () => {
      // Exposing manual trigger purely for extreme edge cases, 
      // but the real continuous listener handles normal activation now.
      if (wakeWordRecognitionRef.current) {
        handleWakeWordDetected(wakeWordRecognitionRef.current);
      } else {
        handleWakeWordDetected({ abort: () => {} });
      }
    }
  };
}
