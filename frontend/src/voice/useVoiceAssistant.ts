import { useState, useEffect, useCallback, useRef } from 'react';

export type VoiceState = 'IDLE' | 'ACTIVATING' | 'LISTENING' | 'PROCESSING';

interface UseVoiceAssistantProps {
  onTranscriptChange?: (text: string) => void;
  onTranscriptComplete?: (text: string) => void;
}

export function useVoiceAssistant({ onTranscriptChange, onTranscriptComplete }: UseVoiceAssistantProps = {}) {
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
    
    // Brief visual activation (SiriOrb expanding) before capturing the actual command
    setTimeout(() => {
      startCommandListening();
    }, 500);
  }, [voiceState]);

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
        // Once the user stops speaking the command
        if (finalTranscript.trim().length > 0) {
          setVoiceState('PROCESSING');
          if (onTranscriptComplete) {
            onTranscriptComplete(finalTranscript.trim());
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

  // Clean up command listener on unmount
  useEffect(() => {
    return () => {
      if (commandRecognitionRef.current) {
        try { commandRecognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  return {
    voiceState,
    error,
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
