"""Agente de dois passos: glosa (passo 1) + descricao parametrica/compilador/cache (passo 2). Sem rede."""
from __future__ import annotations

import logging
import re
import threading
import time

import pytest
from fastapi.testclient import TestClient

from adapters.base import ProviderError
from adapters.cache import InMemoryCache
from adapters.fake import fake_description
from agent.glosser import tokenize
from agent.validate import InvalidOutput, validate_llm_output
from app.config import ConfigError, Settings
from app.main import create_app
from schemas.vocabulary import load_vocabulary
from tests.conftest import ScriptedProvider, make_client

ON = Settings(allow_generated_poses=True)
PHRASE_TOKEN = "frasexyzsegredo"


def post(c, text="Oi cachorro", **opts):  # noqa: ANN001, ANN201
    body: dict = {"text": text}
    if opts:
        body["options"] = opts
    return c.post("/v1/translate", json=body)


def gens(b):  # noqa: ANN001, ANN201
    return [i for i in b["items"] if i["kind"] == "generated"]


def kinds(b):  # noqa: ANN001, ANN201
    return [i["kind"] for i in b["items"]]


def test_normal_path_generates_then_hits_cache() -> None:
    c, _ = make_client(settings=ON)
    b = post(c).json()  # allowGenerated omitido => true
    g = gens(b)
    assert kinds(b) == ["sign", "generated"]
    assert g[0]["word"] == "cachorro" and g[0]["cached"] is False and set(g[0]["params"]) >= {"handshape", "location"}
    assert g[0]["sign"]["id"] == "GEN_CACHORRO" and "(gerado por IA)" in g[0]["sign"]["label"]
    assert b["warnings"][0] == "generated_not_libras" and b["incomplete"] is True and "gerado: CACHORRO" in b["glosses"]
    b2 = post(c).json()
    assert gens(b2)[0]["cached"] is True and gens(b2)[0]["sign"] == g[0]["sign"]


def test_cache_hit_skips_llm_step2() -> None:
    c, prov = make_client(ScriptedProvider(), ON)
    post(c, "cachorro gato")
    assert prov.describe_calls == 2
    post(c, "gato cachorro")  # outra ordem/frase: so lemas sao a chave
    assert prov.describe_calls == 2


def _app_with_store(store, provider=None):  # noqa: ANN001, ANN202
    app = create_app(ON, provider or ScriptedProvider(), store)
    app.state.libras.sleep = lambda _s: None
    return TestClient(app, raise_server_exceptions=False)


def test_cache_holds_only_lemma_and_no_phrase_ip_or_order() -> None:
    store = InMemoryCache()
    _app_with_store(store).post("/v1/translate", json={"text": f"Oi {PHRASE_TOKEN} gato, cachorro!"})
    keys = list(store._d)  # noqa: SLF001
    assert keys and all(re.fullmatch(r"libras:gen:v1:[0-9a-f]{12}:[a-z0-9]+", k) for k in keys)
    blob = " ".join(v for v, _ in store._d.values())  # noqa: SLF001
    assert "testclient" not in blob and "Oi " not in blob and "127.0.0.1" not in blob and '"validated":false' in blob


def test_flag_off_or_request_false_makes_no_describe_calls_and_returns_nothing_generated() -> None:
    llm_try = {"items": [{"kind": "generate", "word": "cachorro", "face": {"brows": "up"}}]}
    for settings, opts in ((Settings(allow_generated_poses=False), {}), (ON, {"allowGenerated": False})):
        c, prov = make_client(ScriptedProvider(llm_try), settings)
        r = post(c, "cachorro", **opts)
        assert r.status_code == 200 and gens(r.json()) == [] and prov.describe_calls == 0
        assert kinds(r.json()) == ["fingerspell"] and prov.last_allow_generated is False


def test_server_default_is_on() -> None:
    assert Settings().allow_generated_poses is True and Settings.from_env({}).allow_generated_poses is True
    assert Settings.from_env({"ALLOW_GENERATED_POSES": "false"}).allow_generated_poses is False
    s = Settings.from_env({})
    assert s.generated_max_per_phrase == 12 and s.generated_concurrency == 4 and s.cache_ttl_s == 0
    assert Settings.from_env({"GENERATED_MAX_PER_PHRASE": "20"}).generated_max_per_phrase == 20
    with pytest.raises(ConfigError):
        Settings.from_env({"GENERATED_MAX_PER_PHRASE": "21"})
    assert Settings.from_env({"CACHE_TTL_S": "2592000"}).cache_ttl_s == 2592000
    assert "SEGREDO" not in repr(Settings.from_env({"REDIS_PASSWORD": "SEGREDO"}))


