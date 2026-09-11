from pydantic import BaseModel, Field
from typing import List, Optional

class Evidence(BaseModel):
    title: Optional[str] = None
    source_name: str
    source_url: str
    reference: str

class SchemeResult(BaseModel):
    scheme_id: str
    scheme_name: str
    score: float
    match_reasons: List[str]
    evidence: List[Evidence]

class RetrievalResponse(BaseModel):
    query: str
    results: List[SchemeResult]
    status: str = Field(description="E.g., 'success', 'no_relevant_scheme', 'insufficient_information'")
