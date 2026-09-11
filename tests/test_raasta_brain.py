import json
import unittest
from typing import Optional

from agent.journey_context import JourneyContext
from agent.brain.schemas import BrainDecision, ProposedFact, BrainContext
from agent.brain.validator import DeterministicFactValidator
from agent.brain.providers import BaseLLMProvider, MockBrainProvider
from agent.brain.brain import RAASTABrain
from agent.conversation_engine import RAASTAConversationEngine
from ml.pipeline import RAASTAPipeline, PipelineRequest, ApplicationState
from ml.extraction import MockExtractionProvider


class TestRAASTABrain(unittest.TestCase):
    """
    Comprehensive test suite for RAASTA Brain covering all 17 conversational,
    reasoning, error handling, and guardrail scenarios.
    """

    def setUp(self):
        self.mock_llm = MockBrainProvider()
        self.brain = RAASTABrain(provider=self.mock_llm)
        self.mock_ml = MockExtractionProvider()
        self.pipeline = RAASTAPipeline(extraction_provider=self.mock_ml)
        self.engine = RAASTAConversationEngine(pipeline=self.pipeline, brain=self.brain)

    # --------------------------------------------------------------------------
    # Scenario 1: Initial Natural Language Query Understanding
    # --------------------------------------------------------------------------
    def test_scenario_01_initial_education_query_understanding(self):
        """Citizen expresses education need; Brain understands intent and pipeline retrieves scheme."""
        journey = JourneyContext()
        turn = self.engine.process_turn(
            "My daughter got admission to college but we cannot afford the fees.",
            journey
        )
        self.assertTrue(turn.should_continue)
        self.assertIsNotNone(journey.selected_scheme)
        self.assertEqual(journey.selected_scheme.get("scheme_id"), "PM_USP_CSS")
        self.assertEqual(journey.current_stage, "needs_information")
        self.assertEqual(journey.pending_field, "annual_income")
        self.assertIn("income", turn.spoken_text.lower())

    # --------------------------------------------------------------------------
    # Scenario 2: Pending Income Follow-up Resolution
    # --------------------------------------------------------------------------
    def test_scenario_02_pending_income_follow_up(self):
        """Citizen responds to income question with conversational phrasing ('It is 4 lakh')."""
        journey = JourneyContext()
        self.engine.process_turn("My daughter got admission to college but we cannot afford the fees.", journey)
        self.assertEqual(journey.pending_field, "annual_income")

        turn2 = self.engine.process_turn("It is 4 lakh.", journey)
        self.assertEqual(journey.get_fact_value("annual_income"), 400000)
        self.assertNotEqual(journey.pending_field, "annual_income")

    # --------------------------------------------------------------------------
    # Scenario 3: Out-of-order State Extraction
    # --------------------------------------------------------------------------
    def test_scenario_03_out_of_order_state_extraction(self):
        """Citizen provides 'Rajasthan.' when asked for Class 12 percentage; marks remain uncorrupted."""
        journey = JourneyContext()
        journey.pending_field = "class_12_percentile"

        turn = self.engine.process_turn("Rajasthan.", journey)
        # Percentage must not be corrupted
        self.assertIsNone(journey.get_fact_value("class_12_percentile"))
        # Pending field remains marks
        self.assertEqual(journey.pending_field, "class_12_percentile")
        # State salvaged and committed
        self.assertEqual(journey.get_fact_value("state"), "Rajasthan")
        self.assertIn("Rajasthan", turn.spoken_text)
        self.assertIn("Class 12", turn.spoken_text)

    # --------------------------------------------------------------------------
    # Scenario 4: Invalid Numeric Response Rejection by Validator
    # --------------------------------------------------------------------------
    def test_scenario_04_invalid_fact_rejection_by_validator(self):
        """DeterministicFactValidator safely rejects type violations and invalid ranges."""
        # Annual income cannot be a state name
        valid, val, reason = DeterministicFactValidator.validate_fact("annual_income", "Rajasthan")
        self.assertFalse(valid)
        self.assertIn("not a valid numeric income", reason)

        # Negative income rejected
        valid, val, reason = DeterministicFactValidator.validate_fact("annual_income", -50000)
        self.assertFalse(valid)

        # Class 12 percentile > 100 rejected
        valid, val, reason = DeterministicFactValidator.validate_fact("class_12_percentile", 105)
        self.assertFalse(valid)
        self.assertIn("between 0 and 100", reason)

        # Invalid Indian state rejected
        valid, val, reason = DeterministicFactValidator.validate_fact("state", "Atlantis")
        self.assertFalse(valid)
        self.assertIn("not a recognized Indian state", reason)

    # --------------------------------------------------------------------------
    # Scenario 5: Fact Correction
    # --------------------------------------------------------------------------
    def test_scenario_05_fact_correction(self):
        """Citizen corrects previous fact: 'Actually our income is 5 lakh, not 4'."""
        journey = JourneyContext()
        journey.add_fact("annual_income", 400000, source="Initial Turn")
        self.assertEqual(journey.get_fact_value("annual_income"), 400000)

        decision = self.brain.interpret_turn("Actually our income is 5 lakh, not 4", journey)
        self.assertTrue(decision.is_correction)
        self.assertIn("annual_income", decision.facts_to_correct)

        accepted, rejected = self.brain.apply_decision_to_journey(decision, journey)
        self.assertEqual(journey.get_fact_value("annual_income"), 500000)
        self.assertEqual(len(rejected), 0)

    # --------------------------------------------------------------------------
    # Scenario 6: 'I don't know' Handling
    # --------------------------------------------------------------------------
    def test_scenario_06_dont_know_handling(self):
        """Citizen says 'I don't know'; assistant offers document check rather than repetitive loop."""
        journey = JourneyContext()
        journey.pending_field = "class_12_percentile"

        turn = self.engine.process_turn("I don't know.", journey)
        self.assertTrue(turn.should_continue)
        self.assertIn("documents", turn.spoken_text.lower())
        self.assertIn("class 12 percentile", turn.spoken_text.lower())

    # --------------------------------------------------------------------------
    # Scenario 7: Ambiguous / Uncertain Response
    # --------------------------------------------------------------------------
    def test_scenario_07_uncertainty_handling(self):
        """Citizen expresses uncertainty ('I think around four or five lakh'); Brain flags uncertainty."""
        journey = JourneyContext()
        decision = self.brain.interpret_turn("I think our income is around four or five lakh", journey)
        self.assertTrue(decision.is_uncertain)
        self.assertTrue(decision.needs_clarification)

        turn = self.engine.process_turn("I think our income is around four or five lakh", journey)
        self.assertIn("sure", turn.spoken_text.lower())

    # --------------------------------------------------------------------------
    # Scenario 8: Explanation Request
    # --------------------------------------------------------------------------
    def test_scenario_08_explanation_request(self):
        """Citizen asks 'Why do you need my income?'; Brain cites official scheme rule."""
        journey = JourneyContext()
        self.engine.process_turn("My daughter got admission to college but we cannot afford the fees.", journey)
        self.assertEqual(journey.pending_field, "annual_income")

        turn = self.engine.process_turn("Why do you need my income?", journey)
        self.assertTrue(turn.should_continue)
        self.assertIn("guidelines", turn.spoken_text.lower())
        self.assertIn("income", turn.spoken_text.lower())

    # --------------------------------------------------------------------------
    # Scenario 9: Eligibility Explanation
    # --------------------------------------------------------------------------
    def test_scenario_09_eligibility_explanation(self):
        """When citizen satisfies all criteria, Brain provides affirmative explanation with next steps."""
        journey = JourneyContext()
        journey.add_fact("annual_income", 400000)
        journey.add_fact("class_12_percentile", 82)
        journey.add_fact("is_regular_course", True)
        journey.add_fact("receiving_other_scholarship", False)

        req = PipelineRequest(
            query="My daughter got admission to college but we cannot afford the fees. My annual income is 4 lakh. My Class 12 marks are 82%.",
            application_state=ApplicationState()
        )
        res = self.pipeline.run(req)
        decision = BrainDecision(intent="check_status", understood="Citizen is eligible")
        spoken = self.brain.synthesize_response("Check status", res, journey, decision)

        self.assertIn("qualify", spoken.lower())
        self.assertIn("income certificate", spoken.lower())

    # --------------------------------------------------------------------------
    # Scenario 10: Ineligibility Explanation (Strictly Failed Rules)
    # --------------------------------------------------------------------------
    def test_scenario_10_ineligibility_explanation_strictly_failed_rules(self):
        """When citizen is ineligible, Brain quotes only the exact failed rule from the deterministic engine."""
        journey = JourneyContext()
        journey.add_fact("annual_income", 500000)  # Exceeds PM_USP_CSS limit of 450000
        journey.add_fact("class_12_percentile", 85)
        journey.add_fact("is_regular_course", True)
        journey.add_fact("receiving_other_scholarship", False)

        req = PipelineRequest(
            query="My daughter got admission to college. My annual income is 5 lakh.",
            application_state=ApplicationState()
        )
        res = self.pipeline.run(req)
        self.assertEqual(res.eligibility.status, "ineligible")

        decision = BrainDecision(intent="check_status", understood="Citizen status check")
        spoken = self.brain.synthesize_response("Am I eligible?", res, journey, decision)

        self.assertIn("not qualify", spoken.lower())
        # Must reflect the income rule failure
        self.assertTrue("income" in spoken.lower() or "450000" in spoken.lower())

    # --------------------------------------------------------------------------
    # Scenario 11: Cancellation
    # --------------------------------------------------------------------------
    def test_scenario_11_cancellation(self):
        """Citizen says 'Cancel' or 'Stop'; session safely terminates."""
        journey = JourneyContext()
        turn = self.engine.process_turn("Cancel", journey)
        self.assertFalse(turn.should_continue)
        self.assertEqual(journey.current_stage, "completed")
        self.assertIn("Ending session", turn.spoken_text)

    # --------------------------------------------------------------------------
    # Scenario 12: Restart
    # --------------------------------------------------------------------------
    def test_scenario_12_restart(self):
        """Citizen says 'Start over'; journey state and stage reset cleanly."""
        journey = JourneyContext()
        journey.add_fact("annual_income", 300000)
        self.assertEqual(len(journey.known_facts), 1)

        turn = self.engine.process_turn("Start over", journey)
        self.assertTrue(turn.should_continue)
        self.assertEqual(journey.current_stage, "understanding")
        self.assertEqual(len(journey.known_facts), 0)
        self.assertIn("Starting over", turn.spoken_text)

    # --------------------------------------------------------------------------
    # Scenario 13: Confirmation
    # --------------------------------------------------------------------------
    def test_scenario_13_confirmation(self):
        """Citizen says 'Yes' or 'Continue'; Brain marks confirm intent."""
        journey = JourneyContext()
        decision = self.brain.interpret_turn("Yes", journey)
        self.assertEqual(decision.intent, "confirm")
        self.assertEqual(decision.next_action, "continue")

    # --------------------------------------------------------------------------
    # Scenario 14: Hindi / Hinglish Input Understanding
    # --------------------------------------------------------------------------
    def test_scenario_14_hindi_hinglish_understanding(self):
        """Citizen speaks in Hinglish ('Meri beti ka college admission...'); Brain extracts intent."""
        journey = JourneyContext()
        decision = self.brain.interpret_turn(
            "Meri beti ka college admission ho gaya hai par fees ke paise nahi hain",
            journey
        )
        self.assertEqual(decision.intent, "higher_education_financial_assistance")
        self.assertIn("daughter", decision.facts_to_add.get("relationship", {}).value)

    # --------------------------------------------------------------------------
    # Scenario 15: Malformed JSON Recovery (Self-Repair Retry)
    # --------------------------------------------------------------------------
    def test_scenario_15_malformed_json_recovery(self):
        """Brain automatically triggers JSON self-repair when provider produces broken formatting."""
        class BrokenFormattingProvider(BaseLLMProvider):
            def __init__(self):
                self.calls = 0

            def generate(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.1, max_tokens: int = 300) -> str:
                self.calls += 1
                if self.calls == 1:
                    # Broken output: missing closing brace and markdown noise
                    return "Here is the result:\n```json\n{\"intent\": \"general_query\", \"understood\": \"Help requested\""
                else:
                    # Self-repair response: valid JSON
                    return json.dumps({
                        "intent": "general_query",
                        "understood": "Repaired valid JSON output",
                        "facts_to_add": {},
                        "facts_to_correct": {},
                        "next_action": "continue"
                    })

        repair_brain = RAASTABrain(provider=BrokenFormattingProvider())
        journey = JourneyContext()
        decision = repair_brain.interpret_turn("I need some help please", journey)
        self.assertEqual(decision.understood, "Repaired valid JSON output")
        self.assertEqual(decision.intent, "general_query")

    # --------------------------------------------------------------------------
    # Scenario 16: Timeout / Failure Fallback Resilience
    # --------------------------------------------------------------------------
    def test_scenario_16_timeout_failure_fallback(self):
        """When LLM provider throws an unhandled exception or times out, Brain falls back gracefully."""
        class CrashingProvider(BaseLLMProvider):
            def generate(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.1, max_tokens: int = 300) -> str:
                raise TimeoutError("Provider connection timed out after 20s")

        resilient_brain = RAASTABrain(provider=CrashingProvider())
        journey = JourneyContext()

        # Must not raise an exception; must return a graceful fallback decision
        decision = resilient_brain.interpret_turn("Hello RAASTA", journey)
        self.assertIsNotNone(decision)
        self.assertEqual(decision.intent, "general_assistance")
        self.assertEqual(decision.understood, "Hello RAASTA")

    # --------------------------------------------------------------------------
    # Scenario 17: Deterministic Eligibility Strictly Overriding LLM Claims
    # --------------------------------------------------------------------------
    def test_scenario_17_deterministic_engine_strictly_overrides_llm(self):
        """
        CRITICAL GUARDRAIL: Even if the LLM provider prompt hallucinated that the citizen
        is eligible, the deterministic pipeline's 'ineligible' status strictly wins.
        """
        class HallucinatingEligibleProvider(BaseLLMProvider):
            def generate(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.1, max_tokens: int = 300) -> str:
                # LLM attempts to claim the citizen is eligible
                return "Congratulations, you are completely eligible for this grant!"

        hallucinating_brain = RAASTABrain(provider=HallucinatingEligibleProvider())
        journey = JourneyContext()
        # Citizen income exceeds the scheme's limit
        journey.add_fact("annual_income", 500000)
        journey.add_fact("class_12_percentile", 85)

        # Run authoritative pipeline
        req = PipelineRequest(
            query="My daughter got admission to college. My annual income is 5 lakh.",
            application_state=ApplicationState()
        )
        pipe_res = self.pipeline.run(req)
        # Verify pipeline deterministically ruled ineligible
        self.assertEqual(pipe_res.eligibility.status, "ineligible")

        # Synthesize response
        decision = BrainDecision(intent="check", understood="Status query")
        spoken = hallucinating_brain.synthesize_response("Am I eligible?", pipe_res, journey, decision)

        # The deterministic ineligibility MUST strictly win
        self.assertIn("not qualify", spoken.lower())
        self.assertNotIn("congratulations, you are completely eligible", spoken.lower())
        self.assertEqual(journey.current_stage, "ineligible")


if __name__ == "__main__":
    unittest.main()