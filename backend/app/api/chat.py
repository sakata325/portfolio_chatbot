from typing import Any, Dict, List, Optional

import google.genai as genai
from fastapi import APIRouter, HTTPException
from google.genai import errors as google_genai_errors
from google.genai import types

from ..models import ChatMessage, ChatRequest, ChatResponse
from ..prompt_store import prompt_store
from ..session_manager import session_manager

router = APIRouter()

client: Optional[genai.Client] = None
try:
    client = genai.Client()
except Exception as e:
    print(f"Fatal: Error initializing Google GenAI Client at startup: {e}")


def format_history_for_gemini(history: List[ChatMessage]) -> List[Dict[str, Any]]:
    """Convert our ChatMessage history to Google GenAI format."""
    formatted_content = []
    for msg in history:
        formatted_content.append({"role": msg.role, "parts": [{"text": msg.content}]})
    return formatted_content


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest) -> ChatResponse:
    if client is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Google GenAI クライアントが初期化されていません。"
                "設定を確認してください。"
            ),
        )

    # Get or create a session
    session_id = session_manager.get_or_create_session(req.session_id)

    # Get history for this session
    history = session_manager.get_history(session_id)

    # Format history for API + add current message
    formatted_history = format_history_for_gemini(history)
    # Add current user message
    formatted_history.append({"role": "user", "parts": [{"text": req.message}]})

    model_name = "gemini-2.0-flash"

    try:
        config = types.GenerateContentConfig(
            temperature=0.7,
            system_instruction=prompt_store.current,
        )

        response = await client.aio.models.generate_content(
            model=f"models/{model_name}",
            contents=formatted_history,  # Use formatted history with current message
            config=config,
        )

        if response.text:
            reply_text = response.text
        else:
            block_reason = getattr(response.prompt_feedback, "block_reason", None)
            if block_reason:
                reply_text = f"応答がブロックされました: {block_reason.name}"
                print(f"Prompt blocked: {block_reason.name}")
            else:
                candidate = response.candidates[0] if response.candidates else None
                finish_reason = getattr(candidate, "finish_reason", None)
                reply_text = (
                    f"応答が生成されませんでした (理由: {finish_reason})"
                ).strip()
                print(f"Response generated no content. Finish Reason: {finish_reason}")

        # Add the messages to history AFTER successful API call
        session_manager.add_message(session_id, "user", req.message)
        session_manager.add_message(session_id, "model", reply_text)

    except google_genai_errors.APIError as e:
        print(f"Google GenAI API Error: {e}")
        raise HTTPException(
            status_code=500, detail=f"Google API エラーが発生しました: {e.message}"
        )
    except Exception as e:
        print(f"An unexpected error occurred in chat endpoint: {e}")
        raise HTTPException(
            status_code=500, detail="予期せぬ内部エラーが発生しました。"
        )

    return ChatResponse(message=reply_text, session_id=session_id)
