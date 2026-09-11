from pydantic import BaseModel, Field
from typing import List, Optional, Any

class RuleEvaluation(BaseModel):
    field: str = Field(description="The field being evaluated, e.g., 'annual_income'")
    citizen_value: Any = Field(description="The value provided by the citizen")
    operator: str = Field(description="The logical operator used, e.g., '<='")
    required_value: Any = Field(description="The value required by the scheme rule")
    result: str = Field(description="'pass' or 'fail'")
    explanation: str = Field(description="Human-readable explanation of the evaluation")
    source_reference: Optional[str] = Field(default=None, description="Official evidence reference for the rule")

class MissingInformation(BaseModel):
    field: str
    explanation: str

class VerificationRequired(BaseModel):
    field: str
    explanation: str

class EligibilityResponse(BaseModel):
    scheme_id: str
    scheme_name: str
    status: str = Field(description="Strictly one of: 'eligible', 'ineligible', 'needs_information'")
    matched_rules: List[RuleEvaluation]
    failed_rules: List[RuleEvaluation]
    missing_information: List[MissingInformation]
    verification_required: List[VerificationRequired]
    explanation: str = Field(description="Overall human-readable explanation of the eligibility decision")
