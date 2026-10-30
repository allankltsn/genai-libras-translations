"""Schema pedido ao LLM (saida estruturada). A resposta e tratada como NAO CONFIAVEL e revalidada."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class LlmItem(BaseModel):
    kind: Literal["sign", "fingerspell", "omitted"] = Field(
        description="sign = sinal do vocabulario; fingerspell = soletrar; omitted = palavra de ligacao sem sinal"
    )
    id: str | None = Field(default=None, description="id do vocabulario (apenas para kind=sign)")
    source: str | None = Field(default=None, description="palavra(s) do texto de origem, minusculas sem acento")
    word: str | None = Field(default=None, description="palavra do texto (para fingerspell e omitted)")


class LlmGloss(BaseModel):
    items: list[LlmItem]


class LlmItemGen(BaseModel):
    """Passo 1 com glosa completa (opt-in). `generate` = lema sem sinal no vocabulario."""

    kind: Literal["sign", "fingerspell", "omitted", "generate"] = Field(
        description="generate = palavra de conteudo sem sinal no vocabulario (o passo 2 descreve o gesto)"
    )
    id: str | None = None
    source: str | None = None
    word: str | None = Field(default=None, description="lema (generate) ou palavra do texto (fingerspell/omitted)")
    face: dict[str, str] | None = Field(default=None, description="opcional, so generate: brows/emotion")


class LlmGlossGen(BaseModel):
    items: list[LlmItemGen]
