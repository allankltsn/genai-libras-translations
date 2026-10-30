import type { CanonicalBone, EulerOffset, FingerBoneName, Pose } from './types';

/**
 * CONVENCAO DE EIXOS (VRM 1.0, ossos humanoides NORMALIZADOS do three-vrm).
 * Nos ossos normalizados a pose de repouso (T-pose) e a identidade e todos os eixos locais
 * estao alinhados ao mundo: o personagem olha para +Z, Y para cima; o lado ESQUERDO do
 * personagem fica em +X (braco esquerdo aponta para +X) e o DIREITO em -X. Pose final do osso
 * = bind * offset (Euler XYZ, em quaternion); filhos herdam a rotacao do pai.
 *
 * Valores derivados da geometria (NAO VISTOS NO NAVEGADOR):
 *  - UpperArm: Z baixa o braco da T-pose (direito +Z, esquerdo -Z). Depois, X negativo
 *    levanta o braco para a FRENTE (+Z). Ordem XYZ = primeiro baixa (Z), depois balanca (X).
 *  - LowerArm: Y dobra o cotovelo para a frente (direito +Y, esquerdo -Y).
 *  - Hand: Z flexiona o punho para a palma (direito +Z, esquerdo -Z); X gira o antebraco
 *    (pronacao/supinacao).
 *  - Dedos: Z fecha o dedo em direcao a palma (direito +Z, esquerdo -Z). O POLEGAR tem eixo
 *    diferente (oposicao) e e o valor mais incerto.
 *  - Head/Neck/Spine: X positivo inclina para frente (acena "sim"), Y positivo gira para o lado
 *    ESQUERDO do personagem, Z positivo inclina o topo da cabeca para o lado DIREITO.
 * Se a inspecao visual mostrar eixos diferentes, ajuste SOMENTE este arquivo.
 */

type Side = 'left' | 'right';

const sgn = (side: Side): 1 | -1 => (side === 'right' ? 1 : -1);
const e = (x: number, y: number, z: number): EulerOffset => ({ x, y, z });

export interface ArmOpts {
  /** 0 = pendurado ao lado do corpo; 1.57 = horizontal (T-pose). */
  readonly abduct: number;
  /** Elevacao para a frente (rad). */
  readonly fwd?: number;
  /** Flexao do cotovelo (rad). */
  readonly elbow?: number;
  /** Flexao do punho (rad, sinal do lado aplicado). */
  readonly wrist?: number;
  /** Giro do antebraco/punho (rad). */
  readonly wristTwist?: number;
}

export function arm(side: Side, o: ArmOpts): Pose {
  const s = sgn(side);
  const pose: Partial<Record<CanonicalBone, EulerOffset>> = {
    [`${side}UpperArm`]: e(-(o.fwd ?? 0), 0, s * (Math.PI / 2 - o.abduct)),
    [`${side}LowerArm`]: e(0, s * (o.elbow ?? 0), 0),
  };
  if (o.wrist !== undefined || o.wristTwist !== undefined) {
    pose[`${side}Hand`] = e(-s * (o.wristTwist ?? 0), 0, s * (o.wrist ?? 0));
  }
  return pose;
}

export interface FingerCurl {
  readonly thumb?: number;
  readonly index?: number;
  readonly middle?: number;
  readonly ring?: number;
  /** Dedo mindinho (VRM: "Little"). */
  readonly pinky?: number;
}

/** Curl: 0 = estendido, ~1.5 = fechado. As 3 articulacoes de cada dedo recebem fatores fixos. */
export function fingers(side: Side, c: FingerCurl): Pose {
  const s = sgn(side);
  const pose: Partial<Record<CanonicalBone, EulerOffset>> = {};
  const set = (name: 'Index' | 'Middle' | 'Ring' | 'Little', curl: number | undefined): void => {
    if (curl === undefined) return;
    pose[`${side}${name}Proximal`] = e(0, 0, s * curl);
    pose[`${side}${name}Intermediate`] = e(0, 0, s * curl * 0.9);
    pose[`${side}${name}Distal`] = e(0, 0, s * curl * 0.6);
  };
  set('Index', c.index);
  set('Middle', c.middle);
  set('Ring', c.ring);
  set('Little', c.pinky);
  if (c.thumb !== undefined) {
    // Polegar: oposicao aproximada; eixo NAO validado.
    pose[`${side}ThumbMetacarpal`] = e(0, s * -c.thumb * 0.6, s * c.thumb * 0.4);
    pose[`${side}ThumbProximal`] = e(0, 0, s * c.thumb * 0.5);
    pose[`${side}ThumbDistal`] = e(0, 0, s * c.thumb * 0.4);
  }
  return pose;
}

export function head(o: { nod?: number; turn?: number; tilt?: number }): Pose {
  return { head: e(o.nod ?? 0, o.turn ?? 0, o.tilt ?? 0) };
}

export function torso(o: { lean?: number; turn?: number }): Pose {
  return {
    chest: e(o.lean ?? 0, o.turn ?? 0, 0),
    spine: e((o.lean ?? 0) * 0.5, (o.turn ?? 0) * 0.5, 0),
  };
}

export function merge(...poses: readonly Pose[]): Pose {
  return Object.assign({}, ...poses) as Pose;
}

export const FINGER_BONES: readonly FingerBoneName[] = (['left', 'right'] as const).flatMap((side) => [
  ...(['Metacarpal', 'Proximal', 'Distal'] as const).map((j): FingerBoneName => `${side}Thumb${j}`),
  ...(['Index', 'Middle', 'Ring', 'Little'] as const).flatMap((f) =>
    (['Proximal', 'Intermediate', 'Distal'] as const).map((j): FingerBoneName => `${side}${f}${j}`),
  ),
]);

export const ALL_BONES: readonly CanonicalBone[] = [
  'spine',
  'chest',
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
  ...FINGER_BONES,
];
