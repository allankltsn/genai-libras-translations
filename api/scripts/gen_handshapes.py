"""Gera schemas/handshapes.json a partir de src/signs/handshapes.ts (HANDSHAPES: curl por dedo, A-Z).

Uso: python scripts/gen_handshapes.py [--check]   (le o .ts como texto; nao executa nada)
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TS = ROOT / "src" / "signs" / "handshapes.ts"
OUT = Path(__file__).resolve().parents[1] / "schemas" / "handshapes.json"
FINGERS = ("thumb", "index", "middle", "ring", "pinky")


def parse() -> dict[str, object]:
    src = TS.read_text(encoding="utf-8")
    block = src[src.index("export const HANDSHAPES") :]
    shapes: dict[str, dict[str, float]] = {}
    for m in re.finditer(r"^\s+([A-Z]): \{([^}]*)\}", block, re.M):
        vals = dict(re.findall(r"(\w+): (-?[0-9.]+)", m.group(2)))
        if set(vals) != set(FINGERS):
            raise SystemExit(f"handshape {m.group(1)} incompleta")
        shapes[m.group(1)] = {k: float(vals[k]) for k in FINGERS}
    if len(shapes) < 20:
        raise SystemExit("formato inesperado de handshapes.ts")
    return {"version": "1", "handshapes": shapes}


def main() -> int:
    data = parse()
    text = json.dumps(data, indent=1) + "\n"
    if "--check" in sys.argv:
        return 0 if OUT.exists() and OUT.read_text(encoding="utf-8") == text else 1
    OUT.write_text(text, encoding="utf-8")
    print(f"{len(data['handshapes'])} configuracoes de mao")  # type: ignore[arg-type]
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
