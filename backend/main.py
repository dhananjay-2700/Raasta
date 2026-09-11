from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import time
import asyncio
from contextlib import asynccontextmanager

app = FastAPI(title="RAASTA API")

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "RAASTA API is running"}


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class IntentRequest(BaseModel):
    query: str

class IntentResponse(BaseModel):
    matched_service_id: str
    service_name: str
    extracted_entities: dict

class FormSubmissionRequest(BaseModel):
    service_id: str
    data: dict

from ml.extraction import extract_citizen_information

@app.post("/api/intent", response_model=IntentResponse)
async def process_intent(req: IntentRequest):
    # Using real LLM extraction instead of mock
    try:
        info = extract_citizen_information(req.query)
        entities = {
            k: (v.model_dump() if hasattr(v, 'model_dump') else v)
            for k, v in info.entities.items()
        }
        return IntentResponse(
            matched_service_id=info.intent,
            service_name=info.summary,
            extracted_entities=entities
        )
    except Exception as e:
        return IntentResponse(
            matched_service_id="error",
            service_name=str(e),
            extracted_entities={}
        )

@app.post("/api/submit")
async def submit_application(req: FormSubmissionRequest):
    # Simulate government API latency
    time.sleep(1)
    # Generate mock application ID
    app_id = f"APP-2026-{random.randint(1000, 9999)}"
    
    # Store this locally if we had a DB, but we'll just return it
    # We can use this mock to simulate updating application state
    return {
        "status": "success",
        "message": "Application submitted successfully",
        "application_id": app_id,
        "estimated_completion": "7-15 days"
    }

class DocumentUploadRequest(BaseModel):
    application_id: str
    document_name: str
    file_content_base64: str

@app.post("/api/documents")
async def upload_document(req: DocumentUploadRequest):
    time.sleep(0.5)
    return {
        "status": "success",
        "message": f"{req.document_name} uploaded successfully."
    }

@app.get("/api/journey/{journey_id}")
async def get_journey(journey_id: str):
    # Mock returning application state for a journey
    return {
        "journey_id": journey_id,
        "status": "in_progress",
        "application_state": {
            "uploaded_documents": [],
            "consent_given": False,
            "reviewed": False,
            "submitted": False
        }
    }




from ml.pipeline import RAASTAPipeline
from ml.pipeline_schemas import PipelineRequest, PipelineResponse

@app.post("/api/chat", response_model=PipelineResponse)
async def chat_request(req: PipelineRequest):
    try:
        pipeline = RAASTAPipeline()
        response = pipeline.run(req)
        if response.status == "error":
            raise HTTPException(status_code=500, detail=response.error_message)
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Active Journey Management for Browser Extension
active_journey_store = {}

@app.post("/api/raasta/journey/active")
async def set_active_journey(journey_data: dict):
    # In a real app, this would be keyed by a session or user ID
    active_journey_store["current"] = journey_data
    return {"status": "success", "message": "Active journey set."}

@app.get("/api/raasta/journey/active")
async def get_active_journey():
    journey = active_journey_store.get("current")
    if not journey:
        # Provide default test journey if not explicitly set
        return {
            "status": "success",
            "journey": {
                "journey_id": "JRN_12345",
                "scheme_id": "PM_USP_CSS",
                "scheme_name": "PM-USP Scholarship",
                "status": "ready_to_apply",
                "citizen_data": {
                    "full_name": { "value": "Rahul Sharma", "source": "Citizen Conversation", "confidence": 0.96 },
                    "state": { "value": "Rajasthan", "source": "Citizen Profile", "confidence": 0.98 },
                    "annual_income": { "value": 400000, "source": "Citizen Conversation", "confidence": 0.95 }
                }
            }
        }
    return {"status": "success", "journey": journey}

@app.delete("/api/raasta/journey/active")
async def clear_active_journey():
    active_journey_store.pop("current", None)
    return {"status": "success", "message": "Active journey cleared."}

import re
from typing import Any
from datetime import datetime

class FieldExtractionRequest(BaseModel):
    field: str
    text: str

class FieldExtractionResponse(BaseModel):
    field: str
    value: Any
    confidence: float
    status: str

