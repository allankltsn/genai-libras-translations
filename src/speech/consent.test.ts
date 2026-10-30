import { describe, expect, it } from 'vitest';
import { ConsentGate } from './consent';

describe('ConsentGate', () => {
  it('pergunta antes da primeira captura e lembra a aceitacao (so em memoria)', async () => {
    let asked = 0;
    const gate = new ConsentGate(() => {
      asked++;
      return Promise.resolve(true);
    });
    expect(gate.isAccepted).toBe(false);
    expect(await gate.ensure()).toBe(true);
    expect(await gate.ensure()).toBe(true);
    expect(asked).toBe(1);
  });
  it('recusa nao libera e pergunta de novo no proximo clique', async () => {
    let asked = 0;
    const gate = new ConsentGate(() => {
      asked++;
      return Promise.resolve(false);
    });
    expect(await gate.ensure()).toBe(false);
    expect(await gate.ensure()).toBe(false);
    expect(asked).toBe(2);
    expect(gate.isAccepted).toBe(false);
  });
  it('cliques concorrentes compartilham uma unica pergunta', async () => {
    let asked = 0;
    let resolve: (v: boolean) => void = () => undefined;
    const gate = new ConsentGate(() => {
      asked++;
      return new Promise<boolean>((r) => {
        resolve = r;
      });
    });
    const a = gate.ensure();
    const b = gate.ensure();
    resolve(true);
    expect(await Promise.all([a, b])).toEqual([true, true]);
    expect(asked).toBe(1);
  });
  it('falha ao perguntar conta como recusa', async () => {
    const gate = new ConsentGate(() => Promise.reject(new Error('x')));
    expect(await gate.ensure()).toBe(false);
  });
});
