/**
 * Reconhecimento de fala via Web Speech API (SpeechRecognition / webkitSpeechRecognition).
 *
 * PRIVACIDADE: em varios navegadores (ex.: Chrome) o audio e enviado ao servico de
 * reconhecimento do fornecedor do navegador. Este modulo NUNCA armazena, registra ou
 * persiste audio ou transcricoes; apenas repassa o texto ao callback do chamador.
 * O inicio so ocorre por acao explicita do usuario (start() chamado a partir de clique).
 */

interface SpeechAlternativeLike {
  readonly transcript: string;
}
interface SpeechResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechAlternativeLike | undefined;
}
interface SpeechResultEventLike {
  readonly resultIndex: number;
  readonly results: { readonly length: number; [index: number]: SpeechResultLike | undefined };
}
interface SpeechErrorEventLike {
  readonly error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((ev: SpeechResultEventLike) => void) | null;
  onerror: ((ev: SpeechErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | undefined {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function isSpeechSupported(): boolean {
  return getCtor() !== undefined;
}

/** Mensagens em pt-BR; nunca expomos o texto bruto do erro. */
export function describeSpeechError(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Permissão do microfone negada. Você pode digitar o texto no campo ao lado.';
    case 'no-speech':
      return 'Nenhuma fala detectada. Tente novamente.';
    case 'audio-capture':
      return 'Microfone não encontrado.';
    case 'network':
      return 'Falha de rede no serviço de reconhecimento de fala do navegador.';
    case 'aborted':
      return 'Reconhecimento interrompido.';
    default:
      return 'Não foi possível reconhecer a fala. Tente novamente ou digite o texto.';
  }
}

export interface RecognizerHandlers {
  onTranscript(text: string, isFinal: boolean): void;
  onListening(listening: boolean): void;
  onError(message: string): void;
  /** A sessao terminou so com resultado parcial (nao final): confira o texto antes de traduzir. */
  onIncomplete(text: string): void;
}

/** Tempo maximo esperando o navegador encerrar a sessao apos stop(). */
export const STOP_TIMEOUT_MS = 3000;

export class SpeechRecognizer {
  private rec: SpeechRecognitionLike | null = null;
  private stopTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly handlers: RecognizerHandlers) {}

  get listening(): boolean {
    return this.rec !== null;
  }

  /** Deve ser chamado somente a partir de uma acao explicita do usuario. */
  start(): void {
    if (this.rec) return; // idempotente: clique duplo nao cria duas sessoes
    const Ctor = getCtor();
    if (!Ctor) {
      this.handlers.onError('Reconhecimento de fala indisponível neste navegador. Digite o texto.');
      return;
    }
    const rec = new Ctor();
    rec.lang = 'pt-BR';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    let gotFinal = false;
    let lastInterim = '';
    rec.onresult = (ev) => {
      let text = '';
      let isFinal = false;
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        const alt = res?.[0];
        if (res && alt) {
          text += alt.transcript;
          isFinal = isFinal || res.isFinal;
        }
      }
      if (isFinal) gotFinal = true;
      else lastInterim = text;
      this.handlers.onTranscript(text, isFinal);
    };
    rec.onerror = (ev) => {
      this.handlers.onError(describeSpeechError(ev.error));
    };
    rec.onend = () => {
      this.clearStopTimer();
      this.rec = null;
      this.handlers.onListening(false);
      if (!gotFinal && lastInterim.trim() !== '') this.handlers.onIncomplete(lastInterim);
    };
    this.rec = rec;
    try {
      rec.start();
      this.handlers.onListening(true);
    } catch {
      this.rec = null;
      this.handlers.onListening(false);
      this.handlers.onError('Não foi possível iniciar o microfone.');
    }
  }

  stop(): void {
    const rec = this.rec;
    if (!rec) return;
    rec.stop();
    // Se o navegador nunca disparar onend, nao deixamos a UI presa em "Ouvindo".
    this.clearStopTimer();
    this.stopTimer = setTimeout(() => {
      if (this.rec !== rec) return;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      rec.abort();
      this.rec = null;
      this.handlers.onListening(false);
    }, STOP_TIMEOUT_MS);
  }

  private clearStopTimer(): void {
    if (this.stopTimer !== null) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }
  }

  dispose(): void {
    this.clearStopTimer();
    if (this.rec) {
      this.rec.onresult = null;
      this.rec.onerror = null;
      this.rec.onend = null;
      this.rec.abort();
      this.rec = null;
    }
  }
}
