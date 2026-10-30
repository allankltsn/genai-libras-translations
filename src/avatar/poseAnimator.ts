import { Quaternion } from 'three';
import type { CanonicalBone, Pose, SignDef } from '../signs/types';
import { REST_POSE } from '../signs/dictionary';
import { applyOffset, buildTracks, sampleTrack, type Track } from './poseMath';

/** Contrato minimo de um osso (Object3D satisfaz). */
export interface BoneLike {
  readonly quaternion: Quaternion;
}

/**
 * Aplica sinais aos ossos. Cada `start` parte da pose ATUAL (transicao suave);
 * iniciar outro sinal substitui o atual (nunca ha dois ao mesmo tempo).
 */
export class PoseAnimator {
  private readonly binds = new Map<CanonicalBone, Quaternion>();
  private tracks: Map<CanonicalBone, Track> | null = null;
  private startedAt = 0;
  private duration = 1;
  private readonly tmp = new Quaternion();

  /** Captura a bind pose a partir da pose atual dos ossos (chamar logo apos carregar). */
  constructor(
    private readonly bones: ReadonlyMap<CanonicalBone, BoneLike>,
    private readonly rest: Pose = REST_POSE,
  ) {
    for (const [name, bone] of bones) this.binds.set(name, bone.quaternion.clone());
  }

  /** Vai direto para uma pose (sem transicao). */
  snapTo(pose: Pose): void {
    for (const [name, offset] of Object.entries(pose) as [CanonicalBone, { x: number; y: number; z: number }][]) {
      const bone = this.bones.get(name);
      const bind = this.binds.get(name);
      if (bone && bind) bone.quaternion.copy(applyOffset(bind, offset));
    }
    this.tracks = null;
  }

  start(sign: SignDef, nowMs: number): void {
    const current = new Map<CanonicalBone, Quaternion>();
    for (const [name, bone] of this.bones) current.set(name, bone.quaternion.clone());
    this.tracks = buildTracks(sign, this.rest, current, this.binds);
    this.startedAt = nowMs;
    this.duration = Math.max(1, sign.duration);
  }

  update(nowMs: number): void {
    if (!this.tracks) return;
    const p = Math.min(1, Math.max(0, (nowMs - this.startedAt) / this.duration));
    for (const [name, track] of this.tracks) {
      const bone = this.bones.get(name);
      if (bone) bone.quaternion.copy(sampleTrack(track, p, this.tmp));
    }
    if (p >= 1) this.tracks = null;
  }
}
