"""Sinal GERADO por LLM (Adendo 1): modelo de resposta, whitelist de ossos e validacao rigida.

AVISO: poses geradas NAO sao Libras validada. Sem 'correcao criativa': ou o sinal passa pelas
regras abaixo (com clamp de angulos dentro de faixa conservadora) ou e rejeitado.

FAIXAS ANATOMICAS (rad, Euler XYZ relativos ao bind/T-pose; convencao de src/signs/poseHelpers.ts).
Conservadoras: cobrem o que o front usa em dictionary.ts com folga, e nao mais. Fora da faixa -> clamp;
|valor| > 2*pi (lixo, ex.: 1e9) -> rejeita o sinal. Lado direito = +, esquerdo = - (sinal `s`).
 - Dedos (nao polegar) Proximal/Intermediate/Distal: z em s*[0, 1.6] (so flexao; o front usa curl <= 1.5 x fator
   <= 1; hiperextensao nao e permitida), x,y em +-0.2 (pequena abducao). Dedo humano flexiona ~90-110 graus por
   juntura (1.6-1.9 rad); 1.6 e o teto seguro para nao atravessar a palma.
 - Polegar (eixo incerto no front): Metacarpal x +-0.5, y +-0.8, z +-0.8 (front usa y ate 0.54, z ate 0.36);
   Proximal/Distal z +-0.9 (front ate 0.45), x,y +-0.3.
 - Shoulder: +-0.3 (clavicula tem pouco movimento util).
 - UpperArm: x em [-2.0, 0.6] (x negativo = elevar para frente; front ate -1.3), y +-1.0 (giro do umero),
   z lado direito [-0.3, 1.7] / esquerdo [-1.7, 0.3] (z = s*(pi/2 - abducao): 0 = T-pose, +-1.57 = braco caido).
 - LowerArm: y (cotovelo) lado direito [-0.1, 2.5] / esquerdo [-2.5, 0.1] (front usa ate 2.0; cotovelo flexiona
   ~2.4 rad; sem hiperextensao), x,z +-0.3.
 - Hand (punho): x (giro do antebraco) +-1.2, y +-0.5, z (flexao) +-0.9 (punho flexiona/estende ~0.8-1.2 rad).
 - Neck: +-0.4 por eixo. Head: +-0.6 por eixo (front usa ate 0.4).
 - Chest/Spine: +-0.4 por eixo (front usa lean <= 0.05 e turn <= 0.3).
"""
from __future__ import annotations

import json
import math
import re
from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel

BONES_PATH = Path(__file__).resolve().parent / "bones.json"
BONES: tuple[str, ...] = tuple(json.loads(BONES_PATH.read_text(encoding="utf-8"))["bones"])
BONE_SET: frozenset[str] = frozenset(BONES)

MAX_GENERATED_PER_PHRASE = 20  # teto duro; o limite efetivo e GENERATED_MAX_PER_PHRASE (padrao 12)
MIN_KEYFRAMES, MAX_KEYFRAMES = 2, 6
MIN_DURATION_MS, MAX_DURATION_MS = 400, 2500
MAX_ABS_RAW = 2 * math.pi
ID_PREFIX = "GEN_"
LABEL_SUFFIX = " (gerado por IA)"
ID_MAX = 40

BROWS = frozenset({"up", "furrowed"})
EMOTIONS = frozenset({"happy", "sad", "angry", "relaxed", "surprised"})

Range = tuple[float, float]
Ranges = tuple[Range, Range, Range]  # x, y, z


def _sym(a: float) -> Range:
    return (-a, a)


def ranges_for(bone: str) -> Ranges:
    side = 1 if bone.startswith("right") else -1
    name = bone[len("right") :] if bone.startswith("right") else bone[len("left") :] if bone.startswith("left") else bone
    if name in ("spine", "chest"):
        return (_sym(0.4),) * 3  # type: ignore[return-value]
    if name == "neck":
        return (_sym(0.4),) * 3  # type: ignore[return-value]
    if name == "head":
        return (_sym(0.6),) * 3  # type: ignore[return-value]
    if name == "Shoulder":
        return (_sym(0.3),) * 3  # type: ignore[return-value]
    if name == "UpperArm":
        return ((-2.0, 0.6), _sym(1.0), (-0.3, 1.7) if side == 1 else (-1.7, 0.3))
    if name == "LowerArm":
        return (_sym(0.3), (-0.1, 2.5) if side == 1 else (-2.5, 0.1), _sym(0.3))
    if name == "Hand":
        return (_sym(1.2), _sym(0.5), _sym(0.9))
    if name == "ThumbMetacarpal":
        return (_sym(0.5), _sym(0.8), _sym(0.8))
    if name in ("ThumbProximal", "ThumbDistal"):
        return (_sym(0.3), _sym(0.3), _sym(0.9))
    # dedos: so flexao em z, no sentido do lado
    return (_sym(0.2), _sym(0.2), (0.0, 1.6) if side == 1 else (-1.6, 0.0))


