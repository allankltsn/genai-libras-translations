import { describe, expect, it } from 'vitest';
import {
  approach,
  BlinkState,
  buildVisemePlan,
  ExpressionAnimator,
  faceTargets,
  findBrowTargets,
  visemeAt,
  visemesFromText,
} from './expressionAnimator';

describe('visemas (estimativa por vogais)', () => {
  it('vogais com e sem acento; consoantes ignoradas', () => {
    expect(visemesFromText('Olá, água!')).toEqual(['oh', 'aa', 'aa', 'ou', 'aa']);
    expect(visemesFromText('xyz')).toEqual([]);
  });
  it('limita o tamanho', () => {
    expect(visemesFromText('a'.repeat(1000)).length).toBe(200);
  });
  it('visemeAt espalha uniformemente e fica nulo fora da janela', () => {
    const plan = buildVisemePlan('ai', 1000, 1000);
    expect(visemeAt(plan, 999)).toBeNull();
    expect(visemeAt(plan, 2000)).toBeNull();
    expect(visemeAt(plan, 1250)?.name).toBe('aa');
    expect(visemeAt(plan, 1750)?.name).toBe('ih');
    expect(visemeAt(plan, 1250)?.weight).toBeGreaterThan(0.5);
    expect(visemeAt(plan, 1500)?.weight ?? 0).toBeLessThan(0.05);
    expect(visemeAt(null, 1250)).toBeNull();
  });
});

describe('piscar e suavizacao', () => {
  it('pisca depois do intervalo e volta a zero', () => {
    const b = new BlinkState(() => 0, 0); // intervalo minimo 2500 ms
    expect(b.weight(1000)).toBe(0);
    expect(b.weight(2580)).toBeCloseTo(1, 1);
    expect(b.weight(2540)).toBeLessThan(b.weight(2580));
    expect(b.weight(2700)).toBe(0);
    expect(b.weight(2900)).toBe(0);
  });
  it('approach converge sem ultrapassar', () => {
    expect(approach(0, 1, 0)).toBe(0);
    const v = approach(0, 1, 0.1);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(1);
    expect(approach(0.5, 0.5, 1)).toBe(0.5);
  });
});

describe('face dos sinais', () => {
  it('sobrancelhas e emocao', () => {
    expect(faceTargets({ brows: 'up' })).toMatchObject({ browUp: 1, browDown: 0, emotion: null });
    expect(faceTargets({ brows: 'furrowed' })).toMatchObject({ browUp: 0, browDown: 1 });
    expect(faceTargets({ emotion: 'happy', emotionWeight: 9 }).emotionWeight).toBe(1);
    expect(faceTargets(undefined).browUp).toBe(0);
  });
});

describe('entradas nao finitas (QA-026)', () => {
  it('faceTargets nao propaga NaN/Infinity', () => {
    expect(faceTargets({ emotion: 'happy', emotionWeight: NaN }).emotionWeight).toBe(0.5);
    expect(faceTargets({ emotion: 'happy', emotionWeight: Infinity }).emotionWeight).toBe(0.5);
    expect(faceTargets({ emotion: 'sad', emotionWeight: -3 }).emotionWeight).toBe(0);
  });
  it('update ignora tempo NaN/Infinity e continua saudavel depois', () => {
    const m = {
      morphTargetDictionary: { eye_brow_up: 0, eye_brow_down: 1 } as Record<string, number>,
      morphTargetInfluences: [0, 0],
    };
    const calls: [string, number][] = [];
    const a = new ExpressionAnimator({ setValue: (n, w) => calls.push([n, w]) }, [m], new BlinkState(() => 0, 1e9));
    a.setFace({ brows: 'up', emotion: 'happy', emotionWeight: 0.5 });
    a.update(0);
    a.update(1000);
    a.update(NaN);
    a.update(Infinity);
    a.update(-Infinity);
    a.update(3000);
    expect(calls.every(([, w]) => Number.isFinite(w))).toBe(true);
    expect(m.morphTargetInfluences.every((x) => Number.isFinite(x))).toBe(true);
    expect(m.morphTargetInfluences[0]).toBeGreaterThan(0.9);
  });
});

describe('ExpressionAnimator (sem WebGL)', () => {
  const mesh = () => ({
    morphTargetDictionary: { eye_brow_up: 0, eye_brow_down: 1 } as Record<string, number>,
    morphTargetInfluences: [0, 0],
  });
  it('valida morph targets de sobrancelha; ausentes degradam sem erro', () => {
    expect(findBrowTargets([{}]).up).toEqual([]);
    expect(findBrowTargets([{ morphTargetDictionary: { x: 0 }, morphTargetInfluences: [0] }]).down).toEqual([]);
    expect(findBrowTargets([mesh()]).up.length).toBe(1);
    const a = new ExpressionAnimator(null, [{}]);
    expect(a.hasBrowTargets).toBe(false);
    expect(() => {
      a.setFace({ brows: 'up' });
      a.update(0);
      a.update(100);
    }).not.toThrow();
  });
  it('sobrancelhas levantadas movem o morph, e reset volta ao neutro', () => {
    const m = mesh();
    const calls: [string, number][] = [];
    const a = new ExpressionAnimator({ setValue: (n, w) => calls.push([n, w]) }, [m], new BlinkState(() => 0, 1e9));
    a.setFace({ brows: 'up', emotion: 'happy', emotionWeight: 0.5 });
    for (let t = 0; t <= 2000; t += 50) a.update(t);
    expect(m.morphTargetInfluences[0]).toBeGreaterThan(0.95);
    expect(m.morphTargetInfluences[1]).toBeLessThan(0.05);
    expect(calls.filter(([n]) => n === 'happy').at(-1)?.[1]).toBeGreaterThan(0.4);
    a.reset();
    for (let t = 2050; t <= 5000; t += 50) a.update(t);
    expect(m.morphTargetInfluences[0]).toBeLessThan(0.05);
    expect(calls.filter(([n]) => n === 'happy').at(-1)?.[1]).toBeLessThan(0.05);
  });
  it('boca so se move dentro do plano de visemas', () => {
    const calls: [string, number][] = [];
    const a = new ExpressionAnimator({ setValue: (n, w) => calls.push([n, w]) }, [], new BlinkState(() => 0, 1e9));
    a.setVisemePlan(buildVisemePlan('a', 0, 1000));
    a.update(500);
    expect(calls.find(([n]) => n === 'aa')?.[1]).toBeGreaterThan(0.5);
    calls.length = 0;
    a.update(1500);
    expect(calls.find(([n]) => n === 'aa')?.[1]).toBe(0);
  });
});
