"""Gera vocabulary/vocabulary.json a partir de src/signs/dictionary.ts (fonte unica do front).

Uso: python scripts/gen_vocabulary.py [--check]
Le o .ts como texto (regex simples); nao executa nada. --check falha se o JSON divergir.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TS = ROOT / "src" / "signs" / "dictionary.ts"
OUT = Path(__file__).resolve().parents[1] / "vocabulary" / "vocabulary.json"

# kind: "lexical" = o agente pode escolher; "letter" = so via datilologia; "technical" = nunca pelo agente.
TECHNICAL = {"REPOUSO", "ESPACO_NEUTRO", "TROCA_PAPEL"}
VERSION = "1"


def parse() -> dict[str, object]:
    src = TS.read_text(encoding="utf-8")
    signs: list[dict[str, object]] = []
    for m in re.finditer(r"id: '([A-Z_]+)',\s*label: '([^']*)'|id: '([A-Z_]+)',\s*label: \"([^\"]*)\"", src):
        sid = m.group(1) or m.group(3)
        label = m.group(2) if m.group(1) else m.group(4)
        end = src.find("keyframes", m.end())
        face_m = re.search(r"face: (\{[^}]*\})", src[m.end() : end])
        face: dict[str, object] = {}
        if face_m:
            for k, v in re.findall(r"(\w+): ('[^']*'|[0-9.]+)", face_m.group(1)):
                face[k] = v.strip("'") if v.startswith("'") else float(v)
        kind = "technical" if sid in TECHNICAL else "letter" if sid.startswith("LETRA_") else "lexical"
        entry: dict[str, object] = {"id": sid, "label": label, "kind": kind}
        if face:
            entry["face"] = face
        signs.append(entry)
    lex_block = src[src.index("export const LEXICON") :]
    lex_block = lex_block[: lex_block.index("]);")]
    lexicon = {w: i for w, i in re.findall(r"\['([a-z ]+)', '([A-Z_]+)'\]", lex_block)}
    return {"version": VERSION, "signs": signs, "lexicon": lexicon}


def main() -> int:
    data = parse()
    text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    if "--check" in sys.argv:
        return 0 if OUT.read_text(encoding="utf-8") == text else 1
    OUT.write_text(text, encoding="utf-8")
    print(f"{len(data['signs'])} sinais, {len(data['lexicon'])} entradas de lexico")  # type: ignore[arg-type]
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
