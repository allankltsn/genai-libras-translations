# Avatar Libras (protótipo)

Microfone ou texto -> glosas -> sinais -> avatar 3D. **Protótipo: os sinais são aproximações não validadas por intérprete de Libras ou pessoa surda. Não use para comunicação importante, médica, jurídica ou de emergência.**

## Comandos
- Gerenciador: **pnpm 12.11.2** (decisão do usuário, 2026-10-30). O único lock é `pnpm-lock.yaml`; o antigo `package-lock.json` está em `legacy/package-lock.json.npm-obsoleto` (não use). Não use `npm install`/`npm ci` neste projeto.
- Instalação reprodutível: `pnpm install --frozen-lockfile` (falha se o lock não bater com o `package.json`; verifica os hashes `integrity`). O `pnpm-workspace.yaml` fixa `ignoreScripts: true`, `saveExact: true` e o registro `https://registry.npmjs.org/` (efetivos, conferidos com `pnpm config get`); o `.npmrc` repete os mesmos valores. Adicionar pacote só com aprovação (`.engineering/policies/installations.md`, `docs/operations/registro-instalacoes.md`): `pnpm add -D -E --ignore-scripts <pacote>@<versão exata>`.
- `packageManager` NÃO é declarado no `package.json`: no pnpm 12 isso faz o `pnpm-lock.yaml` pinar o próprio pnpm e acrescentar 15 entradas (`pnpm` e `@pnpm/exe.*`) fora do escopo aprovado. A versão do pnpm fica registrada aqui e no registro de instalações.
- `pnpm run dev`, `pnpm run typecheck`, `pnpm run lint`, `pnpm run test`, `pnpm run build` (os scripts do `package.json` não mudaram).

## O que NÃO servir
`legacy/` (inclui `character.fbx` e o lock antigo) e `modelo/main.html` contêm a versão antiga que carrega scripts de CDN (unpkg, jsdelivr, githubusercontent) sem SRI e o caminho de um arquivo local. Estão no repositório só para histórico. **Nunca sirva a raiz do projeto** nem esses arquivos; sirva somente o resultado de `pnpm run build` (`dist/`) ou `pnpm run dev`.

## Cabeçalhos HTTP exigidos na hospedagem
A CSP do `index.html` vem por `<meta>` e não cobre `frame-ancestors`. O host deve enviar:
- `Content-Security-Policy`: a mesma política do build (ver `vite.config.ts`) acrescida de `frame-ancestors 'none'`
- `Permissions-Policy: microphone=(self), camera=(), geolocation=()`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
O build usa `base: '/'`; para subcaminho ajuste `base` no Vite.

## Modelo 3D (VRM)
O avatar é o **Seed-san** (VRM 1.0, VirtualCast, Inc., VRM Public License 1.0; crédito obrigatório no rodapé da interface; ver `docs/licencas.md`). O arquivo **não vem no repositório** (`public/models/*.vrm` está no `.gitignore`). Para obtê-lo, copie-o de novo da origem e confira o hash (idempotente):
- Origem: https://github.com/vrm-c/vrm-specification/tree/master/samples/Seed-san (arquivo `vrm/Seed-san.vrm`, 10.917.800 bytes).
- SHA-256 esperado: `624d0d554bc205bbdc33e22a68a2c3c20edebb3e573011ead8878a65e5329b23`.
- Destino: `public/models/Seed-san.vrm`; conferir com `sha256sum public/models/Seed-san.vrm`. Não edite o arquivo.
Sem o arquivo, o app mostra o erro de carga (com "Tentar novamente") e mantém os controles desabilitados. Estado real, o que foi e o que não foi visto: `docs/lacunas-conhecidas.md`.

