import { LoadingManager, Mesh, SkinnedMesh, Texture, type BufferGeometry, type Material, type Object3D } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { filterUrl } from './urlPolicy';

export type LoadProgress = (fraction: number | null) => void;

export class AvatarLoadError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'AvatarLoadError';
  }
}

/**
 * Cria o GLTFLoader com o VRMLoaderPlugin e UM LoadingManager cujo setURLModifier aplica
 * filterUrl: qualquer URI fora da origem (alem de data:/blob:) vira uma URL inofensiva.
 * Sem setCrossOrigin/setPath externos. A CSP (connect-src/img-src) e a barreira real.
 */
export function createVrmLoader(baseHref: string, origin: string): GLTFLoader {
  const manager = new LoadingManager();
  manager.setURLModifier((u) => filterUrl(u, baseHref, origin));
  const loader = new GLTFLoader(manager);
  loader.register((parser) => new VRMLoaderPlugin(parser));
  return loader;
}

/** Carrega o VRM local. Sem fallback para URLs externas. */
export async function loadAvatar(url: string, onProgress?: LoadProgress): Promise<VRM> {
  const loader = createVrmLoader(window.location.href, window.location.origin);
  let vrm: unknown;
  try {
    const gltf = await loader.loadAsync(url, (ev) => {
      onProgress?.(ev.lengthComputable && ev.total > 0 ? ev.loaded / ev.total : null);
    });
    vrm = (gltf.userData as { vrm?: unknown }).vrm;
  } catch (cause) {
    throw new AvatarLoadError('Falha ao carregar o modelo 3D.', { cause });
  }
  if (!(vrm instanceof VRM)) throw new AvatarLoadError('O arquivo carregado nao e um modelo VRM valido.');
  // Somente VRM 0.x tem a frente em -Z; o Seed-san e 1.0 e nao precisa.
  if (vrm.meta.metaVersion === '0') VRMUtils.rotateVRM0(vrm);
  return vrm;
}

/** Libera geometrias, materiais, texturas e esqueletos (usado para objetos nao-VRM). */
export function disposeObject(root: Object3D): void {
  root.traverse((node) => {
    if (!(node instanceof Mesh)) return;
    const mesh = node as Mesh<BufferGeometry, Material | Material[]>;
    mesh.geometry.dispose();
    if (node instanceof SkinnedMesh) node.skeleton.dispose();
    const mats: Material[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      for (const value of Object.values(m as unknown as Record<string, unknown>)) {
        if (value instanceof Texture) value.dispose();
      }
      m.dispose();
    }
  });
}

/** Libera um VRM inteiro (geometrias, materiais MToon, texturas, esqueletos). */
export function disposeVrm(vrm: VRM): void {
  VRMUtils.deepDispose(vrm.scene);
}
