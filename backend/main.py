from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import time
import asyncio
from contextlib import asynccontextmanager

from vosk_listener import start_listener_thread, wake_word_queue

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the background vosk listener
    loop = asyncio.get_running_loop()
    start_listener_thread(loop)
    yield
    # Clean up can happen here

app = FastAPI(title="RAASTA API", lifespan=lifespan)

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

@app.post("/api/intent", response_model=IntentResponse)
async def process_intent(req: IntentRequest):
    # Mocking Gemma extraction for the Golden Demo
    if "daughter" in req.query.lower() and "fees" in req.query.lower():
        return IntentResponse(
            matched_service_id="SCHOLARSHIP_01",
            service_name="State Merit Scholarship for Higher Education",
            extracted_entities={
                "fullName": {"value": "Rahul Kumar", "confidence": 0.9, "source": "Citizen Conversation"},
                "purpose": {"value": "Daughter's college admission fees", "confidence": 0.95, "source": "Citizen Conversation"},
                "annualIncome": {"value": "500000", "confidence": 0.85, "source": "Citizen Conversation"},
            }
        )
    return IntentResponse(
        matched_service_id="DEFAULT_7",
        service_name="Income Certificate",
        extracted_entities={}
    )

@app.post("/api/submit")
async def submit_application(req: FormSubmissionRequest):
    # Simulate government API latency
    time.sleep(1)
    # Generate mock application ID
    app_id = f"APP-2026-{random.randint(1000, 9999)}"
    return {
        "status": "success",
        "message": "Application submitted successfully",
        "application_id": app_id,
        "estimated_completion": "7-15 days"
    }

@app.websocket("/api/ws/voice")
async def voice_websocket(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket connected for voice trigger")
    try:
        while True:
            # Wait for an event from the listener queue
            event = await wake_word_queue.get()
            # Send to frontend
            await websocket.send_json(event)
    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")

from ml.pipeline import run_pipeline
from ml.pipeline_schemas import PipelineRequest, PipelineResponse

@app.post("/api/raasta/analyze", response_model=PipelineResponse)
async def analyze_request(req: PipelineRequest):
    try:
        response = run_pipeline(req)
        # If the pipeline itself caught a known error, we still return the PipelineResponse,
        # but if it threw something unexpected we can return a 500.
        if response.status == "error":
            raise HTTPException(status_code=500, detail=response.error_message)
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