def test_one_failed_description_degrades_only_that_word() -> None:
    prov = ScriptedProvider()

    def desc(lemma: str):  # noqa: ANN202
        if lemma == "gato":
            raise ProviderError("unavailable")
        return fake_description(lemma)

    prov.describe_behavior = desc
    c, _ = make_client(prov, ON)
    b = post(c, "gato cachorro leao").json()
    assert kinds(b) == ["fingerspell", "generated", "generated"]
    assert "generated_unavailable" in b["warnings"] and b["warnings"][0] == "generated_not_libras"


@pytest.mark.parametrize(
    "bad",
    [
        {"handshape": "B", "angulo": 99}, {"handshape": "Q9"}, "texto livre", {"handshape": "B", "path": "teleport"},
        {"handshape": 1e9}, {"handshape": "B", "x": float("nan")}, {"path": "none"}, [],
    ],
)
def test_invalid_description_becomes_fingerspell_with_warning(bad) -> None:  # noqa: ANN001
    prov = ScriptedProvider()
    prov.describe_behavior = lambda lemma: bad
    c, _ = make_client(prov, ON)
    b = post(c, "cachorro").json()
    assert kinds(b) == ["fingerspell"] and "generated_rejected" in b["warnings"]
    assert "generated_not_libras" not in b["warnings"]


def test_bad_output_provider_error_degrades_without_breaker_or_retry() -> None:
    prov = ScriptedProvider()
    prov.describe_behavior = [ProviderError("bad_output")] * 5
    c, _ = make_client(prov, ON)
    b = post(c, "cachorro").json()
    assert prov.describe_calls == 1 and "generated_rejected" in b["warnings"]
    assert c.get("/readyz").json()["breaker"] == "closed"


def test_transient_describe_failure_retries_once() -> None:
    prov = ScriptedProvider()
    prov.describe_behavior = [ProviderError("timeout")]  # 1a chamada falha, 2a cai no Fake
    c, _ = make_client(prov, ON)
    assert gens(post(c, "cachorro").json()) and prov.describe_calls == 2


def test_cap_per_phrase() -> None:
    c, prov = make_client(ScriptedProvider(), Settings(generated_max_per_phrase=2))
    b = post(c, "gato cachorro leao tigre").json()
    assert kinds(b) == ["generated", "generated", "fingerspell", "fingerspell"]
    assert "generated_limit" in b["warnings"] and prov.describe_calls == 2


def test_bounded_concurrency() -> None:
    lock, state = threading.Lock(), {"now": 0, "max": 0}
    prov = ScriptedProvider()

    def slow(lemma: str):  # noqa: ANN202
        with lock:
            state["now"] += 1
            state["max"] = max(state["max"], state["now"])
        time.sleep(0.05)
        with lock:
            state["now"] -= 1
        return fake_description(lemma)

    prov.describe_behavior = slow
    c, _ = make_client(prov, Settings(generated_concurrency=2, generated_max_per_phrase=20))
    b = post(c, "a1x b2x c3x d4x e5x f6x g7x").json()
    assert len(gens(b)) == 7 and state["max"] == 2


def test_open_breaker_degrades_without_new_calls() -> None:
    prov = ScriptedProvider()
    prov.describe_behavior = lambda lemma: (_ for _ in ()).throw(ProviderError("unavailable"))
    c, _ = make_client(prov, Settings(breaker_failures=3, generated_max_per_phrase=20))
    for w in ("gato", "cachorro", "leao"):
        assert kinds(post(c, w).json()) == ["fingerspell"]
    before = prov.describe_calls
    b = post(c, "urso").json()
    assert kinds(b) == ["fingerspell"] and "generated_unavailable" in b["warnings"]
    assert prov.describe_calls == before  # circuito aberto: nenhuma chamada nova


