# Revalidacao de seguranca - delta snapshot-3 -> snapshot-4

Revisor: especialista security (independente do autor; somente leitura). Model: standard.
Snapshot: docs/reviews/snapshot-4.sha256; sha256sum -c: todos conferem. Delta por diff dos manifestos: README.md, src/styles.css, src/translation/{glosser,translate}.ts, src/ui/{draft,draft.test,messages,messages.test,ui}.ts (igual ao informado). Nada instalado; build limpo em diretorio temporario fora do projeto (dist/ nao existe no projeto).

## Tabela

| Verificacao | Resultado | Evidencia |
|---|---|---|
| innerHTML/eval/Function/storage/console/rede novos | OK, nenhum | grep em src e index.html: sem innerHTML/outerHTML/insertAdjacent/createContextualFragment/DOMParser/srcdoc/eval/new Function/document.write/storage/indexedDB/console/fetch/XHR/WebSocket/sendBeacon/getUserMedia/cookie/postMessage/import(). Unicas ocorrencias: texto de aviso e comentario. |
| Palavras omitidas nunca viram HTML | OK | Fluxo: entrada -> tokenize (normalizeText, split) -> glossWithOmitted.omitted -> translate.omittedWords (Set) -> messages.ts (join(', ') em template string, max 10) -> ui.setStatus -> status.textContent. setStatus so usa textContent; classList.toggle com literais fixos (info/warn/error), nunca com dado do usuario; nenhum setAttribute com texto do usuario. Inclusive o texto "<img onerror=...>" apareceria como texto literal. |
| DraftKeeper so em memoria | OK | draft.ts: campos privados string|null e boolean; replace/undo/discard sem I/O, DOM, storage ou rede. Logica nova (fieldFromSpeech) so preserva o rascunho digitado em falas encadeadas; descartado ao editar/enviar. |
| package.json / package-lock / .npmrc | Inalterados | sha256 iguais aos do snapshot-3: package.json 2d75d9af..., package-lock.json bd772eb6..., .npmrc ad0e4e77... (nao constam no delta). Nenhum pacote novo. |
| npm audit | OK | found 0 vulnerabilities. |
| CSP do build | Intacta | Build limpo: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; media-src 'self'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'. URLs no bundle: so namespace xhtml e string de referencia jcgt.org do three. Identica ao snapshot-3. |

## Findings novos
Nenhum.

## Veredito do delta: APROVADO
O delta nao adiciona superficie de XSS, persistencia, vazamento, rede nem dependencia. Aprovacao humana e separada.

## Nao verificado
- Comportamento em navegador real (CSP em runtime, rendering das mensagens, Web Speech).
- Logica completa de glosser/translate e dos testes (so padroes perigosos e fluxo dos dados omitidos).
- Cabecalhos reais de hospedagem; FBX (inalterado); npm audit signatures.