class InvalidSign(ValueError):
    """Sinal gerado rejeitado. A mensagem e um codigo fixo."""


class GenKeyframe(BaseModel):
    time: float
    pose: dict[str, dict[str, float]]


class GeneratedSign(BaseModel):
    id: str
    label: str
    duration: int
    keyframes: list[GenKeyframe]
    face: dict[str, Any] | None = None


class GeneratedItem(BaseModel):
    kind: Literal["generated"] = "generated"
    origin: Literal["generated"] = "generated"
    word: str
    sign: GeneratedSign
    params: dict[str, str] | None = None  # enums do passo 2 (depuracao)
    cached: bool = False


def _num(v: object) -> float:
    if isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v):
        raise InvalidSign("numero_invalido")
    return float(v)


def sanitize_id(raw_id: object, word: str) -> str:
    if raw_id is not None and not isinstance(raw_id, str):
        raise InvalidSign("id_invalido")
    base = re.sub(r"[^A-Z0-9_]", "_", (raw_id or word).upper())
    base = re.sub(r"_+", "_", base).strip("_")
    if base.startswith(ID_PREFIX):
        base = base[len(ID_PREFIX) :].strip("_")
    base = base[: ID_MAX - len(ID_PREFIX)].strip("_") or re.sub(r"[^A-Z0-9]", "", word.upper())[: ID_MAX - len(ID_PREFIX)]
    if not base:
        raise InvalidSign("id_invalido")
    return ID_PREFIX + base


def validate_face(face: object) -> dict[str, Any] | None:
    if face is None:
        return None
    if not isinstance(face, dict) or set(face) - {"brows", "emotion", "emotionWeight"}:
        raise InvalidSign("face_invalida")
    out: dict[str, Any] = {}
    if face.get("brows") is not None:
        if face["brows"] not in BROWS:
            raise InvalidSign("face_invalida")
        out["brows"] = face["brows"]
    if face.get("emotion") is not None:
        if face["emotion"] not in EMOTIONS:
            raise InvalidSign("face_invalida")
        out["emotion"] = face["emotion"]
    if face.get("emotionWeight") is not None:
        out["emotionWeight"] = round(min(1.0, max(0.0, _num(face["emotionWeight"]))), 4)
    return out or None


def _validate_pose(pose: object) -> dict[str, dict[str, float]]:
    if not isinstance(pose, dict) or len(pose) > len(BONES):
        raise InvalidSign("pose_invalida")
    out: dict[str, dict[str, float]] = {}
    for bone, vec in pose.items():
        if not isinstance(bone, str) or bone not in BONE_SET:
            raise InvalidSign("osso_desconhecido")
        if not isinstance(vec, dict) or set(vec) != {"x", "y", "z"}:
            raise InvalidSign("vetor_invalido")
        rngs = ranges_for(bone)
        clamped: dict[str, float] = {}
        for axis, (lo, hi) in zip("xyz", rngs, strict=True):
            v = _num(vec[axis])
            if abs(v) > MAX_ABS_RAW:
                raise InvalidSign("angulo_absurdo")
            clamped[axis] = round(min(hi, max(lo, v)), 4)
        out[bone] = clamped
    return out


def validate_generated_sign(raw: object, word: str) -> GeneratedSign:
    """Valida um sinal bruto (nao confiavel) para `word`. Levanta InvalidSign."""
    if not isinstance(raw, dict) or set(raw) - {"id", "label", "duration", "keyframes", "face"}:
        raise InvalidSign("formato_invalido")
    label = raw.get("label")
    if label is not None and (not isinstance(label, str) or len(label) > 120):
        raise InvalidSign("label_invalido")
    duration = _num(raw.get("duration"))
    if not (MIN_DURATION_MS <= duration <= MAX_DURATION_MS):
        raise InvalidSign("duracao_fora_da_faixa")
    kfs = raw.get("keyframes")
    if not isinstance(kfs, list) or not (MIN_KEYFRAMES <= len(kfs) <= MAX_KEYFRAMES):
        raise InvalidSign("keyframes_invalidos")
    frames: list[GenKeyframe] = []
    prev = -1.0
    for kf in kfs:
        if not isinstance(kf, dict) or set(kf) != {"time", "pose"}:
            raise InvalidSign("keyframe_invalido")
        t = _num(kf["time"])
        if not (0.0 <= t <= 1.0) or t <= prev:
            raise InvalidSign("tempo_invalido")
        prev = t
        frames.append(GenKeyframe(time=round(t, 4), pose=_validate_pose(kf["pose"])))
    if frames[0].time != 0.0 or frames[-1].time != 1.0:
        raise InvalidSign("tempo_inicio_fim")
    return GeneratedSign(
        id=sanitize_id(raw.get("id"), word),
        label=f"{word}{LABEL_SUFFIX}",  # sempre gerado pelo servidor
        duration=int(round(duration)),
        keyframes=frames,
        face=validate_face(raw.get("face")),
    )

