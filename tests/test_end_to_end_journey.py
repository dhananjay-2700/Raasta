import unittest
import asyncio
from agent.journey_context import JourneyContext
from agent.conversation_engine import RAASTAConversationEngine
from ml.pipeline import RAASTAPipeline
from ml.extraction import MockExtractionProvider
from backend.main import (
    set_active_journey,
    get_active_journey,
    clear_active_journey,
    extract_field_endpoint,
    FieldExtractionRequest
)


class TestEndToEndJourney(unittest.TestCase):
    def setUp(self):
        self.pipeline = RAASTAPipeline(extraction_provider=MockExtractionProvider())
        self.engine = RAASTAConversationEngine(pipeline=self.pipeline)

    def test_end_to_end_conversational_and_extension_loop(self):
        """
        Verifies the complete flow:
        1. Multi-turn voice dialogue with out-of-order handling
        2. Eligibility qualification across all scheme rules
        3. Active journey sync to backend
        4. Extension field mapping & disambiguation
        5. Spoken missing field extraction & confirmation
        """
        journey = JourneyContext(journey_id="JRN_E2E_9999")

        # Turn 1: Initial Problem Statement
        turn1 = self.engine.process_turn(
            "My daughter got admission to college but we cannot afford the fees.",
            journey
        )
        self.assertTrue(turn1.should_continue)
        self.assertIsNotNone(journey.selected_scheme)
        self.assertEqual(journey.selected_scheme.get("scheme_id"), "PM_USP_CSS")
        self.assertEqual(journey.pending_field, "annual_income")

        # Turn 2: Providing Annual Income
        turn2 = self.engine.process_turn("About four lakh rupees per year.", journey)
        self.assertTrue(turn2.should_continue)
        self.assertEqual(journey.get_fact_value("annual_income"), 400000)
        self.assertEqual(journey.pending_field, "class_12_percentile")

        # Turn 3: Out-of-order response (Citizen answers state instead of percentage)
        turn3 = self.engine.process_turn("Rajasthan.", journey)
        self.assertTrue(turn3.should_continue)
        self.assertEqual(journey.get_fact_value("state"), "Rajasthan")
        self.assertIsNone(journey.get_fact_value("class_12_percentile"))
        self.assertEqual(journey.pending_field, "class_12_percentile")
        self.assertIn("Rajasthan", turn3.spoken_text)

        # Turn 4: Citizen provides actual Class 12 percentage
        turn4 = self.engine.process_turn("She scored 82 percent in Class 12.", journey)
        self.assertEqual(journey.get_fact_value("class_12_percentile"), 82)
        self.assertEqual(journey.pending_field, "is_regular_course")

        # Turn 5: Citizen confirms regular course
        turn5 = self.engine.process_turn("Yes, she is enrolled in a regular degree program.", journey)
        self.assertEqual(journey.get_fact_value("is_regular_course"), True)
        self.assertEqual(journey.pending_field, "receiving_other_scholarship")

        # Turn 6: Citizen confirms no other scholarship
        turn6 = self.engine.process_turn("No, she is not getting any other scholarship.", journey)
        self.assertEqual(journey.get_fact_value("receiving_other_scholarship"), False)
        self.assertEqual(journey.current_stage, "eligible")
        self.assertIn("qualify", turn6.spoken_text.lower())

        journey.add_fact("full_name", "Rahul Sharma", source="Citizen Profile")

        async def test_backend_sync():
            await clear_active_journey()

            sync_payload = {
                "journey_id": journey.journey_id,
                "scheme_id": journey.selected_scheme["scheme_id"],
                "scheme_name": journey.selected_scheme["scheme_name"],
                "status": "ready_to_apply",
                "citizen_data": {
                    k: {"value": v["value"] if isinstance(v, dict) else v, "source": "Test", "confidence": 0.95}
                    for k, v in journey.known_facts.items()
                }
            }
            await set_active_journey(sync_payload)

            active_res = await get_active_journey()
            self.assertEqual(active_res["status"], "success")
            active_data = active_res["journey"]
            self.assertEqual(active_data["journey_id"], "JRN_E2E_9999")
            self.assertEqual(active_data["citizen_data"]["annual_income"]["value"], 400000)
            self.assertEqual(active_data["citizen_data"]["state"]["value"], "Rajasthan")
            self.assertEqual(active_data["citizen_data"]["full_name"]["value"], "Rahul Sharma")

            ext_res = await extract_field_endpoint(FieldExtractionRequest(
                field="date_of_birth",
                text="14 March 2006"
            ))
            self.assertEqual(ext_res.status, "success")
            self.assertEqual(ext_res.value, "2006-03-14")

            bad_income = await extract_field_endpoint(FieldExtractionRequest(
                field="annual_income",
                text="Not sure"
            ))
            self.assertEqual(bad_income.status, "needs_clarification")

        asyncio.run(test_backend_sync())


if __name__ == "__main__":
    unittest.main()
