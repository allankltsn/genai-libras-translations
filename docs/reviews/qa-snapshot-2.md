# QA - revalidacao do snapshot-2

Revisor: qa (independente do autor frontend-senior). Modelo: standard. Data: 2026-10-30.
Base: `docs/reviews/qa-snapshot-1.md` (QA-001..016). O autor nao fecha achados; status abaixo vem de evidencia propria.

## Snapshot e execucao
- `sha256sum -c docs/reviews/snapshot-2.sha256`: todos os arquivos conferem (sem divergencia).
- `npm run typecheck`, `npm run lint`: OK. `npm test`: 8 arquivos, 62 testes, OK. `npm run build`: OK (JS 633 kB).
- `dist/index.html` gerado: CSP estrita presente (`default-src 'none'; script-src 'self'; style-src 'self'; ... connect-src 'self'`), marcador `__CSP__` ausente. `dist/` removido.
- Nada instalado. Probes em scratchpad da sessao (fora do projeto): tabela de traducao adversarial e conferencia de ossos citados x REST_POSE. Calculos de contraste feitos por script.

## Tabela de status

| ID | Status | Evidencia |
|---|---|---|
| QA-001 painel inacessivel apos resize | FECHADO (leitura; nao verificado em navegador) | `ui.ts:77-80` ouve `change` do MediaQueryList e chama `setSidebarHidden(false)` ao sair de <=800px; painel nao nasce recolhido (`ui.ts:75-76`, sem `toggle.click()` inicial); `styles.css` mantem o toggle visivel em <=800px. Caso residual: nenhum teste automatizado cobre o fluxo (sem DOM nos testes). |
| QA-002 punho nunca volta ao repouso | FECHADO | `dictionary.ts:22` inclui `LeftHand`/`RightHand` no REST_POSE. Probe: ossos citados por qualquer sinal e ausentes do REST_POSE = lista vazia (antes: RightHand em 6 sinais). Efeito visual nao verificado. |
| QA-003 sem botao parar | FECHADO (ressalva QA-019) | `index.html:416` botao `#stop` fora do `<details>`; `main.ts:307-311` faz `queue.clear()` + REST. |
| QA-004 glosa/feedback enganosos | FECHADO | Probe: `casa` -> `soletrar (parcial): CASA`, n=2, `incomplete=true`, nivel warn "ATENCAO: a mensagem NAO foi transmitida por inteiro"; `xxxx` (600) -> glosa limitada a 20 chars + "…" e "Nenhum sinal... NAO foi transmitida"; `formatGlosses` limita a 40 itens (`ala ala ...` -> 647 chars de glosas pelo texto-fonte, exibicao truncada). |
| QA-005 consistencia dicionario x UI | FECHADO | Painel renomeado "Sinais de demonstração (teste)" (`index.html:433`). ESPACO_NEUTRO/TROCA_PAPEL seguem so no painel (agora rotulados como demonstracao); letra A isolada segue inalcancavel por texto (stopword `a`), comportamento aceito e coerente. |
| QA-006 comida/favor | FECHADO | Probe: `Comida` -> `soletrar (parcial): COMIDA`; `um favor` -> `soletrar (parcial): FAVOR`; LEMMAS sem `comida`, LEXICON sem `favor` isolado. |
| QA-007 normalizacao ø/æ | FECHADO | Probe: `Søren Æon Straße` -> SOREN / AEON / STRASSE (antes S/REN/ON). |
| QA-008 truncamento silencioso | FECHADO | `Translation.inputTruncated` (`translate.ts`), mensagem em `messages.ts:35`; probe com 600 `x` e `ala*130` mostra `in=true` e aviso; `enqueue`/`replace` retornam aceitos (`signQueue.ts:34-46`). `say()` ignora o retorno, mas e inalcancavel (120 < 200). |
| QA-009 envio vazio sem feedback | FECHADO | `ui.ts:60` "Digite ou fale um texto." (warn, regiao `#status` live); `onTestSign` agora atualiza status (`main.ts:305`). |
| QA-010 erro de carga | FECHADO (ressalva QA-018) | `ui.ts:214-221` `role="alert"`, botao "Tentar novamente", aviso de nao usar para comunicacao; `say()` bloqueia sem animador (`main.ts:252-255`); fila nao e consumida sem animador (`main.ts:366`); controles desabilitados ate o avatar carregar. |
| QA-011 bfcache/dispose | FECHADO (leitura; nao verificado em navegador) | `main.ts:375-379` descarta viewer so se `!persisted`; `viewer.ts:76-82` dispoe objetos, `renderer.dispose()` e `forceContextLoss()`. Microfone sempre encerrado. |
| QA-012 reconhecimento: borda | FECHADO (ressalva) | `recognizer.ts:197-202` `onIncomplete` quando so ha interino; `STOP_TIMEOUT_MS=3000` com abort e `onListening(false)` (`:214-229`), timer limpo em `onend`/`dispose`; ha `recognizer.test.ts`. Ressalva: no caminho do timeout os handlers sao nulos, entao um interino pendente e descartado sem aviso (raro, so se `onend` nunca chegar). Ver tambem QA-017. |
| QA-013 mic aria | FECHADO | Rotulo fixo "Usar microfone" + `aria-pressed`; estado visual em `#mic-state` com `aria-hidden` (`index.html:407-409`). |
| QA-014 regioes live | FECHADO | `transcript`/`glosses` sem `aria-live`; unica regiao live de resultado e `#status`; skip link vai ao campo de texto (`index.html:391`). `loading-text` mantem `role=status/alert` (adequado). Ressalva: ver QA-020 (skip link com painel recolhido). |
| QA-015 contraste/teclado | FECHADO | `--border` agora `#9399b2`: 4,45:1 sobre botao, 6,22:1 sobre painel; status warn `#f9e2af` 13,8:1; banner 10,5:1. Controles nativos; foco visivel global. Ordem de tab e leitor de tela nao verificados. |
| QA-016 CSP | FECHADO | Conferida em `dist/index.html` (acima). Varredura de seguranca segue com o agente security. |

