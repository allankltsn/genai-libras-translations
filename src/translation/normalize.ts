/** Limite de entrada (caracteres); entradas maiores sao truncadas. */
export const MAX_INPUT_CHARS = 500;

/** Letras latinas sem decomposicao NFD (evita fragmentar palavras como "Soren"). */
const SPECIAL_LETTERS: Readonly<Record<string, string>> = {
  ø: 'o',
  æ: 'ae',
  œ: 'oe',
  ß: 'ss',
  đ: 'd',
  ł: 'l',
  ð: 'd',
  þ: 'th',
};

/** True se o texto excede o limite e sera truncado na traducao. */
export function isInputTruncated(input: string): boolean {
  return input.length > MAX_INPUT_CHARS;
}

/**
 * Normaliza texto para lookup: minusculas, sem acentos (NFD), pontuacao vira espaco,
 * espacos colapsados. Mantem apenas letras a-z e digitos.
 */
export function normalizeText(input: string): string {
  return input
    .slice(0, MAX_INPUT_CHARS)
    .toLowerCase()
    .replace(/[øæœßđłðþ]/g, (c) => SPECIAL_LETTERS[c] ?? c)
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function tokenize(input: string): string[] {
  const n = normalizeText(input);
  return n === '' ? [] : n.split(' ');
}
