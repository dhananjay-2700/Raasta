from pydantic import BaseModel, Field
from typing import Optional, List

class ApplicationState(BaseModel):
    reviewed: bool = False
    consent_given: bool = False
    submitted: bool = False
    application_id: Optional[str] = None
    uploaded_documents: List[str] = Field(
        default_factory=list, 
        description="List of document names the citizen has already uploaded"
    )

class NextBestAction(BaseModel):
    action_type: str = Field(description="Strictly one of: request_information, upload_document, verify_information, review_application, give_consent, submit_application, track_application, no_action")
    title: str = Field(description="Citizen-friendly title, e.g., 'Upload your income certificate'")
    description: str = Field(description="Brief explanation of the action")
    priority: str = Field(description="Strictly one of: 'high', 'medium', 'low'")
    reason: str = Field(description="System reason why this action was selected")
    required_item: Optional[str] = Field(default=None, description="The specific field, document, or id needed")
