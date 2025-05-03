import os
from typing import Dict, Union

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# Now import API routers AFTER load_dotenv
from app.api import chat, prompt

# Load environment variables FIRST
load_dotenv()

app = FastAPI(title="Portfolio ChatBot")

# --- Modify Path Calculation --- START
# Determine the path to the frontend build directory relative to the project root
# This calculation is now independent of the CWD of the 'uvicorn' command.
# このファイルの絶対パスを取得
current_file_path = os.path.abspath(__file__)
# app ディレクトリのパス
app_dir_path = os.path.dirname(current_file_path)
# backend ディレクトリのパス
backend_dir_path = os.path.dirname(app_dir_path)
# プロジェクトのルートディレクトリのパス
project_root_path = os.path.dirname(backend_dir_path)

# プロジェクトルートからの相対パスで frontend/dist を指定
frontend_dist_path = os.path.join(project_root_path, "frontend", "dist")
# --- Modify Path Calculation --- END

# --- Add Staticfiles and Root Route --- START
# Mount the static files directory (frontend/dist) under /assets
# Note: The path must exist when the server starts. Render build command ensures this.
# assets ディレクトリも frontend_dist_path を基準にする
assets_dir_path = os.path.join(frontend_dist_path, "assets")
if not os.path.exists(assets_dir_path):
    print(f"Warning: Assets directory not found at {assets_dir_path}")
if not os.path.exists(frontend_dist_path):
    print(f"Warning: Frontend dist directory not found at {frontend_dist_path}")

app.mount("/assets", StaticFiles(directory=assets_dir_path), name="assets")


# CORS Middleware configuration
origins = [
    "http://localhost:5173",  # Vite default dev port
    "http://127.0.0.1:5173",
    # Add other origins if needed (e.g., your deployed frontend URL)
    "https://hayatasakataportfolio.studio.site",  # STUDIOサイトのオリジン
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # List of allowed origins
    allow_credentials=True,  # Allow cookies
    allow_methods=["*"],  # Allow all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Include routers later
app.include_router(chat.router, prefix="/api")  # Uncomment chat router include
app.include_router(prompt.router, prefix="/api")  # Uncomment prompt router include


# --- Modify Root Route --- START
# Serve index.html for the root path and any other path not caught by
# API or static files
# This allows client-side routing to work correctly.
@app.get("/{full_path:path}", response_model=None)
async def serve_frontend(full_path: str) -> Union[FileResponse, Dict[str, str]]:
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
    return {
        "message": (
            "Portfolio ChatBot Backend is running, " "but index.html not found."
        )
    }


# --- Modify Root Route --- END

# Add basic command for running locally
# Run with: uvicorn app.main:app --reload --port 8000
