# QA - revalidacao do snapshot-3

Revisor: qa (independente do autor frontend-senior). Modelo: standard. Data: 2026-10-30.
Base: `docs/reviews/qa-snapshot-2.md` (QA-017..020 abertos). O autor nao fecha achados; status vem de evidencia propria.

## Snapshot e execucao
- `sha256sum -c docs/reviews/snapshot-3.sha256`: todos os arquivos conferem (sem divergencia).
- `npm run typecheck`, `npm run lint`: OK. `npm test`: 9 arquivos, 70 testes, OK. `npm run build`: OK. `dist/` removido.
- Nada instalado. Probes em scratchpad da sessao (fora do projeto): 16 frases do dia a dia passadas por `translate` + `describeTranslation`.

## Status dos achados abertos

| ID | Status | Evidencia |
|---|---|---|
| QA-017 status "Ouvindo" preso | FECHADO (leitura + testes; Web Speech real nao verificada) | `messages.ts:51-62` `statusOnListening`: ao parar, so troca "Ouvindo. Fale em português." por "Microfone desligado."; mantem erros/resultados que ja substituiram a mensagem; `ui.ts:setListening` aplica. Ordem real no recognizer: `onerror` antes de `onend` (erro preservado), `onend` -> `onListening(false)` antes de `onIncomplete` (aviso final prevalece); caminho do timeout tambem chama `onListening(false)`. |
| QA-018 retry sem efeito no WebGL | FECHADO | `main.ts:139` `showLoadError(..., { retry: false })`; `ui.ts` `retry.hidden = !opts.retry`; `setLoading` esconde o botao no fluxo normal. |
| QA-019 Parar some com painel recolhido | FECHADO (posicionamento visual nao verificado) | `index.html:66` `#stop-float` dentro de `#viewport`, fora do painel; ligado ao mesmo `onStop` (`ui.ts`), desabilitado ate `setReady(true)`; `styles.css:308-315`; `#loading-overlay` (z-index 20) cobre o botao (z-index 15) em erro/carga, e ele esta desabilitado nesses estados. |
| QA-020 skip link com painel oculto | FECHADO | `ui.ts` handler de `#skip`: `preventDefault`, `setSidebarHidden(false)` e `input.focus()`; funciona por teclado (Enter dispara `click` em ancora). |

## Regressoes dos QA-001..016
- QA-001 (painel/resize): `matchMedia('(max-width: 800px)')` + listener `change` que reabre o painel em >800px continua presente; o handler novo do skip link reutiliza `setSidebarHidden`, mantendo `aria-expanded` e o texto do toggle coerentes. Sem regressao (leitura; navegador nao verificado).
- QA-002, 004-009, 011-013, 016: codigo inalterado ou apenas estendido; os 70 testes e os probes confirmam. QA-004: mensagens parciais continuam; QA-008: `inputTruncated` continua.
- QA-014 (regiao live unica): `#status` segue como unica regiao de resultado; "Microfone desligado." e a mensagem de restauracao passam por ele. Sem regressao.
- QA-015 (contraste): `#stop-float` usa o estilo global de `button` (borda `#9399b2` 4,45:1 sobre o botao; texto 8,7:1); sem cor nova. O banner e `.status.warn` seguem como medidos (10,5:1 e 13,8:1).
- QA-010: erro de carga com `role=alert`, retry quando aplicavel; WebGL sem retry. Sem regressao.

## Avaliacao do aviso "NÃO transmitida por inteiro" (omittedWords -> incomplete)
Probe (frase -> resultado):
- `Oi`, `Oi, tudo bem?`, `Por favor`, `Sim`, `Não`: ok (sem aviso).
- `Estou com dúvida`: DUVIDA + aviso (omitidas: estou, com). Unico motivo do aviso e a palavra de ligacao.
- `Obrigado pela ajuda`: OBRIGADO + soletrar parcial AJUDA + aviso (letras J,U,D e omitida "pela").
- `Onde fica o banheiro?`, `Quero um copo de água`, `Posso ir ao banheiro?`: aviso (letras sem sinal + omitidas).
- `Eu estou bem`, `Eu sou surdo`: 0 sinais, "Nenhum sinal encontrado" (glosas "soletrar (parcial): EU | BEM" ficam visiveis ao mesmo tempo).
Conclusao: com apenas 14 palavras e 3 letras no dicionario, quase toda frase real ja disparava o aviso por letras sem sinal; `omittedWords` so muda o resultado de frases cujo unico problema sao artigos/preposicoes/copulas (ex.: `Estou com dúvida`). Nao ha falso negativo encontrado: nenhuma frase com palavra descartada aparece como "ok". O aviso nao impede o uso (a animacao ocorre normalmente; o texto e curto, 10 palavras no maximo listadas). Ruido residual registrado em QA-021.

## Novos achados

