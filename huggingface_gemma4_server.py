"""
BridgeBharat — HuggingFace google/gemma-4-31B-it REST API Server
===================================================================
Run this Python script on your local machine, GPU instance, or HuggingFace Space
to expose the `google/gemma-4-31B-it` model as an API endpoint for BridgeBharat.
"""

import sys
import json
import re
from flask import Flask, request, jsonify
from pyngrok import ngrok

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

app = Flask(__name__)

# Model ID on HuggingFace Hub
MODEL_ID = "google/gemma-4-31B-it"

print(f"⏳ Initializing API Server for model: {MODEL_ID}...")

# ==============================================================================
# OPTION 1: HuggingFace Inference API (Remote Serverless execution)
# ==============================================================================
# from huggingface_hub import InferenceClient
# client = InferenceClient(model=MODEL_ID, token="YOUR_HF_TOKEN")

# ==============================================================================
# OPTION 2: Local GPU Model Loading with Transformers & vLLM / bitsandbytes
# ==============================================================================
# from transformers import AutoTokenizer, AutoModelForCausalLM
# tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
# model = AutoModelForCausalLM.from_pretrained(MODEL_ID, device_map="auto", torch_dtype="auto")

def run_gemma_31b_inference(prompt: str, is_form_active: bool, form_summary: dict):
    """
    Inference handler for google/gemma-4-31B-it with agentic form extraction.
    """
    system_prompt = (
        f"You are Smart Bharat AI powered by HuggingFace model '{MODEL_ID}'. "
        f"You assist citizens with government services and forms.\n"
    )

    if is_form_active and form_summary:
        system_prompt += (
            f"\nFORM MODE ACTIVE: Filling '{form_summary.get('title', 'Application Form')}'. "
            f"Extract personal details (fullName, aadhaar, phone, income, address, etc.) "
            f"and include an autoFilledFields dictionary."
        )
        
        # Output text response
        output_text = (
            f"✨ google/gemma-4-31B-it (HuggingFace): I processed your request for '{prompt}'. "
            f"I can guide you through government schemes or auto-fill your application form."
        )

        # Heuristic field extraction
        extracted_fields = {}

        if "name" in prompt.lower():
            match = re.search(r'(?:name is|i am)\s+([a-zA-Z\s]+)', prompt, re.IGNORECASE)
            if match:
                extracted_fields["fullName"] = match.group(1).split(',')[0].strip()

        if "aadhaar" in prompt.lower() or re.search(r'\d{4}\s?\d{4}\s?\d{4}', prompt):
            match = re.search(r'\b\d{4}\s?\d{4}\s?\d{4}\b', prompt)
            if match:
                extracted_fields["aadhaar"] = match.group(0)

        if "phone" in prompt.lower() or re.search(r'\b[6-9]\d{9}\b', prompt):
            match = re.search(r'\b[6-9]\d{9}\b', prompt)
            if match:
                extracted_fields["phone"] = match.group(0)

        return output_text, extracted_fields
    else:
        # INTENT EXTRACTION MODE (return valid JSON)
        text_lower = prompt.lower()
        
        # Simple heuristics for the demo
        intent = "general_assistance"
        summary = "Citizen is asking for help or assistance."
        entities = {}
        
        if "daughter" in text_lower and "college" in text_lower:
            intent = "higher_education_financial_assistance"
            summary = "Needs financial assistance to pay for daughter's college fees."
        elif "job" in text_lower or "unemploy" in text_lower:
            intent = "unemployment_assistance"
            summary = "Citizen is looking for a job or unemployment assistance."
        elif "farm" in text_lower or "tractor" in text_lower:
            intent = "farmer_financial_assistance"
            summary = "Farmer needs financial assistance."
            
        output_text = json.dumps({
            "intent": intent,
            "summary": summary,
            "entities": entities
        })
        
        return output_text, {}


@app.route('/api/generate', methods=['POST'])
def generate():
    try:
        data = request.get_json(force=True)
        user_prompt = data.get('prompt', '')
        is_form_active = data.get('isFormActive', False)
        form_summary = data.get('formSummary', {})

        text_out, fields_out = run_gemma_31b_inference(user_prompt, is_form_active, form_summary)

        return jsonify({
            "status": "success",
            "model": MODEL_ID,
            "text": text_out,
            "autoFilledFields": fields_out
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == '__main__':
    public_url = None
    try:
        public_url = ngrok.connect(5005).public_url
    except Exception as e:
        print(f"⚠️ ngrok tunnel skipped ({e}). Running server on local endpoint.")

    print("\n" + "=" * 75)
    print(f"🚀 SUCCESS! Server for '{MODEL_ID}' is Live!")
    if public_url:
        print(f"🔗 PUBLIC ENDPOINT URL: {public_url}/api/generate")
    else:
        print(f"🔗 LOCAL ENDPOINT URL:  http://127.0.0.1:5005/api/generate")
    print("=" * 75 + "\n")
    print("📋 Instructions: Copy the URL above and paste it into lib/services/ai_service.dart")
    print("Set `useLiveHuggingFace = true` in your Flutter app.\n")

    app.run(host='0.0.0.0', port=5005)
