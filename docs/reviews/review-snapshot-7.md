# Revisao do delta snapshot-6 para snapshot-7 - conformidade + tecnica

- Revisor: instancia reviewer (Sonnet 5.5, tier standard); nao e autora de codigo. Escopo: delta.
- Snapshot: snapshot-7.sha256 e snapshot-7.vrm.sha256 - sha256sum -c sem divergencias (VRM identico).
- Instalacoes: pnpm-lock.yaml, pnpm-workspace.yaml e .npmrc com hashes identicos ao snapshot-6; package.json mudou so no script build (acrescentou node scripts/build-notice.mjs, sem dependencia nova). Nada instalado.
- Executado (dist/ removido): pnpm run typecheck OK; lint OK; test 11 arquivos / 94 testes OK; build OK (JS 778,03 kB, gzip 195,7 kB) e o aviso pos-build aparece.

## Veredito do delta
- **Conformidade: APROVADO** (REV-002 dos 8 pacotes antigos continua pendente do usuario, fora do delta; nao reaberto).
- **Tecnica: APROVADO** (REV-004 continua PARCIAL, fora do delta; so 2 observacoes sem bloqueio).
Aceite humano separado.

## REV-013 - FECHADO
O registro agora diz que o Seed-san foi copiado para public/models na migracao (sem o Ainda NAO copiado) e a remocao reflete isso. Ha uma linha Decisao do usuario (troca de modelo), 2026-10-30: requisito original era o boneco de modelo/, motivos (FBX 6.1 recusado, licenca nao resolvida PRIV-005), escolha de VRM + three-vrm, comando inicie, Seed-san substitui o boneco no app, modelo/ e legacy/ preservados. Sem contradicao remanescente nas secoes verificadas. Limite: o texto da decisao e do autor; nao ha como eu confirmar a mensagem do usuario, apenas que esta registrada.

## Avaliacao do delta
- prepareAvatar (separacao): modulo proprio e pequeno; monta PoseAnimator e ExpressionAnimator ANTES de o modelo entrar na cena, com interface minima AvatarSource (testavel sem WebGL). Em main.ts, se prepareAvatar lanca, o VRM e descartado (disposeVrm) e o erro propaga ao catch; so depois v.add, vrmModel, animator e face sao atribuidos. Isso e idempotente para o Tentar novamente (sem modelo duplicado, sem estado parcial) e tolerante a falhas.
- Erros tipados: NoSkeletonError substitui a checagem inline e e mapeada a mensagem propria no catch; erros inesperados caem na mensagem generica. Os 3 testes cobrem montagem com ausentes, ausencia de esqueleto e falha ao percorrer a cena.
- Clamp de nao finitos: clamp01 com fallback em faceTargets e update ignorando nowMs nao finito (sem alterar lastMs), com testes para NaN, Infinity e -Infinity e recuperacao posterior. Correto e proporcional.
- scripts/build-notice.mjs: pequeno, sem dependencia, so avisa (nao falha o build) que dist/ contem o .vrm e que publicar e redistribuir; usa apenas node:fs e le o diretorio de forma somente leitura. Ignorar scripts/ no lint e uma excecao ACEITAVEL aqui: um unico arquivo .mjs de 12 linhas, fora de src, e o lint tipado esta configurado so para **/*.ts; custo de incluir seria configurar globals de Node sem ganho proporcional. Ressalva: fica sem teste e sem lint; se crescer, incluir no lint (com globals node) ou mover a logica para um modulo testado. Registrar a excecao (comentario no eslint.config.js ou README) seria bom: o globalIgnores nao tem comentario.
- Simplicidade e honestidade: README e lacunas atualizados com o aviso de redistribuicao; o aviso do build repete a pendencia de decisao sem afirmar nada nao verificado. Nenhuma dependencia nova. Privacidade: nenhum novo canal de dados.

## Observacoes sem bloqueio
- OBS-1: scripts/build-notice.mjs sem teste e fora do lint (ver acima); sugestao de uma linha de comentario justificando o globalIgnores de scripts.
- OBS-2: a falha do prepareAvatar apos disposeVrm depende de o catch exibir o erro; o caminho foi coberto por testes unitarios e por leitura, nao exercitado em navegador (limite do ambiente).

## Limites
Sem navegador real. Revisao restrita ao delta; REV-002 e REV-004 nao reavaliados.
