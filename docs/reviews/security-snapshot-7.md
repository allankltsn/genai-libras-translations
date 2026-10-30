# Revalidacao de seguranca - delta snapshot-6 -> snapshot-7

Revisor: especialista security (independente; somente leitura). Model: standard.
Snapshot: docs/reviews/snapshot-7.sha256 e snapshot-7.vrm.sha256; sha256sum -c: todos conferem. Delta por diff dos manifestos = os 14 arquivos informados (README, docs x3, eslint.config.js, index.html, package.json, scripts/build-notice.mjs, expressionAnimator(+test), prepareAvatar(+test), main.ts, styles.css). Nada instalado; build limpo fora do projeto (dist/ nao existe no projeto); nenhum processo encerrado.

## Veredito do delta: APROVADO
Sem findings novos acima de Info. Aprovacao humana e separada.

## Tabela

| Verificacao | Resultado | Evidencia |
|---|---|---|
| scripts/build-notice.mjs | OK | Li o arquivo inteiro (13 linhas). Unico import: node:fs (existsSync, readdirSync). Faz leitura do diretorio dist/models/ (caminho fixo relativo ao script), filtra nomes *.vrm e imprime aviso em stdout. Sem rede, eval/Function, child_process, escrita, env, argumentos ou entrada externa. Nao falha o build (nao muda exit code). |
| Ordem de seguranca do build | Inalterada | package.json: `tsc --noEmit && vite build && node scripts/build-notice.mjs`. O script roda por ultimo e so apos typecheck e build bem-sucedidos; nao substitui nem pula etapas. Executa no processo Node do dev (mesma confianca do projeto); nao e script de ciclo de vida de dependencia. |
| eslint globalIgnores inclui scripts | Aceito (Low/Info) | O script nao e linted; risco pratico baixo por ser pequeno e revisado aqui e nao ser TypeScript (as regras tipadas do projeto so se aplicam a .ts). Mudar/estender o script deve passar por revisao; sugestao: manter o script minimo e, se crescer, linta-lo com o config base. Tambem ignora legacy, modelo, public (que nao entram no build). |
| src/main.ts, prepareAvatar.ts, expressionAnimator.ts | OK | grep em src e index.html: sem console, storage, indexedDB, innerHTML/outerHTML/insertAdjacent, eval/Function, fetch/XHR/WebSocket/sendBeacon, cookie, postMessage, location. Unico acesso a metadados do VRM: `vrm.meta.metaVersion === '0'` (loadAvatar.ts, comparacao, nao exibido). prepareAvatar: monta animadores a partir de humanoid/scene e lanca erro de mensagem fixa (NoSkeletonError) sem expor dados do arquivo. Credito/licenca no HTML sao texto fixo; links externos estaticos com noopener noreferrer (como SEC-014). |
| CSP do build | Inalterada | Build limpo: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' blob:; media-src 'self'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'. vite.config.ts com mesmo sha256 do snapshot-6. HTML do build sem <style>/style=/on*=. |
| package.json | So o script build mudou | devDependencies identicas (9 pacotes exatos, incl. @pixiv/three-vrm 3.5.5), engines, demais scripts iguais; unica diferenca: `build` ganhou `&& node scripts/build-notice.mjs`. O hash mudou (3992d126 -> a38df7e5) por isso. Nao ha comparacao textual com a copia do snapshot-6 (nao guardada); conclusao por leitura do arquivo atual e pelo lock inalterado. |
| pnpm-lock.yaml / pnpm-workspace.yaml / .npmrc | Inalterados | sha256 iguais ao snapshot-6 (2403ed12..., f903f30b..., ad0e4e77...). Nenhum pacote novo. |
| pnpm audit | OK | No known vulnerabilities found. |
| VRM | Inalterado | SHA-256 624d0d554bc205bbdc33e22a68a2c3c20edebb3e573011ead8878a65e5329b23 = snapshot-7.vrm.sha256. |
| SEC-012 (node.exe em [::1]:5173) | SEGUE ATIVO e FORA DO REGISTRO | netstat: PID 54776 LISTENING em [::1]:5173 (somente loopback IPv6). Processo: `node ...\node_modules\.bin\..\vite\bin\vite.js` (vite dev, sem --host), iniciado 30/10/2026 11:39:56, pai um cmd (PID 38824, mesmo horario). Nao ha mencao a 5173 em docs/operations/registro-instalacoes.md (0 ocorrencias). Nao e o `vite preview` 4173 do autor (4173 nao escuta). Origem nao confirmada (provavelmente sessao dev do usuario, iniciada logo apos a reinstalacao pnpm). Nenhum processo foi encerrado por mim. |

## Findings
- SEC-012 (Info, mantido aberto): servidor vite dev em loopback ativo e nao registrado. Resolucao: usuario/principal confirma a origem e encerra ao terminar (ou registra); nunca iniciar com --host; CSP de dev e mais frouxa (style unsafe-inline, ws local).
- SEC-015 (Info): scripts/ fora do lint por globalIgnores; ver tabela. Resolucao: aceitar, manter o script de 13 linhas sem rede/escrita e exigir revisao de seguranca para qualquer mudanca.

## Nao verificado
- Comportamento em navegador real; logica completa de expressionAnimator/prepareAvatar e dos testes (so padroes perigosos e leitura de prepareAvatar).
- Diff textual exato de package.json contra o snapshot-6 (nao ha copia); conferido por leitura e pelo lock inalterado.
- Quem iniciou o servidor 5173; conteudo binario do VRM (hash inalterado, analise do snapshot-6 vale).
