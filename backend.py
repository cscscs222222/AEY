import json
import os
import re

import requests
from flask import Flask, jsonify, request

app = Flask(__name__)

SYSTEM_PROMPT = (
    "Sen bir sosyal zeka ve flört koçusun. Gelen mesajı analiz et ve bana JSON "
    "formatında şu verileri dön: 'vibe_check', 'secenek_a', 'secenek_b', 'secenek_c'."
)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_URL = os.getenv("OPENAI_URL", "https://api.openai.com/v1/chat/completions")
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


@app.route("/analyze", methods=["POST", "OPTIONS"])
def analyze():
    if request.method == "OPTIONS":
        return ("", 204)

    if not OPENAI_API_KEY:
        return jsonify({"error": "OPENAI_API_KEY ortam değişkeni tanımlı değil."}), 500

    payload = request.get_json(silent=True) or {}
    message = (payload.get("message") or "").strip()
    if not message:
        return jsonify({"error": "Mesaj boş olamaz."}), 400

    body = {
        "model": OPENAI_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": message},
        ],
        "temperature": 0.7,
        "response_format": {"type": "json_object"},
    }

    try:
        response = requests.post(
            OPENAI_URL,
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json=body,
            timeout=40,
        )
        response.raise_for_status()
        result = response.json()
        content = result["choices"][0]["message"]["content"]
        parsed = parse_llm_response(content)
    except requests.RequestException:
        return jsonify({"error": "LLM servisine ulaşılamadı."}), 502
    except (KeyError, IndexError, TypeError, ValueError):
        return jsonify({"error": "LLM yanıtı beklenenden farklı."}), 502

    return jsonify(
        {
            "vibe_check": parsed.get("vibe_check", ""),
            "secenek_a": parsed.get("secenek_a", ""),
            "secenek_b": parsed.get("secenek_b", ""),
            "secenek_c": parsed.get("secenek_c", ""),
        }
    )


if __name__ == "__main__":
    app.run(port=5000)
