from __future__ import annotations

import os

# Antes de qualquer import da app: sem rede, sem .env real, sem tracing.
os.environ["LLM_PROVIDER"] = "fake"
os.environ.pop("LLM_API_KEY", None)

from collections.abc import Callable  # noqa: E402
from typing import Any  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from adapters.base import ProviderError, ProviderErrorKind  # noqa: E402
from adapters.fake import FakeProvider  # noqa: E402
from app.config import Settings  # noqa: E402
from app.main import create_app  # noqa: E402
from schemas.vocabulary import Vocabulary, load_vocabulary  # noqa: E402


class ScriptedProvider:
    """Provider de teste: devolve/levanta o que o teste mandar. Conta chamadas. Sem rede."""

    name = "scripted"
    model_name = "scripted"
    describe_behavior: Any = None
    describe_calls = 0

    def __init__(self, behavior: Callable[[str], object] | object = None, *, errors: list[ProviderErrorKind] | None = None) -> None:
        self.behavior = behavior
        self.errors = list(errors or [])
        self.calls = 0

    def describe(self, lemma: str, vocab: Vocabulary) -> object:
        self.describe_calls += 1
        b = self.describe_behavior
        if isinstance(b, list):
            b = b.pop(0) if b else None
        if isinstance(b, ProviderError):
            raise b
        if callable(b):
            return b(lemma)
        if b is not None:
            return b
        return FakeProvider().describe(lemma, vocab)

    def gloss(self, text: str, vocab: Vocabulary, allow_generated: bool = False, max_generated: int = 12) -> object:
        self.last_allow_generated = allow_generated
        self.calls += 1
        if self.errors:
            raise ProviderError(self.errors.pop(0))
        if callable(self.behavior):
            return self.behavior(text)
        if self.behavior is None:
            return FakeProvider().gloss(text, vocab, allow_generated)
        return self.behavior


def make_client(provider: Any = None, settings: Settings | None = None, **kw: Any) -> tuple[TestClient, Any]:
    prov = provider or FakeProvider()
    app = create_app(settings or Settings(allow_generated_poses=False), prov)
    app.state.libras.sleep = lambda _s: None  # sem espera real nos retries
    return TestClient(app, raise_server_exceptions=False, **kw), prov


@pytest.fixture
def client() -> TestClient:
    return make_client()[0]


@pytest.fixture
def vocab() -> Vocabulary:
    return load_vocabulary()
