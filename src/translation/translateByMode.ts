import { translateViaApi, type ApiOptions, type ApiResult } from './apiClient';
import { translate, type Translation } from './translate';

/** 'local' = so navegador; 'ia' = resposta da API validada; 'fallback' = IA pedida mas API indisponivel. */
export type TranslationMode = 'local' | 'ia' | 'fallback';

export interface ModeRequest {
  readonly useAi: boolean;
  readonly allowGenerated: boolean;
}

export interface ModeResult {
  readonly translation: Translation;
  readonly mode: TranslationMode;
}

type ApiFn = (text: string, opts: ApiOptions, signal?: AbortSignal) => Promise<ApiResult>;

/**
 * Traduz conforme o modo. Com IA desligada NADA e enviado. Com IA ligada, qualquer falha da API
 * (timeout, rede, 4xx/5xx, resposta invalida) cai no translate() local, sem lancar.
 */
export async function translateByMode(
  text: string,
  req: ModeRequest,
  signal?: AbortSignal,
  api: ApiFn = (t, o, s) => translateViaApi(t, o, undefined, undefined, s),
): Promise<ModeResult> {
  if (!req.useAi) return { translation: translate(text), mode: 'local' };
  const r = await api(text, { allowGenerated: req.allowGenerated }, signal);
  if (r.ok) return { translation: r.translation, mode: 'ia' };
  return { translation: translate(text), mode: 'fallback' };
}