**Aviso sobre `dist/` (redistribuição):** `pnpm run build` copia `public/` para `dist/`, então `dist/models/Seed-san.vrm` vai junto. **Publicar `dist/` (hospedagem, CDN, zip, repositório) é Redistribuição do modelo.** A licença do Seed-san permite redistribuição com crédito (`allowRedistribution = true`, `creditNotation = required`), mas o usuário ainda NÃO decidiu publicar. O build imprime um `[AVISO]` quando o `.vrm` está em `dist/` (`scripts/build-notice.mjs`; não falha o build). Antes de publicar: crédito visível (já no rodapé), [LEGAL-REVIEW] de Avatar Use versus Model Use, e decisão registrada do usuário.

### CSP e `blob:`
O `connect-src` do build é `'self' blob:`. Motivo medido: o GLTFLoader cria `blob:` URLs para as texturas embutidas e o ImageBitmapLoader (Chrome/Edge) as lê com `fetch()`; com só `'self'` o navegador bloqueia ("Connecting to 'blob:...' violates ... connect-src") e o modelo não carrega. `blob:` é só do próprio documento; `data:` e http(s) de terceiros continuam proibidos (a urlPolicy depende de `data:` não estar permitido).

## Quais sinais o texto aciona
Léxico em `src/signs/dictionary.ts` (LEXICON): oi/olá, tudo bem, por favor, obrigado(a), desculpa/desculpe, banheiro, água, comer (e flexões da tabela), sim, não, dúvida/pergunta. Letras A, L e Y são acionadas pela soletração de palavras desconhecidas (a palavra "a" é descartada como artigo, então a letra A isolada não é acionável). `ESPACO_NEUTRO` e `TROCA_PAPEL` existem só no painel "Sinais de demonstração". Demais letras: "sem sinal" (avisado na tela, não animado).

## Versionamento
`.gitignore` ignora `node_modules`, `dist`, `*.log` e `public/models/*.vrm` (o modelo não é redistribuído até decisão do usuário). `docs/` (registro de instalações e reviews) fica versionado. O personagem antigo (`legacy/character.fbx`, `modelo/character.fbx`) tem licença não resolvida (PRIV-005): não publicar.

## Decisões de UX/privacidade (rodada 2)
- **Tradução automática da fala (PRIV-009):** mantida de propósito, para o fluxo ser rápido. Para não contradizer isso, o rótulo diz que a tradução começa sozinha, o texto reconhecido fica visível e editável no campo, e "Parar" fica sempre à mão (no painel e flutuando sobre o avatar). Alternativa descartada: exigir confirmação antes de animar (mais um clique para cada frase). Reavaliar com usuários reais.
- **Rascunho digitado (PRIV-010 / REV-011):** se a fala substituir um texto digitado, aparece "Restaurar o texto digitado antes" (só em memória; some ao editar ou enviar). Falas seguidas não substituem o rascunho guardado: o botão sempre restaura o que foi digitado.
- **Palavras de ligação (PRIV-011, refinado na rodada 3):** artigos, preposições e verbos de ligação removidos pela glosa NUNCA são escondidos: aparecem listados na região de status (fora do painel recolhível). Com sinal exibido e só palavras de ligação omitidas, o nível é informativo (sem "ATENÇÃO"). O aviso forte "ATENÇÃO: a mensagem NÃO foi transmitida por inteiro" fica para perda de conteúdo: letra sem sinal, texto ou frase truncados. Se nada puder ser mostrado, o aviso é de nível alerta, mesmo havendo glosas só soletradas.

