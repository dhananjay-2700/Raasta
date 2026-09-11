"""
BridgeBharat — Kaggle Gemma 4 REST API Server
==============================================
Copy and paste this code into your Kaggle Notebook to run your Gemma 4 model
as a live API endpoint for the BridgeBharat Flutter application.
"""

import sys
import json
import re
from flask import Flask, request, jsonify
from pyngrok import ngrok

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

app = Flask(__name__)

# NOTE: If you are using ngrok, set your auth token (get free token at ngrok.com):
# NGROK_AUTH_TOKEN = "YOUR_NGROK_AUTH_TOKEN"
# ngrok.set_auth_token(NGROK_AUTH_TOKEN)

print("⏳ Loading Gemma 4 Model in Kaggle...")

# ==============================================================================
# OPTION A: Loading Gemma via KerasNLP (Standard Kaggle method)
# ==============================================================================
# import keras_nlp
# gemma_lm = keras_nlp.models.GemmaCausalLM.from_preset("gemma_2b_en")

# ==============================================================================
# OPTION B: Loading Gemma via HuggingFace Transformers
# ==============================================================================
# from transformers import AutoTokenizer, AutoModelForCausalLM
# tokenizer = AutoTokenizer.from_pretrained("google/gemma-7b-it")
# model = AutoModelForCausalLM.from_pretrained("google/gemma-7b-it", device_map="auto")

def run_gemma4_inference(prompt: str, is_form_active: bool, form_summary: dict):
    """
    Run Gemma 4 inference and extract agentic form values if form is active.
    """
    # 1. Format System Prompt for Gemma 4
    system_prompt = (
        "You are Smart Bharat AI powered by Gemma 4. You are a civic assistant helping "
        "Indian citizens with government services, schemes, and application forms.\n"
    )

    if is_form_active and form_summary:
        system_prompt += (
            f"\nAGENTIC FORM MODE ACTIVE: The user is filling '{form_summary.get('title', 'Application Form')}'. "
            f"Extract any personal details provided (Name, Aadhaar, Phone, Income, Address, etc.) "
            f"and return a JSON block for autoFilledFields."
        )

    full_prompt = f"<start_of_turn>user\n{system_prompt}\nUser Query: {prompt}<end_of_turn>\n<start_of_turn>model\n"

    # ==========================================================================
    # ACTUAL MODEL INFERENCE (Uncomment when running in Kaggle GPU cell):
    # ==========================================================================
    # generated_text = gemma_lm.generate(full_prompt, max_length=512)
    # output_text = generated_text.replace(full_prompt, "").strip()

    # Demonstration placeholder output:
    output_text = f"✨ Gemma 4 (Kaggle): I received your query about '{prompt}'. I can help auto-fill form details or guide you through requirements."

    # Extract JSON fields if present
    extracted_fields = {}
    
    # Regex extract field heuristics
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


@app.route('/api/generate', methods=['POST'])
def generate_endpoint():
    try:
        data = request.get_json(force=True)
        user_prompt = data.get('prompt', '')
        is_form_active = data.get('isFormActive', False)
        form_summary = data.get('formSummary', {})

        text_response, auto_fields = run_gemma4_inference(user_prompt, is_form_active, form_summary)

        return jsonify({
            "status": "success",
            "model": "Gemma 4 (Kaggle)",
            "text": text_response,
            "autoFilledFields": auto_fields
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == '__main__':
    # Open ngrok tunnel on port 5000
    public_url = ngrok.connect(5000)
    print("\n" + "=" * 70)
    print("🚀 SUCCESS! Your Kaggle Gemma 4 Server is Live!")
    print(f"🔗 PUBLIC ENDPOINT URL: {public_url.public_url}/api/generate")
    print("=" * 70 + "\n")
    print("📋 Instructions: Copy the URL above and paste it into lib/services/ai_service.dart")
    print("Set `useLiveKaggleGemma4 = true` in your Flutter app.\n")

    app.run(port=5000)
