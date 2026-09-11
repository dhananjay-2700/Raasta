from voice.audio_manager import AudioManager, calculate_rms
from voice.voice_output import speak
from voice.config import (
    SAMPLE_RATE,
    CHANNELS,
    PRIMARY_WAKE_WORD,
    ACCEPTED_WAKE_PHRASES
)

__all__ = [
    "AudioManager",
    "calculate_rms",
    "speak",
    "SAMPLE_RATE",
    "CHANNELS",
    "PRIMARY_WAKE_WORD",
    "ACCEPTED_WAKE_PHRASES"
]
