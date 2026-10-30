# Installation registry
Location: docs/operations/registro-instalacoes.md. Rule: nothing is installed, enabled or granted without a proposal, explicit approval and a row here, recorded in the same turn.

## Installed or enabled
Comum a todas as linhas: fonte = registro npm (https://registry.npmjs.org), escopo = projeto (C:\dev\genai-libras\node_modules; nada global), data 2026-10-30, aprovador = usuario (autorizacao explicita e restrita a estes 8 pacotes), instalacao com `.npmrc` do projeto (`save-exact=true`, `ignore-scripts=true`: nenhum script de instalacao executado; nenhuma configuracao global do npm escrita). Arquivos alterados: package.json, package-lock.json, node_modules/. Remocao: `npm uninstall <pacote>` (ou apagar node_modules/ e a entrada em package.json). Versoes com mais de 2 semanas na data de instalacao (publicacao conferida em `npm view <pkg> time`).

| Date | What | Version (publicada) | Need (criterio 1) | Procedencia (criterio 2, `npm view`, 2026-10-30) | Verification |
|---|---|---|---|---|---|
| 2026-10-30 | vite | 8.3.4 (2026-10-08) | build/dev server do projeto Vite | repo github.com/vitejs/vite, MIT, publicado por GitHub Actions com atestado de proveniencia SLSA v1 | `npm run build` OK |
| 2026-10-30 | typescript | 6.0.3 (2026-04-16) | TypeScript estrito; 7.x evitado (typescript-eslint 8.71.2 exige <6.1) | repo github.com/microsoft/TypeScript, Apache-2.0, publicado por typescript-bot (mantenedor microsoft1es) | `npm run typecheck` OK |
| 2026-10-30 | three | 0.186.1 (2026-09-24) | renderizacao 3D + FBXLoader | repo github.com/mrdoob/three.js, MIT, mantenedor mrdoob | build/testes de pose OK |
| 2026-10-30 | @types/three | 0.186.0 (2026-09-11) | tipos do three | repo github.com/DefinitelyTyped/DefinitelyTyped, MIT, publicador "types" | typecheck OK |
| 2026-10-30 | vitest | 5.0.5 (2026-10-15, 15 dias) | testes unitarios | repo github.com/vitest-dev/vitest, MIT, GitHub Actions com atestado SLSA v1 | `npm run test` OK |
| 2026-10-30 | eslint | 10.12.0 (2026-10-02) | lint | repo github.com/eslint/eslint, MIT, publicador eslintbot (mantenedor openjsfoundation) | `npm run lint` OK |
| 2026-10-30 | typescript-eslint | 8.71.2 (2026-10-12) | regras TS no eslint | repo github.com/typescript-eslint/typescript-eslint, MIT, GitHub Actions com atestado SLSA v1 | lint OK |
| 2026-10-30 | @eslint/js | 10.0.1 (2026-02-06) | config recomendada do eslint | repo github.com/eslint/eslint, MIT, publicador eslintbot | lint OK |

### Evidencia complementar dos criterios de selecao (REV-002)
- **Adocao (criterio 3): NAO VERIFICADO.** `npm view` nao expoe contagem de downloads e nao consultei APIs de estatisticas (fora do que foi autorizado nesta rodada). Os 8 sao as ferramentas padrao de seus ecossistemas, mas "padrao" aqui e afirmacao do autor, sem numero nem data. Pendente: o usuario aceita a dispensa ou um revisor consulta os numeros.
- **Atividade/manutencao:** `npm view vite time.modified` = 2026-10-21; as versoes instaladas foram publicadas entre 2026-02 e 2026-10 (tabela). Nenhum dos 8 esta marcado `deprecated`.
- **Proveniencia (criterio 2):** repositorios publicos listados acima. Atestado de proveniencia npm (SLSA) presente em vite, vitest e typescript-eslint; ausente nos demais (nao verificado se aplicavel). Assinaturas (`npm audit signatures`) NAO executadas.
- **Revisao de seguranca (criterio 4):** a instalacao foi feita pelo autor antes de uma revisao independente da proposta (desvio do procedimento: o usuario autorizou os 8 pacotes de forma expressa). Revisao independente posterior sobre o snapshot-1: docs/reviews/security-snapshot-1.md (lock sem `resolved` fora de registry.npmjs.org; unico `hasInstallScript` no lock e fsevents, opcional/darwin, nao instalado; nenhum preinstall/install/postinstall em node_modules; `ignore-scripts=true`). O codigo das dependencias transitivas NAO foi lido; so metadados, scripts de ciclo de vida e `npm audit`.
- **Transitivos:** 135 pacotes instalados (8 diretos + 127 transitivos), todos de registry.npmjs.org, licencas MIT, Apache-2.0, BSD-2/3-Clause, ISC, MPL-2.0 e BlueOak-1.0.0, nenhum com script de instalacao. Lista completa com versao e licenca: docs/operations/dependencias-instaladas.md.
- **Contagens (REV-003/SEC-007):** `package-lock.json` tem 160 entradas; 135 estao instaladas. As 25 restantes sao dependencias opcionais de outras plataformas (ex.: fsevents, @rolldown/binding-*, lightningcss-*), nao instaladas neste host. A frase anterior "nenhum pacote opcional" estava imprecisa: nenhum opcional foi *instalado* alem dos que o npm resolve para esta plataforma, e nenhum extra foi pedido.
- **Reprodutibilidade/cadeia (SEC-005):** `.npmrc` agora fixa `registry=https://registry.npmjs.org/` e `engine-strict=true` (package.json: engines node ^20.19.0 || >=22.12.0). Instalar sempre com `npm ci` (respeita os hashes `integrity` do lock). `npm ci --dry-run` executado: "up to date" (nada alterado).
- **Pos-instalacao:** `npm audit` = found 0 vulnerabilities (reexecutado na rodada de correcao 1). Tamanho final de node_modules: 120 MB (`du -sh`).

## Rodada pnpm + @pixiv/three-vrm (2026-10-30, posterior as 8 instalacoes acima)

### Gerenciador de pacotes: pnpm 12.11.2 (registro retroativo)
- O que: pnpm 12.11.2, instalado globalmente na maquina do usuario (%USERPROFILE%\AppData\Roaming\npm\pnpm; `npm ls -g` lista pnpm@12.11.2). Store: %USERPROFILE%\AppData\Local\pnpm\store\v11. Esta tarefa NAO instalou o pnpm; so o usa.
- Uso nao registrado antes: node_modules/ do projeto foi reinstalado com pnpm em 2026-10-30 11:36 (node_modules/.modules.yaml; criou `pnpm-lock.yaml`), por autoria desconhecida (nao consta em nenhum pedido). Isso contradizia a afirmacao de que a instalacao era do npm (SEC-P-001). Desvio reconhecido: o uso ocorreu antes de ser registrado.
- Aprovacao: o usuario decidiu usar pnpm e reconheceu/aprovou o uso em 2026-10-30 (mensagem desta tarefa).
- Verificacao: `pnpm --version` = 12.11.2. NAO verificado: origem exata do binario global (publicador/assinatura do pacote npm `pnpm`); pendente para o usuario/security.
- Configuracao efetiva (`pnpm config get`): ignoreScripts=true, saveExact=true, registry=https://registry.npmjs.org/, definidos em `pnpm-workspace.yaml`. O `.npmrc` sozinho NAO bastava: `pnpm config get ignore-scripts` retornava `undefined`; o `.npmrc` foi mantido com os mesmos valores. O pnpm tambem nao executa build scripts de dependencias por padrao e o lock nao tem `requiresBuild`.
- A configuracao de USUARIO do pnpm (fora do repositorio) mapeia os escopos @<escopo-do-usuario> (npm.pkg.github.com) e @jsr, com token; nao afeta @pixiv nem os 9 pacotes diretos (registry.npmjs.org). O token nao foi lido nem copiado.
- Lock unico: `pnpm-lock.yaml`. O `package-lock.json` (sha256 bd772eb637d88812..., auditado nas revisoes anteriores) foi movido para legacy/package-lock.json.npm-obsoleto (nao apagado).
- Tentativa descartada: declarar `packageManager: pnpm@12.11.2` no package.json fez o pnpm 12 pinar a si mesmo no lock (+15 entradas: `pnpm` e 14 `@pnpm/exe.*`, fora do escopo aprovado); o campo foi removido, o bloco de pnpm foi retirado do lock e `pnpm install --frozen-lockfile` passa.
- Remocao do pnpm do projeto: apagar pnpm-lock.yaml, pnpm-workspace.yaml e node_modules, restaurar o lock antigo e usar `npm ci`.

### @pixiv/three-vrm 3.5.5 (+13 transitivos)
| Item | Valor |
|---|---|
| Date | 2026-10-30 |
| Comando | `pnpm add -D -E --ignore-scripts @pixiv/three-vrm@3.5.5` (escopo projeto, devDependency) |
| Fonte | registry.npmjs.org; versao 3.5.5, publicada 2026-07-09 (mais de 2 semanas) |
| Pacotes novos no lock | exatamente 14: @pixiv/three-vrm; three-vrm-core; -materials-mtoon; -materials-v0compat; -materials-hdr-emissive-multiplier; -node-constraint; -springbone; types-vrm-0.0; types-vrmc-vrm-1.0; types-vrmc-materials-mtoon-1.0; types-vrmc-materials-hdr-emissive-multiplier-1.0; types-vrmc-node-constraint-1.0; types-vrmc-springbone-1.0; types-vrmc-springbone-extended-collider-1.0 |
| Aprovador | usuario (aprovacao explicita 2026-10-30), apos a proposta revisada por security: docs/reviews/security-proposta-three-vrm.md (APROVAR COM CONDICOES) |
| Necessidade | decisao do usuario (estudo pessoal): dedos humanoides e expressoes que o FBX atual nao atende |
| Procedencia | org pixiv, repo github.com/pixiv/three-vrm (confere com repository.url), MIT |
| Adocao (dados da proposta, 2026-10-30) | 168.945 downloads semanais (23-29/10/2026); 2.247 estrelas; push 2026-10-22; release 2026-07-09 |
| Proveniencia SLSA | presenca do atestado vista na API do registro nos 14 pacotes; assinatura NAO verificada criptograficamente |
| Revisao de seguranca | tarballs 3.5.5 lidos por security: 0 lifecycle scripts; sem rede/eval/storage nos bundles |
| Verificacao pos-instalacao | `packages` do lock: 160 -> 174 (+14, todos @pixiv, 0 removidos, nenhum outro novo); 174/174 com `integrity: sha512`; 0 `requiresBuild`; sem tarball/git/directory no lock (o pnpm-lock nao grava URL; o registro efetivo e o configurado, npmjs); `pnpm audit`: No known vulnerabilities found; typecheck/lint/test (79)/build passam; o pacote ainda nao e importado em src/ (bundle JS 634.81 kB, igual ao snapshot-4) |
| sha256 do lock | 2403ed126feca07e9b8a94edee1d37742a4a1c323ddc192e0c56bb36f9259d5d |
| Tamanho de node_modules | 252M (`du -sh`; contagem inflada por links do pnpm; node_modules/.pnpm tem 151 diretorios) |
| Remocao | `pnpm remove @pixiv/three-vrm` (tira os 14 pacotes de package.json e do lock); `pnpm install --frozen-lockfile`, `pnpm audit`, build; registrar a remocao |
| Fora desta aprovacao | nenhum .vrm/modelo baixado ou copiado; avatar nao migrado; condicoes 3, 4, 6 e 7 da proposta (urlPolicy no GLTFLoader, CSP com blob:, metadados, revisao do modelo) ficam para a migracao |

Nota: a coluna "Verification" das 8 linhas anteriores refere-se ao npm; a arvore atual de node_modules e do pnpm (mesmas versoes exatas; gates reexecutados com pnpm).

## Migracao para VRM (2026-10-30): arquivos e ferramentas usadas, sem novas instalacoes
- Nenhum pacote instalado nesta etapa (so `@pixiv/three-vrm@3.5.5`, ja registrado acima; `pnpm-lock.yaml` e `package.json` inalterados).
- Arquivo de modelo copiado para o projeto (nao e instalacao de software; registrado por rastreabilidade): `public/models/Seed-san.vrm`, copiado de `...\scratchpad\vrm-seedsan-download\Seed-san.vrm` (baixado pelo principal, autorizado pelo usuario em 2026-10-30). SHA-256 conferido apos a copia = 624d0d554bc205bbdc33e22a68a2c3c20edebb3e573011ead8878a65e5329b23, 10.917.800 bytes. Arquivo nao editado; git-ignorado (`public/models/*.vrm`). Remocao: apagar `public/models/Seed-san.vrm`. Atencao: `pnpm run build` copia o .vrm para `dist/models/`; nao publicar `dist/` sem decisao sobre redistribuicao.
- Ferramentas JA EXISTENTES na maquina usadas (nada instalado, nada baixado): Google Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`) em modo `--headless`, com perfil temporario no scratchpad, falando apenas com `http://localhost:4173` (`vite preview` do build local), para medir a CSP e fotografar as poses; Python 3.13 (`python -I`, somente leitura do JSON do GLB) para listar ossos, expressoes e morph targets; WebSocket global do Node para o protocolo de depuracao do Chrome local. Microfone, Web Speech e rede externa nao foram usados.
- Movido (nao apagado): `public/models/character.fbx` -> `legacy/character.fbx` (nada mais o referencia).
- Temporarios criados e removidos: perfis do Chrome/Edge, capturas de tela, saidas de log e scripts (.py/.mjs) do scratchpad; `/tmp/preview.log`. Servidor `vite preview` (porta 4173) e processo do Chrome encerrados. Permanecem no scratchpad apenas itens do principal/revisores: vrm-seedsan-download (original do VRM), vrm-reader, vrmtar, dist2-4, cmp.cjs, probe.test.ts, vc.mjs.
- Tentativa com Microsoft Edge headless (`--dump-dom`): sem saida; descartada; Chrome usado no lugar.

## API Python do agente de Libras (2026-10-30): ambiente virtual api/.venv
- Escopo: projeto (C:\dev\genai-libras\api\.venv; nada global). Aprovador: usuario, autorizacao explicita e restrita a: fastapi, uvicorn (sem [standard]), langchain-core, langchain-openai, pytest, httpx e as dependencias que esses exigirem.
- Fonte: PyPI. Python 3.13.15 ja existente. Comandos: `uv --no-config pip compile requirements.in --generate-hashes --only-binary :all: --python-version 3.13 --python-platform windows -o requirements.lock` (uv 0.13.0 ja existente; funcionou) e `python -m venv .venv` + `.venv\Scripts\python.exe -m pip --isolated install --only-binary=:all: --require-hashes --no-deps -r requirements.lock`. Somente wheels, com hashes; nenhum codigo de build/setup executado. Nada alem da lista autorizada foi baixado; nenhum modelo; sem Docker.
- Diretos (7, versoes exatas em api/requirements.in): fastapi 0.162.0, uvicorn 0.54.0, langchain-core 1.7.3, langchain-openai 1.7.3, pytest 9.2.0, httpx 0.28.1, certifi 2026.10.23 (pedido: >= 2026.10.18; e dependencia exigida, fixada explicitamente).
- Transitivos: 42 (lock com 49 pacotes no total, 1366 linhas de hash; lista completa em api/requirements.lock), entre eles openai 3.41.0, pydantic 2.14.2, starlette 1.10.0, tiktoken 0.14.0, langsmith 0.14.16 (puxado por langchain-core; NAO usado: tracing proibido e forcado a "false" em app/config.py, com teste), opentelemetry-api, requests, orjson. O `pip` do proprio venv (26.2.1) vem do `python -m venv`. Nenhuma lista de CVEs consultada nesta rodada (`pip-audit` nao instalado, por nao ter sido autorizado).
- Tamanho de api/.venv: 112 MB (`du -sh`).
- Arquivos alterados: api/ (novo), .gitignore (api/.venv/, api/.env, __pycache__/, .pytest_cache/). Remocao: apagar api/.venv e recriar pelo README.
- NAO verificado: proveniencia/assinatura individual dos pacotes alem dos hashes do lock; adocao (downloads) dos pacotes; revisao independente de seguranca desta instalacao.

## Attempted but not installed
| Date | What | Reason (cancelled/blocked/rejected by security review) | Alternative used |
|---|---|---|---|
| 2026-10-30 | Conversor FBX 6.1 -> 7.4/GLB (Blender, FBX2glTF, etc.) | Nao autorizado pelo usuario; nada instalado | Reportado como bloqueio (ver docs/lacunas-conhecidas.md) |
| 2026-10-30 | jsdom/happy-dom/Playwright para testes de UI | Nao autorizados; nada instalado | Logica de UI extraida em modulos puros testados (src/ui/messages.ts) |

## Temporary files outside the repository
| Path | Created for | Safe to delete after |
|---|---|---|
| %USERPROFILE%\AppData\Local\Temp\claude\c--dev-genai-libras\a5e9e7d9-babc-4020-8a4a-2760116ee72d\scratchpad\ (scripts .mjs/.cjs de inspecao do FBX e de geracao da lista de dependencias) | Inspecao somente leitura | Ja removidos ao final de cada uso |
| ...\scratchpad\vrmtar (7 .tgz publicos @pixiv + extracoes baixados pela revisao de seguranca, nao pelo autor) e as pastas dist2/dist3/dist4 e probe.test.ts do mesmo scratchpad (de revisores) | Revisao independente | Ja; seguro apagar |
| /tmp/lock-*.yaml, /tmp/ws.yaml, /tmp/a.txt, /tmp/b.txt (copias do lock para comparar; sem dados sensiveis; removidos) | Comparacao do lock | Removidos |

## Download do modelo VRM Seed-san (2026-10-30)
- O quê: `Seed-san.vrm` (10.917.800 bytes), de https://raw.githubusercontent.com/vrm-c/vrm-specification/master/samples/Seed-san/vrm/Seed-san.vrm (VirtualCast, VRM Public License 1.0).
- Aprovador: usuário, 2026-10-30 ("permito"), após o plano de segurança (pasta nova e vazia, hash, só metadados).
- Local: scratchpad da sessão, FORA do projeto: `%USERPROFILE%\AppData\Local\Temp\claude\c--dev-genai-libras\a5e9e7d9-babc-4020-8a4a-2760116ee72d\scratchpad\vrm-seedsan-download\Seed-san.vrm`. Copiado depois para `public/models/Seed-san.vrm` na migração para VRM (ver a seção "Migração para VRM" abaixo; hash conferido após a cópia).
- Verificação: tamanho e git blob SHA-1 iguais aos da API do GitHub; SHA-256 `624d0d554bc205bbdc33e22a68a2c3c20edebb3e573011ead8878a65e5329b23`. Lido só o chunk JSON, com `python -I` e script em `scratchpad\vrm-reader\read_meta.py` (arquivo temporário). O modelo não foi executado nem aberto em ferramenta.
- Resultado: ver `docs/licencas-vrm-seed-san.md`.
- Remoção: apagar as pastas `vrm-seedsan-download` e `vrm-reader` do scratchpad; como foi copiado para `public/models/Seed-san.vrm`, remover também (o `.gitignore` já o ignora).
- **Decisão do usuário (troca de modelo), 2026-10-30:** o requisito original era usar o boneco de `modelo/` (character.fbx, Medea). Ele não carregava (FBX 6.1 recusado pelo FBXLoader) e tem licença não resolvida (PRIV-005). O usuário escolheu o caminho VRM + `@pixiv/three-vrm` e deu "inicie" em 2026-10-30: o Seed-san substitui o boneco de `modelo/` no app. `modelo/` e `legacy/` foram preservados (nada apagado).

## Container 9router (gateway LLM local, POC) — 2026-10-30
- O quê: imagem Docker `decolua/9router:0.5.112` (Docker Hub; repositório github.com/decolua/9router, MIT, ~31 mil estrelas; ~660 mil pulls; mantenedor individual `decolua`). Digest: `sha256:fab111d99b23bde6c8944ca22982603ab0b09e917a0b1e4ce42a24b05753bec9`. Tamanho em disco: ~1,34 GB (301 MB comprimido).
- Para quê: gateway compatível com a API da OpenAI em `http://127.0.0.1:20128/v1`, usado pelo `OpenAICompatibleProvider` da API do agente, com provedores de camada gratuita. POC local, sem publicação.
- Aprovador: usuário, 2026-10-30 ("suba em um container ... para os testes").
- Execução: container `9router-poc`, porta publicada SOMENTE em `127.0.0.1:20128`; volume nomeado `9router-poc-data` (dados em /app/data); `--cap-drop ALL` com `SETUID`, `SETGID`, `CHOWN` de volta (necessárias para o entrypoint trocar de usuário; sem elas o container não inicia); `no-new-privileges`; `--memory 1g`; `--pids-limit 512`; `--restart no` (não sobe sozinho). Segredos aleatórios (senha inicial, JWT, API key secret, salt) em `%USERPROFILE%\.9router-poc\secrets.env`, fora do repositório; a senha padrão `123456` NÃO é usada.
- Verificação: container `Up`, dashboard responde 307 e `/v1/models` responde 401 sem chave; escuta só em loopback (`netstat`).
- Não verificado: código da imagem e dependências (não auditado), tráfego de saída do container (telemetria/cloud do 9router, `NEXT_PUBLIC_CLOUD_URL=https://9router.com` por padrão), termos de uso dos provedores conectados.
- Riscos conhecidos: o próprio projeto avisa que pool de contas e o "MITM Bridge" podem violar termos dos provedores (não usar); camadas gratuitas podem usar o conteúdo para treino (usar só frases de teste sem dados pessoais).
- Remoção: `docker rm -f 9router-poc; docker volume rm 9router-poc-data; docker rmi decolua/9router:0.5.112`; apagar `%USERPROFILE%\.9router-poc\`.

## Docker Compose da POC (2026-10-30): stack web + API + 9router
- Aprovador: usuário, pedido "gere um docker compose que consiga subir todo o projeto, ja com os apontamentos e as envs" (2026-10-30). **Status: NÃO construído, NÃO executado, NÃO verificado** (só `docker compose config` = exit 0; nada baixado: digests resolvidos por `docker buildx imagetools inspect`, consulta ao registro sem pull).
- Arquivos criados: `compose.yaml`, `api/Dockerfile`, `api/.dockerignore`, `Dockerfile.web`, `nginx/web.conf`, `.dockerignore`, `.env.example`; alterados: `.gitignore` (+`.env`), `README.md` (seção "Subir tudo com Docker Compose"). Nenhum segredo nos arquivos (grep conferido). `.env` da raiz (que o usuário cria) é git-ignorado.
- Imagens-base (tag + digest do índice multi-arch): `python:3.13-slim` `sha256:2d44738ebf4ce5f63b9d9ea871e9c7cfdc0426f7b0c97cac915fd88ded1d86bb` (~43 MB comprimido, amd64); `node:24-alpine` `sha256:8a32c8cf649a49915a66e81e7a609223c708d0adabf288ee3f4077d765542f85` (~63 MB; só build); `nginxinc/nginx-unprivileged:alpine` `sha256:b5047b9b76845eac124358373c6852377c52e4b05834a47647e955dd91cb8f1e` (~26 MB); `decolua/9router:0.5.112` `sha256:fab111d99b23bde6c8944ca22982603ab0b09e917a0b1e4ce42a24b05753bec9` (já presente). Fontes: Docker Official Images e nginxinc (organização NGINX); 9router já registrado acima.
- Será baixado/construído na primeira execução de `docker compose up --build`: as 3 bases novas; imagens `genai-libras-api:local` e `genai-libras-web:local` (construídas); pacotes PyPI (lock com hashes, `--require-hashes --no-deps`, só wheels) e npm (`pnpm install --frozen-lockfile`, scripts desativados); o próprio `pnpm@12.11.2` via `npm install -g` dentro do build (sem verificação de hash além da do registro npm). Containers criados: `genai-libras-{9router,api,web}-1`; redes `genai-libras_{backend,publish,egress}`. O volume `9router-poc-data` é reutilizado (`external`), não criado.
- Dados: ver README (volume atual vazio; dados do `9router-poc` na camada do container; cópia manual proposta, não executada).
- Remoção: `docker compose down` (sem `-v`); `docker rmi genai-libras-api:local genai-libras-web:local python:3.13-slim node:24-alpine nginxinc/nginx-unprivileged:alpine` (somente se nenhum outro projeto usa; as bases são compartilháveis); apagar os arquivos acima. NÃO remover o volume `9router-poc-data` sem decisão do usuário.

## Redis no Docker Compose da POC (2026-10-30): cache de sinais gerados
- Aprovador: usuário (aprovou o Redis no compose para registrar o dicionário de sinais gerados como cache; mensagem repassada pelo principal, 2026-10-30). **Status: NÃO construído, NÃO executado, NÃO verificado** (só `docker compose config --quiet` = exit 0 com senha de teste em arquivo temporário, depois apagado; nada baixado: digest por `docker buildx imagetools inspect`, sem pull).
- Imagem: `redis:8.10-alpine` (Docker Official Image; tag igual a `8-alpine` na data) `sha256:21090af93f8324db2f0f0f4f38a7c60369d47d917e000c3423d89d2ae2883537` (índice multi-arch; amd64 `sha256:be7c1cada5a6eb1656adfa2635b99296af725881301b21f84f35a71fac072c7f`, ~39,5 MB comprimido). Será baixada no primeiro `docker compose up`.
- Arquivos alterados: `compose.yaml` (serviço `redis`, volume `redis-data`, variáveis `REDIS_URL`/`REDIS_PASSWORD`/`CACHE_TTL_S` na `api`), `.env.example` (placeholder de `REDIS_PASSWORD`, `CACHE_TTL_S`), `README.md`. Nenhum segredo em arquivos. `REDIS_PASSWORD` real fica só no `.env` da raiz (git-ignorado).
- Criados na primeira execução: container `genai-libras-redis-1`; volume `libras-redis-data` (do compose, não external).
- Remoção, em passos separados: (1) `docker compose rm -f -s redis` e `docker rmi redis:8.10-alpine`; (2) **somente com decisão explícita do usuário**, `docker volume rm libras-redis-data` (apaga o cache/AOF). `docker compose down -v` também apaga `libras-redis-data`; não usar sem querer isso.
