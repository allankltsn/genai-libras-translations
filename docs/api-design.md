# API do agente de Libras (POC local)

Escopo: prova de conceito local, sem publicação. LGPD, permissões formais e `certifi` ficam para um segundo momento (decisão do usuário, 2026-10-30). Mantém-se só a segurança barata: chave fora do repositório, serviço só em 127.0.0.1, texto do usuário nunca logado.

## Objetivo
Receber um texto em português e devolver os dados para o avatar se mover. Cobertura ampla vem de **glosa por LLM sobre um vocabulário fechado** + datilologia; o LLM não inventa poses por padrão (poses geradas ficam atrás de flag, desligada).

## Stack e providers (padrão Adapter)
- Python + FastAPI + LangChain (langchain-core). Um único `LlmProvider` (porta) com implementações:
  - `FakeProvider`: determinístico, sem rede, para testes e desenvolvimento.
  - `OpenAICompatibleProvider`: fala com qualquer endpoint OpenAI-compatível, via `langchain-openai` (`base_url` + chave por variável de ambiente). Primeiro uso: o gateway **9router** local (`http://127.0.0.1:20128/v1`), que roteia para provedores gratuitos.
  - Gemini direto fica como adapter futuro (mesma porta).
- Seleção por `LLM_PROVIDER=fake|openai_compatible`. Configuração por variáveis de ambiente (`LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_TIMEOUT_S`, `ALLOW_GENERATED_POSES=false`). `api/.env` (no `.gitignore`) é aceito no POC; só `api/.env.example` vai ao repositório, sem segredos.

## Contrato v1
- `POST /v1/translate`: `{ "text": "1..500 chars", "options": { "allowGenerated": false } }`
- Resposta 200:
```json
{ "apiVersion": "1", "vocabularyVersion": "...", "source": "llm|local-fallback",
  "items": [
    { "kind": "sign", "id": "OI", "origin": "curated", "face": { "brows": "up" } },
    { "kind": "fingerspell", "word": "agua", "origin": "fingerspell" },
    { "kind": "omitted", "word": "de" }
  ],
  "glosses": ["OI", "soletrar: AGUA"], "warnings": [], "incomplete": false }
```
- `GET /v1/vocabulary` (ids, rótulos, versão), `GET /healthz`, `GET /readyz` (não chama o LLM).
- Erros: `{ "error": { "code", "message" } }`, sem eco do texto: 400, 413 (>500 chars), 422, 429, 502/503/504. Para o front, 502/503/504 = usar o fallback local.
- `origin`: `curated` (dicionário do projeto), `fingerspell`, `generated` (desligado por padrão, sempre rotulado "Gerado por IA. NÃO é Libras"). `validated` é reservado para quando um intérprete assinar.
- A API devolve **ids e palavras**; o front resolve com o próprio `SIGNS` e `fingerspell()` (fonte única das poses).

## Agente e validação
- Cadeia simples de um passo (prompt de sistema fixo + texto do usuário como dado delimitado + saída estruturada com schema pydantic). Sem ferramentas, sem acesso a rede/arquivos.
- O servidor valida a saída: `id` precisa existir em `vocabulary.json` (senão vira datilologia da palavra de origem), limites de tamanho, rejeição de saída inválida com fallback local. Nenhuma "correção criativa".
- Vocabulário: `api/vocabulary/vocabulary.json`, exportado dos 17 sinais atuais do front (ids e rótulos), com versão.

## Resiliência (mínimo para o POC)
Timeout curto, no máximo 1 retry com backoff e jitter só para falhas transitórias, circuit breaker simples, limite de taxa em memória. Sem cache persistente, sem banco, sem log de conteúdo (só tamanho, latência, status).

## Estrutura
```
api/
  pyproject.toml, requirements.in, requirements.lock (hashes), .env.example, README.md
  app/{main,config,deps}.py, app/routes/{translate,vocabulary,health}.py
  schemas/, vocabulary/vocabulary.json
  agent/{prompts,glosser,validate}.py
  adapters/{base,fake,openai_compatible,resilience}.py
  tests/
```

## Integração no front (segunda etapa)
Proxy do Vite `/v1 -> http://127.0.0.1:8000` (a CSP continua `connect-src 'self' blob:`), `apiClient.ts` com timeout e validação, opção "Usar IA" desligada por padrão com aviso curto, modo local sempre disponível como fallback.

## Adendo 1 (2026-10-30): item `generated` e datilologia A–Z
Contexto: a cobertura do vocabulário curado é pequena (11 sinais lexicais). Para não limitar o dicionário a uma lista fixa no POC, o agente pode, SOB OPT-IN e com rótulo permanente, gerar poses para termos sem sinal no vocabulário. Poses geradas por LLM NÃO são Libras validada e podem estar erradas; nunca são apresentadas como tradução correta.

