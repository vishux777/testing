from flask import Flask, request, jsonify
import requests
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Get API key from environment variable
MISTRAL_API_KEY = os.environ.get("Ynd1YZuLjwM02OPQVs3wInK4dNtXwFbT")
if not MISTRAL_API_KEY:
    print("Warning: MISTRAL_API_KEY environment variable not set. Using fallback method.")
    # Fallback to a config file or other secure method
    # This is still better than hardcoding in the source code
    try:
        with open('.env', 'r') as f:
            for line in f:
                if line.startswith('MISTRAL_API_KEY='):
                    MISTRAL_API_KEY = line.split('=')[1].strip()
    except:
        pass

if not MISTRAL_API_KEY:
    raise ValueError("MISTRAL_API_KEY is not set. Please set it as an environment variable or in a .env file.")

MISTRAL_ENDPOINT = "https://api.mistral.ai/v1/chat/completions"
HEADERS = {
    "Authorization": f"Bearer {MISTRAL_API_KEY}",
    "Content-Type": "application/json"
}

def get_category_from_mistral(description):
    """Calls Mistral AI API to categorize an expense description."""
    try:
        # Improved prompt for better categorization
        payload = {
            "model": "mistral-tiny",
            "messages": [
                {"role": "system", "content": "You are an expense categorization assistant. Categorize expenses into one of these categories: food, transportation, housing, utilities, entertainment, shopping, travel, health, education, or other. Reply with just the category name in lowercase."},
                {"role": "user", "content": f"Categorize this expense: {description}"}
            ],
            "temperature": 0.3
        }
        response = requests.post(MISTRAL_ENDPOINT, json=payload, headers=HEADERS, timeout=10)
        response.raise_for_status()  # Raise an error for HTTP failures

        response_data = response.json()
        if "choices" in response_data and response_data["choices"]:
            category = response_data["choices"][0].get("message", {}).get("content", "other").strip().lower()
            # Clean the response to ensure it's just a category
            common_categories = ["food", "transportation", "housing", "utilities", "entertainment", 
                               "shopping", "travel", "health", "education", "other"]
            
            for c in common_categories:
                if c in category:
                    return c
            return "other"
        print("No valid choices in response:", response_data)
        return "other"
    except requests.exceptions.Timeout:
        print("Request to Mistral API timed out.")
        return "error: Request timed out"
    except requests.exceptions.HTTPError as e:
        print(f"HTTP error: {e}, Status Code: {e.response.status_code}, Response: {e.response.text}")
        return f"error: HTTP error - {e.response.status_code}"
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        return f"error: Request failed - {str(e)}"
    except Exception as e:
        print(f"General error: {e}")
        return f"error: General error - {str(e)}"

@app.route("/categorize", methods=["POST"])
def categorize():
    """Handles expense categorization requests."""
    try:
        data = request.get_json()
        if not data or "description" not in data:
            return jsonify({"error": "Invalid or missing JSON data, 'description' is required"}), 400

        description = data.get("description", "").strip()
        if not description:
            return jsonify({"error": "Description cannot be empty"}), 400

        category = get_category_from_mistral(description)
        if category.startswith("error:"):
            return jsonify({"error": f"Failed to categorize expense: {category}", "category": "other"}), 500
        
        # Return a more user-friendly response
        friendly_messages = {
            "food": "This looks like a food expense.",
            "transportation": "This is categorized as transportation.",
            "housing": "This is a housing-related expense.",
            "utilities": "This falls under utilities.",
            "entertainment": "This is categorized as entertainment.",
            "shopping": "This appears to be a shopping expense.",
            "travel": "This is a travel expense.",
            "health": "This is a health-related expense.",
            "education": "This is an education expense.",
            "other": "This doesn't fit our standard categories."
        }
        
        return jsonify({
            "category": category,
            "message": friendly_messages.get(category, f"Categorized as {category}.")
        })
    except Exception as e:
        print(f"Error in /categorize endpoint: {e}")
        return jsonify({"error": f"Internal server error: {str(e)}", "category": "other"}), 500

@app.route("/categorize_query", methods=["POST"])
def categorize_query():
    """Handles query-based categorization requests."""
    try:
        data = request.get_json()
        if not data or "query" not in data:
            return jsonify({"error": "Invalid or missing JSON data, 'query' is required"}), 400

        query = data.get("query", "").strip()
        if not query:
            return jsonify({"error": "Query cannot be empty"}), 400

        # For general queries, use a different prompt
        try:
            payload = {
                "model": "mistral-tiny",
                "messages": [
                    {"role": "system", "content": "You are an expense management assistant. Provide helpful, concise responses about expense categories, finance management, and budgeting."},
                    {"role": "user", "content": query}
                ],
                "temperature": 0.7,
                "max_tokens": 150
            }
            response = requests.post(MISTRAL_ENDPOINT, json=payload, headers=HEADERS, timeout=10)
            response.raise_for_status()

            response_data = response.json()
            if "choices" in response_data and response_data["choices"]:
                answer = response_data["choices"][0].get("message", {}).get("content", "").strip()
                return jsonify({"response": answer})
            return jsonify({"response": "I couldn't process your query. Please try again."})
        except Exception as e:
            print(f"Error in query processing: {e}")
            return jsonify({"response": "I'm having trouble connecting to my knowledge base. Please try again later."}), 500
    except Exception as e:
        print(f"Error in /categorize_query endpoint: {e}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route("/", methods=["GET"])
def home():
    """Health check endpoint."""
    return jsonify({"status": "ok", "message": "Expense Categorization API is running"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)