from typing import Optional

from pydantic import BaseModel


class ChatMessage(BaseModel):
    """Represents a single message in the chat history."""
    role: str  # 'user' or 'model'
    content: str


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None 


class ChatResponse(BaseModel):
    message: str
    session_id: str


class PromptUpdate(BaseModel):
    text: str


class PromptResponse(BaseModel):
    prompt: str