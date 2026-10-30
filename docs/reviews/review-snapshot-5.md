# Revisao do delta snapshot-4 para snapshot-5 (conformidade + tecnica)

- Revisor: instancia reviewer (Sonnet 5.5, tier standard); nao e autora de codigo. Escopo: delta (package.json, pnpm-lock.yaml, pnpm-workspace.yaml, README.md, registro-instalacoes.md, dependencias-instaladas.md, lock npm movido). src/ declarado inalterado.
- Snapshot: docs/reviews/snapshot-5.sha256 - sha256sum -c sem divergencias.
- Executado (nada instalado; dist/ removido): pnpm run typecheck OK; lint OK; test 9 arquivos / 79 testes OK; build OK; pnpm install --frozen-lockfile --offline: lockfile atualizado, sem alteracao (idempotente).

## Veredito do delta
- **Conformidade: COM RESSALVAS** (apenas pendencias que dependem do usuario, abaixo; sem finding novo bloqueante).
- **Tecnica: APROVADO**.
Aceite humano separado. REV-004 permanece pendente do modelo (nao reaberto).

## REV-002 - disposicao
- **three-vrm (@pixiv/three-vrm 3.5.5 + 13 transitivos): FECHADO.** Contra policies/installations.md: necessidade (decisao do usuario, dedos humanoides/expressoes que o FBX nao atende); procedencia (org pixiv, repo confere com repository.url, MIT); adocao COM numero e data (168.945 downloads semanais em 23-29/10/2026, 2.247 estrelas, push 2026-10-22, release 2026-07-09; sao dados da proposta, nao reconferidos por mim offline); revisao de seguranca INDEPENDENTE E ANTERIOR a instalacao (security-proposta-three-vrm.md, aprovar com condicoes; tarballs lidos, 0 lifecycle scripts, sem rede/eval/storage); aprovacao explicita do usuario; escopo projeto, devDependency, versao exata, --ignore-scripts; reversibilidade (pnpm remove + passos de verificacao); verificacao (+14 entradas no lock, todas @pixiv, 174/174 com integrity, 0 requiresBuild, audit sem vulnerabilidades, gates passam). Limites honestos declarados: assinatura SLSA so vista, nao verificada. Lock coerente: 174 entradas com integrity, sem requiresBuild/tarball/git (conferido por grep). Condicoes 3, 4, 6 e 7 da proposta ficam para a migracao do avatar (nao ha import em src/ ainda); devem ser conferidas quando o pacote for usado.
- **8 pacotes antigos: PARCIAL (mantido).** Adocao continua sem numero e o desvio de ordem na revisao de seguranca permanece; depende de decisao do usuario (dispensar ou autorizar consulta), como em review-snapshot-2.

## pnpm
- Registro retroativo adequado e honesto: o pnpm 12.11.2 e global na maquina, nao instalado por esta tarefa; uso anterior ao registro reconhecido como desvio; reinstalacao de node_modules por autoria desconhecida declarada; aprovacao do usuario registrada; origem/assinatura do binario global declarada NAO verificada e pendente. Para a policy, isso e transparencia correta; o desvio (uso antes do registro) nao e reparavel retroativamente e o aceite do usuario cobre. Pendencia residual (REV-012, baixo, conformidade): a verificacao de origem do binario pnpm global segue aberta; o usuario/security deve fechar ou dispensar, e a data/hora da aprovacao nao esta no registro (apenas "mensagem desta tarefa").
- Configuracao: ignoreScripts, saveExact e registry em pnpm-workspace.yaml (confere com o arquivo), .npmrc mantido com os mesmos valores (redundante, documentado porque o .npmrc sozinho nao bastava para ignore-scripts no pnpm). Config de usuario do pnpm com escopos/token fora do repo, declarada nao lida; nao afeta pacotes usados.
- **Nao declarar packageManager: ACEITAVEL.** A razao e concreta e documentada (declarar faz o pnpm 12 pinar a si mesmo no lock com 15 entradas @pnpm/exe fora do escopo aprovado) e README + registro fixam a versao em texto. Custo: o pnpm exigido nao e verificado por ferramenta (corepack/engine), logo outro pnpm pode gerar lock diferente; mitigado pelo --frozen-lockfile e pelo campo engines de Node. Recomendacao (observacao): rever quando o pnpm permitir pinar sem entradas extras.

## Demais verificacoes
- Um so lock: existe apenas pnpm-lock.yaml na raiz; package-lock.json nao esta na raiz. O NPM engine-strict/engines do package.json permanece. Legado preservado: legacy/package-lock.json.npm-obsoleto (81,6 KB, mesmo tamanho do original), com legacy/LEIA-ME.md explicando; nada apagado. O hash original citado no registro nao foi reconferido por mim contra o arquivo movido.
- package.json: 9 devDependencies exatas (8 aprovadas + @pixiv/three-vrm 3.5.5), sem ranges; scripts inalterados.
- README: coerente com os comandos pnpm (install --frozen-lockfile, run ...), proibe npm install/ci, explica o pnpm-workspace.yaml, o packageManager ausente e o lock obsoleto; secao Cabecalhos de hospedagem e legado referenciam pnpm run build. Nota: a linha do registro "Instalar sempre com npm ci" da rodada anterior ficou historica; o registro tem a nota de que a arvore atual e do pnpm (aceitavel, mas a frase antiga ainda aparece no item Reprodutibilidade; sugestao de marcar como substituida).
- Tamanho 252M de node_modules explicado (links do pnpm); dependencias-instaladas.md regenerado (174 itens) com a limitacao de licenca "?" para opcionais de outras plataformas declarada.

## Finding novo
### REV-012 - Baixo - Conformidade - Origem do binario pnpm global nao verificada; aprovacao sem referencia datada
- Local: docs/operations/registro-instalacoes.md (secao pnpm).
- Rationale: policies/installations.md pede procedencia/seguranca para qualquer ferramenta; o registro admite que publicador/assinatura do pacote npm pnpm nao foram verificados e cita a aprovacao so como "mensagem desta tarefa".
- Resolucao esperada: o usuario/security verifica (npm view pnpm repository/maintainers, versao 12.11.2) ou registra dispensa explicita; anotar a data/hora do aceite.

## Limites
Sem navegador. Numeros de adocao e conteudo dos tarballs nao reverificados por mim (dependo de security-proposta-three-vrm.md e da proposta). Nao verifiquei o hash do lock npm movido nem a sha256 do pnpm-lock citada no registro.
