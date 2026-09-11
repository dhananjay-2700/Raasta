import json
import math
import time
import struct
import logging
import numpy as np

from voice.config import (
    SAMPLE_RATE,
    CHANNELS,
    CHUNK_SIZE,
    SILENCE_RMS_THRESHOLD,
    MAX_SILENCE_SECONDS,
    DEFAULT_RECORD_SECONDS,
    MAX_RECORD_SECONDS,
    ACCEPTED_WAKE_PHRASES,
    get_vosk_model_path
)

logger = logging.getLogger("RAASTA.AudioManager")

# Audio hardware libraries
try:
    import sounddevice as sd
    SOUNDDEVICE_AVAILABLE = True
except ImportError:
    SOUNDDEVICE_AVAILABLE = False
    logger.warning("sounddevice not available. Microphone capture will be disabled.")

try:
    from vosk import Model as VoskModel, KaldiRecognizer
    VOSK_AVAILABLE = True
except ImportError:
    VOSK_AVAILABLE = False
    logger.warning("Vosk not available.")

# Optional Whisper STT
try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False


def calculate_rms(audio_data: bytes) -> float:
    """Calculates Root-Mean-Square (RMS) volume of 16-bit PCM mono audio."""
    count = len(audio_data) // 2
    if count == 0:
        return 0.0
    format_str = f"<{count}h"
    try:
        shorts = struct.unpack(format_str, audio_data)
    except struct.error:
        return 0.0

    sum_squares = sum(s * s for s in shorts)
    # Normalize against max 16-bit signed integer (32768)
    return math.sqrt(sum_squares / count) / 32768.0


