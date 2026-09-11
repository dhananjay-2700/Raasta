from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

from ml.schemas import CitizenInformation
from ml.eligibility_schemas import EligibilityResponse
from ml.evidence_schemas import ProvenanceReport
from ml.nba_schemas import NextBestAction, ApplicationState

class PipelineRequest(BaseModel):
    query: str = Field(description="The natural language query from the citizen.")
    application_state: Optional[ApplicationState] = None

class PipelineResponse(BaseModel):
    status: str = Field(description="'success', 'insufficient_information', 'no_relevant_scheme', 'error'")
    query: str
    extraction: Optional[CitizenInformation] = None
    retrieval: Optional[Dict[str, Any]] = None
    selected_scheme: Optional[Dict[str, str]] = None
    eligibility: Optional[EligibilityResponse] = None
    provenance: Optional[ProvenanceReport] = None
    next_best_action: Optional[NextBestAction] = None
    error_message: Optional[str] = None
    diagnostics: Optional[Dict[str, Any]] = Field(default=None, description="Internal telemetry and flow tracing. Do not show to citizens.")
