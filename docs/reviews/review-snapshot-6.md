# Revisao do delta snapshot-5 para snapshot-6 (migracao VRM) - conformidade + tecnica

- Revisor: instancia reviewer (Sonnet 5.5, tier standard); nao e autora de codigo. Escopo: delta da migracao VRM.
- Snapshot: docs/reviews/snapshot-6.sha256 e snapshot-6.vrm.sha256 - sha256sum -c sem divergencias (Seed-san.vrm = 624d0d55..., igual ao registrado).
- Executado (nada instalado; dist/ removido): pnpm run typecheck OK; lint OK; test 10 arquivos / 89 testes OK; build OK (JS 777,68 kB, gzip 195,6 kB).
- Instalacoes: package.json, pnpm-lock.yaml, pnpm-workspace.yaml e .npmrc com hashes IDENTICOS ao snapshot-5. Nada instalado.

## Veredito do delta
- **Conformidade: COM RESSALVAS** (REV-002 dos 8 pacotes antigos segue pendente do usuario; 1 finding baixo novo, REV-013).
- **Tecnica: APROVADO** (REV-004 segue PARCIAL por depender de mais verificacao visual; nao bloqueia o delta).
Aceite humano separado.

## Disposicao de itens herdados
| ID | Estado | Evidencia |
|---|---|---|
| REV-002 (8 pacotes antigos) | PARCIAL, inalterado | O registro nao ganhou numeros de adocao nem dispensa para eles; decisao do usuario pendente. three-vrm segue fechado (review-snapshot-5). |
| REV-004 (eixos) | PARCIAL, com melhora | Ver abaixo. |
| REV-012 (origem do pnpm) | Fora do delta, nao reavaliado | Nada mudou sobre o assunto. |

## REV-004 - fecha parcialmente?
Sim, evolucao real, mas continua PARCIAL. A premissa deixou de ser so teorica: os ossos agora sao os NORMALIZADOS do three-vrm (repouso = identidade, eixos alinhados ao mundo por construcao da biblioteca), o que torna a convencao bind*offset de poseHelpers.ts adequada. Houve tambem observacao em Chrome headless de 5 sinais (Oi, Letra L, Agua, Duvida, Negacao), um instante cada, com resultados plausiveis (braco direito levanta, indicador estendido, cabeca vira, sobrancelha franzida). Isso sustenta o lado DIREITO, o cotovelo, a cabeca e o indicador naquele instante. Continua nao observado: lado esquerdo (espelhamento so por sinal), polegar (declarado incerto), tronco, punho, interpenetracao mao/corpo, trajetoria ao longo do tempo e os demais sinais. O arquivo lacunas-conhecidas.md lista exatamente isso. Condicao de fechamento: inspecao de todos os sinais, ambos os lados e polegar, com varios quadros por sinal, de preferencia em navegador real com GPU. Limite meu: as capturas foram descartadas e nao as reexaminei.

## Findings
### REV-013 - Baixo - Conformidade - Registro de instalacoes com texto desatualizado e decisao de troca de modelo nao registrada
- Local: docs/operations/registro-instalacoes.md, secao Download do modelo VRM Seed-san (frase Ainda NAO copiado para o projeto e a linha de Remocao condicional).
- Rationale: a secao Migracao para VRM do mesmo arquivo registra que o .vrm FOI copiado para public/models (hash conferido); os dois trechos se contradizem no registro oficial. Alem disso, o requisito original era usar o boneco de modelo/; a troca para Seed-san aparece como autorizacao de download, mas nao achei no registro nem no README uma linha explicita da decisao do usuario de trocar de modelo (motivo: FBX 6.1 nao carregavel e licenca nao resolvida).
- Resolucao esperada: atualizar a secao Download (copiado em data X) e registrar a decisao de troca de modelo aprovada pelo usuario.

