"""Gera schemas/bones.json (42 ossos canonicos VRM) a partir de src/signs/poseHelpers.ts (ALL_BONES).

Uso: python scripts/gen_bones.py [--check]
Le o .ts como texto; nao executa nada. Os 12 ossos literais sao lidos de ALL_BONES; os 30 de dedos
seguem a mesma regra de FINGER_BONES (lida do .ts: junturas e dedos). --check falha se divergir.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TS = ROOT / "src" / "signs" / "poseHelpers.ts"
OUT = Path(__file__).resolve().parents[1] / "schemas" / "bones.json"


def parse() -> dict[str, object]:
    src = TS.read_text(encoding="utf-8")
    block = src[src.index("export const ALL_BONES") :]
    block = block[: block.index("];")]
    literals = re.findall(r"^\s*'([A-Za-z]+)',\s*$", block, re.M)
    fb = src[src.index("export const FINGER_BONES") : src.index("export const ALL_BONES")]
    thumb = re.search(r"\(\[((?:'[A-Za-z]+',?\s*)+)\]\s*as const\)\.map\(\(j\): FingerBoneName => `\$\{side\}Thumb", fb)
    finger_names = re.search(r"\(\[((?:'[A-Za-z]+',?\s*)+)\]\s*as const\)\.flatMap\(\(f\)", fb)
    joints = re.findall(r"'([A-Za-z]+)'", thumb.group(1)) if thumb else []
    fingers = re.findall(r"'([A-Za-z]+)'", finger_names.group(1)) if finger_names else []
    if not joints or not fingers or not literals:
        raise SystemExit("formato inesperado de poseHelpers.ts")
    bones = list(literals)
    # ALL_BONES = literais + FINGER_BONES; FINGER_BONES = por lado: polegar (juntas) e dedos x juntas
    for side in ("left", "right"):
        bones += [f"{side}Thumb{j}" for j in joints]
        for f in fingers:
            bones += [f"{side}{f}{j}" for j in ("Proximal", "Intermediate", "Distal")]
    return {"bones": bones}


def main() -> int:
    data = parse()
    text = json.dumps(data, indent=2) + "\n"
    if "--check" in sys.argv:
        return 0 if OUT.exists() and OUT.read_text(encoding="utf-8") == text else 1
    OUT.write_text(text, encoding="utf-8")
    print(f"{len(data['bones'])} ossos")  # type: ignore[arg-type]
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
