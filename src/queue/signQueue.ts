import type { SignDef } from '../signs/types';

export interface SignQueueEvents {
  /** Um sinal comeca agora (o animador parte da pose atual). */
  onStart(sign: SignDef, nowMs: number): void;
  /** A fila esvaziou depois de reproduzir algo (volte ao repouso). */
  onIdle(nowMs: number): void;
}

/**
 * Fila de sinais sem sobreposicao: um sinal por vez, em sequencia.
 * Logica pura e dirigida por relogio externo (testavel). `replace` interrompe o sinal
 * atual e descarta o pendente; o animador faz a transicao suave a partir da pose atual.
 */
export class SignQueue {
  private pending: SignDef[] = [];
  private current: SignDef | null = null;
  private startedAt = 0;

  constructor(
    private readonly events: SignQueueEvents,
    private readonly maxLength = 200,
  ) {}

  get isBusy(): boolean {
    return this.current !== null || this.pending.length > 0;
  }

  get length(): number {
    return this.pending.length + (this.current ? 1 : 0);
  }

  /** Retorna quantos sinais foram aceitos (o excedente do limite e descartado). */
  enqueue(signs: readonly SignDef[]): number {
    const room = Math.max(0, this.maxLength - this.pending.length);
    const accepted = signs.slice(0, room);
    this.pending.push(...accepted);
    return accepted.length;
  }

  /** Nova frase: limpa tudo e comeca de novo no proximo tick. */
  replace(signs: readonly SignDef[]): number {
    this.pending = [];
    this.current = null;
    return this.enqueue(signs);
  }

  clear(): void {
    this.pending = [];
    this.current = null;
  }

  tick(nowMs: number): void {
    if (this.current && nowMs - this.startedAt >= this.current.duration) {
      this.current = null;
    }
    if (!this.current) {
      const next = this.pending.shift();
      if (next) {
        this.current = next;
        this.startedAt = nowMs;
        this.events.onStart(next, nowMs);
      } else if (this.wasPlaying) {
        this.wasPlaying = false;
        this.events.onIdle(nowMs);
        return;
      }
    }
    if (this.current) this.wasPlaying = true;
  }

  private wasPlaying = false;
}
