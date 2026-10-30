"""Adapters de provedores LLM e utilitarios de resiliencia."""
from __future__ import annotations

from adapters.base import LlmProvider, ProviderError
from adapters.fake import FakeProvider
import logging

from adapters.cache import CacheStore, InMemoryCache, RedisCache
from app.config import ConfigError, Settings

log = logging.getLogger("libras.api")


def build_provider(settings: Settings) -> LlmProvider:
    """Fabrica: escolhe o provider por LLM_PROVIDER."""
    if settings.provider == "fake":
        return FakeProvider()
    if settings.provider == "openai_compatible":
        from adapters.openai_compatible import OpenAICompatibleProvider

        try:
            return OpenAICompatibleProvider(
                base_url=settings.base_url,
                api_key=settings.api_key,
                model=settings.model,
                timeout_s=settings.timeout_s,
                output_mode=settings.output_mode,
            )
        except ValueError as exc:
            raise ConfigError(str(exc)) from None
    raise ConfigError("LLM_PROVIDER invalido")


def build_cache_store(settings: Settings) -> CacheStore:
    """InMemoryCache sem REDIS_URL; RedisCache com ela. Erro de import/cliente -> memoria (fail open)."""
    if not settings.redis_url:
        return InMemoryCache()
    if not settings.redis_url.startswith(("redis://", "rediss://")):
        raise ConfigError("REDIS_URL deve comecar com redis:// ou rediss://")
    try:
        import redis  # noqa: PLC0415

        client = redis.Redis.from_url(
            settings.redis_url,
            password=settings.redis_password or None,  # senha separada: nunca na URL nem em log
            socket_timeout=1.0,
            socket_connect_timeout=1.0,
            decode_responses=True,
        )
        return RedisCache(client)
    except Exception:  # noqa: BLE001
        log.warning("redis indisponivel na inicializacao; usando cache em memoria")
        return InMemoryCache()


__all__ = ["LlmProvider", "ProviderError", "FakeProvider", "build_provider", "build_cache_store"]
