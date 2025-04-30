from fastapi import FastAPI
from dotenv import load_dotenv # Import load_dotenv

# Load environment variables from .env file before anything else
load_dotenv()

# Now import API routers which might initialize clients needing env vars
from app.api import chat # Uncomment chat router import
from app.api import prompt # Uncomment prompt router import

app = FastAPI(title="Portfolio ChatBot")

# Include routers later
app.include_router(chat.router, prefix="/api") # Uncomment chat router include
app.include_router(prompt.router, prefix="/api") # Uncomment prompt router include

@app.get("/")
async def read_root():
    return {"message": "Portfolio ChatBot Backend is running."}

# Add basic command for running locally
# Run with: uvicorn app.main:app --reload --port 8000