## Conformidade - verificacoes
- Registro: cobre a copia do VRM (hash, tamanho, remocao, aviso de que o build copia o .vrm para dist/), o Chrome ja existente em headless com perfil temporario falando so com localhost:4173, o Python 3.13 com -I somente leitura, o WebSocket do Node, a tentativa descartada do Edge e os temporarios. Adequado; sem instalacao nova. Nao verifiquei a remocao dos temporarios (fora do repositorio).
- Legados preservados: legacy/character.fbx (movido, nao apagado), modelo/character.fbx e main.html mantidos, lock npm obsoleto em legacy/, com LEIA-ME.
- .gitignore: node_modules, dist, *.log e public/models/*.vrm (com comentario); coerente com README, licencas.md e lacunas. Ressalva de aviso: o build copia o .vrm para dist/ (avisado no registro); nao publicar dist/ sem decisao.
- Licenca e credito: docs/licencas.md e rodape #credits com autor, licenca, link, sem endosso e sem modificacao; LEGAL-REVIEW de Avatar Use x Model Use mantido pendente para o usuario. Honesto.
- Honestidade de README e lacunas: separam o VISTO (carga sob a CSP, 5 sinais, blob: medido) do NAO VERIFICADO (demais sinais, polegar, sobrancelha levantada, emocoes e visemas em movimento, navegador real, FPS, leitor de tela, Web Speech). Visemas descritos como estimativa por vogais, nao lip-sync. Nenhuma afirmacao nao sustentada encontrada. Rotulagem menor: o README ainda tem a secao da rodada 2.
- Principios: reuso (normalizeText nos visemas, filterUrl no loader, PoseAnimator mantido); simplicidade (sem dependencia nova, expressionAnimator puro); idempotencia (copia com hash conferivel, load repetivel); tolerancia a falhas (modelo ausente gera erro com retry e controles desabilitados; ossos e morphs ausentes degradam com aviso); verificabilidade (89 testes, +10; evidencia de runtime parcial e declarada).

## Tecnica - verificacoes
- Ossos normalizados e vrm.update: resolveBones usa humanoid.getNormalizedBoneNode (null para ausentes, como upperChest); PoseAnimator escreve nos nos normalizados; main chama vrm.update(delta) por frame (delta limitado a 0,1 s, 0 no primeiro), fora da condicao de animator. Correto segundo a API do three-vrm.
- Eixos: poseHelpers.ts documenta bind*offset, frente +Z, esquerda em +X, valores derivados da geometria, e marca o que nao foi visto. Coerente com VRM 1.0 normalizado.
- Carga e seguranca: createVrmLoader reaplica filterUrl via LoadingManager e registra VRMLoaderPlugin; checa instanceof VRM; rotateVRM0 so para metaVersion 0; erros mapeados a AvatarLoadError com mensagem fixa. CSP: unica mudanca e blob: em connect-src, com motivo medido e documentado; data: e terceiros seguem proibidos.
- Recursos: Viewer.add recebe a funcao de dispose por objeto; VRM liberado com VRMUtils.deepDispose; renderer.dispose mais forceContextLoss; pagehide respeita bfcache; o caminho de erro com zero ossos libera o VRM.
- expressionAnimator: logica pura (visemesFromText limitado a 200, visemeAt, BlinkState com rng injetavel, approach exponencial independente de FPS, faceTargets) separada da aplicacao (interfaces ExpressionManagerLike e MorphMeshLike); findBrowTargets valida dicionario e indice e degrada sem erro, com aviso na UI; troca de emocao sai suave antes de entrar. Testes cobrem vogais, janela, piscar, convergencia, sobrancelhas, ausentes e boca. Tempo: dt=0 no primeiro quadro; nada persistido.
- Bundle 777,7 kB (gzip 195,6) abaixo do limite 900, elevado com justificativa no vite.config.ts. Tipagem: typecheck e lint limpos; sem any novo.

## Observacoes sem bloqueio
- OBS-1: o plano de visemas comeca em performance.now() no say(), mas o primeiro sinal so inicia no proximo tick e a duracao e a soma dos sinais; descompasso de ate um quadro. Aproximacao ja declarada.
- OBS-2: sem teste de loadAvatar e createVrmLoader (dependem de WebGL e do arquivo) nem teste que leia o VRM; declarado em lacunas. A fiacao de main.ts so tem verificacao manual.
- OBS-3: piscar e visemas so rodam com o animador existente (face.update dentro do if); coerente.
- OBS-4: sobrancelhas sao escritas direto nos morph targets (nao via expressionManager); funciona no Seed-san visto, outros VRMs podem nao ter esses nomes (degrada com aviso).

## Limites
Sem navegador real: nao verifiquei capturas (descartadas), FPS, layout, foco, leitor de tela, Web Speech nem os temporarios do scratchpad. Revisao restrita ao delta.
