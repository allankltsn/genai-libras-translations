# Security: proposta de instalacao da API Python (FastAPI + LangChain + adapter Gemini)

Fase: proposta (policies/installations.md, procedimento passo 1). Papel: security, modo review. Modelo: standard.
Data da consulta: 2026-10-30. Nada foi instalado nem baixado alem de metadados (JSON do PyPI, pypistats, OSV, `uv --help`). Nenhum pacote foi executado. Unico arquivo escrito no projeto: este. Temporarios (scripts e JSON de metadados) ficaram no scratchpad da sessao, fora do projeto.

## 1. Recomendacao

**APROVAR COM CONDICOES** a opcao A (a pedida pelo usuario: FastAPI + LangChain + adapter Gemini), com as condicoes da secao 8.
**ALTERNATIVA MENOR** a registrar para decisao do usuario (nao decido por ele): opcao C (sem LangChain, `google-genai` direto): 31 pacotes em vez de 48, sem langsmith, sem langchain-core, sem o historico de advisories do LangChain. Ver secao 4.

Condicao de bloqueio de fato: `certifi 2026.7.22` (a versao que o criterio de "mais de 2 semanas" escolheria) esta AFETADA por advisory CRITICAL publicado em 2026-10-20 (GHSA-6q48-6c7w-9gw2 / PYSEC-2026-4320: certifi inclui raizes emSign com chaves intermediarias comprometidas; corrigido em 2026.10.18). Precisa de excecao documentada ou de esperar (secao 6).

## 2. Ambiente (somente leitura)
- Python 3.13.15 (`py -0p`: unico, `%USERPROFILE%\AppData\Local\Programs\Python\Python313`), pip 26.2.1, venv/ensurepip disponiveis. `pip list` global: so o pip.
- Config de pip: nao existe a pasta pip em AppData Roaming; nenhuma variavel PIP_* definida (so conferi nomes, nao valores); sem PYTHONPATH/VIRTUAL_ENV/UV_*. Mesmo assim usar `--isolated` (abaixo).
- `uv 0.13.0` ja existe na maquina (winget, `%USERPROFILE%\.local\bin\uv`; nao e instalacao desta tarefa). pip-tools nao existe e NAO deve ser instalado. Nao verifiquei a origem do binario do uv (pendencia).
- Nao ha `.venv`. O `.gitignore` atual nao tem `.venv/`: adicionar `.venv/`, `__pycache__/`, `.env`, `*.pyc`. Disco: 187 GB livres.

## 3. Lista proposta (opcao A), versoes fixas
Criterio: mais recente estavel publicada ha mais de 2 semanas (corte: publicada ate 2026-10-15), sem yank, sem pre-release, com wheel binaria para win_amd64 cp313 ou `py3-none-any`. A lista foi montada por um resolvedor aproximado meu a partir dos metadados `requires_dist` do PyPI (marcadores avaliados para Windows/py3.13). **O lock gerado pelo uv e que vale**; ele pode diferir em pontos menores e deve ser reconferido contra esta tabela.

Diretos (4): `fastapi==0.143.2` (2026-10-15), `uvicorn==0.54.0` (2026-09-25, SEM extra `[standard]`), `langchain-core==1.6.11` (2026-10-15), `langchain-google-genai==4.4.2` (2026-10-13).
Observacao: fastapi publica quase diariamente (0.162.0 em 2026-10-23); 0.143.2 esta no corte exato (15 dias). pytest 9.2.0 (2026-10-27) fica fora pela mesma regra.

