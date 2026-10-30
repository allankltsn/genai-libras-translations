import { normalizeText } from '../translation/normalize';
import type { Brows, Emotion, SignFace } from '../signs/types';

/**
 * Expressoes do avatar (VRM): visemas simples, piscar, emocoes e sobrancelhas.
 *
 * HONESTIDADE: os visemas sao uma ESTIMATIVA por vogais do texto, espalhadas uniformemente
 * pela duracao da frase. NAO e lip-sync preciso. Em Libras a expressao facial e gramatical
 * (sobrancelhas, emocao); os valores usados nos sinais sao APROXIMACOES NAO VALIDADAS por
 * interprete de Libras / pessoa surda.
 */

export type Viseme = 'aa' | 'ih' | 'ou' | 'ee' | 'oh';

const VOWEL_VISEME: Readonly<Record<string, Viseme>> = { a: 'aa', e: 'ee', i: 'ih', o: 'oh', u: 'ou' };
const MAX_VISEMES = 200;

/** Sequencia de visemas pelas vogais do texto (sem acentos; consoantes sao ignoradas). */
export function visemesFromText(text: string): Viseme[] {
  const out: Viseme[] = [];
  for (const ch of normalizeText(text)) {
    const v = VOWEL_VISEME[ch];
    if (v) out.push(v);
    if (out.length >= MAX_VISEMES) break;
  }
  return out;
}

export interface VisemePlan {
  readonly visemes: readonly Viseme[];
  readonly startMs: number;
  readonly endMs: number;
}

export function buildVisemePlan(text: string, startMs: number, durationMs: number): VisemePlan {
  return { visemes: visemesFromText(text), startMs, endMs: startMs + Math.max(0, durationMs) };
}

/** Viseme ativo e peso (0..1, pulso senoidal dentro da fatia) em `nowMs`, ou null. */
export function visemeAt(plan: VisemePlan | null, nowMs: number): { name: Viseme; weight: number } | null {
  if (!plan || plan.visemes.length === 0) return null;
  if (nowMs < plan.startMs || nowMs >= plan.endMs) return null;
  const span = plan.endMs - plan.startMs;
  const pos = ((nowMs - plan.startMs) / span) * plan.visemes.length;
  const idx = Math.min(plan.visemes.length - 1, Math.floor(pos));
  const name = plan.visemes[idx];
  if (!name) return null;
  const frac = pos - idx;
  return { name, weight: 0.7 * Math.sin(Math.PI * frac) };
}

/** Piscar periodico (intervalo 2.5 a 5.5 s, duracao 160 ms); `rng` injetavel para teste. */
export class BlinkState {
  private nextAt: number;
  constructor(
    private readonly rng: () => number = Math.random,
    startMs = 0,
  ) {
    this.nextAt = startMs + this.interval();
  }
  private interval(): number {
    return 2500 + this.rng() * 3000;
  }
  weight(nowMs: number): number {
    const BLINK_MS = 160;
    if (nowMs < this.nextAt) return 0;
    const t = (nowMs - this.nextAt) / BLINK_MS;
    if (t >= 1) {
      this.nextAt = nowMs + this.interval();
      return 0;
    }
    return 1 - Math.abs(2 * t - 1);
  }
}

/** Aproxima `current` de `target` com taxa exponencial (por segundo). */
export function approach(current: number, target: number, dtSec: number, rate = 10): number {
  const k = 1 - Math.exp(-rate * Math.max(0, dtSec));
  return current + (target - current) * k;
}

export interface FaceTargets {
  browUp: number;
  browDown: number;
  emotion: Emotion | null;
  emotionWeight: number;
}

export const NEUTRAL_FACE: FaceTargets = { browUp: 0, browDown: 0, emotion: null, emotionWeight: 0 };

/** Limita a [0,1]; valores nao finitos (NaN, Infinity) viram `fallback` (QA-026). */
function clamp01(v: number, fallback: number): number {
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : fallback;
}

export function faceTargets(face: SignFace | undefined): FaceTargets {
  if (!face) return NEUTRAL_FACE;
  const brows: Brows | undefined = face.brows;
  return {
    browUp: brows === 'up' ? 1 : 0,
    browDown: brows === 'furrowed' ? 1 : 0,
    emotion: face.emotion ?? null,
    emotionWeight: face.emotion ? clamp01(face.emotionWeight ?? 0.5, 0.5) : 0,
  };
}

