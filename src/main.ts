import './styles.css';
import type { VRM } from '@pixiv/three-vrm';
import { AvatarLoadError, disposeVrm, loadAvatar } from './avatar/loadAvatar';
import { buildVisemePlan, type ExpressionAnimator } from './avatar/expressionAnimator';
import type { PoseAnimator } from './avatar/poseAnimator';
import { NoSkeletonError, prepareAvatar } from './avatar/prepareAvatar';
import { Viewer } from './avatar/viewer';
import { SignQueue } from './queue/signQueue';
import { REST_SIGN, SIGNS } from './signs/dictionary';
import { ConsentGate } from './speech/consent';
import { isSpeechSupported, SpeechRecognizer } from './speech/recognizer';
import { translateByMode } from './translation/translateByMode';
import { describeTranslation, GENERATED_LABEL } from './ui/messages';
import { Ui } from './ui/ui';

const MODEL_URL = `${import.meta.env.BASE_URL}models/Seed-san.vrm`;

let animator: PoseAnimator | null = null;
let face: ExpressionAnimator | null = null;
let vrmModel: VRM | null = null;
let lastFrameMs: number | null = null;
let viewer: Viewer | null = null;

const queue = new SignQueue({
  onStart: (sign, now) => {
    animator?.start(sign, now);
    face?.setFace(sign.face);
    // Sinal GERADO POR IA: rotulo permanente em texto enquanto toca (nao e Libras validada).
    ui.setGeneratedLabel(sign.id.startsWith('GEN_') ? `${GENERATED_LABEL}: ${sign.label}` : null);
  },
  onIdle: (now) => {
    animator?.start(REST_SIGN, now);
    face?.reset();
    ui.setGeneratedLabel(null);
  },
});

let currentRequest: AbortController | null = null;
let requestSeq = 0;

/** Texto digitado/falado: nunca persistido nem registrado. Com IA ligada, vai a API local (ver README). */
async function say(text: string): Promise<void> {
  if (!animator) {
    ui.setStatus('Aguarde: o avatar ainda não está disponível. Nada foi traduzido.', 'warn');
    return;
  }
  currentRequest?.abort();
  const ctl = new AbortController();
  currentRequest = ctl;
  const seq = ++requestSeq;
  const useAi = ui.aiEnabled;
  if (useAi) ui.setStatus('Consultando a IA… (o texto foi enviado à API local)', 'info');
  const { translation: result, mode } = await translateByMode(text, { useAi, allowGenerated: ui.generatedAllowed }, ctl.signal);
  if (seq !== requestSeq || !animator) return; // pedido mais novo ja assumiu
  ui.setMode(mode === 'ia' ? 'Modo: IA' : mode === 'fallback' ? 'Modo local (API indisponível)' : 'Modo: local');
  ui.setGlosses(result.glosses);
  queue.replace(result.signs);
  // Boca: estimativa por vogais do texto, na duracao total dos sinais (nao e lip-sync preciso).
  const total = result.signs.reduce((acc, sg) => acc + sg.duration, 0);
  face?.setVisemePlan(result.signs.length > 0 ? buildVisemePlan(text, performance.now(), total) : null);
  const { level, message } = describeTranslation(result);
  const prefix = mode === 'fallback' ? 'API indisponível: usado o modo local. ' : '';
  ui.setStatus(`${prefix}${message}`, mode === 'fallback' && level === 'ok' ? 'info' : level);
}

const recognizer = new SpeechRecognizer({
  onTranscript: (text, isFinal) => {
    ui.setTranscript(text);
    if (isFinal && text.trim() !== '') {
      ui.setInputText(text);
      if (ui.aiEnabled) {
        // Com IA ligada NADA e enviado sem um clique explicito (PRIV-009 reaberto so neste modo).
        ui.setStatus('Texto reconhecido colocado no campo. Com a IA ligada, confira e clique em "Mostrar em sinais" para enviar (nada foi enviado ainda).', 'info');
      } else {
        void say(text);
      }
    }
  },
  onListening: (listening) => {
    ui.setListening(listening);
  },
  onError: (message) => {
    ui.setStatus(message, 'error');
  },
  onIncomplete: (text) => {
    ui.setInputText(text);
    ui.setStatus('O reconhecimento terminou sem resultado final. Confira o texto no campo e clique em "Mostrar em sinais".', 'warn');
  },
});

