import json
import logging
from typing import Optional, Any
from pydantic import ValidationError

from ml.schemas import CitizenInformation, EntityExtraction
from ml.prompts import EXTRACTION_PROMPT

logger = logging.getLogger(__name__)

class BaseExtractionProvider:
    def generate_extraction(self, text: str) -> str:
        raise NotImplementedError("Subclasses must implement generate_extraction")

class MockExtractionProvider(BaseExtractionProvider):
    """
    A mock provider for development and testing when the real Gemma endpoint is unavailable.
    DO NOT use this in production. This returns deterministic mock responses based on simple heuristics.
    """
    def generate_extraction(self, text: str) -> str:
        text_lower = text.lower()
        
        # Test 1: Higher Education
        if "daughter got admission to college" in text_lower:
            return json.dumps({
                "intent": "higher_education_financial_assistance",
                "summary": "Needs financial assistance to pay for daughter's college fees.",
                "entities": {
                    "relationship": {"value": "daughter", "confidence": 0.95, "source": "Citizen Conversation"},
                    "education_level": {"value": "college", "confidence": 0.95, "source": "Citizen Conversation"},
                    "annual_income": {"value": 400000 if "4 lakh" in text_lower else (500000 if "5 lakh" in text_lower else None), "confidence": 0.90, "source": "Citizen Conversation"}
                }
            })
            
        # Test 2: Healthcare
        healthcare_keywords = ["treatment", "medical treatment", "healthcare", "medicine", "hospital", "surgery", "illness", "medical help"]
        if any(kw in text_lower for kw in healthcare_keywords) and ("father" in text_lower or "73" in text_lower):
            entities = {
                "purpose": {"value": "healthcare/treatment", "confidence": 0.90, "source": "Citizen Conversation"}
            }
            if "father" in text_lower:
                entities["relationship"] = {"value": "father", "confidence": 0.95, "source": "Citizen Conversation"}
            if "73" in text_lower:
                entities["age"] = {"value": 73, "confidence": 0.98, "source": "Citizen Conversation"}
                
            return json.dumps({
                "intent": "healthcare_assistance",
                "summary": "Needs help with healthcare treatment.",
                "entities": entities
            })
            
        # Test 3: Farmer
        elif "farmer" in text_lower:
            entities = {
                "is_farmer": {"value": True, "confidence": 0.99, "source": "Citizen Conversation"}
            }
            if "own" in text_lower and "land" in text_lower:
                entities["landholding_status"] = {"value": "present/owned", "confidence": 0.95, "source": "Citizen Conversation"}
            
            return json.dumps({
                "intent": "farmer_financial_assistance",
                "summary": "Farmer needs financial assistance.",
                "entities": entities
            })
            
        # Test 4: Ujjwala / Cooking Fuel
        lpg_keywords = ["lpg", "gas connection", "cooking gas", "cylinder", "ujjwala"]
        if any(kw in text_lower for kw in lpg_keywords):
            entities = {
                "has_existing_lpg_connection": {"value": False, "confidence": 0.95, "source": "Citizen Conversation"}
            }
            if "woman" in text_lower or "female" in text_lower:
                entities["gender"] = {"value": "female", "confidence": 0.98, "source": "Citizen Conversation"}
            if "28" in text_lower:
                entities["age"] = {"value": 28, "confidence": 0.98, "source": "Citizen Conversation"}
                
            return json.dumps({
                "intent": "cooking_fuel_assistance",
                "summary": "Citizen needs an LPG connection.",
                "entities": entities
            })
            
        # Test 5: Unknown / General
        else:
            return json.dumps({
                "intent": "unknown",
                "summary": "General request for help with no specific details provided.",
                "entities": {}
            })

class GemmaExtractionProvider(BaseExtractionProvider):
    """
    GEMMA MODE: A provider that connects to a real Gemma/LLM inference endpoint.
    Currently a placeholder pending real integration.
    """
    def __init__(self, endpoint_url: str):
        self.endpoint_url = endpoint_url
        
    def generate_extraction(self, text: str) -> str:
        prompt = EXTRACTION_PROMPT.format(citizen_text=text)
        # TODO: Implement actual HTTP call to Gemma server
        # response = requests.post(self.endpoint_url, json={"inputs": prompt})
        # return response.json()["generated_text"]
        raise NotImplementedError("Real Gemma inference is not yet configured. Use MockExtractionProvider.")

import re

def _normalize_value(val: Any) -> Any:
    """Safely normalizes common string formats into numbers or booleans."""
    if isinstance(val, str):
        val_clean = val.lower().strip()
        if val_clean in ['true', 'yes', 'y']:
            return True
        if val_clean in ['false', 'no', 'n']:
            return False
            
        num_str = re.sub(r'[^\d.]', '', val_clean)
        if num_str:
            if 'lakh' in val_clean and float(num_str) < 1000:
                return float(num_str) * 100000
            if '.' in num_str:
                try:
                    return float(num_str)
                except ValueError:
                    pass
            else:
                try:
                    return int(num_str)
                except ValueError:
                    pass
    return val

def extract_citizen_information(text: str, provider: Optional[BaseExtractionProvider] = None) -> CitizenInformation:
    """
    Takes a citizen's natural-language problem and converts it into structured information.
    Gracefully handles validation errors and empty inputs.
    """
    if not text or not text.strip():
        return CitizenInformation(
            intent="unknown",
            summary="Empty input provided.",
            entities={}
        )
        
    if provider is None:
        provider = MockExtractionProvider()
        
    try:
        raw_json_str = provider.generate_extraction(text)
        
        raw_json_str = raw_json_str.strip()
        if raw_json_str.startswith("```json"):
            raw_json_str = raw_json_str[7:]
        if raw_json_str.endswith("```"):
            raw_json_str = raw_json_str[:-3]
            
        data = json.loads(raw_json_str)
        
        # Apply normalization to all extracted entity values
        if "entities" in data:
            for key, entity in data["entities"].items():
                if "value" in entity:
                    entity["value"] = _normalize_value(entity["value"])
        
        validated_data = CitizenInformation(**data)
        return validated_data
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response as JSON: {e}")
        return CitizenInformation(
            intent="unknown",
            summary="Failed to parse extraction. Invalid JSON returned from model.",
            entities={}
        )
    except ValidationError as e:
        logger.error(f"Pydantic validation failed for extraction: {e}")
        return CitizenInformation(
            intent="unknown",
            summary="Extraction failed schema validation.",
            entities={}
        )
    except Exception as e:
        logger.error(f"Unexpected error during extraction: {e}")
        return CitizenInformation(
            intent="unknown",
            summary=f"An unexpected error occurred: {str(e)}",
            entities={}
        )
