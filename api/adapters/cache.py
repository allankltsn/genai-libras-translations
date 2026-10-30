"""Cache do dicionario gerado: porta CacheStore + InMemoryCache + RedisCache + GeneratedSignCache.

Privacidade: a chave contem SOMENTE a versao e UM lemma ja normalizado; o valor contem o sinal
compilado, params (enums), nome do modelo, created_at e validated=false. Nunca a frase do usuario,
a ordem da glosa do passo 1, IP ou outro texto. Falha do cache NUNCA falha a traducao (fail open).
O conteudo lido e REVALIDADO com o validador estrito (o store nao e confiavel). Comandos usados no
Redis: apenas GET e SET (com EX); nunca KEYS/CONFIG/FLUSH*.
"""
from __future__ import annotations

import json
import logging
import threading
import time
from collections import OrderedDict
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any, Protocol

from adapters.resilience import CircuitBreaker
from schemas.generated import GeneratedSign, InvalidSign, validate_generated_sign

log = logging.getLogger("libras.api")

KEY_PREFIX = "libras:gen"
MAX_VALUE_BYTES = 64 * 1024
MAX_MEMORY_ENTRIES = 5000


class CacheStore(Protocol):
    def get(self, key: str) -> str | None: ...

    def set(self, key: str, value: str, ttl_s: int) -> None: ...


class InMemoryCache:
    """Testes e quando REDIS_URL nao esta definido. Limitado em entradas (LRU), com TTL opcional."""

    def __init__(self, max_entries: int = MAX_MEMORY_ENTRIES, clock: Any = time.monotonic) -> None:
        self._d: OrderedDict[str, tuple[str, float | None]] = OrderedDict()
        self._max = max_entries
        self._clock = clock
        self._lock = threading.Lock()

    def get(self, key: str) -> str | None:
        with self._lock:
            item = self._d.get(key)
            if item is None:
                return None
            value, exp = item
            if exp is not None and self._clock() >= exp:
                del self._d[key]
                return None
            self._d.move_to_end(key)
            return value

    def set(self, key: str, value: str, ttl_s: int) -> None:
        with self._lock:
            self._d[key] = (value, self._clock() + ttl_s if ttl_s > 0 else None)
            self._d.move_to_end(key)
            while len(self._d) > self._max:
                self._d.popitem(last=False)


class RedisCache:
    """Adapter fino sobre um cliente redis-py (ou qualquer objeto com get/set(ex=))."""

    def __init__(self, client: Any) -> None:
        self._c = client

    def get(self, key: str) -> str | None:
        value = self._c.get(key)
        if value is None:
            return None
        if isinstance(value, bytes):
            value = value.decode("utf-8")
        return str(value)

    def set(self, key: str, value: str, ttl_s: int) -> None:
        if ttl_s > 0:
            self._c.set(key, value, ex=ttl_s)
        else:
            self._c.set(key, value)


@dataclass
class CacheStats:
    """Contadores por requisicao (so numeros; nenhum conteudo)."""

    hits: int = 0
    misses: int = 0
    stored: int = 0
    invalid: int = 0
    errors: int = 0


@dataclass(frozen=True)
class CachedSign:
    sign: GeneratedSign
    params: dict[str, str]
    model: str


class GeneratedSignCache:
    """Cache tolerante a falhas por cima de um CacheStore."""

    def __init__(self, store: CacheStore, *, version_tag: str, ttl_s: int = 0, breaker: CircuitBreaker | None = None) -> None:
        self._store = store
        self._tag = version_tag
        self._ttl = max(0, ttl_s)
        self._breaker = breaker or CircuitBreaker(failures=3, reset_s=30.0)

    def key(self, lemma: str) -> str:
        return f"{KEY_PREFIX}:{self._tag}:{lemma}"

    def get(self, lemma: str, stats: CacheStats) -> CachedSign | None:
        if not self._breaker.allow():
            stats.errors += 1
            return None
        try:
            raw = self._store.get(self.key(lemma))
        except Exception:  # noqa: BLE001 - fail open; nada do erro e logado (pode conter URL/host)
            self._breaker.failure()
            stats.errors += 1
            return None
        self._breaker.success()
        if raw is None:
            stats.misses += 1
            return None
        cached = self._decode(raw, lemma)
        if cached is None:
            stats.invalid += 1
            stats.misses += 1
        else:
            stats.hits += 1
        return cached

    def put(self, lemma: str, sign: GeneratedSign, params: dict[str, str], model: str, stats: CacheStats) -> None:
        if not self._breaker.allow():
            stats.errors += 1
            return
        value = json.dumps(
            {
                "sign": sign.model_dump(exclude_none=True),
                "params": params,
                "model": model[:80],
                "created_at": datetime.now(UTC).isoformat(timespec="seconds"),
                "validated": False,
            },
            separators=(",", ":"),
        )
        if len(value.encode("utf-8")) > MAX_VALUE_BYTES:
            return
        try:
            self._store.set(self.key(lemma), value, self._ttl)
        except Exception:  # noqa: BLE001
            self._breaker.failure()
            stats.errors += 1
            return
        self._breaker.success()
        stats.stored += 1

    @staticmethod
    def _decode(raw: str, lemma: str) -> CachedSign | None:
        if len(raw) > MAX_VALUE_BYTES:
            return None
        try:
            data = json.loads(raw, parse_constant=lambda _c: (_ for _ in ()).throw(ValueError("nao finito")))
            if not isinstance(data, dict):
                return None
            sign = validate_generated_sign(data.get("sign"), lemma)
            params = data.get("params")
            if not isinstance(params, dict) or not all(isinstance(k, str) and isinstance(v, str) for k, v in params.items()):
                return None
            model = data.get("model")
            return CachedSign(sign, params, model if isinstance(model, str) else "")
        except (ValueError, InvalidSign, TypeError):
            return None


def log_stats(stats: CacheStats, described: int, failed: int) -> None:
    log.info(
        "generated cache hits=%d misses=%d stored=%d invalid=%d errors=%d described=%d failed=%d",
        stats.hits, stats.misses, stats.stored, stats.invalid, stats.errors, described, failed,
    )