- Request: `options.allowGenerated` (padrão `false`). O servidor só gera se `ALLOW_GENERATED_POSES=true` NO SERVIDOR **e** `allowGenerated=true` no pedido.
- Item novo:
```json
{ "kind": "generated", "origin": "generated", "word": "cachorro",
  "sign": { "id": "GEN_CACHORRO", "label": "cachorro (gerado por IA)", "duration": 1600,
            "keyframes": [ { "time": 0.4, "pose": { "rightUpperArm": {"x":0,"y":0,"z":0}, "...": {} } },
                           { "time": 1.0, "pose": { } } ],
            "face": { "brows": "up", "emotion": "neutral", "emotionWeight": 0.3 } } }
```
- Formato do `sign`: o mesmo de `SignDef` do front (`src/signs/types.ts`): keyframes com `time` em [0,1], monotônico, `pose` = `Partial<Record<CanonicalBone,{x,y,z}>>` em radianos (Euler XYZ relativos ao bind; convenção de eixos documentada em `src/signs/poseHelpers.ts`). Ossos permitidos: SOMENTE os 42 canônicos VRM do front (whitelist).
- Validação no servidor E no front (nunca confiar em um lado só): osso desconhecido rejeita o sinal; ângulos com clamp por faixa anatômica conservadora; NaN/Infinity rejeitam; 2 a 6 keyframes; `duration` entre 400 e 2500 ms; no máximo 4 itens `generated` por frase; sinal inválido vira datilologia/omitido com aviso. Sem "correção criativa".
- Sempre acompanha `warnings: ["generated_not_libras"]` e `incomplete: true`. Não é cacheado como verificado.
- Palavras fora do vocabulário SEM geração continuam virando `fingerspell`; com datilologia A–Z completa no front, a soletração é totalmente animada.
- Datilologia A–Z: dado do front (`src/translation/fingerspell.ts` + poses das letras), independente do LLM.

## Adendo 2 (2026-10-30): agente de dois passos, geração como caminho normal e cache Redis
Objetivo do usuário: sem limite de vocabulário. A geração passa a ser o caminho NORMAL para palavras fora do vocabulário curado (o curado continua vencendo; datilologia para nomes, siglas e dígitos). Continua POC: sem LGPD/permissões formais; segurança barata mantida.

- **Padrões:** `ALLOW_GENERATED_POSES=true` por padrão (o servidor pode desligar) e `options.allowGenerated` assume `true` quando omitido (o front pode enviar `false`). Só gera se as duas condições forem verdadeiras. Limite por frase configurável: `GENERATED_MAX_PER_PHRASE` (padrão 12, teto 20; substitui o 4 do Adendo 1); texto continua limitado a 500 caracteres.
- **Passo 1 (glosa, LLM):** ordem de glosa de Libras (sem conectivos, verbos no infinitivo, tempo primeiro, tema-comentário). Itens: `sign` (id curado), `generate` (lema: minúsculas, sem acento, a-z0-9), `fingerspell`, `omitted`; dica de face opcional. Lema de conectivo vira `omitted`; lema coberto pelo vocabulário vira `sign`. O LLM não informa ângulos (o antigo `kind: generated` com keyframes vindos do LLM é descartado).
- **Passo 2 (descrição, LLM, por lema não curado e fora do cache):** descrição PARAMÉTRICA com enums fechados (mão dominante, 1/2 mãos, configuração de mão A-Z do front, local, palma, trajetória, direção, contato, sobrancelha, emoção, boca). Compilador determinístico em Python (`api/agent/compiler.py`) gera o `sign` (SignDef), que passa pela validação estrita do Adendo 1 (42 ossos, clamp, 2-6 keyframes, 400-2500 ms, `GEN_`, rótulo "(gerado por IA)" montado no servidor). Concorrência limitada (4); uma falha rebaixa só aquela palavra para datilologia com aviso (`generated_unavailable` / `generated_rejected`); acima do limite, `generated_limit`.
- **Contrato v1 (só campos aditivos):** o item `generated` ganha `cached: bool` e `params` (enums, depuração). Sempre `warnings[0] == "generated_not_libras"` e `incomplete: true` quando há gerado. Nenhum endpoint público novo.
- **Cache (Redis, porta/adapter):** `CacheStore` com `InMemoryCache` (sem `REDIS_URL`) e `RedisCache`. Chave `libras:gen:v<CACHE_VERSION>:<hash12>:<lema>` (hash do prompt do passo 2, enums, tabelas e ossos: mudou, invalida). Valor: sinal + params + modelo + `created_at` + `validated: false`. Nunca guarda frase, ordem da glosa, IP ou texto além do lema. Leitura revalidada com o validador estrito. Falha, lentidão ou evicção do Redis nunca falha a tradução (fail open; miss é normal); só log de contagens, sem conteúdo. `CACHE_TTL_S` (0 = sem expiração; o compose usa 30 dias), `REDIS_PASSWORD` separada da URL.
- **Limites conhecidos:** só existem as 26 configurações de mão A-Z no front; boca não é renderizada; todas as tabelas do compilador são aproximações não validadas por intérprete. Poses geradas NÃO são Libras validada e o cache não as torna verificadas.
