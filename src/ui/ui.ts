import { SIGNS, TEST_PANEL } from '../signs/dictionary';
import { DraftKeeper } from './draft';
import { formatGlosses, MIC_CONSENT_TEXT, statusOnListening, type StatusLevel } from './messages';

function el<T extends HTMLElement>(id: string, ctor: new () => T): T {
  const node = document.getElementById(id);
  if (!(node instanceof ctor)) throw new Error(`Elemento #${id} ausente ou de tipo inesperado`);
  return node;
}

export interface UiHandlers {
  onSubmitText(text: string): void;
  onMicClick(): void;
  onTestSign(signId: string): void;
  onStop(): void;
  onRetry(): void;
}

const PRIVACY_DETAILS =
  'Este aplicativo não tem conta, não grava e não armazena áudio nem texto (nem em localStorage ou cookies); ' +
  'o texto só existe na memória da página e some ao recarregar. No modo local (padrão) o texto não sai do navegador; com "Usar IA" ligada, o texto que você manda traduzir é enviado à API local (127.0.0.1) e dela a um provedor externo de modelo de linguagem, e a transcrição da fala deixa de ser traduzida automaticamente (você clica em "Mostrar em sinais"). ' +
  'O microfone só liga quando você clica e a captura termina ' +
  'ao clicar de novo para parar ou ao fechar a página. Para revogar a permissão do microfone, use as configurações do ' +
  'site no seu navegador. O que o fornecedor do navegador faz com o áudio segue a política dele, fora do controle deste ' +
  'aplicativo. O contato do responsável pela publicação deve ser informado por quem publicar o aplicativo.';

/** Toda escrita de texto na pagina usa textContent (nunca innerHTML). */
export class Ui {
  private readonly mic = el('mic', HTMLButtonElement);
  private readonly micLabel = el('mic-label', HTMLSpanElement);
  private readonly micState = el('mic-state', HTMLSpanElement);
  private readonly form = el('text-form', HTMLFormElement);
  private readonly input = el('text-input', HTMLTextAreaElement);
  private readonly submit = el('text-submit', HTMLButtonElement);
  private readonly stopBtn = el('stop', HTMLButtonElement);
  private readonly stopFloat = el('stop-float', HTMLButtonElement);
  private readonly undoBtn = el('undo-draft', HTMLButtonElement);
  private readonly skip = el('skip', HTMLAnchorElement);
  private readonly draft = new DraftKeeper();
  private readonly transcript = el('transcript', HTMLElement);
  private readonly glosses = el('glosses', HTMLElement);
  private readonly status = el('status', HTMLElement);
  private readonly overlay = el('loading-overlay', HTMLElement);
  private readonly loadingText = el('loading-text', HTMLElement);
  private readonly retry = el('retry', HTMLButtonElement);
  private readonly sidebar = el('sidebar', HTMLElement);
  private readonly toggle = el('sidebar-toggle', HTMLButtonElement);
  private readonly testButtons = el('test-buttons', HTMLElement);
  private readonly useAi = el('use-ai', HTMLInputElement);
  private readonly allowGen = el('allow-gen', HTMLInputElement);
  private readonly modeState = el('mode-state', HTMLElement);
  private readonly generatedLabel = el('generated-label', HTMLElement);
  private readonly canvasBox = el('canvas-container', HTMLElement);
  private readonly consent = el('mic-consent', HTMLDialogElement);
  private micSupported = true;
  private ready = false;
  private readonly testButtonList: HTMLButtonElement[] = [];