## Modo IA (API local, opcional) e datilologia A-Z
- **Padrão: modo local.** Nada sai do navegador (além do reconhecimento de fala do navegador, se você usar o microfone). A chave "Usar IA" vem DESLIGADA.
- **"Usar IA" ligada:** o texto que você manda traduzir é enviado por `POST /v1/translate` à API local (`api/`, só 127.0.0.1) e, dela, a um provedor externo de modelo de linguagem. Use só frases de teste. O navegador sempre fala com a mesma origem (`/v1`); o Vite encaminha (`server.proxy` e `preview.proxy` -> `http://127.0.0.1:8000`), então a CSP continua `connect-src 'self' blob:`, sem relaxar. O app usa `credentials: 'omit'`, timeout de 10 s e valida a resposta no front (ids de sinal precisam existir em `SIGNS`; poses sempre vêm do front). Qualquer falha (timeout, API fora, 4xx/5xx, resposta inválida) cai no tradutor local e mostra "Modo local (API indisponível)".
- **Fala com IA ligada (PRIV-009 reaberto só neste modo):** a transcrição NÃO é traduzida/enviada automaticamente; ela vai para o campo de texto e você precisa clicar em "Mostrar em sinais". Com a IA desligada, a tradução da fala continua automática (decisão da rodada 2).
- **Sinais gerados por IA** (chave secundária, experimental, só habilitada com a primeira): são poses inventadas por um modelo, NÃO são Libras e podem estar erradas. O front revalida tudo (whitelist de ossos VRM, clamp de ângulos, NaN/Infinity, 2 a 6 keyframes, 400 a 2500 ms, máx. 4 por frase); item inválido vira datilologia com aviso. Rótulo permanente em texto durante a reprodução e no resultado ("Gerado por IA, NÃO é Libras, pode estar errado"). Ids `GEN_*` nunca entram em `SIGNS`.
- **Datilologia A–Z completa** (`src/signs/handshapes.ts`, `letters.ts`): 26 poses estáticas aproximadas (~700 ms cada, dedos relaxam no fim para separar letras repetidas). H, J, X e Z usam um movimento simples do punho/dedo; "Ç" é normalizada para "C"; dígitos continuam sem pose (aviso mantido). São aproximações NÃO validadas por intérprete de Libras.
- Para subir a API: ver `api/README.md` (`uvicorn` em 127.0.0.1:8000). A API lê `api/.env` ao iniciar; configure `LLM_PROVIDER` e chaves lá ou por variável de ambiente.

## Subir tudo com Docker Compose (local, sem publicação)
Sobe web + API + 9router só em `127.0.0.1`. Pré-requisitos: Docker com Compose v2; `api/.env` criado (a partir de `api/.env.example`); `public/models/Seed-san.vrm` presente (sem ele o build passa, mas o avatar não carrega); um `.env` na raiz criado de `.env.example` com `NINEROUTER_SECRETS_FILE` apontando para o arquivo de segredos do 9router (fora do repositório; barras normais, caminho absoluto). Nenhum segredo vai para `compose.yaml`, Dockerfiles ou imagens (`api/.env` e `.env` ficam fora dos contextos de build; a API recebe `api/.env` só como variáveis de ambiente em tempo de execução).

