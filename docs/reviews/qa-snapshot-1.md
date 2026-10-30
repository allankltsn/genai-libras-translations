# QA adversarial + acessibilidade funcional - snapshot-1

Revisor: qa (nao e o autor; autor: frontend-senior). Modelo: standard. Data: 2026-10-30.
Escopo: src/translation, src/queue, src/avatar (poseMath, poseAnimator, viewer, loadAvatar), src/speech, src/ui, main.ts, index.html, styles.css, vite.config.ts.

## Snapshot e execucao
- `sha256sum -c docs/reviews/snapshot-1.sha256`: todos os arquivos conferem (nenhuma divergencia).
- `npm run typecheck`: OK. `npm run lint`: OK. `npm test`: 3 arquivos, 22 testes, OK. `npm run build`: OK (bundle JS 627 kB; limite de aviso elevado para 700 kB em vite.config.ts). `dist/` removido ao final.
- Nada instalado. Probes adversariais rodados fora do projeto (scratchpad da sessao); nenhum arquivo de teste adicionado ao repositorio.
- Probe de traducao (entrada -> glosas): vazio, espacos, `!!!???`, emoji, CJK -> 0 sinais (correto); 600 `x` -> 1 glosa de 500 chars, 0 sinais; `Søren Æon` -> `soletrar: S | REN | ON`; `um favor` -> POR_FAVOR; `Comida` -> COMER; `casa 123` -> `soletrar: CASA`, 2 sinais (A, A), letras sem sinal `CS123`; `a a a ...` (250x) -> 0 sinais.
- Conhecido e ignorado como finding novo: FBX 6100 nao carrega no FBXLoader. Tratamento na UI avaliado em QA-010.

## Findings

### QA-001 [Alta] Painel lateral fica inacessivel apos redimensionar de <=800px para >800px
- Local: `src/ui/ui.ts:48` (auto-oculta o painel via `toggle.click()` se `matchMedia('(max-width: 800px)')` no carregamento), `src/styles.css:59-61` (`#sidebar-toggle{display:none}` fora do media query), `src/styles.css:56-58` (`#sidebar[hidden]{display:none}`), `src/styles.css:247-249`.
- Reproducao: abrir em janela <=800px (ou celular); painel e ocultado. Ampliar a janela (ou girar o aparelho) para >800px.
- Esperado: painel visivel, ou botao de alternancia disponivel em qualquer largura.
- Atual: painel permanece `hidden` e o botao "Mostrar painel" e `display:none` em >800px. Nenhum controle (microfone, texto) fica acessivel ate recarregar. Nao ha listener de `change` do MediaQueryList.
- Resolucao esperada: toggle visivel em todas as larguras, ou ouvir `change` e restaurar `hidden=false` em >800px.

### QA-002 [Media] Pose do punho (`RightHand`) nunca volta ao repouso
- Local: `src/signs/dictionary.ts:15-22` (REST_POSE nao inclui `*Hand`), `src/signs/poseHelpers.ts:41-43` (Hand so e gerado se `wrist`/`wristTwist` definidos), `src/avatar/poseMath.ts:57-65` (reset so para ossos presentes no repouso).
- Reproducao (probe sobre o dicionario): ossos citados fora do REST_POSE: LETRA_L, OI, POR_FAVOR, OBRIGADO, BANHEIRO, AGUA -> `RightHand`.
- Esperado: apos o sinal, e no `onIdle` (REST_SIGN), todo osso citado volta a bind pose (determinismo documentado em `poseMath.ts:25-27`).
- Atual: o ultimo valor do punho (ex.: BANHEIRO termina com wristTwist 0.3, OI com wrist 0.2) persiste indefinidamente, inclusive em "Posição neutra" e nos sinais seguintes.
- Resolucao esperada: incluir `Left/RightHand` com offset zero no REST_POSE (ou resetar a uniao de ossos de todos os sinais) e teste em `poseMath.test.ts` cobrindo osso citado por sinal e ausente do repouso.
- Falha logica comprovada por probe; efeito visual nao verificado (sem navegador/modelo).

### QA-003 [Media] Frase longa prende o avatar por minutos sem controle de parar
- Local: `src/translation/translate.ts:5` (ate 120 sinais), `src/signs/dictionary.ts` (1,4 a 2,2 s por sinal), `src/main.ts:58-67`, `index.html` (nao ha botao parar).
- Reproducao: digitar palavras com varias letras A/L/Y (ex.: `ala ala ala ...`) ate 500 chars: ate 120 sinais x ~1,4 s ~ 2,8 min de animacao; frases de vocabulario chegam a mais.
- Esperado: usuario consegue interromper movimento >5 s sem enviar novo texto (WCAG 2.2.2).
- Atual: unico meio e enviar outro texto ou "Posição neutra", escondida num `<details>` fechado.
- Resolucao esperada: botao visivel "Parar" (`queue.clear()` + REST) ou expor "Posição neutra" fora do painel de teste.

