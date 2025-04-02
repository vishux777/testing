I am not sole owner of this repo. COpying this for personal purposes would not be accepted.
# SmartSpend - Expense Categorization App

SmartSpend is an AI-powered expense categorization application that helps users organize their spending by automatically categorizing expense descriptions.

## Features

- AI-powered expense categorization using Mistral AI
- Web interface with dark/light mode
- Chat history and saved preferences
- Full responsive design for mobile and desktop

## Setup

### Prerequisites

- Python 3.8+
- Streamlit account
- Mistral AI API key

### Deployment Options

#### 1. Streamlit Cloud

This application is deployed on Streamlit Cloud at: [https://smartspend.streamlit.app/](https://smartspend.streamlit.app/)

To deploy your own version:

1. Fork this repository on GitHub
2. Create an account on [Streamlit Cloud](https://streamlit.io/cloud)
3. Connect your GitHub repository to Streamlit Cloud
4. Add your Mistral API key in the Streamlit secrets management system
5. Deploy the app

#### 2. Web Hosting with GitHub Pages

The web frontend can be deployed to GitHub Pages or any static hosting service:

1. Host the static files (index.html, style.css, script.js) on GitHub Pages
2. Configure the JavaScript to point to your Streamlit API endpoint
3. Ensure CORS is properly set up on your Streamlit API

## File Structure

- `app.py` - Main Streamlit application
- `streamlit_api.py` - API endpoints for frontend interaction
- `index.html` - Web frontend interface
- `style.css` - Styling for web interface
- `script.js` - Frontend JavaScript
- `.streamlit/secrets.toml` - Streamlit secrets configuration (not included in repository)

## API Endpoints

The application exposes the following API endpoints:

- `POST /categorize` - Categorizes an expense description
  - Request body: `{"description": "Your expense description"}`
  - Response: `{"category": "category_name", "message": "Friendly message"}`

- `POST /query` - Answers finance-related questions
  - Request body: `{"query": "Your finance question"}`
  - Response: `{"response": "AI response to query"}`

## Local Development

1. Clone the repository
2. Create a `.env` file with `MISTRAL_API_KEY=your_api_key`
3. Run with `streamlit run streamlit_api.py`
4. For web frontend testing, serve the static files with a local server

## Credits

- Powered by [Mistral AI](https://mistral.ai/)
- Built with [Streamlit](https://streamlit.io/) and vanilla JavaScript