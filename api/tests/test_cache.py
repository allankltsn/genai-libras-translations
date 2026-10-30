"""Porta CacheStore, InMemoryCache, RedisCache (cliente falso escrito a mao), fail-open e revalidacao."""
from __future__ import annotations

import json
import re

import pytest

from adapters import build_cache_store
from adapters.cache import CacheStats, GeneratedSignCache, InMemoryCache, RedisCache
from agent.compiler import compile_description
from agent.generate import table_hash, version_tag
from app.config import ConfigError, Settings
from schemas.description import validate_description
from schemas.generated import validate_generated_sign

DESC = validate_description({"handshape": "B", "path": "straight"})
SIGN = validate_generated_sign(compile_description(DESC, "gato"), "gato")


class FakeRedisClient:
    def __init__(self) -> None:
        self.data: dict[str, str | bytes] = {}
        self.set_calls: list[tuple[str, dict]] = []
        self.fail = False

    def get(self, key: str):  # noqa: ANN201
        if self.fail:
            raise ConnectionError("redis://:SEGREDO@host down")
        return self.data.get(key)

    def set(self, key: str, value: str, **kw):  # noqa: ANN003, ANN201
        if self.fail:
            raise TimeoutError("timeout")
        self.set_calls.append((key, kw))
        self.data[key] = value


def cache(store, ttl=0):  # noqa: ANN001, ANN201
    return GeneratedSignCache(store, version_tag="v1:abc", ttl_s=ttl)


def test_roundtrip_in_memory_and_record_shape() -> None:
    store = InMemoryCache()
    c, st = cache(store), CacheStats()
    assert c.get("gato", st) is None and st.misses == 1
    c.put("gato", SIGN, DESC.values, "modelo-x", st)
    hit = c.get("gato", st)
    assert hit is not None and hit.sign == SIGN and hit.params == DESC.values and hit.model == "modelo-x"
    assert (st.hits, st.stored) == (1, 1)
    raw = json.loads(store.get(c.key("gato")))  # type: ignore[arg-type]
    assert set(raw) == {"sign", "params", "model", "created_at", "validated"} and raw["validated"] is False
    assert re.fullmatch(r"libras:gen:v1:abc:gato", c.key("gato"))


def test_in_memory_ttl_and_bound() -> None:
    t = [0.0]
    m = InMemoryCache(max_entries=2, clock=lambda: t[0])
    m.set("a", "1", 10)
    m.set("b", "2", 0)
    m.set("c", "3", 0)  # expulsa "a" (LRU)
    assert m.get("a") is None and m.get("b") == "2" and m.get("c") == "3"
    m.set("d", "4", 5)
    t[0] = 6
    assert m.get("d") is None


def test_redis_adapter_with_fake_client() -> None:
    client = FakeRedisClient()
    c, st = cache(RedisCache(client), ttl=3600), CacheStats()
    c.put("gato", SIGN, DESC.values, "m", st)
    assert client.set_calls[0][1] == {"ex": 3600}
    client.data[c.key("gato")] = str(client.data[c.key("gato")]).encode()  # bytes tambem
    assert c.get("gato", st) is not None
    c0 = cache(RedisCache(client), ttl=0)
    c0.put("cao", SIGN, DESC.values, "m", st)
    assert client.set_calls[-1][1] == {}  # TTL 0 = sem expiracao


def test_redis_down_fails_open_without_leaking_error_text(caplog) -> None:  # noqa: ANN001
    caplog.set_level("DEBUG")
    client = FakeRedisClient()
    client.fail = True
    c, st = cache(RedisCache(client)), CacheStats()
    for _ in range(5):
        assert c.get("gato", st) is None
    c.put("gato", SIGN, DESC.values, "m", st)
    assert st.errors == 6 and st.hits == 0
    assert "SEGREDO" not in caplog.text
    assert client.set_calls == []  # circuito aberto: nem tenta (sem latencia)


def _poisons() -> list[str]:
    d = SIGN.model_dump()
    bad_bone = {**d, "keyframes": [{"time": 0, "pose": {"tail": {"x": 0, "y": 0, "z": 0}}}, {"time": 1, "pose": {}}]}
    return [
        "nao json", "[]", "null", '{"sign": null}', '{"sign": {"id": "GEN_X"}}', "x" * 70_000,
        json.dumps({"sign": d, "params": {"a": 1}}),
        json.dumps({"sign": {**d, "duration": 1e9}, "params": {}}),
        json.dumps({"sign": bad_bone, "params": {}}),
        '{"sign": NaN}',
    ]


@pytest.mark.parametrize("poison", _poisons())
def test_poisoned_store_is_never_trusted(poison: str) -> None:
    store = InMemoryCache()
    c, st = cache(store), CacheStats()
    store.set(c.key("gato"), poison, 0)
    assert c.get("gato", st) is None and st.invalid == 1


def test_cached_sign_is_clamped_on_read() -> None:
    store = InMemoryCache()
    c, st = cache(store), CacheStats()
    d = SIGN.model_dump()
    d["keyframes"][1]["pose"]["head"] = {"x": 3.0, "y": 0, "z": 0}
    store.set(c.key("gato"), json.dumps({"sign": d, "params": {}}), 0)
    hit = c.get("gato", st)
    assert hit is not None and hit.sign.keyframes[1].pose["head"]["x"] == 0.6


def test_version_tag_changes_with_manual_bump_and_tables(monkeypatch: pytest.MonkeyPatch) -> None:
    assert version_tag("1") != version_tag("2") and re.fullmatch(r"[0-9a-f]{12}", table_hash())
    before = table_hash()
    import agent.compiler as comp

    monkeypatch.setattr(comp, "AMP", comp.AMP + 0.1)
    assert table_hash() != before  # tabela mudou -> chaves antigas deixam de ser lidas
    monkeypatch.setattr(comp, "AMP", comp.AMP - 0.1)
    assert table_hash() == before
    import agent.prompts as pr

    monkeypatch.setattr(pr, "_DESCRIBE", pr._DESCRIBE + " x")
    assert table_hash() != before  # prompt mudou


def test_build_cache_store() -> None:
    assert isinstance(build_cache_store(Settings()), InMemoryCache)
    with pytest.raises(ConfigError):
        build_cache_store(Settings(redis_url="http://x"))
    s = Settings(redis_url="redis://127.0.0.1:1/0", redis_password="SEGREDO-REDIS")
    store = build_cache_store(s)  # nao conecta na construcao
    assert isinstance(store, RedisCache) and "SEGREDO-REDIS" not in repr(s)
    assert cache(store).get("gato", CacheStats()) is None  # Redis fora do ar: miss/erro, nao excecao
