"""Contrato publico v1 (docs/api-design.md)."""
from __future__ import annotations

from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from schemas.generated import GeneratedItem


class TranslateOptions(BaseModel):
    model_config = ConfigDict(extra="forbid")
    allowGenerated: bool = True  # padrao: modo IA gera sinais para palavras sem sinal; o front pode enviar false


class TranslateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    # O limite de 500 caracteres e tratado na rota (413), nao aqui (seria 422).
    text: str
    options: TranslateOptions = Field(default_factory=TranslateOptions)


class SignItem(BaseModel):
    kind: Literal["sign"] = "sign"
    id: str
    origin: Literal["curated"] = "curated"
    face: dict[str, Any] | None = None


class FingerspellItem(BaseModel):
    kind: Literal["fingerspell"] = "fingerspell"
    word: str
    origin: Literal["fingerspell"] = "fingerspell"


class OmittedItem(BaseModel):
    kind: Literal["omitted"] = "omitted"
    word: str


Item = Annotated[SignItem | FingerspellItem | OmittedItem | GeneratedItem, Field(discriminator="kind")]


class TranslateResponse(BaseModel):
    apiVersion: Literal["1"] = "1"
    vocabularyVersion: str
    source: Literal["llm", "local-fallback"]
    items: list[Item]
    glosses: list[str]
    warnings: list[str] = Field(default_factory=list)
    incomplete: bool = False
