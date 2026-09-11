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




from ml.pipeline import run_pipeline
from ml.pipeline_schemas import PipelineRequest, PipelineResponse

@app.post("/api/chat", response_model=PipelineResponse)
async def chat_request(req: PipelineRequest):
    try:
        response = run_pipeline(req)
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
        raise HTTPException(status_code=404, detail="No active journey found.")
    return {"status": "success", "journey": journey}
