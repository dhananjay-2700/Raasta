from pydantic import BaseModel, Field
from typing import List, Optional, Any

class OfficialEvidence(BaseModel):
    source_name: str = Field(description="The name of the official source, e.g. National Scholarship Portal")
    source_url: str = Field(description="The exact URL where this rule is defined, or 'evidence_unavailable'")
    reference: str = Field(description="Specific text, section, or description from the source")

class ProvenanceRecord(BaseModel):
    field: str
    value: Any
    confidence: float
    source_type: str = Field(description="'citizen_conversation', 'document', 'official_government_source', 'system'")
    source_description: str

class RuleEvidence(BaseModel):
    field: str
    operator: str
    required_value: Any
    result: str = Field(description="'pass', 'fail', 'missing', or 'verification_required'")
    citizen_provenance: Optional[ProvenanceRecord] = None
    official_evidence: Optional[OfficialEvidence] = None
    explanation: str

class ProvenanceReport(BaseModel):
    scheme_id: str
    eligibility_status: str
    rule_provenance_chain: List[RuleEvidence]
