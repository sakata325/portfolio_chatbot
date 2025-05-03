from typing import Optional

import google.genai as genai
from fastapi import APIRouter, HTTPException
from google.genai import errors as google_genai_errors
from google.genai import types

from ..models import ChatRequest, ChatResponse
from ..prompt_store import prompt_store

router = APIRouter()

# Initialize client once at the module level for efficiency
client: Optional[genai.Client] = None  # Explicitly type hint client
try:
    # Client uses GOOGLE_API_KEY from env by default
    client = genai.Client()
except Exception as e:
    print(f"Fatal: Error initializing Google GenAI Client at startup: {e}")
    # client remains None if initialization fails


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    if client is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Google GenAI クライアントが初期化されていません。"
                "設定を確認してください。"
            ),
        )

    model_name = "gemini-2.0-flash"  # Or another preferred model

    try:
        # Prepare generation configuration, including system instruction
        config = types.GenerateContentConfig(
            temperature=0.7,
            system_instruction=prompt_store.current,
        )

        # Call the asynchronous generation method using the correct 'config' parameter
        response = await client.aio.models.generate_content(
            model=f"models/{model_name}",
            contents=req.message,
            config=config,
        )

        # Process the response
        if response.text:
            reply_text = response.text
        else:
            # Check for blocking or other finish reasons
            block_reason = getattr(response.prompt_feedback, "block_reason", None)
            if block_reason:
                reply_text = f"応答がブロックされました: {block_reason.name}"
                print(f"Prompt blocked: {block_reason.name}")
            else:
                # Use getattr for safe access to finish_reason
                candidate = response.candidates[0] if response.candidates else None
                finish_reason = getattr(candidate, "finish_reason", None)
                reply_text = (
                    f"応答が生成されませんでした (理由: {finish_reason})"
                ).strip()
                print(f"Response generated no content. Finish Reason: {finish_reason}")

    except google_genai_errors.APIError as e:
        print(f"Google GenAI API Error: {e}")
        raise HTTPException(
            status_code=500, detail=f"Google API エラーが発生しました: {e.message}"
        )
    except Exception as e:
        # Catch any other unexpected error during the process
        print(f"An unexpected error occurred in chat endpoint: {e}")
        raise HTTPException(
            status_code=500, detail="予期せぬ内部エラーが発生しました。"
        )

    return ChatResponse(reply=reply_text)
