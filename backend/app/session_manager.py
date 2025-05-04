import uuid
from collections import defaultdict
from typing import Dict, List, Optional

from .models import ChatMessage


class SessionManager:
    """Manages chat sessions and their history in memory."""

    def __init__(self) -> None:
        # Defaultdict simplifies creating new history lists
        self.chat_histories: Dict[str, List[ChatMessage]] = defaultdict(list)

    def get_or_create_session(self, session_id: Optional[str] = None) -> str:
        """Gets the session ID or creates a new one if None or invalid."""
        # Basic check if provided session_id exists, otherwise create new
        if session_id and session_id in self.chat_histories:
            return session_id
        else:
            new_session_id = str(uuid.uuid4())
            # Initialize with empty list using defaultdict behavior
            self.chat_histories[new_session_id] = []
            print(f"Created new session: {new_session_id}")
            return new_session_id

    def get_history(self, session_id: str) -> List[ChatMessage]:
        """Gets the chat history for a given session ID."""
        # Return an empty list if session_id is somehow invalid, though
        # get_or_create_session should prevent this for active sessions.
        return self.chat_histories.get(session_id, [])

    def add_message(self, session_id: str, role: str, content: str) -> None:
        """Adds a message to the chat history of a given session."""
        if session_id not in self.chat_histories:
            # This shouldn't happen if get_or_create_session is used correctly
            print(
                "Warning: Attempted to add message to non-existent session:"
                f"{session_id}"
            )
            return

        # TODO: Consider adding history length limit here
        self.chat_histories[session_id].append(ChatMessage(role=role, content=content))


# Global instance
session_manager = SessionManager()
