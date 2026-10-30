import { LETTER_SIGNS } from '../signs/letters';
import type { SignDef } from '../signs/types';

export interface FingerspellResult {
  /** Sinais de letra (A-Z) na ordem. Digitos nao tem pose. */
  readonly signs: readonly SignDef[];
  /** Caracteres sem pose (hoje: digitos); explicitos, nenhum gesto e inventado. */
  readonly missing: readonly string[];
}

/** Soletra uma palavra ja normalizada (a-z, 0-9) letra a letra. */
export function fingerspell(word: string): FingerspellResult {
  const signs: SignDef[] = [];
  const missing: string[] = [];
  for (const ch of word) {
    const sign = LETTER_SIGNS.get(ch);
    if (sign) signs.push(sign);
    else missing.push(ch.toUpperCase());
  }
  return { signs, missing };
}
