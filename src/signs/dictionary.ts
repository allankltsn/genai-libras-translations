/**
 * Dicionario de sinais (PROTOTIPO).
 *
 * AVISO: os movimentos abaixo sao aproximacoes feitas SEM validacao de interprete de Libras
 * ou de pessoa surda. Nao representam necessariamente a configuracao de mao, ponto de
 * articulacao, movimento ou expressao facial corretos. Todos precisam de revisao e
 * correcao por interprete/surdo fluente antes de qualquer uso real.
 *
 * As poses sao deslocamentos Euler relativos a bind pose (ossos VRM normalizados); a expressao
 * facial (face) tambem e aproximacao nao validada. Ver poseHelpers.ts para as
 * suposicoes de eixo (nao validadas visualmente).
 */
import { HANDSHAPES } from './handshapes';
import { arm, fingers, head, merge, torso } from './poseHelpers';
import type { Pose, SignDef } from './types';

/** Pose de repouso (bracos relaxados a frente do corpo, dedos levemente curvados). */
export const REST_POSE: Pose = merge(
  arm('right', { abduct: 0.25, fwd: 0.15, elbow: 0.35 }),
  arm('left', { abduct: 0.25, fwd: 0.15, elbow: 0.35 }),
  fingers('right', { thumb: 0.2, index: 0.25, middle: 0.3, ring: 0.35, pinky: 0.4 }),
  fingers('left', { thumb: 0.2, index: 0.25, middle: 0.3, ring: 0.35, pinky: 0.4 }),
  // Punhos: sem isto o ultimo valor de um sinal persistiria (QA-002).
  { leftHand: { x: 0, y: 0, z: 0 }, rightHand: { x: 0, y: 0, z: 0 } },
  head({}),
  torso({}),
);

export const REST_SIGN: SignDef = {
  id: 'REPOUSO',
  label: 'Posição neutra',
  duration: 900,
  keyframes: [{ time: 1, pose: REST_POSE }],
};

const FIST = { thumb: 0.9, index: 1.5, middle: 1.5, ring: 1.5, pinky: 1.5 };
const OPEN = { thumb: 0, index: 0, middle: 0, ring: 0, pinky: 0 };
const POINT_UP = { thumb: -0.8, index: 1.4, middle: 1.4, ring: 1.4, pinky: 1.4 };

