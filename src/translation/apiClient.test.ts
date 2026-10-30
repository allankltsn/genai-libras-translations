import { afterEach, describe, expect, it, vi } from 'vitest';
import { LETTER_SIGNS } from '../signs/letters';
import { GENERATED_LIMITS, validateGeneratedSign } from '../signs/validateSign';
import { translateViaApi, parseApiResponse, API_URL } from './apiClient';

const ok = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status });
const base = { apiVersion: '1', vocabularyVersion: '1', source: 'llm', warnings: [], incomplete: false };
const genSign = (over: Record<string, unknown> = {}) => ({
  id: 'GEN_CACHORRO',
  label: 'ignorado',
  duration: 1600,
  keyframes: [
    { time: 0.4, pose: { rightUpperArm: { x: 0, y: 0, z: 0.5 } } },
    { time: 1, pose: { head: { x: 0.1, y: 0, z: 0 } } },
  ],
  ...over,
});
const genResp = (sign: unknown, word = 'cachorro') => ({
  ...base,
  warnings: ['generated_not_libras'],
  incomplete: true,
  items: [{ kind: 'generated', origin: 'generated', word, sign }],
});

const bodyOf = (i: RequestInit | undefined): string => (typeof i?.body === 'string' ? i.body : '');

afterEach(() => {
  vi.useRealTimers();
});

describe('parseApiResponse: itens validos', () => {
  it('sign + fingerspell + omitted reutilizam SIGNS e fingerspell() locais', () => {
    const r = parseApiResponse(
      { ...base, items: [{ kind: 'sign', id: 'OI' }, { kind: 'fingerspell', word: 'agua' }, { kind: 'omitted', word: 'de' }] },
      { allowGenerated: false },
    );
    expect(r?.translation.signs.map((s) => s.id)).toEqual(['OI', 'SOLETRA_A', 'SOLETRA_G', 'SOLETRA_U', 'SOLETRA_A']);
    expect(r?.translation.signs[1]).toBe(LETTER_SIGNS.get('a'));
    expect(r?.translation.omittedWords).toEqual(['de']);
    expect(r?.translation.glosses).toEqual(['sinal: OI', 'soletração: AGUA']);
    expect(r?.translation.incomplete).toBe(false);
  });
  it('texto original truncado marca incompleto', () => {
    const r = parseApiResponse({ ...base, items: [] }, { allowGenerated: false }, true);
    expect(r?.translation.incomplete).toBe(true);
    expect(r?.translation.inputTruncated).toBe(true);
  });
});

describe('parseApiResponse: respostas malformadas viram null', () => {
  const bad: [string, unknown][] = [
    ['nao objeto', 'x'],
    ['array', []],
    ['apiVersion errada', { ...base, apiVersion: '2', items: [] }],
    ['source desconhecido', { ...base, source: 'x', items: [] }],
    ['items ausente', { ...base }],
    ['items nao array', { ...base, items: {} }],
    ['incomplete nao booleano', { ...base, incomplete: 'no', items: [] }],
    ['warning invalido', { ...base, warnings: ['<script>'], items: [] }],
    ['muitos warnings', { ...base, warnings: Array(11).fill('a'), items: [] }],
    ['kind desconhecido', { ...base, items: [{ kind: 'x' }] }],
    ['item nao objeto', { ...base, items: [1] }],
    ['id de sinal inexistente', { ...base, items: [{ kind: 'sign', id: 'NAO_EXISTE' }] }],
    ['id tecnico REPOUSO', { ...base, items: [{ kind: 'sign', id: 'REPOUSO' }] }],
    ['id nao string', { ...base, items: [{ kind: 'sign', id: 5 }] }],
    ['palavra com html', { ...base, items: [{ kind: 'fingerspell', word: '<b>x</b>' }] }],
    ['palavra longa', { ...base, items: [{ kind: 'omitted', word: 'a'.repeat(41) }] }],
    ['itens demais', { ...base, items: Array(201).fill({ kind: 'omitted', word: 'o' }) }],
  ];
  for (const [name, body] of bad) {
    it(name, () => {
      expect(parseApiResponse(body, { allowGenerated: true })).toBeNull();
    });
  }
});

