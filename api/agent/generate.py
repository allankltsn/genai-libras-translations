"""PASSO 2 do agente: para cada lema sem sinal curado, cache -> descricao parametrica -> compilador.

O LLM so escolhe enums (schemas/description.py); agent/compiler.py gera os angulos; o resultado
passa pelo validador estrito (schemas/generated.py). Falha de uma palavra degrada SO essa palavra
para datilologia, com aviso. Concorrencia limitada; respeita timeout, retry, breaker e orcamento
total de tempo. Nenhum log contem texto, lemas ou a frase.
"""
from __future__ import annotations

import hashlib
import time
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from typing import TYPE_CHECKING, Any

from adapters.base import ProviderError
from adapters.cache import CachedSign, CacheStats, log_stats
from adapters.resilience import call_with_retry
from agent.compiler import COMPILER_VERSION, compile_description
from agent.glosser import GItem
from agent.prompts import build_describe_prompt
from schemas.description import HANDSHAPES_PATH, InvalidDescription, validate_description
from schemas.generated import BONES, GeneratedSign, InvalidSign, validate_face, validate_generated_sign

if TYPE_CHECKING:
    from app.deps import AppState

_FACE_KEYS = ("brows", "emotion", "emotionWeight")


def table_hash() -> str:
    """Muda sempre que prompt do passo 2, enums, tabela de maos, compilador ou ossos mudam:
    entradas antigas do cache deixam de ser encontradas (invalidacao automatica)."""
    h = hashlib.sha256()
    h.update(build_describe_prompt().encode())
    h.update(HANDSHAPES_PATH.read_bytes())
    h.update(COMPILER_VERSION.encode())
    h.update(",".join(BONES).encode())
    from agent import compiler  # noqa: PLC0415

    h.update(repr((compiler.LOCATIONS, compiler.PALMS, compiler.DIRECTIONS, compiler.AMP)).encode())
    return h.hexdigest()[:12]


def version_tag(cache_version: str) -> str:
    """Parte da chave do cache: v<manual>:<hash automatico>. CACHE_VERSION permite invalidar na mao."""
    return f"v{cache_version}:{table_hash()}"


def _with_hint(sign: GeneratedSign, hint: dict[str, Any] | None) -> GeneratedSign:
    if not hint:
        return sign
    face = dict(sign.face or {})
    for k in _FACE_KEYS:
        if k in hint and k not in face:
            face[k] = hint[k]
    try:
        return sign.model_copy(update={"face": validate_face(face)})
    except InvalidSign:
        return sign


class _Outcome:
    __slots__ = ("cached", "code", "params", "sign")

    def __init__(self, sign: GeneratedSign | None = None, params: dict[str, str] | None = None, cached: bool = False, code: str = "") -> None:
        self.sign, self.params, self.cached, self.code = sign, params, cached, code


def _describe_one(state: AppState, lemma: str, deadline: float, stats: CacheStats) -> _Outcome:
    if time.monotonic() >= deadline:
        return _Outcome(code="generated_unavailable")
    if not state.gen_breaker.allow():
        return _Outcome(code="generated_unavailable")
    try:
        raw = call_with_retry(
            partial(state.provider.describe, lemma, state.vocab),
            **({"sleep": state.sleep} if state.sleep is not None else {}),
            **state.retry_kwargs,
        )
    except ProviderError as exc:
        if exc.kind == "bad_output":
            return _Outcome(code="generated_rejected")
        state.gen_breaker.failure()
        return _Outcome(code="generated_unavailable")
    except Exception:  # noqa: BLE001
        return _Outcome(code="generated_unavailable")
    state.gen_breaker.success()
    try:
        desc = validate_description(raw)
        sign = validate_generated_sign(compile_description(desc, lemma), lemma)
    except (InvalidDescription, InvalidSign):
        return _Outcome(code="generated_rejected")
    except Exception:  # noqa: BLE001
        return _Outcome(code="generated_rejected")
    state.cache.put(lemma, sign, desc.values, state.provider.model_name, stats)
    return _Outcome(sign, desc.values)


def resolve_generated(state: AppState, gitems: list[GItem], warnings: list[str]) -> list[GItem]:
    """Substitui cada GItem('generate') por 'generated' (com sinal validado) ou 'fingerspell'."""
    cap = state.settings.generated_max_per_phrase
    stats = CacheStats()
    kept = 0
    capped = False
    for g in gitems:
        if g.kind == "generate":
            kept += 1
            if kept > cap:
                capped = True
    lemmas: list[str] = []
    seen = 0
    for g in gitems:
        if g.kind == "generate":
            seen += 1
            if seen <= cap and g.word and g.word not in lemmas:
                lemmas.append(g.word)

    outcomes: dict[str, _Outcome] = {}
    todo: list[str] = []
    for lemma in lemmas:
        hit: CachedSign | None = state.cache.get(lemma, stats)
        if hit is not None:
            outcomes[lemma] = _Outcome(hit.sign, hit.params, cached=True)
        else:
            todo.append(lemma)

    if todo:
        deadline = time.monotonic() + state.settings.generation_budget_s
        workers = max(1, min(state.settings.generated_concurrency, len(todo)))
        with ThreadPoolExecutor(max_workers=workers, thread_name_prefix="describe") as pool:
            for lemma, outcome in zip(todo, pool.map(lambda lm: _describe_one(state, lm, deadline, stats), todo), strict=True):
                outcomes[lemma] = outcome

    failed = 0
    out: list[GItem] = []
    seen = 0
    for g in gitems:
        if g.kind != "generate":
            out.append(g)
            continue
        seen += 1
        word = g.word or ""
        oc = outcomes.get(word) if seen <= cap else None
        if oc is None or oc.sign is None:
            if oc is not None:
                failed += 1
                if oc.code not in warnings:
                    warnings.append(oc.code)
            out.append(GItem("fingerspell", word=word))
            continue
        out.append(GItem("generated", word=word, sign=_with_hint(oc.sign, g.face), params=oc.params, cached=oc.cached))
    if capped:
        warnings.append("generated_limit")
    log_stats(stats, described=len(todo), failed=failed)
    return out
