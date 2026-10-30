"""Resiliencia minima: retry (1x, backoff + jitter, so transitorio), circuit breaker, rate limit."""
from __future__ import annotations

import random
import threading
import time
from collections import deque
from collections.abc import Callable
from typing import TypeVar

from adapters.base import ProviderError

T = TypeVar("T")


def call_with_retry(
    fn: Callable[[], T],
    *,
    retries: int = 1,
    base_delay_s: float = 0.3,
    sleep: Callable[[float], None] = time.sleep,
    rand: Callable[[], float] = random.random,
) -> T:
    """Repete no maximo `retries` vezes, e so para falha transitoria (timeout/unavailable)."""
    attempt = 0
    while True:
        try:
            return fn()
        except ProviderError as exc:
            if not exc.transient or attempt >= retries:
                raise
            sleep(base_delay_s * (2**attempt) * (0.5 + rand()))  # backoff exponencial com jitter
            attempt += 1


class CircuitBreaker:
    """closed -> open (apos N falhas seguidas) -> half-open (apos reset_s) -> closed/open."""

    def __init__(self, failures: int = 3, reset_s: float = 30.0, clock: Callable[[], float] = time.monotonic) -> None:
        self._max = failures
        self._reset = reset_s
        self._clock = clock
        self._fails = 0
        self._opened_at: float | None = None
        self._probing = False
        self._lock = threading.Lock()

    @property
    def state(self) -> str:
        with self._lock:
            if self._opened_at is None:
                return "closed"
            return "half-open" if self._clock() - self._opened_at >= self._reset else "open"

    def allow(self) -> bool:
        with self._lock:
            if self._opened_at is None:
                return True
            if self._clock() - self._opened_at >= self._reset and not self._probing:
                self._probing = True  # uma unica chamada de teste
                return True
            return False

    def success(self) -> None:
        with self._lock:
            self._fails = 0
            self._opened_at = None
            self._probing = False

    def failure(self) -> None:
        with self._lock:
            self._probing = False
            self._fails += 1
            if self._fails >= self._max or self._opened_at is not None:
                self._opened_at = self._clock()


class RateLimiter:
    """Janela deslizante de 60 s por chave, em memoria (limitada em numero de chaves)."""

    def __init__(self, per_min: int = 30, clock: Callable[[], float] = time.monotonic, max_keys: int = 1024) -> None:
        self._per_min = per_min
        self._clock = clock
        self._max_keys = max_keys
        self._hits: dict[str, deque[float]] = {}
        self._lock = threading.Lock()

    def allow(self, key: str) -> bool:
        now = self._clock()
        with self._lock:
            if key not in self._hits and len(self._hits) >= self._max_keys:
                self._hits = {k: q for k, q in self._hits.items() if q and now - q[-1] < 60.0}
                if len(self._hits) >= self._max_keys:
                    return False
            q = self._hits.setdefault(key, deque())
            while q and now - q[0] >= 60.0:
                q.popleft()
            if len(q) >= self._per_min:
                return False
            q.append(now)
            return True
