from flask import Flask, request, jsonify
import requests
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

MISTRAL_API_KEY = "Ynd1YZuLjwM02OPQVs3wInK4dNtXwFbT"
MISTRAL_ENDPOINT = "https://api.mistral.ai/v1/chat/completions"
HEADERS = {"Authorization": f"Bearer {MISTRAL_API_KEY}", "Content-Type": "application/json"}

def get_category_from_mistral(description):
    try:
        payload = {
            "model": "mistral-tiny",
            "messages": [{"role": "user", "content": f"Categorize this expense: {description}"}],
            "temperature": 0.5
        }
        response = requests.post(MISTRAL_ENDPOINT, json=payload, headers=HEADERS)
        response_data = response.json()
        return response_data.get("choices", [{}])[0].get("message", {}).get("content", "other").strip().lower()
    except Exception as e:
        print("Error:", e)
        return "error"

@app.route("/categorize", methods=["POST"])
def categorize():
    data = request.json
    description = data.get("description", "")
    category = get_category_from_mistral(description)
    return jsonify({"category": category})

@app.route("/categorize_query", methods=["POST"])
def categorize_query():
    data = request.json
    query = data.get("query", "")
    category = get_category_from_mistral(query)
    return jsonify({"response": category})

if __name__ == "__main__":
    app.run(debug=True)
