"""Adendo 1: sinais gerados sob opt-in, com validacao rigida. Sem rede."""
from __future__ import annotations

import copy
import re
from pathlib import Path

import pytest

from agent.compiler import compile_description
from schemas.description import validate_description
from schemas.generated import BONES, InvalidSign, ranges_for, validate_generated_sign


def fake_generated_sign(word: str) -> dict:  # noqa: ANN201
    return compile_description(validate_description({"handshape": "B", "path": "straight", "location": "chest"}), word)


GOOD = fake_generated_sign("cachorro")


def sign(**over):  # noqa: ANN003, ANN201
    s = copy.deepcopy(GOOD)
    s.update(over)
    return s


# ---------- contrato dos ossos com o front ----------
def test_bones_json_matches_front() -> None:
    ts = Path(__file__).resolve().parents[2] / "src" / "signs" / "poseHelpers.ts"
    if not ts.is_file():
        pytest.skip("poseHelpers.ts ausente")
    import json
    import sys

    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from scripts import gen_bones  # noqa: PLC0415

    assert gen_bones.parse() == json.loads(gen_bones.OUT.read_text(encoding="utf-8"))
    assert len(BONES) == 42 and len(set(BONES)) == 42
    src = ts.read_text(encoding="utf-8")
    for lit in re.findall(r"^\s*'([A-Za-z]+)',\s*$", src[src.index("ALL_BONES") :], re.M):
        assert lit in BONES  # todo osso literal do front esta na whitelist
    types = (ts.parent / "types.ts").read_text(encoding="utf-8")
    for needed in ("brows", "emotion", "'up' | 'furrowed'", "'happy' | 'sad' | 'angry' | 'relaxed' | 'surprised'"):
        assert needed in types


def test_ranges_cover_front_dictionary_usage() -> None:
    assert ranges_for("rightIndexProximal")[2] == (0.0, 1.6) and ranges_for("leftIndexProximal")[2] == (-1.6, 0.0)
    assert ranges_for("rightUpperArm")[0][0] == -2.0 and ranges_for("head")[1] == (-0.6, 0.6)
    assert all(len(ranges_for(b)) == 3 for b in BONES)


# ---------- validacao do sinal ----------
def test_good_sign_passes_and_id_label_are_server_controlled() -> None:
    s = validate_generated_sign(sign(id="gen_cão; <script>", label="Libras OFICIAL"), "cachorro")
    assert re.fullmatch(r"GEN_[A-Z0-9_]+", s.id) and "(gerado por IA)" in s.label and "OFICIAL" not in s.label
    assert [k.time for k in s.keyframes][0] == 0.0 and s.keyframes[-1].time == 1.0


def test_clamp_inside_absurd_rejected() -> None:
    k = sign()
    k["keyframes"][1]["pose"]["rightIndexProximal"] = {"x": 0, "y": 0, "z": 3.0}
    k["keyframes"][1]["pose"]["leftIndexProximal"] = {"x": 0, "y": 0, "z": 1.0}  # sentido errado -> 0
    k["keyframes"][1]["pose"]["head"] = {"x": -5, "y": 0, "z": 0}
    s = validate_generated_sign(k, "cachorro")
    pose = s.keyframes[1].pose
    assert pose["rightIndexProximal"]["z"] == 1.6 and pose["leftIndexProximal"]["z"] == 0.0 and pose["head"]["x"] == -0.6
    for bad in (1e9, -1e9, 7.0):
        k["keyframes"][1]["pose"]["head"] = {"x": bad, "y": 0, "z": 0}
        with pytest.raises(InvalidSign):
            validate_generated_sign(k, "cachorro")


def _mut(fn):  # noqa: ANN001, ANN202
    s = sign()
    fn(s)
    return s


BAD_SIGNS = {
    "osso inexistente": _mut(lambda s: s["keyframes"][1]["pose"].update({"tail": {"x": 0, "y": 0, "z": 0}})),
    "osso upperChest": _mut(lambda s: s["keyframes"][1]["pose"].update({"upperChest": {"x": 0, "y": 0, "z": 0}})),
    "nan": _mut(lambda s: s["keyframes"][1]["pose"]["rightLowerArm"].update(y=float("nan"))),
    "inf": _mut(lambda s: s["keyframes"][1]["pose"]["rightLowerArm"].update(y=float("inf"))),
    "string": _mut(lambda s: s["keyframes"][1]["pose"]["rightLowerArm"].update(y="1.0")),
    "bool": _mut(lambda s: s["keyframes"][1]["pose"]["rightLowerArm"].update(y=True)),
    "vetor sem z": _mut(lambda s: s["keyframes"][1]["pose"].update({"head": {"x": 0, "y": 0}})),
    "vetor com w": _mut(lambda s: s["keyframes"][1]["pose"].update({"head": {"x": 0, "y": 0, "z": 0, "w": 1}})),
    "10 mil keyframes": _mut(lambda s: s.update(keyframes=[{"time": i / 10000, "pose": {}} for i in range(10001)])),
    "1 keyframe": _mut(lambda s: s.update(keyframes=s["keyframes"][:1])),
    "7 keyframes": _mut(lambda s: s.update(keyframes=[{"time": i / 6, "pose": {}} for i in range(7)])),
    "tempo nao monotonico": _mut(lambda s: s["keyframes"][1].update(time=0.0)),
    "tempo fora de [0,1]": _mut(lambda s: s["keyframes"][2].update(time=1.5)),
    "nao comeca em 0": _mut(lambda s: s["keyframes"][0].update(time=0.1)),
    "nao termina em 1": _mut(lambda s: s["keyframes"][-1].update(time=0.9)),
    "duracao curta": sign(duration=399),
    "duracao longa": sign(duration=2501),
    "duracao nan": sign(duration=float("nan")),
    "duracao ausente": {k: v for k, v in sign().items() if k != "duration"},
    "chave extra": sign(script="x"),
    "face invalida": sign(face={"brows": "wild"}),
    "face emocao invalida": sign(face={"emotion": "evil"}),
    "face chave extra": sign(face={"mouth": "open"}),
    "id numerico": sign(id=42),
    "nao dict": "texto livre",
    "pose gigante": _mut(lambda s: s["keyframes"][1].update(pose={f"b{i}": {"x": 0, "y": 0, "z": 0} for i in range(5000)})),
}


@pytest.mark.parametrize("name", list(BAD_SIGNS))
def test_bad_signs_rejected(name: str) -> None:
    with pytest.raises(InvalidSign):
        validate_generated_sign(BAD_SIGNS[name], "cachorro")


def test_face_valid_and_weight_clamped() -> None:
    s = validate_generated_sign(sign(face={"brows": "up", "emotion": "happy", "emotionWeight": 7}), "cachorro")
    assert s.face == {"brows": "up", "emotion": "happy", "emotionWeight": 1.0}


