from flask import Flask, request, jsonify
import requests
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Get API key from environment variable
MISTRAL_API_KEY = os.environ.get("MISTRAL_API_KEY")
MISTRAL_ENDPOINT = "https://api.mistral.ai/v1/chat/completions"
HEADERS = {
    "Authorization": f"Bearer {MISTRAL_API_KEY}",
    "Content-Type": "application/json"
}

@app.route("/categorize", methods=["POST"])
def categorize():
    data = request.json
    description = data.get("description", "")
    if not description:
        return jsonify({"error": "No description provided"}), 400

    try:
        payload = {
            "model": "mistral-tiny",
            "messages": [
                {"role": "system", "content": "You are an expense categorization assistant. Categorize expenses into: food, transportation, housing, utilities, entertainment, shopping, travel, health, education, or other. Reply with just the category name in lowercase."},
                {"role": "user", "content": f"Categorize this expense: {description}"}
            ],
            "temperature": 0.3
        }
        response = requests.post(MISTRAL_ENDPOINT, json=payload, headers=HEADERS, timeout=10)
        response.raise_for_status()
        response_data = response.json()
        category = response_data.get("choices", [{}])[0].get("message", {}).get("content", "other").strip().lower()
        return jsonify({"category": category})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/query", methods=["POST"])
def query():
    data = request.json
    query_text = data.get("query", "")
    if not query_text:
        return jsonify({"error": "No query provided"}), 400

    try:
        payload = {
            "model": "mistral-tiny",
            "messages": [
                {"role": "system", "content": "You are an expense management assistant. Provide concise responses about expense categories, finance management, and budgeting."},
                {"role": "user", "content": query_text}
            ],
            "temperature": 0.7,
            "max_tokens": 150
        }
        response = requests.post(MISTRAL_ENDPOINT, json=payload, headers=HEADERS, timeout=10)
        response.raise_for_status()
        response_data = response.json()
        answer = response_data.get("choices", [{}])[0].get("message", {}).get("content", "I couldn't process your query.").strip()
        return jsonify({"response": answer})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8501)  # Matches Streamlit deployment