Transitivos (44), versao e licenca: annotated-doc 0.0.5 (MIT), annotated-types 0.8.0 (MIT), anyio 4.15.1 (MIT), certifi 2026.7.22 trocado por **2026.10.18** (MPL-2.0; secao 6), cffi 2.1.1 (MIT-0), charset-normalizer 3.5.2 (MIT), click 8.5.0 (BSD-3), cryptography 50.0.2 (Apache-2.0 OR BSD-3), distro 1.9.0 (Apache-2.0), filetype 1.2.0 (MIT), google-auth 2.62.0 (Apache-2.0), google-genai 2.31.0 (Apache-2.0), h11 0.16.0 (MIT), httpcore 1.0.9 (BSD-3), httpcore2 2.13.1 (BSD-3), httpx 0.28.1 (BSD-3), httpx2 2.13.1 (BSD-3), idna 3.20 (BSD-3), jsonpatch 1.35 (BSD-3), jsonpointer 3.2.1 (BSD), langchain-protocol 0.0.19 (MIT), langsmith 0.14.9 (MIT), opentelemetry-api 1.45.1 (Apache-2.0), orjson 3.13.0 (MPL-2.0 AND Apache-2.0/MIT), packaging 26.3 (Apache-2.0 OR BSD-2), pyasn1 0.6.4 (BSD-2), pyasn1-modules 0.4.2 (BSD), pycparser 3.11 (BSD-3), pydantic 2.14.1 (MIT), pydantic-core 2.50.1 (MIT), pyyaml 6.0.3 (MIT), requests 2.34.2 (Apache-2.0), requests-toolbelt 1.0.0 (Apache-2.0), sniffio 1.3.1 (MIT/Apache-2.0), starlette 1.8.0 (BSD-3), tenacity 9.1.4 (Apache-2.0), truststore 0.10.5 (MIT), typing-extensions 4.16.0 (PSF-2.0), typing-inspection 0.4.4 (MIT), urllib3 2.8.0 (MIT), uuid-utils 0.17.1 (BSD-3), websockets 16.1.1 (BSD-3), xxhash 4.0.1 (BSD-2), zstandard 0.25.0 (BSD-3).
Total 48 pacotes. Licencas permissivas (MPL-2.0 em certifi e orjson: copyleft de arquivo, sem efeito como biblioteca).

Quem puxa o que: `langchain-core` puxa `langsmith` (cliente de tracing/telemetria da LangChain), e este puxa httpx2, httpcore2, truststore, orjson, zstandard, xxhash, requests-toolbelt, websockets, distro, uuid-utils (cerca de 11 pacotes que o app nao usa funcionalmente). `google-genai` puxa google-auth, que puxa cryptography, cffi, pycparser, pyasn1 e pyasn1-modules; e tambem requests, urllib3, charset-normalizer, tenacity, websockets, distro. `fastapi` puxa `opentelemetry-api` (so a API, sem exportador).

Dev (so teste, lock separado): `pytest==9.1.1` (2026-06-19), `pluggy==1.7.0` (2026-10-15, no limite; preferir 1.6.x se o lock aceitar), `iniconfig==2.3.1`, `pygments==2.21.0`, `colorama==0.4.6`. `httpx` (TestClient do FastAPI) ja esta na arvore. Sem pytest-asyncio.

**Nao incluir:** `langchain` (metapacote), `pydantic-settings` (puxa python-dotenv, que le arquivos `.env` e aumenta a chance de segredo em disco; `os.environ["GEMINI_API_KEY"]` basta), `uvicorn[standard]` (httptools, uvloop, watchfiles, python-dotenv, pyyaml), `fastapi[standard]` e `[all]`, extras do google-genai (aiohttp, local-tokenizer = torch/transformers).

## 4. Alternativas que reduzem superficie (mesmo resolvedor e regra de data, Windows/py3.13)

| Opcao | Diretos | Pacotes | Wheels (download) | Observacao |
|---|---|---|---|---|
| A (pedida) | fastapi, uvicorn, langchain-core, langchain-google-genai | 48 | 13,3 MB | Atende o pedido; langsmith e cryptography inclusos |
| B | fastapi, uvicorn, langchain-core + adapter proprio com httpx (REST Gemini) | 39 | 7,3 MB | Ganho pequeno (langsmith continua); codigo proprio sensivel. Nao recomendo |
| C | fastapi, uvicorn, google-genai | 31 | 10,3 MB | Sem LangChain: remove langchain-core, langsmith, jsonpatch, orjson, zstandard, xxhash. Mantem google-auth e cryptography |
| D | fastapi, uvicorn, httpx (REST direto) | 17 | 3,8 MB | Menor superficie, sem SDK Google; mais codigo proprio (retry, parsing, erros) |

**Tensao a registrar:** o usuario pediu LangChain; a opcao A traz 17 pacotes a mais que a C e o historico de advisories do LangChain (secao 5). Se LangChain for desejado mas nao exigido, C ou D reduzem risco e espaco. Se for exigido, A com as condicoes. Decisao do usuario. C migra para A depois se o adapter ficar atras de uma interface propria.

