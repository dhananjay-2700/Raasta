from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class ProposedFact(BaseModel):
    """Represents a factual entity extracted or updated by the Brain."""
    value: Any
    confidence: float = 0.90
    source: str = "Citizen Conversation"
    reasoning: Optional[str] = None


class BrainDecision(BaseModel):
    """
    Strict structured output from the conversational Brain.
    Contains conversational reasoning and proposed factual mutations
    which must be deterministically validated before entering state.
    """
    intent: str = "general_assistance"
    understood: str = ""
    facts_to_add: Dict[str, ProposedFact] = Field(default_factory=dict)
    facts_to_correct: Dict[str, ProposedFact] = Field(default_factory=dict)
    facts_to_ignore: Dict[str, Any] = Field(default_factory=dict)
    is_correction: bool = False
    is_uncertain: bool = False
    is_dont_know: bool = False
    is_explanation_request: bool = False
    is_cancellation: bool = False
    is_restart: bool = False
    next_action: Optional[str] = None
    response: Optional[str] = None
    needs_clarification: bool = False


class BrainContext(BaseModel):
    """Snapshot of the journey passed into the Brain for dialogue reasoning."""
    journey_id: str
    current_stage: str
    selected_scheme: Optional[Dict[str, Any]] = None
    known_facts: Dict[str, Any] = Field(default_factory=dict)
    missing_facts: List[str] = Field(default_factory=list)
    pending_field: Optional[str] = None
    last_question: Optional[str] = None
    recent_history: List[Dict[str, str]] = Field(default_factory=list)
