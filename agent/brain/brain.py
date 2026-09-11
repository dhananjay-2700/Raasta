import json
import re
import logging
from typing import Optional, Dict, Any, List, Tuple

from agent.brain.schemas import BrainDecision, ProposedFact, BrainContext
from agent.brain.prompts import BRAIN_INTERPRETATION_PROMPT, BRAIN_SYNTHESIS_PROMPT
from agent.brain.providers import BaseLLMProvider, OllamaProvider, MockBrainProvider
from agent.brain.validator import DeterministicFactValidator
from agent.journey_context import JourneyContext

logger = logging.getLogger("RAASTA.Brain")


class RAASTABrain:
    """
    RAASTA Conversational Reasoning Brain.
    Orchestrates LLM understanding, dialogue reasoning, context tracking,
    and response synthesis while strictly delegating all government eligibility
    and evidence decisions to the deterministic RAASTA pipeline.
    """
    def __init__(self, provider: Optional[BaseLLMProvider] = None):
        if provider:
            self.provider = provider
        else:
            try:
                ollama = OllamaProvider()
                if ollama.is_available():
                    self.provider = ollama
                    logger.info(f"RAASTABrain initialized with Ollama ({ollama.active_model})")
                else:
                    logger.info("Ollama server not reachable, using MockBrainProvider fallback")
                    self.provider = MockBrainProvider()
            except Exception as e:
                logger.warning(f"OllamaProvider initialization failed ({e}), using MockBrainProvider fallback")
                self.provider = MockBrainProvider()

        self.validator = DeterministicFactValidator

    def _extract_and_parse_json(self, text: str) -> Optional[dict]:
        """Tries to extract and parse structured JSON from model output."""
        clean_text = text.strip()

        # Step 1: Strip markdown codeblocks
        code_block_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", clean_text, re.DOTALL)
        if code_block_match:
            clean_text = code_block_match.group(1).strip()
        else:
            # Step 2: Extract text between the first '{' and last '}'
            start = clean_text.find('{')
            end = clean_text.rfind('}') + 1
            if start != -1 and end > start:
                clean_text = clean_text[start:end].strip()

        try:
            return json.loads(clean_text)
        except json.JSONDecodeError:
            return None

    def interpret_turn(self, citizen_text: str, journey: JourneyContext) -> BrainDecision:
        """
        Uses LLM reasoning to interpret the citizen's utterance in the full context
        of their journey, pending questions, and dialogue history.
        """
        recent_turns = []
        for t in journey.conversation_history[-4:]:
            role = "Citizen" if t.get("role") == "citizen" else "RAASTA"
            recent_turns.append(f"{role}: {t.get('text', '')}")
        history_str = "\n".join(recent_turns) if recent_turns else "None"

        selected_scheme_name = (
            journey.selected_scheme.get("scheme_name", "None")
            if journey.selected_scheme else "None"
        )

        prompt = BRAIN_INTERPRETATION_PROMPT.format(
            journey_id=journey.journey_id,
            current_stage=journey.current_stage,
            selected_scheme_name=selected_scheme_name,
            known_facts=json.dumps(journey.known_facts, default=str),
            pending_field=journey.pending_field or "None",
            last_question=journey.last_question or "None",
            recent_history=history_str,
            citizen_text=citizen_text
        )

        try:
            raw_response = self.provider.generate(prompt, temperature=0.1, max_tokens=350)
            parsed_json = self._extract_and_parse_json(raw_response)

            # JSON Self-Repair layer (SUNDAY architecture pattern)
            if not parsed_json:
                logger.warning("[BRAIN] Malformed JSON received from provider. Triggering self-repair retry...")
                repair_prompt = (
                    "The previous output was not valid JSON. Return ONLY the raw valid JSON object:\n\n"
                    f"{raw_response}"
                )
                repaired = self.provider.generate(repair_prompt, temperature=0.0, max_tokens=300)
                parsed_json = self._extract_and_parse_json(repaired)

            if parsed_json:
                return BrainDecision(**parsed_json)

        except Exception as e:
            logger.error(f"[BRAIN] Provider error during interpretation: {e}")

        # Graceful fallback heuristic
        return BrainDecision(
            intent="general_assistance",
            understood=citizen_text,
            facts_to_add={},
            facts_to_correct={},
            needs_clarification=False
        )

    def apply_decision_to_journey(
        self,
        decision: BrainDecision,
        journey: JourneyContext
    ) -> Tuple[List[str], List[str]]:
        """
        Validates all facts proposed by the Brain through the deterministic validator
        and commits only verified facts to JourneyContext.
        Returns: (accepted_facts: List[str], rejected_facts: List[str])
        """
        accepted = []
        rejected = []

        # 1. Process Corrections
        if decision.is_correction and decision.facts_to_correct:
            for field, prop in decision.facts_to_correct.items():
                is_valid, norm_val, reason = self.validator.validate_fact(field, prop.value)
                if is_valid:
                    journey.add_fact(field, norm_val, source="Citizen Correction")
                    accepted.append(f"{field} = {norm_val} (correction)")
                    logger.info(f"[BRAIN VALIDATOR] Accepted correction '{field}' = {norm_val}")
                else:
                    rejected.append(f"{field} ({reason})")
                    logger.warning(f"[BRAIN VALIDATOR] Rejected correction '{field}': {reason}")

        # 2. Process Facts to Add
        if decision.facts_to_add:
            for field, prop in decision.facts_to_add.items():
                is_valid, norm_val, reason = self.validator.validate_fact(field, prop.value)
                if is_valid:
                    journey.add_fact(field, norm_val, source=prop.source or "Citizen Conversation")
                    accepted.append(f"{field} = {norm_val}")
                    logger.info(f"[BRAIN VALIDATOR] Accepted fact '{field}' = {norm_val}")
                else:
                    rejected.append(f"{field} ({reason})")
                    logger.warning(f"[BRAIN VALIDATOR] Rejected fact '{field}': {reason}")

        # 3. Handle Pending Field Resolution
        if journey.pending_field:
            if journey.pending_field in journey.known_facts:
                journey.pending_field = None

        return accepted, rejected

    def synthesize_response(
        self,
        citizen_text: str,
        pipeline_res: Any,
        journey: JourneyContext,
        decision: BrainDecision
    ) -> str:
        """
        Synthesizes a warm, respectful conversational response grounded strictly in
        the authoritative pipeline outputs.
        """
        scheme_name = (
            pipeline_res.selected_scheme.get("scheme_name", "Government Assistance Scheme")
            if pipeline_res.selected_scheme else "Government Assistance Program"
        )

        el = pipeline_res.eligibility
        el_status = el.status if el else "retrieved"

        # Check for unresolved missing information
        unresolved_missing = []
        if el and el.status == "needs_information" and el.missing_information:
            unresolved_missing = [
                m.field for m in el.missing_information
                if m.field not in journey.known_facts
            ]

        # 1. Handle Explanation Requests ("Why do you need my income?")
        if decision.is_explanation_request:
            field = journey.pending_field or "this information"
            return (
                f"Under the official guidelines for {scheme_name}, assistance is reserved for households meeting "
                f"specific criteria. We verify your {field.replace('_', ' ')} to confirm you meet the government limits."
            )

        # 2. Handle "I don't know" or Uncertainty
        if decision.is_dont_know:
            field = journey.pending_field or "this detail"
            return (
                f"That's completely fine if you don't know your exact {field.replace('_', ' ')} right now. "
                f"You can check your official documents or marksheet later, or we can check other services."
            )

        if decision.is_uncertain:
            return (
                "Since you're not completely sure, could you check your documents or give an approximate range? "
                "Government eligibility rules require a verified figure."
            )

        # 3. Handle Vague / Insufficient Information
        if pipeline_res.status == "insufficient_information" or not pipeline_res.selected_scheme:
            journey.current_stage = "understanding"
            return "Okay, I can help with government services. Could you tell me a little more about what you need? For example, is this for college education, medical treatment, farming, or housing?"

        # Scheme is identified
        journey.selected_scheme = pipeline_res.selected_scheme

        # 4. Handle Ineligible (Authoritative - NEVER OVERRIDDEN BY LLM)
        if el_status == "ineligible":
            journey.current_stage = "ineligible"
            reasons = [f.explanation for f in el.failed_rules if hasattr(f, 'explanation')]
            reason_str = reasons[0] if reasons else "the mandatory criteria are not met"
            return (
                f"I checked the official requirements for {scheme_name}. Unfortunately, you may not qualify "
                f"because {reason_str}."
            )

        # 5. Handle Missing Information
        if unresolved_missing:
            journey.current_stage = "needs_information"
            journey.missing_facts = unresolved_missing
            if "annual_income" in unresolved_missing:
                next_field = "annual_income"
            elif pipeline_res.next_best_action and pipeline_res.next_best_action.required_item in unresolved_missing:
                next_field = pipeline_res.next_best_action.required_item
            else:
                next_field = unresolved_missing[0]
            journey.pending_field = next_field

            # Friendly question mappings
            friendly_questions = {
                "annual_income": "To verify your eligibility, roughly how much is your family's annual income?",
                "class_12_percentile": "What was her Class 12 board percentile or percentage marks?",
                "is_regular_course": "Is she enrolled in a full-time regular college degree program?",
                "receiving_other_scholarship": "Is she currently receiving any other government scholarship?"
            }
            question = friendly_questions.get(
                next_field,
                f"Could you please provide your {next_field.replace('_', ' ')} to verify eligibility?"
            )

            # Check if an out-of-order fact was acknowledged
            if decision.facts_to_add and next_field not in decision.facts_to_add:
                added_labels = [k.replace('_', ' ') for k in decision.facts_to_add.keys()]
                return f"I have noted your {', '.join(added_labels)}. However, {question}"

            if len(journey.conversation_history) <= 3:
                return f"I found the {scheme_name}. {question}"
            return question

        # 6. Handle Eligible (All missing information resolved)
        if el_status in ["eligible", "conditionally_eligible"] or (el and not unresolved_missing):
            journey.current_stage = "eligible"
            journey.pending_field = None

            nba = pipeline_res.next_best_action
            if nba and nba.action_type == "review_application":
                return (
                    f"Great news! You qualify for {scheme_name}. All initial details are verified. "
                    "Would you like to review and proceed with autofill assistance?"
                )
            else:
                doc_name = (nba.required_item if (nba and nba.action_type == "upload_document" and nba.required_item) else "income certificate")
                return (
                    f"Great news! Based on your verified details, you qualify for {scheme_name}. "
                    f"The next step is to prepare your {doc_name}."
                )

        return f"I have matched your request to {scheme_name}. Let me know if you would like to proceed."
