from datetime import datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    user_id: UUID = Field(default_factory=uuid4)
    message: str


class ChatResponse(BaseModel):
    reply: str


class PromptUpdate(BaseModel):
    text: str


class PromptResponse(BaseModel):
    prompt: str


class PromptRecord(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    prompt_text: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    hash: str
