import { Group, Object3D } from 'three';
import { describe, expect, it } from 'vitest';
import { ALL_BONES } from '../signs/poseHelpers';
import type { CanonicalBone } from '../signs/types';
import { NoSkeletonError, prepareAvatar } from './prepareAvatar';

const scene = (): { traverse(cb: (o: Object3D) => void): void } => new Group();
const humanoid = (names: readonly string[]) => ({
  getNormalizedBoneNode: (n: CanonicalBone) => (names.includes(n) ? new Object3D() : null),
});

describe('prepareAvatar (QA-025)', () => {
  it('monta animadores e lista ossos ausentes', () => {
    const r = prepareAvatar({ humanoid: humanoid(ALL_BONES.filter((b) => b !== 'neck')), scene: scene() });
    expect(r.missing).toEqual(['neck']);
    expect(r.face.hasBrowTargets).toBe(false);
  });
  it('sem esqueleto: lanca erro tipado antes de qualquer efeito', () => {
    expect(() => prepareAvatar({ humanoid: humanoid([]), scene: scene() })).toThrow(NoSkeletonError);
  });
  it('falha ao percorrer a cena propaga (o chamador descarta o modelo; nada foi adicionado)', () => {
    const bad = {
      traverse: () => {
        throw new Error('x');
      },
    };
    expect(() => prepareAvatar({ humanoid: humanoid(ALL_BONES), scene: bad })).toThrow('x');
  });
});
