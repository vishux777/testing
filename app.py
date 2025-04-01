import streamlit as st
import requests
import os
import json

# API Configuration
MISTRAL_API_KEY = os.environ.get("MISTRAL_API_KEY")
if not MISTRAL_API_KEY:
    st.warning("MISTRAL_API_KEY not set. Please set it in environment variables or secrets.")
    st.stop()

MISTRAL_ENDPOINT = "https://api.mistral.ai/v1/chat/completions"
HEADERS = {
    "Authorization": f"Bearer {MISTRAL_API_KEY}",
    "Content-Type": "application/json"
}

def get_category_from_mistral(description):
    """Calls Mistral AI API to categorize an expense description."""
    try:
        payload = {
            "model": "mistral-tiny",
            "messages": [
                {"role": "system", "content": "Categorize expenses into: food, transportation, housing, utilities, entertainment, shopping, travel, health, education, or other."},
                {"role": "user", "content": f"Categorize this expense: {description}"}
            ],
            "temperature": 0.3
        }
        response = requests.post(MISTRAL_ENDPOINT, json=payload, headers=HEADERS, timeout=10)
        response.raise_for_status()
        response_data = response.json()
        return response_data.get("choices", [{}])[0].get("message", {}).get("content", "other").strip().lower()
    except Exception as e:
        return "error"

def get_query_response(query):
    """Handles general queries via Mistral AI."""
    try:
        payload = {
            "model": "mistral-tiny",
            "messages": [
                {"role": "system", "content": "Provide responses about expense categories, finance management, and budgeting."},
                {"role": "user", "content": query}
            ],
            "temperature": 0.7
        }
        response = requests.post(MISTRAL_ENDPOINT, json=payload, headers=HEADERS, timeout=10)
        response.raise_for_status()
        response_data = response.json()
        return response_data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
    except Exception as e:
        return "error"

# Streamlit API Mode
st.title("Expense Categorization API")
st.write("Use this API in your frontend.")

# API Endpoint Handling
st.subheader("API Endpoints")
st.write("Use `/categorize` for expense categorization and `/query` for financial questions.")

# Handle API Requests
query_params = st.experimental_get_query_params()
if "type" in query_params:
    api_type = query_params["type"][0]
    
    if api_type == "categorize":
        description = query_params.get("description", [""])[0]
        if description:
            category = get_category_from_mistral(description)
            st.json({"category": category})
        else:
            st.json({"error": "No description provided"})
    
    elif api_type == "query":
        query = query_params.get("query", [""])[0]
        if query:
            response = get_query_response(query)
            st.json({"response": response})
        else:
            st.json({"error": "No query provided"})
