# Revisao do delta snapshot-3 para snapshot-4 (conformidade + tecnica)

- Revisor: instancia reviewer (Sonnet 5.5, tier standard); nao e autora de codigo. Escopo limitado ao delta. REV-002 e REV-004 seguem pendentes e nao foram reabertos.
- Snapshot: docs/reviews/snapshot-4.sha256 - sha256sum -c sem divergencias.
- Alterados vs snapshot-3 (por hash): README.md, src/styles.css, src/translation/glosser.ts, src/translation/translate.ts, src/ui/draft.ts, draft.test.ts, messages.ts, messages.test.ts, ui.ts. Nenhum outro arquivo mudou.
- Instalacoes: package.json, package-lock.json e .npmrc com hashes identicos nos snapshots 3 e 4. Nada instalado; sem nova linha de registro necessaria.
- Executado (dist/ removido depois): typecheck OK; lint OK; test 9 arquivos / 79 testes OK; build OK (JS 634,81 kB, gzip 165,8 kB).

## Veredito do delta
- **Conformidade: APROVADO**
- **Tecnica: APROVADO**
Nenhum finding novo. Aceite humano separado.

## REV-011 - FECHADO
- Causa original: replace sobrescrevia previous a cada fala, perdendo o rascunho digitado em falas encadeadas.
- Correcao verificada em src/ui/draft.ts: o flag fieldFromSpeech faz replace guardar o rascunho apenas quando o campo NAO veio de fala; falas seguintes mantem previous; undo e discard zeram o flag, entao um novo texto digitado volta a ser preservado. Trace manual dos casos: rascunho D, fala 1, fala 2, fala 3 => undo devolve D; fala igual ao campo apos a primeira nao perde o desfazer; campo vazio e falas encadeadas => nada a restaurar; editar (discard) ou desfazer reinicia o ciclo.
- Testes: draft.test.ts agora cobre falas encadeadas, fala igual ao campo, ciclo apos editar/desfazer e campo vazio (7 testes), todos passando. O rotulo e o README (Decisoes de UX, item PRIV-010 / REV-011) agora sao verdadeiros: o botao restaura o que foi digitado.
- Simplicidade: uma variavel booleana a mais, classe continua pura e sem DOM; solucao minima adequada.

## Semantica nova de Translation.incomplete e StatusLevel info
- incomplete agora significa so PERDA DE CONTEUDO (letra sem sinal, truncamento de sinais ou de entrada). omittedWords segue no contrato e nunca e escondido: describeTranslation anexa sempre a lista (ate 10 palavras) em qualquer ramo, inclusive no aviso forte e no caso sem sinais. O comentario do campo em translate.ts documenta a mudanca; o README descreve o mesmo comportamento. Consistencia codigo/documentacao/testes confirmada (messages.test.ts: so omitidas => info sem ATENCAO e com lista; perda de conteudo => warn com lista; truncamento => ATENCAO; vocabulario puro => ok sem lista).
- Compatibilidade: gloss() e glossWithOmitted() inalterados em contrato; os consumidores de incomplete (messages.ts) foram ajustados no mesmo delta; typecheck e lint limpos, sem outros usos quebrados.
- StatusLevel com info propagado de ponta a ponta (tipo, setStatus com toggle da classe info, CSS .status.info). Caso novo corrigido: sem sinais mas com glosas so soletradas deixa de dizer Nenhum sinal encontrado e explica que as letras nao tem sinal (QA-023), com teste.
- Honestidade: a mudanca reduz o alarmismo sem esconder a informacao (omissao continua visivel e rotulada como nao mostrada). O risco de produto restante e inerente a glosa: palavras de ligacao como ser/sou/que sao descartadas e a frase pode perder nuance; fica como info conforme a decisao documentada no README, a reavaliar com usuarios (observacao, nao finding).

## Observacoes sem bloqueio
- O README mantem o titulo Decisoes de UX/privacidade (rodada 2) e inclui um refinamento da rodada 3; apenas rotulagem.
- O nivel info usa a cor var(--muted): contraste suficiente nao foi medido (sem navegador). Sugestao: conferir o contraste do texto do status em info, ja que ele carrega a lista de palavras nao mostradas.

## Principios de qualidade (delta)
Reuso: describeTranslation concentra os textos; omissionList extraida e reutilizada nos tres ramos. Simplicidade: sem dependencias novas, mudancas pequenas. Idempotencia: DraftKeeper undo/discard repetidos sao seguros. Verificabilidade: +9 testes (70 para 79) cobrem as regras novas; a parte de DOM (classe info, botao de desfazer) continua sem teste automatizado nem verificacao em navegador.

## Limites
Sem navegador: layout, cores, foco e leitor de tela nao verificados. Revisao restrita ao delta.
