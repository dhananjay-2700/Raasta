import re
import string
import logging
from typing import Dict, Any, Optional

from agent.journey_context import JourneyContext
from agent.brain.brain import RAASTABrain
from agent.brain.schemas import BrainDecision
from ml.pipeline import RAASTAPipeline
from ml.pipeline_schemas import PipelineRequest
from ml.nba_schemas import ApplicationState
from ml.extraction import _normalize_value

logger = logging.getLogger("RAASTA.ConversationEngine")

EXIT_COMMANDS = {"done", "stop", "cancel", "exit", "quit", "nevermind", "abort"}

INDIAN_STATES = {
    "andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh",
    "goa", "gujarat", "haryana", "himachal pradesh", "jharkhand", "karnataka",
    "kerala", "madhya pradesh", "maharashtra", "manipur", "meghalaya", "mizoram",
    "nagaland", "odisha", "punjab", "rajasthan", "sikkim", "tamil nadu",
    "telangana", "tripura", "uttar pradesh", "uttarakhand", "west bengal",
    "delhi", "jammu and kashmir", "ladakh", "puducherry", "chandigarh",
    "andaman and nicobar", "dadra and nagar haveli and daman and diu"
}

FRIENDLY_FIELD_QUESTIONS = {
    "annual_income": "I need your family's approximate annual income to check the eligibility. Roughly how much is it?",
    "state": "Which state do you currently reside in?",
    "district": "Which district do you live in?",
    "date_of_birth": "What is your date of birth?",
    "age": "How old are you?",
    "gender": "What is your gender?",
    "is_farmer": "Are you or your family engaged in farming or agriculture?",
    "landholding_status": "Do you own cultivable agricultural land?",
    "has_existing_lpg_connection": "Does your household already have an LPG gas connection?",
    "owns_pucca_house": "Do you or your family own a pucca house?",
    "class_12_percentile": "What was your Class 12 board percentile or percentage?",
    "previous_class_marks_percentage": "What were your previous class marks percentage?",
    "is_regular_course": "Is she enrolled in a full-time regular degree course?",
    "receiving_other_scholarship": "Is she currently receiving any other government scholarship?"
}


class ConversationTurnResponse:
    def __init__(self, spoken_text: str, should_continue: bool, journey: JourneyContext):
        self.spoken_text = spoken_text
        self.should_continue = should_continue
        self.journey = journey

    def to_dict(self) -> Dict[str, Any]:
        return {
            "spoken_text": self.spoken_text,
            "should_continue": self.should_continue,
            "journey": self.journey.to_dict()
        }