## Novos achados (regressoes e lacunas da rodada)

### QA-017 [Media] Status "Ouvindo. Fale em português." permanece apos o microfone parar
- Local: `src/ui/ui.ts:137-141` (`setListening(false)` so limpa `#mic-state`), `src/main.ts:271-273`, `src/speech/recognizer.ts:197-202,220-228`.
- Reproducao: aceitar o consentimento, clicar no microfone, clicar de novo para parar (ou deixar o navegador encerrar) sem fala reconhecida, sem erro e sem interino. Nenhum caminho reescreve o status.
- Esperado: ao encerrar a captura, o status deixa de afirmar que esta ouvindo (relevante para privacidade: usuario acredita que o microfone ainda esta ativo, ou o inverso).
- Atual (inferido do codigo; nao verificado em navegador): `#status` continua "Ouvindo. Fale em português." ate outra acao. Tambem ocorre no caminho do timeout de 3 s.
- Resolucao esperada: `setListening(false)` limpa/atualiza o status se ele ainda for o de "ouvindo" (ex.: "Microfone desligado."), com teste.

### QA-018 [Baixa] "Tentar novamente" aparece sem efeito quando o WebGL falha
- Local: `src/main.ts:357-361` (`showLoadError` no catch do Viewer, `viewer` fica null), `src/main.ts:319-322` (`startLoad` retorna se `!viewer`), `src/ui/ui.ts:219`.
- Reproducao: navegador sem WebGL; clicar em "Tentar novamente".
- Esperado: botao oculto ou nova tentativa de criar o viewer.
- Atual: botao visivel, clique nao faz nada e nao informa.
- Resolucao esperada: ocultar o retry nesse erro (`showLoadError(msg, {retry:false})`) ou recriar o Viewer.

### QA-019 [Baixa] Botao Parar some junto com o painel recolhido
- Local: `index.html:416` (dentro de `#sidebar`), `src/ui/ui.ts:69-71`, `styles.css` (toggle em <=800px).
- Reproducao: em tela estreita, "Ocultar painel" para ver o avatar maior durante uma frase longa: o unico controle de parada fica oculto (aparece de novo so reabrindo o painel).
- Esperado: parada acessivel quando o avatar esta em movimento (WCAG 2.2.2).
- Resolucao esperada: reabrir o painel ao iniciar uma traducao, ou botao Parar proximo ao avatar/toggle. Baixa, pois o toggle esta sempre visivel em <=800px.

