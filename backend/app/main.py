from fastapi import FastAPI
# Import routers later when they are implemented
# from app.api import chat, prompt

app = FastAPI(title="Portfolio ChatBot")

# Include routers later
# app.include_router(chat.router, prefix="/api")
# app.include_router(prompt.router, prefix="/api")

@app.get("/")
async def read_root():
    return {"message": "Portfolio ChatBot Backend is running."}

# Add basic command for running locally
# Run with: uvicorn app.main:app --reload --port 8000
