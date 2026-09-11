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
        
        print("Vosk model loaded. Listening for 'raasta'...")
        
        # Audio callback
        def callback(indata, frames, time, status):
            if status:
                print(status, file=sys.stderr)
            if rec.AcceptWaveform(bytes(indata)):
                res = json.loads(rec.Result())
                text = res.get("text", "").lower()
                
                # Check for our wake word
                # (Can handle common misrecognitions like "rasta", "pasta", "rusta", "asta")
                trigger_words = ["raasta", "rasta", "rusta", "ras ta", "pasta", "asta"]
                for word in trigger_words:
                    if word in text:
                        print(f"Wake word detected! Recognized: '{text}'")
                        asyncio.run_coroutine_threadsafe(wake_word_queue.put({"event": "wake_word_detected"}), loop)
                        break

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