class AudioManager:
    """
    Handles microphone audio capture, Vosk wake-word detection,
    and speech-to-text transcription via Whisper or Vosk.
    """
    def __init__(self, vosk_model_path: str = None, whisper_model_name: str = "base"):
        self.vosk_model = None
        self.whisper_model = None
        self._active_stream = None

        # 1. Initialize Vosk Model
        if VOSK_AVAILABLE:
            model_path = vosk_model_path or get_vosk_model_path()
            if model_path:
                try:
                    self.vosk_model = VoskModel(model_path)
                    logger.info(f"Loaded Vosk model from: {model_path}")
                except Exception as e:
                    logger.warning(f"Could not load Vosk model: {e}")
            else:
                logger.info("No local Vosk model found. Wake-word detection will use simulated trigger if requested.")

        # 2. Lazy Whisper initialization
        self.whisper_model_name = whisper_model_name

    def _get_whisper(self):
        if WHISPER_AVAILABLE and self.whisper_model is None:
            try:
                self.whisper_model = whisper.load_model(self.whisper_model_name)
                logger.info(f"Loaded local Whisper model: {self.whisper_model_name}")
            except Exception as e:
                logger.warning(f"Failed to load Whisper: {e}")
        return self.whisper_model

    def is_wake_word_phrase(self, text: str) -> bool:
        """Checks if the recognized phrase contains an accepted RAASTA wake word."""
        if not text:
            return False
        clean = text.lower().strip()
        for phrase in ACCEPTED_WAKE_PHRASES:
            if phrase in clean:
                return True
        return False

    def listen_for_wake_word(self, timeout_seconds: float = None) -> bool:
        """
        Listens continuously on the microphone until a wake phrase ('raasta', 'hey raasta')
        is detected. Returns True upon detection.
        """
        if not SOUNDDEVICE_AVAILABLE or not self.vosk_model:
            logger.info("Audio capture hardware or Vosk model not present for live listening.")
            return False

        recognizer = KaldiRecognizer(self.vosk_model, float(SAMPLE_RATE))
        recognizer.SetWords(False)

        start_time = time.time()

        try:
            with sd.RawInputStream(
                samplerate=SAMPLE_RATE,
                blocksize=CHUNK_SIZE,
                dtype='int16',
                channels=CHANNELS
            ) as stream:
                self._active_stream = stream
                logger.debug("Listening for wake word 'raasta'...")

                while True:
                    if timeout_seconds and (time.time() - start_time) > timeout_seconds:
                        return False

                    data, overflowed = stream.read(CHUNK_SIZE)
                    if overflowed:
                        continue

                    raw_bytes = bytes(data)

                    if recognizer.AcceptWaveform(raw_bytes):
                        res = json.loads(recognizer.Result())
                        recognized_text = res.get("text", "")
                        if self.is_wake_word_phrase(recognized_text):
                            logger.info(f"Wake word detected in final text: '{recognized_text}'")
                            return True
                    else:
                        partial_res = json.loads(recognizer.PartialResult())
                        partial_text = partial_res.get("partial", "")
                        if self.is_wake_word_phrase(partial_text):
                            logger.info(f"Wake word detected in partial text: '{partial_text}'")
                            return True

        except Exception as e:
            logger.error(f"Error in listen_for_wake_word: {e}")
            return False
        finally:
            self._active_stream = None

    def listen_and_transcribe(self, record_seconds: int = DEFAULT_RECORD_SECONDS) -> str:
        """
        Records spoken command from microphone with RMS silence termination,
        then transcribes it using Whisper (if installed) or Vosk.
        """
        if not SOUNDDEVICE_AVAILABLE:
            logger.warning("Microphone capture unavailable.")
            return ""

        max_seconds = min(record_seconds, MAX_RECORD_SECONDS)
        total_chunks = int(SAMPLE_RATE / CHUNK_SIZE * max_seconds)

        audio_frames = []
        speech_started = False
        silence_start_time = None

        try:
            with sd.RawInputStream(
                samplerate=SAMPLE_RATE,
                blocksize=CHUNK_SIZE,
                dtype='int16',
                channels=CHANNELS
            ) as stream:
                self._active_stream = stream
                logger.debug("Listening for citizen speech...")

                for _ in range(total_chunks):
                    data, _ = stream.read(CHUNK_SIZE)
                    raw_bytes = bytes(data)
                    audio_frames.append(raw_bytes)

                    rms = calculate_rms(raw_bytes)

                    if rms > SILENCE_RMS_THRESHOLD:
                        speech_started = True
                        silence_start_time = None
                    elif speech_started:
                        if silence_start_time is None:
                            silence_start_time = time.time()
                        elif time.time() - silence_start_time > MAX_SILENCE_SECONDS:
                            logger.debug("Silence detected after speech; stopping recording early.")
                            break

        except Exception as e:
            logger.error(f"Error recording audio: {e}")
            return ""
        finally:
            self._active_stream = None

        if not audio_frames or not speech_started:
            logger.debug("No speech detected during recording interval.")
            return ""

        raw_pcm = b"".join(audio_frames)

        # 1. Transcribe with Whisper if available
        whisper_engine = self._get_whisper()
        if whisper_engine:
            try:
                # Convert int16 bytes to float32 numpy array normalized to [-1.0, 1.0]
                audio_np = np.frombuffer(raw_pcm, dtype=np.int16).astype(np.float32) / 32768.0
                result = whisper_engine.transcribe(
                    audio_np,
                    language="en",
                    fp16=False,
                    no_speech_threshold=0.6
                )
                text = result.get("text", "").strip()

                # Filter out standard hallucinations
                hallucinations = ["thank you for watching", "subtitles by", "bye.", "subscribe"]
                if any(h in text.lower() for h in hallucinations):
                    return ""

                return text
            except Exception as e:
                logger.warning(f"Whisper transcription failed, falling back to Vosk: {e}")

        # 2. Transcribe with Vosk (local offline fallback)
        if self.vosk_model:
            try:
                recognizer = KaldiRecognizer(self.vosk_model, float(SAMPLE_RATE))
                recognizer.AcceptWaveform(raw_pcm)
                res = json.loads(recognizer.FinalResult())
                return res.get("text", "").strip()
            except Exception as e:
                logger.error(f"Vosk transcription error: {e}")
                return ""

        return ""

    def cleanup(self):
        """Releases any active stream resources."""
        if self._active_stream:
            try:
                self._active_stream.stop()
                self._active_stream.close()
            except Exception:
                pass
            self._active_stream = None
