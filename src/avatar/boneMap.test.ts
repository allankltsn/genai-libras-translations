import type { Object3D } from 'three';
import { describe, expect, it } from 'vitest';
import { SIGNS, REST_POSE } from '../signs/dictionary';
import { ALL_BONES } from '../signs/poseHelpers';
import type { CanonicalBone } from '../signs/types';
import { resolveBones } from './boneMap';

const fake = (name: string): Object3D => ({ name }) as unknown as Object3D;
const humanoid = (names: readonly string[]) => {
  const set = new Set<string>(names);
  return { getNormalizedBoneNode: (n: CanonicalBone) => (set.has(n) ? fake(n) : null) };
};

/** Nomes humanoides definidos pela especificacao VRM 1.0 (subconjunto relevante). */
const VRM_HUMANOID_NAMES = new Set<string>([
  'spine',
  'chest',
  'upperChest',
  'neck',
  'head',
  'leftShoulder',
  'rightShoulder',
  'leftUpperArm',
  'rightUpperArm',
  'leftLowerArm',
  'rightLowerArm',
  'leftHand',
  'rightHand',
  ...(['left', 'right'] as const).flatMap((s) => [
    `${s}ThumbMetacarpal`,
    `${s}ThumbProximal`,
    `${s}ThumbDistal`,
    ...['Index', 'Middle', 'Ring', 'Little'].flatMap((f) => [`${s}${f}Proximal`, `${s}${f}Intermediate`, `${s}${f}Distal`]),
  ]),
]);

describe('boneMap (nomes VRM)', () => {
  it('todos os ossos canonicos sao nomes humanoides VRM 1.0 (sem mixamo, sem Pinky)', () => {
    for (const b of ALL_BONES) expect(VRM_HUMANOID_NAMES.has(b), b).toBe(true);
    expect(ALL_BONES.length).toBe(12 + 30);
  });
  it('resolve todos quando o humanoide os tem', () => {
    const r = resolveBones(humanoid(ALL_BONES));
    expect(r.missing).toEqual([]);
    expect(r.bones.get('head')?.name).toBe('head');
  });
  it('lista ossos ausentes sem lancar', () => {
    const r = resolveBones(humanoid(['head']));
    expect(r.bones.size).toBe(1);
    expect(r.missing).toContain('rightUpperArm');
  });
  it('esqueleto sem nenhum osso resolve zero', () => {
    expect(resolveBones(humanoid([])).bones.size).toBe(0);
  });
  it('todo osso citado por algum sinal e osso VRM conhecido e esta no REST_POSE', () => {
    const cited = new Set<string>();
    for (const sg of SIGNS.values()) for (const kf of sg.keyframes) for (const b of Object.keys(kf.pose)) cited.add(b);
    for (const b of cited) {
      expect(VRM_HUMANOID_NAMES.has(b), `nao VRM: ${b}`).toBe(true);
      expect(Object.keys(REST_POSE), `fora do REST_POSE: ${b}`).toContain(b);
    }
  });
});
