/** Deslocamento Euler (radianos, ordem XYZ) RELATIVO a pose de repouso (bind pose) do osso. */
export interface EulerOffset {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

type Side = 'left' | 'right';
type Finger = 'Index' | 'Middle' | 'Ring' | 'Little';

export type FingerBoneName =
  | `${Side}Thumb${'Metacarpal' | 'Proximal' | 'Distal'}`
  | `${Side}${Finger}${'Proximal' | 'Intermediate' | 'Distal'}`;

/**
 * Nomes canonicos = nomes de ossos humanoides do VRM 1.0 (subconjunto usado pelo app).
 * O Seed-san nao tem upperChest; por isso ele nao esta aqui.
 */
export type CanonicalBone =
  | 'spine'
  | 'chest'
  | 'neck'
  | 'head'
  | `${Side}Shoulder`
  | `${Side}UpperArm`
  | `${Side}LowerArm`
  | `${Side}Hand`
  | FingerBoneName;

export type Pose = Partial<Record<CanonicalBone, EulerOffset>>;

export type Brows = 'up' | 'furrowed';
export type Emotion = 'happy' | 'sad' | 'angry' | 'relaxed' | 'surprised';

/**
 * Expressao facial GRAMATICAL do sinal (em Libras, sobrancelhas e emocao fazem parte da
 * gramatica). APROXIMACAO NAO VALIDADA por interprete de Libras / pessoa surda.
 */
export interface SignFace {
  readonly brows?: Brows;
  readonly emotion?: Emotion;
  /** 0..1 (padrao 0.5). */
  readonly emotionWeight?: number;
}

export interface Keyframe {
  /** Fracao da duracao do sinal, em [0, 1]. */
  readonly time: number;
  readonly pose: Pose;
}

export interface SignDef {
  readonly id: string;
  /** Rotulo em pt-BR exibido na UI. */
  readonly label: string;
  /** Duracao total em milissegundos. */
  readonly duration: number;
  readonly keyframes: readonly Keyframe[];
  /** Expressao facial durante o sinal (opcional). */
  readonly face?: SignFace;
}