const defs: readonly SignDef[] = [
  {
    id: 'LETRA_L',
    label: 'Letra "L"',
    duration: 1500,
    keyframes: [
      {
        time: 0.5,
        pose: merge(
          arm('right', { abduct: 0.5, fwd: 0.9, elbow: 1.3, wrist: -0.1 }),
          fingers('right', HANDSHAPES.L ?? {}),
        ),
      },
    ],
  },
  {
    id: 'LETRA_Y',
    label: 'Letra "Y"',
    duration: 1500,
    keyframes: [
      {
        time: 0.5,
        pose: merge(
          arm('right', { abduct: 0.5, fwd: 0.9, elbow: 1.3 }),
          fingers('right', HANDSHAPES.Y ?? {}),
        ),
      },
    ],
  },
  {
    id: 'LETRA_A',
    label: 'Letra "A"',
    duration: 1400,
    keyframes: [
      {
        time: 0.5,
        pose: merge(arm('right', { abduct: 0.5, fwd: 0.9, elbow: 1.3 }), fingers('right', HANDSHAPES.A ?? {})),
      },
    ],
  },
  {
    id: 'DUVIDA',
    label: 'Dúvida / pergunta',
    duration: 1800,
    face: { brows: 'up' },
    keyframes: [
      { time: 0.4, pose: merge(head({ nod: 0.15, turn: 0.2, tilt: -0.15 }), torso({ lean: -0.05, turn: 0.1 })) },
      { time: 1, pose: head({ nod: 0.1, turn: 0.2, tilt: -0.15 }) },
    ],
  },
  {
    id: 'AFIRMACAO',
    label: 'Afirmação (sim)',
    duration: 1500,
    face: { emotion: 'happy', emotionWeight: 0.3 },
    keyframes: [
      { time: 0.25, pose: head({ nod: 0.3 }) },
      { time: 0.55, pose: head({ nod: -0.1 }) },
      { time: 0.8, pose: head({ nod: 0.25 }) },
      { time: 1, pose: head({}) },
    ],
  },
  {
    id: 'NEGACAO',
    label: 'Negação (não)',
    duration: 1500,
    face: { brows: 'furrowed' },
    keyframes: [
      { time: 0.3, pose: head({ turn: 0.4 }) },
      { time: 0.65, pose: head({ turn: -0.4 }) },
      { time: 1, pose: head({}) },
    ],
  },
  {
    id: 'ESPACO_NEUTRO',
    label: 'Espaço neutro frontal',
    duration: 2200,
    keyframes: [
      {
        time: 0.45,
        pose: merge(
          arm('right', { abduct: 0.7, fwd: 0.8, elbow: 0.9 }),
          arm('left', { abduct: 0.7, fwd: 0.8, elbow: 0.9 }),
          torso({ lean: 0.05 }),
        ),
      },
      {
        time: 1,
        pose: merge(arm('right', { abduct: 0.5, fwd: 0.6, elbow: 0.9 }), arm('left', { abduct: 0.5, fwd: 0.6, elbow: 0.9 })),
      },
    ],
  },
  {
    id: 'TROCA_PAPEL',
    label: 'Troca de papel',
    duration: 2000,
    keyframes: [
      { time: 0.5, pose: merge(torso({ turn: -0.3 }), head({ turn: 0.15 })) },
      { time: 1, pose: merge(torso({ turn: 0.3 }), head({ turn: -0.15 })) },
    ],
  },
  {
    id: 'OI',
    label: 'Oi / olá',
    duration: 1900,
    face: { emotion: 'happy', emotionWeight: 0.5 },
    keyframes: [
      {
        time: 0.3,
        pose: merge(arm('right', { abduct: 1.1, fwd: 0.3, elbow: 1.2, wrist: 0 }), fingers('right', OPEN), head({ turn: -0.1 })),
      },
      { time: 0.55, pose: arm('right', { abduct: 1.1, fwd: 0.3, elbow: 1.2, wrist: 0.4 }) },
      { time: 0.8, pose: arm('right', { abduct: 1.1, fwd: 0.3, elbow: 1.2, wrist: -0.4 }) },
      { time: 1, pose: arm('right', { abduct: 1.1, fwd: 0.3, elbow: 1.2, wrist: 0.2 }) },
    ],
  },
  {
    id: 'TUDO_BEM',
    label: 'Tudo bem?',
    duration: 2100,
    face: { brows: 'up', emotion: 'happy', emotionWeight: 0.3 },
    keyframes: [
      {
        time: 0.4,
        pose: merge(
          arm('right', { abduct: 0.5, fwd: 0.8, elbow: 1.1 }),
          fingers('right', POINT_UP),
          head({ nod: 0.05, turn: -0.1 }),
        ),
      },
      { time: 0.75, pose: arm('right', { abduct: 0.5, fwd: 1.0, elbow: 1.0 }) },
      { time: 1, pose: head({ tilt: 0.1 }) },
    ],
  },
  {
    id: 'POR_FAVOR',
    label: 'Por favor',
    duration: 1900,
    keyframes: [
      {
        time: 0.5,
        pose: merge(arm('right', { abduct: 0.4, fwd: 0.9, elbow: 1.4, wrist: -0.2 }), fingers('right', OPEN)),
      },
      { time: 1, pose: arm('right', { abduct: 0.4, fwd: 0.7, elbow: 1.4, wrist: -0.2 }) },
    ],
  },
  {
    id: 'OBRIGADO',
    label: 'Obrigado(a)',
    duration: 2100,
    face: { emotion: 'happy', emotionWeight: 0.4 },
    keyframes: [
      {
        time: 0.4,
        pose: merge(arm('right', { abduct: 0.3, fwd: 1.2, elbow: 1.9, wrist: -0.1 }), fingers('right', OPEN), head({ nod: -0.05 })),
      },
      { time: 0.8, pose: merge(arm('right', { abduct: 0.3, fwd: 0.6, elbow: 0.9 }), head({ nod: 0.15 })) },
      { time: 1, pose: head({ nod: 0.15 }) },
    ],
  },
  {
    id: 'DESCULPA',
    label: 'Desculpa',
    duration: 2100,
    face: { emotion: 'sad', emotionWeight: 0.4 },
    keyframes: [
      {
        time: 0.45,
        pose: merge(arm('right', { abduct: 0.3, fwd: 1.2, elbow: 1.7 }), fingers('right', POINT_UP), head({ nod: 0.15, tilt: 0.1 })),
      },
      { time: 1, pose: head({ nod: 0.15, tilt: 0.1 }) },
    ],
  },
  {
    id: 'BANHEIRO',
    label: 'Banheiro',
    duration: 2100,
    keyframes: [
      {
        time: 0.45,
        pose: merge(arm('right', { abduct: 0.7, fwd: 0.5, elbow: 1.5, wrist: 0.2, wristTwist: 0.3 }), fingers('right', FIST)),
      },
      { time: 0.7, pose: arm('right', { abduct: 0.7, fwd: 0.5, elbow: 1.5, wrist: 0.2, wristTwist: -0.3 }) },
      { time: 1, pose: arm('right', { abduct: 0.7, fwd: 0.5, elbow: 1.5, wrist: 0.2, wristTwist: 0.3 }) },
    ],
  },
  {
    id: 'AGUA',
    label: 'Água',
    duration: 1900,
    keyframes: [
      {
        time: 0.5,
        pose: merge(
          arm('right', { abduct: 0.4, fwd: 1.3, elbow: 1.9 }),
          fingers('right', { thumb: 0.5, index: 0, middle: 0.3, ring: 1.4, pinky: 1.4 }),
        ),
      },
      { time: 1, pose: arm('right', { abduct: 0.4, fwd: 1.3, elbow: 2.0, wrist: 0.2 }) },
    ],
  },
  {
    id: 'COMER',
    label: 'Comer',
    duration: 1900,
    keyframes: [
      {
        time: 0.45,
        pose: merge(
          arm('right', { abduct: 0.4, fwd: 1.3, elbow: 1.9 }),
          fingers('right', { thumb: 0.8, index: 0.9, middle: 0.9, ring: 0.9, pinky: 0.9 }),
        ),
      },
      { time: 0.7, pose: arm('right', { abduct: 0.4, fwd: 1.1, elbow: 1.6 }) },
      { time: 1, pose: arm('right', { abduct: 0.4, fwd: 1.3, elbow: 1.9 }) },
    ],
  },
];

