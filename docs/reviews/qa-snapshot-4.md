# QA - revalidacao do snapshot-4

Revisor: qa (independente do autor frontend-senior). Modelo: standard. Data: 2026-10-30.
Base: `docs/reviews/qa-snapshot-3.md` (QA-021, 022, 023 abertos). O autor nao fecha achados.

## Snapshot e execucao
- `sha256sum -c docs/reviews/snapshot-4.sha256`: todos os arquivos conferem (sem divergencia).
- `npm run typecheck`, `npm run lint`: OK. `npm test`: 9 arquivos, 79 testes, OK. `npm run build`: OK. `dist/` removido.
- Nada instalado. Probes em scratchpad da sessao (fora do projeto): 14 frases mistas por `translate` + `describeTranslation`; simulacao de 6 sequencias no `DraftKeeper`; calculo de contraste.

## Status dos achados

| ID | Status | Evidencia |
|---|---|---|
| QA-021 aviso unico para omissao de palavras de ligacao | FECHADO | `translate.ts`: `incomplete = missingLetters>0 \|\| truncated \|\| inputTruncated` (omitidas fora). `messages.ts:32-57`: nivel `info` somente quando nao ha perda de conteudo e ha omitidas; a lista sempre aparece no texto da mensagem. Ver analise abaixo. |
| QA-022 undo restaurava fala anterior | FECHADO | `draft.ts:18-25` flag `fieldFromSpeech`: probe `meu rascunho` -> fala1 -> fala2 -> `undo()` devolve `meu rascunho`; fala igual duas vezes mantem o rascunho; campo vazio nao oferece undo; edicao (`discard`) zera; apos undo o ciclo recomeca corretamente (`k`: undo, nova fala guarda o texto restaurado). Observacao menor: apos "Mostrar em sinais" (`discard`), o texto enviado passa a contar como digitado e, se uma fala o substituir, o botao "texto digitado antes" o restaura (aceitavel, e o texto que o usuario enviou). |
| QA-023 "Nenhum sinal" com glosas de soletracao | FECHADO | `messages.ts:37-43`: com `signs.length===0` e glosas de soletracao, a mensagem passa a explicar "as palavras só seriam soletradas e nenhuma dessas letras tem sinal definido neste protótipo. A mensagem NÃO foi transmitida" (probe `Eu sou surdo`, `xxxx`). Sem glosas: "Nenhum sinal encontrado" (probe `o a de`). Nivel sempre warn. |

## Analise adversarial do nivel `info`
Regra implementada: `info` so ocorre se `signs>0`, `incomplete=false` (nenhuma letra sem sinal, nenhum truncamento de entrada ou de sinais) e `omittedWords>0`. Logo, todo token que nao e stopword gerou sinal completo; so palavras de STOPWORDS foram descartadas.
Probe (nivel resultante):
- Vocabulario puro (`Oi`): ok.
- So omissao: `Estou com dúvida`, `O banheiro`, `Obrigado pela água`, `Água que sim`, `Não é`, `Banheiro, por favor, o`: info, com a lista "Palavras de ligação não mostradas (...): ..." no texto.
- Palavra de conteudo sem sinal + artigo: `Quero o banheiro` (QUERO sem sinal): warn "ATENÇÃO... Letras sem sinal... Palavras de ligação...: o"; `Casa de água`, `Ele foi ao banheiro`: warn.
- Truncamento: `ala*130 + de` (entrada e sinais): warn com os dois avisos de truncamento; a omitida `de` ficou fora do texto porque o corte de 500 caracteres a eliminou, o que e coerente.
- So palavras de ligacao (`o a de`): warn, "Nenhum sinal encontrado... NÃO foi transmitida" + lista.
- 0 sinais com soletracao: warn.
Conclusao: nao encontrei caso em que perda de conteudo (letra sem sinal, soletracao parcial, truncamento, nada a mostrar) receba nivel `info` ou `ok`; a perda sempre gera "ATENÇÃO"/"NÃO foi transmitida" em `warn`. A lista de omitidas continua em `#status`, a unica regiao `aria-live` (o texto e atribuido por `setStatus`), tanto em info quanto em warn.
Ressalva semantica (nao e achado de defeito): stopwords como `foi`, `era`, `esta`, `ate`, `sobre`, `que` carregam tempo/sentido; em `info` ficam listadas, o que e adequado ao nivel.