  constructor(handlers: UiHandlers) {
    el('privacy', HTMLElement).textContent = MIC_CONSENT_TEXT;
    el('privacy-details', HTMLElement).textContent = PRIVACY_DETAILS;
    el('mc-text', HTMLElement).textContent = MIC_CONSENT_TEXT;

    this.mic.addEventListener('click', () => {
      handlers.onMicClick();
    });
    this.form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const text = this.input.value.trim();
      this.draft.discard();
      this.undoBtn.hidden = true;
      if (text === '') this.setStatus('Digite ou fale um texto.', 'warn');
      else handlers.onSubmitText(text);
    });
    this.input.addEventListener('input', () => {
      this.draft.discard();
      this.undoBtn.hidden = true;
    });
    this.undoBtn.addEventListener('click', () => {
      const prev = this.draft.undo();
      this.undoBtn.hidden = true;
      if (prev !== null) {
        this.input.value = prev;
        this.input.focus();
        this.setStatus('Texto digitado anterior restaurado. Clique em "Mostrar em sinais" para usá-lo.', 'ok');
      }
    });
    // Parar existe no painel e flutuando sobre o avatar (acessivel com o painel recolhido).
    for (const b of [this.stopBtn, this.stopFloat]) {
      b.addEventListener('click', () => {
        handlers.onStop();
      });
    }
    // O alvo do skip link fica oculto com o painel recolhido: reabre o painel e foca o campo.
    this.skip.addEventListener('click', (ev) => {
      ev.preventDefault();
      this.setSidebarHidden(false);
      this.input.focus();
    });
    this.retry.addEventListener('click', () => {
      handlers.onRetry();
    });
    this.toggle.addEventListener('click', () => {
      this.setSidebarHidden(!this.sidebar.hidden);
    });
    this.buildTestPanel((id) => {
      handlers.onTestSign(id);
    });
    // QA-001: ao ampliar a janela o painel nunca pode ficar oculto sem botao de retorno.
    // O painel NAO comeca recolhido no celular (PRIV-006): entrada e avisos ficam visiveis.
    const narrow = window.matchMedia('(max-width: 800px)');
    narrow.addEventListener('change', (ev) => {
      if (!ev.matches) this.setSidebarHidden(false);
    });
    // Chaves de IA: desligadas por padrao; a secundaria so existe com a primeira ligada.
    this.useAi.checked = false;
    this.allowGen.checked = false;
    this.useAi.addEventListener('change', () => {
      // Sinais gerados: LIGADOS por padrao quando a IA liga (o usuario pode desligar); so em memoria.
      this.allowGen.checked = this.useAi.checked;
      this.allowGen.disabled = !this.useAi.checked;
      this.setMode(this.useAi.checked ? 'Modo: IA' : 'Modo: local');
    });
    this.refreshControls();
  }

  get aiEnabled(): boolean {
    return this.useAi.checked;
  }

  get generatedAllowed(): boolean {
    return this.useAi.checked && this.allowGen.checked;
  }

  /** Estado visivel do modo (texto fixo; nunca texto vindo da API). */
  setMode(text: string): void {
    const strong = document.createElement('strong');
    strong.textContent = text;
    this.modeState.replaceChildren(strong);
  }

  /** Rotulo permanente durante a reproducao de sinais gerados por IA (null esconde). */
  setGeneratedLabel(text: string | null): void {
    this.generatedLabel.hidden = text === null;
    this.generatedLabel.textContent = text ?? '';
  }

  private setSidebarHidden(hide: boolean): void {
    this.sidebar.hidden = hide;
    this.toggle.setAttribute('aria-expanded', String(!hide));
    this.toggle.textContent = hide ? 'Mostrar painel' : 'Ocultar painel';
  }

  private buildTestPanel(onTest: (id: string) => void): void {
    for (const group of TEST_PANEL) {
      const h = document.createElement('h3');
      h.textContent = group.title;
      this.testButtons.appendChild(h);
      for (const id of group.ids) {
        const sign = SIGNS.get(id);
        if (!sign) continue;
        this.addTestButton(sign.label, id, onTest);
      }
    }
  }

  private addTestButton(label: string, id: string, onTest: (id: string) => void): void {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.disabled = true;
    b.addEventListener('click', () => {
      onTest(id);
    });
    this.testButtons.appendChild(b);
    this.testButtonList.push(b);
  }

  /** Traducao e microfone so ficam disponiveis com o avatar carregado (PRIV-004). */
  setReady(ready: boolean): void {
    this.ready = ready;
    this.refreshControls();
  }

  setMicSupported(supported: boolean): void {
    this.micSupported = supported;
    if (!supported) {
      this.micLabel.textContent = 'Microfone indisponível neste navegador';
      this.setStatus('Reconhecimento de fala indisponível. Use o campo de texto.', 'warn');
    }
    this.refreshControls();
  }

  private refreshControls(): void {
    this.mic.disabled = !(this.ready && this.micSupported);
    this.submit.disabled = !this.ready;
    this.stopBtn.disabled = !this.ready;
    this.stopFloat.disabled = !this.ready;
    for (const b of this.testButtonList) b.disabled = !this.ready;
  }

  setListening(listening: boolean): void {
    this.mic.setAttribute('aria-pressed', String(listening));
    this.micState.textContent = listening ? '● ouvindo' : '';
    const next = statusOnListening(this.status.textContent, listening);
    if (next !== null) this.setStatus(next, 'ok');
  }

  /** Confirmacao explicita antes da primeira captura. Resolve true somente em "Entendi". */
  askMicConsent(): Promise<boolean> {
    return new Promise((resolve) => {
      const d = this.consent;
      if (typeof d.showModal !== 'function') {
        this.setStatus('Seu navegador não suporta a confirmação do microfone. Use o campo de texto.', 'warn');
        resolve(false);
        return;
      }
      const accept = el('mc-accept', HTMLButtonElement);
      const textOnly = el('mc-text-only', HTMLButtonElement);
      const onAccept = (): void => {
        d.close('accept');
      };
      const onText = (): void => {
        d.close('text');
      };
      accept.addEventListener('click', onAccept);
      textOnly.addEventListener('click', onText);
      d.addEventListener(
        'close',
        () => {
          accept.removeEventListener('click', onAccept);
          textOnly.removeEventListener('click', onText);
          const ok = d.returnValue === 'accept';
          if (!ok) this.input.focus();
          resolve(ok);
        },
        { once: true },
      );
      d.returnValue = '';
      d.showModal();
    });
  }

  /** Coloca um texto reconhecido no campo editavel, para conferir antes de traduzir (PRIV-007). */
  setInputText(text: string): void {
    const incoming = text.slice(0, this.input.maxLength > 0 ? this.input.maxLength : 500);
    this.input.value = this.draft.replace(this.input.value, incoming);
    // PRIV-010: se um rascunho digitado foi substituido, oferece desfazer.
    this.undoBtn.hidden = !this.draft.canUndo;
  }

  setTranscript(text: string): void {
    this.transcript.textContent = text === '' ? '—' : text;
  }

  setGlosses(items: readonly string[]): void {
    this.glosses.textContent = formatGlosses(items);
    this.canvasBox.setAttribute(
      'aria-label',
      items.length === 0 ? 'Avatar 3D que mostra os sinais' : `Avatar 3D mostrando: ${formatGlosses(items)}`,
    );
  }

  setStatus(message: string, level: StatusLevel): void {
    this.status.textContent = message;
    this.status.classList.toggle('info', level === 'info');
    this.status.classList.toggle('warn', level === 'warn');
    this.status.classList.toggle('error', level === 'error');
  }

  setLoading(message: string): void {
    this.overlay.hidden = false;
    this.retry.hidden = true;
    this.loadingText.setAttribute('role', 'status');
    this.loadingText.classList.remove('error');
    this.loadingText.textContent = message;
    this.overlay.querySelector('.spinner')?.classList.remove('stopped');
  }

  hideLoading(): void {
    this.overlay.hidden = true;
  }

  showLoadError(message: string, opts: { retry: boolean } = { retry: true }): void {
    this.overlay.hidden = false;
    this.loadingText.setAttribute('role', 'alert');
    this.loadingText.classList.add('error');
    this.loadingText.textContent = `${message} Não use este aplicativo para comunicação enquanto o avatar não carregar.`;
    this.retry.hidden = !opts.retry;
    this.overlay.querySelector('.spinner')?.classList.add('stopped');
  }
}