describe('generated: validacao no front', () => {
  it('sinal valido entra, com rotulo montado no front e aviso', () => {
    const r = parseApiResponse(genResp(genSign()), { allowGenerated: true });
    expect(r?.translation.generatedWords).toEqual(['cachorro']);
    expect(r?.translation.signs[0]?.id).toBe('GEN_CACHORRO');
    expect(r?.translation.signs[0]?.label).toBe('cachorro (gerado por IA)');
    expect(r?.translation.apiWarnings[0]).toContain('NÃO é Libras');
    expect(r?.translation.incomplete).toBe(true);
  });
  it('allowGenerated=false (mesmo que o servidor mande): vira datilologia', () => {
    const r = parseApiResponse(genResp(genSign()), { allowGenerated: false });
    expect(r?.translation.generatedWords).toEqual([]);
    expect(r?.translation.signs.every((s) => s.id.startsWith('SOLETRA_'))).toBe(true);
  });
  const hostile: [string, unknown][] = [
    ['osso inexistente', genSign({ keyframes: [{ time: 0.5, pose: { tail: { x: 0, y: 0, z: 0 } } }, { time: 1, pose: {} }] })],
    ['osso com prototype', genSign({ keyframes: [{ time: 0.5, pose: { __proto__x: { x: 0, y: 0, z: 0 } } }, { time: 1, pose: {} }] })],
    ['NaN (via null no JSON)', genSign({ keyframes: [{ time: 0.5, pose: { head: { x: null, y: 0, z: 0 } } }, { time: 1, pose: {} }] })],
    ['string no angulo', genSign({ keyframes: [{ time: 0.5, pose: { head: { x: '1', y: 0, z: 0 } } }, { time: 1, pose: {} }] })],
    ['keyframes demais', genSign({ keyframes: Array.from({ length: 7 }, (_, i) => ({ time: (i + 1) / 8, pose: {} })) })],
    ['keyframe unico', genSign({ keyframes: [{ time: 1, pose: {} }] })],
    ['tempo fora de ordem', genSign({ keyframes: [{ time: 0.8, pose: {} }, { time: 0.4, pose: {} }] })],
    ['tempo > 1', genSign({ keyframes: [{ time: 0.5, pose: {} }, { time: 1.5, pose: {} }] })],
    ['duracao curta', genSign({ duration: 100 })],
    ['duracao longa', genSign({ duration: 99999 })],
    ['duracao Infinity-like', genSign({ duration: 'x' })],
    ['id sem GEN_', genSign({ id: 'OI' })],
    ['id colide com SIGNS', genSign({ id: 'GEN_' })],
  ];
  for (const [name, sign] of hostile) {
    it(`rejeita (${name}) e soletra a palavra com aviso`, () => {
      const r = parseApiResponse(genResp(sign), { allowGenerated: true });
      expect(r?.translation.generatedWords).toEqual([]);
      expect(r?.translation.signs.every((s) => s.id.startsWith('SOLETRA_'))).toBe(true);
      expect(r?.translation.apiWarnings.join(' ')).toContain('rejeitado');
    });
  }
  it('angulo gigante e limitado (clamp), nunca passa do limite do osso', () => {
    const s = validateGeneratedSign(genSign({ keyframes: [{ time: 0.5, pose: { head: { x: 99, y: -99, z: 0 }, rightIndexProximal: { x: 50, y: 0, z: 50 } } }, { time: 1, pose: {} }] }), 'cachorro');
    expect(s?.keyframes[0]?.pose.head).toEqual({ x: 0.8, y: -0.8, z: 0 });
    expect(s?.keyframes[0]?.pose.rightIndexProximal?.z).toBe(1.8);
  });
  it('no maximo 20 itens generated por frase; o resto e soletrado', () => {
    const items = Array.from({ length: 24 }, (_, i) => ({ kind: 'generated', word: 'gato', sign: genSign({ id: `GEN_G${String(i)}` }) }));
    const r = parseApiResponse({ ...base, incomplete: true, items }, { allowGenerated: true });
    expect(r?.translation.generatedWords.length).toBe(GENERATED_LIMITS.maxPerPhrase);
  });
  it('face: emocao neutral e ignorada, pesos limitados', () => {
    const s = validateGeneratedSign(genSign({ face: { brows: 'up', emotion: 'neutral', emotionWeight: 7 } }), 'gato');
    expect(s?.face).toEqual({ brows: 'up', emotionWeight: 1 });
  });
  it('word insegura no item generated invalida a resposta', () => {
    expect(parseApiResponse(genResp(genSign(), '<img>'), { allowGenerated: true })).toBeNull();
  });
});

