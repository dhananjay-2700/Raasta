import json
import re
import string
import time
import logging
import threading
from typing import Dict, Any, List, Optional
import requests

logger = logging.getLogger("RAASTA.BrainProvider")


_OLLAMA_SERVER_AVAILABLE: Optional[bool] = None


class BaseLLMProvider:
    """Abstract base class for LLM inference providers."""
    def generate(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.1, max_tokens: int = 300) -> str:
        raise NotImplementedError


class OllamaProvider(BaseLLMProvider):
    """
    Ollama local LLM provider adapted from the SUNDAY brain architecture.
    Features model fallback chains, background warmup, and connection resilience.
    """
    def __init__(self, base_url: str = "http://localhost:11434", preferred_model: str = "llama3.2:1b"):
        global _OLLAMA_SERVER_AVAILABLE
        self.base_url = base_url.rstrip("/")
        self.url = f"{self.base_url}/api/chat"
        self.preferred_model = preferred_model
        self.fallback_chain = ["llama3.2:1b", "llama3.2:latest", "llama3:8b", "phi3:latest", "gemma:2b"]
        self.active_model = preferred_model
        self._available = False

        if _OLLAMA_SERVER_AVAILABLE is False:
            self._available = False
            return

        self.refresh_active_model()
        _OLLAMA_SERVER_AVAILABLE = self._available
        if self._available:
            threading.Thread(target=self.warmup_model, daemon=True).start()

    def is_available(self) -> bool:
        return self._available

    def refresh_active_model(self):
        """Checks available models in Ollama and selects best matching model."""
        try:
            res = requests.get(f"{self.base_url}/api/tags", timeout=0.3)
            if res.status_code == 200:
                self._available = True
                available = [m["name"] for m in res.json().get("models", [])]
                if self.preferred_model in available or any(self.preferred_model in m for m in available):
                    self.active_model = next((m for m in available if self.preferred_model in m), self.preferred_model)
                    return
                for fb in self.fallback_chain:
                    matched = next((m for m in available if fb in m), None)
                    if matched:
                        self.active_model = matched
                        return
                if available:
                    self.active_model = available[0]
            else:
                self._available = False
        except Exception as e:
            self._available = False
            logger.debug(f"Ollama server not immediately accessible ({e}); using default '{self.active_model}'")

    def warmup_model(self):
        """Warms up the model in memory in a background thread."""
        try:
            payload = {
                "model": self.active_model,
                "messages": [{"role": "user", "content": "Hi"}],
                "stream": False,
                "options": {"num_predict": 5}
            }
            requests.post(self.url, json=payload, timeout=5)
        except Exception:
            pass

    def generate(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.1, max_tokens: int = 300) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.active_model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }
        res = requests.post(self.url, json=payload, timeout=20)
        res.raise_for_status()
        return res.json().get("message", {}).get("content", "")


class GemmaProvider(BaseLLMProvider):
    """Gemma REST endpoint provider matching the existing BridgeBharat/RAASTA Gemma server."""
    def __init__(self, endpoint_url: str = "http://127.0.0.1:5005/api/generate"):
        self.endpoint_url = endpoint_url

    def generate(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.1, max_tokens: int = 300) -> str:
        payload = {
            "prompt": f"{system_prompt}\n\n{prompt}" if system_prompt else prompt,
            "isFormActive": False,
            "formSummary": {}
        }
        res = requests.post(self.endpoint_url, json=payload, timeout=15)
        res.raise_for_status()
        data = res.json()
        if "text" in data:
            return data["text"]
        raise ValueError("Missing 'text' in Gemma response")


