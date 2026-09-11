from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

class EntityExtraction(BaseModel):
    value: Any = Field(description="The extracted value, normalized where possible (e.g., numbers for income, booleans for flags).")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0 based on how explicitly the information was stated.")
    source: str = Field(default="Citizen Conversation", description="The source of the extracted information.")

class CitizenInformation(BaseModel):
    intent: str = Field(description="The broad citizen intent, e.g., higher_education_financial_assistance, healthcare_assistance, housing_assistance, farmer_financial_assistance, cooking_fuel_assistance, artisan_livelihood_assistance, street_vendor_financial_assistance, general_government_service, unknown.")
    summary: str = Field(description="A brief summary of the citizen's situation and problem.")
    entities: Dict[str, EntityExtraction] = Field(
        default_factory=dict,
        description="""
A dictionary of extracted entities. Only include fields that are present in the text.
Supported normalized fields include:
- full_name (string)
- age (integer)
- gender (string)
- state (string)
- district (string)
- annual_income (integer)
- occupation (string)
- education_level (string)
- education_mode (string)
- social_category (string)
- disability_status (string)
- is_farmer (boolean)
- owns_pucca_house (boolean)
- has_existing_lpg_connection (boolean)
- is_street_vendor (boolean)
- is_artisan (boolean)
- landholding_status (string)
- receiving_other_scholarship (boolean)
- purpose (string)
- relationship (string)
"""
    )