## 5. Evidencia (PyPI JSON, pypistats, OSV; 2026-10-30)

Downloads na ultima semana (pypistats recent): fastapi 122,2 M; starlette 159,4 M; uvicorn 148,1 M; pydantic 256,7 M; pydantic-core 251,4 M; httpx 179,5 M; pytest 218,9 M; cryptography 315,2 M; google-auth 102,0 M; google-genai 38,6 M; langchain-core 37,4 M; langsmith 22,1 M; langchain-google-genai 4,1 M (o menos adotado dos diretos).

Repositorios (campo project_urls; a API do PyPI nao expoe donos/mantenedores, entao a titularidade do projeto no PyPI NAO foi verificada): fastapi -> github.com/fastapi/fastapi; uvicorn -> github.com/Kludex/uvicorn; pydantic -> github.com/pydantic/pydantic; langchain-core -> github.com/langchain-ai/langchain; langchain-google-genai -> github.com/langchain-ai/langchain-google (libs/genai); google-genai -> github.com/googleapis/python-genai; httpx2 -> github.com/pydantic/httpx2. Nao li codigo-fonte de pacote algum nesta fase.

Atestado PEP 740 (endpoint de integridade do PyPI, 200 = existe): PRESENTE em pydantic 2.14.1, google-genai 2.31.0, uvicorn 0.54.0, starlette 1.8.0. AUSENTE (404) em fastapi 0.143.2, langchain-core 1.6.11, langchain-google-genai 4.4.2, httpx2 2.13.1. Demais transitivos nao consultados. Presenca nao verificada criptograficamente.

Scripts de instalacao: todos tem wheel py3-none-any ou nativa win_amd64 cp313; com --only-binary=:all: nao ha setup.py nem build na instalacao. Extensoes nativas (10): pydantic-core, cryptography (3,8 MB), cffi, charset-normalizer, orjson, pyyaml, uuid-utils, websockets, xxhash, zstandard.

Advisories (OSV por pacote+versao exata, 2026-10-30):
- Nenhum afeta as versoes propostas de: fastapi (3 historicos, 2021/2024), uvicorn (4, 2020), pydantic (4), pydantic-core (0), starlette 1.8.0 (20 historicos; DoS multipart e Range de 2026-07-07, anteriores a 1.8.0), langchain-core 1.6.11 (18 historicos; 2026-07-13: desserializacao via allowlist de load() corrigida em 1.3.3, validacao de f-string em templates, SSRF em contagem de tokens), langchain-google-genai (0), google-genai (0), langsmith 0.14.9 (7 historicos; 2026-07-13: SSRF por header de tracing, bypass de redacao em streaming, desserializacao de prompt publico; corrigidos em 0.7.31 ou antes), google-auth (0), cryptography 50.0.2 (42 historicos, ultimos 2026-08-04), requests 2.34.2 (16), urllib3 2.8.0 (44, ultimos 2026-10-01), anyio 4.15.1 (ultimos 2026-10-01), pyyaml, orjson, websockets, httpx, h11, idna, pygments, pytest e demais testados: 0 afetando.
- **AFETA: certifi 2026.7.22** (2 IDs, CRITICAL; corrigido em 2026.10.18).
- Limite: OSV pode atrasar frente ao GHSA. Reexecutar OSV com o lock no dia da instalacao. pip-audit nao esta instalado: nao instalar.
- Leitura: langchain-core e langsmith concentram advisories de 2026 em classes relevantes aqui (desserializacao, injecao em template, SSRF, vazamento via tracing). Nenhum aberto para as versoes propostas.

## 6. Excecao necessaria: certifi
`certifi` e dependencia de httpx e requests (TLS ate o Google). Versoes: 2026.7.22 (afetada), 2026.10.18 (corrigida, 12 dias), 2026.10.19, 2026.10.23. Opcoes (decisao do usuario):
1. Esperar ate 2026-11-02 (a 2026.10.18 passa de 2 semanas) e gerar o lock entao. Sem excecao; risco pratico baixo no intervalo (a API do Google nao usa raizes emSign).
2. Excecao documentada ja: certifi==2026.10.18 (12 dias, abaixo do criterio), registrada como desvio.
Nao recomendo manter 2026.7.22. Reconferir no dia do lock se 2026.10.19/10.23 corrigem algo adicional.

