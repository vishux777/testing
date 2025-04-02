import os
from flask import Flask, request, jsonify, render_template, send_from_directory
import json
import requests
from dotenv import load_dotenv
import random
from flask_cors import CORS

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Mistral API Key - Replace with your own or use environment variable
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

@app.route('/categorize', methods=['POST'])
def categorize_expense():
    try:
        data = request.get_json()
        description = data.get('description', '')
        
        if not description:
            return jsonify({"error": "No description provided"}), 400
        
        # Try to get category from Mistral API
        try:
            category = get_category_from_mistral(description)
            return jsonify({
                "category": category,
                "message": "I've categorized this as:"
            })
        except Exception as e:
            print(f"Error with Mistral API: {e}")
            # Fallback to local categorization
            category = get_default_category(description)
            return jsonify({
                "category": category,
                "message": "Using local categorization:"
            })
    
    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/query', methods=['POST'])
def handle_query():
    try:
        data = request.get_json()
        query = data.get('query', '')
        
        if not query:
            return jsonify({"error": "No query provided"}), 400
        
        # Process query with Mistral
        try:
            response = get_query_response(query)
            return jsonify({"response": response})
        except Exception as e:
            print(f"Error with Mistral API: {e}")
            return jsonify({
                "response": "I'm having trouble connecting to my knowledge base. Please try again later."
            }), 503
    
    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({"error": "Internal server error"}), 500

def get_category_from_mistral(description):
    """Calls Mistral AI API to categorize an expense description."""
    url = "https://api.mistral.ai/v1/chat/completions"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {MISTRAL_API_KEY}"
    }
    
    # Prepare the prompt
    prompt = f"""
    You are an AI assistant that categorizes expense descriptions into the following categories only:
    food, transportation, housing, utilities, entertainment, shopping, health, education, travel, or other.
    
    Based on the expense description: "{description}"
    
    Respond with just the category name in lowercase, nothing else.
    """
    
    data = {
        "model": "mistral-tiny",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
        "max_tokens": 10
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()  # Raise an exception for HTTP errors
        
        result = response.json()
        category = result['choices'][0]['message']['content'].strip().lower()
        
        # Ensure only valid categories are returned
        valid_categories = ["food", "transportation", "housing", "utilities", 
                           "entertainment", "shopping", "health", "education", 
                           "travel", "other"]
        
        if category not in valid_categories:
            # Default to "other" if response doesn't match our categories
            return "other"
        
        return category
    
    except Exception as e:
        print(f"Error calling Mistral API: {e}")
        # If API fails, use default categorization
        return get_default_category(description)

def get_query_response(query):
    """Handles general queries via Mistral API."""
    url = "https://api.mistral.ai/v1/chat/completions"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {MISTRAL_API_KEY}"
    }
    
    # Prepare the prompt
    prompt = f"""
    You are an AI assistant for personal finance. You can answer questions about expense categories, 
    provide tips for financial management, and give advice on budgeting.
    
    User query: "{query}"
    
    Provide a helpful, concise response that directly addresses the query.
    Limit your response to 3 paragraphs maximum.
    """
    
    data = {
        "model": "mistral-tiny",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 300
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()  # Raise an exception for HTTP errors
        
        result = response.json()
        return result['choices'][0]['message']['content'].strip()
    
    except Exception as e:
        print(f"Error processing query: {e}")
        return "I'm having trouble connecting to my knowledge base. Please try again later."

def get_default_category(description):
    """Local fallback categorization when API is unavailable."""
    desc = description.lower()
    if "restaurant" in desc or "food" in desc or "dinner" in desc or "lunch" in desc or "breakfast" in desc or "coffee" in desc:
        return "food"
    elif "uber" in desc or "taxi" in desc or "bus" in desc or "train" in desc or "gas" in desc or "car" in desc:
        return "transportation"
    elif "rent" in desc or "mortgage" in desc or "home" in desc:
        return "housing"
    elif "electricity" in desc or "water" in desc or "bill" in desc or "internet" in desc or "phone" in desc:
        return "utilities"
    elif "movie" in desc or "netflix" in desc or "spotify" in desc or "concert" in desc or "game" in desc:
        return "entertainment"
    elif "amazon" in desc or "mall" in desc or "store" in desc or "buy" in desc or "purchase" in desc:
        return "shopping"
    elif "doctor" in desc or "medicine" in desc or "hospital" in desc or "health" in desc:
        return "health"
    elif "course" in desc or "book" in desc or "tuition" in desc or "class" in desc or "school" in desc:
        return "education"
    elif "hotel" in desc or "flight" in desc or "vacation" in desc or "trip" in desc or "travel" in desc:
        return "travel" 
    else:
        return "other"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)