# API do agente de Libras (POC local)

Contrato e decisoes: `../docs/api-design.md`. Isto e uma aproximacao nao validada por interprete de Libras. Servico so para uso local (127.0.0.1).

## Criar o ambiente (uma vez)
Requer o Python 3.13 ja instalado. O lock tem versoes exatas e hashes (gerado com `uv --no-config pip compile`).

```powershell
cd api
py -3.13 -m venv .venv
.venv\Scripts\python.exe -m pip --isolated install --only-binary=:all: --require-hashes --no-deps -r requirements.lock
```

Regerar o lock (so se mudar `requirements.in`):
`uv --no-config pip compile requirements.in --generate-hashes --only-binary :all: --python-version 3.13 --python-platform windows -o requirements.lock`

## Rodar
```powershell
cd api
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Nunca use `--host 0.0.0.0` e nao use `--reload` no uso normal. Por padrao `LLM_PROVIDER=fake` (sem rede, sem chave).

## Testes (sem token, sem rede)
```powershell
.venv\Scripts\python.exe -m pytest -q
```

## Variaveis (ambiente ou `api/.env`, que e git-ignorado; modelo em `.env.example`)
| Variavel | Padrao | Descricao |
|---|---|---|
| `LLM_PROVIDER` | `fake` | `fake` ou `openai_compatible` |
| `LLM_BASE_URL` | `http://127.0.0.1:20128/v1` | endpoint OpenAI-compativel |
| `LLM_API_KEY` | vazio | chave do endpoint; nunca no repositorio |
| `LLM_MODEL` | vazio | nome do modelo |
| `LLM_TIMEOUT_S` | `20` | timeout por chamada (1..120) |
| `LLM_OUTPUT_MODE` | `structured` | `structured` (function calling) ou `json_text` (JSON pedido no prompt; mais portavel se o modelo nao suportar tools) |
| `ALLOW_GENERATED_POSES` | `true` | permite sinais gerados por IA (o servidor ainda pode desligar com `false`) |
| `GENERATED_MAX_PER_PHRASE` | `12` | maximo de sinais gerados por frase (teto duro 20) |
| `GENERATED_CONCURRENCY` | `4` | descricoes (passo 2) em paralelo (1..8) |
| `GENERATION_BUDGET_S` | `40` | tempo total maximo do passo 2 por requisicao |
| `REDIS_URL` | vazio | ex.: `redis://redis:6379/0`; vazio = cache em memoria (some ao reiniciar) |
| `REDIS_PASSWORD` | vazio | senha do Redis, separada da URL (nunca logada) |
| `CACHE_TTL_S` | `0` | validade das entradas em segundos; 0 = sem expiracao |
| `CACHE_VERSION` | `1` | aumente para invalidar todo o cache gerado a mao |
| `RATE_LIMIT_PER_MIN` | `30` | por IP, em memoria |

`LANGCHAIN_TRACING_V2` / `LANGSMITH_TRACING` precisam ficar desligados: o servico recusa iniciar se estiverem ligados (o texto do usuario sairia da maquina).