## 7. Lock verificavel, instalacao e remocao (nada global; pip-tools NAO instalar)

**Gerar o lock com o uv que ja existe (resolve e escreve texto; nao instala pacote):**

    # requirements.in (diretos fixados):
    #   fastapi==0.143.2
    #   uvicorn==0.54.0
    #   langchain-core==1.6.11
    #   langchain-google-genai==4.4.2
    #   certifi==2026.10.18        (secao 6)
    uv --no-config pip compile requirements.in --generate-hashes --only-binary :all: --python-version 3.13 --python-platform windows --exclude-newer 2026-10-15T23:59:59Z --exclude-newer-package certifi=2026-10-19T00:00:00Z --cache-dir PASTA_TEMPORARIA_FORA_DO_PROJETO -o requirements.lock

Confirmar a sintaxe de --exclude-newer-package na ajuda do uv 0.13.0 antes. --no-config evita ler config global do uv. O uv acessa so pypi.org e files.pythonhosted.org e pode baixar wheels para ler metadados: isso e download e exige aprovacao do usuario, mesmo sem instalar. A pasta de cache e temporaria, deve ser registrada e apagada.
Verificacao independente (reviewer, sem instalar): (a) todo item tem == e --hash=sha256:; (b) cada hash confere com digests.sha256 da API JSON do PyPI; (c) nenhum nome fora da tabela da secao 3 (diferenca = achado); (d) nenhuma --index-url, --extra-index-url, git+ ou URL direta; (e) cada versao com data ate o corte (exceto certifi, se opcao 2). Rascunho de resolvedor e consulta OSV existe no scratchpad da sessao e pode ser reaproveitado.
Dev: requirements-dev.in (pytest==9.1.1) gera requirements-dev.lock pelo mesmo comando.

**Instalar (so apos aprovacao explicita):**

    python -m venv .venv
    .venv\Scripts\python.exe -m pip install --isolated --no-cache-dir --disable-pip-version-check --require-hashes --only-binary=:all: --no-deps -r requirements.lock
    .venv\Scripts\python.exe -m pip check
    .venv\Scripts\python.exe -m pip freeze    (comparar com o lock, nada extra)

--isolated ignora variaveis e config do pip; --no-cache-dir evita duplicar wheels no cache do pip do usuario; --only-binary proibe build de sdist; --require-hashes e --no-deps impedem pacote fora do lock. Sempre usar o python do venv pelo caminho. Dev: mesmo comando com requirements-dev.lock.

**Tamanho em disco** (estimativa, nao medida): wheels baixados 13,3 MB (A) + 2,4 MB (dev); .venv instalado cerca de 60-90 MB (+ ~5 MB do pytest). Opcao C estimada em 40-60 MB.
**Remocao:** apagar .venv, requirements*.in e .lock se desistir, e a pasta de cache do uv. Registrar a remocao.

## 8. Condicoes da aprovacao (A)
1. Aprovacao explicita do usuario da lista exata do lock final (nao desta tabela aproximada) e do eventual download de wheels pelo uv pip compile.
2. Resolver certifi (secao 6) antes do lock.
3. Lock com hashes + verificacao independente (secao 7) antes de qualquer pip install; reexecutar OSV no dia.
4. LangChain sem tracing: LANGSMITH_TRACING=false e LANGCHAIN_TRACING_V2=false, nunca definir LANGSMITH_API_KEY nem LANGCHAIN_API_KEY; teste automatizado que falha se tracing estiver ativo. langsmith e dependencia obrigatoria de langchain-core: mesmo desativado, o codigo esta presente.
5. Uso proibido de LangChain: langchain_core.load.load e loads, hub.pull e prompts de terceiros, templates de prompt vindos do usuario ou f-string com entrada do usuario como template (so templates fixos no codigo, entrada apenas como variavel), loaders de documentos e ferramentas com rede, arquivo ou shell. Sem agentes.
6. Pos-instalacao: listar arquivos .pth, entry points de console scripts e RECORD dos wheels nativos; ler o wheel de langchain-google-genai (82 KB) e confirmar que a chave so vai ao host do Google, em header e nao na URL, e que erros e logs do SDK nao incluem chave nem prompt. Restringir saida de rede a generativelanguage.googleapis.com se possivel.
7. Segredo: GEMINI_API_KEY somente em variavel de ambiente do processo (nao .env, nao argumento de CLI, nao log, nao resposta de erro; SecretStr); .gitignore com .env. Chave dedicada, com cota e restricao, revogavel. Privacidade do que vai ao Gemini: ver docs/reviews/privacy-consulta-api-gemini.md (a camada gratuita pode permitir uso para treino; decidir o plano antes de enviar dado pessoal).
8. API: uvicorn em 127.0.0.1, sem --reload nem [standard]; docs_url e openapi_url desativados fora de desenvolvimento; limite de corpo e de taxa; CORS restrito; autenticacao e autorizacao antes de expor a qualquer rede (revisao de codigo separada); logs sem corpo de requisicao.
9. Revisao de seguranca sobre o snapshot com o codigo da API e leitura (nao so metadados) dos diretos antes de uso real.
10. Versoes por hash; atualizacao so por novo ciclo de proposta; nunca >=.

