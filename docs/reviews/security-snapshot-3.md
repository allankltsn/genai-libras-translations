# Revalidacao de seguranca - delta snapshot-2 -> snapshot-3

Revisor: especialista security (independente do autor; somente leitura). Model: standard.
Snapshot: docs/reviews/snapshot-3.sha256; sha256sum -c: todos conferem. Delta confirmado por diff dos dois manifestos: README.md, index.html, src/main.ts, src/styles.css, src/translation/{glosser,translate,translation.test}.ts, src/ui/{ui,messages,messages.test}.ts e novos src/ui/draft.ts e draft.test.ts. Nada instalado; build limpo em diretorio temporario fora do projeto (dist/ nao existe no projeto).

## Tabela

| Verificacao | Resultado | Evidencia |
|---|---|---|
| innerHTML/eval/new Function/storage/console/rede novos | OK, nenhum | grep em src, index.html, vite.config.ts: sem innerHTML/outerHTML/insertAdjacent/eval/Function/document.write/localStorage/sessionStorage/indexedDB/console/fetch/XHR/WebSocket/sendBeacon/getUserMedia/cookie/postMessage/import(). Unicas ocorrencias: texto de aviso e comentarios. |
| DraftKeeper so em memoria | OK | draft.ts: um campo privado string|null, sem I/O; replace/undo/discard; descartado ao editar (input) e ao enviar (submit); valor restaurado vai so ao value do textarea. Nenhuma persistencia, log ou rede. |
| Handlers novos (skip link, #stop-float, undo) | OK, sem injecao | skip: preventDefault, reabre painel e foca o campo (sem ler href/URL). #stop-float: mesmo handler de onStop do botao existente. undo: escreve o rascunho em input.value (propriedade, nao HTML). Textos de saida seguem via textContent. Sem atributos on* ou style inline no HTML do build. |
| Glosser/translate | OK | Sem RegExp novo/perigoso identificado (tabelas e Set/Map); alteracoes de mensagem/aviso, sem I/O. Leitura dirigida, nao revisao de logica integral. |
| CSP do build | Ainda estrita | Build limpo: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; media-src 'self'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'. Um unico <script> (modulo externo); sem <style>/style=/on*=. URLs no bundle: so namespace xhtml e string de referencia jcgt.org do three. Identica ao snapshot-2. |
| package.json / package-lock / .npmrc | Inalterados | sha256 iguais aos do snapshot-2: package.json 2d75d9af..., package-lock.json bd772eb6..., .npmrc ad0e4e77.... FBX tambem inalterado (d9ce58c8...). Nenhum pacote novo. |
| npm audit | OK | found 0 vulnerabilities. |
| Achados anteriores | Sem regressao | Estado dos SEC-001..009 do relatorio snapshot-2 inalterado (consentimento, urlPolicy, headers documentados no README). |

## Findings novos
Nenhum.

## Veredito do delta: APROVADO
O delta nao introduz superficie nova de ataque, vazamento, persistencia nem dependencia. Aprovacao humana e separada.

## Nao verificado
- Comportamento em navegador real (skip link, foco, CSP em runtime, dialog, Web Speech).
- Logica completa de glosser/translate e dos testes (so padroes perigosos e leitura dirigida).
- Cabecalhos reais de hospedagem; conteudo binario do FBX (inalterado); npm audit signatures.
