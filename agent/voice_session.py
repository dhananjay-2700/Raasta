import sys
import time
import logging

from voice.audio_manager import AudioManager
from voice.voice_output import speak
from agent.conversation_engine import RAASTAConversationEngine
from agent.journey_context import JourneyContext

logger = logging.getLogger("RAASTA.VoiceSession")


class RAASTAVoiceSession:
    """
    Two-way voice conversation loop between Citizen and RAASTA.
    Coordinates Vosk wake-word listening, STT, conversation engine, and TTS.
    """
    def __init__(self, audio_manager: AudioManager = None, engine: RAASTAConversationEngine = None):
        self.audio_manager = audio_manager or AudioManager()
        self.engine = engine or RAASTAConversationEngine()
        self.journey = JourneyContext()

    def run_voice_loop(self):
        """
        Main execution loop.
        Listens for wake word 'raasta', then engages in multi-turn conversation.
        """
        print("\n" + "=" * 60)
        print("          RAASTA CITIZEN SERVICE VOICE ASSISTANT")
        print("=" * 60)
        print("Say 'RAASTA' to wake up the assistant. Press Ctrl+C to exit.\n")

        try:
            while True:
                logger.info("Waiting for wake word 'raasta'...")
                wake_detected = self.audio_manager.listen_for_wake_word()

                if wake_detected:
                    speak("Yes?")

                    conversation_active = True
                    consecutive_silence = 0
                    max_turns = 12
                    turns = 0

                    while conversation_active and turns < max_turns:
                        turns += 1

                        # Listen to citizen speech
                        citizen_speech = self.audio_manager.listen_and_transcribe(record_seconds=10)

                        if not citizen_speech:
                            consecutive_silence += 1
                            if consecutive_silence >= 2:
                                speak("I didn't hear anything. Let me know if you need help by saying RAASTA.")
                                conversation_active = False
                            continue

                        consecutive_silence = 0
                        print(f"\nCitizen: {citizen_speech}")

                        # Process turn in conversation engine
                        response = self.engine.process_turn(citizen_speech, self.journey)

                        # Speak response
                        speak(response.spoken_text)

                        if not response.should_continue:
                            conversation_active = False
                            break

                        time.sleep(0.5)

        except KeyboardInterrupt:
            print("\nShutting down RAASTA Voice Assistant...")
            speak("Goodbye.")
        finally:
            self.audio_manager.cleanup()

    def run_text_simulation(self):
        """
        Allows interactive conversational testing in terminal without microphone.
        """
        print("\n--- RAASTA Conversational Simulation Mode ---")
        print("Type your messages as the citizen. Type 'exit' or 'done' to stop.\n")
        speak("Hello! I am RAASTA, your citizen service assistant. How can I help you today?")

        while True:
            try:
                user_input = input("\nYou: ").strip()
                if not user_input:
                    continue

                response = self.engine.process_turn(user_input, self.journey)
                speak(response.spoken_text)

                if not response.should_continue:
                    break
            except (KeyboardInterrupt, EOFError):
                print("\nEnding simulation.")
                break


if __name__ == "__main__":
    session = RAASTAVoiceSession()
    # If microphone is unavailable or running headless, default to simulation
    if "--text" in sys.argv:
        session.run_text_simulation()
    else:
        session.run_voice_loop()
