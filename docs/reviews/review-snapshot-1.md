# Revisao snapshot-1 (conformidade + tecnica)

- Revisor: instancia reviewer (Sonnet 5.5, tier standard), independente do autor (nao escreveu nem corrigiu codigo).
- Snapshot: docs/reviews/snapshot-1.sha256. sha256sum -c: todos os arquivos conferem (0 divergencias).
- Base de comparacao: nenhuma (projeto nao e repositorio git; snapshot por hash). Limite: sem commit para ancorar a evidencia (policies/evidence.md).
- Executado (nada instalado, dist/ removido depois): typecheck OK; lint OK; test 3 arquivos / 22 testes OK; build OK (JS 627,57 kB, gzip 163 kB; CSS 3,43 kB); npm audit --offline 0 vulnerabilidades (so cache local, ver limites).
- Bloqueio conhecido (FBX 6100 nao carrega no FBXLoader; decisao do usuario pendente) NAO e finding novo; a cadeia ossos/animacao nunca foi exercitada com o modelo real (afeta REV-004).

## Veredito
- **Conformidade: COM RESSALVAS**
- **Tecnica: COM RESSALVAS**

Nenhum finding bloqueante/alto. O criterio "avatar anima o boneco de modelo/" NAO esta atendido em runtime (bloqueio conhecido). Aceite humano e separado.

## Verificacoes de conformidade (resumo)
- Instalacoes: package.json tem exatamente os 8 pacotes aprovados, versoes fixas, batendo com o registro (vite 8.3.4, typescript 6.0.3, three 0.186.1, @types/three 0.186.0, vitest 5.0.5, eslint 10.12.0, typescript-eslint 8.71.2, @eslint/js 10.0.1). .npmrc = save-exact=true + ignore-scripts=true, como registrado. Lock: todos os resolved em registry.npmjs.org; unico hasInstallScript e fsevents (macOS, opcional, nao instalado aqui). node_modules/.package-lock.json = 135 pacotes (igual ao registro); 120 MB (igual).
- typescript 6.0.3 satisfaz o peer de typescript-eslint 8.71.2 (>=4.8.4 <6.1.0), confirmando a justificativa do registro.
- Legados: legacy/ (app.js, dictionary.js, index.html) e modelo/ (character.fbx, main.html) preservados. public/models/character.fbx e copia byte a byte de modelo/character.fbx (cmp igual). Limite: sem baseline nao provo que nenhum original sumiu.
- Privacidade: nenhum console, fetch, localStorage, innerHTML ou eval em src/ (fora de testes); no-console como error; UI usa textContent; texto de privacidade do index.html coerente com o codigo.

## Findings

### REV-001 - Medio - Conformidade - .gitignore exclui registro de instalacoes, reviews e modelo
- Local: .gitignore (linhas operations/, reviews/, models/).
- Rationale: padroes sem barra inicial casam em qualquer nivel: docs/operations/ (registro obrigatorio, policies/installations.md), docs/reviews/ (evidencia dos gates) e public/models/ (asset do avatar) ficariam fora do versionamento se o repositorio for inicializado. Registro e evidencia perdidos silenciosamente. Se a exclusao do modelo e intencional (licenca, ver lacunas-conhecidas.md), nao esta documentada.
- Resolucao esperada: escopar/remover os padroes ou documentar a decisao e como registro/evidencia sao preservados; decidir explicitamente o versionamento do modelo.

### REV-002 - Medio - Conformidade - Registro sem a evidencia dos criterios de selecao
- Local: docs/operations/registro-instalacoes.md.
- Rationale: policies/installations.md exige evidencia de Necessidade, Procedencia (repositorio publico), Adocao (numeros e data) e Revisao de seguranca (manifesto/scripts lidos; proposta revisada de forma independente). O registro traz data de publicacao, aprovador e verificacao, mas nao adocao, repositorio de origem, nem revisao de seguranca; os cerca de 127 transitivos so aparecem como contagem. As defesas existentes (ignore-scripts, audit=0, versoes com mais de 2 semanas) sao boas mas parciais. Datas de publicacao nao reconferidas offline.
- Resolucao esperada: acrescentar por pacote procedencia/adocao/revisao de seguranca (ou dispensa explicita do usuario, registrada).

### REV-003 - Baixo - Conformidade - Contagens do registro vs lockfile
- Local: registro (135 pacotes; nenhum pacote opcional/extra); package-lock.json (160 entradas).
- Rationale: o lock lista 160 pacotes (inclui binarios opcionais de outras plataformas, ex. fsevents); 135 instalados neste host. A frase "nenhum opcional" e imprecisa. Sem impacto de seguranca observado.
- Resolucao esperada: esclarecer no registro.

### REV-004 - Medio - Tecnica - Suposicao de eixos locais Mixamo nao verificada
- Local: src/signs/poseHelpers.ts:3-16, src/avatar/poseMath.ts (applyOffset), src/avatar/poseAnimator.ts.
- Rationale: a matematica (quaternion = bind * offset no referencial local, slerp a partir da pose atual, caminho mais curto do slerp) e coerente e relativa a bind pose, sem acumulo. Porem toda a tabela de sinais depende de que os eixos locais estejam alinhados ao mundo no repouso (Z abaixa o braco, Y dobra o cotovelo, Z fecha dedos, espelho Left/Right so por sinal). Em esqueletos Mixamo os eixos locais costumam seguir a orientacao do osso (Y ao longo do osso; lados espelhados por rotacao), entao a premissa pode falhar para varios ossos (pose torta). O texto admite que nao foi validada visualmente (honesto), mas e o risco central do requisito bracos/maos/cabeca/tronco e nao ha teste com bind nao-identidade nem leitura do esqueleto real. Isto e inferencia: nao pude inspecionar o esqueleto carregado.
- Resolucao esperada: ao destravar o modelo, validar (visual e numericamente) e ajustar, possivelmente aplicando offsets em espaco de mundo ou do pai convertidos para local; teste unitario com bind rotacionado provando a convencao; manter o aviso ate la.

