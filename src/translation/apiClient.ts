/**
 * Cliente da API local de traducao (POST /v1/translate), contrato em docs/api-design.md.
 *
 * Seguranca/robustez: mesma origem (proxy do Vite), sem cookies (credentials: 'omit'),
 * timeout com AbortController, tamanho de resposta limitado, validacao rigorosa no front
 * (nunca confiar so no servidor), ids de sinal resolvidos no SIGNS local e poses sempre do

 * front (SIGNS e fingerspell()). Campos extras desconhecidos (ex.: cached, params) sao ignorados.
 * Rotulos de origem nas glosas da API: "sinal", "soletração", "gerado por IA".  Qualquer falha => ApiFailure e o chamador usa o translate()
 * local. O texto do usuario nunca e logado; mensagens da API nunca sao exibidas cruas.
 */
import { SIGNS } from '../signs/dictionary';
import type { SignDef } from '../signs/types';
import { GENERATED_LIMITS, isSafeWord, validateGeneratedSign } from '../signs/validateSign';
import { fingerspell } from './fingerspell';
import { MAX_INPUT_CHARS, isInputTruncated, normalizeText } from './normalize';
import { MAX_SIGNS_PER_PHRASE, type Translation } from './translate';

export const API_URL = '/v1/translate';
export const API_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_CHARS = 256_000;
const MAX_ITEMS = 200;

export type ApiFailureReason = 'timeout' | 'network' | 'http' | 'invalid';
export interface ApiFailure {
  readonly ok: false;
  readonly reason: ApiFailureReason;
}
export interface ApiSuccess {
  readonly ok: true;
  readonly translation: Translation;
  /** 'llm' ou 'local-fallback' (a propria API caiu no fallback dela). */
  readonly source: 'llm' | 'local-fallback';
}
export type ApiResult = ApiSuccess | ApiFailure;

export interface ApiOptions {
  readonly allowGenerated: boolean;
}

const WARNING_TEXT: Readonly<Record<string, string>> = {
  generated_not_libras: 'Gerado por IA, NÃO é Libras, pode estar errado.',
  incomplete: 'A API marcou a tradução como incompleta.',
};

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

/** Converte a resposta JSON (nao confiavel) em Translation, ou null se invalida. */
export function parseApiResponse(
  raw: unknown,
  opts: ApiOptions,
  inputTruncated = false,
): { translation: Translation; source: 'llm' | 'local-fallback' } | null {
  if (!isObj(raw) || raw.apiVersion !== '1') return null;
  const source = raw.source === 'llm' || raw.source === 'local-fallback' ? raw.source : null;
  if (!source) return null;
  if (!Array.isArray(raw.items) || raw.items.length > MAX_ITEMS) return null;
  if (typeof raw.incomplete !== 'boolean') return null;
  if (!Array.isArray(raw.warnings) || raw.warnings.length > 10) return null;

  const apiWarnings: string[] = [];
  for (const w of raw.warnings as unknown[]) {
    if (typeof w !== 'string' || !/^[a-z_]{1,40}$/.test(w)) return null;
    apiWarnings.push(WARNING_TEXT[w] ?? `Aviso da API: ${w}.`);
  }

  const signs: SignDef[] = [];
  const glosses: string[] = [];
  const missing = new Set<string>();
  const omitted: string[] = [];
  const generatedWords: string[] = [];
  let generatedCount = 0;
  let downgraded = false;

  const spell = (word: string): void => {
    const sp = fingerspell(normalizeText(word).replace(/ /g, ''));
    signs.push(...sp.signs);
    sp.missing.forEach((m) => missing.add(m));
    glosses.push(`${sp.missing.length > 0 ? 'soletração (parcial)' : 'soletração'}: ${word.toUpperCase()}`);
  };

  for (const item of raw.items as unknown[]) {
    if (!isObj(item)) return null;
    switch (item.kind) {
      case 'sign': {
        const id = item.id;
        if (typeof id !== 'string') return null;
        const sign = SIGNS.get(id);
        if (!sign || sign.id === 'REPOUSO') return null; // id desconhecido: resposta invalida
        signs.push(sign);
        glosses.push(`sinal: ${sign.id}`);
        break;
      }
      case 'fingerspell': {
        if (!isSafeWord(item.word)) return null;
        spell(item.word);
        break;
      }
      case 'omitted': {
        if (!isSafeWord(item.word)) return null;
        omitted.push(item.word);
        break;
      }
      case 'generated': {
        if (!isSafeWord(item.word)) return null;
        const word = item.word;
        const ok = opts.allowGenerated && generatedCount < GENERATED_LIMITS.maxPerPhrase;
        const sign = ok ? validateGeneratedSign(item.sign, word) : null;
        if (sign) {
          generatedCount++;
          signs.push(sign);
          generatedWords.push(word);
          glosses.push(`gerado por IA (não é Libras): ${word}`);
        } else {
          // Nao pedido, invalido ou excedente: vira datilologia e avisa (sem "correcao criativa").
          downgraded = true;
          spell(word);
        }
        break;
      }
      default:
        return null;
    }
  }

  if (downgraded) apiWarnings.push('Um sinal gerado foi rejeitado na validação; a palavra foi soletrada.');
  let truncated = false;
  if (signs.length > MAX_SIGNS_PER_PHRASE) {
    truncated = true;
    signs.length = MAX_SIGNS_PER_PHRASE;
  }
  const missingLetters = [...missing];
  const omittedWords = [...new Set(omitted)];
  const translation: Translation = {
    signs,
    glosses,
    missingLetters,
    truncated,
    inputTruncated,
    omittedWords,
    generatedWords,
    apiWarnings,
    incomplete: raw.incomplete || missingLetters.length > 0 || truncated || inputTruncated || generatedWords.length > 0,
  };
  return { translation, source };
}

/** Chama a API. Nunca lanca: qualquer problema vira ApiFailure (o chamador usa o modo local). */
export async function translateViaApi(
  text: string,
  opts: ApiOptions,
  fetchImpl: FetchLike = (u, i) => fetch(u, i),
  timeoutMs: number = API_TIMEOUT_MS,
  externalSignal?: AbortSignal,
): Promise<ApiResult> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onExternalAbort = (): void => {
    controller.abort();
  };
  externalSignal?.addEventListener('abort', onExternalAbort, { once: true });
  try {
    const res = await fetchImpl(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ text: text.slice(0, MAX_INPUT_CHARS), options: { allowGenerated: opts.allowGenerated } }),
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
    });
    if (!res.ok) return { ok: false, reason: 'http' };
    const body = await res.text();
    if (body.length > MAX_RESPONSE_CHARS) return { ok: false, reason: 'invalid' };
    let json: unknown;
    try {
      json = JSON.parse(body);
    } catch {
      return { ok: false, reason: 'invalid' };
    }
    const parsed = parseApiResponse(json, opts, isInputTruncated(text));
    return parsed ? { ok: true, ...parsed } : { ok: false, reason: 'invalid' };
  } catch {
    return { ok: false, reason: timedOut ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
}