## `.status.info`: contraste e dependencia de cor
- `styles.css:163-165`: cor `--muted` `#bac2de` sobre painel `#181825` = 9,91:1 (passa AA/AAA). `ok` = 11,81:1.
- Nao depende so de cor: info e ok diferem pelo texto (a mensagem info traz "Palavras de ligação não mostradas ...") e `warn` tem negrito e prefixo "ATENÇÃO". A distincao ok x info por cor e minima (nao e requisito, pois o texto distingue).
- `ui.ts:229-234` `setStatus` alterna as tres classes corretamente (nivel `ok` limpa todas).

## Regressoes QA-001..020
- QA-001, 002, 010, 011, 012, 013, 014, 015, 016, 017, 018, 019, 020: arquivos relevantes (`ui.ts` fora de `setStatus`/draft, `main.ts`, `index.html`, speech, viewer, dictionary) sem mudanca funcional; testes e build passam. `statusOnListening`, `#stop-float`, skip link, retry condicional e listener de media query seguem presentes. Sem regressao (leitura/testes; navegador nao verificado).
- QA-004/005/006/007/008/009: probes confirmam `soletrar (parcial)`, `inputTruncated`, e mensagens de envio vazio inalterados.
- QA-003: Parar (painel e flutuante) inalterados.
- README.md (novo/alterado): documenta `npm ci`, `.npmrc`, o que nao servir (`legacy/`, `modelo/main.html`) e cabecalhos HTTP exigidos; nao afeta comportamento.

## Novos achados

### QA-024 [Baixa] Mensagem `info` comeca com "Mostrando N sinal(is)" mesmo quando palavras de ligacao com sentido (negacao/tempo) foram omitidas
- Local: `src/ui/messages.ts:44-48`, `src/translation/glosser.ts` (STOPWORDS inclui `foi`, `era`, `esta`, `que`).
- Reproducao: `Água que sim` / `Não é` -> info, sem "ATENÇÃO". Perda semantica possivel (ex.: `foi` marca passado) fica so na lista.
- Esperado: decisao de produto explicita; hoje o texto e correto e a lista presente, entao e informativo.
- Resolucao esperada: nenhuma obrigatoria; considerar revisar a lista de stopwords com interprete de Libras. Nao bloqueante.

Sem outros achados novos. Nenhum caso de falso negativo (perda de conteudo sem aviso forte) encontrado.

## O que continua SEM verificacao (sem navegador)
- Sobreposicao do `#stop-float` ao avatar (mobile em especial); renderizacao/WebGL; resize real e `change` do media query; `<dialog>` (foco, Esc, inercia); ordem de tab real e leitor de tela (incluindo anuncio da mensagem `info` e de "Microfone desligado."); Web Speech API real e timeout apos `stop()`; bfcache/`forceContextLoss`; carga do modelo (FBX 6100 bloqueado, conhecido); aparencia e eixos dos sinais.
- `ui.ts` e `main.ts` seguem sem testes com DOM; validados por leitura. Cor percebida de `.status.info` vs `.ok` nao foi vista em tela (apenas calculada).

## Veredito por escopo

| Escopo | Veredito |
|---|---|
| Gates automatizados e integridade do snapshot | APROVADO |
| src/translation e messages (nivel info, perda de conteudo) | APROVADO |
| src/ui (draft, status info) | APROVADO COM RESSALVAS (comportamento em navegador nao verificado) |
| src/queue, avatar, speech, consentimento | APROVADO COM RESSALVAS (sem delta; Web Speech real e visual nao verificados) |
| Acessibilidade funcional estatica | APROVADO COM RESSALVAS (leitor de tela, sobreposicao do botao flutuante nao verificados) |
| Consistencia dicionario x UI | APROVADO |

Veredito geral: APROVADO COM RESSALVAS. QA-021, 022 e 023 estao FECHADOS; so resta QA-024 (Baixa, informativo). Verificacao em navegador real segue obrigatoria antes do aceite humano; ausencia de teste nao e aprovacao.