### QA-020 [Baixa] Skip link aponta para campo dentro de painel que pode estar oculto
- Local: `index.html:391` (`href="#text-input"`), `src/ui/ui.ts:84-88`.
- Reproducao: em tela estreita, ocultar o painel e usar o skip link: alvo nao focavel (`hidden`).
- Resolucao esperada: reabrir o painel ao ativar o skip link ou apontar para um alvo sempre visivel. Baixa.

### Verificado sem achado (novos elementos)
- `<dialog>` de consentimento (`index.html:453-460`, `ui.ts:144-176`): `aria-labelledby`/`aria-describedby` presentes; `showModal()` torna o resto inerte e prende o foco; `autofocus` no botao seguro ("Usar texto"); Esc fecha com `returnValue=''` -> recusa e foca o campo de texto; fechamento por "Entendi" retorna `true` somente com `returnValue==='accept'`; listener `close` unico (`{once:true}`) e botoes desregistrados; duplo clique no microfone compartilha a mesma pergunta (`ConsentGate.pending`, com `consent.test.ts`); sem `showModal` -> recusa com aviso. A decisao vive so em memoria (nada em web storage).
- Botoes desabilitados ate o avatar carregar (`ui.ts:130-135`): consistente; reabilitados por `setReady(true)`; retry chama `setReady(false)`. Observacao: com falha de carga, o campo de texto fica editavel mas sem botao de envio ativo; a explicacao esta no overlay.
- Banner `role="note"` presente e legivel (contraste 10,5:1).
- Botao Parar: `queue.clear()` + REST; o `onIdle` subsequente reinicia o REST uma vez (inofensivo). O tempo usa `performance.now()`, mesma base do `requestAnimationFrame`.
- Fila: `replace`/`enqueue` retornam aceitos; testes cobrem.
- `describeTranslation`: casos vazio, so pontuacao, emoji, `a a a`, 600 chars, 130 palavras e 300 `oi` retornam niveis/mensagens coerentes (nenhum caso incompleto aparece como "ok").

## O que continua SEM verificacao (sem navegador)
- Renderizacao/WebGL, resize real e ResizeObserver, listener `change` do media query em redimensionamento real, comportamento do `<dialog>` (foco inicial, retorno de foco, Esc, inercia do fundo), ordem de tab, leitor de tela, layout com banner, Web Speech API real (incluindo `onend` apos `stop()` e timeout), bfcache/`pageshow`, `forceContextLoss`, carga do modelo (FBX 6100 bloqueado, conhecido), aparencia/eixos dos sinais e do punho no repouso.
- Nao ha testes automatizados com DOM para `ui.ts` e `main.ts`; estes arquivos foram validados por leitura.

## Veredito por escopo

| Escopo | Veredito |
|---|---|
| Gates automatizados e integridade do snapshot | APROVADO |
| src/translation (+ messages) | APROVADO |
| src/queue | APROVADO |
| src/avatar poseMath/poseAnimator/viewer | APROVADO COM RESSALVAS (logica verificada; efeito visual e dispose/bfcache nao verificados) |
| src/speech + consentimento | APROVADO COM RESSALVAS (QA-017 aberto; Web Speech real nao verificada) |
| src/ui, layout responsivo, dialog | APROVADO COM RESSALVAS (QA-018, 019, 020 abertos; comportamento em navegador nao verificado) |
| Acessibilidade funcional estatica | APROVADO COM RESSALVAS (QA-017, 019, 020; sem tecnologia assistiva) |
| Consistencia dicionario x UI | APROVADO |
| Erro de carga do modelo na UI | APROVADO COM RESSALVAS (QA-018) |

Veredito geral: APROVADO COM RESSALVAS. Nao ha finding Alta/Critico aberto; QA-001 e QA-002 (bloqueios anteriores) estao fechados por evidencia. Pendencias para o autor: QA-017 (Media), QA-018, QA-019, QA-020 (Baixas). Qualquer correcao exige novo snapshot e reexecucao dos gates afetados. Verificacao em navegador real segue obrigatoria antes de aceite humano; a ausencia de teste nao e aprovacao.
