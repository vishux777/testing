import streamlit as st
import requests
import os
from dotenv import load_dotenv

# Load .env file for local development (optional)
load_dotenv()

# Get API key
MISTRAL_API_KEY = os.environ.get("MISTRAL_API_KEY")
if not MISTRAL_API_KEY:
    st.error("MISTRAL_API_KEY is not set. Please set it in your environment variables (locally) or Streamlit Cloud secrets.")
    st.stop()

MISTRAL_ENDPOINT = "https://api.mistral.ai/v1/chat/completions"
HEADERS = {
    "Authorization": f"Bearer {MISTRAL_API_KEY}",
    "Content-Type": "application/json"
}

def get_category_from_mistral(description):
    try:
        payload = {
            "model": "mistral-tiny",
            "messages": [
                {"role": "system", "content": "You are an expense categorization assistant. Categorize expenses into one of these categories: food, transportation, housing, utilities, entertainment, shopping, travel, health, education, or other. Reply with just the category name in lowercase."},
                {"role": "user", "content": f"Categorize this expense: {description}"}
            ],
            "temperature": 0.3
        }
        response = requests.post(MISTRAL_ENDPOINT, json=payload, headers=HEADERS, timeout=10)
        response.raise_for_status()

        response_data = response.json()
        if "choices" in response_data and response_data["choices"]:
            category = response_data["choices"][0].get("message", {}).get("content", "other").strip().lower()
            common_categories = ["food", "transportation", "housing", "utilities", "entertainment", 
                                "shopping", "travel", "health", "education", "other"]
            for c in common_categories:
                if c in category:
                    return c
            return "other"
        return "other"
    except Exception as e:
        st.error(f"Error categorizing expense: {str(e)}")
        return "other"

def get_query_response(query):
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
            return response_data["choices"][0].get("message", {}).get("content", "").strip()
        return "I couldn't process your query. Please try again."
    except Exception as e:
        st.error(f"Error processing query: {str(e)}")
        return "I'm having trouble connecting to my knowledge base. Please try again later."

# Streamlit UI
st.title("Expense Categorization App")

st.header("Categorize an Expense")
description = st.text_input("Enter expense description (e.g., 'Dinner at restaurant')")
if st.button("Categorize"):
    if description.strip():
        category = get_category_from_mistral(description)
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
        st.success(f"Category: {category}")
        st.write(friendly_messages.get(category, f"Categorized as {category}."))
    else:
        st.error("Please enter a description.")

st.header("Ask a Finance Question")
query = st.text_input("Enter your question (e.g., 'How do I budget for travel?')")
if st.button("Ask"):
    if query.strip():
        response = get_query_response(query)
        st.write("Answer:", response)
    else:
        st.error("Please enter a question.")

st.write("Powered by Mistral AI and Streamlit")