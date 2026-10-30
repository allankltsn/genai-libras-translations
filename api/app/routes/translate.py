"""POST /v1/translate."""
from __future__ import annotations

import asyncio
import json
import logging
import time
from functools import partial

from fastapi import APIRouter, Request
from pydantic import ValidationError

from adapters.base import ProviderError
from adapters.resilience import call_with_retry
from agent.generate import resolve_generated
from agent.glosser import GItem, finalize, local_gloss, tokenize
from agent.validate import InvalidOutput, validate_llm_output
from app.config import MAX_TEXT_CHARS
from app.deps import ApiError, AppState, get_state
from schemas.api import TranslateRequest, TranslateResponse

router = APIRouter()
log = logging.getLogger("libras.api")

MAX_BODY_BYTES = 8192

_PROVIDER_ERRORS: dict[str, tuple[int, str, str]] = {
    "timeout": (504, "provider_timeout", "O servico de IA demorou demais. Use o modo local."),
    "quota": (503, "provider_quota", "Limite do servico de IA atingido. Use o modo local."),
    "unavailable": (502, "provider_unavailable", "O servico de IA esta indisponivel. Use o modo local."),
}


async def _read_body(request: Request) -> bytes:
    declared = request.headers.get("content-length")
    if declared is not None and declared.isdigit() and int(declared) > MAX_BODY_BYTES:
        raise ApiError(413, "payload_too_large", "Corpo da requisicao grande demais.")
    buf = bytearray()
    async for chunk in request.stream():
        buf.extend(chunk)
        if len(buf) > MAX_BODY_BYTES:
            raise ApiError(413, "payload_too_large", "Corpo da requisicao grande demais.")
    return bytes(buf)


def _reject_constant(_: str) -> object:
    raise ValueError("constante nao finita")


def _parse_request(body: bytes) -> TranslateRequest:
    try:
        data = json.loads(body, parse_constant=_reject_constant)
    except (ValueError, UnicodeDecodeError):
        raise ApiError(400, "invalid_json", "O corpo nao e um JSON valido.") from None
    try:
        return TranslateRequest.model_validate(data)
    except ValidationError:  # nao repassar a mensagem (ecoaria o valor enviado)
        raise ApiError(422, "invalid_request", 'Esperado { "text": "...", "options": { "allowGenerated": false } }.') from None


def _provider_call(state: AppState, text: str, allow_generated: bool) -> object:
    kwargs = dict(state.retry_kwargs)
    if state.sleep is not None:
        kwargs["sleep"] = state.sleep
    return call_with_retry(partial(state.provider.gloss, text, state.vocab, allow_generated, state.settings.generated_max_per_phrase), **kwargs)


@router.post("/v1/translate", response_model=TranslateResponse, response_model_exclude_none=True)
async def translate(request: Request) -> TranslateResponse:
    started = time.monotonic()
    state = get_state(request)
    host = request.client.host if request.client else "unknown"
    if not state.limiter.allow(host):
        raise ApiError(429, "rate_limited", "Muitas requisicoes. Tente novamente em instantes.", {"Retry-After": "60"})

    req = _parse_request(await _read_body(request))
    chars = len(req.text)
    if chars > MAX_TEXT_CHARS:
        raise ApiError(413, "text_too_long", f"O texto excede {MAX_TEXT_CHARS} caracteres.")
    if not req.text.strip():
        raise ApiError(422, "empty_text", "O texto esta vazio.")

    warnings: list[str] = []
    allow_generated = bool(state.settings.allow_generated_poses and req.options.allowGenerated)
    if "allowGenerated" in req.options.model_fields_set and req.options.allowGenerated and not allow_generated:
        warnings.append("Poses geradas por IA nao estao disponiveis; usando apenas o vocabulario curado.")

    tokens = tokenize(req.text)
    source = "llm"
    gitems: list[GItem]
    if not tokens:
        source, gitems = "local-fallback", []
        warnings.append("Nenhuma palavra reconhecivel no texto.")
    elif not state.breaker.allow():
        raise ApiError(503, "provider_circuit_open", "Servico de IA temporariamente suspenso. Use o modo local.")
    else:
        try:
            raw = await asyncio.to_thread(_provider_call, state, req.text, allow_generated)
        except ProviderError as exc:
            state.breaker.failure()
            if exc.kind != "bad_output":
                status, code, message = _PROVIDER_ERRORS[exc.kind]
                _log(status, "error", chars, started, exc.kind)
                raise ApiError(status, code, message) from None
            raw = None
        else:
            state.breaker.success()
        try:
            if raw is None:
                raise InvalidOutput("provider_bad_output")
            gitems = validate_llm_output(raw, state.vocab, tokens, allow_generated, warnings)
            if any(g.kind == "generate" for g in gitems):
                gitems = await asyncio.to_thread(resolve_generated, state, gitems, warnings)
        except InvalidOutput:
            source = "local-fallback"
            warnings[:] = [w for w in warnings if not w.startswith("generated_")]
            gitems = local_gloss(tokens, state.vocab)
            warnings.append("A resposta da IA foi rejeitada na validacao; usado o glosador local.")

    result = finalize(gitems, state.vocab)
    all_warnings = warnings + result.warnings
    if "generated_not_libras" in all_warnings:  # sempre o primeiro aviso
        all_warnings.insert(0, all_warnings.pop(all_warnings.index("generated_not_libras")))
    _log(200, source, chars, started, "ok")
    return TranslateResponse(
        vocabularyVersion=state.vocab.version,
        source=source,  # type: ignore[arg-type]
        items=result.items,
        glosses=result.glosses,
        warnings=all_warnings,
        incomplete=result.incomplete,
    )


def _log(status: int, source: str, chars: int, started: float, outcome: str) -> None:
    """Somente metadados: nunca o texto."""
    log.info("translate status=%d source=%s chars=%d ms=%d outcome=%s", status, source, chars, int((time.monotonic() - started) * 1000), outcome)
