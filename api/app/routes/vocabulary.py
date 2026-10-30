"""GET /v1/vocabulary."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Request

from app.deps import get_state

router = APIRouter()


@router.get("/v1/vocabulary")
async def vocabulary(request: Request) -> dict[str, Any]:
    vocab = get_state(request).vocab
    return {
        "apiVersion": "1",
        "version": vocab.version,
        "signs": [{"id": s.id, "label": s.label, "kind": s.kind} for s in vocab.signs.values()],
    }
