# Estado consolidado, snapshot-4

Vereditos sobre o snapshot-4: QA APROVADO COM RESSALVAS; conformidade APROVADO; técnica APROVADO; segurança APROVADO; privacidade COM RESSALVAS.
Verificação do principal: snapshot-4.sha256 sem divergências; typecheck, lint e 79 testes passando; package.json, lock e .npmrc idênticos ao snapshot-3.

## Fechados
QA-001..023, REV-001 (retirado), 003, 005..011, SEC-001, 003, 005, 007, PRIV-001, 003, 004, 008, 009, 010, 011, 013.

## Abertos, não bloqueantes para protótipo local
- QA-024: revisar a lista de stopwords (foi, era, que, esta) com intérprete de Libras.
- PRIV-016: nota 'info' depende de leitura de português e de cor; validar com pessoas surdas.
- PRIV-017: `translate.ts` descarta em silêncio sinal do léxico sem entrada em SIGNS; falta teste de consistência LEXICON x SIGNS.
- PRIV-014: tradução automática sem confirmação para público surdo; validar antes de piloto.
- SEC-002/004/006/008/009, PRIV-002/006/007/012/015: documentados ou parciais.

## Dependem do usuário
1. Modelo carregável (FBX 6100 não abre): reexportar FBX 7.4 binário ou GLB (opção A, recomendada), converter (B) ou parser próprio (C).
2. PRIV-005: origem e licença do personagem e das texturas (LEGAL-REVIEW). Bloqueia publicação.
3. REV-002: dispensar o critério de adoção dos 8 pacotes e registrar o desvio de ordem (recomendado), ou autorizar consulta de downloads.
4. REV-004: eixos locais Mixamo, só verificável com o modelo carregando.

## Sem verificação por falta de navegador
Renderização WebGL, resize, sobreposição do #stop-float no mobile, <dialog> (foco, Esc), leitor de tela, Web Speech real, bfcache, cor da nota info, visual das poses.
