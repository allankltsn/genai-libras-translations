# QA - revalidacao do delta snapshot-6 -> snapshot-7

Revisor: qa (independente do autor). Modelo: standard. Data: 2026-10-30.

## Snapshot e execucao
- `sha256sum -c docs/reviews/snapshot-7.sha256`: todos conferem (sem divergencia).
- `pnpm run typecheck`, `lint`: OK. `test`: 11 arquivos, 94 testes, OK. `build` (tsc + vite build + `node scripts/build-notice.mjs`): OK, aviso impresso, exit 0. `dist/` removido.
- Nada instalado.

## Status
| ID | Status | Evidencia |
|---|---|---|
| QA-025 falha tardia deixa modelo na cena / retry duplica | FECHADO | `prepareAvatar.ts` monta ossos, `ExpressionAnimator` e `PoseAnimator` (+ `snapTo(REST_POSE)`) antes de `v.add`. `main.ts:120-128`: em excecao, `disposeVrm(vrm)` e relanca; `vrmModel/face/animator` so sao atribuidos depois de `v.add`. `startLoad` retorna se `vrmModel` ja existe (`main.ts:111`). Testes `prepareAvatar.test.ts` cobrem osso ausente, esqueleto vazio (`NoSkeletonError`) e excecao de cena. Retry: ocorre apenas apos erro, quando nada ficou na cena e as variaveis seguem nulas, entao a nova tentativa parte do zero. |
| QA-026 NaN permanente | FECHADO | `expressionAnimator.ts`: `update` retorna cedo se `!Number.isFinite(nowMs)` sem tocar `lastMs`; `clamp01` com fallback 0,5 em `faceTargets`. Testes `expressionAnimator.test.ts:61-80` (NaN, +/-Infinity, recuperacao). Convergencia: dt vem sempre de tempos finitos, entao `approach` converge a sobrancelha e a emocao normalmente (sem travar: troca de emocao cruza o limiar 0,02 pelo decaimento exponencial). |
| QA-027 (info) | SEM MUDANCA | visemas por texto inteiro, ja documentado como estimativa. |

## Regressoes verificadas
- Mensagens de UI: `AvatarLoadError` -> mensagem de arquivo invalido; `NoSkeletonError` -> "esqueleto esperado nao encontrado" (mesmo texto do snapshot-6); demais -> "Erro inesperado". Todas passam por `showLoadError` (role alert, retry). Sem regressao em QA-010/018.
- `face.reset`/`onStop`/`onIdle`/`onTestSign`: inalterados. UI, speech, translation, queue: arquivos nao constam entre os alterados (QA-001..024 sem regressao; testes passam).
- Build: `scripts/build-notice.mjs` so usa `node:fs`, resolve caminho por `import.meta.url` (independe do cwd; executado de outro diretorio, exit 0), tolera `dist/models` ausente (executado sem `dist/`: exit 0, sem saida), nunca chama `process.exit` nem lanca em condicao normal; portanto nao quebra CI nem Windows (sem `sh`/barra no script npm alem de `&&`). O aviso depende de `node` no PATH, que o proprio pnpm/vite ja exige. ESLint ignora `scripts` (intencional; o script nao e tipado/lintado).
- Credito e banner: `#credits` esta no fluxo do `body` (fora de `#viewport`), portanto nao se sobrepoe a `#stop-float` (posicionado dentro de `#viewport`). Texto `#bac2de` e destaque `#cdd6f4` sobre `#11111b` (>= 10:1), links `#89b4fa` (8,9:1), `rel="noopener noreferrer"`. Em <=800px o corpo rola, fonte sobe para 0,9rem e borda de destaque; o banner foi estendido (texto maior, mais linhas) e permanece `role="note"`. Banner agora cita expressao facial/boca como aproximacoes: coerente com o que o produto faz.

## Novos achados

### QA-028 [Baixa] Banner mais longo consome altura util em telas pequenas
- Local: `index.html` (`#banner`, 3 frases) + `#credits` em `styles.css` (<=800px).
- Observacao: em celular, banner (varias linhas) + painel (max 60dvh) + viewport 50dvh + rodape ficam maiores que a tela; o corpo rola (`overflow:auto`), entao nada fica inacessivel, mas o avatar pode exigir rolagem. Nao medi em navegador. Resolucao opcional: reduzir texto do banner no mobile ou fixa-lo compacto; nao bloqueante.

### QA-029 [Baixa] `startLoad` silencioso se `vrmModel` existir
- Local: `src/main.ts:111`.
- Se alguma futura excecao ocorrer apos `vrmModel = vrm` (hoje apenas `ui.*`, que nao lancam), o overlay mostraria erro com botao "Tentar novamente" que nao faz nada. Nao alcancavel hoje. Resolucao opcional: tratar o caso mostrando o erro sem retry ou escondendo o overlay.

Sem outros achados.

## Sem verificacao (sem navegador)
- Carga real do VRM e da CSP do build; renderizacao, enquadramento, poses, dedos, polegar; expressoes/sobrancelhas/visemas reais e interacao emocao x piscar/boca; layout do banner/rodape/`#stop-float` em tela estreita; dialog, leitor de tela, Web Speech API, bfcache. `main.ts`/`ui.ts` sem testes com DOM (validados por leitura). Execucao do aviso de build em CI real (apenas Windows local verificado).

## Veredito do delta
| Escopo | Veredito |
|---|---|
| Gates e integridade | APROVADO |
| prepareAvatar / main.ts (ordem, dispose, retry) | APROVADO |
| expressionAnimator (NaN, convergencia) | APROVADO |
| Script de build/aviso | APROVADO (CI real nao verificado) |
| Credito/banner (estatico) | APROVADO COM RESSALVAS (QA-028; layout nao verificado) |

Veredito geral do delta: APROVADO COM RESSALVAS. QA-025 e QA-026 FECHADOS; abertos apenas QA-027 (info), QA-028 e QA-029 (Baixas, nao bloqueantes). Ausencia de verificacao em navegador nao e aprovacao e segue obrigatoria antes do aceite humano.
