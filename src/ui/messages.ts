import type { Translation } from '../translation/translate';

export type StatusLevel = 'ok' | 'info' | 'warn' | 'error';

export interface StatusMessage {
  readonly level: StatusLevel;
  readonly message: string;
}

/** Maximo de glosas exibidas (o restante vira "+N"). */
export const MAX_GLOSSES_SHOWN = 40;

export function formatGlosses(glosses: readonly string[]): string {
  if (glosses.length === 0) return '—';
  const shown = glosses.slice(0, MAX_GLOSSES_SHOWN).join(' · ');
  const rest = glosses.length - MAX_GLOSSES_SHOWN;
  return rest > 0 ? `${shown} · … (+${String(rest)})` : shown;
}

/** Lista (ate 10) das palavras de ligacao omitidas; sempre mostrada quando existirem. */
function omissionList(t: Translation): string {
  const shown = t.omittedWords.slice(0, 10).join(', ');
  return `${shown}${t.omittedWords.length > 10 ? ', …' : ''}`;
}

/**
 * Mensagem unica (e unica regiao aria-live) sobre o resultado da traducao.
 * Gravidade: 'warn' (ATENCAO) para perda de conteudo (letra sem sinal, truncamento, nada para
 * mostrar); 'info' para artigos/preposicoes/verbos de ligacao omitidos. Omissoes nunca sao
 * escondidas, so mudam de nivel/texto.
 */
export const GENERATED_LABEL = 'Gerado por IA, NÃO é Libras, pode estar errado';

export function describeTranslation(t: Translation): StatusMessage {
  const base = describeCore(t);
  if (t.generatedWords.length === 0 && t.apiWarnings.length === 0) return base;
  const extra: string[] = [];
  if (t.generatedWords.length > 0) {
    extra.push(`${GENERATED_LABEL}: ${t.generatedWords.slice(0, 4).join(', ')}.`);
  }
  extra.push(...t.apiWarnings);
  return { level: t.generatedWords.length > 0 && base.level !== 'error' ? 'warn' : base.level, message: `${extra.join(' ')} ${base.message}` };
}

function describeCore(t: Translation): StatusMessage {
  const omitted =
    t.omittedWords.length > 0
      ? ` Palavras de ligação não mostradas (artigos, preposições, verbos de ligação): ${omissionList(t)}.`
      : '';
  if (t.signs.length === 0) {
    const spelledOnly = t.glosses.length > 0;
    const base = spelledOnly
      ? 'Nenhum sinal pôde ser mostrado: as palavras só seriam soletradas e nenhuma dessas letras tem sinal definido neste protótipo.'
      : 'Nenhum sinal encontrado para este texto.';
    return { level: 'warn', message: `${base} A mensagem NÃO foi transmitida.${omitted}` };
  }
  if (!t.incomplete) {
    return {
      level: t.omittedWords.length > 0 ? 'info' : 'ok',
      message: `Mostrando ${String(t.signs.length)} sinal(is). Protótipo: sinais aproximados, não validados.${omitted}`,
    };
  }
  const parts: string[] = ['ATENÇÃO: a mensagem NÃO foi transmitida por inteiro.'];
  if (t.missingLetters.length > 0) {
    parts.push(`Letras sem sinal definido (ignoradas): ${t.missingLetters.join(', ')}.`);
  }
  if (t.inputTruncated) parts.push('Texto muito longo: só os primeiros 500 caracteres foram considerados.');
  if (t.truncated) parts.push('Frase muito longa: só os primeiros sinais serão mostrados.');
  return { level: 'warn', message: `${parts.join(' ')}${omitted}` };
}

/** Texto exibido no aviso de privacidade do microfone (usado na confirmacao e no painel). */
export const MIC_CONSENT_TEXT =
  'Ao usar o microfone, o seu navegador pode enviar o seu áudio ao serviço de reconhecimento de fala do fornecedor dele ' +
  '(por exemplo, Google no Chrome, Microsoft no Edge, Apple no Safari). Este aplicativo não controla esse envio nem por ' +
  'quanto tempo o fornecedor guarda o áudio. O aplicativo em si não grava nem guarda áudio ou texto. Evite falar dados ' +
  'sensíveis ou de outras pessoas. Se preferir, digite. No modo local (padrão) o texto digitado não é enviado a nenhum ' +
  'serviço; com a opção "Usar IA" ligada, o texto é enviado à API local e, dela, a um provedor externo de modelo de linguagem.';

export const LISTENING_MESSAGE = 'Ouvindo. Fale em português.';
export const MIC_OFF_MESSAGE = 'Microfone desligado.';

/**
 * Novo texto de status ao mudar o estado do microfone, ou null para manter o atual.
 * Evita "Ouvindo..." preso na tela depois que a captura terminou (QA-017), sem apagar
 * resultados ou erros que ja substituiram a mensagem.
 */
export function statusOnListening(current: string, listening: boolean): string | null {
  if (listening) return LISTENING_MESSAGE;
  return current === LISTENING_MESSAGE ? MIC_OFF_MESSAGE : null;
}
