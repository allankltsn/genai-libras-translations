"""Configuracao, tracing, fabrica, classificacao de erros do adapter OpenAI-compativel (sem rede)."""
from __future__ import annotations

import os

import httpx
import openai
import pytest

from adapters import build_provider
from adapters.base import ProviderError
from adapters.fake import FakeProvider
from adapters.openai_compatible import OpenAICompatibleProvider, classify_error, parse_json_text
from adapters.resilience import CircuitBreaker, RateLimiter, call_with_retry
from app.config import ConfigError, Settings, assert_tracing_disabled

TRACING_VARS = ("LANGCHAIN_TRACING_V2", "LANGCHAIN_TRACING", "LANGSMITH_TRACING", "LANGSMITH_TRACING_V2")


def test_tracing_is_off_in_this_process() -> None:
    """Falha se o ambiente do processo tiver tracing ligado (o texto do usuario sairia da maquina)."""
    for name in TRACING_VARS:
        assert os.environ.get(name, "false").strip().lower() not in {"1", "true", "yes", "on"}, name


@pytest.mark.parametrize("name", TRACING_VARS)
def test_settings_refuse_to_start_with_tracing_on(name: str) -> None:
    with pytest.raises(ConfigError):
        Settings.from_env({name: "true"})


def test_settings_force_tracing_off() -> None:
    env: dict[str, str] = {}
    Settings.from_env(env)
    assert all(env[n] == "false" for n in TRACING_VARS)
    assert_tracing_disabled({})


def test_settings_defaults_and_validation() -> None:
    s = Settings.from_env({})
    assert s.provider == "fake" and s.allow_generated_poses is True and s.timeout_s == 20.0
    for bad in ({"LLM_PROVIDER": "x"}, {"LLM_TIMEOUT_S": "nan"}, {"LLM_TIMEOUT_S": "9999"}, {"LLM_OUTPUT_MODE": "x"}):
        with pytest.raises(ConfigError):
            Settings.from_env(bad)


def test_api_key_not_in_repr() -> None:
    s = Settings.from_env({"LLM_API_KEY": "sk-SECRET123"})
    assert "sk-SECRET123" not in repr(s) and "sk-SECRET123" not in str(s)


def test_build_provider() -> None:
    assert isinstance(build_provider(Settings()), FakeProvider)
    with pytest.raises(ConfigError):
        build_provider(Settings(provider="openai_compatible"))  # sem chave/modelo
    p = build_provider(Settings(provider="openai_compatible", api_key="sk-x", model="m", base_url="http://127.0.0.1:1/v1"))
    assert isinstance(p, OpenAICompatibleProvider)  # construido; nenhuma chamada de rede feita


def _req() -> httpx.Request:
    return httpx.Request("POST", "http://127.0.0.1:1/v1/chat/completions")


def _status(code: int) -> openai.APIStatusError:
    return openai.APIStatusError("corpo com sk-SECRET123", response=httpx.Response(code, request=_req()), body=None)


@pytest.mark.parametrize(
    ("exc", "kind"),
    [
        (openai.APITimeoutError(request=_req()), "timeout"),
        (openai.APIConnectionError(request=_req()), "unavailable"),
        (_status(429), "quota"),
        (_status(500), "unavailable"),
        (_status(401), "unavailable"),
        (_status(400), "bad_output"),
        (ValueError("json ruim"), "bad_output"),
        (RuntimeError("qualquer"), "unavailable"),
    ],
)
def test_classify_error(exc: BaseException, kind: str) -> None:
    err = classify_error(exc)
    assert err.kind == kind and "SECRET" not in str(err)


def test_json_text_parsing_rejects_bad_replies() -> None:
    assert parse_json_text('```json\n{"items": []}\n```') == {"items": []}
    for bad in ("sem json", '{"items": NaN}', "[" * 10, "x" * 30_000):
        with pytest.raises(ProviderError) as ei:
            parse_json_text(bad)
        assert ei.value.kind == "bad_output"


def test_retry_helper_backoff_with_jitter() -> None:
    sleeps: list[float] = []
    calls = {"n": 0}

    def flaky() -> str:
        calls["n"] += 1
        if calls["n"] == 1:
            raise ProviderError("timeout")
        return "ok"

    assert call_with_retry(flaky, sleep=sleeps.append, rand=lambda: 0.5) == ["ok"][0]
    assert sleeps == [pytest.approx(0.3)]  # 0.3 * 2**0 * (0.5 + 0.5)


def test_breaker_half_open_recovers() -> None:
    t = [0.0]
    b = CircuitBreaker(failures=2, reset_s=10, clock=lambda: t[0])
    b.failure(), b.failure()
    assert b.state == "open" and not b.allow()
    t[0] = 11
    assert b.state == "half-open" and b.allow() and not b.allow()  # so uma sonda
    b.success()
    assert b.state == "closed" and b.allow()


def test_rate_limiter_window_and_bounded_keys() -> None:
    t = [0.0]
    r = RateLimiter(per_min=2, clock=lambda: t[0], max_keys=2)
    assert r.allow("a") and r.allow("a") and not r.allow("a")
    t[0] = 61
    assert r.allow("a")
    assert r.allow("b") and not r.allow("c")  # tabela cheia de chaves recentes: nega, nao cresce
