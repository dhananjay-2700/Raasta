import unittest

from agent.journey_context import JourneyContext
from agent.conversation_engine import RAASTAConversationEngine
from ml.pipeline import RAASTAPipeline
from ml.extraction import MockExtractionProvider


class TestRAASTAConversationEngine(unittest.TestCase):
    def setUp(self):
        # Inject deterministic MockExtractionProvider for offline testing
        self.mock_provider = MockExtractionProvider()
        self.pipeline = RAASTAPipeline(extraction_provider=self.mock_provider)
        self.engine = RAASTAConversationEngine(pipeline=self.pipeline)

    def test_1_initial_query_education_assistance(self):
        """Tests initial query recognizing education need and prompting for missing annual income."""
        journey = JourneyContext()
        turn1 = self.engine.process_turn(
            "My daughter got admission to college but we cannot afford the fees.",
            journey
        )

        self.assertTrue(turn1.should_continue)
        self.assertIsNotNone(journey.selected_scheme)
        self.assertIn("PM_USP_CSS", journey.selected_scheme.get("scheme_id", ""))
        self.assertEqual(journey.current_stage, "needs_information")
        self.assertEqual(journey.pending_field, "annual_income")
        # RAASTA's spoken response must ask for income
        self.assertIn("income", turn1.spoken_text.lower())

    def test_2_pending_question_resolution_income(self):
        """Tests answering the pending income question with conversational text ('four lakh')."""
        journey = JourneyContext()
        # Turn 1: Initial query
        self.engine.process_turn(
            "My daughter got admission to college but we cannot afford the fees.",
            journey
        )
        self.assertEqual(journey.pending_field, "annual_income")

        # Turn 2: Citizen answers with conversational value
        turn2 = self.engine.process_turn("About four lakh rupees per year.", journey)

        # Pending field should now be resolved from annual_income to the next missing field
        self.assertNotEqual(journey.pending_field, "annual_income")
        self.assertEqual(journey.get_fact_value("annual_income"), 400000)
        self.assertIn("annual_income", journey.known_facts)

    def test_3_multi_turn_state_preservation(self):
        """Tests that facts and conversation history accumulate across turns."""
        journey = JourneyContext()
        self.engine.process_turn("I am a farmer and need financial assistance.", journey)
        self.assertIn(journey.selected_scheme.get("scheme_id"), ["PM_KISAN"])

        # Record another fact
        journey.pending_field = "state"
        turn2 = self.engine.process_turn("I live in Rajasthan.", journey)

        self.assertEqual(journey.get_fact_value("state"), "Rajasthan")
        self.assertEqual(len(journey.conversation_history), 4)  # 2 citizen turns, 2 raasta turns

    def test_4_exit_and_cancel_commands(self):
        """Tests that commands like 'done', 'stop', 'exit' stop the conversation safely."""
        for cmd in ["done", "stop", "cancel", "exit"]:
            journey = JourneyContext()
            res = self.engine.process_turn(cmd, journey)
            self.assertFalse(res.should_continue)
            self.assertIn("Ending session", res.spoken_text)

    def test_5_vague_query_handling(self):
        """Tests asking for clarification when query is completely vague."""
        journey = JourneyContext()
        res = self.engine.process_turn("I need government help.", journey)
        self.assertTrue(res.should_continue)
        self.assertEqual(journey.current_stage, "understanding")
        self.assertIn("help with government services", res.spoken_text)

    def test_6_pending_field_resolver_edge_cases(self):
        """Tests deterministic extraction helper on various spoken patterns."""
        # Income patterns
        self.assertEqual(self.engine._resolve_pending_field("annual_income", "four lakh"), 400000)
        self.assertEqual(self.engine._resolve_pending_field("annual_income", "400000"), 400000)
        self.assertEqual(self.engine._resolve_pending_field("annual_income", "about 5 lakh"), 500000)

        # State patterns
        self.assertEqual(self.engine._resolve_pending_field("state", "I live in Rajasthan"), "Rajasthan")
        self.assertEqual(self.engine._resolve_pending_field("district", "Jaipur district"), "Jaipur District")

        # Date of birth pattern
        self.assertEqual(self.engine._resolve_pending_field("date_of_birth", "14 March 2006"), "14 March 2006")

        # Percentage patterns
        self.assertEqual(self.engine._resolve_pending_field("class_12_percentile", "82 percent"), 82)
        self.assertEqual(self.engine._resolve_pending_field("class_12_percentile", "85.5%"), 85.5)
        self.assertIsNone(self.engine._resolve_pending_field("class_12_percentile", "Rajasthan."))

        # Age patterns
        self.assertEqual(self.engine._resolve_pending_field("age", "21 years old"), 21)
        self.assertIsNone(self.engine._resolve_pending_field("age", "Next year"))

    def test_7_type_validation_and_out_of_order_salvaging(self):
        """Tests that speaking 'Rajasthan.' when asked for 'class_12_percentile' salvages state without corrupting marks."""
        journey = JourneyContext()
        journey.pending_field = "class_12_percentile"

        # Citizen mistakenly provides their state
        turn = self.engine.process_turn("Rajasthan.", journey)

        # 1. Percentage must NOT be resolved to 'Rajasthan.'
        self.assertIsNone(journey.get_fact_value("class_12_percentile"))
        # 2. Pending field must remain class_12_percentile
        self.assertEqual(journey.pending_field, "class_12_percentile")
        # 3. State must be salvaged and saved into known_facts
        self.assertEqual(journey.get_fact_value("state"), "Rajasthan")
        # 4. Spoken reply must acknowledge state and reprompt for percentage
        self.assertIn("Rajasthan", turn.spoken_text)
        self.assertIn("Class 12", turn.spoken_text)

        # Next turn: Citizen answers with actual percentage
        turn2 = self.engine.process_turn("She got 82 percent.", journey)
        self.assertEqual(journey.get_fact_value("class_12_percentile"), 82)
        self.assertNotEqual(journey.pending_field, "class_12_percentile")

    def test_8_numeric_field_rejections(self):
        """Tests that invalid inputs for numeric fields are safely rejected without crashing."""
        self.assertIsNone(self.engine._resolve_pending_field("annual_income", "I do not want to say"))
        self.assertIsNone(self.engine._resolve_pending_field("annual_income", "No"))
        self.assertIsNone(self.engine._resolve_pending_field("age", "unknown"))
        self.assertIsNone(self.engine._resolve_pending_field("class_12_percentile", "Jaipur"))


if __name__ == "__main__":
    unittest.main()
