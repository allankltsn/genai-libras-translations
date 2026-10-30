# Revalidacao snapshot-2 (conformidade + tecnica)

- Revisor: instancia reviewer (Sonnet 5.5, tier standard); nao e autora de codigo. Revalidacao independente por IDs.
- Snapshot: docs/reviews/snapshot-2.sha256 - sha256sum -c sem divergencias. Delta vs snapshot-1: README.md, docs/operations/dependencias-instaladas.md, src/avatar/boneMap.test.ts, src/avatar/urlPolicy.ts e .test.ts, src/speech/consent.ts e .test.ts, src/speech/recognizer.test.ts, src/ui/messages.ts e .test.ts (mais alteracoes em arquivos existentes).
- Executado (nada instalado, dist/ removido): typecheck OK; lint OK; test 8 arquivos / 62 testes OK; build OK (JS 632,94 kB, gzip 165 kB).

## Veredito
- **Conformidade: COM RESSALVAS** (unica pendencia: REV-002, decisao do usuario sobre adocao nao verificada).
- **Tecnica: COM RESSALVAS** (unica pendencia: REV-004, validacao dos eixos Mixamo depende do modelo carregavel, bloqueio conhecido).

Nenhuma regressao encontrada. Nenhum finding novo. Aceite humano separado.

## Tabela de disposicao
| ID | Estado | Evidencia propria |
|---|---|---|
| REV-001 | RETIRADO (erro do revisor) | Ver secao abaixo. |
| REV-002 | PARCIAL (decisao do usuario) | Ver secao abaixo. |
| REV-003 | FECHADO | O registro e dependencias-instaladas.md explicam 160 no lock vs 135 instalados (25 opcionais de outras plataformas); a frase imprecisa foi corrigida. Contagem 135 confirmada por mim na rodada 1. |
| REV-004 | PARCIAL | Ver secao abaixo. |
| REV-005 | FECHADO (por leitura) | main.ts: pagehide so chama viewer.dispose se nao ev.persisted (recognizer sempre encerrado). Viewer.dispose agora e dono dos objetos (lista owned), chama disposeObject e renderer.forceContextLoss. disposeObject chama skeleton.dispose() em SkinnedMesh. Nao verificado em navegador. |
| REV-006 | FECHADO | urlPolicy.ts: filterUrl devolve BLOCKED_URL = data: (sem trafego); o comentario diz que a CSP e a barreira real; loadAvatar usa filterUrl; urlPolicy.test.ts cobre mesma origem, relativas, data, blob e bloqueio de origem externa e esquemas estranhos. |
| REV-007 | FECHADO | README.md documenta que a CSP por meta nao cobre frame-ancestors e exige no host CSP com frame-ancestors none, Permissions-Policy microphone=(self), nosniff e Referrer-Policy. vite.config.ts mantem chunkSizeWarningLimit 700, agora com justificativa explicita (bundle unico de cerca de 630 kB, pagina unica). |
| REV-008 | FECHADO | Novos testes: boneMap.test.ts, recognizer.test.ts (pt-BR, start idempotente, sem API, resultado final, so-parcial, timeout apos stop, erro com mensagem fixa, dispose), consent.test.ts, urlPolicy.test.ts, PoseAnimator em poseMath.test.ts (bind capturado, start interrompido sem salto, no-op). Residuo menor, sem finding: loadAvatar e disposeObject em si sem teste (dependem de WebGL e FBX). |
| REV-009 | FECHADO | dictionary.ts nao tem mais keyframe com pose vazia (confirmado por leitura); poseMath.test.ts valida tempos crescentes em 0 a 1, duracao positiva, ausencia de keyframes vazias e que todo osso citado existe e esta no REST_POSE; passam. |
| REV-010 | FECHADO | README.md secao Modelo 3D: origem modelo/character.fbx, copia servida public/models/character.fbx, comando de copia idempotente, licenca pendente. |

## REV-001 - retirado, erro do revisor
Reconfirmei: o .gitignore tem exatamente 3 linhas (node_modules, dist, *.log) e o hash 17f0180c... e igual nos dois snapshots. As linhas operations/, reviews/ e models/ que citei NAO vieram do .gitignore: vieram da saida concatenada de comandos ls (docs/ lista operations/ e reviews/; public/ lista models/) que li como continuacao do cat do .gitignore. O achado era falso; o autor tem razao e o finding e retirado. A secao Versionamento do README descreve o estado real.

