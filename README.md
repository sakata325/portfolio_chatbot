# Portfolio-ChatBot

This project implements a chatbot for a portfolio website hosted on STUDIO.
The chatbot is embedded as an iframe and keeps its knowledge up-to-date by periodically crawling the portfolio site.

## Features

*   **iframe Embedding:** Easily embed the chatbot into a STUDIO site.
*   **Automatic Updates:** Regularly crawls the portfolio site, detects changes, generates a new system prompt, and updates the chatbot automatically. (Crawling tool under development)
*   **Always Up-to-Date:** Ensures the chatbot always interacts based on the latest portfolio information.

## Tech Stack

*   **Frontend:** Vite (React + TypeScript) + MUI
*   **Backend:** Python 3.12, FastAPI, Pydantic, Uvicorn
*   **LLM API Client:** `google-genai` (Gemini)
*   **Crawling/Prompt Update:** Python + Playwright (under consideration)
*   **CI/CD:** GitHub Actions (CI), Render (Deployment)
*   **Dependency Management:** Poetry (Backend), npm (Frontend)

## Local Development

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd portfolio_chatbot
    ```
2.  **Backend Setup:**
    *   Navigate to the backend directory: `cd backend`
    *   Create a `.env` file based on `.env.example` and set your `GOOGLE_API_KEY`.
    *   Install dependencies: `poetry install`
    *   Run the backend server: `poetry run uvicorn app.main:app --reload --port 8000`
3.  **Frontend Setup:**
    *   Navigate to the frontend directory: `cd ../frontend`
    *   Install dependencies: `npm install`
    *   Run the frontend development server: `npm run dev` (Usually available at `http://localhost:5173`)

## Deployment

The application is automatically deployed to Render from the `main` branch.

*   **Deployed URL:** [Insert Deployed URL Here - if available]

See `document.md` for more architectural details. 