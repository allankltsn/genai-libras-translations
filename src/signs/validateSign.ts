import { SIGNS } from './dictionary';
import { ALL_BONES } from './poseHelpers';
import type { CanonicalBone, Emotion, EulerOffset, Keyframe, Pose, SignDef, SignFace } from './types';

/**
 * Validacao no FRONT de um SignDef vindo de fora (item `generated` da API, Adendo 1 do contrato).
 * Nunca confiar so no servidor: whitelist de ossos, clamp de angulos, rejeicao de NaN/Infinity,
 * limites de keyframes e duracao. Poses geradas por IA NAO sao Libras validada.
 */

export const GENERATED_LIMITS = {
  minDurationMs: 400,
  maxDurationMs: 2500,
  minKeyframes: 2,
  maxKeyframes: 6,
  maxPerPhrase: 20,
} as const;

const BONES: ReadonlySet<string> = new Set<string>(ALL_BONES);

/** Faixa angular (rad, por eixo) conservadora por osso. */
function limitFor(bone: string): number {
  if (bone.endsWith('UpperArm')) return 2.6;
  if (bone.endsWith('LowerArm')) return 2.6;
  if (bone.endsWith('Hand')) return 1.6;
  if (bone.endsWith('Shoulder')) return 0.6;
  if (bone === 'head' || bone === 'neck') return 0.8;
  if (bone === 'spine' || bone === 'chest') return 0.6;
  return 1.8; // dedos
}

const clamp = (v: number, lim: number): number => Math.min(lim, Math.max(-lim, v));
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function validatePose(raw: unknown): Pose | null {
  if (!isObj(raw)) return null;
  const out: Partial<Record<CanonicalBone, EulerOffset>> = {};
  for (const [bone, v] of Object.entries(raw)) {
    if (!BONES.has(bone)) return null; // osso desconhecido rejeita o sinal
    if (!isObj(v)) return null;
    const { x, y, z } = v;
    if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') return null;
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
    const lim = limitFor(bone);
    out[bone as CanonicalBone] = { x: clamp(x, lim), y: clamp(y, lim), z: clamp(z, lim) };
  }
  return out;
}

const BROWS = new Set(['up', 'furrowed']);
const EMOTIONS = new Set<string>(['happy', 'sad', 'angry', 'relaxed', 'surprised']);

function validateFace(raw: unknown): SignFace | undefined {
  if (!isObj(raw)) return undefined;
  const face: { brows?: 'up' | 'furrowed'; emotion?: Emotion; emotionWeight?: number } = {};
  if (typeof raw.brows === 'string' && BROWS.has(raw.brows)) face.brows = raw.brows as 'up' | 'furrowed';
  if (typeof raw.emotion === 'string' && EMOTIONS.has(raw.emotion)) face.emotion = raw.emotion as Emotion; // 'neutral' e ignorado
  if (typeof raw.emotionWeight === 'number' && Number.isFinite(raw.emotionWeight)) {
    face.emotionWeight = Math.min(1, Math.max(0, raw.emotionWeight));
  }
  return face;
}

/** Palavra exibivel: 1..40 caracteres [a-z0-9 ] (ja normalizada). */
export function isSafeWord(w: unknown): w is string {
  return typeof w === 'string' && /^[a-z0-9 ]{1,40}$/.test(w);
}

/**
 * Valida o `sign` de um item generated. Retorna um SignDef novo (copia limpa) ou null.
 * O id precisa ser GEN_*, nunca colidir com SIGNS; o rotulo e montado aqui (nao vem do servidor).
 */
export function validateGeneratedSign(raw: unknown, word: string): SignDef | null {
  if (!isObj(raw) || !isSafeWord(word)) return null;
  const { id, duration, keyframes } = raw;
  if (typeof id !== 'string' || !/^GEN_[A-Z0-9_]{1,40}$/.test(id) || SIGNS.has(id)) return null;
  if (typeof duration !== 'number' || !Number.isFinite(duration)) return null;
  if (duration < GENERATED_LIMITS.minDurationMs || duration > GENERATED_LIMITS.maxDurationMs) return null;
  if (!Array.isArray(keyframes)) return null;
  if (keyframes.length < GENERATED_LIMITS.minKeyframes || keyframes.length > GENERATED_LIMITS.maxKeyframes) return null;
  const kfs: Keyframe[] = [];
  let prev = -1;
  for (const k of keyframes as unknown[]) {
    if (!isObj(k)) return null;
    const t = k.time;
    if (typeof t !== 'number' || !Number.isFinite(t) || t < 0 || t > 1 || t <= prev) return null;
    const pose = validatePose(k.pose);
    if (!pose) return null;
    kfs.push({ time: t, pose });
    prev = t;
  }
  const face = validateFace(raw.face);
  const sign: SignDef = {
    id,
    label: `${word} (gerado por IA)`,
    duration: Math.round(duration),
    keyframes: kfs,
    ...(face ? { face } : {}),
  };
  return sign;
}
