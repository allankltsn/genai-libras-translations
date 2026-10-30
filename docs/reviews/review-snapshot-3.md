# Revisao do delta snapshot-2 para snapshot-3 (conformidade + tecnica)

- Revisor: instancia reviewer (Sonnet 5.5, tier standard); nao e autora de codigo. Escopo limitado ao delta. REV-002 e REV-004 seguem pendentes (usuario/modelo) e nao foram reabertos.
- Snapshot: docs/reviews/snapshot-3.sha256 - sha256sum -c sem divergencias.
- Arquivos alterados vs snapshot-2 (comparando hashes): README.md, index.html, src/main.ts, src/styles.css, src/translation/{glosser,translate,translation.test}.ts, src/ui/{ui,messages,messages.test}.ts; novos: src/ui/draft.ts e draft.test.ts. Nenhum outro arquivo mudou.
- Instalacoes: package.json, package-lock.json e .npmrc tem hashes IDENTICOS no snapshot-2 e no snapshot-3 (2d75d9af..., bd772eb6..., ad0e4e77...). Nenhum pacote instalado ou alterado; nao ha nova linha obrigatoria no registro.
- Executado (dist/ removido depois): typecheck OK; lint OK; test 9 arquivos / 70 testes OK; build OK (JS 634,41 kB, gzip 165,6 kB).

## Veredito do delta
- **Conformidade: APROVADO** (sem finding pendente de conformidade no delta; pendencias herdadas REV-002 fora do escopo).
- **Tecnica: COM RESSALVAS** (1 finding baixo, REV-011; 2 observacoes sem bloqueio).
Sem regressao encontrada. Aceite humano e separado.

## Findings do delta

### REV-011 - Baixo - Tecnica - DraftKeeper perde o rascunho original em falas consecutivas
- Local: src/ui/draft.ts:replace (linha com this.previous = ...), uso em src/ui/ui.ts:setInputText.
- Rationale: replace sempre sobrescreve previous com o valor atual do campo. Fluxo: usuario digita D; fala 1 coloca S1 (previous = D, correto); fala 2 coloca S2 e previous passa a S1: o desfazer restaura S1 (texto falado), nao D, embora o botao diga Restaurar o texto digitado antes (README e rotulo prometem o texto digitado). Alem disso, se o novo texto for igual ao do campo, previous vira null e o desfazer de D e perdido. Os 3 testes de draft.test.ts nao cobrem substituicoes encadeadas. Impacto baixo (so memoria, nada vaza), mas o rotulo e a promessa do README ficam imprecisos.
- Resolucao esperada: manter o rascunho DIGITADO apenas (nao sobrescrever previous quando o campo atual veio de fala, por exemplo guardando um flag ou so substituindo previous se o campo foi editado pelo usuario) e acrescentar teste de duas substituicoes seguidas; ou ajustar rotulo e README para dizer texto anterior.

## Observacoes sem bloqueio
- OBS-A (contrato Translation): omittedWords e incomplete estao coerentes. incomplete agora inclui palavras omitidas; describeTranslation lista ate 10 palavras; testes em translation.test.ts (glossWithOmitted informa o descartado) e messages.test.ts (marca como incompleta com aviso; vocabulario sem palavras de ligacao permanece completo) cobrem. Efeito de produto declarado no README: frases comuns como o banheiro passam a gerar aviso ATENCAO mesmo com sinal exibido; e uma decisao conservadora e honesta, com risco de fadiga de alerta a reavaliar com usuarios. Nao e defeito.
- OBS-B (compatibilidade): gloss() permanece exportado como wrapper fino de glossWithOmitted(...).items; os testes antigos que usam gloss() continuam passando sem alteracao de assercoes. Sem duplicacao de logica (reuso correto). Menor: comentario do glosser.ts tem digitacao repetida (o resultado e e um prototipo).
- OBS-C (consistencia de exibicao): em translate(), quando ha mais de 120 sinais, glosses continua listando todas as glosses enquanto signs e cortado a 120; a mensagem de truncamento aparece, e a exibicao e limitada a 40 glosses, entao o impacto e pequeno. Mencionar na documentacao ou cortar glosses ao truncar seria mais coerente.

## Avaliacao por criterio
- Reuso/simplicidade: DraftKeeper e classe pequena e pura, separada da UI (testavel sem DOM); formatGlosses e statusOnListening sao funcoes puras reaproveitadas por ui.ts; MIC_CONSENT_TEXT continua fonte unica. Nenhuma dependencia nova.
- Idempotencia: undo e descarte sao seguros se repetidos (undo duas vezes retorna null); stop e retry podem ser clicados varias vezes (startLoad reinicia o estado; Parar chama animator.start de repouso, sem acumulo). Retry do carregamento nao verificado em navegador.
- Tolerancia a falhas: Parar fica habilitado so com avatar pronto; sem WebGL nao ha botao de retry; botoes de traducao e microfone ficam desabilitados ate o avatar carregar (say tambem recusa sem animador, defesa em dupla camada); erro de carga em role alert com aviso para nao usar o aplicativo para comunicacao.
- Verificabilidade: +8 testes (62 para 70) nas regras novas; as partes de DOM de ui.ts (skip link, painel recolhivel, aria-label dinamico, botoes flutuantes) nao tem teste automatizado nem verificacao em navegador (limite do ambiente, ja declarado).
- Tipagem: sem any nem assercoes novas notaveis; el() valida o tipo do elemento em tempo de execucao; StatusLevel union usado de ponta a ponta; typecheck e lint (type-checked) limpos.
- Acessibilidade/privacidade (leitura): skip link reabre o painel e foca o campo (href aponta para text-input, rotulo coerente); aria-label do avatar acompanha as glosas; status unico aria-live; privacidade: nenhum novo canal de dados, texto continua so em memoria e via textContent.
- Honestidade do README: a secao Decisoes de UX/privacidade descreve com precisao o que o codigo faz (traducao automatica da fala mantida de proposito com mitigacoes, desfazer so em memoria, aviso de palavras omitidas) e registra a alternativa descartada. Ressalva unica: a promessa de restaurar o texto digitado e valida so para uma substituicao (REV-011). O README nao afirma validacao em navegador.

## Limites
Sem navegador: layout, foco, leitor de tela, dialog e Web Speech nao verificados. Revisao restrita ao delta; IDs PRIV/QA citados vem dos outros gates e nao foram reavaliados por mim.
