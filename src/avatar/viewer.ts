import {
  AmbientLight,
  Color,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  type Object3D,
} from 'three';
import { disposeObject } from './loadAvatar';

/** Cena three.js: renderer, camera half-body (cintura para cima), luzes, resize e dispose. */
export class Viewer {
  private readonly scene = new Scene();
  private readonly camera: PerspectiveCamera;
  private readonly renderer: WebGLRenderer;
  private readonly resizeObserver: ResizeObserver;
  private frameCallbacks: ((nowMs: number) => void)[] = [];
  private rafId = 0;
  private running = false;

  constructor(private readonly container: HTMLElement) {
    this.scene.background = new Color(0x0f0f17);
    this.camera = new PerspectiveCamera(38, 1, 0.1, 100);
    this.camera.position.set(0, 1.2, 2.3);
    this.camera.lookAt(0, 1.08, 0);

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.scene.add(new AmbientLight(0xffffff, 1.6));
    const key = new DirectionalLight(0xffffff, 1.6);
    key.position.set(1.5, 3, 2);
    this.scene.add(key);
    const fill = new DirectionalLight(0x89b4fa, 0.5);
    fill.position.set(-1.5, 2, -1);
    this.scene.add(fill);

    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });
    this.resizeObserver.observe(container);
    this.resize();
  }

  private readonly owned: { object: Object3D; dispose: (o: Object3D) => void }[] = [];

  /** O viewer passa a ser dono do objeto (e o libera no dispose). */
  add(object: Object3D, dispose: (o: Object3D) => void = disposeObject): void {
    this.scene.add(object);
    this.owned.push({ object, dispose });
  }

  onFrame(cb: (nowMs: number) => void): void {
    this.frameCallbacks.push(cb);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    const loop = (nowMs: number): void => {
      if (!this.running) return;
      this.rafId = requestAnimationFrame(loop);
      for (const cb of this.frameCallbacks) cb(nowMs);
      this.renderer.render(this.scene, this.camera);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  dispose(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.resizeObserver.disconnect();
    this.frameCallbacks = [];
    for (const { object: obj, dispose } of this.owned) {
      this.scene.remove(obj);
      dispose(obj);
    }
    this.owned.length = 0;
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }

  private resize(): void {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
