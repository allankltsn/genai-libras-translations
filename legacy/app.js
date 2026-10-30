// python -m http.server
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LIBRAS_DICTIONARY } from './dictionary.js';

let scene, camera, renderer;
let avatarModel = null;
let bones = {};
let currentAnimation = null;
let animationStartTime = 0;
let initialPoseQuats = {};

function cubicEaseInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function init() {
    const container = document.getElementById('canvas-container');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0f17);

    // Enquadramento ideal: CINTURA PARA CIMA (Half-Body / Tronco ao Rosto)
    camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.35, 1.5);
    camera.lookAt(0, 1.25, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
    dirLight.position.set(1.5, 3, 2);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x89b4fa, 0.4);
    fillLight.position.set(-1.5, 2, -1);
    scene.add(fillLight);

    loadGLTFModelWithFallback();

    window.addEventListener('resize', onWindowResize);
    animate(performance.now());
}

function loadGLTFModelWithFallback() {
    const loader = new GLTFLoader();
    
    // Lista de URLs CDN públicas permissivas (com suporte a CORS habilitado)
    const modelUrls = [
        'https://cdn.jsdelivr.net/gh/hmthanh/3d-human-model@main/Thanh.glb',
        'https://raw.githubusercontent.com/hmthanh/3d-human-model/main/Thanh.glb',
        './avatar.glb'
    ];

    let currentUrlIdx = 0;

    function tryNextUrl() {
        if (currentUrlIdx >= modelUrls.length) {
            console.error("Todas as fontes de modelo 3D falharam.");
            const loadingText = document.getElementById('loading-text');
            if (loadingText) loadingText.innerText = "Erro ao carregar modelo. Tente novamente.";
            return;
        }

        const url = modelUrls[currentUrlIdx];
        console.log("Tentando carregar modelo GLTF de:", url);

        loader.load(
            url,
            (gltf) => {
                avatarModel = gltf.scene;
                avatarModel.position.set(0, 0, 0);
                scene.add(avatarModel);

                avatarModel.traverse((node) => {
                    if (node.isBone) {
                        bones[node.name] = node;
                    }
                });

                console.log("Modelo GLTF Carregado com sucesso de:", url);
                console.log("Total de ossos:", Object.keys(bones).length);

                const overlay = document.getElementById('loading-overlay');
                if (overlay) overlay.style.display = 'none';

                captureCurrentPoseQuat(initialPoseQuats);
            },
            (xhr) => {
                const percent = Math.round((xhr.loaded / xhr.total) * 100);
                const loadingText = document.getElementById('loading-text');
                if (loadingText && percent > 0) {
                    loadingText.innerText = `Carregando modelo 3D GLTF... ${percent}%`;
                }
            },
            (error) => {
                console.warn(`Falha na fonte (${url}):`, error);
                currentUrlIdx++;
                tryNextUrl();
            }
        );
    }

    tryNextUrl();
}

function captureCurrentPoseQuat(targetObj) {
    for (let boneName in bones) {
        targetObj[boneName] = bones[boneName].quaternion.clone();
    }
}

function eulerToQuat(eulerObj) {
    const euler = new THREE.Euler(eulerObj.x || 0, eulerObj.y || 0, eulerObj.z || 0, 'XYZ');
    return new THREE.Quaternion().setFromEuler(euler);
}

window.playSign = function(signKey) {
    const signData = LIBRAS_DICTIONARY[signKey];
    if (!signData || !avatarModel) return;

    captureCurrentPoseQuat(initialPoseQuats);
    currentAnimation = signData;
    animationStartTime = performance.now();
};

function animate(currentTime) {
    requestAnimationFrame(animate);

    if (currentAnimation && Object.keys(bones).length > 0) {
        const elapsed = currentTime - animationStartTime;
        const rawProgress = Math.min(elapsed / currentAnimation.duration, 1.0);

        const keyframes = currentAnimation.keyframes;
        let prevKeyframe = { time: 0, pose: {} };
        let nextKeyframe = keyframes[0];

        for (let i = 0; i < keyframes.length; i++) {
            if (rawProgress >= keyframes[i].time) {
                prevKeyframe = keyframes[i];
                nextKeyframe = keyframes[i + 1] || keyframes[i];
            }
        }

        let segmentProgress = 0;
        const timeDiff = nextKeyframe.time - prevKeyframe.time;
        if (timeDiff > 0) {
            segmentProgress = (rawProgress - prevKeyframe.time) / timeDiff;
        }

        const smoothProgress = cubicEaseInOut(segmentProgress);

        for (let boneName in bones) {
            const startQuat = (prevKeyframe.pose && prevKeyframe.pose[boneName]) 
                ? eulerToQuat(prevKeyframe.pose[boneName]) 
                : (initialPoseQuats[boneName] || new THREE.Quaternion());

            const endQuat = (nextKeyframe.pose && nextKeyframe.pose[boneName]) 
                ? eulerToQuat(nextKeyframe.pose[boneName]) 
                : startQuat;

            bones[boneName].quaternion.slerpQuaternions(startQuat, endQuat, smoothProgress);
        }

        if (rawProgress >= 1.0) {
            currentAnimation = null;
        }
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    const container = document.getElementById('canvas-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

window.onload = init;
