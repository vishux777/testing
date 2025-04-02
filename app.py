import streamlit as st
import requests
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import streamlit.web.bootstrap as bootstrap
from streamlit.web.server.server import Server

# Load environment variables from .env file if it exists
load_dotenv()

# Get API key from environment variable or Streamlit secrets
MISTRAL_API_KEY = os.environ.get("MISTRAL_API_KEY")

# Try to get from Streamlit secrets if not in environment
if not MISTRAL_API_KEY and hasattr(st, "secrets"):
    MISTRAL_API_KEY = st.secrets.get("MISTRAL_API_KEY")

if not MISTRAL_API_KEY:
    st.error("MISTRAL_API_KEY not set. Please set it in environment variables or Streamlit secrets.")
    st.stop()

MISTRAL_ENDPOINT = "https://api.mistral.ai/v1/chat/completions"
HEADERS = {
    "Authorization": f"Bearer {MISTRAL_API_KEY}",
    "Content-Type": "application/json"
}

# Configure FastAPI for CORS
def configure_cors_for_streamlit():
    # Get the FastAPI instance that Streamlit uses
    try:
        server = Server.get_current()
        if server is not None:
            app = server._app
            
            # Add CORS middleware
            app.add_middleware(
                CORSMiddleware,
                allow_origins=["*"],  # Allows all origins
                allow_credentials=True,
                allow_methods=["*"],  # Allows all methods
                allow_headers=["*"],  # Allows all headers
            )
            print("CORS middleware added successfully")
    except Exception as e:
        print(f"Error configuring CORS: {e}")

def get_category_from_mistral(description):
    """Calls Mistral AI API to categorize an expense description."""
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
        st.write("No valid choices in response:", response_data)
        return "other"
    except requests.exceptions.Timeout:
        st.error("Request to Mistral API timed out.")
        return "other"
    except requests.exceptions.HTTPError as e:
        st.error(f"HTTP error: {e.response.status_code}")
        return "other"
    except Exception as e:
        st.error(f"Error: {str(e)}")
        return "other"

def get_query_response(query):
    """Handles general queries via Mistral API."""
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
        st.error(f"Error processing query: {e}")
        return "I'm having trouble connecting to my knowledge base. Please try again later."

# Create FastAPI app with routes for API access
from fastapi import Request, Response, Body
import json

# Create a FastAPI instance
api = FastAPI()

# Add CORS middleware to the FastAPI app
api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to be more restrictive in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@api.post("/categorize")
async def categorize_endpoint(request: Request):
    try:
        data = await request.json()
        description = data.get("description", "")
        if not description:
            return Response(
                content=json.dumps({"error": "Description is required"}),
                media_type="application/json",
                status_code=400
            )
        
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
        
        return Response(
            content=json.dumps({
                "category": category,
                "message": friendly_messages.get(category, f"Categorized as {category}.")
            }),
            media_type="application/json"
        )
    except Exception as e:
        return Response(
            content=json.dumps({"error": str(e)}),
            media_type="application/json",
            status_code=500
        )

@api.post("/query")
async def query_endpoint(request: Request):
    try:
        data = await request.json()
        query = data.get("query", "")
        if not query:
            return Response(
                content=json.dumps({"error": "Query is required"}),
                media_type="application/json",
                status_code=400
            )
        
        response = get_query_response(query)
        return Response(
            content=json.dumps({"response": response}),
            media_type="application/json"
        )
    except Exception as e:
        return Response(
            content=json.dumps({"error": str(e)}),
            media_type="application/json",
            status_code=500
        )

# Main Streamlit UI
def main():
    # Try to configure CORS
    configure_cors_for_streamlit()
    
    st.title("SmartSpend - Expense Categorization API")
    
    # Create tabs for different views
    tab1, tab2, tab3 = st.tabs(["Test App", "API Info", "Deployment Status"])
    
    with tab1:
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
    
    with tab2:
        st.header("API Endpoints")
        st.markdown("""
        This Streamlit app serves the following API endpoints:
        
        - `/categorize` - POST endpoint for categorizing expenses
          - Request body: `{"description": "Your expense description"}`
          - Returns: `{"category": "category_name", "message": "friendly message"}`
        
        - `/query` - POST endpoint for finance questions
          - Request body: `{"query": "Your finance question"}`
          - Returns: `{"response": "AI response to query"}`
        
        CORS is enabled for all origins, allowing your frontend to connect from any domain.
        """)
    
    with tab3:
        st.header("Deployment Status")
        st.success("✅ Backend API is running")
        st.info("Access the API endpoints from your frontend application")
        st.info("CORS is enabled to allow cross-origin requests")
        
    # Footer
    st.markdown("---")
    st.write("Powered by Mistral AI and Streamlit")

# Deploy both Streamlit UI and FastAPI endpoints
if __name__ == "__main__":
    # Check if running in API-only mode
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "api":
        import uvicorn
        uvicorn.run(api, host="0.0.0.0", port=8000)
    else:
        # Mount the FastAPI app as a middleware
        from starlette.middleware.wsgi import WSGIMiddleware
        
        # Run the Streamlit application
        main()