### QA-004 [Media] Glosa "soletrar: X" e feedback enganosos (so A, L e Y tem sinal)
- Local: `src/translation/translate.ts:30-32`, `src/signs/dictionary.ts:174-188`, `src/main.ts:31-37`.
- Reproducao: `casa` -> glosa `soletrar: CASA`, avatar executa A, A; status (verde, nao erro) diz apenas "Sem sinal definido para as letras: C, S". Para `xxxx...` a caixa de glosa exibe ate 500 `X`.
- Esperado: UI nao sugere soletracao completa; aviso claro de cobertura parcial.
- Resolucao esperada: marcar glosa como parcial, status em estilo de aviso (nao verde), limitar tamanho exibido; considerar nao animar soletracao incompleta.

### QA-005 [Baixa] Consistencia dicionario x UI: 2 sinais inalcancaveis por texto; letra A isolada inalcancavel
- Local: `src/signs/dictionary.ts:195-210` (LEXICON), `:215-221` (TEST_PANEL), `index.html:47`, `src/translation/glosser.ts:17`.
- Contagem: 17 ids = 16 sinais + REPOUSO; TEST_PANEL mostra os 16 + "Posição neutra" (consistente). LEXICON tem 14 entradas -> 11 sinais; A/L/Y so por soletracao; ESPACO_NEUTRO e TROCA_PAPEL nao tem entrada e so existem no painel, rotulado "Testar sinais do vocabulário". A palavra `a` e stopword, logo a letra A isolada nunca e acionada (`a a a` -> 0 sinais).
- Resolucao esperada: renomear o painel (ex.: "Sinais de demonstracao") e documentar quais sinais sao acionaveis por texto.

### QA-006 [Media] Lexico/lematizacao produz traducoes semanticamente erradas
- Local: `src/translation/glosser.ts:36` (`comida -> comer`), `src/signs/dictionary.ts:198` (`favor` isolado -> POR_FAVOR).
- Reproducao: `Comida` -> COMER (substantivo vira verbo); `um favor` -> POR_FAVOR (sentido diferente); `nao sei` -> NEGACAO + soletrar SEI.
- Resolucao esperada: remover `comida` e `favor` isolado do mapeamento (ou validar com interprete); manter aviso de prototipo.

### QA-007 [Baixa] Normalizacao fragmenta palavras com letras latinas nao decomponiveis
- Local: `src/translation/normalize.ts:13-14`.
- Reproducao: `Søren Æon` -> tokens `s`, `ren`, `on` (probe). CJK/emoji viram vazio e "Nenhum sinal encontrado" (aceitavel).
- Resolucao esperada: tabela para `ø/æ/ß/œ` ou documentar como limitacao (impacto baixo em pt-BR).

### QA-008 [Baixa] Truncamento silencioso de entrada >500 chars e descarte silencioso na fila
- Local: `src/translation/normalize.ts:10`, `src/queue/signQueue.ts:41-44`.
- Reproducao: transcricao de fala >500 chars (textarea tem `maxlength`, reconhecedor nao): so os primeiros 500 sao traduzidos, sem aviso (`truncated` cobre apenas o limite de 120 sinais). `enqueue` descarta excedente de 200 sem retorno (hoje inalcancavel via `say()`, 120<200).
- Resolucao esperada: flag `inputTruncated` em `Translation` com aviso; `enqueue` retornar quantidade aceita.

### QA-009 [Baixa] Envio vazio sem feedback; status antigo persiste em teste de sinal
- Local: `src/ui/ui.ts:36-37`, `src/main.ts:62-67`.
- Reproducao: "Traduzir para Libras" com campo vazio/espacos nao faz nada nem anuncia. Clicar sinal de teste mantem o status anterior e nao avisa "Modelo 3D não carregado".
- Resolucao esperada: mensagem "Digite ou fale um texto." em `role=status`; atualizar status em `onTestSign`.

### QA-010 [Baixa] Erro de carga do modelo: tratamento adequado com ressalvas
- Local: `src/ui/ui.ts:113-118`, `index.html:61`, `src/main.ts:36,108-114`.
- Positivo: texto pt-BR sem stack, spinner parado, `say()` informa "Modelo 3D não carregado." com estilo de erro; `bones.size===0` e `missing` tratados; URLs externas bloqueadas pelo URLModifier.
- Ressalvas: (a) `role="status"` (polite) para falha bloqueante, preferivel `alert`; (b) sem "Tentar novamente"; (c) overlay cobre permanentemente o `<main>`; (d) enquanto carrega (animator null) `say()` diz "não carregado" (impreciso) e a fila consome os sinais, perdendo-os; (e) mensagem unica nao distingue arquivo ausente de formato nao suportado.
- Resolucao esperada: `role="alert"` no erro, botao de nova tentativa, mensagem "ainda carregando" e nao consumir fila sem animador.