/** Sumidouro minimo (testavel sem WebGL). */
export interface ExpressionManagerLike {
  setValue(name: string, weight: number): void;
}
export interface MorphMeshLike {
  readonly morphTargetDictionary?: Readonly<Record<string, number>> | undefined;
  readonly morphTargetInfluences?: number[] | undefined;
}

const BROW_UP = 'eye_brow_up';
const BROW_DOWN = 'eye_brow_down';
const EMOTIONS: readonly Emotion[] = ['happy', 'sad', 'angry', 'relaxed', 'surprised'];
const VISEMES: readonly Viseme[] = ['aa', 'ih', 'ou', 'ee', 'oh'];

/** Indices de morph targets de sobrancelha existentes (validados; ausentes degradam sem erro). */
export function findBrowTargets(meshes: readonly MorphMeshLike[]): { up: Slot[]; down: Slot[] } {
  const up: Slot[] = [];
  const down: Slot[] = [];
  for (const m of meshes) {
    const dict = m.morphTargetDictionary;
    const infl = m.morphTargetInfluences;
    if (!dict || !infl) continue;
    const u = dict[BROW_UP];
    const d = dict[BROW_DOWN];
    if (u !== undefined && u < infl.length) up.push({ influences: infl, index: u });
    if (d !== undefined && d < infl.length) down.push({ influences: infl, index: d });
  }
  return { up, down };
}
interface Slot {
  influences: number[];
  index: number;
}

/** Anima rosto: visemas, piscar, emocao e sobrancelhas. Sem rede, sem estado persistido. */
export class ExpressionAnimator {
  private plan: VisemePlan | null = null;
  private target: FaceTargets = NEUTRAL_FACE;
  private browUp = 0;
  private browDown = 0;
  private emoWeight = 0;
  private emotion: Emotion | null = null;
  private lastMs: number | null = null;
  private readonly brows: { up: Slot[]; down: Slot[] };

  constructor(
    private readonly expressions: ExpressionManagerLike | null,
    morphMeshes: readonly MorphMeshLike[],
    private readonly blink: BlinkState = new BlinkState(),
  ) {
    this.brows = findBrowTargets(morphMeshes);
  }

  get hasBrowTargets(): boolean {
    return this.brows.up.length > 0 && this.brows.down.length > 0;
  }

  setVisemePlan(plan: VisemePlan | null): void {
    this.plan = plan;
  }

  setFace(face: SignFace | undefined): void {
    this.target = faceTargets(face);
  }

  /** Volta ao rosto neutro e silencia a boca. */
  reset(): void {
    this.plan = null;
    this.target = NEUTRAL_FACE;
  }

  update(nowMs: number): void {
    // Relogio nao finito (NaN/Infinity): ignora o quadro em vez de contaminar o estado (QA-026).
    if (!Number.isFinite(nowMs)) return;
    const dt = this.lastMs === null ? 0 : Math.max(0, (nowMs - this.lastMs) / 1000);
    this.lastMs = nowMs;
    this.browUp = approach(this.browUp, this.target.browUp, dt);
    this.browDown = approach(this.browDown, this.target.browDown, dt);
    for (const s of this.brows.up) s.influences[s.index] = this.browUp;
    for (const s of this.brows.down) s.influences[s.index] = this.browDown;

    const ex = this.expressions;
    if (!ex) return;
    // Emocao: troca suave (a anterior sai, a nova entra).
    if (this.target.emotion !== this.emotion) {
      this.emoWeight = approach(this.emoWeight, 0, dt);
      if (this.emoWeight < 0.02) {
        this.emotion = this.target.emotion;
        this.emoWeight = 0;
      }
    } else {
      this.emoWeight = approach(this.emoWeight, this.target.emotionWeight, dt);
    }
    for (const e of EMOTIONS) ex.setValue(e, e === this.emotion ? this.emoWeight : 0);

    const v = visemeAt(this.plan, nowMs);
    for (const name of VISEMES) ex.setValue(name, v && v.name === name ? v.weight : 0);
    ex.setValue('blink', this.blink.weight(nowMs));
  }
}
