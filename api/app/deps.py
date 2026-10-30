"""Estado compartilhado da aplicacao e acesso a ele nas rotas."""
from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from fastapi import Request

from adapters.base import LlmProvider
from adapters.cache import GeneratedSignCache
from adapters.resilience import CircuitBreaker, RateLimiter
from app.config import Settings
from schemas.vocabulary import Vocabulary


class ApiError(Exception):
    """Erro de API no formato { error: { code, message } }. Nunca carrega o texto do usuario."""

    def __init__(self, status: int, code: str, message: str, headers: dict[str, str] | None = None) -> None:
        super().__init__(code)
        self.status = status
        self.code = code
        self.message = message
        self.headers = headers or {}


@dataclass
class AppState:
    settings: Settings
    vocab: Vocabulary
    provider: LlmProvider
    breaker: CircuitBreaker
    limiter: RateLimiter
    cache: GeneratedSignCache
    gen_breaker: CircuitBreaker  # passo 2 (descricao); independente do breaker do passo 1
    retry_kwargs: dict[str, Any] = field(default_factory=dict)  # testes injetam sleep/rand
    sleep: Callable[[float], None] | None = None


def get_state(request: Request) -> AppState:
    state: AppState = request.app.state.libras
    return state
