from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # Import CORSMiddleware
from dotenv import load_dotenv # Import load_dotenv

# Load environment variables from .env file before anything else
load_dotenv()

# Now import API routers which might initialize clients needing env vars
from app.api import chat # Uncomment chat router import
from app.api import prompt # Uncomment prompt router import

app = FastAPI(title="Portfolio ChatBot")

# CORS Middleware configuration
origins = [
    "http://localhost:5173", # Vite default dev port
    "http://127.0.0.1:5173",
    # Add other origins if needed (e.g., your deployed frontend URL)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # List of allowed origins
    allow_credentials=True, # Allow cookies
    allow_methods=["*"], # Allow all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"], # Allow all headers
)

# Include routers later
app.include_router(chat.router, prefix="/api") # Uncomment chat router include
app.include_router(prompt.router, prefix="/api") # Uncomment prompt router include

@app.get("/")
async def read_root():
    return {"message": "Portfolio ChatBot Backend is running."}

# Add basic command for running locally
# Run with: uvicorn app.main:app --reload --port 8000
