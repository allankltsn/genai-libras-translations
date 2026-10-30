/**
 * Alfabeto manual A-Z (datilologia) para o avatar.
 *
 * AVISO: aproximacoes estaticas, NAO VALIDADAS por interprete de Libras / pessoa surda. Ver
 * handshapes.ts. Letras com movimento na Libras (H, J, X, Z) usam um movimento simples do
 * punho/dedo (aproximacao). "Ç" e normalizado para "C" antes da soletracao (nao ha sinal
 * proprio para Ç aqui). Digitos nao tem pose.
 *
 * Cada letra dura ~700 ms e termina com os dedos relaxados: isso cria o "respiro" que separa
 * letras repetidas (ex.: "aa") sem sinais extras.
 */
import { HANDSHAPES } from './handshapes';
import { arm, fingers, merge, type ArmOpts } from './poseHelpers';
import type { EulerOffset, Pose, SignDef } from './types';

export const LETTER_DURATION_MS = 700;

const BASE: ArmOpts = { abduct: 0.5, fwd: 0.9, elbow: 1.3 };
const RELAXED = { thumb: 0.2, index: 0.25, middle: 0.3, ring: 0.35, pinky: 0.4 };
const e = (x: number, y: number, z: number): EulerOffset => ({ x, y, z });

/** Punho/antebraco por letra (horizontal: G, H; para baixo: P, Q). Valores/eixos NAO validados. */
const WRIST: Readonly<Record<string, Partial<ArmOpts>>> = {
  G: { wristTwist: 1.2 },
  H: { wristTwist: 1.2 },
  Q: { wrist: 0.9, wristTwist: 1.2 },
  P: { wrist: 0.9 },
  L: { wrist: -0.1 },
};

/** Abertura entre dedos (rotacao em Y das proximais; eixo NAO validado). */
const SPREAD: Readonly<Record<string, Pose>> = {
  K: { rightIndexProximal: e(0, -0.2, 0), rightMiddleProximal: e(0, 0.2, 0) },
  P: { rightIndexProximal: e(0, -0.2, 0), rightMiddleProximal: e(0, 0.2, 0) },
  V: { rightIndexProximal: e(0, -0.3, 0), rightMiddleProximal: e(0, 0.3, 0) },
  W: { rightIndexProximal: e(0, -0.3, 0), rightRingProximal: e(0, 0.3, 0) },
};

/** Quadros extras de movimento (aproximacao) para H, J, X, Z: [tempo, pose]. */
const MOTION: Readonly<Record<string, readonly (readonly [number, Pose])[]>> = {
  H: [
    [0.5, arm('right', { ...BASE, wristTwist: 1.2, wrist: 0.25 })],
    [0.7, arm('right', { ...BASE, wristTwist: 1.2, wrist: -0.25 })],
  ],
  J: [
    [0.5, arm('right', { ...BASE, wristTwist: 0.6, wrist: 0.3 })],
    [0.7, arm('right', { ...BASE, wristTwist: 0.2, wrist: 0.7 })],
  ],
  X: [
    [
      0.5,
      fingers('right', { index: 0.5 }),
    ],
    [
      0.7,
      fingers('right', { index: 1.1 }),
    ],
  ],
  Z: [
    [0.45, arm('right', { ...BASE, wristTwist: 0.2, wrist: 0.35 })],
    [0.6, arm('right', { ...BASE, wristTwist: 0.2, wrist: -0.35 })],
    [0.75, arm('right', { ...BASE, wristTwist: 0.2, wrist: 0.35 })],
  ],
};

function build(ch: string): SignDef {
  const shape = HANDSHAPES[ch];
  if (!shape) throw new Error(`Sem configuracao de mao para ${ch}`);
  const first = merge(arm('right', { ...BASE, ...WRIST[ch] }), fingers('right', shape), SPREAD[ch] ?? {});
  const keyframes = [
    { time: 0.3, pose: first },
    ...(MOTION[ch] ?? []).map(([time, pose]) => ({ time, pose })),
    // Relaxa os dedos no fim: separa letras repetidas (respiro).
    { time: 1, pose: fingers('right', RELAXED) },
  ];
  return {
    id: `SOLETRA_${ch}`,
    label: `Letra ${ch} (datilologia)`,
    duration: LETTER_DURATION_MS,
    keyframes,
  };
}

/** Letra minuscula a-z -> sinal de soletracao. IDs SOLETRA_* nunca entram em SIGNS. */
export const LETTER_SIGNS: ReadonlyMap<string, SignDef> = new Map(
  Object.keys(HANDSHAPES).map((ch) => [ch.toLowerCase(), build(ch)] as const),
);
