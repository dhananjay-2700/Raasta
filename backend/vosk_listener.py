import asyncio
import threading
import json
import logging
import sys
import traceback

logger = logging.getLogger(__name__)

# This queue will hold events that the FastAPI websocket route consumes
wake_word_queue = asyncio.Queue()

def _audio_listen_loop(loop: asyncio.AbstractEventLoop):
    try:
        import vosk
        import sounddevice as sd
    except ImportError:
        logger.error("Vosk or SoundDevice is not installed. Please install them.")
        return

    # Mute Vosk spam
    vosk.SetLogLevel(-1)

    try:
        print("Initializing Vosk wake word model (may take a moment to download)...")
        # Load the Indian English model for better recognition of "raasta"
        model = vosk.Model(lang="en-in")
        samplerate = 16000
        rec = vosk.KaldiRecognizer(model, samplerate)
        
        print("[VOICE] Vosk model loaded. Listening for 'apple'...")
        
        listening_state = "WAKE_WORD"
        
        # Audio callback
        def callback(indata, frames, time, status):
            nonlocal listening_state
            if status:
                print(status, file=sys.stderr, flush=True)
            if rec.AcceptWaveform(bytes(indata)):
                res = json.loads(rec.Result())
                text = res.get("text", "").lower().strip()
                
                if text:
                    print(f"[VOSK] Recognized: '{text}'", flush=True)

                if listening_state == "WAKE_WORD":
                    # Check for our wake word
                    trigger_words = ["apple", "apples", "a pull", "app pull"]
                    matched_word = None
                    for word in trigger_words:
                        if word in text:
                            matched_word = word
                            break
                    
                    if matched_word:
                        print(f"[WAKE] Wake word detected! Match: '{matched_word}' in '{text}'", flush=True)
                        
                        parts = text.split(matched_word, 1)
                        remaining_text = parts[1].strip() if len(parts) > 1 else ""
                        
                        if remaining_text:
                            print("[VOICE] Transcript captured in the same breath as wake word.", flush=True)
                            asyncio.run_coroutine_threadsafe(wake_word_queue.put({"event": "wake_word_detected"}), loop)
                            print(f"[VOICE] Transcript received: '{remaining_text}'", flush=True)
                            asyncio.run_coroutine_threadsafe(wake_word_queue.put({"event": "transcript", "text": remaining_text}), loop)
                            rec.Reset()
                        else:
                            print("[VOICE] Switching to active listening...", flush=True)
                            listening_state = "CONVERSATION"
                            asyncio.run_coroutine_threadsafe(wake_word_queue.put({"event": "wake_word_detected"}), loop)
                            rec.Reset()
                
                elif listening_state == "CONVERSATION":
                    if text:
                        print(f"[VOICE] Transcript received: '{text}'", flush=True)
                        print("[VOICE] Returning to wake word mode...", flush=True)
                        asyncio.run_coroutine_threadsafe(wake_word_queue.put({"event": "transcript", "text": text}), loop)
                        listening_state = "WAKE_WORD"
                        rec.Reset()

        with sd.RawInputStream(samplerate=samplerate, blocksize=8000, device=None,
                               dtype='int16', channels=1, callback=callback):
            # Keep thread alive listening
            while True:
                # The callback does all the work
                sd.sleep(1000)

    except Exception as e:
        print(f"Audio listener crashed: {e}")
        traceback.print_exc()

def start_listener_thread(loop: asyncio.AbstractEventLoop):
    t = threading.Thread(target=_audio_listen_loop, args=(loop,), daemon=True)
    t.start()
