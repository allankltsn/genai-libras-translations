import type { Object3D } from 'three';
import type { CanonicalBone } from '../signs/types';
import { ALL_BONES } from '../signs/poseHelpers';

/**
 * Camada "nome canonico -> osso real". Os nomes canonicos sao os nomes humanoides do VRM 1.0
 * e o osso real e o no NORMALIZADO de `vrm.humanoid.getNormalizedBoneNode(nome)` (o three-vrm
 * copia a pose normalizada para o esqueleto real a cada `vrm.update`). Ossos opcionais que o
 * modelo nao tem (ex.: upperChest no Seed-san) simplesmente nao entram.
 */
export interface HumanoidLike {
  getNormalizedBoneNode(name: CanonicalBone): Object3D | null;
}

export interface ResolvedBones {
  readonly bones: Map<CanonicalBone, Object3D>;
  readonly missing: CanonicalBone[];
}

export function resolveBones(humanoid: HumanoidLike): ResolvedBones {
  const bones = new Map<CanonicalBone, Object3D>();
  const missing: CanonicalBone[] = [];
  for (const canonical of ALL_BONES) {
    const node = humanoid.getNormalizedBoneNode(canonical);
    if (node) bones.set(canonical, node);
    else missing.push(canonical);
  }
  return { bones, missing };
}