const consent = new ConsentGate(() => ui.askMicConsent());

const ui = new Ui({
  onSubmitText: (text) => {
    ui.setTranscript(text);
    void say(text);
  },
  onMicClick: () => {
    if (recognizer.listening) {
      recognizer.stop();
      return;
    }
    // Opt-in explicito: a primeira captura so ocorre depois da confirmacao do usuario.
    void consent.ensure().then((ok) => {
      if (ok) recognizer.start();
    });
  },
  onTestSign: (id) => {
    const sign = id === REST_SIGN.id ? REST_SIGN : SIGNS.get(id);
    if (!sign || !animator) return;
    ui.setGlosses([sign.id]);
    queue.replace([sign]);
    face?.setVisemePlan(null);
    ui.setStatus(`Mostrando sinal de demonstração: ${sign.label}.`, 'ok');
  },
  onStop: () => {
    queue.clear();
    currentRequest?.abort();
    requestSeq++;
    face?.reset();
    ui.setGeneratedLabel(null);
    animator?.start(REST_SIGN, performance.now());
    ui.setStatus('Parado. Avatar voltando à posição neutra.', 'ok');
  },
  onRetry: () => {
    startLoad();
  },
});

ui.setMicSupported(isSpeechSupported());

function startLoad(): void {
  const v = viewer;
  if (!v || vrmModel) return; // sem viewer, ou modelo ja na cena: nao carrega outro
  ui.setReady(false);
  ui.setLoading('Carregando modelo 3D…');
  loadAvatar(MODEL_URL, (fraction) => {
    ui.setLoading(
      fraction === null ? 'Carregando modelo 3D…' : `Carregando modelo 3D… ${String(Math.round(fraction * 100))}%`,
    );
  })
    .then((vrm) => {
      // Tudo que pode lancar acontece ANTES de o modelo entrar na cena (QA-025): em caso de erro
      // descartamos o modelo e o "Tentar novamente" parte do zero, sem modelo duplicado.
      let prepared;
      try {
        prepared = prepareAvatar(vrm);
      } catch (e) {
        disposeVrm(vrm);
        throw e;
      }
      v.add(vrm.scene, () => {
        disposeVrm(vrm);
      });
      vrmModel = vrm;
      face = prepared.face;
      animator = prepared.animator;
      if (!face.hasBrowTargets) {
        ui.setStatus('O modelo não tem os alvos de sobrancelha esperados; a expressão das sobrancelhas fica desligada.', 'warn');
      }
      ui.hideLoading();
      ui.setReady(true);
      if (prepared.missing.length > 0) {
        ui.setStatus('Alguns ossos do modelo não foram encontrados; parte dos gestos pode faltar.', 'warn');
      }
    })
    .catch((err: unknown) => {
      ui.showLoadError(
        err instanceof AvatarLoadError
          ? 'Não foi possível carregar o modelo 3D. Verifique se o arquivo do modelo é válido.'
          : err instanceof NoSkeletonError
            ? 'O modelo 3D foi carregado, mas o esqueleto esperado não foi encontrado.'
            : 'Erro inesperado ao preparar o avatar.',
      );
    });
}

const container = document.getElementById('canvas-container');
if (!container) throw new Error('#canvas-container ausente');

try {
  viewer = new Viewer(container);
} catch {
  // Sem WebGL nao ha o que tentar de novo: sem botao de retry (QA-018).
  ui.showLoadError('Não foi possível iniciar o WebGL (gráficos 3D) neste navegador.', { retry: false });
}

if (viewer) {
  viewer.onFrame((now) => {
    // Sem animador a fila nao e consumida (nao perde sinais).
    if (animator) {
      queue.tick(now);
      animator.update(now);
      face?.update(now);
    }
    // Obrigatorio no three-vrm: copia a pose normalizada para o esqueleto real, molas e materiais.
    const delta = lastFrameMs === null ? 0 : Math.min(0.1, (now - lastFrameMs) / 1000);
    lastFrameMs = now;
    vrmModel?.update(delta);
  });
  viewer.start();
  startLoad();
}

window.addEventListener('pagehide', (ev) => {
  // Microfone sempre encerrado ao sair; o viewer so e descartado se a pagina nao vai ao bfcache.
  recognizer.dispose();
  if (!ev.persisted) viewer?.dispose();
});
