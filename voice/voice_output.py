import os
import sys
import time
import logging

logger = logging.getLogger("RAASTA.VoiceOutput")

try:
    from gtts import gTTS
    import pygame
    ONLINE_TTS_AVAILABLE = True
except ImportError:
    ONLINE_TTS_AVAILABLE = False

try:
    import pyttsx3
    OFFLINE_TTS_AVAILABLE = True
except ImportError:
    OFFLINE_TTS_AVAILABLE = False

_MIXER_INITIALIZED = False
_AUDIO_TEMP_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "raasta_temp_voice.mp3")

def _init_mixer() -> bool:
    """Lazily initialize pygame mixer once."""
    global _MIXER_INITIALIZED
    if not _MIXER_INITIALIZED and ONLINE_TTS_AVAILABLE:
        try:
            pygame.mixer.init()
            _MIXER_INITIALIZED = True
        except Exception as e:
            logger.warning(f"Pygame mixer init failed: {e}")
            return False
    return _MIXER_INITIALIZED

def _cleanup_audio():
    """Safely removes temporary audio files."""
    try:
        if os.path.exists(_AUDIO_TEMP_FILE):
            os.remove(_AUDIO_TEMP_FILE)
    except Exception:
        pass

def _speak_online(text: str) -> bool:
    """Uses gTTS + pygame to speak online."""
    if not ONLINE_TTS_AVAILABLE or not _init_mixer():
        return False

    try:
        tts = gTTS(text=text, lang="en", tld="co.in", slow=False)
        tts.save(_AUDIO_TEMP_FILE)

        pygame.mixer.music.load(_AUDIO_TEMP_FILE)
        pygame.mixer.music.play()

        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)

        pygame.mixer.music.unload()
        time.sleep(0.1)
        _cleanup_audio()
        return True
    except Exception as e:
        logger.debug(f"Online TTS failed, falling back: {e}")
        _cleanup_audio()
        return False

def _speak_offline(text: str) -> bool:
    """Fallback offline SAPI5/TTS using pyttsx3."""
    if not OFFLINE_TTS_AVAILABLE:
        return False

    try:
        engine = pyttsx3.init()
        engine.setProperty("rate", 165)
        engine.setProperty("volume", 1.0)
        # Prefer an Indian English or natural female voice if present
        voices = engine.getProperty("voices") or []
        for v in voices:
            v_name = v.name.lower()
            if "india" in v_name or "zira" in v_name or "female" in v_name:
                engine.setProperty("voice", v.id)
                break
        engine.say(text)
        engine.runAndWait()
        del engine
        return True
    except Exception as e:
        logger.debug(f"Offline TTS failed: {e}")
        return False

def speak(text: str, print_console: bool = True):
    """
    Speaks text aloud using gTTS, falls back to pyttsx3, and always prints
    to console as RAASTA: <text>. Never raises uncaught exceptions.
    """
    if not text or not text.strip():
        return

    clean_text = text.strip()
    if print_console:
        print(f"RAASTA: {clean_text}")

    # 1. Attempt online TTS (gTTS + pygame)
    if _speak_online(clean_text):
        return

    # 2. Attempt offline TTS (pyttsx3)
    if _speak_offline(clean_text):
        return

    # 3. Graceful fallback (console text already printed)
    logger.debug("TTS hardware unavailable, response delivered via text only.")

# Clean up any stale temp files on import
_cleanup_audio()
