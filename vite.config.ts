import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';

// CSP restritiva definida por meta tag (index.html usa o marcador __CSP__).
// Producao: sem inline, sem eval. O reconhecimento de fala e feito pelo proprio navegador
// (fora do controle do CSP da pagina).
//
// connect-src 'self' blob: (NUNCA data:, NUNCA http/https de terceiros): o GLTFLoader do three
// decodifica as texturas embutidas no VRM criando blob: URLs e o ImageBitmapLoader (Chrome/Edge)
// as le com fetch(), que e regido por connect-src. Medido em 2026-10-30 com o build sob
// `vite preview` no Chrome headless: com apenas 'self' aparecia "Connecting to 'blob:...'
// violates ... connect-src 'self'" e o modelo nao carregava. blob: e same-document (so dados
// criados pela propria pagina); nao abre saida para a rede. data: continua proibido porque a
// urlPolicy bloqueia URI externa devolvendo 'data:,' (nao pode estar permitido).
const STRICT_CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' blob:",
  "media-src 'self'",
  "worker-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

// Somente no servidor de desenvolvimento: o HMR do Vite injeta <style> e usa WebSocket local.
const DEV_CSP = STRICT_CSP.replace("style-src 'self'", "style-src 'self' 'unsafe-inline'").replace(
  "connect-src 'self' blob:",
  "connect-src 'self' blob: ws://localhost:* ws://127.0.0.1:*",
);

function cspPlugin(): Plugin {
  let isBuild = false;
  return {
    name: 'genai-libras-csp',
    configResolved(config) {
      isBuild = config.command === 'build';
    },
    transformIndexHtml(html) {
      return html.replace('__CSP__', isBuild ? STRICT_CSP : DEV_CSP);
    },
  };
}

// API local de traducao (api/, so 127.0.0.1). O navegador fala SEMPRE com a mesma origem ('/v1');
// o proxy encaminha para a API. Por isso a CSP continua connect-src 'self' blob: (sem relaxar).
const API_PROXY = { '/v1': { target: 'http://127.0.0.1:8000', changeOrigin: false } };

export default defineConfig({
  server: { proxy: API_PROXY },
  preview: { proxy: API_PROXY },
  plugins: [cspPlugin()],
  build: {
    target: 'es2022',
    modulePreload: { polyfill: false },
    // three.js + GLTFLoader + three-vrm num unico bundle (~780 kB, ~196 kB gzip): limite elevado de forma consciente;
    // dividir em chunks nao reduz o total baixado neste app de pagina unica.
    chunkSizeWarningLimit: 900,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
