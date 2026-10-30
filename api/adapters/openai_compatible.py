"""Provider para qualquer endpoint OpenAI-compativel (ex.: 9router local) via langchain-openai.

Seguranca: nenhuma excecao do SDK e propagada (mensagens podem conter trechos do pedido/chave);
so o `kind` do ProviderError sai daqui. Tracing/LangSmith nao e usado (ver app/config.py).
"""
from __future__ import annotations

import json
import re
from typing import Any

import openai
from langchain_core.exceptions import OutputParserException
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from pydantic import SecretStr, ValidationError

from adapters.base import ProviderError
from agent.prompts import build_describe_message, build_describe_prompt, build_system_prompt, build_user_message
from schemas.description import ENUMS, LlmDescription
from schemas.llm import LlmGloss, LlmGlossGen
from schemas.vocabulary import Vocabulary

MAX_REPLY_CHARS = 20_000

_JSON_SUFFIX = (
    '\n\nFormato de saida (JSON puro, sem markdown): {"items": [{"kind": "sign|fingerspell|omitted", '
    '"id": "...", "source": "...", "word": "...", "face": {...}}]}'
)


_JSON_SUFFIX_GEN = (
    '\n\nFormato de saida (JSON puro, sem markdown): {"items": [{"kind": "sign|generate|fingerspell|omitted", '
    '"id": "...", "source": "...", "word": "...", "face": {"brows": "...", "emotion": "..."}}]}'
)
_JSON_SUFFIX_DESCRIBE = (
    "\n\nFormato de saida (JSON puro, sem markdown): objeto com as chaves "
    + ", ".join(ENUMS)
    + "; cada valor e uma string de um dos enums acima; omita as chaves que ficarem no padrao."
)


def _reject_constant(_: str) -> Any:
    raise ValueError("constante JSON nao finita")


def parse_json_text(content: str) -> object:
    """Extrai JSON de uma resposta textual (tolera cerca ```json). Rejeita NaN/Infinity."""
    if len(content) > MAX_REPLY_CHARS:
        raise ProviderError("bad_output")
    s = content.strip()
    s = re.sub(r"^```(?:json)?\s*|\s*```$", "", s)
    try:
        return json.loads(s, parse_constant=_reject_constant)
    except ValueError as exc:
        raise ProviderError("bad_output") from exc


def classify_error(exc: BaseException) -> ProviderError:
    """Converte excecoes do SDK em ProviderError, descartando a mensagem original."""
    if isinstance(exc, ProviderError):
        return exc
    if isinstance(exc, openai.APITimeoutError):
        return ProviderError("timeout")
    if isinstance(exc, openai.RateLimitError):
        return ProviderError("quota")
    if isinstance(exc, openai.APIConnectionError):
        return ProviderError("unavailable")
    if isinstance(exc, openai.APIStatusError):
        code = exc.status_code
        if code == 429:
            return ProviderError("quota")
        if code in (400, 422):
            return ProviderError("bad_output")
        return ProviderError("unavailable")  # 401/403/404/5xx: configuracao ou servico fora
    if isinstance(exc, (OutputParserException, ValidationError, ValueError, TypeError)):
        return ProviderError("bad_output")
    if isinstance(exc, TimeoutError):
        return ProviderError("timeout")
    return ProviderError("unavailable")


class OpenAICompatibleProvider:
    name = "openai_compatible"
    model_name = ""

    def __init__(self, *, base_url: str, api_key: str, model: str, timeout_s: float, output_mode: str = "structured") -> None:
        if not model:
            raise ValueError("LLM_MODEL nao configurado")
        if not api_key:
            raise ValueError("LLM_API_KEY nao configurada")
        self._output_mode = output_mode
        self.model_name = model[:80]
        self._llm = ChatOpenAI(
            model=model,
            base_url=base_url,
            api_key=SecretStr(api_key),
            timeout=timeout_s,
            max_retries=0,  # o retry e nosso (adapters/resilience.py): 1x, so transitorio
            temperature=0,
            max_tokens=1500,
        )

    def _call(self, system: str, user: str, schema: Any) -> object:
        messages = [SystemMessage(content=system), HumanMessage(content=user)]
        try:
            if self._output_mode == "structured":
                runnable = self._llm.with_structured_output(schema, method="function_calling")
                result = runnable.invoke(messages)
                if isinstance(result, schema):
                    return result.model_dump(exclude_none=True)
                raise ProviderError("bad_output")
            reply = self._llm.invoke(messages)
            content = reply.content
            if not isinstance(content, str):
                raise ProviderError("bad_output")
            return parse_json_text(content)
        except ProviderError:
            raise
        except Exception as exc:  # noqa: BLE001 - convertido; mensagem original descartada de proposito
            raise classify_error(exc) from None

    def gloss(self, text: str, vocab: Vocabulary, allow_generated: bool = False, max_generated: int = 12) -> object:
        system = build_system_prompt(vocab, allow_generated, max_generated)
        if self._output_mode == "json_text":
            system += _JSON_SUFFIX_GEN if allow_generated else _JSON_SUFFIX
        return self._call(system, build_user_message(text), LlmGlossGen if allow_generated else LlmGloss)

    def describe(self, lemma: str, vocab: Vocabulary) -> object:
        system = build_describe_prompt()
        if self._output_mode == "json_text":
            system += _JSON_SUFFIX_DESCRIBE
        return self._call(system, build_describe_message(lemma), LlmDescription)
