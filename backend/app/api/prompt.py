from typing import Dict

from fastapi import APIRouter, HTTPException

from ..models import PromptResponse, PromptUpdate
from ..prompt_store import prompt_store

router: APIRouter = APIRouter()


@router.patch("/prompt/update", status_code=200)
async def update_prompt(p: PromptUpdate) -> Dict[str, str]:
    if not p.text or not p.text.strip():  # Check if text is empty or only whitespace
        raise HTTPException(status_code=400, detail="Prompt text cannot be empty.")

    try:
        prompt_store.update(p.text)
        print("Prompt updated successfully.")
        return {
            "status": "updated",
            "new_prompt_preview": p.text[:100] + "...",
        }
    except Exception as e:
        print(f"Error updating prompt: {e}")
        raise HTTPException(
            status_code=500, detail="Internal server error updating prompt."
        )


@router.get("/prompt/current", response_model=PromptResponse)
async def get_current_prompt() -> PromptResponse:
    """Returns the currently active system prompt."""
    try:
        current_prompt = prompt_store.current
        return PromptResponse(prompt=current_prompt)
    except Exception as e:
        print(f"Error retrieving current prompt: {e}")
        raise HTTPException(
            status_code=500, detail="Internal server error retrieving prompt."
        )
