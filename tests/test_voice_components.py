import unittest
import struct

from voice.audio_manager import AudioManager, calculate_rms
from voice.voice_output import speak
from voice.config import ACCEPTED_WAKE_PHRASES


class TestVoiceComponents(unittest.TestCase):
    def setUp(self):
        # Create an AudioManager instance without requiring hardware stream
        self.audio_mgr = AudioManager(vosk_model_path="")

    def test_1_wake_word_phrase_detection(self):
        """Tests that accepted wake word variations trigger positive detection."""
        positive_cases = [
            "raasta",
            "hey raasta",
            "okay raasta can you help me",
            "ok raasta",
            "rasta help",
            "hey rasta please listen"
        ]
        for phrase in positive_cases:
            self.assertTrue(
                self.audio_mgr.is_wake_word_phrase(phrase),
                f"Failed to match wake phrase: {phrase}"
            )

        negative_cases = [
            "hello google",
            "alexa",
            "siri",
            "what is the weather",
            "sunday",
            "nano",
            ""
        ]
        for phrase in negative_cases:
            self.assertFalse(
                self.audio_mgr.is_wake_word_phrase(phrase),
                f"Incorrectly matched non-wake phrase: {phrase}"
            )

    def test_2_calculate_rms_silence_vs_audio(self):
        """Tests Root-Mean-Square (RMS) calculation on synthetic silence and sine wave."""
        # 1. Total silence (all zeros)
        silence_bytes = bytes(4000 * 2)  # 4000 samples of 16-bit 0
        self.assertEqual(calculate_rms(silence_bytes), 0.0)

        # 2. Loud sound (alternating full scale values)
        loud_samples = [16000, -16000] * 1000
        loud_bytes = struct.pack(f"<{len(loud_samples)}h", *loud_samples)
        loud_rms = calculate_rms(loud_bytes)
        self.assertGreater(loud_rms, 0.2)

    def test_3_speak_fallback_resilience(self):
        """Tests that speak() operates safely without crashing even when audio drivers are missing."""
        try:
            speak("This is a test message from RAASTA.", print_console=False)
            speak("", print_console=False)
            speak(None, print_console=False)
            success = True
        except Exception as e:
            success = False

        self.assertTrue(success, "speak() raised an unhandled exception")


if __name__ == "__main__":
    unittest.main()
