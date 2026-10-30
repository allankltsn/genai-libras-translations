/** URL inofensiva devolvida para pedidos bloqueados (nao gera trafego de rede). */
export const BLOCKED_URL = 'data:,';

/**
 * Politica de URLs do loader: so mesma origem, data: e blob:. Qualquer outra vira
 * BLOCKED_URL (a carga falha de forma explicita no loader). A barreira real contra
 * trafego externo e a CSP (connect-src/img-src 'self'); isto e defesa em profundidade.
 */
export function filterUrl(url: string, baseHref: string, origin: string): string {
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  try {
    return new URL(url, baseHref).origin === origin ? url : BLOCKED_URL;
  } catch {
    return BLOCKED_URL;
  }
}