### REV-005 - Baixo - Tecnica - Liberacao de recursos three e ciclo de vida
- Local: src/main.ts (pagehide chama viewer.dispose), src/avatar/viewer.ts (dispose), src/avatar/loadAvatar.ts (disposeObject).
- Rationale: (a) pagehide tambem dispara ao entrar no bfcache; ao voltar (pageshow persisted) viewer e recognizer ficam descartados e o app morto. (b) Viewer.dispose nao libera o modelo adicionado nem usa forceContextLoss; disposeObject nao e chamado no caminho de sucesso. (c) disposeObject nao chama skeleton.dispose() (boneTexture de SkinnedMesh). Impacto baixo em pagina de vida unica.
- Resolucao esperada: tratar pageshow persisted (reinicializar) ou nao descartar em bfcache; fazer Viewer.dispose percorrer a cena com disposeObject e liberar skeleton.

### REV-006 - Baixo - Tecnica/Seguranca - setURLModifier devolve string vazia para URL bloqueada
- Local: src/avatar/loadAvatar.ts:21-30.
- Rationale: o comentario diz que URLs externas sao bloqueadas. Retornar vazio faz o loader requisitar o proprio documento em vez de falhar (pode tentar parsear HTML como textura). Nao ha exfiltracao: o CSP (connect-src e img-src com self) e a barreira efetiva, em defesa em profundidade correta.
- Resolucao esperada: rejeitar de forma explicita ou ajustar o comentario para dizer que o CSP e a barreira real; teste simples da funcao extraida.

### REV-007 - Baixo - Tecnica - CSP apenas por meta e limites nao declarados
- Local: vite.config.ts, index.html.
- Rationale: a politica de build e estrita (confirmado em dist/index.html: sem inline/eval, default-src none); a de dev so relaxa style-src com unsafe-inline e WebSocket local, como documentado. Nao declarado: frame-ancestors, report e sandbox nao funcionam via meta (clickjacking nao coberto); Permissions-Policy (microphone) e cabecalhos dependem do host, sem doc de deploy. chunkSizeWarningLimit 700 sobe o limite de aviso (bundle de 627 kB passa sem alerta).
- Resolucao esperada: documentar os cabecalhos HTTP exigidos no host (CSP com frame-ancestors, Permissions-Policy, Referrer-Policy); justificar ou reverter o limite de chunk.

### REV-008 - Baixo - Verificabilidade - Cobertura nas partes de risco
- Local: sem testes para poseAnimator.ts, boneMap.ts, loadAvatar.ts, recognizer.ts.
- Rationale: os 22 testes cobrem trilhas, fila e traducao (logica pura). Sem prova: resolucao de nomes mixamorig: e mixamorig com stubs, captura de bind e start() interrompido, falha de carga, clique duplo do microfone, describeSpeechError. Sao os caminhos de tolerancia a falhas dos principios.
- Resolucao esperada: testes unitarios com stubs (BoneLike, FindableRoot, construtor falso de reconhecimento), sem novas dependencias.

### REV-009 - Baixo - Tecnica - Keyframes finais vazios e ordem nao validada
- Local: src/signs/dictionary.ts (keyframe time 1 com pose vazia em LETRA_L/Y/A); src/avatar/poseMath.ts.
- Rationale: pose vazia em t=1 nao faz nada; ossos citados mantem o ultimo valor ate o proximo sinal/repouso (documentado em buildTracks, mas o dicionario sugere retorno ao repouso). sampleTrack assume tempos crescentes; nada valida keyframes fora de ordem ou fora de 0 a 1.
- Resolucao esperada: remover as keyframes vazias ou usar REST_POSE; validar dicionario em teste (ordem, faixa, ossos conhecidos).

### REV-010 - Baixo - Reuso - Duas copias do modelo sem fonte unica documentada
- Local: modelo/character.fbx e public/models/character.fbx (6,4 MB, identicos).
- Rationale: principio de fonte unica; nada diz qual e a origem nem como a copia e produzida (idempotente). Divergencia provavel apos re-exportar para FBX 7.4 ou GLB.
- Resolucao esperada: documentar modelo/ como origem e public/models/ como copia servida (ou nota/script de copia), apos resolver o bloqueio.

## Observacoes sem finding
- tsconfig: strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes, verbatimModuleSyntax, noUnused; typecheck limpo. ESLint recommendedTypeChecked com projectService, coerente com TS 6.0.3. @types/three 0.186.0 vs three 0.186.1 e aceitavel.
- Modulos pequenos e logica pura testavel; sem abstracao especulativa; filas limitadas (200, 120 sinais, 500 chars); SpeechRecognizer.start idempotente; erros com mensagens fixas.
- Docs e comentarios (lacunas-conhecidas.md, avisos do dicionario e do poseHelpers) declaram o que nao foi validado (visual, Web Speech, boca/visemas, licenca do modelo); nenhuma afirmacao de resultado nao verificado encontrada, salvo a palavra bloqueada em REV-006.

## Limites
Sem navegador/WebGL: nada de runtime (CSP efetiva, Web Speech, animacao real) foi verificado. Datas de publicacao e adocao dos pacotes nao verificadas (offline). npm audit --offline depende de cache. Escopo: arquivos do snapshot; .claude/ e .engineering/ fora.
