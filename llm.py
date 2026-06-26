from __future__ import annotations

from abc import ABC, abstractmethod


class LLMProvider(ABC):
    @abstractmethod
    def complete(self, system: str, prompt: str) -> str:
        """Return a model response for an agent prompt."""


class MockLLMProvider(LLMProvider):
    """Deterministic stand-in so the architecture can be tested without keys."""

    def complete(self, system: str, prompt: str) -> str:
        marker = system.splitlines()[0].strip() if system.strip() else "Agent"
        compact_prompt = " ".join(prompt.split())
        return f"[{marker}] {compact_prompt[:900]}"


def get_llm(provider: str = "mock") -> LLMProvider:
    if provider == "mock":
        return MockLLMProvider()
    raise ValueError(f"Unknown LLM provider '{provider}'. Add it in llm.py.")

