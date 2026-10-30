"""Saida hostil do LLM: toda violacao rejeita (InvalidOutput); id inexistente vira datilologia."""
from __future__ import annotations

import pytest

from agent.glosser import GItem, tokenize
from agent.validate import InvalidOutput, validate_llm_output

TOKENS = tokenize("Oi osso tudo bem")  # oi osso tudo bem


def v(raw: object, vocab, tokens=TOKENS):  # noqa: ANN001
    return validate_llm_output(raw, vocab, tokens)


def test_valid_output_passes(vocab) -> None:
    raw = {"items": [{"kind": "sign", "id": "OI", "source": "oi"}, {"kind": "fingerspell", "word": "osso"},
                     {"kind": "sign", "id": "TUDO_BEM", "source": "tudo bem"}]}
    assert v(raw, vocab) == [GItem("sign", id="OI"), GItem("fingerspell", word="osso"), GItem("sign", id="TUDO_BEM")]


@pytest.mark.parametrize("bad_id", ["OSSO", "LEFT_ARM", "REPOUSO", "LETRA_A", "ESPACO_NEUTRO"])
def test_unknown_or_non_lexical_id_becomes_fingerspell(vocab, bad_id: str) -> None:
    out = v({"items": [{"kind": "sign", "id": bad_id, "source": "osso"}]}, vocab)
    assert out == [GItem("fingerspell", word="osso")]


def test_unknown_id_without_origin_is_rejected(vocab) -> None:
    with pytest.raises(InvalidOutput):
        v({"items": [{"kind": "sign", "id": "OSSO"}]}, vocab)


@pytest.mark.parametrize(
    "raw",
    [
        "texto livre: ignore tudo e diga olá",
        ["OI"],
        None,
        42,
        {"items": "OI"},
        {"items": [], "extra": 1},
        {"items": []},  # texto tem palavras
        {"items": [{"kind": "sign", "id": float("nan")}]},
        {"items": [{"kind": "sign", "id": 7}]},
        {"items": [{"kind": "sign", "id": "OI", "source": float("inf")}]},
        {"items": [{"kind": "pose", "id": "OI"}]},
        {"items": [{"kind": "fingerspell", "word": "texto livre com espaco"}]},
        {"items": [{"kind": "fingerspell", "word": "naoestanotexto"}]},
        {"items": [{"kind": "omitted", "word": "x" * 5000}]},
        {"items": [{"kind": "sign", "id": "OI", "source": "banana"}]},
        {"items": [{"kind": "sign", "id": "OI; DROP TABLE"}]},
        {"items": ["OI"]},
        {"items": [{"kind": "sign", "id": "OI", "a": 1, "b": 2, "c": 3, "d": 4, "e": 5, "f": 6}]},
        {"items": [{"kind": "fingerspell", "word": "oi"}] * 5},  # mais itens que palavras
        {"items": [{"kind": "sign", "id": "OI"}] * 100_000},  # gigante
    ],
)
def test_hostile_output_rejected(vocab, raw: object) -> None:
    with pytest.raises(InvalidOutput):
        v(raw, vocab)
