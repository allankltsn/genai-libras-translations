import { Mesh, type BufferGeometry, type Material, type Object3D } from 'three';
import { REST_POSE } from '../signs/dictionary';
import type { CanonicalBone } from '../signs/types';
import { resolveBones, type HumanoidLike } from './boneMap';
import { ExpressionAnimator, type ExpressionManagerLike, type MorphMeshLike } from './expressionAnimator';
import { PoseAnimator } from './poseAnimator';

/** O esqueleto esperado nao foi encontrado no modelo carregado. */
export class NoSkeletonError extends Error {
  constructor() {
    super('Nenhum osso humanoide esperado foi encontrado no modelo.');
    this.name = 'NoSkeletonError';
  }
}

export interface AvatarSource {
  readonly humanoid: HumanoidLike;
  readonly expressionManager?: ExpressionManagerLike | null | undefined;
  readonly scene: { traverse(cb: (o: Object3D) => void): void };
}

export interface PreparedAvatar {
  readonly animator: PoseAnimator;
  readonly face: ExpressionAnimator;
  readonly missing: CanonicalBone[];
}

/**
 * Monta animadores de pose e de rosto ANTES de o modelo entrar na cena (QA-025): se algo lancar
 * aqui, nada foi adicionado e o chamador so precisa descartar o modelo (retry idempotente).
 */
export function prepareAvatar(src: AvatarSource): PreparedAvatar {
  const { bones, missing } = resolveBones(src.humanoid);
  if (bones.size === 0) throw new NoSkeletonError();
  const morphMeshes: MorphMeshLike[] = [];
  src.scene.traverse((o) => {
    if (o instanceof Mesh) {
      const m = o as Mesh<BufferGeometry, Material | Material[]>;
      if (m.morphTargetDictionary) morphMeshes.push(m);
    }
  });
  const face = new ExpressionAnimator(src.expressionManager ?? null, morphMeshes);
  const animator = new PoseAnimator(bones);
  animator.snapTo(REST_POSE);
  return { animator, face, missing };
}