## Apontar para o 9router
```powershell
$env:LLM_PROVIDER = "openai_compatible"
$env:LLM_BASE_URL = "http://127.0.0.1:20128/v1"
$env:LLM_API_KEY  = "<chave criada no painel do 9router>"
$env:LLM_MODEL    = "<nome de modelo que o painel mostrar>"
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
(ou ponha as mesmas linhas em `api/.env`). Esta integracao NAO foi testada contra o 9router real: so com FakeProvider e simulacoes. Se o modelo escolhido nao suportar tool calling, use `LLM_OUTPUT_MODE=json_text`.

## Erros
Formato `{ "error": { "code", "message" } }`, sem eco do texto. 400 JSON invalido, 413 texto > 500 caracteres (ou corpo > 8 KB), 422 requisicao invalida, 429 limite de taxa, 502 `provider_unavailable`, 503 `provider_quota` / `provider_circuit_open`, 504 `provider_timeout`. Para o front, 502/503/504 = usar o fallback local. Saida invalida do LLM nao e erro: a API responde 200 com `source: "local-fallback"` e um aviso.

## Privacidade e seguranca (minimo do POC)
O texto do usuario nunca e logado (so tamanho, latencia, status); a saida do LLM e sempre validada (`agent/validate.py`); excecoes do SDK nao sao propagadas (so o tipo do erro). Sem docs/openapi expostos.

## Vocabulario
`vocabulary/vocabulary.json` e gerado de `../src/signs/dictionary.ts`: `.venv\Scripts\python.exe scripts\gen_vocabulary.py` (`--check` verifica divergencia; um teste tambem confere). Tambem: `scripts\gen_bones.py` (ossos) e `scripts\gen_handshapes.py` (configuracoes de mao), ambos com `--check`.

## Agente de dois passos e sinais gerados (Adendos 1 e 2)
Para palavras fora do vocabulario curado (ligado por padrao; `ALLOW_GENERATED_POSES=false` no servidor ou `options.allowGenerated=false` no pedido desliga tudo e a palavra vira datilologia):
1. **Passo 1 (glosa):** o LLM traduz a frase para a ordem de glosa de Libras e devolve itens `sign` (id curado, sempre preferido), `generate` (lema sem sinal), `fingerspell` (nomes, siglas, digitos) e `omitted`. O LLM nao escolhe angulos.
2. **Passo 2 (descricao):** para cada lema sem sinal e fora do cache, o LLM devolve uma descricao PARAMETRICA de enums fechados (`schemas/description.py`: mao dominante, uma/duas maos, configuracao de mao A-Z do front, local no corpo, palma, trajetoria, direcao, contato, sobrancelha, emocao, boca). `agent/compiler.py` (deterministico) converte em keyframes, que passam pelo validador estrito (`schemas/generated.py`: 42 ossos, clamp por faixa anatomica, 2-6 keyframes, 400-2500 ms, id `GEN_`, label `(gerado por IA)` montado no servidor).

Descricoes em ate `GENERATED_CONCURRENCY` threads; uma falha so rebaixa aquela palavra para datilologia, com aviso `generated_unavailable` ou `generated_rejected`. Acima do limite por frase: `generated_limit`.

Resposta: itens `{ "kind":"generated", "origin":"generated", "word":"cachorro", "cached":false, "params":{...enums...}, "sign":{...} }`, sempre com `generated_not_libras` como primeiro aviso e `incomplete: true`. NAO e Libras validada.

```
curl -s -X POST http://127.0.0.1:8000/v1/translate -H "Content-Type: application/json" -d "{\"text\":\"Oi cachorro\"}"
```

### Cache (Redis)
Porta `CacheStore` (`adapters/cache.py`): `InMemoryCache` (testes, ou `REDIS_URL` vazio) e `RedisCache` (redis-py; so `GET` e `SET ... EX`, nunca KEYS/CONFIG/FLUSH). Chave `libras:gen:v<CACHE_VERSION>:<hash12>:<lema>`; o hash cobre prompt do passo 2, enums, tabela de maos, tabelas do compilador e lista de ossos, entao mudar qualquer um invalida as entradas antigas sozinho. Valor: sinal compilado, params, nome do modelo, `created_at`, `validated: false`. Nunca guarda a frase, a ordem da glosa, IP ou outro texto alem do lema. A leitura e revalidada com o validador estrito (entrada adulterada vira miss). Redis fora do ar, lento ou evictando nunca falha a traducao (fail open; apos 3 erros seguidos o cache e ignorado por 30 s); o log tem so contagens (`generated cache hits=.. misses=.. stored=.. invalid=.. errors=..`). Nao ha endpoint de estatisticas.

### Tabelas do compilador (aproximacoes nao validadas)
`schemas/handshapes.json` e gerado de `../src/signs/handshapes.ts`. Locais, palmas e trajetorias estao em `agent/compiler.py` (escritos a mao porque o front nao tem dados equivalentes); `tests/test_compiler.py` compila combinacoes de enums e exige que o validador nao precise corrigir nada, protegendo contra deriva. Lacunas: so existem as 26 configuracoes de mao A-Z (sem "5 aberta", garra etc.); boca e guardada em `params` mas o front nao a renderiza.

### Limites (validador estrito)
Osso desconhecido, NaN/Infinity, tipo errado ou |angulo| > 2*pi rejeitam; demais angulos sofrem clamp (faixas no docstring de `schemas/generated.py`); 2-6 keyframes; `time` crescente de 0 a 1; `duration` 400..2500 ms; `face` so com os valores do front. Sem correcao criativa: invalido vira datilologia com aviso.

