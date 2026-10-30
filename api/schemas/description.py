"""Descricao PARAMETRICA de um sinal (passo 2 do agente): somente enums fechados, nunca angulos.

O LLM escolhe valores destes enums; o compilador deterministico (agent/compiler.py) converte para
keyframes. Qualquer valor fora do enum, chave extra ou tipo errado rejeita a descricao.

LACUNAS em relacao a Libras real (dados do front): so existem as 26 configuracoes de mao A-Z
(handshapes.ts); nao ha "5 aberta com dedos separados", "garra", "mao em L fechada", nem
configuracoes com contato polegar-dedo alem de F/O. Boca (`mouth`) e aceita e guardada em params,
mas o front nao renderiza boca (SignFace so tem brows/emotion).
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel

HANDSHAPES_PATH = Path(__file__).resolve().parent / "handshapes.json"
_HS = json.loads(HANDSHAPES_PATH.read_text(encoding="utf-8"))
HANDSHAPES_VERSION: str = str(_HS["version"])
HANDSHAPES: dict[str, dict[str, float]] = _HS["handshapes"]

ENUMS: dict[str, tuple[str, ...]] = {
    "dominant": ("right", "left"),
    "hands": ("one", "two_mirror", "two_base"),
    "handshape": tuple(HANDSHAPES),
    "location": (
        "neutral_front", "neutral_side", "forehead", "temple", "face", "mouth", "chin",
        "chest", "shoulder", "belly",
    ),
    "palm": ("side", "down", "up", "front", "body"),
    "path": ("none", "straight", "arc", "circle", "repeat", "tap", "wiggle"),
    "direction": ("up", "down", "forward", "back", "inward", "outward"),
    "contact": ("none", "touch", "brush"),
    "brows": ("none", "up", "furrowed"),
    "emotion": ("none", "happy", "sad", "angry", "relaxed", "surprised"),
    "emotion_weight": ("low", "mid", "high"),
    "mouth": ("none", "open", "closed", "round"),
}
DEFAULTS: dict[str, str] = {
    "dominant": "right", "hands": "one", "location": "neutral_front", "palm": "side", "path": "none",
    "direction": "forward", "contact": "none", "brows": "none", "emotion": "none",
    "emotion_weight": "mid", "mouth": "none",
}
REQUIRED = ("handshape",)


class InvalidDescription(ValueError):
    """Descricao rejeitada; mensagem = codigo fixo."""


@dataclass(frozen=True)
class Description:
    values: dict[str, str]

    def __getitem__(self, key: str) -> str:
        return self.values[key]


def validate_description(raw: object) -> Description:
    if not isinstance(raw, dict) or set(raw) - set(ENUMS):
        raise InvalidDescription("formato_invalido")
    values = dict(DEFAULTS)
    for key, value in raw.items():
        if value is None and key not in REQUIRED:
            continue
        if not isinstance(value, str) or value not in ENUMS[key]:
            raise InvalidDescription(f"{key}_invalido")
        values[key] = value
    for key in REQUIRED:
        if key not in raw or raw[key] is None:
            raise InvalidDescription(f"{key}_ausente")
    return Description(values)


def _lit(values: tuple[str, ...]) -> Any:
    return Literal[values]  # type: ignore[valid-type]


class LlmDescription(BaseModel):
    """Schema da saida estruturada do passo 2 (enums fechados)."""

    handshape: _lit(ENUMS["handshape"])  # type: ignore[valid-type]
    dominant: _lit(ENUMS["dominant"]) = "right"  # type: ignore[valid-type]
    hands: _lit(ENUMS["hands"]) = "one"  # type: ignore[valid-type]
    location: _lit(ENUMS["location"]) = "neutral_front"  # type: ignore[valid-type]
    palm: _lit(ENUMS["palm"]) = "side"  # type: ignore[valid-type]
    path: _lit(ENUMS["path"]) = "none"  # type: ignore[valid-type]
    direction: _lit(ENUMS["direction"]) = "forward"  # type: ignore[valid-type]
    contact: _lit(ENUMS["contact"]) = "none"  # type: ignore[valid-type]
    brows: _lit(ENUMS["brows"]) = "none"  # type: ignore[valid-type]
    emotion: _lit(ENUMS["emotion"]) = "none"  # type: ignore[valid-type]
    emotion_weight: _lit(ENUMS["emotion_weight"]) = "mid"  # type: ignore[valid-type]
    mouth: _lit(ENUMS["mouth"]) = "none"  # type: ignore[valid-type]