@app.post("/api/raasta/extract-field", response_model=FieldExtractionResponse)
async def extract_field_endpoint(req: FieldExtractionRequest):
    """
    Converts a citizen's spoken response into a structured canonical value
    for a specific government form field.
    """
    field = req.field.lower().strip()
    text = req.text.strip()
    
    if not text:
        return FieldExtractionResponse(
            field=field,
            value="",
            confidence=0.0,
            status="needs_clarification"
        )

    # 1. Date of birth extraction (supports "14 March 2006", "14/03/2006", "2006-03-14", "14th March 2006")
    if field in ["date_of_birth", "dob", "birth_date"]:
        # Remove ordinals like 14th, 1st, 2nd, 3rd
        clean_text = re.sub(r'(\d+)(st|nd|rd|th)', r'\1', text, flags=re.IGNORECASE)
        # Check standard date formats
        month_names = {
            "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3,
            "apr": 4, "april": 4, "may": 5, "jun": 6, "june": 6, "jul": 7, "july": 7,
            "aug": 8, "august": 8, "sep": 9, "september": 9, "oct": 10, "october": 10,
            "nov": 11, "november": 11, "dec": 12, "december": 12
        }
        
        # Pattern: Day Month Year (e.g. "14 March 2006")
        match = re.search(r'(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})', clean_text)
        if match:
            day, mon_str, year = match.groups()
            mon = month_names.get(mon_str.lower()[:3])
            if mon:
                try:
                    parsed_date = datetime(int(year), mon, int(day)).strftime("%Y-%m-%d")
                    return FieldExtractionResponse(field=field, value=parsed_date, confidence=0.95, status="success")
                except ValueError:
                    pass

        # Pattern: Month Day Year (e.g. "March 14 2006")
        match = re.search(r'([a-zA-Z]+)\s+(\d{1,2})[,\s]+(\d{4})', clean_text)
        if match:
            mon_str, day, year = match.groups()
            mon = month_names.get(mon_str.lower()[:3])
            if mon:
                try:
                    parsed_date = datetime(int(year), mon, int(day)).strftime("%Y-%m-%d")
                    return FieldExtractionResponse(field=field, value=parsed_date, confidence=0.95, status="success")
                except ValueError:
                    pass

        # Pattern: DD/MM/YYYY or DD-MM-YYYY
        match = re.search(r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})', clean_text)
        if match:
            day, mon, year = match.groups()
            try:
                parsed_date = datetime(int(year), int(mon), int(day)).strftime("%Y-%m-%d")
                return FieldExtractionResponse(field=field, value=parsed_date, confidence=0.95, status="success")
            except ValueError:
                pass

        # Pattern: YYYY-MM-DD
        match = re.search(r'(\d{4})[/-](\d{1,2})[/-](\d{1,2})', clean_text)
        if match:
            year, mon, day = match.groups()
            try:
                parsed_date = datetime(int(year), int(mon), int(day)).strftime("%Y-%m-%d")
                return FieldExtractionResponse(field=field, value=parsed_date, confidence=0.95, status="success")
            except ValueError:
                pass

        # Incomplete or unparseable date (e.g. just a year "2006")
        return FieldExtractionResponse(
            field=field,
            value=text,
            confidence=0.40,
            status="needs_clarification"
        )

    # 2. Annual Income extraction
    elif field in ["annual_income", "income", "family_income"]:
        text_lower = text.lower()
        word_to_num = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10}
        for word, val in word_to_num.items():
            text_lower = re.sub(rf'\b{word}\b', str(val), text_lower)
            
        digits_match = re.search(r'(\d+(?:\.\d+)?)', text_lower)
        if digits_match:
            num = float(digits_match.group(1))
            if "lakh" in text_lower or "lac" in text_lower:
                return FieldExtractionResponse(field=field, value=int(num * 100000), confidence=0.94, status="success")
            elif "thousand" in text_lower:
                return FieldExtractionResponse(field=field, value=int(num * 1000), confidence=0.94, status="success")
            else:
                return FieldExtractionResponse(field=field, value=int(num), confidence=0.90, status="success")
        else:
            return FieldExtractionResponse(
                field=field,
                value=None,
                confidence=0.20,
                status="needs_clarification"
            )

    # 3. Mobile Number extraction (10 digits)
    elif field in ["mobile_number", "phone_number", "mobile", "phone"]:
        clean_digits = re.sub(r'\D', '', text)
        match = re.search(r'([6-9]\d{9})', clean_digits)
        if match:
            return FieldExtractionResponse(field=field, value=match.group(1), confidence=0.98, status="success")
        elif len(clean_digits) == 10:
            return FieldExtractionResponse(field=field, value=clean_digits, confidence=0.92, status="success")

    # 4. Gender
    elif field in ["gender", "sex"]:
        lower = text.lower()
        if any(w in lower for w in ["female", "woman", "girl", "she", "महिला"]):
            return FieldExtractionResponse(field=field, value="Female", confidence=0.98, status="success")
        elif any(w in lower for w in ["male", "man", "boy", "he", "पुरुष"]):
            return FieldExtractionResponse(field=field, value="Male", confidence=0.98, status="success")

    # 5. Generic Conversational Cleanup (District, State, College, Address, Name)
    clean_val = re.sub(
        r'^(my\s+(date\s+of\s+birth|district|college|name|state|address|mobile\s+number)\s+is|it\s+is|i\s+live\s+in|i\s+study\s+at|in)\s+',
        '',
        text,
        flags=re.IGNORECASE
    ).strip().rstrip('.')

    if field == "district":
        clean_val = re.sub(r'\s+district$', '', clean_val, flags=re.IGNORECASE).strip()

    if clean_val:
        return FieldExtractionResponse(
            field=field,
            value=clean_val.title() if field in ["full_name", "district", "state", "college_name"] else clean_val,
            confidence=0.90,
            status="success"
        )

    return FieldExtractionResponse(
        field=field,
        value=text,
        confidence=0.70,
        status="needs_clarification"
    )


from agent.conversation_engine import RAASTAConversationEngine
from agent.journey_context import JourneyContext

@app.websocket("/ws/voice")
async def voice_websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    engine = RAASTAConversationEngine()
    journey = JourneyContext()
    
    try:
        while True:
            data = await websocket.receive_json()
            user_text = data.get("text", "")
            if not user_text:
                continue
                
            turn_res = engine.process_turn(user_text, journey)
            await websocket.send_json(turn_res.to_dict())
            
            if not turn_res.should_continue:
                await websocket.close()
                break
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"error": str(e)})
            await websocket.close()
        except Exception:
            pass

