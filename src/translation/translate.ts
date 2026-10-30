import { SIGNS } from '../signs/dictionary';
import type { SignDef } from '../signs/types';
import { fingerspell } from './fingerspell';
import { glossWithOmitted } from './glosser';
import { isInputTruncated, tokenize } from './normalize';

/** Limite de sinais enfileirados por frase (fila sempre limitada). */
export const MAX_SIGNS_PER_PHRASE = 120;
/** Maximo de caracteres de uma palavra soletrada mostrado na glosa. */
const DISPLAY_WORD_MAX = 20;

export interface Translation {
  /** Sinais a executar, em ordem. */
  readonly signs: readonly SignDef[];
  /** Glosas legiveis (ex.: "OI", "soletrar: AGUA", "soletrar (parcial): CASA"). */
  readonly glosses: readonly string[];
  /** Letras sem sinal no dicionario (nao animadas). */
  readonly missingLetters: readonly string[];
  /** Mais de MAX_SIGNS_PER_PHRASE sinais: o excedente foi descartado. */
  readonly truncated: boolean;
  /** Texto de entrada maior que o limite de caracteres: o excedente foi ignorado. */
  readonly inputTruncated: boolean;
  /** Palavras cujo sinal foi GERADO POR IA (nao e Libras validada); sempre vazio no modo local. */
  readonly generatedWords: readonly string[];
  /** Avisos da API ja convertidos em texto fixo pt-BR (vazio no modo local). */
  readonly apiWarnings: readonly string[];
  /** Palavras de ligacao descartadas pela glosa (unicas, na ordem), nao transmitidas. */
  readonly omittedWords: readonly string[];
  /**
   * True quando houve PERDA DE CONTEUDO: letra sem sinal ou truncamento. Palavras de ligacao
   * omitidas (omittedWords) NAO entram aqui, mas nunca sao escondidas: a UI sempre as lista.
   */
  readonly incomplete: boolean;
}

export function translate(text: string): Translation {
  const signs: SignDef[] = [];
  const glosses: string[] = [];
  const missing = new Set<string>();
  let truncated = false;

  const glossed = glossWithOmitted(tokenize(text));
  for (const item of glossed.items) {
    if (item.kind === 'sign') {
      const sign = SIGNS.get(item.signId);
      if (!sign) continue;
      glosses.push(sign.id);
      signs.push(sign);
    } else {
      const spelled = fingerspell(item.word);
      const shown =
        item.word.length > DISPLAY_WORD_MAX ? `${item.word.slice(0, DISPLAY_WORD_MAX)}…` : item.word;
      glosses.push(`${spelled.missing.length > 0 ? 'soletrar (parcial)' : 'soletrar'}: ${shown.toUpperCase()}`);
      signs.push(...spelled.signs);
      spelled.missing.forEach((m) => missing.add(m));
    }
  }
  // Entrada ja limitada a 500 caracteres, entao o laco acima e limitado.
  if (signs.length > MAX_SIGNS_PER_PHRASE) {
    truncated = true;
    signs.length = MAX_SIGNS_PER_PHRASE;
  }
  const inputTruncated = isInputTruncated(text);
  const missingLetters = [...missing];
  const omittedWords = [...new Set(glossed.omitted)];
  return {
    signs,
    glosses,
    missingLetters,
    truncated,
    inputTruncated,
    omittedWords,
    generatedWords: [],
    apiWarnings: [],
    incomplete: missingLetters.length > 0 || truncated || inputTruncated,
  };
}
