from threading import Lock


class PromptStore:
    def __init__(self) -> None:
        self._lock = Lock()
        self.current: str = "初期プロンプト"

    def update(self, new: str) -> None:
        with self._lock:
            self.current = new

prompt_store = PromptStore()
