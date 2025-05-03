from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # Import CORSMiddleware
from dotenv import load_dotenv # Import load_dotenv
from fastapi.staticfiles import StaticFiles # 追加
from fastapi.responses import FileResponse # 追加
import os # 追加

# Load environment variables from .env file before anything else
load_dotenv()

# Now import API routers which might initialize clients needing env vars
from app.api import chat # Uncomment chat router import
from app.api import prompt # Uncomment prompt router import

app = FastAPI(title="Portfolio ChatBot")

# Determine the path to the frontend build directory
# This needs to go up one level from 'backend' to the project root, then into 'frontend/dist'
frontend_dist_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")

# --- Add Staticfiles and Root Route --- START
# Mount the static files directory (frontend/dist) under /assets
# Note: The path must exist when the server starts. Render build command ensures this.
app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist_path, "assets")), name="assets")

# Mount the root of the dist directory for other files like favicon.ico
app.mount("/", StaticFiles(directory=frontend_dist_path), name="root_static")
# --- Add Staticfiles and Root Route --- END

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

# --- Modify Root Route --- START
# Serve index.html for the root path and any other path not caught by API or static files
# This allows client-side routing to work correctly.
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    index_path = os.path.join(frontend_dist_path, "index.html")
    # Check if the requested path corresponds to an existing static file first
    # If not, or if it's the root path, serve index.html
    # (StaticFiles middleware handles existing files automatically if mounted correctly)
    # A simple approach for now: always serve index.html for non-API routes.
    # More robust handling might check `os.path.exists` for specific files.
    if not full_path.startswith("api/") and os.path.exists(index_path):
        return FileResponse(index_path)
    # If index.html doesn't exist or path starts with api/, let other routes handle it
    # (This part might need adjustment based on how StaticFiles interacts)
    # Fallback for the original root message if index.html is somehow not found.
    return {"message": "Portfolio ChatBot Backend is running, but index.html not found."}
# --- Modify Root Route --- END

# Add basic command for running locally
# Run with: uvicorn app.main:app --reload --port 8000
