"""FakeProvider: deterministico, sem rede.

Passo 1: mapeia o vocabulario; com allow_generated, palavras sem sinal viram kind="generate"
(digitos viram fingerspell); ate max_generated. Passo 2 (describe): descricao parametrica
deterministica derivada do hash do lema (so enums), para testes.
"""
from __future__ import annotations

import hashlib
from typing import Any

from agent.glosser import local_gloss, tokenize
from schemas.description import ENUMS
from schemas.vocabulary import Vocabulary


def fake_description(lemma: str) -> dict[str, str]:
    h = hashlib.sha256(lemma.encode()).digest()
    pick = lambda key, i: ENUMS[key][h[i] % len(ENUMS[key])]  # noqa: E731
    return {
        "handshape": pick("handshape", 0),
        "location": pick("location", 1),
        "palm": pick("palm", 2),
        "path": pick("path", 3),
        "direction": pick("direction", 4),
        "contact": pick("contact", 5),
        "hands": pick("hands", 6),
    }


class FakeProvider:
    name = "fake"
    model_name = "fake"

    def gloss(self, text: str, vocab: Vocabulary, allow_generated: bool = False, max_generated: int = 12) -> object:
        items: list[dict[str, Any]] = []
        generated = 0
        for g in local_gloss(tokenize(text), vocab):
            if g.kind == "sign":
                items.append({"kind": "sign", "id": g.id or ""})
            elif g.kind == "fingerspell" and allow_generated and not (g.word or "").isdigit() and generated < max_generated:
                generated += 1
                items.append({"kind": "generate", "word": g.word or ""})
            else:
                items.append({"kind": g.kind, "word": g.word or ""})
        return {"items": items}

    def describe(self, lemma: str, vocab: Vocabulary) -> object:
        return fake_description(lemma)
