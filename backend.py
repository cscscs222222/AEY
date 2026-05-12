import json
import logging
import os
import re

import requests
from flask import Flask, jsonify, request

app = Flask(__name__)
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "Sen bir sosyal zeka ve flört koçusun. Sadece şu JSON formatında yanıt ver: "
    "{\"vibe_check\": \"...\", \"secenek_a\": \"...\", \"secenek_b\": \"...\", "
    "\"secenek_c\": \"...\"}."
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
GEMINI_URL = os.getenv("GEMINI_URL", "https://generativelanguage.googleapis.com/v1beta")
PROVIDER_NAME = "Gemini"
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:5500,http://localhost:5000",
    ).split(",")
    if origin.strip()
]


@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")
    if origin and origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    response.headers["Vary"] = "Origin"
    return response


def parse_llm_response(raw_text):
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
    raise ValueError("LLM yanıtı JSON formatında değil")


def build_gemini_url():
    base_url = GEMINI_URL.rstrip("/")
    return f"{base_url}/models/{GEMINI_MODEL}:generateContent"


@app.route("/status", methods=["GET"])
def status():
    return jsonify(
        {
            "provider": PROVIDER_NAME,
            "key_configured": bool(GEMINI_API_KEY),
            "model": GEMINI_MODEL,
        }
    )


@app.route("/analyze", methods=["POST", "OPTIONS"])
def analyze():
    if request.method == "OPTIONS":
        return ("", 204)

    if not GEMINI_API_KEY:
        return (
            jsonify(
                {
                    "error": "GEMINI_API_KEY ortam değişkeni tanımlı değil.",
                    "provider": PROVIDER_NAME,
                    "key_status": "eksik",
                }
            ),
            500,
        )

    payload = request.get_json(silent=True) or {}
    message = (payload.get("message") or "").strip()
    if not message:
        return jsonify({"error": "Mesaj boş olamaz."}), 400

    body = {
        "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": [{"role": "user", "parts": [{"text": message}]}],
        "generationConfig": {"temperature": 0.7},
    }

    try:
        response = requests.post(
            build_gemini_url(),
            params={"key": GEMINI_API_KEY},
            headers={"Content-Type": "application/json"},
            json=body,
            timeout=40,
        )
        response.raise_for_status()
        result = response.json()
        content = result["candidates"][0]["content"]["parts"][0]["text"]
        parsed = parse_llm_response(content)
    except requests.RequestException as error:
        logger.exception("LLM request failed: %s", error)
        return (
            jsonify(
                {
                    "error": "LLM servisine ulaşılamadı.",
                    "provider": PROVIDER_NAME,
                    "key_status": "basarisiz",
                }
            ),
            502,
        )
    except (KeyError, IndexError, TypeError):
        return (
            jsonify(
                {
                    "error": "LLM yanıtı beklenenden farklı.",
                    "provider": PROVIDER_NAME,
                    "key_status": "basarisiz",
                }
            ),
            502,
        )
    except ValueError as error:
        logger.warning("LLM JSON parse failed: %s", error)
        return (
            jsonify(
                {
                    "error": "LLM yanıtı JSON formatında değil.",
                    "provider": PROVIDER_NAME,
                    "key_status": "basarisiz",
                }
            ),
            502,
        )

    return jsonify(
        {
            "vibe_check": parsed.get("vibe_check", ""),
            "secenek_a": parsed.get("secenek_a", ""),
            "secenek_b": parsed.get("secenek_b", ""),
            "secenek_c": parsed.get("secenek_c", ""),
            "provider": PROVIDER_NAME,
            "key_status": "basarili",
        }
    )


if __name__ == "__main__":
    app.run(port=5000)
