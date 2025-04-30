# Portfolio-ChatBot

This project implements a chatbot for a portfolio website hosted on STUDIO.
The chatbot is embedded as an iframe and keeps its knowledge up-to-date by periodically crawling the portfolio site.

## Features

*   **iframe Embedding:** Easily embed the chatbot into a STUDIO site.
*   **Automatic Updates:** Regularly crawls the portfolio site, detects changes, generates a new system prompt, and updates the chatbot automatically.
*   **Always Up-to-Date:** Ensures the chatbot always interacts based on the latest portfolio information.

## Tech Stack

*   **Frontend:** React (TypeScript) + MUI + `react-chat-widget`
*   **Backend:** Python 3.11, FastAPI, Pydantic, Uvicorn
*   **LLM API Client:** `google-generative-ai` (Gemini)
*   **Crawling/Prompt Update:** Python + `requests` + BeautifulSoup
*   **Deployment/CI:** Vercel (FE), Railway (BE), GitHub Actions

See `document.md` for more details. 