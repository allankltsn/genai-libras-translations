/**
 * Glosa simplificada Portugues -> sequencia de glosas.
 *
 * AVISO: isto e uma APROXIMACAO. Libras tem gramatica propria (ordem, uso do espaco,
 * expressoes nao manuais, classificadores) que nao e capturada por remover palavras
 * funcionais e lematizar por tabela. O resultado e um prototipo que precisa de
 * validacao por interprete de Libras / pessoa surda.
 */
import { LEXICON } from '../signs/dictionary';

export type GlossItem =
  | { readonly kind: 'sign'; readonly signId: string; readonly source: string }
  | { readonly kind: 'fingerspell'; readonly word: string };

/** Artigos, preposicoes e verbos de ligacao comuns (ja normalizados, sem acento). */
export const STOPWORDS: ReadonlySet<string> = new Set([
  // artigos
  'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
  // preposicoes e contracoes
  'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'por', 'pelo', 'pela',
  'para', 'pra', 'pro', 'com', 'ao', 'aos', 'ate', 'sobre',
  // verbos de ligacao e conjuncao/relativo comuns
  'e', 'eh', 'sou', 'es', 'somos', 'sao', 'esta', 'estao', 'estou', 'estamos', 'ser', 'estar',
  'foi', 'era', 'que',
]);

/** Lematizacao minima por tabela: forma flexionada -> forma do lexico. */
export const LEMMAS: ReadonlyMap<string, string> = new Map([
  ['obrigada', 'obrigado'],
  ['obrigadas', 'obrigado'],
  ['obrigados', 'obrigado'],
  ['desculpe', 'desculpa'],
  ['desculpas', 'desculpa'],
  ['come', 'comer'],
  ['comi', 'comer'],
  ['comeu', 'comer'],
  ['comendo', 'comer'],
  ['comemos', 'comer'],
  ['aguas', 'agua'],
  ['banheiros', 'banheiro'],
  ['duvidas', 'duvida'],
  ['perguntas', 'pergunta'],
]);

const MAX_PHRASE_WORDS = 3;

export interface GlossResult {
  readonly items: GlossItem[];
  /** Palavras de ligacao descartadas (nao transmitidas); a UI deve avisar. */
  readonly omitted: string[];
}

/** Compatibilidade: apenas os itens. */
export function gloss(tokens: readonly string[]): GlossItem[] {
  return glossWithOmitted(tokens).items;
}

/** Entrada: tokens normalizados (ver normalize.ts). Saida limitada a tokens de entrada. */
export function glossWithOmitted(tokens: readonly string[]): GlossResult {
  const out: GlossItem[] = [];
  const omitted: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    // 1) frases do lexico (maior primeiro), antes de remover palavras funcionais
    let matched = false;
    for (let n = Math.min(MAX_PHRASE_WORDS, tokens.length - i); n >= 2 && !matched; n--) {
      const phrase = tokens.slice(i, i + n).join(' ');
      const signId = LEXICON.get(phrase);
      if (signId !== undefined) {
        out.push({ kind: 'sign', signId, source: phrase });
        i += n;
        matched = true;
      }
    }
    if (matched) continue;

    const token = tokens[i];
    i++;
    if (token === undefined) continue;
    if (STOPWORDS.has(token)) {
      omitted.push(token);
      continue;
    }
    const lemma = LEMMAS.get(token) ?? token;
    const signId = LEXICON.get(lemma);
    if (signId !== undefined) out.push({ kind: 'sign', signId, source: token });
    else out.push({ kind: 'fingerspell', word: token });
  }
  return { items: out, omitted };
}