```powershell
docker stop 9router-poc          # a porta 20128 é a mesma; o compose cria o PRÓPRIO container do 9router
docker compose up --build
```
- Front: http://127.0.0.1:5180 (o nginx encaminha `/v1` à API) · API: http://127.0.0.1:8000 (`/readyz`) · 9router: http://127.0.0.1:20128. `LLM_BASE_URL` é forçado a `http://9router:20128/v1` dentro do compose; as demais variáveis vêm de `api/.env`.
- **Chave do 9router (leia antes):** o volume externo `9router-poc-data` está VAZIO: o container `9router-poc` foi criado com `DATA_DIR` corrompido pelo Git Bash (`C:/Program Files/Git/app/data`), então banco e chave estão na camada gravável DESSE container (`/app/C:/Program Files/Git/app/data`), não no volume. O compose usa `DATA_DIR=/app/data` (o volume). Para não perder a chave, com o `9router-poc` ainda existente rode UMA vez (PowerShell; copia, não apaga): `docker exec 9router-poc sh -c 'cp -a "/app/C:/Program Files/Git/app/data/." /app/data/'` e confira com `docker exec 9router-poc ls -la /app/data`. Só depois pare/remova o container. Use o mesmo arquivo de segredos (inclui `MACHINE_ID_SALT`).
- Parar sem apagar dados: `docker compose down` (NÃO use `-v`; o volume é `external`, o compose nunca o remove). Remover imagens: `docker rmi genai-libras-api:local genai-libras-web:local`.
- Primeira execução baixa/gera (estimativa de tamanho comprimido, amd64): 9router ~301 MB (já local, 1,34 GB em disco); `python:3.13-slim` ~43 MB; `node:24-alpine` ~63 MB (só build); `nginx-unprivileged:alpine` ~26 MB, mais pacotes da API (PyPI, ~49 pacotes com hash) e do front (npm, `pnpm install --frozen-lockfile`).
- A imagem `genai-libras-web:local` CONTÉM o `Seed-san.vrm`: uso local; não publique a imagem (ver "Aviso sobre `dist/`").
- Rede: `backend` (internal) liga web, API e 9router; só o 9router está também em `egress` (internet). API e web ficam em `publish` apenas para poder publicar portas em 127.0.0.1 (redes internal não publicam), o que lhes dá rota de saída teórica; nada escuta fora de loopback.
- Limite de taxa da API: atrás do nginx (ou do NAT do Docker Desktop) todos os clientes têm o mesmo IP para a API, então o limite por IP vira um limite global (aceitável para uso de uma pessoa). `X-Forwarded-For` não é confiado (uvicorn só aceita de 127.0.0.1).
- Estado: NÃO construído nem executado ainda (apenas `docker compose config` validado).

### Redis (cache de sinais gerados)
- Serviço `redis` (`redis:8.10-alpine`, fixado por digest): **não publica porta no host**, fica só na rede `backend` (internal, sem internet). A API recebe `REDIS_URL=redis://redis:6379/0`, `REDIS_PASSWORD` e `CACHE_TTL_S` (padrão 30 dias; sobrescreve o `api/.env`). `REDIS_PASSWORD` vem do `.env` da raiz (placeholder em `.env.example`; gere com `openssl rand -hex 24`, sem espaços/aspas). `ALLOW_GENERATED_POSES` continua vindo de `api/.env` (o compose não o sobrescreve): para usar sinais gerados e cacheá-los, deixe `ALLOW_GENERATED_POSES=true` lá.
- A API não depende do Redis para subir (`service_started`, `required: false`): se o Redis cair, a API segue sem cache. Persistência: AOF (`everysec`) no volume `libras-redis-data` (gerenciado pelo compose; `docker compose down -v` APAGA esse volume, mas não o `9router-poc-data`). Limite `maxmemory 128mb` com `allkeys-lru` (é cache regenerável: ao encher, descarta o menos usado em vez de recusar escritas). Comandos desativados: `FLUSHALL`, `FLUSHDB`, `CONFIG`, `DEBUG`, `KEYS`.
- Inspecionar sem expor porta (a senha vai por variável de ambiente, não pela linha de comando):
  `docker compose exec redis sh -c 'export REDISCLI_AUTH="$REDIS_PASSWORD"; redis-cli dbsize; redis-cli --scan | head'` (use `--scan`, não `KEYS`; `redis-cli ttl <chave>`, `redis-cli get <chave>`).
- Limpar o cache (sem `FLUSHDB`): `docker compose exec redis sh -c 'export REDISCLI_AUTH="$REDIS_PASSWORD"; redis-cli --scan | xargs -r -n 100 redis-cli unlink'`; ou, para zerar tudo: `docker compose stop redis`, `docker compose rm -f redis`, `docker volume rm libras-redis-data`.
- Backup: o dado é regenerável; se quiser copiar, com o serviço parado copie `/data/appendonlydir` do volume (`docker cp` de um container parado do serviço). O conteúdo pode incluir texto derivado de frases enviadas ao modelo: trate como dado do usuário.
- Estado: NÃO construído nem executado; só `docker compose config --quiet` (com senha de teste).
