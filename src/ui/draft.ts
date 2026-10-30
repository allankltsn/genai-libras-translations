/**
 * Guarda o rascunho DIGITADO quando um texto reconhecido por voz o substitui, para que o
 * usuario possa desfazer (PRIV-010). So em memoria; nunca persistido.
 *
 * Falas encadeadas nao substituem o rascunho guardado: so texto realmente digitado
 * pelo usuario e preservado (REV-011 / QA-022).
 */
export class DraftKeeper {
  private previous: string | null = null;
  /** True enquanto o conteudo do campo veio de fala (nao foi digitado/editado pelo usuario). */
  private fieldFromSpeech = false;

  get canUndo(): boolean {
    return this.previous !== null;
  }

  /** Retorna o novo valor do campo; guarda o rascunho digitado se ele sera sobrescrito. */
  replace(current: string, incoming: string): string {
    if (!this.fieldFromSpeech) {
      this.previous = current.trim() !== '' && current !== incoming ? current : null;
    }
    // Se o campo ja veio de fala, `previous` (rascunho digitado, se houver) permanece.
    this.fieldFromSpeech = true;
    return incoming;
  }

  /** Retorna o rascunho digitado (e esquece), ou null se nao houver. */
  undo(): string | null {
    const p = this.previous;
    this.previous = null;
    this.fieldFromSpeech = false;
    return p;
  }

  /** Chamar quando o usuario edita ou envia o campo: o desfazer deixa de valer. */
  discard(): void {
    this.previous = null;
    this.fieldFromSpeech = false;
  }
}
