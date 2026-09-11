from typing import Dict, Any, List, Optional
import uuid
import time

class JourneyContext:
    """
    Represents the citizen-service journey state across multi-turn voice dialogue.
    Maintains known facts, pending queries, and current scheme progression.
    """
    def __init__(self, journey_id: Optional[str] = None):
        self.journey_id = journey_id or f"JRN_{uuid.uuid4().hex[:8].upper()}"
        self.current_stage = "understanding"  # "understanding", "retrieved", "needs_information", "eligible", "ready_to_apply", "completed"
        self.selected_scheme: Optional[Dict[str, Any]] = None
        self.known_facts: Dict[str, Any] = {}
        self.missing_facts: List[str] = []
        self.uploaded_documents: List[str] = []
        self.last_question: str = ""
        self.last_answer: str = ""
        self.pending_field: Optional[str] = None
        self.conversation_history: List[Dict[str, str]] = []
        self.created_at = time.time()
        self.updated_at = time.time()

    def add_fact(self, field: str, value: Any, source: str = "Citizen Conversation"):
        """Stores a confirmed citizen fact."""
        self.known_facts[field] = {
            "value": value,
            "source": source,
            "timestamp": time.time()
        }
        # If this fact was in missing_facts, remove it
        if field in self.missing_facts:
            self.missing_facts.remove(field)
        self.updated_at = time.time()

    def get_fact_value(self, field: str) -> Any:
        """Returns the raw value of an extracted fact if present."""
        fact = self.known_facts.get(field)
        if isinstance(fact, dict) and "value" in fact:
            return fact["value"]
        return fact

    def record_turn(self, role: str, text: str):
        """Appends a turn to conversational history."""
        self.conversation_history.append({
            "role": role,
            "text": text,
            "timestamp": time.time()
        })
        self.updated_at = time.time()

    def to_dict(self) -> Dict[str, Any]:
        """Serializes journey context into a dictionary matching RAASTA standards."""
        return {
            "journey_id": self.journey_id,
            "current_stage": self.current_stage,
            "selected_scheme": self.selected_scheme,
            "known_facts": {
                k: (v["value"] if isinstance(v, dict) and "value" in v else v)
                for k, v in self.known_facts.items()
            },
            "missing_facts": list(self.missing_facts),
            "uploaded_documents": list(self.uploaded_documents),
            "last_question": self.last_question,
            "last_answer": self.last_answer,
            "pending_field": self.pending_field,
            "turn_count": len(self.conversation_history)
        }
