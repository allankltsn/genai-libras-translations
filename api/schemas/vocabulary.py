"""Vocabulario fechado (api/vocabulary/vocabulary.json, gerado de src/signs/dictionary.ts)."""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

VOCAB_PATH = Path(__file__).resolve().parents[1] / "vocabulary" / "vocabulary.json"


@dataclass(frozen=True)
class SignEntry:
    id: str
    label: str
    kind: str  # lexical | letter | technical
    face: dict[str, Any] | None


@dataclass(frozen=True)
class Vocabulary:
    version: str
    signs: dict[str, SignEntry]
    lexicon: dict[str, str]  # palavra/frase normalizada -> id

    @property
    def lexical_ids(self) -> list[str]:
        return [s.id for s in self.signs.values() if s.kind == "lexical"]

    @property
    def letters(self) -> frozenset[str]:
        """Letras com sinal (LETRA_A -> a)."""
        return frozenset(s.id[len("LETRA_"):].lower() for s in self.signs.values() if s.kind == "letter")

    def is_agent_id(self, sign_id: str) -> bool:
        entry = self.signs.get(sign_id)
        return entry is not None and entry.kind == "lexical"


def load_vocabulary(path: Path = VOCAB_PATH) -> Vocabulary:
    data = json.loads(path.read_text(encoding="utf-8"))
    signs = {e["id"]: SignEntry(e["id"], e["label"], e["kind"], e.get("face")) for e in data["signs"]}
    lexicon = dict(data["lexicon"])
    for sid in lexicon.values():
        if sid not in signs:
            raise ValueError("lexico referencia id inexistente")
    return Vocabulary(str(data["version"]), signs, lexicon)
