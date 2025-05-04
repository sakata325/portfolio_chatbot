from typing import Dict, List, Optional

import google.genai as genai
from fastapi import APIRouter, HTTPException
from google.genai import errors as google_genai_errors

from ..main import chat_histories
from ..models import ChatRequest, ChatResponse
from ..prompt_store import prompt_store

router: APIRouter = APIRouter()

client: Optional[genai.Client] = None
try:
    client = genai.Client()
except Exception as e:
    print(f"Fatal: Error initializing Google GenAI Client at startup: {e}")


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

    model_name = "gemini-1.5-flash"
    session_id = req.session_id
    user_message_text = req.message

    session_history: List[Dict[str, str]] = chat_histories.get(session_id, [])

    current_user_message = {"role": "user", "parts": user_message_text}

    contents_for_api = session_history + [current_user_message]

    try:
        current_system_prompt = prompt_store.current
        if not current_system_prompt:
            print("Warning: System prompt from prompt_store is empty. Using a default.")
            current_system_prompt = "あなたは親切なアシスタントです。"

        response = await client.aio.models.generate_content(
            model=f"models/{model_name}",
            contents=contents_for_api,
        )

        reply_text = ""
        if (
            response.candidates
            and response.candidates[0].content
            and response.candidates[0].content.parts
        ):
            reply_text = response.candidates[0].content.parts[0].text or ""
        elif response.prompt_feedback and response.prompt_feedback.block_reason:
            block_reason_str = response.prompt_feedback.block_reason.name
            reply_text = f"応答がブロックされました: {block_reason_str}"
            print(f"Prompt blocked for session {session_id}: {block_reason_str}")
        else:
            finish_reason_str = "不明"
            if response.candidates and response.candidates[0].finish_reason:
                try:
                    finish_reason_str = response.candidates[0].finish_reason.name
                except AttributeError:
                    pass
            reply_text = f"応答を生成できませんでした。({finish_reason_str})"
            print(
                f"Response generated no content for session {session_id}. "
                f"Finish Reason: {finish_reason_str}. "
                f"Candidates: {response.candidates}"
            )

    except google_genai_errors.APIError as e:
        print(f"Google GenAI API Error for session {session_id}: {e}")
        raise HTTPException(
            status_code=500, detail=f"Google API エラーが発生しました: {e.message}"
        )
    except Exception as e:
        print(
            "An unexpected error occurred in chat endpoint for session "
            f"{session_id}: {e}"
        )
        raise HTTPException(
            status_code=500, detail="予期せぬ内部エラーが発生しました。"
        )

    if reply_text:
        model_response_message = {"role": "model", "parts": reply_text}
        chat_histories[session_id] = session_history + [
            current_user_message,
            model_response_message,
        ]
    else:
        print(
            f"No valid reply generated for session {session_id}" "history not updated."
        )

    return ChatResponse(reply=reply_text, session_id=session_id)