export const SIGNS: ReadonlyMap<string, SignDef> = new Map(defs.map((d) => [d.id, d]));

/**
 * Lexico: palavra/frase normalizada (minusculas, sem acento) -> id do sinal.
 * Frases com espaco sao casadas antes da remocao de palavras funcionais.
 */
export const LEXICON: ReadonlyMap<string, string> = new Map([
  ['oi', 'OI'],
  ['ola', 'OI'],
  ['tudo bem', 'TUDO_BEM'],
  ['por favor', 'POR_FAVOR'],
  ['obrigado', 'OBRIGADO'],
  ['desculpa', 'DESCULPA'],
  ['banheiro', 'BANHEIRO'],
  ['agua', 'AGUA'],
  ['comer', 'COMER'],
  ['sim', 'AFIRMACAO'],
  ['nao', 'NEGACAO'],
  ['duvida', 'DUVIDA'],
  ['pergunta', 'DUVIDA'],
]);

/** Sinais do painel de teste (secundario), agrupados como na versao anterior. */
export const TEST_PANEL: readonly { readonly title: string; readonly ids: readonly string[] }[] = [
  { title: 'Configurações de mão (dedos)', ids: ['LETRA_L', 'LETRA_Y', 'LETRA_A'] },
  { title: 'Expressões e cabeça', ids: ['DUVIDA', 'AFIRMACAO', 'NEGACAO'] },
  { title: 'Espaço neutro e tronco', ids: ['ESPACO_NEUTRO', 'TROCA_PAPEL'] },
  { title: 'Vocabulário', ids: ['OI', 'TUDO_BEM', 'POR_FAVOR', 'OBRIGADO', 'DESCULPA', 'BANHEIRO', 'AGUA', 'COMER'] },
];
