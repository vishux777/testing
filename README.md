I am not sole owner of this repo. COpying this for personal purposes would not be accepted.
# SmartSpend - Expense Categorization Assistant

SmartSpend is an AI-powered expense categorization tool that helps users organize their spending by automatically categorizing expenses and answering finance-related questions.

## Features

- Automatic expense categorization using Mistral AI
- Finance question answering
- User-friendly interface with dark/light mode
- Chat history storage

## Project Structure

- Backend: Streamlit app with Mistral AI integration
- Frontend: HTML/CSS/JS web application

## Setup and Deployment

### Backend Deployment (Streamlit)

1. Create a Streamlit account at [https://streamlit.io/](https://streamlit.io/)
2. Install Streamlit CLI: `pip install streamlit`
3. Create a new GitHub repository for your backend code
4. Add these files to your repository:
   - `app.py`
   - `streamlit_api.py`
   - `requirements.txt`
5. Create a `.streamlit` folder with a `secrets.toml` file inside (don't commit this to public repositories)
6. Add your Mistral API key to the `secrets.toml` file:
   ```
   MISTRAL_API_KEY = "your-api-key"
   ```
7. Deploy to Streamlit Cloud:
   - Go to [https://share.streamlit.io/](https://share.streamlit.io/)
   - Connect your GitHub repository
   - Select the main file: `streamlit_api.py`
   - Deploy the app
   - Add your secrets in the Streamlit dashboard

### Frontend Deployment (GitHub Pages)

1. Create a separate GitHub repository for your frontend code
2. Add these files to your repository:
   - `index.html`
   - `style.css`
   - `script.js`
3. Update the `API_URL` in `script.js` to point to your deployed Streamlit app URL
4. Enable GitHub Pages:
   - Go to your repository settings
   - Navigate to the "Pages" section
   - Select "main" branch as the source
   - Save the settings
5. Your site will be published at `https://yourusername.github.io/repository-name/`

## Local Development

To run the app locally:

1. Clone both repositories
2. Create a `.env` file in the backend folder with `MISTRAL_API_KEY=your-api-key`
3. Run the backend: `streamlit run streamlit_api.py`
4. Open the frontend `index.html` in your browser

## Usage

1. Enter an expense description in the input field (e.g., "Dinner at restaurant")
2. Click "Categorize" to see the expense category
3. Alternatively, ask finance-related questions in the query section

## License

This project is for personal use only. Copying this project without permission is not allowed.