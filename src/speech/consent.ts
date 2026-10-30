/**
 * Porta de consentimento do microfone: a primeira captura exige confirmacao explicita.
 * A decisao vale so ate recarregar a pagina (nada e persistido, nem em web storage).
 * Chamadas concorrentes compartilham a mesma pergunta (idempotente a cliques repetidos).
 */
export class ConsentGate {
  private accepted = false;
  private pending: Promise<boolean> | null = null;

  constructor(private readonly ask: () => Promise<boolean>) {}

  get isAccepted(): boolean {
    return this.accepted;
  }

  async ensure(): Promise<boolean> {
    if (this.accepted) return true;
    this.pending ??= this.ask()
      .then((ok) => {
        this.accepted = ok;
        return ok;
      })
      .catch(() => false)
      .finally(() => {
        this.pending = null;
      });
    return this.pending;
  }
}
