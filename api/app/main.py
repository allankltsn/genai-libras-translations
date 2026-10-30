"""Aplicacao FastAPI. Rodar: .venv\\Scripts\\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"""
from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from adapters import build_cache_store, build_provider
from adapters.cache import GeneratedSignCache
from agent.generate import version_tag
from adapters.base import LlmProvider
from adapters.cache import CacheStore
from adapters.resilience import CircuitBreaker, RateLimiter
from app.config import Settings
from app.deps import ApiError, AppState
from app.routes import health, translate, vocabulary
from schemas.vocabulary import load_vocabulary

log = logging.getLogger("libras.api")


def _error(status: int, code: str, message: str, headers: dict[str, str] | None = None) -> JSONResponse:
    return JSONResponse({"error": {"code": code, "message": message}}, status_code=status, headers=headers)


def create_app(settings: Settings | None = None, provider: LlmProvider | None = None, cache_store: CacheStore | None = None) -> FastAPI:
    if log.level == logging.NOTSET:
        log.setLevel(logging.INFO)
        if not log.handlers:
            handler = logging.StreamHandler()
            handler.setFormatter(logging.Formatter("%(asctime)s %(name)s %(message)s"))
            log.addHandler(handler)
    cfg = settings or Settings.from_env()
    app = FastAPI(title="Libras agent API", version="1", docs_url=None, redoc_url=None, openapi_url=None)
    app.state.libras = AppState(
        settings=cfg,
        vocab=load_vocabulary(),
        provider=provider or build_provider(cfg),
        breaker=CircuitBreaker(cfg.breaker_failures, cfg.breaker_reset_s),
        gen_breaker=CircuitBreaker(cfg.breaker_failures, cfg.breaker_reset_s),
        limiter=RateLimiter(cfg.rate_limit_per_min),
        cache=GeneratedSignCache(
            cache_store or build_cache_store(cfg),
            version_tag=version_tag(cfg.cache_version),
            ttl_s=cfg.cache_ttl_s,
        ),
    )

    @app.exception_handler(ApiError)
    async def _api_error(_: Request, exc: ApiError) -> JSONResponse:
        return _error(exc.status, exc.code, exc.message, exc.headers)

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        code = {404: "not_found", 405: "method_not_allowed"}.get(exc.status_code, "http_error")
        return _error(exc.status_code, code, "Requisicao nao atendida.")

    @app.exception_handler(Exception)
    async def _unexpected(_: Request, exc: Exception) -> JSONResponse:
        log.error("unhandled %s", type(exc).__name__)  # so o tipo: a mensagem pode conter o texto
        return _error(500, "internal_error", "Erro interno.")

    app.include_router(translate.router)
    app.include_router(vocabulary.router)
    app.include_router(health.router)
    return app


app = create_app()
