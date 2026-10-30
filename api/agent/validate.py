"""Validacao da saida do LLM (NAO CONFIAVEL). Sem 'correcao criativa': ou e aceita, ou e rejeitada.

Regras:
- id inexistente (ou nao-lexical) vira datilologia das palavras de origem (`source`), se estas
  estiverem no texto; sem origem valida -> rejeita a saida inteira.
- palavras soletradas/omitidas precisam ser tokens do proprio texto de entrada.
- limites: itens, tamanho de strings, tipos (NaN/numeros/objetos onde se espera texto -> rejeita).
- qualquer violacao -> InvalidOutput -> o chamador usa o glosador local.
"""
from __future__ import annotations

import re
from typing import Any

from agent.glosser import STOPWORDS, GItem
from schemas.generated import InvalidSign, validate_face
from schemas.vocabulary import Vocabulary

MAX_RAW_ITEMS = 200
MAX_FIELD_CHARS = 80
MAX_KEYS_PER_ITEM = 6  # kind,id,source,word,sign (+1 folga)
_ID_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]{0,39}$")
_WORD_RE = re.compile(r"^[a-z0-9]{1,40}$")
_KINDS = {"sign", "fingerspell", "omitted", "generate", "generated"}


def _face_hint(raw: object) -> dict[str, object] | None:
    """Dica de face do passo 1: invalida -> ignorada (nunca corrigida)."""
    try:
        return validate_face(raw)
    except InvalidSign:
        return None


class InvalidOutput(ValueError):
    """Saida do LLM rejeitada. A mensagem e um codigo fixo, nunca conteudo do modelo/usuario."""


def _text_field(item: dict[str, Any], key: str) -> str | None:
    value = item.get(key)
    if value is None:
        return None
    if not isinstance(value, str) or len(value) > MAX_FIELD_CHARS:
        raise InvalidOutput(f"campo_{key}_invalido")
    return value


def _source_tokens(source: str, text_tokens: set[str]) -> list[str]:
    parts = source.split(" ")
    if not (1 <= len(parts) <= 3) or any(not _WORD_RE.fullmatch(p) or p not in text_tokens for p in parts):
        raise InvalidOutput("origem_fora_do_texto")
    return parts


def validate_llm_output(
    raw: object,
    vocab: Vocabulary,
    text_tokens: list[str],
    allow_generated: bool = False,
    warnings: list[str] | None = None,
) -> list[GItem]:
    """`warnings` (opcional) recebe codigos fixos sobre sinais gerados rejeitados/descartados."""
    notes = warnings if warnings is not None else []
    if not isinstance(raw, dict) or set(raw.keys()) - {"items"}:
        raise InvalidOutput("formato_invalido")
    items = raw.get("items")
    if not isinstance(items, list) or len(items) > MAX_RAW_ITEMS:
        raise InvalidOutput("itens_invalidos")
    if not items and text_tokens:
        raise InvalidOutput("saida_vazia")
    if len(items) > len(text_tokens):  # cada item cobre >= 1 palavra do texto
        raise InvalidOutput("itens_demais")
    token_set = set(text_tokens)
    out: list[GItem] = []
    for it in items:
        if not isinstance(it, dict) or len(it) > MAX_KEYS_PER_ITEM:
            raise InvalidOutput("item_invalido")
        kind = it.get("kind")
        if not isinstance(kind, str) or kind not in _KINDS:
            raise InvalidOutput("kind_invalido")
        sign_id = _text_field(it, "id")
        source = _text_field(it, "source")
        word = _text_field(it, "word")
        if kind == "sign":
            if sign_id is None or not _ID_RE.fullmatch(sign_id):
                raise InvalidOutput("id_invalido")
            if vocab.is_agent_id(sign_id):
                if source is not None:
                    _source_tokens(source, token_set)  # origem declarada tem de estar no texto
                out.append(GItem("sign", id=sign_id))
            else:
                # id inexistente -> datilologia da palavra de origem (nunca inventa sinal)
                origin = source if source is not None else word
                if origin is None:
                    raise InvalidOutput("id_inexistente_sem_origem")
                out.extend(GItem("fingerspell", word=w) for w in _source_tokens(origin, token_set))
        elif kind == "generate":
            if word is None or not _WORD_RE.fullmatch(word):
                raise InvalidOutput("lema_invalido")
            if word in STOPWORDS:  # nunca gerar para artigos/preposicoes/ligacao
                out.append(GItem("omitted", word=word))
            elif vocab.lexicon.get(word) is not None:  # vocabulario curado sempre vence
                out.append(GItem("sign", id=vocab.lexicon[word]))
            elif not allow_generated:  # flag desligada: nada gerado, mesmo que o LLM tente
                if word in token_set:
                    out.append(GItem("fingerspell", word=word))
            else:
                out.append(GItem("generate", word=word, face=_face_hint(it.get("face"))))
        elif kind == "generated":
            # legado: o LLM NAO inventa mais angulos; qualquer sinal bruto e descartado.
            if word is None or not _WORD_RE.fullmatch(word) or word not in token_set:
                raise InvalidOutput("palavra_fora_do_texto")
            if word in STOPWORDS:
                out.append(GItem("omitted", word=word))
                continue
            if allow_generated:
                notes.append("generated_rejected")
            out.append(GItem("fingerspell", word=word))
        else:
            if word is None or not _WORD_RE.fullmatch(word) or word not in token_set:
                raise InvalidOutput("palavra_fora_do_texto")
            out.append(GItem(kind, word=word))
    return out