### QA-021 [Baixa] Aviso de gravidade unica trata artigo/copula omitida como perda de conteudo
- Local: `src/translation/translate.ts` (`incomplete` inclui `omittedWords.length > 0`), `src/ui/messages.ts:31-38`.
- Reproducao: `Estou com dúvida` -> nivel warn "ATENÇÃO: a mensagem NÃO foi transmitida por inteiro. Palavras omitidas...", embora o conteudo lexical (dúvida) tenha sido transmitido; igual para `Por favor, o banheiro`.
- Esperado: distinguir perda de conteudo (letras/palavras sem sinal, truncamento) de omissao de palavras funcionais, para evitar alerta constante e perda de sinal de atencao.
- Atual: ambos usam o mesmo nivel e a mesma frase de abertura. Hoje o impacto e pequeno (quase todo texto ja gera aviso), mas pode virar fadiga de alerta quando o dicionario crescer. Decisao de produto/UX: manter conservador e aceitar, ou separar nivel "info" para funcionais. Nao bloqueante.

### QA-022 [Baixa] "Restaurar o texto digitado antes" pode restaurar a fala anterior, nao o texto digitado
- Local: `src/ui/draft.ts:13-16`, `src/ui/ui.ts:setInputText`.
- Reproducao (logica): digitar D; falar S1 (D e guardado, botao aparece); falar S2 sem editar o campo: `replace(current=S1, incoming=S2)` guarda S1 e descarta D. O botao continua rotulado "texto digitado" mas restaura S1. Tambem: se S2 == S1 o rascunho e zerado (`previous=null`) e o botao some, perdendo D.
- Esperado: manter o rascunho digitado original ate o usuario editar/enviar.
- Resolucao esperada: so sobrescrever `previous` se o conteudo atual nao veio de voz (flag), com teste em `draft.test.ts`.

### QA-023 [Baixa] Mensagem "Nenhum sinal encontrado" coexiste com glosas de soletracao exibidas
- Local: `src/ui/messages.ts:22-24`, `src/translation/translate.ts`.
- Reproducao: `Eu estou bem` -> caixa de glosas mostra `soletrar (parcial): EU | soletrar (parcial): BEM` mas nada e animado e o status diz "Nenhum sinal encontrado".
- Esperado: a caixa de glosas indicar que nada sera animado, ou a mensagem explicar "soletracao sem letras com sinal".
- Resolucao esperada: ajustar texto/mostrar glosas vazias quando `signs.length===0`. Baixa (pre-existente desde snapshot-1; a nova mensagem e mais clara).

### Verificado sem achado (delta)
- Ordem de tab: toggle, controles do painel, depois `#stop-float` (primeiro filho de `#viewport`); skip link e o primeiro elemento. Sem armadilha de foco (dialog continua modal).
- Duplicidade de "Parar": dois botoes com nomes distintos ("Parar e voltar à posição neutra" e "Parar"), mesma acao e mesmo estado de habilitacao; aceitavel. Nome curto "Parar" depende do contexto visual (WCAG 2.5.3 satisfeito, pois o nome acessivel contem o texto visivel).
- `DraftKeeper`: edicao (`input`) e envio descartam o desfazer; atribuicao programatica de `value` nao dispara `input`, entao o botao permanece enquanto o campo nao e editado (correto). Restaurar foca o campo e informa por `#status`.
- `undo-draft` usa o atributo `hidden` (sem regra CSS de `display` para `button` que o anule).

## O que continua SEM verificacao (sem navegador)
- Sobreposicao do `#stop-float` ao avatar (enquadramento half-body, mobile com `#viewport` de 50dvh), seu foco visivel e area de toque; renderizacao e WebGL; resize real e media query `change`; comportamento do `<dialog>` (foco, Esc, inercia); ordem de tab real e leitor de tela (incluindo anuncio de "Microfone desligado."); Web Speech API real e timeout apos `stop()`; bfcache/`forceContextLoss`; carga do modelo (FBX 6100 bloqueado, conhecido); aparencia e eixos dos sinais e do punho.
- `ui.ts` e `main.ts` seguem sem testes com DOM; validados por leitura.

## Veredito por escopo

| Escopo | Veredito |
|---|---|
| Gates automatizados e integridade do snapshot | APROVADO |
| src/translation e messages (incl. omittedWords) | APROVADO COM RESSALVAS (QA-021, QA-023) |
| src/queue, poseMath/poseAnimator/viewer | APROVADO (sem delta; efeito visual nao verificado) |
| src/speech + consentimento | APROVADO COM RESSALVAS (Web Speech real nao verificada; QA-017 fechado por leitura/testes) |
| src/ui, draft, layout, dialog | APROVADO COM RESSALVAS (QA-022; comportamento em navegador nao verificado) |
| Acessibilidade funcional estatica (inclui #stop-float, skip link) | APROVADO COM RESSALVAS (sobreposicao ao avatar e leitor de tela nao verificados) |
| Consistencia dicionario x UI | APROVADO |

Veredito geral: APROVADO COM RESSALVAS. QA-017, 018, 019 e 020 estao FECHADOS; nenhum finding Alta/Media aberto. Pendencias nao bloqueantes: QA-021, QA-022, QA-023 (Baixas). Verificacao em navegador real segue obrigatoria antes do aceite humano; ausencia de teste nao e aprovacao.
