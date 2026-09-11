import os
from pathlib import Path

# Audio stream configurations
SAMPLE_RATE = 16000
CHANNELS = 1
DTYPE = 'int16'
CHUNK_SIZE = 4000

# Silence and timing thresholds
SILENCE_RMS_THRESHOLD = 0.015
MAX_SILENCE_SECONDS = 2.0
DEFAULT_RECORD_SECONDS = 10
MAX_RECORD_SECONDS = 20

# Wake words
PRIMARY_WAKE_WORD = "raasta"
ACCEPTED_WAKE_PHRASES = [
    "raasta",
    "hey raasta",
    "okay raasta",
    "ok raasta",
    "rasta",
    "hey rasta"
]

# Vosk model resolution paths
POSSIBLE_VOSK_PATHS = [
    os.getenv("VOSK_MODEL_PATH", ""),
    str(Path.home() / ".cache" / "vosk" / "vosk-model-small-en-in-0.4"),
    str(Path.home() / "AppData" / "Local" / "vosk" / "vosk-model-small-en-in-0.4"),
    str(Path.home() / ".cache" / "vosk"),
    "models/vosk-model-small-en-in-0.4",
    "voice/models/vosk-model-small-en-in-0.4"
]

def get_vosk_model_path() -> str:
    """Returns the first existing Vosk model directory found."""
    for p in POSSIBLE_VOSK_PATHS:
        if p and os.path.isdir(p):
            # Check if this directory itself contains the model or contains subdirectories
            if os.path.exists(os.path.join(p, "am")):
                return p
            # Check direct children
            try:
                for sub in os.listdir(p):
                    sub_path = os.path.join(p, sub)
                    if os.path.isdir(sub_path) and os.path.exists(os.path.join(sub_path, "am")):
                        return sub_path
            except Exception:
                pass
            return p
    return ""