class RAASTAConversationEngine:
    """
    Stateful conversational orchestrator for RAASTA.
    Coordinates citizen voice dialogue with the RAASTA Brain and authoritative ML pipeline.
    """
    def __init__(
        self,
        pipeline: Optional[RAASTAPipeline] = None,
        brain: Optional[RAASTABrain] = None
    ):
        self.pipeline = pipeline or RAASTAPipeline()
        self.brain = brain or RAASTABrain()

    def process_turn(self, citizen_text: str, journey: Optional[JourneyContext] = None) -> ConversationTurnResponse:
        """
        Processes a single conversational turn from the citizen.
        """
        journey = journey or JourneyContext()

        if not citizen_text or not citizen_text.strip():
            return ConversationTurnResponse(
                spoken_text="I didn't quite catch that. Could you please repeat?",
                should_continue=True,
                journey=journey
            )

        clean_text = citizen_text.strip()
        normalized_cmd = clean_text.lower().translate(str.maketrans('', '', string.punctuation)).strip()

        # 1. RAASTA Brain: Conversational Interpretation & Intent Understanding
        decision = self.brain.interpret_turn(clean_text, journey)

        # Handle Exit / Cancellation
        if normalized_cmd in EXIT_COMMANDS or decision.is_cancellation:
            journey.record_turn("citizen", clean_text)
            reply = "Ending session. Your journey details are saved. You can resume anytime."
            journey.record_turn("raasta", reply)
            journey.current_stage = "completed"
            return ConversationTurnResponse(
                spoken_text=reply,
                should_continue=False,
                journey=journey
            )

        # Handle Restart
        if decision.is_restart:
            journey.record_turn("citizen", clean_text)
            journey.current_stage = "understanding"
            journey.selected_scheme = None
            journey.known_facts = {}
            journey.missing_facts = []
            journey.pending_field = None
            reply = "Starting over. How can I help you today with government schemes?"
            journey.record_turn("raasta", reply)
            return ConversationTurnResponse(
                spoken_text=reply,
                should_continue=True,
                journey=journey
            )

        journey.record_turn("citizen", clean_text)

        # 2. Apply Brain-proposed facts through deterministic validation
        accepted_facts, rejected_facts = self.brain.apply_decision_to_journey(decision, journey)

        # 3. Handle Explanation, "I don't know", or Uncertainty directly
        if decision.is_explanation_request or decision.is_dont_know or decision.is_uncertain:
            current_query = " ".join([t["text"] for t in journey.conversation_history if t["role"] == "citizen"])
            pipe_res = self.pipeline.run(PipelineRequest(query=current_query, application_state=ApplicationState()))
            spoken_response = self.brain.synthesize_response(clean_text, pipe_res, journey, decision)
            journey.record_turn("raasta", spoken_response)
            journey.last_question = spoken_response
            return ConversationTurnResponse(
                spoken_text=spoken_response,
                should_continue=True,
                journey=journey
            )

        # 4. Fallback deterministic pending field resolution if pending field is still unresolved
        if journey.pending_field and journey.pending_field not in journey.known_facts:
            field = journey.pending_field
            resolved_value = self._resolve_pending_field(field, clean_text)

            if resolved_value is not None:
                journey.add_fact(field, resolved_value, source="Citizen Conversation")
                journey.last_answer = clean_text
                journey.pending_field = None
                logger.info(f"Resolved pending field '{field}' = {resolved_value}")
            else:
                # Spoken input did not satisfy the expected field type.
                # Check if citizen provided other useful facts out of order.
                extra_facts = self._detect_out_of_order_facts(clean_text, exclude_field=field)
                for k, v in extra_facts.items():
                    if k not in journey.known_facts:
                        journey.add_fact(k, v, source="Citizen Conversation")
                        accepted_facts.append(f"{k} as {v}")
                        logger.info(f"Salvaged out-of-order fact '{k}' = {v}")

                field_label = field.replace('_', ' ')
                reprompt = FRIENDLY_FIELD_QUESTIONS.get(
                    field,
                    f"Could you please provide your {field_label}?"
                )
                if accepted_facts:
                    ack = ", ".join(f.replace('_', ' ') for f in accepted_facts)
                    spoken_response = f"I noted your {ack}. However, to check your eligibility, {reprompt}"
                else:
                    spoken_response = f"I didn't quite get a valid {field_label}. {reprompt}"

                journey.record_turn("raasta", spoken_response)
                journey.last_question = spoken_response
                return ConversationTurnResponse(
                    spoken_text=spoken_response,
                    should_continue=True,
                    journey=journey
                )

        # 5. Construct Unified Enriched Query for RAASTA ML Pipeline
        accumulated_query_parts = []
        for turn in journey.conversation_history:
            if turn["role"] == "citizen":
                accumulated_query_parts.append(turn["text"])

        # Add explicit mentions of confirmed facts to guide retrieval and extraction
        for field, fact in journey.known_facts.items():
            val = fact["value"] if isinstance(fact, dict) else fact
            if field == "annual_income":
                accumulated_query_parts.append(f"My annual income is {val}.")
            elif field == "state":
                accumulated_query_parts.append(f"I live in {val}.")
            elif field == "age":
                accumulated_query_parts.append(f"My age is {val}.")
            elif field == "class_12_percentile":
                accumulated_query_parts.append(f"My Class 12 percentage is {val}%.")

        full_query = " ".join(accumulated_query_parts)

        # 6. Run authoritative RAASTA ML Pipeline
        req = PipelineRequest(
            query=full_query,
            application_state=ApplicationState(
                uploaded_documents=journey.uploaded_documents,
                reviewed=False,
                consent_given=False,
                submitted=False
            )
        )

        pipeline_res = self.pipeline.run(req)

        # 7. Absorb Pipeline Extraction Facts into Journey Context
        if pipeline_res.selected_scheme:
            journey.selected_scheme = pipeline_res.selected_scheme

        if pipeline_res.extraction and pipeline_res.extraction.entities:
            for k, entity in pipeline_res.extraction.entities.items():
                if entity.value is not None and k not in journey.known_facts:
                    journey.add_fact(k, entity.value, source=entity.source or "Citizen Conversation")

        # 8. Generate Natural Conversational Response via Brain (grounded strictly in pipeline)
        try:
            spoken_response = self.brain.synthesize_response(clean_text, pipeline_res, journey, decision)
        except Exception as e:
            logger.warning(f"Brain synthesis failed ({e}), falling back to deterministic response")
            spoken_response = self._synthesize_response(pipeline_res, journey)

        journey.record_turn("raasta", spoken_response)
        journey.last_question = spoken_response

        return ConversationTurnResponse(
            spoken_text=spoken_response,
            should_continue=True,
            journey=journey
        )

    def _resolve_pending_field(self, field: str, text: str) -> Any:
        """
        Deterministically extracts and type-validates a field value when RAASTA explicitly asked for it.
        Returns None if the spoken text cannot be validated as the expected type.
        """
        text_clean = text.lower().strip()

        # A. Annual Income
        if field == "annual_income":
            word_to_num = {
                "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
                "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10
            }
            norm_text = text_clean
            for w, n in word_to_num.items():
                norm_text = re.sub(rf'\b{w}\b', str(n), norm_text)

            digits = re.search(r'(\d+(?:\.\d+)?)', norm_text)
            if digits:
                num = float(digits.group(1))
                if "lakh" in norm_text or "lac" in norm_text:
                    return int(num * 100000)
                elif "thousand" in norm_text:
                    return int(num * 1000)
                elif num < 100:  # e.g., citizen says "4" meaning 4 lakh
                    return int(num * 100000)
                else:
                    return int(num)
            return None

        # B. Percentage / Marks (e.g. class_12_percentile, previous_class_marks_percentage)
        elif field in ["class_12_percentile", "previous_class_marks_percentage"]:
            digits = re.search(r'(\d{1,3}(?:\.\d+)?)\s*(?:%|percent)?', text_clean)
            if digits:
                val = float(digits.group(1))
                if 0 <= val <= 100:
                    return int(val) if val.is_integer() else val
            return None

        # C. Age
        elif field == "age":
            digits = re.search(r'\b(\d{1,3})\b', text_clean)
            if digits:
                val = int(digits.group(1))
                if 1 <= val <= 120:
                    return val
            return None

        # D. State
        elif field == "state":
            clean = re.sub(r'^(i\s+live\s+in|it\s+is|my\s+state\s+is)\s+', '', text_clean).strip().rstrip('.')
            for st in INDIAN_STATES:
                if st in clean or st == clean:
                    return st.title()
            if len(clean) > 2 and clean.replace(' ', '').isalpha():
                return clean.title()
            return None

        # E. District
        elif field == "district":
            clean = re.sub(r'^(i\s+live\s+in|it\s+is|my\s+district\s+is)\s+', '', text_clean).strip().rstrip('.')
            if len(clean) > 2 and clean.replace(' ', '').isalpha():
                return clean.title()
            return None

        # F. Date of Birth
        elif field in ["date_of_birth", "dob"]:
            match = re.search(r'(\d{1,2}\s+[a-zA-Z]+\s+\d{4})', text)
            if match:
                return match.group(1)
            match_iso = re.search(r'(\d{4}-\d{2}-\d{2})', text)
            if match_iso:
                return match_iso.group(1)
            return text.strip() if len(text.strip()) >= 4 else None

        # G. Booleans
        elif field in ["is_farmer", "has_existing_lpg_connection", "owns_pucca_house", "is_regular_course", "receiving_other_scholarship"]:
            if any(w in text_clean for w in ["yes", "yeah", "yep", "we do", "i do", "true", "own", "have", "regular", "full time", "full-time"]):
                return True
            if any(w in text_clean for w in ["no", "nope", "don't", "dont", "false", "do not", "never", "not receiving", "no other"]):
                return False
            return None

        # H. Generic Normalization fallback
        norm = _normalize_value(text)
        return norm if norm != text_clean else text.strip()

    def _detect_out_of_order_facts(self, text: str, exclude_field: str = "") -> Dict[str, Any]:
        """
        Scans spoken text for known domain entities (state, income, age, farmer)
        when the citizen spoke an answer that did not match the expected pending field.
        """
        facts = {}
        text_lower = text.lower().strip()

        # 1. Indian States
        if exclude_field != "state":
            for st in INDIAN_STATES:
                if re.search(rf'\b{re.escape(st)}\b', text_lower):
                    facts["state"] = st.title()
                    break

        # 2. Annual Income
        if exclude_field != "annual_income":
            income_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakh|lac|thousand)', text_lower)
            if income_match:
                val = float(income_match.group(1))
                if "thousand" in text_lower:
                    facts["annual_income"] = int(val * 1000)
                else:
                    facts["annual_income"] = int(val * 100000)

        # 3. Age
        if exclude_field != "age":
            age_match = re.search(r'\b(?:i am|age is|aged?)\s*(\d{1,2})\b', text_lower)
            if age_match:
                facts["age"] = int(age_match.group(1))

        # 4. Farmer
        if exclude_field != "is_farmer":
            if any(w in text_lower for w in ["farmer", "kisan", "farming", "agriculture"]):
                facts["is_farmer"] = True

        return facts

    def _synthesize_response(self, pipeline_res, journey: JourneyContext) -> str:
        """
        Transforms structured ML pipeline output into warm, helpful citizen dialogue.
        """
        # Case A: Vague or Insufficient Information initially
        if pipeline_res.status == "insufficient_information" or not pipeline_res.selected_scheme:
            journey.current_stage = "understanding"
            return "Okay, I can help with government services. Could you tell me a little more about what you need? For example, is this for college education, medical treatment, farming, or housing?"

        # Case B: Scheme Found!
        scheme_meta = pipeline_res.selected_scheme
        journey.selected_scheme = scheme_meta
        scheme_name = scheme_meta.get("scheme_name", "a matching government scheme")

        # Check Eligibility State
        el = pipeline_res.eligibility
        if not el:
            journey.current_stage = "retrieved"
            return f"I found a relevant service: {scheme_name}. Let me check your eligibility."

        # Case C: Missing Eligibility Information
        if el.status == "needs_information" and el.missing_information:
            # Only consider fields that are not already known in the journey
            unresolved_missing = [
                m.field for m in el.missing_information
                if m.field not in journey.known_facts
            ]
            journey.missing_facts = unresolved_missing

            if unresolved_missing:
                journey.current_stage = "needs_information"
                # Prioritize annual_income first if still unresolved
                if "annual_income" in unresolved_missing:
                    next_missing = "annual_income"
                elif pipeline_res.next_best_action and pipeline_res.next_best_action.required_item in unresolved_missing:
                    next_missing = pipeline_res.next_best_action.required_item
                else:
                    next_missing = unresolved_missing[0]

                journey.pending_field = next_missing

                # Friendly question
                question_text = FRIENDLY_FIELD_QUESTIONS.get(
                    next_missing,
                    f"To check your eligibility for {scheme_name}, I need to know your {next_missing.replace('_', ' ')}. Could you provide that?"
                )

                if len(journey.conversation_history) <= 3:
                    return f"I found the {scheme_name}. {question_text}"
                return question_text
            else:
                # All required missing facts have been supplied in known_facts
                journey.current_stage = "eligible"
                journey.pending_field = None
                return f"Thank you for providing those details. Based on your verified information, you qualify for {scheme_name}."

        # Case D: Ineligible
        if el.status == "ineligible":
            journey.current_stage = "ineligible"
            reasons = [f.explanation for f in el.failed_rules if hasattr(f, 'explanation')]
            reason_str = reasons[0] if reasons else "the criteria are not met"
            return f"I checked the requirements for {scheme_name}. Unfortunately, you may not qualify because {reason_str}."

        # Case E: Eligible!
        if el.status in ["eligible", "conditionally_eligible"]:
            journey.current_stage = "eligible"

            # Check next best action
            nba = pipeline_res.next_best_action
            if nba and nba.action_type == "upload_document":
                doc_name = nba.required_item or "required document"
                return f"Great news! Based on your details, you qualify for the {scheme_name}. The next step is to prepare your {doc_name}."
            elif nba and nba.action_type == "review_application":
                return f"Great news! You qualify for the {scheme_name}. All initial information is verified. Would you like to review and proceed to apply?"
            else:
                return f"Great news! Based on your information, you meet the eligibility criteria for {scheme_name}."

        return f"I've matched your request to {scheme_name}. Let me know if you would like to proceed."
