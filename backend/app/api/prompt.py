from fastapi import APIRouter, HTTPException
from ..models import PromptUpdate # Use relative import
from ..prompt_store import prompt_store # Use relative import

router = APIRouter()

@router.patch("/prompt/update", status_code=200)
async def update_prompt(p: PromptUpdate):
    if not p.text or not p.text.strip(): # Check if text is empty or only whitespace
        raise HTTPException(status_code=400, detail="Prompt text cannot be empty.")

    try:
        prompt_store.update(p.text)
        print("Prompt updated successfully.") # Add a log message
        return {"status": "updated", "new_prompt_preview": p.text[:100] + "..."} # Return a preview
    except Exception as e:
        print(f"Error updating prompt: {e}")
        raise HTTPException(status_code=500, detail="Internal server error updating prompt.")
