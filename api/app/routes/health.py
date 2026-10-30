"""GET /healthz e /readyz (nenhum dos dois chama o LLM)."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.deps import get_state

router = APIRouter()


@router.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/readyz", response_model=None)
async def readyz(request: Request) -> Any:
    state = get_state(request)
    ready = bool(state.vocab.signs) and bool(state.vocab.lexicon)
    body = {"status": "ready" if ready else "not_ready", "provider": state.provider.name, "breaker": state.breaker.state}
    return JSONResponse(body, status_code=200 if ready else 503)