class MockBrainProvider(BaseLLMProvider):
    """
    Deterministic mock provider for offline testing and verification.
    Provides structured decisions for natural language turns, follow-ups,
    corrections, uncertainty, out-of-order entities, and explanations.
    """
    def generate(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.1, max_tokens: int = 300) -> str:
        prompt_lower = prompt.lower()

        # 1. Synthesis Prompts
        if "authoritative government pipeline status" in prompt_lower or "generate raasta's spoken response" in prompt_lower or "critical citizen service rules" in prompt_lower:
            if "status: ineligible" in prompt_lower or "eligibility status: ineligible" in prompt_lower:
                return "I checked the eligibility requirements. Unfortunately, you may not qualify because the family income exceeds the maximum limit."
            if "why is this required" in prompt_lower or "why do you need" in prompt_lower or "is_explanation_request: true" in prompt_lower:
                return "We need your family income to verify that it meets the annual income limit of ₹4.5 lakh specified under government scheme rules."
            if "eligibility status: eligible" in prompt_lower:
                return "Great news! Based on your verified details, you qualify for this scholarship. The next step is to prepare your income certificate."
            return "I have updated your application details. Let me know if you would like to continue."

        # 2. JSON Self-Repair Prompt
        if "return only the raw valid json object" in prompt_lower or "the previous output was not valid json" in prompt_lower:
            match = re.search(r"(\{.*?\})", prompt, re.DOTALL)
            if match:
                return match.group(1)
            return json.dumps({
                "intent": "general_assistance",
                "understood": "Repaired JSON object",
                "facts_to_add": {},
                "facts_to_correct": {},
                "next_action": "continue"
            })

        # 3. Interpretation Prompts: Extract Citizen Utterance cleanly
        match = re.search(r'citizen just said:\s*"\s*(.*?)\s*"', prompt, re.IGNORECASE | re.DOTALL)
        if match:
            utterance = match.group(1).strip()
        else:
            utterance = prompt.strip()

        utt_lower = utterance.lower()
        utt_clean = utt_lower.translate(str.maketrans('', '', string.punctuation)).strip()
        utt_words = set(utt_clean.split())

        # Scenario: Cancellation / Stop
        if utt_clean in {"cancel", "stop", "quit", "exit", "nevermind", "abort", "no thanks", "bye"} or any(w in utt_words for w in {"cancel", "stop", "quit", "exit", "abort"}):
            return json.dumps({
                "intent": "cancel",
                "understood": "Citizen wants to end the session.",
                "facts_to_add": {},
                "facts_to_correct": {},
                "is_cancellation": True,
                "next_action": "stop"
            })

        # Scenario: Restart / Start Over
        if utt_clean in {"restart", "start over", "reset"} or "start over" in utt_clean:
            return json.dumps({
                "intent": "restart",
                "understood": "Citizen wants to restart the session from the beginning.",
                "facts_to_add": {},
                "facts_to_correct": {},
                "is_restart": True,
                "next_action": "restart"
            })

        # Scenario: Explanation Request ("Why do you need my income?")
        if any(phrase in utt_clean for phrase in ["why do you need", "why is this required", "why income", "why do you want", "why ask"]):
            return json.dumps({
                "intent": "explain",
                "understood": "Citizen is asking why annual income is required.",
                "facts_to_add": {},
                "facts_to_correct": {},
                "is_explanation_request": True,
                "next_action": "explain"
            })

        # Scenario: "I don't know"
        if any(phrase in utt_clean for phrase in ["i dont know", "i do not know", "not sure", "dont know", "no idea"]):
            return json.dumps({
                "intent": "unknown",
                "understood": "Citizen does not know the requested detail.",
                "facts_to_add": {},
                "facts_to_correct": {},
                "is_dont_know": True,
                "needs_clarification": True,
                "next_action": "ask_clarification"
            })

        # Scenario: Uncertainty ("I think our income is around four or five lakh")
        if any(phrase in utt_clean for phrase in ["i think", "maybe", "four or five", "between 4 and 5", "around 4 or 5", "not certain"]):
            return json.dumps({
                "intent": "clarify",
                "understood": "Citizen is uncertain between 4 or 5 lakh income.",
                "facts_to_add": {},
                "facts_to_correct": {},
                "is_uncertain": True,
                "needs_clarification": True,
                "next_action": "ask_clarification"
            })

        # Scenario: Fact Correction ("Actually our income is 5 lakh, not 4")
        if "actually" in utt_clean or "correction" in utt_clean:
            if any(w in utt_clean for w in ["5 lakh", "five lakh", "500000", "500000 rupees"]):
                return json.dumps({
                    "intent": "correct_fact",
                    "understood": "Citizen corrected annual income to 5 lakh.",
                    "facts_to_add": {},
                    "facts_to_correct": {
                        "annual_income": {
                            "value": 500000,
                            "confidence": 0.98,
                            "reasoning": "Explicit correction from citizen"
                        }
                    },
                    "is_correction": True,
                    "next_action": "continue"
                })

        # Scenario: Out-of-order State Entity ("Rajasthan." when asked for marks)
        if "rajasthan" in utt_clean:
            return json.dumps({
                "intent": "provide_state",
                "understood": "Citizen stated their state is Rajasthan.",
                "facts_to_add": {
                    "state": {
                        "value": "Rajasthan",
                        "confidence": 0.96,
                        "reasoning": "Indian state recognized out-of-order"
                    }
                },
                "facts_to_correct": {},
                "next_action": "continue"
            })

        # Scenario: Pending Income Follow-up ("About four lakh", "It is 4 lakh")
        if any(phrase in utt_clean for phrase in ["four lakh", "4 lakh", "400000", "chaar lakh", "char lakh"]):
            return json.dumps({
                "intent": "provide_income",
                "understood": "Citizen provided annual family income of 4 lakh.",
                "facts_to_add": {
                    "annual_income": {
                        "value": 400000,
                        "confidence": 0.95,
                        "reasoning": "Follow-up answer to income question"
                    }
                },
                "facts_to_correct": {},
                "next_action": "continue"
            })

        # Scenario: Class 12 Percentage ("82 percent", "82%")
        if "82" in utt_clean or "percent" in utt_clean:
            return json.dumps({
                "intent": "provide_marks",
                "understood": "Citizen scored 82 percent in Class 12.",
                "facts_to_add": {
                    "class_12_percentile": {
                        "value": 82,
                        "confidence": 0.96,
                        "reasoning": "Follow-up answer to Class 12 marks"
                    }
                },
                "facts_to_correct": {},
                "next_action": "continue"
            })

        # Scenario: Regular Course Confirmation ("Yes, she is enrolled in a regular degree")
        if any(phrase in utt_clean for phrase in ["regular", "regular degree", "full time"]):
            return json.dumps({
                "intent": "confirm_course",
                "understood": "Citizen confirmed enrollment in regular course.",
                "facts_to_add": {
                    "is_regular_course": {
                        "value": True,
                        "confidence": 0.98,
                        "reasoning": "Confirmed regular degree enrollment"
                    }
                },
                "facts_to_correct": {},
                "next_action": "continue"
            })

        # Scenario: No Other Scholarship ("No, she is not getting any other scholarship")
        if any(phrase in utt_clean for phrase in ["not getting any other", "no other scholarship", "no other"]):
            return json.dumps({
                "intent": "confirm_no_other_scholarship",
                "understood": "Citizen confirmed no other scholarship received.",
                "facts_to_add": {
                    "receiving_other_scholarship": {
                        "value": False,
                        "confidence": 0.98,
                        "reasoning": "Confirmed no dual scholarship"
                    }
                },
                "facts_to_correct": {},
                "next_action": "continue"
            })

        # Scenario: Explicit Confirmation ("Yes", "Continue")
        if utt_clean in {"yes", "continue", "proceed", "haa", "ha", "sure", "ok", "okay"}:
            return json.dumps({
                "intent": "confirm",
                "understood": "Citizen confirmed and wants to proceed.",
                "facts_to_add": {},
                "facts_to_correct": {},
                "next_action": "continue"
            })

        # Scenario: Initial Education Query (English / Hindi / Hinglish)
        if any(w in utt_clean for w in ["daughter", "college", "fees", "beti", "padhai", "admission", "scholarship"]):
            return json.dumps({
                "intent": "higher_education_financial_assistance",
                "understood": "Citizen needs financial assistance for daughter's college education.",
                "facts_to_add": {
                    "relationship": {
                        "value": "daughter",
                        "confidence": 0.95,
                        "reasoning": "Daughter mentioned"
                    },
                    "education_level": {
                        "value": "college",
                        "confidence": 0.95,
                        "reasoning": "College admission mentioned"
                    }
                },
                "facts_to_correct": {},
                "next_action": "continue"
            })

        # Scenario: Farmer Query
        if any(w in utt_clean for w in ["farmer", "kisan", "farming", "agriculture"]):
            return json.dumps({
                "intent": "farmer_assistance",
                "understood": "Citizen is a farmer seeking financial assistance.",
                "facts_to_add": {
                    "occupation": {
                        "value": "farmer",
                        "confidence": 0.95,
                        "reasoning": "Farmer mentioned"
                    },
                    "is_farmer": {
                        "value": True,
                        "confidence": 0.95,
                        "reasoning": "Farmer mentioned"
                    }
                },
                "facts_to_correct": {},
                "next_action": "continue"
            })

        # Default fallback
        return json.dumps({
            "intent": "general_assistance",
            "understood": utterance,
            "facts_to_add": {},
            "facts_to_correct": {},
            "next_action": "continue"
        })

