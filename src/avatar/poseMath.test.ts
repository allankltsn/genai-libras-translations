import { Euler, Quaternion, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { REST_POSE, REST_SIGN, SIGNS } from '../signs/dictionary';
import { ALL_BONES } from '../signs/poseHelpers';
import type { CanonicalBone, SignDef } from '../signs/types';
import { PoseAnimator } from './poseAnimator';
import { applyOffset, buildTracks, cubicEaseInOut, sampleTrack } from './poseMath';

const bindQ = new Quaternion().setFromEuler(new Euler(0.3, -0.2, 0.1));
const near = (a: Quaternion, b: Quaternion): number => 1 - Math.abs(a.dot(b));

describe('poseMath', () => {
  it('easing nos extremos', () => {
    expect(cubicEaseInOut(0)).toBe(0);
    expect(cubicEaseInOut(1)).toBe(1);
    expect(cubicEaseInOut(0.5)).toBeCloseTo(0.5);
  });

  it('deslocamento zero == bind pose; deslocamento e relativo ao bind', () => {
    expect(near(applyOffset(bindQ, { x: 0, y: 0, z: 0 }), bindQ)).toBeLessThan(1e-9);
    const q = applyOffset(bindQ, { x: 0.5, y: 0, z: 0 });
    const expected = bindQ.clone().multiply(new Quaternion().setFromEuler(new Euler(0.5, 0, 0)));
    expect(near(q, expected)).toBeLessThan(1e-9);
  });

  it('trilha parte da pose atual e termina no alvo', () => {
    const sign: SignDef = { id: 'T', label: 'T', duration: 1000, keyframes: [{ time: 1, pose: { head: { x: 0.4, y: 0, z: 0 } } }] };
    const start = new Quaternion().setFromEuler(new Euler(-0.2, 0, 0));
    const binds = new Map<CanonicalBone, Quaternion>([['head', bindQ]]);
    const tracks = buildTracks(sign, {}, new Map([['head', start]]), binds);
    const track = tracks.get('head');
    expect(track).toBeDefined();
    if (!track) return;
    const out = new Quaternion();
    expect(near(sampleTrack(track, 0, out), start)).toBeLessThan(1e-9);
    expect(near(sampleTrack(track, 1, out), applyOffset(bindQ, { x: 0.4, y: 0, z: 0 }))).toBeLessThan(1e-9);
    const mid = sampleTrack(track, 0.5, new Quaternion());
    expect(near(mid, start)).toBeGreaterThan(1e-6);
  });

  it('osso nao citado volta ao repouso (determinismo entre sinais)', () => {
    const sign: SignDef = { id: 'T', label: 'T', duration: 1000, keyframes: [{ time: 0.5, pose: { head: { x: 0.1, y: 0, z: 0 } } }] };
    const fist = new Quaternion().setFromEuler(new Euler(0, 0, 1.5));
    const binds = new Map<CanonicalBone, Quaternion>([
      ['head', bindQ],
      ['rightIndexProximal', new Quaternion()],
    ]);
    const current = new Map<CanonicalBone, Quaternion>([
      ['head', bindQ],
      ['rightIndexProximal', fist],
    ]);
    const tracks = buildTracks(sign, { rightIndexProximal: { x: 0, y: 0, z: 0.25 } }, current, binds);
    const t = tracks.get('rightIndexProximal');
    expect(t?.times).toEqual([0, 0.5]);
    if (!t) return;
    const end = sampleTrack(t, 1, new Quaternion());
    expect(near(end, applyOffset(new Quaternion(), { x: 0, y: 0, z: 0.25 }))).toBeLessThan(1e-9);
  });
});

describe('PoseAnimator', () => {
  it('anima do repouso para o sinal e mantem a pose final', () => {
    const bones = new Map<CanonicalBone, { quaternion: Quaternion }>(ALL_BONES.map((b) => [b, { quaternion: new Quaternion() }]));
    const animator = new PoseAnimator(bones);
    animator.snapTo(REST_POSE);
    const head = bones.get('head');
    const before = head?.quaternion.clone() ?? new Quaternion();
    const sign = SIGNS.get('NEGACAO');
    expect(sign).toBeDefined();
    if (!sign || !head) return;
    animator.start(sign, 0);
    animator.update(sign.duration * 0.3);
    expect(near(head.quaternion, before)).toBeGreaterThan(1e-4);
    animator.update(sign.duration * 2);
    expect(near(head.quaternion, before)).toBeLessThan(1e-9); // NEGACAO termina em Head=0
  });
});

describe('dicionario', () => {
  it('keyframes validos: tempos crescentes em [0,1] e duracao positiva', () => {
    for (const sign of SIGNS.values()) {
      expect(sign.duration).toBeGreaterThanOrEqual(200);
      expect(sign.duration).toBeLessThanOrEqual(10000);
      let prev = -1;
      for (const kf of sign.keyframes) {
        expect(kf.time).toBeGreaterThan(prev);
        expect(kf.time).toBeLessThanOrEqual(1);
        prev = kf.time;
      }
    }
  });
});

describe('REV-004: bind rotacionado (convencao bind * offset, eixos LOCAIS do osso)', () => {
  const bind90Y = new Quaternion().setFromEuler(new Euler(0, Math.PI / 2, 0));

  it('deslocamento em Z local preserva a imagem do eixo Z local no mundo', () => {
    const q = applyOffset(bind90Y, { x: 0, y: 0, z: 0.7 });
    const zWorldBind = new Vector3(0, 0, 1).applyQuaternion(bind90Y);
    const zWorldNew = new Vector3(0, 0, 1).applyQuaternion(q);
    expect(zWorldNew.distanceTo(zWorldBind)).toBeLessThan(1e-9);
    // e os outros eixos locais giraram de fato
    const xWorldBind = new Vector3(1, 0, 0).applyQuaternion(bind90Y);
    const xWorldNew = new Vector3(1, 0, 0).applyQuaternion(q);
    expect(xWorldNew.distanceTo(xWorldBind)).toBeGreaterThan(0.1);
  });

  it('o resultado NAO e o quaternion absoluto do offset (seria ignorar o bind)', () => {
    const q = applyOffset(bind90Y, { x: 0.5, y: 0, z: 0 });
    const absolute = new Quaternion().setFromEuler(new Euler(0.5, 0, 0));
    expect(near(q, absolute)).toBeGreaterThan(1e-3);
  });

  it('animador com binds nao-identidade termina em bind * offset e volta ao bind', () => {
    const names: CanonicalBone[] = ['head', 'rightUpperArm'];
    const bones = new Map<CanonicalBone, { quaternion: Quaternion }>([
      ['head', { quaternion: bind90Y.clone() }],
      ['rightUpperArm', { quaternion: new Quaternion().setFromEuler(new Euler(0.4, 0.2, -0.9)) }],
    ]);
    const binds = new Map(names.map((n) => [n, (bones.get(n)?.quaternion ?? new Quaternion()).clone()]));
    const animator = new PoseAnimator(bones, {});
    const sign: SignDef = { id: 'T', label: 'T', duration: 1000, keyframes: [{ time: 1, pose: { head: { x: 0, y: 0.5, z: 0 } } }] };
    animator.start(sign, 0);
    animator.update(5000);
    const bindHead = binds.get('head') ?? new Quaternion();
    expect(near(bones.get('head')?.quaternion ?? new Quaternion(), applyOffset(bindHead, { x: 0, y: 0.5, z: 0 }))).toBeLessThan(1e-9);
    animator.start({ id: 'R', label: 'R', duration: 500, keyframes: [{ time: 1, pose: { head: { x: 0, y: 0, z: 0 } } }] }, 6000);
    animator.update(7000);
    expect(near(bones.get('head')?.quaternion ?? new Quaternion(), bindHead)).toBeLessThan(1e-9);
  });
});

describe('PoseAnimator (logica pura)', () => {
  const mk = () => {
    const bones = new Map<CanonicalBone, { quaternion: Quaternion }>(ALL_BONES.map((b) => [b, { quaternion: new Quaternion() }]));
    return { bones, animator: new PoseAnimator(bones) };
  };

  it('captura a bind pose na construcao (nao a pose posterior)', () => {
    const { bones, animator } = mk();
    animator.snapTo(REST_POSE);
    const arm = bones.get('rightUpperArm')?.quaternion.clone() ?? new Quaternion();
    expect(near(arm, new Quaternion())).toBeGreaterThan(1e-3); // repouso difere do bind
    animator.snapTo({ rightUpperArm: { x: 0, y: 0, z: 0 } });
    expect(near(bones.get('rightUpperArm')?.quaternion ?? arm, new Quaternion())).toBeLessThan(1e-9);
  });

  it('start interrompido parte da pose ATUAL, sem salto', () => {
    const { bones, animator } = mk();
    const head = bones.get('head');
    const a: SignDef = { id: 'A', label: 'A', duration: 1000, keyframes: [{ time: 1, pose: { head: { x: 1, y: 0, z: 0 } } }] };
    const b: SignDef = { id: 'B', label: 'B', duration: 1000, keyframes: [{ time: 1, pose: { head: { x: -1, y: 0, z: 0 } } }] };
    animator.start(a, 0);
    animator.update(500);
    const mid = head?.quaternion.clone() ?? new Quaternion();
    animator.start(b, 500);
    animator.update(500); // progresso 0 do novo sinal
    expect(near(head?.quaternion ?? mid, mid)).toBeLessThan(1e-9);
  });

  it('osso de repouso nao citado volta ao repouso (punho: QA-002)', () => {
    const { bones, animator } = mk();
    animator.snapTo(REST_POSE);
    const bani = SIGNS.get('BANHEIRO');
    const oi = SIGNS.get('OI');
    if (!bani || !oi) throw new Error('sinais ausentes');
    animator.start(bani, 0);
    animator.update(bani.duration * 2);
    const twisted = bones.get('rightHand')?.quaternion.clone() ?? new Quaternion();
    animator.start(REST_SIGN, 10000);
    animator.update(10000 + REST_SIGN.duration * 2);
    const rest = bones.get('rightHand')?.quaternion ?? new Quaternion();
    expect(near(rest, twisted)).toBeGreaterThan(1e-4);
    expect(near(rest, new Quaternion())).toBeLessThan(1e-9);
  });

  it('update sem sinal ativo e no-op', () => {
    const { bones, animator } = mk();
    const before = bones.get('head')?.quaternion.clone() ?? new Quaternion();
    animator.update(123);
    expect(near(bones.get('head')?.quaternion ?? before, before)).toBeLessThan(1e-12);
  });
});

describe('dicionario x repouso (QA-002 / REV-009)', () => {
  const known = new Set<string>(ALL_BONES);
  it('todo osso citado por algum sinal existe e esta no REST_POSE', () => {
    const cited = new Set<string>();
    for (const sign of SIGNS.values()) for (const kf of sign.keyframes) for (const b of Object.keys(kf.pose)) cited.add(b);
    for (const b of cited) {
      expect(known.has(b), `osso desconhecido: ${b}`).toBe(true);
      expect(Object.keys(REST_POSE), `fora do REST_POSE: ${b}`).toContain(b);
    }
  });
  it('sem keyframes vazias', () => {
    for (const sign of SIGNS.values()) for (const kf of sign.keyframes) expect(Object.keys(kf.pose).length).toBeGreaterThan(0);
  });
});
