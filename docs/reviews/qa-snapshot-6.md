# QA adversarial - snapshot-6 (migracao VRM)

Revisor: qa (independente do autor). Modelo: standard. Data: 2026-10-30.

## Snapshot e execucao
- `sha256sum -c docs/reviews/snapshot-6.sha256`: todos os arquivos conferem (sem divergencia).
- `pnpm run typecheck`, `lint`: OK. `test`: 10 arquivos, 89 testes, OK. `build`: OK. `dist/` removido.
- Nada instalado. Probes em scratchpad da sessao (fora do projeto): vitest com config externa e script `python -I` somente leitura que extraiu o JSON do GLB de `public/models/Seed-san.vrm` (nao modificado; script fora do projeto).
- Arquivos de UI/speech/translation/queue (`ui.ts`, `messages.ts`, `draft.ts`, `recognizer.ts`, `translate.ts`, `glosser.ts`, `normalize.ts`, `signQueue.ts`) tem hash identico ao snapshot-4. Mudaram: `main.ts`, avatar/*, signs/*, `index.html`, `styles.css`, `vite.config.ts`.

## boneMap x Seed-san real (JSON do GLB)
- VRM 1.0 (`VRMC_vrm`, `VRMC_springBone`); humanBones reais: spine, chest, neck, head, shoulders, upper/lower arms, hands, 15 ossos de dedos por mao (ThumbMetacarpal/Proximal/Distal; Index/Middle/Ring/Little Proximal/Intermediate/Distal); sem upperChest.
- Probe: `ALL_BONES` (42 ossos canonicos) -> 0 ausentes no modelo. Todo osso citado por qualquer keyframe do dicionario existe no modelo e esta no REST_POSE (lista vazia de divergencias; QA-002 nao regrediu).
- Expressoes reais: aa, ih, ou, ee, oh, blink, happy, sad, angry, relaxed, surprised (todas as usadas pelo animador existem). Morph targets reais incluem `eye_brow_up` e `eye_brow_down` (nomes usados em `findBrowTargets`): existem.
- Credito/licenca no modelo: VPL 1.0, autor VirtualCast, Inc., consistente com o rodape.

## Tabela de regressao QA-001..024
| IDs | Status | Evidencia |
|---|---|---|
| QA-001, 009, 013-015, 017-024 (UI, mic, status, draft, skip, stop-float, mensagens) | SEM REGRESSAO | arquivos de UI com hash identico ao snapshot-4; 89 testes passam. |
| QA-002 (punho no repouso) | SEM REGRESSAO | REST_POSE cobre todo osso citado; probe vazio. |
| QA-004-008, 021, 023 (traducao/mensagens) | SEM REGRESSAO | traducao e mensagens inalteradas (hash). |
| QA-003 (Parar) | SEM REGRESSAO (ressalva) | `onStop` agora tambem chama `face.reset()` (`main.ts:99`): boca/emocao silenciadas; correto. |
| QA-010 (erro de carga/retry) | SEM REGRESSAO (ver QA-025) | `AvatarLoadError` e mensagens mantidas; `role=alert` e retry no overlay; arquivo que nao e VRM -> `AvatarLoadError`. |
| QA-011 (dispose/bfcache) | SEM REGRESSAO | `viewer.dispose` chama o dispose registrado por objeto (`disposeVrm` -> `VRMUtils.deepDispose`) e `forceContextLoss`. |
| QA-016 (CSP) | ATUALIZADO | `connect-src 'self' blob:` documentado e justificado em `vite.config.ts` (GLTFLoader le texturas embutidas via blob:/fetch); sem `data:` nem hosts de terceiros em connect/script; `img-src` ja permitia data:/blob:. Varredura final e do agente security. |

## Novos achados

### QA-025 [Baixa] Falha tardia na preparacao do avatar deixa modelo na cena e permite duplicacao no retry
- Local: `src/main.ts:120-156`.
- Reproducao (logica): excecao depois de `v.add(vrm.scene, ...)` e `vrmModel = vrm` (ex.: construtor de `ExpressionAnimator` ou `PoseAnimator` lancando) cai no `.catch` -> "Erro inesperado ao preparar o avatar" + "Tentar novamente". O VRM ja esta na cena e `vrmModel` aponta para ele, enquanto `animator` pode estar nulo; o retry carrega e adiciona um segundo modelo (o primeiro so e liberado no `pagehide`).
- Esperado: no caminho de erro, remover/descartar o que ja foi adicionado, ou montar tudo antes de `v.add`.
- Resolucao esperada: reordenar (criar `ExpressionAnimator`/`PoseAnimator` antes de `v.add`) ou limpar no catch. Baixa (nenhum construtor lanca com o Seed-san).

### QA-026 [Baixa] `ExpressionAnimator.update` fica permanentemente em NaN se receber tempo nao finito
- Local: `src/avatar/expressionAnimator.ts:173-179` (`lastMs`, `approach`), `faceTargets` linha 98.
- Reproducao (probe): `update(0); update(1000); update(NaN); update(2000)` -> `browUp`, `emotionWeight` e valores enviados a `setValue` permanecem NaN indefinidamente (`lastMs` vira NaN, `dt` NaN, `Math.max(0, NaN)` e NaN). Tambem `faceTargets({emotion:'happy', emotionWeight: NaN})` devolve peso NaN (o clamp `Math.min/Math.max` nao trata NaN).
- Esperado: entradas nao finitas ignoradas ou tratadas como dt=0.
- Atual: `requestAnimationFrame` nunca entrega NaN e os pesos do dicionario sao constantes, entao nao alcancavel hoje; fragil se o relogio ou dados mudarem. Resolucao esperada: `Number.isFinite` no inicio de `update`/`faceTargets` (+ teste).

### QA-027 [Baixa] Visemas no texto completo, incluindo palavras de ligacao e letras nao animadas
- Local: `src/main.ts:46-47`, `src/avatar/expressionAnimator.ts:19-27`.
- Observacao: o plano usa as vogais do texto digitado inteiro espalhadas pela soma das duracoes dos sinais (palavras omitidas e letras sem sinal contam vogais mas nao tem sinal); o arquivo declara ser estimativa e a UI nao promete lip-sync. Informativo; o comentario de honestidade esta presente. Sem acao obrigatoria.

### Verificado sem achado (logica pura)
- Vogais: texto vazio, so emoji/CJK -> sem visemas; `ÁÉÍÓÚ` -> aa ee ih oh ou; `Água` -> aa ou aa; entrada de 1000 `a` -> limitada a 200 (e `normalizeText` ja corta em 500).
- `visemeAt`: duracao negativa/zero, inicio NaN, agora NaN/negativo/Infinity, exatamente no fim -> null; proximo do fim -> peso proximo de 0; peso maximo 0,7 (dentro de [0,1]).
- `approach`: dt negativo -> sem movimento; dt Infinity -> alvo; dt=0 no primeiro frame -> sem salto.
- `faceTargets`: peso 5 -> 1; -1 -> 0 (clamp OK; NaN em QA-026).
- Tempo andando para tras (`update(500)` depois de `update(1000)`): dt clampado em 0, sem erro.
- Morph targets ausentes: malha sem dicionario ignorada; indice fora do `influences` ignorado; so `up` presente -> `hasBrowTargets=false` e aviso de UI, sem excecao. `expressions=null` -> so sobrancelhas sao atualizadas, sem erro.
- Troca de emocao (sad -> angry) sai e entra suavemente (sad=0, angry=0,55 em 400 ms); `reset()` leva emocao, visemas e sobrancelhas a 0; plano de visema silenciado imediatamente por `reset()`.
- Piscar: com rng fixo, pulsos de 160 ms periodicos; sem pesos fora de [0,1].
- `PoseAnimator`: `update` com tempo negativo, NaN e 1e12 nao corrompe quaternions (NaN -> p clampado/ignorado: Math.min/Math.max com NaN produziria NaN, mas o probe mostrou quaternion preservado porque `tracks` nao estava ativo apos a interrupcao; ver QA-026 para a mesma classe de fragilidade); interrupcao no meio do sinal parte da pose atual (transicao suave).
- Fila + expressao: `onStart` aplica `setFace(sign.face)`; sinal sem `face` volta ao neutro; `onIdle` e `onStop` fazem `face.reset()`; `onTestSign` zera plano de visema.
- Dicionario: 16 sinais + REPOUSO = 17; `TEST_PANEL` e LEXICON inalterados (consistencia com a UI mantida, QA-005); 7 sinais com `face` (DUVIDA, AFIRMACAO, NEGACAO, OI, TUDO_BEM, OBRIGADO, DESCULPA), pesos 0,3 a 0,5.

## Acessibilidade estatica
- Rodape de credito (`index.html:77-82`): contraste texto 10,59:1 e links 8,91:1 sobre `#11111b`; links externos com `target="_blank" rel="noopener noreferrer"` (seguro), nome de link descritivo ("VRM Public License 1.0", "Origem do modelo"); fonte 0,75rem. Nao verificado: quebra de linha e altura em telas estreitas (o rodape ocupa espaco do `body` flex em coluna; em <=800px o body rola).
- Canvas: `role="img"` com `aria-label` atualizado por `setGlosses` (inalterado). Rosto/expressao nao e descrito em texto (nao ha mudanca de rotulo para emocao/sobrancelhas); aceitavel para prototipo.
- Favicon `data:,` evita requisicao; CSP `img-src` cobre data:.
- Tratamento de erro do VRM: arquivo ausente/ilegivel -> `AvatarLoadError` -> mensagem pt-BR sem stack, `role=alert`, aviso de nao usar para comunicacao, botao "Tentar novamente"; nao-VRM -> mesma mensagem; esqueleto vazio -> mensagem propria com descarte (`disposeVrm`). Sem retry quando WebGL falha (QA-018 mantido). Ressalva: as mensagens nao distinguem causas (arquivo ausente x invalido).

## O que continua SEM verificacao (sem navegador)
- Carga real do VRM com a CSP do build (`connect-src blob:` foi medido pelo autor, nao por mim); renderizacao/WebGL, MToon, molas, enquadramento da camera (`position 0,1.2,2.3`), escala e orientacao (rotateVRM0 nao se aplica a VRM 1.0); eixos e aparencia de todas as poses, dedos de 3 articulacoes e polegar; sobrancelhas e emocoes reais (valores de `overrideBlink/overrideMouth` das expressoes do modelo, possivel interacao emocao x piscar/boca); visemas visiveis; sobreposicao do `#stop-float` e do rodape; layout do rodape em mobile; dialog, ordem de tab, leitor de tela, Web Speech API, bfcache.
- `main.ts` e `ui.ts` sem testes com DOM; validados por leitura.

## Veredito por escopo
| Escopo | Veredito |
|---|---|
| Gates e integridade do snapshot | APROVADO |
| boneMap x lista real de ossos do Seed-san | APROVADO |
| expressionAnimator / poseAnimator (logica pura) | APROVADO COM RESSALVAS (QA-026) |
| main.ts (carga, fila+expressao, dispose) | APROVADO COM RESSALVAS (QA-025) |
| Dicionario (17) x UI; traducao, fila, speech, UI | APROVADO (sem regressao QA-001..024) |
| Acessibilidade estatica (rodape, canvas, erro de carga) | APROVADO COM RESSALVAS (nada verificado com tecnologia assistiva) |
| Resultado visual do avatar VRM | NAO VERIFICADO (sem navegador) |

Veredito geral: APROVADO COM RESSALVAS. Sem finding Alta/Media. Abertos: QA-025, QA-026 (Baixas), QA-027 (informativo). A ausencia de verificacao em navegador real (carga do VRM, poses, rosto) nao e aprovacao; e obrigatoria antes do aceite humano.
