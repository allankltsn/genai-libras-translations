import { describe, expect, it } from 'vitest';
import type { SignDef } from '../signs/types';
import { SignQueue } from './signQueue';

const sign = (id: string, duration = 1000): SignDef => ({ id, label: id, duration, keyframes: [] });

function setup(max?: number) {
  const log: string[] = [];
  const q = new SignQueue(
    {
      onStart: (s, t) => log.push(`start:${s.id}@${String(t)}`),
      onIdle: (t) => log.push(`idle@${String(t)}`),
    },
    max,
  );
  return { q, log };
}

describe('SignQueue', () => {
  it('encadeia sinais em sequencia, sem sobreposicao', () => {
    const { q, log } = setup();
    q.enqueue([sign('A'), sign('B')]);
    q.tick(0);
    q.tick(500);
    expect(log).toEqual(['start:A@0']);
    q.tick(1000);
    expect(log).toEqual(['start:A@0', 'start:B@1000']);
    q.tick(2000);
    expect(log).toEqual(['start:A@0', 'start:B@1000', 'idle@2000']);
    q.tick(3000);
    expect(log.length).toBe(3); // idle dispara uma unica vez
  });

  it('replace interrompe o sinal atual e descarta o pendente', () => {
    const { q, log } = setup();
    q.enqueue([sign('A'), sign('B')]);
    q.tick(0);
    q.replace([sign('C')]);
    q.tick(100);
    expect(log).toEqual(['start:A@0', 'start:C@100']);
    q.tick(1100);
    expect(log.at(-1)).toBe('idle@1100');
  });

  it('clear para tudo e e idempotente', () => {
    const { q } = setup();
    q.enqueue([sign('A')]);
    q.clear();
    q.clear();
    expect(q.isBusy).toBe(false);
  });

  it('fila limitada e enqueue informa quantos aceitou (QA-008)', () => {
    const { q } = setup(3);
    expect(q.enqueue(Array.from({ length: 10 }, (_, i) => sign(`S${String(i)}`)))).toBe(3);
    expect(q.length).toBe(3);
  });
});
