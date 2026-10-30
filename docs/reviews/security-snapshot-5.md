# Revalidacao de seguranca - snapshot-5 (pnpm + @pixiv/three-vrm)

Revisor: especialista security (independente do autor; somente leitura). Model: standard.
Snapshot: docs/reviews/snapshot-5.sha256; sha256sum -c: todos conferem. Nada instalado; nenhum token lido. Scripts de comparacao so no scratchpad (fora do projeto).

## Veredito: APROVADO
SEC-P-001 FECHADO; condicoes 1, 2 e 5 da proposta ATENDIDAS. Dois pontos residuais (Low/Info) abaixo, nenhum bloqueante. Aprovacao humana e separada (o usuario ja aprovou pnpm e three-vrm).

## Tabela

| Item | Resultado | Evidencia propria |
|---|---|---|
| (a) +14 pacotes @pixiv no pnpm-lock | OK | Comparei nome@versao e integrity: pnpm-lock = 174 pacotes; legacy/package-lock.json.npm-obsoleto = 160 entradas. Adicionados exatamente 14, todos @pixiv 3.5.5 (three-vrm, 6 three-vrm-*, 7 types-*), identicos a lista da proposta. Removidos: 0. 174/174 com integrity sha512; 0 requiresBuild; sem tarball/git/URL fora do npmjs no lock. |
| (a) integrity bate com o registro | OK | `npm view <pkg>@3.5.5 dist.integrity` para os 14: 14/14 identicos ao pnpm-lock, 0 divergencias. |
| (b) ignoreScripts, save-exact, registry | OK | pnpm-workspace.yaml: ignoreScripts: true, saveExact: true, registry: https://registry.npmjs.org/. `pnpm config get`: ignoreScripts=true, saveExact=true, registry=npmjs. `.npmrc` mantem registry, save-exact, ignore-scripts, engine-strict (e, como o autor notou, `pnpm config get ignore-scripts` sozinho vem do .npmrc/undefined; o efetivo vem do workspace.yaml e esta correto). |
| (b) nenhum script de dependencia executou | OK | node_modules/.modules.yaml: pendingBuilds: []; varredura de todos os package.json em node_modules/.pnpm: nenhum preinstall/install/postinstall em pacotes instalados; unicos .node sao os binarios prebuilt de plataforma (@rolldown/binding-win32-x64-msvc, lightningcss-win32-x64-msvc) entregues no proprio tarball, sem artefato de compilacao local. Binarios de outras plataformas em skipped. |
| (c) 135 pacotes anteriores inalterados | OK | Todos os 160 nome@versao do lock npm auditado existem no pnpm-lock com a mesma integrity (0 divergencias de versao/integrity). Os 160 incluem os opcionais de outras plataformas; nenhum removido ou trocado. |
| (d) pnpm@12.11.2 global | OK, origem consistente | npm view: licenca MIT, repo github.com/pnpm/pnpm, publicado 2026-10-09 por GitHub Actions (OIDC), provenance SLSA v1, dist.integrity sha512-JaUWUq...Bipvc Q==. Instalado em %USERPROFILE%\AppData\Roaming\npm\node_modules\pnpm em 2026-10-13 (4 dias apos publicar), versao 12.11.2, com @pnpm/exe.win32-x64@12.11.2 (que tambem tem provenance SLSA). `npm ls -g` lista pnpm@12.11.2. LIMITE: nao e possivel comparar a integrity do tarball ja extraido por leitura (nao ha .package-lock global); a coerencia e por versao/estrutura, nao por hash. O manifesto do pnpm tem preinstall/postinstall `node install.js` (resolve o binario nativo da plataforma; faz spawnSync, sem URL/fetch no script); e esperado para o pnpm e e escopo global/ferramenta, nao do projeto. |
| (e) config de usuario com escopo para npm.pkg.github.com + token | Risco baixo, aceito | Nao li o arquivo nem o token. Risco: um escopo mapeado a outro registro com credencial so afeta pacotes desse escopo (@<escopo-do-usuario> e @jsr). Os 9 pacotes diretos e as 14 dependencias novas sao @pixiv/ e nao-escopados, resolvidos no registry efetivo do projeto (npmjs, confirmado por `pnpm config get registry`; resolution do lock so com integrity, sem tarball alternativo). Nenhum pacote @<escopo-do-usuario>/@jsr esta no lock (grep). Residual: o token vive fora do repositorio; um pacote futuro com esses escopos seria resolvido la com credencial (e e protegido de dependency confusion pelo escopo fixo). Recomendacao: manter o token com permissao minima (read:packages) e nunca copia-lo para .npmrc do projeto. |
| (f) pnpm audit | OK | `pnpm audit`: No known vulnerabilities found. |
| (g) nao declarar packageManager | Aceitavel | O custo observado (+15 entradas: pnpm e 14 @pnpm/exe.* no lock, fora do escopo aprovado) amplia a superficie da cadeia de suprimentos sem beneficio de seguranca equivalente; a decisao mantem o lock com exatamente +14. Verificado: package.json sem packageManager; lock sem pnpm/@pnpm. Mitigacoes: engines ja fixa o Node; README/registro documentam pnpm 12.11.2 (confirmar que o README diz para usar essa versao); `pnpm install --frozen-lockfile` exige o lock. Contrapartida: sem o campo, outra versao do pnpm poderia ser usada (risco de drift), mitigado por lockfileVersion 9.0 e frozen-lockfile. |

## Findings
- SEC-010 (Low): sem packageManager, a versao do pnpm nao e imposta; outra versao pode reescrever o lock. Resolucao: aceitar (decisao documentada) e usar sempre `pnpm install --frozen-lockfile` em CI/ambiente limpo; revisar se o pnpm passar a oferecer pinagem sem dependencias extras.
- SEC-011 (Info): a integrity do pnpm global ja extraido nao foi comparada com o registro (so versao e proveniencia do registro). Resolucao: opcional, o usuario pode reinstalar com `npm install -g pnpm@12.11.2 --ignore-scripts=false` apenas se desejar verificar `npm audit signatures`; nao exigido.
- SEC-P-001: FECHADO (um gerenciador, um lock versionado, registro retroativo explicito, package-lock antigo movido para legacy/ e nao apagado; confirmar que legacy/ continua nao servido, ja documentado em legacy/LEIA-ME.md).

## Nao verificado
- Conteudo do config de usuario do pnpm e do token (propositalmente); nenhuma credencial lida.
- Hash do binario global ja instalado contra o registro; assinatura Sigstore (so presenca e metadados).
- Uso real do three-vrm no codigo (ainda nao importado em src/ segundo o registro; o CSP/urlPolicy do loader VRM sera tema de revisao do codigo futuro, condicoes 3 e 4 da proposta continuam pendentes).
- Comportamento em navegador; cabecalhos de hospedagem.
