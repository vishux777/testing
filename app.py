import streamlit as st
import requests
import os

# Get API key from environment variable
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
                {"role": "system", "content": "Categorize expenses into food, transportation, housing, utilities, entertainment, shopping, travel, health, education, or other."},
                {"role": "user", "content": f"Categorize this expense: {description}"}
            ],
            "temperature": 0.3
        }
        response = requests.post(MISTRAL_ENDPOINT, json=payload, headers=HEADERS, timeout=10)
        response.raise_for_status()
        response_data = response.json()
        return response_data.get("choices", [{}])[0].get("message", {}).get("content", "other").strip().lower()
    except Exception as e:
        st.error(f"Error: {e}")
        return "other"

def get_query_response(query):
    """Handles general queries via Mistral API."""
    try:
        payload = {
            "model": "mistral-tiny",
            "messages": [
                {"role": "system", "content": "Provide concise responses about expense categories, finance management, and budgeting."},
                {"role": "user", "content": query}
            ],
            "temperature": 0.7
        }
        response = requests.post(MISTRAL_ENDPOINT, json=payload, headers=HEADERS, timeout=10)
        response.raise_for_status()
        response_data = response.json()
        return response_data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
    except Exception as e:
        st.error(f"Error: {e}")
        return "I'm having trouble connecting. Please try again later."

# API Mode
st.title("Expense Categorization API")
st.write("Use this API in your frontend.")

# RESTful-like API
st.subheader("Expense Categorization")
description = st.text_input("Expense Description:")
if st.button("Categorize Expense"):
    if description:
        category = get_category_from_mistral(description)
        st.success(f"Category: {category}")
    else:
        st.error("Enter an expense description.")

st.subheader("Finance Query")
query = st.text_input("Ask a finance-related question:")
if st.button("Ask"):
    if query:
        response = get_query_response(query)
        st.write("Response:", response)
    else:
        st.error("Enter a query.")