describe('translateViaApi', () => {
  it('POST /v1/translate sem cookies, com o corpo esperado', async () => {
    const calls: [string, RequestInit][] = [];
    const f = (u: string, i: RequestInit): Promise<Response> => {
      calls.push([u, i]);
      return Promise.resolve(ok({ ...base, items: [{ kind: 'sign', id: 'OI' }] }));
    };
    const r = await translateViaApi('oi', { allowGenerated: false }, f);
    expect(r.ok).toBe(true);
    expect(calls[0]?.[0]).toBe(API_URL);
    expect(calls[0]?.[1].method).toBe('POST');
    expect(calls[0]?.[1].credentials).toBe('omit');
    expect(JSON.parse(bodyOf(calls[0]?.[1]))).toEqual({ text: 'oi', options: { allowGenerated: false } });
  });
  it('limita o texto enviado a 500 caracteres', async () => {
    let body = '';
    const f = (_u: string, i: RequestInit): Promise<Response> => {
      body = bodyOf(i);
      return Promise.resolve(ok({ ...base, items: [] }));
    };
    const r = await translateViaApi('x'.repeat(900), { allowGenerated: false }, f);
    expect((JSON.parse(body) as { text: string }).text.length).toBe(500);
    expect(r.ok && r.translation.inputTruncated).toBe(true);
  });
  it('4xx/5xx => http', async () => {
    for (const status of [400, 413, 429, 502, 503, 504]) {
      const r = await translateViaApi('oi', { allowGenerated: false }, () => Promise.resolve(ok({ error: { code: 'x', message: 'SEGREDO' } }, status)));
      expect(r).toEqual({ ok: false, reason: 'http' });
    }
  });
  it('API fora (rede) => network', async () => {
    const r = await translateViaApi('oi', { allowGenerated: false }, () => Promise.reject(new TypeError('failed')));
    expect(r).toEqual({ ok: false, reason: 'network' });
  });
  it('JSON invalido, nao-JSON e resposta enorme => invalid', async () => {
    expect(await translateViaApi('oi', { allowGenerated: false }, () => Promise.resolve(new Response('<html>', { status: 200 })))).toEqual({ ok: false, reason: 'invalid' });
    expect(await translateViaApi('oi', { allowGenerated: false }, () => Promise.resolve(ok({ foo: 1 })))).toEqual({ ok: false, reason: 'invalid' });
    expect(await translateViaApi('oi', { allowGenerated: false }, () => Promise.resolve(new Response('x'.repeat(300_000), { status: 200 })))).toEqual({ ok: false, reason: 'invalid' });
  });
  it('timeout simulado aborta o fetch e retorna timeout', async () => {
    vi.useFakeTimers();
    const f = (_u: string, i: RequestInit): Promise<Response> =>
      new Promise((_res, rej) => {
        i.signal?.addEventListener('abort', () => {
          rej(new DOMException('aborted', 'AbortError'));
        });
      });
    const p = translateViaApi('oi', { allowGenerated: false }, f, 10_000);
    await vi.advanceTimersByTimeAsync(10_001);
    expect(await p).toEqual({ ok: false, reason: 'timeout' });
  });
  it('cancelamento externo => network (nao timeout)', async () => {
    const ctl = new AbortController();
    const f = (_u: string, i: RequestInit): Promise<Response> =>
      new Promise((_res, rej) => {
        i.signal?.addEventListener('abort', () => {
          rej(new DOMException('aborted', 'AbortError'));
        });
      });
    const p = translateViaApi('oi', { allowGenerated: false }, f, 10_000, ctl.signal);
    ctl.abort();
    expect(await p).toEqual({ ok: false, reason: 'network' });
  });
});

describe('tolerancia a campos extras e ate 20 gerados', () => {
  it('campos extras (cached, params, desconhecidos) em resposta, itens e sign sao ignorados', () => {
    const resp = {
      ...genResp({ ...genSign(), params: { a: 1 }, extra: 'x' }),
      cached: true,
      futureField: { z: 1 },
    };
    (resp.items[0] as Record<string, unknown>).cached = true;
    (resp.items[0] as Record<string, unknown>).params = { hand: 'open' };
    const r = parseApiResponse(resp, { allowGenerated: true });
    expect(r?.translation.generatedWords).toEqual(['cachorro']);
  });
  it('12 e 20 gerados passam; um invalido no meio degrada so aquele item', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      kind: 'generated',
      word: `palavra${String.fromCharCode(97 + i)}`,
      sign: i === 7 ? genSign({ id: `GEN_P${String(i)}`, duration: 5 }) : genSign({ id: `GEN_P${String(i)}` }),
    }));
    const r = parseApiResponse({ ...base, incomplete: true, warnings: ['generated_not_libras'], items }, { allowGenerated: true });
    expect(r?.translation.generatedWords.length).toBe(19);
    expect(r?.translation.apiWarnings.join(' ')).toContain('rejeitado');
    expect(r?.translation.glosses[7]).toContain('soletração');
    expect(r?.translation.glosses[0]).toContain('gerado por IA');
  });
  it('rotulos de origem nas glosas: sinal, soletração, gerado por IA', () => {
    const r = parseApiResponse(
      { ...base, incomplete: true, items: [{ kind: 'sign', id: 'OI' }, { kind: 'fingerspell', word: 'ab' }, { kind: 'generated', word: 'gato', sign: genSign({ id: 'GEN_GATO' }) }] },
      { allowGenerated: true },
    );
    expect(r?.translation.glosses.map((g) => g.split(':')[0])).toEqual(['sinal', 'soletração', 'gerado por IA (não é Libras)']);
  });
});
