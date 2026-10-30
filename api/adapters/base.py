"""Porta LlmProvider (padrao Adapter)."""
from __future__ import annotations

from typing import Literal, Protocol

from schemas.vocabulary import Vocabulary

ProviderErrorKind = Literal["timeout", "quota", "bad_output", "unavailable"]


class ProviderError(Exception):
    """Falha do provedor. `kind` e a unica informacao propagada; a mensagem e fixa (sem conteudo)."""

    def __init__(self, kind: ProviderErrorKind) -> None:
        super().__init__(kind)
        self.kind: ProviderErrorKind = kind

    @property
    def transient(self) -> bool:
        return self.kind in ("timeout", "unavailable")


class LlmProvider(Protocol):
    name: str
    model_name: str  # so metadado (vai ao cache); nunca segredo

    def gloss(self, text: str, vocab: Vocabulary, allow_generated: bool = False, max_generated: int = 12) -> object:
        """PASSO 1: devolve a glosa BRUTA (dict com 'items'); o chamador a trata como nao confiavel.

        Deve levantar ProviderError (nunca outra excecao) em caso de falha.
        """
        ...

    def describe(self, lemma: str, vocab: Vocabulary) -> object:
        """PASSO 2: devolve a descricao parametrica BRUTA (dict de enums) de UM lema; nao confiavel."""
        ...
