from threading import Lock


class PromptStore:
    def __init__(self) -> None:
        self._lock = Lock()
        self.current: str = "初期プロンプト"  # Initial default prompt

    def update(self, new: str) -> None:
        with self._lock:
            self.current = new


# Create a singleton instance
prompt_store = PromptStore()
