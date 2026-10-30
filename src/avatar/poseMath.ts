import { Euler, Quaternion } from 'three';
import type { CanonicalBone, EulerOffset, Pose, SignDef } from '../signs/types';

/** Logica pura de interpolacao (sem WebGL). */

export function cubicEaseInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Quaternion absoluto local = bind * deslocamento (deslocamento no referencial local do osso). */
export function applyOffset(bind: Quaternion, offset: EulerOffset): Quaternion {
  const off = new Quaternion().setFromEuler(new Euler(offset.x, offset.y, offset.z, 'XYZ'));
  return bind.clone().multiply(off);
}

export interface Track {
  /** Fracoes de tempo crescentes em [0, 1]; o primeiro ponto e a pose de partida (t = 0). */
  readonly times: number[];
  readonly quats: Quaternion[];
}

/**
 * Constroi uma trilha por osso a partir da pose ATUAL (transicao suave), das keyframes do
 * sinal e da pose de repouso. Regras:
 *  - osso citado em alguma keyframe: segue os pontos citados e mantem o ultimo valor;
 *  - osso nao citado mas presente no repouso: vai ao repouso ate a primeira keyframe
 *    (determinismo: um sinal nao herda dedos fechados do sinal anterior).
 */
export function buildTracks(
  sign: SignDef,
  rest: Pose,
  current: ReadonlyMap<CanonicalBone, Quaternion>,
  binds: ReadonlyMap<CanonicalBone, Quaternion>,
): Map<CanonicalBone, Track> {
  const tracks = new Map<CanonicalBone, Track>();
  const firstTime = sign.keyframes[0]?.time ?? 1;

  const ensure = (bone: CanonicalBone): Track | undefined => {
    const existing = tracks.get(bone);
    if (existing) return existing;
    const start = current.get(bone);
    if (!start) return undefined;
    const t: Track = { times: [0], quats: [start.clone()] };
    tracks.set(bone, t);
    return t;
  };

  for (const kf of sign.keyframes) {
    for (const [bone, offset] of Object.entries(kf.pose) as [CanonicalBone, EulerOffset][]) {
      const bind = binds.get(bone);
      const track = ensure(bone);
      if (!bind || !track) continue;
      track.times.push(kf.time);
      track.quats.push(applyOffset(bind, offset));
    }
  }
  for (const [bone, offset] of Object.entries(rest) as [CanonicalBone, EulerOffset][]) {
    if (tracks.has(bone)) continue;
    const bind = binds.get(bone);
    const track = ensure(bone);
    if (!bind || !track) continue;
    track.times.push(firstTime);
    track.quats.push(applyOffset(bind, offset));
  }
  return tracks;
}

/** Amostra a trilha em progresso p in [0,1], escrevendo em `out`. */
export function sampleTrack(track: Track, p: number, out: Quaternion): Quaternion {
  const { times, quats } = track;
  const last = times.length - 1;
  const first = quats[0];
  const lastQ = quats[last];
  if (!first || !lastQ) return out;
  if (p <= 0) return out.copy(first);
  if (p >= (times[last] ?? 1)) return out.copy(lastQ);
  for (let i = 0; i < last; i++) {
    const t0 = times[i] ?? 0;
    const t1 = times[i + 1] ?? 1;
    if (p >= t0 && p < t1) {
      const q0 = quats[i];
      const q1 = quats[i + 1];
      if (!q0 || !q1) return out;
      const seg = t1 - t0 > 0 ? (p - t0) / (t1 - t0) : 1;
      return out.slerpQuaternions(q0, q1, cubicEaseInOut(seg));
    }
  }
  return out.copy(lastQ);
}