## REV-002 - registro reescrito (PARCIAL; precisa decisao do usuario)
Contra policies/installations.md:
- Criterio 1 (necessidade): coberto por pacote. Criterio 2 (procedencia): repositorio publico, licenca, publicador e atestado SLSA por pacote; o autor declara com honestidade que o atestado falta nos demais e que npm audit signatures nao foi executado. Criterio 6 (reversibilidade) e escopo (5): cobertos; .npmrc fixa registry e engine-strict. Transitivos: lista completa com versao, licenca e flag de script de instalacao em dependencias-instaladas.md (135 itens), o que resolve a parte "so contagem" do meu achado.
- Criterio 3 (adocao): declarada NAO VERIFICADA, sem numero nem data. A policy exige numero e data. A declaracao e honesta e nao inventa dado, mas nao cumpre o criterio: basta como transparencia, nao como conformidade. Somente o usuario pode dispensar o criterio para estes 8 (ferramentas padrao dos ecossistemas, que ele autorizou de forma expressa) ou pedir a consulta dos numeros. Recomendacao: o usuario registrar a dispensa (uma linha no registro) ou autorizar a consulta. Ate la, PARCIAL.
- Criterio 4 (revisao de seguranca): a instalacao ocorreu antes da revisao independente da proposta (desvio de ordem declarado). Nao e reparavel retroativamente; as mitigacoes existentes sao reais (ignore-scripts, lock so com registry npm, nenhum script de instalacao, audit com 0 vulnerabilidades, revisao independente posterior em security-snapshot-1.md). O limite declarado (codigo transitivo nao lido) e correto. Recomendacao: o usuario reconhecer o desvio de forma explicita e o fluxo proposta, revisao, aprovacao, instalacao ser seguido nas proximas.
- Nao reconferi offline as datas de publicacao nem os atestados SLSA; dependo da declaracao do autor.

## REV-004 - 3 testes com bind rotacionado (PARCIAL)
Os tres testes (poseMath.test.ts, bloco REV-004) estao corretos e provam a convencao matematica: (1) com bind de 90 graus em Y, offset em Z local preserva a imagem do eixo Z local no mundo e os outros eixos giram; (2) o resultado difere do quaternion absoluto do offset (guarda contra ignorar o bind); (3) o animador com binds nao-identidade termina em bind*offset e retorna ao bind. Junto dos testes de PoseAnimator, a parte matematica relativa a bind pose esta FECHADA.
Permanece ABERTA a premissa de que os eixos locais do esqueleto Mixamo coincidem com o mundo no repouso (poseHelpers.ts): testes sinteticos nao a verificam e o modelo nao carrega (bloqueio conhecido). O aviso continua no topo de poseHelpers.ts, honesto. Condicao de fechamento: modelo carregavel e validacao visual ou numerica das orientacoes dos ossos. Nao e defeito do autor; depende da decisao do usuario sobre o modelo.

## Regressoes e principios de qualidade (novos modulos)
- consent.ts: ConsentGate idempotente (pergunta compartilhada, limpa no finally), falha ao perguntar conta como recusa, nada persistido; 4 testes. Dialog em ui.ts: Esc ou fechamento sem aceite resolve false (fail-safe); listeners removidos no close. Microfone so liga apos Entendi.
- messages.ts: funcoes puras testadas; MIC_CONSENT_TEXT e fonte unica usada no painel e no dialog (reuso). As mensagens agora avisam quando a mensagem NAO foi transmitida por inteiro (letras ignoradas, truncamentos), melhor honestidade. say() sem avatar recusa em vez de enfileirar em silencio; a fila nao e consumida sem animador (nao perde sinais).
- urlPolicy.ts: pequeno, puro e testado; remove a ambiguidade do REV-006.
- recognizer: timeout apos stop() e onIncomplete testados; start continua idempotente.
- Simplicidade: nenhuma dependencia nova; .npmrc ganhou registry e engine-strict, coerente com engines. O texto de privacidade afirma o que o codigo faz e declara o que o app nao controla.
- Observacoes sem finding: dialog, consentimento, bfcache e Web Speech nao foram exercitados em navegador. A afirmacao do README de que a letra A isolada nao e acionavel nao foi reverificada por mim.

## Limites
Sem navegador ou WebGL: nada de runtime verificado. Datas de publicacao, SLSA e adocao nao verificadas por mim (offline). Escopo: arquivos do snapshot-2.
