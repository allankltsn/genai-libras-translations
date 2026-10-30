"""Configuracao por variaveis de ambiente (e api/.env, sem dependencia extra)."""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[1]
_TRUTHY = {"1", "true", "yes", "on"}
_TRACING_VARS = ("LANGCHAIN_TRACING_V2", "LANGCHAIN_TRACING", "LANGSMITH_TRACING", "LANGSMITH_TRACING_V2")

MAX_TEXT_CHARS = 500
MAX_GENERATED_HARD_CEILING = 20


class ConfigError(RuntimeError):
    """Configuracao invalida. A mensagem nunca contem valores de segredos."""


def load_dotenv(path: Path) -> None:
    """Carrega KEY=VALUE de um .env simples sem sobrescrever variaveis ja definidas."""
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def assert_tracing_disabled(env: dict[str, str] | None = None) -> None:
    """Falha fechado se algum tracing (LangSmith/LangChain) estiver ligado; depois forca desligado."""
    environ = os.environ if env is None else env
    for name in _TRACING_VARS:
        if environ.get(name, "").strip().lower() in _TRUTHY:
            raise ConfigError(f"{name} esta ligado; tracing e proibido neste servico (o texto do usuario iria para fora).")
    for name in _TRACING_VARS:
        environ[name] = "false"


def _float(env: dict[str, str], name: str, default: float, lo: float, hi: float) -> float:
    try:
        value = float(env.get(name, default))
    except ValueError as exc:
        raise ConfigError(f"{name} invalido") from exc
    if not (lo <= value <= hi):  # tambem rejeita NaN
        raise ConfigError(f"{name} fora do intervalo {lo}..{hi}")
    return value


@dataclass(frozen=True)
class Settings:
    provider: str = "fake"
    base_url: str = "http://127.0.0.1:20128/v1"
    api_key: str = field(default="", repr=False)  # nunca aparece em repr/log
    model: str = ""
    timeout_s: float = 20.0
    output_mode: str = "structured"  # structured | json_text
    allow_generated_poses: bool = True
    generated_max_per_phrase: int = 12
    generated_concurrency: int = 4
    generation_budget_s: float = 40.0
    redis_url: str = ""
    redis_password: str = field(default="", repr=False)
    cache_ttl_s: int = 0  # 0 = sem expiracao
    cache_version: str = "1"
    rate_limit_per_min: int = 30
    breaker_failures: int = 3
    breaker_reset_s: float = 30.0

    @staticmethod
    def from_env(env: dict[str, str] | None = None, *, read_dotenv: bool = True) -> "Settings":
        if env is None:
            if read_dotenv:
                load_dotenv(API_ROOT / ".env")
            environ: dict[str, str] = os.environ  # type: ignore[assignment]
        else:
            environ = env
        assert_tracing_disabled(environ)
        provider = environ.get("LLM_PROVIDER", "fake").strip().lower()
        if provider not in {"fake", "openai_compatible"}:
            raise ConfigError("LLM_PROVIDER deve ser fake ou openai_compatible")
        output_mode = environ.get("LLM_OUTPUT_MODE", "structured").strip().lower()
        if output_mode not in {"structured", "json_text"}:
            raise ConfigError("LLM_OUTPUT_MODE deve ser structured ou json_text")
        return Settings(
            provider=provider,
            base_url=environ.get("LLM_BASE_URL", "http://127.0.0.1:20128/v1").strip(),
            api_key=environ.get("LLM_API_KEY", "").strip(),
            model=environ.get("LLM_MODEL", "").strip(),
            timeout_s=_float(environ, "LLM_TIMEOUT_S", 20.0, 1.0, 120.0),
            output_mode=output_mode,
            allow_generated_poses=environ.get("ALLOW_GENERATED_POSES", "true").strip().lower() in _TRUTHY,
            generated_max_per_phrase=int(_float(environ, "GENERATED_MAX_PER_PHRASE", 12, 0, MAX_GENERATED_HARD_CEILING)),
            generated_concurrency=int(_float(environ, "GENERATED_CONCURRENCY", 4, 1, 8)),
            generation_budget_s=_float(environ, "GENERATION_BUDGET_S", 40.0, 5.0, 300.0),
            redis_url=environ.get("REDIS_URL", "").strip(),
            redis_password=environ.get("REDIS_PASSWORD", ""),
            cache_ttl_s=int(_float(environ, "CACHE_TTL_S", 0, 0, 10 * 365 * 86400)),
            cache_version=environ.get("CACHE_VERSION", "1").strip()[:16] or "1",
            rate_limit_per_min=int(_float(environ, "RATE_LIMIT_PER_MIN", 30, 1, 10_000)),
            breaker_failures=int(_float(environ, "BREAKER_FAILURES", 3, 1, 100)),
            breaker_reset_s=_float(environ, "BREAKER_RESET_S", 30.0, 1.0, 3600.0),
        )