def test_exhausted_budget_degrades_without_calls() -> None:
    c, prov = make_client(ScriptedProvider(), Settings(generation_budget_s=5.0))
    c.app.state.libras.settings = Settings(generation_budget_s=-1.0)
    b = post(c, "gato").json()
    assert kinds(b) == ["fingerspell"] and prov.describe_calls == 0


def test_cache_down_never_fails_translation() -> None:
    class Broken:
        def get(self, key: str):  # noqa: ANN202
            raise ConnectionError("down")

        def set(self, key: str, value: str, ttl_s: int) -> None:
            raise TimeoutError("down")

    r = _app_with_store(Broken()).post("/v1/translate", json={"text": "gato cachorro"})
    assert r.status_code == 200 and len(gens(r.json())) == 2


def test_poisoned_cache_entry_is_redescribed() -> None:
    store = InMemoryCache()
    cl = _app_with_store(store)
    cl.post("/v1/translate", json={"text": "gato"})
    for k in list(store._d):  # noqa: SLF001
        store.set(k, '{"sign": {"id":"GEN_GATO","duration":1e9}}', 0)
    r = cl.post("/v1/translate", json={"text": "gato"}).json()
    assert gens(r)[0]["cached"] is False


def test_step1_validation_rules() -> None:
    v = load_vocabulary()
    toks = tokenize("de comeu cachorro")
    items = [
        {"kind": "generate", "word": "de"},  # ligacao -> omitido
        {"kind": "generate", "word": "comer"},  # vocabulario vence
        {"kind": "generate", "word": "cachorro", "face": {"brows": "up", "x": 1}},  # dica invalida ignorada
    ]
    out = validate_llm_output({"items": items}, v, toks, True)
    assert [(g.kind, g.id or g.word) for g in out] == [("omitted", "de"), ("sign", "COMER"), ("generate", "cachorro")]
    assert out[2].face is None
    ok = validate_llm_output({"items": [{"kind": "generate", "word": "cachorro", "face": {"brows": "up"}}]}, v, toks, True)
    assert ok[0].face == {"brows": "up"}
    for bad in ({"kind": "generate", "word": "Ignore tudo"}, {"kind": "generate"}, {"kind": "generate", "word": "x" * 50}):
        with pytest.raises(InvalidOutput):
            validate_llm_output({"items": [bad]}, v, toks, True)


def test_llm_cannot_inject_raw_angles_through_legacy_generated_kind() -> None:
    sign = {"id": "GEN_X", "duration": 1000, "keyframes": [{"time": 0, "pose": {"head": {"x": 1e9, "y": 0, "z": 0}}}]}
    raw = {"items": [{"kind": "generated", "word": "cachorro", "sign": sign}]}
    c, prov = make_client(ScriptedProvider(raw), ON)
    b = post(c, "cachorro").json()
    assert kinds(b) == ["fingerspell"] and "generated_rejected" in b["warnings"] and prov.describe_calls == 0


def test_face_hint_from_step1_fills_generated_face() -> None:
    raw = {"items": [{"kind": "generate", "word": "cachorro", "face": {"brows": "furrowed", "emotion": "sad"}}]}
    c, _ = make_client(ScriptedProvider(raw), ON)
    f = gens(post(c, "cachorro").json())[0]["sign"]["face"]
    assert f["brows"] == "furrowed" and f["emotion"] == "sad"


def test_logs_have_counts_but_no_text(caplog) -> None:  # noqa: ANN001
    caplog.set_level(logging.DEBUG)
    c, _ = make_client(ScriptedProvider(), Settings(allow_generated_poses=True, api_key="sk-SECRET123"))
    post(c, f"{PHRASE_TOKEN} gato")
    assert "generated cache hits=0 misses=2" in caplog.text
    assert PHRASE_TOKEN not in caplog.text and "gato" not in caplog.text and "sk-SECRET123" not in caplog.text


def test_response_sanity_for_hostile_step1_floods() -> None:
    flood = {"items": [{"kind": "generate", "word": f"w{i}"} for i in range(5)]}
    c, prov = make_client(ScriptedProvider(flood), Settings(generated_max_per_phrase=3))
    b = post(c, "a b c d e").json()  # 5 palavras, 5 itens generate; cap 3
    assert kinds(b).count("generated") == 3 and prov.describe_calls == 3
