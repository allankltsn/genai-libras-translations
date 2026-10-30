import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { describeSpeechError, isSpeechSupported, SpeechRecognizer, STOP_TIMEOUT_MS } from './recognizer';

class FakeRec {
  static instances: FakeRec[] = [];
  lang = '';
  continuous = true;
  interimResults = false;
  maxAlternatives = 0;
  onresult: ((ev: unknown) => void) | null = null;
  onerror: ((ev: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  started = 0;
  stopped = 0;
  aborted = 0;
  constructor() {
    FakeRec.instances.push(this);
  }
  start(): void {
    this.started++;
  }
  stop(): void {
    this.stopped++;
  }
  abort(): void {
    this.aborted++;
  }
}

const res = (text: string, isFinal: boolean) => ({
  resultIndex: 0,
  results: { length: 1, 0: { isFinal, length: 1, 0: { transcript: text } } },
});

function make() {
  const log: string[] = [];
  const r = new SpeechRecognizer({
    onTranscript: (t, f) => log.push(`t:${t}:${String(f)}`),
    onListening: (l) => log.push(`l:${String(l)}`),
    onError: (m) => log.push(`e:${m}`),
    onIncomplete: (t) => log.push(`i:${t}`),
  });
  return { r, log };
}

beforeEach(() => {
  FakeRec.instances = [];
  vi.stubGlobal('window', { SpeechRecognition: FakeRec });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('SpeechRecognizer', () => {
  it('detecta suporte e configura pt-BR, sem continuo', () => {
    expect(isSpeechSupported()).toBe(true);
    const { r } = make();
    r.start();
    const rec = FakeRec.instances[0];
    expect(rec?.lang).toBe('pt-BR');
    expect(rec?.continuous).toBe(false);
  });
  it('start e idempotente (clique duplo nao cria duas sessoes)', () => {
    const { r } = make();
    r.start();
    r.start();
    expect(FakeRec.instances.length).toBe(1);
    expect(r.listening).toBe(true);
  });
  it('sem API: erro em pt-BR e nao fica ouvindo', () => {
    vi.stubGlobal('window', {});
    const { r, log } = make();
    expect(isSpeechSupported()).toBe(false);
    r.start();
    expect(r.listening).toBe(false);
    expect(log[0]).toContain('indisponível');
  });
  it('repassa resultado final e encerra', () => {
    const { r, log } = make();
    r.start();
    const rec = FakeRec.instances[0];
    rec?.onresult?.(res('ola mundo', true));
    rec?.onend?.();
    expect(log).toEqual(['l:true', 't:ola mundo:true', 'l:false']);
    expect(r.listening).toBe(false);
  });
  it('QA-012a: terminar so com parcial avisa onIncomplete', () => {
    const { r, log } = make();
    r.start();
    const rec = FakeRec.instances[0];
    rec?.onresult?.(res('tudo be', false));
    rec?.onend?.();
    expect(log).toContain('i:tudo be');
  });
  it('QA-012b: sem onend apos stop(), o timeout encerra a sessao', () => {
    vi.useFakeTimers();
    const { r, log } = make();
    r.start();
    r.stop();
    expect(r.listening).toBe(true);
    vi.advanceTimersByTime(STOP_TIMEOUT_MS + 1);
    expect(r.listening).toBe(false);
    expect(log.at(-1)).toBe('l:false');
    expect(FakeRec.instances[0]?.aborted).toBe(1);
  });
  it('erro usa mensagem fixa, nunca o texto bruto', () => {
    const { r, log } = make();
    r.start();
    FakeRec.instances[0]?.onerror?.({ error: 'SECRET-RAW-CODE' });
    expect(log.at(-1)).not.toContain('SECRET-RAW-CODE');
    expect(describeSpeechError('not-allowed')).toContain('Permissão');
    expect(describeSpeechError('network')).toContain('rede');
  });
  it('dispose anula handlers e aborta', () => {
    const { r } = make();
    r.start();
    const rec = FakeRec.instances[0];
    r.dispose();
    expect(rec?.aborted).toBe(1);
    expect(rec?.onresult).toBeNull();
    expect(r.listening).toBe(false);
  });
});
