"""Glosa local (espelha src/translation/{normalize,glosser,translate,fingerspell}.ts) e montagem do resultado.

AVISO: aproximacao nao validada por interprete de Libras. O fallback local e o mesmo
comportamento do modo local do front.
"""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from typing import Any

from schemas.api import FingerspellItem, Item, OmittedItem, SignItem
from schemas.generated import GeneratedItem, GeneratedSign
from schemas.vocabulary import Vocabulary

MAX_INPUT_CHARS = 500
MAX_SIGNS_PER_PHRASE = 120
DISPLAY_WORD_MAX = 20
MAX_PHRASE_WORDS = 3

_SPECIAL = {"ø": "o", "æ": "ae", "œ": "oe", "ß": "ss", "đ": "d", "ł": "l", "ð": "d", "þ": "th"}

STOPWORDS: frozenset[str] = frozenset(
    "o a os as um uma uns umas de do da dos das em no na nos nas por pelo pela para pra pro com ao aos ate sobre "
    "e eh sou es somos sao esta estao estou estamos ser estar foi era que".split()
)

LEMMAS: dict[str, str] = {
    "obrigada": "obrigado", "obrigadas": "obrigado", "obrigados": "obrigado",
    "desculpe": "desculpa", "desculpas": "desculpa",
    "come": "comer", "comi": "comer", "comeu": "comer", "comendo": "comer", "comemos": "comer",
    "aguas": "agua", "banheiros": "banheiro", "duvidas": "duvida", "perguntas": "pergunta",
}


def normalize_text(text: str) -> str:
    s = text[:MAX_INPUT_CHARS].lower()
    s = "".join(_SPECIAL.get(c, c) for c in s)
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if not unicodedata.category(c).startswith("M"))
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def tokenize(text: str) -> list[str]:
    n = normalize_text(text)
    return n.split(" ") if n else []


@dataclass(frozen=True)
class GItem:
    kind: str  # sign | fingerspell | omitted
    id: str | None = None
    word: str | None = None
    sign: GeneratedSign | None = None  # so kind == 'generated' (ja validado)
    face: dict[str, Any] | None = None  # dica de face do passo 1 (kind == 'generate')
    params: dict[str, str] | None = None
    cached: bool = False


def local_gloss(tokens: list[str], vocab: Vocabulary) -> list[GItem]:
    out: list[GItem] = []
    i = 0
    while i < len(tokens):
        matched = False
        for n in range(min(MAX_PHRASE_WORDS, len(tokens) - i), 1, -1):
            sign_id = vocab.lexicon.get(" ".join(tokens[i : i + n]))
            if sign_id is not None:
                out.append(GItem("sign", id=sign_id))
                i += n
                matched = True
                break
        if matched:
            continue
        token = tokens[i]
        i += 1
        if token in STOPWORDS:
            out.append(GItem("omitted", word=token))
            continue
        sign_id = vocab.lexicon.get(LEMMAS.get(token, token))
        out.append(GItem("sign", id=sign_id) if sign_id is not None else GItem("fingerspell", word=token))
    return out


@dataclass(frozen=True)
class Finalized:
    items: list[Item]
    glosses: list[str]
    warnings: list[str]
    incomplete: bool


def finalize(gitems: list[GItem], vocab: Vocabulary) -> Finalized:
    """Itens validados -> itens da API, glosas legiveis e avisos. Limita a fila de sinais."""
    items: list[Item] = []
    glosses: list[str] = []
    warnings: list[str] = []
    missing: list[str] = []
    signs = 0
    truncated = False
    has_generated = False
    for g in gitems:
        if g.kind == "omitted":
            items.append(OmittedItem(word=g.word or ""))
            continue
        if g.kind == "generated" and g.sign is not None:
            if signs + 1 > MAX_SIGNS_PER_PHRASE:
                truncated = True
                break
            signs += 1
            items.append(GeneratedItem(word=g.word or "", sign=g.sign, params=g.params, cached=g.cached))
            glosses.append(f"gerado: {(g.word or '').upper()}")
            has_generated = True
            continue
        if g.kind == "sign":
            entry = vocab.signs[g.id or ""]
            n = 1
        else:
            word = g.word or ""
            n = len(word)
        if signs + n > MAX_SIGNS_PER_PHRASE:
            truncated = True
            break
        signs += n
        if g.kind == "sign":
            items.append(SignItem(id=entry.id, face=entry.face))
            glosses.append(entry.id)
        else:
            word = g.word or ""
            absent = [ch.upper() for ch in word if ch not in vocab.letters]
            for ch in absent:
                if ch not in missing:
                    missing.append(ch)
            shown = word if len(word) <= DISPLAY_WORD_MAX else word[:DISPLAY_WORD_MAX] + "…"
            label = "soletrar (parcial)" if absent else "soletrar"
            items.append(FingerspellItem(word=word))
            glosses.append(f"{label}: {shown.upper()}")
    if missing:
        warnings.append("Letras sem sinal no dicionario (nao animadas): " + ", ".join(missing) + ".")
    if truncated:
        warnings.append(f"Frase longa: apenas os primeiros {MAX_SIGNS_PER_PHRASE} sinais foram mantidos.")
    if has_generated:
        warnings.insert(0, "generated_not_libras")
    return Finalized(items, glosses, warnings, bool(missing) or truncated or has_generated)
