"""Compilador DETERMINISTICO: Description (enums) -> sinal no formato SignDef do front.

Reimplementa as convencoes de src/signs/poseHelpers.ts (arm/fingers) e usa as configuracoes de mao
de schemas/handshapes.json (gerado de src/signs/handshapes.ts). Os valores de local/orientacao/
movimento abaixo sao APROXIMACOES NAO VALIDADAS (eixos nao vistos no avatar; nenhum intérprete
de Libras revisou). Tabela escrita a mao, em Python, porque o front nao tem dados equivalentes
(letters.ts so tem a posicao fixa da datilologia); a protecao contra deriva e o teste que compila o
produto cartesiano de enums e exige que o validador estrito nao precise corrigir nenhum angulo
(tests/test_compiler.py) mais o teste de contrato de handshapes.json com o front.

Saida: dict {id, label, duration, keyframes, face}; o chamador passa por validate_generated_sign
(id GEN_, label '(gerado por IA)' montados no servidor).
"""
from __future__ import annotations

import math
from typing import Any

from schemas.description import HANDSHAPES, Description

COMPILER_VERSION = "1"

Pose = dict[str, dict[str, float]]
Arm = dict[str, float]  # abduct, fwd, elbow, wrist, twist

# (abduct, fwd, elbow) do braco dominante (convencao do braco direito; arm() espelha o esquerdo).
LOCATIONS: dict[str, tuple[float, float, float]] = {
    "neutral_front": (0.5, 0.9, 1.3),
    "neutral_side": (0.9, 0.3, 1.2),
    "forehead": (0.4, 1.4, 2.2),
    "temple": (0.8, 0.9, 2.3),
    "face": (0.4, 1.3, 2.0),
    "mouth": (0.35, 1.2, 2.1),
    "chin": (0.35, 1.2, 2.1),
    "chest": (0.3, 0.8, 1.5),
    "shoulder": (0.6, 0.6, 2.0),
    "belly": (0.3, 0.5, 1.2),
}
# (wrist, twist) por orientacao da palma.
PALMS: dict[str, tuple[float, float]] = {
    "side": (0.0, 0.0),
    "down": (0.0, 1.0),
    "up": (0.0, -1.0),
    "front": (-0.3, 0.5),
    "body": (0.3, 0.5),
}
AMP = 0.4
# direcao -> deslocamento (d_abduct, d_fwd, d_elbow) por unidade de amplitude
DIRECTIONS: dict[str, tuple[float, float, float]] = {
    "up": (0.0, 1.0, 0.0),
    "down": (0.0, -1.0, 0.0),
    "forward": (0.0, 0.0, -1.2),
    "back": (0.0, 0.0, 1.2),
    "inward": (-0.75, 0.0, 0.0),
    "outward": (0.75, 0.0, 0.0),
}
FACE_WEIGHT = {"low": 0.3, "mid": 0.5, "high": 0.8}
# Limites do compilador (dentro das faixas de schemas/generated.py).
ABDUCT = (0.0, 1.6)
FWD = (-0.5, 1.9)
ELBOW = (0.0, 2.4)


def _clamp(v: float, lo_hi: tuple[float, float]) -> float:
    return min(lo_hi[1], max(lo_hi[0], v))


def _e(x: float, y: float, z: float) -> dict[str, float]:
    return {"x": round(x, 4), "y": round(y, 4), "z": round(z, 4)}


def arm_pose(side: str, a: Arm) -> Pose:
    s = 1 if side == "right" else -1
    abd, fwd, elb = _clamp(a["abduct"], ABDUCT), _clamp(a["fwd"], FWD), _clamp(a["elbow"], ELBOW)
    return {
        f"{side}UpperArm": _e(-fwd, 0, s * (math.pi / 2 - abd)),
        f"{side}LowerArm": _e(0, s * elb, 0),
        f"{side}Hand": _e(-s * a["twist"], 0, s * a["wrist"]),
    }


def finger_pose(side: str, c: dict[str, float]) -> Pose:
    s = 1 if side == "right" else -1
    pose: Pose = {}
    for name, key in (("Index", "index"), ("Middle", "middle"), ("Ring", "ring"), ("Little", "pinky")):
        curl = c[key]
        pose[f"{side}{name}Proximal"] = _e(0, 0, s * curl)
        pose[f"{side}{name}Intermediate"] = _e(0, 0, s * curl * 0.9)
        pose[f"{side}{name}Distal"] = _e(0, 0, s * curl * 0.6)
    t = c["thumb"]
    pose[f"{side}ThumbMetacarpal"] = _e(0, s * -t * 0.6, s * t * 0.4)
    pose[f"{side}ThumbProximal"] = _e(0, 0, s * t * 0.5)
    pose[f"{side}ThumbDistal"] = _e(0, 0, s * t * 0.4)
    return pose


