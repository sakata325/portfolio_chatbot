import os
import sys
from typing import Dict, Union

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api import chat, prompt
from app.prompt_store import prompt_store
from tools.crawl_and_patch import (
    fetch_and_prepare_portfolio_content,
    get_last_hash,
    save_hash,
)

load_dotenv()

app = FastAPI(title="Portfolio ChatBot")

current_file_path = os.path.abspath(__file__)
app_dir_path = os.path.dirname(current_file_path)
backend_dir_path = os.path.dirname(app_dir_path)
# toolsディレクトリへのパスを取得
tools_dir_path = os.path.join(backend_dir_path, "tools")
# backendディレクトリをsys.pathに追加（tools.crawl_and_patchをインポートするため）
if backend_dir_path not in sys.path:
    sys.path.insert(0, backend_dir_path)
# --- backend/app/ を sys.path に追加 --- END

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


# --- Startup Event Handler --- START
@app.on_event("startup")
def startup_event() -> None:
    print("--- Running startup prompt update logic ---")
    try:
        new_prompt, current_hash = fetch_and_prepare_portfolio_content()
        last_hash = get_last_hash()

        if new_prompt is not None and current_hash is not None:
            print(f"Fetched content hash: {current_hash}")
            print(f"Last saved hash: {last_hash}")
            if current_hash != last_hash:
                print("Content changed, updating prompt store...")
                prompt_store.update(new_prompt)
                save_hash(current_hash)
                print(f"Prompt updated and hash {current_hash} saved.")
            else:
                print("Content has not changed. Using existing prompt.")
        elif last_hash:
            print("Failed to fetch content, but previous hash exists.")
        else:
            print("Failed to fetch content and no previous hash found. ")

    except Exception as e:
        print(f"Error during startup prompt update: {e}", file=sys.stderr)

    print(f"Startup complete. Current prompt in store: '{prompt_store.current[:50]}' ")
    print("--- Finished startup prompt update logic ---")


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
