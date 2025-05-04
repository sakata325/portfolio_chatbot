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

current_file_path = os.path.abspath(__file__)
app_dir_path = os.path.dirname(current_file_path)
backend_dir_path = os.path.dirname(app_dir_path)
project_root_path = os.path.dirname(backend_dir_path)

frontend_dist_path = os.path.join(project_root_path, "frontend", "dist")

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
    "https://hayatasakataportfolio.studio.site",  # STUDIOサイトのオリジン
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers later
app.include_router(chat.router, prefix="/api")
app.include_router(prompt.router, prefix="/api")


@app.get("/{full_path:path}", response_model=None)
async def serve_frontend(full_path: str) -> Union[FileResponse, Dict[str, str]]:
    index_path = os.path.join(frontend_dist_path, "index.html")
    if not full_path.startswith("api/") and os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "message": (
            "Portfolio ChatBot Backend is running, " "but index.html not found."
        )
    }