## 9. Riscos especificos
- R1 LangChain: alta rotatividade (langchain-core de 1.6.10 a 1.7.3 em cerca de 3 semanas) e 18+7 advisories historicos em core e langsmith, varios em 2026. Mitigacao: poucos recursos, versao fixa, condicoes 4 e 5.
- R2 Telemetria (langsmith): inativa por padrao; se ligada por variavel de ambiente, enviaria prompts e respostas a terceiro. Nao verificado no codigo nesta fase (so metadados).
- R3 Ecossistema grande: 48 pacotes, 10 nativos; httpx2 e httpcore2 sao novos (2026-09-23, org pydantic, puxados por langsmith; OSV lista 10 historicos no nome httpx2, nenhum afetando 2.13.1).
- R4 Sem PEP 740 em fastapi, langchain-core, langchain-google-genai: so PyPI + hash como garantia de origem.
- R5 langchain-google-genai tem a menor adocao (4,1 M por semana) e e mantido pela langchain-ai, nao pelo Google; o SDK oficial e google-genai (opcao C).
- R6 Dados do usuario saem para o Google: tratar na camada de privacidade.
- R7 Advisory critico em certifi (secao 6).
- R8 Metadados do PyPI e OSV podem estar atrasados: lock e hash sao a defesa.

## 10. O que o registro de instalacoes deve conter
Secao "Rodada API Python" com: data; aprovador e texto da aprovacao; comandos exatos (secao 7) incluindo --isolated e --no-cache-dir; Python 3.13.15 e pip 26.2.1; fonte pypi.org; escopo .venv do projeto; por pacote (48 + 5 dev): versao, data de publicacao, licenca e hash (ou referencia a requirements.lock com o sha256 do proprio lock); contagem esperada x instalada (pip freeze) e resultado do pip check; downloads semanais com data (secao 5); presenca ou ausencia de PEP 740; resultado OSV do dia; a opcao escolhida para certifi e o desvio, se houver; arquivos criados e alterados (requirements.in e .lock, requirements-dev.*, .venv/, .gitignore); tamanho real do .venv (du -sh); remocao (apagar .venv); verificacao (import dos 4 diretos, pytest); temporarios fora do repositorio (cache do uv, scratchpad); uso do uv existente (nao instalado por esta tarefa, origem nao verificada); linhas em "Attempted but not installed" para langchain (metapacote), pydantic-settings, uvicorn[standard], pip-tools, pip-audit.

## 11. Limites desta revisao
Somente metadados e APIs publicas; nenhum codigo de pacote lido ou executado; titularidade no PyPI nao verificada; assinaturas PEP 740 nao verificadas criptograficamente; lista de transitivos aproximada ate o lock real; tamanhos estimados; OSV pode estar incompleto; docs/reviews/privacy-consulta-api-gemini.md apenas referenciado, nao relido em detalhe. Unico achado critico aberto: certifi (com correcao disponivel). Proximo dono: principal (levar ao usuario a decisao A x C e a opcao do certifi; depois o implementador gera o lock e security confirma sobre o snapshot do lock).