### QA-011 [Baixa] `pagehide` descarta o viewer; pagina restaurada do bfcache fica sem renderer
- Local: `src/main.ts:117-120`, `src/avatar/viewer.ts:70-77`.
- Reproducao: navegar para outra pagina e voltar (bfcache, `pagehide` com `persisted=true`, depois `pageshow`).
- Atual (inferido do codigo): loop parado, canvas removido, callbacks limpos, nenhum handler `pageshow`; UI viva com avatar morto. `dispose()` tambem nao chama `disposeObject` no modelo. Nao verificado em navegador.
- Resolucao esperada: descartar apenas se `!event.persisted`, ou recriar em `pageshow`.

### QA-012 [Baixa] Reconhecimento de fala: casos de borda
- Local: `src/speech/recognizer.ts:100-121,136-146`, `src/main.ts:41-44`.
- Positivo: API ausente -> mic desabilitado e mensagem; `start()` idempotente; excecao em `start()` tratada; `dispose` anula handlers; erros nao expoem texto bruto; nada persistido.
- Ressalvas: (a) se `onend` ocorrer so com resultados interinos, o texto nao e traduzido nem avisado; (b) se `onend` nunca chegar apos `stop()`, UI fica em "Ouvindo…" sem timeout.
- Nao verificado: Web Speech API real.

### QA-013 [Media] Acessibilidade: botao do microfone com semantica duplicada
- Local: `index.html:26-28`, `src/ui/ui.ts:84-88`.
- Problema: `aria-pressed` combinado com rotulo que muda ("Ativar microfone" / "Ouvindo… clique para parar") faz leitores de tela anunciarem estado e acao contraditorios.
- Resolucao esperada: rotulo fixo + `aria-pressed`, ou rotulo dinamico sem `aria-pressed`.

### QA-014 [Baixa] Acessibilidade: regioes `aria-live` e landmarks
- Local: `index.html:15,40,42,43,57-58`.
- Problemas: tres regioes polite (`transcript`, `glosses`, `status`) anunciam em sequencia a cada traducao; skip link leva a `<main>` sem conteudo interativo (o alvo util seria o campo de texto); `role="img"` no container do canvas tem rotulo estatico.
- Resolucao esperada: reduzir regioes live (manter `status` consolidado); skip link para o campo de texto.

### QA-015 [Baixa] Contraste, teclado e movimento (informativo)
- Contraste calculado (WCAG): texto principal 8,7 a 9,3:1; `--err` 7,6:1; `--ok` 11,8:1; `--warn` 9,9:1; foco `#f9e2af` 3px. Borda `#6c7086` sobre painel 3,59:1 e sobre textarea 3,84:1 (passa 1.4.11); borda do botao sobre `#313244` 2,57:1 (limite do botao depende do fundo; aceitavel mas fraco).
- `prefers-reduced-motion` cobre apenas o spinner; animacao do avatar e o conteudo (ver QA-003).
- Teclado: controles nativos (`button`, `textarea`, `summary`), foco visivel global; Enter no textarea insere quebra de linha (envio so pelo botao). Nao verificado: ordem real de tab e leitor de tela.
- Resolucao esperada: documentar; considerar borda de botao mais clara.

### QA-016 [Baixa] Observacoes de seguranca de passagem (varredura e do agente security)
- `ui.ts` usa `textContent`; CSP estrita configurada para build em `vite.config.ts`. Nao verifiquei o `dist/index.html` gerado (dist removido); sugere-se checar que `__CSP__` foi substituido. Sem finding adicional.

## O que NAO foi possivel verificar (sem navegador)
- Renderizacao/WebGL, resize real, ResizeObserver, tab/foco reais, leitor de tela, media queries, Web Speech API, bfcache, carga de modelo (FBX bloqueado, conhecido), eixos/aparencia dos sinais, enquadramento de camera.
- `poseAnimator.ts`, `viewer.ts`, `ui.ts`, `recognizer.ts` revisados por leitura; so poseMath, fila e traducao tem testes unitarios (sem testes para ui, recognizer, poseAnimator).

## Veredito por escopo
| Escopo | Veredito |
|---|---|
| Gates automatizados (typecheck/lint/test/build, integridade do snapshot) | APROVADO |
| src/translation | APROVADO COM RESSALVAS (QA-004, 006, 007, 008) |
| src/queue | APROVADO COM RESSALVAS (QA-008; sem defeito funcional na logica) |
| src/avatar/poseMath + poseAnimator | REPROVADO ate correcao de QA-002 (visual nao verificado) |
| src/speech | APROVADO COM RESSALVAS (QA-012; nao exercitado em navegador) |
| src/ui + layout responsivo | REPROVADO ate correcao de QA-001 |
| Acessibilidade funcional (estatica) | APROVADO COM RESSALVAS (QA-003, 013, 014, 015; sem tecnologia assistiva) |
| Consistencia dicionario (17 sinais) x UI | APROVADO COM RESSALVAS (QA-005) |
| Tratamento de erro de carga do modelo na UI | APROVADO COM RESSALVAS (QA-010) |

Veredito geral: REPROVADO (QA-001 Alta e QA-002 Media bloqueiam). Proximo responsavel: frontend-senior (todos os findings). Apos correcao: novo snapshot, reexecucao dos gates e confirmacao independente pelo QA.
