from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """Represents a single message in the chat history."""

    role: str  # 'user' or 'model'
    content: str


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None  # Use string for session ID for flexibility


class ChatResponse(BaseModel):
    message: str
    session_id: str


class PromptUpdate(BaseModel):
    text: str


class PromptResponse(BaseModel):
    prompt: str


class PromptRecord(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    prompt_text: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    hash: str