def _shift(a: Arm, v: tuple[float, float, float], k: float) -> Arm:
    out = dict(a)
    out["abduct"] += v[0] * AMP * k
    out["fwd"] += v[1] * AMP * k
    out["elbow"] += v[2] * AMP * k
    return out


def _states(path: str, base: Arm, direction: str, contact: str) -> list[Arm]:
    v = DIRECTIONS[direction]
    if path in ("none", "wiggle"):
        states = [base]
    elif path == "straight":
        states = [_shift(base, v, -0.5), _shift(base, v, 0.5)]
    elif path == "arc":
        bulge = (0.4, 0.0, 0.0) if direction in ("up", "down") else (0.0, 0.5, 0.0)
        mid = _shift(base, bulge, 0.5)
        states = [_shift(base, v, -0.5), mid, _shift(base, v, 0.5)]
    elif path == "circle":
        r = 0.6
        sense = 1 if direction in ("up", "forward", "outward") else -1
        states = []
        for k in range(4):
            ang = sense * k * math.pi / 2
            s = dict(base)
            s["fwd"] += math.cos(ang) * r * AMP
            s["abduct"] += math.sin(ang) * r * AMP
            states.append(s)
    elif path == "repeat":
        a, b = _shift(base, v, -0.4), _shift(base, v, 0.4)
        states = [a, b, a, b]
    else:  # tap
        a, t = _shift(base, v, -0.5), _shift(base, v, 0.25)
        states = [a, t, a, t]
    states = [dict(s) for s in states]
    if contact == "touch":
        states[-1]["abduct"] -= 0.12
        states[-1]["fwd"] -= 0.1
    elif contact == "brush":
        states[-1] = _shift(states[-1], v, 0.5)
        states[-1]["wrist"] -= 0.2
    return states


def _wiggle(curl: dict[str, float], phase: int) -> dict[str, float]:
    if phase % 2 == 0:
        return curl
    out = dict(curl)
    for f in ("index", "middle", "ring", "pinky"):
        out[f] = curl[f] + 0.5 if curl[f] < 0.75 else curl[f] - 0.6
    return out


def compile_description(desc: Description, lemma: str) -> dict[str, Any]:
    d = desc.values
    side = d["dominant"]
    other = "left" if side == "right" else "right"
    abd, fwd, elb = LOCATIONS[d["location"]]
    wrist, twist = PALMS[d["palm"]]
    base: Arm = {"abduct": abd, "fwd": fwd, "elbow": elb, "wrist": wrist, "twist": twist}
    states = _states(d["path"], base, d["direction"], d["contact"])
    if d["path"] == "wiggle":
        states = [dict(base) for _ in range(4)]
    shape = HANDSHAPES[d["handshape"]]
    n = len(states)
    frames: list[dict[str, Any]] = [{"time": 0, "pose": {}}]
    for i, st in enumerate(states):
        curl = _wiggle(shape, i) if d["path"] == "wiggle" else shape
        pose: Pose = {**arm_pose(side, st), **finger_pose(side, curl)}
        if d["hands"] == "two_mirror":
            pose.update(arm_pose(other, st))
            pose.update(finger_pose(other, curl))
        elif d["hands"] == "two_base":
            base_arm: Arm = {"abduct": 0.5, "fwd": 0.9, "elbow": 1.3, "wrist": 0.0, "twist": -1.0}
            pose.update(arm_pose(other, base_arm))
            pose.update(finger_pose(other, HANDSHAPES["B"]))
        t = 0.5 if n == 1 else 0.15 + 0.7 * i / (n - 1)
        frames.append({"time": round(t, 4), "pose": pose})
    frames.append({"time": 1, "pose": {}})
    face: dict[str, Any] = {}
    if d["brows"] != "none":
        face["brows"] = d["brows"]
    if d["emotion"] != "none":
        face["emotion"] = d["emotion"]
        face["emotionWeight"] = FACE_WEIGHT[d["emotion_weight"]]
    sign: dict[str, Any] = {
        "id": f"GEN_{lemma.upper()}",
        "label": f"{lemma} (gerado por IA)",
        "duration": int(min(2500, max(800, 600 + 250 * n))),
        "keyframes": frames,
    }
    if face:
        sign["face"] = face
    return sign
