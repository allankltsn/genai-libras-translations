# Estado consolidado, snapshot-7 (avatar VRM Seed-san)

Vereditos sobre o snapshot-7: segurança APROVADO; conformidade APROVADO; técnica APROVADO; QA APROVADO COM RESSALVAS; privacidade COM RESSALVAS (aceitável como protótipo local).
Verificação do principal: snapshot-7.sha256 e hash do .vrm sem divergências; typecheck, lint e 94 testes passando; lock, workspace e .npmrc idênticos ao snapshot-6.

## Fechados nesta fase
Condições 3, 4, 6, 7 da proposta do three-vrm; REV-012, REV-013; PRIV-018, 019, 020; QA-025, 026; SEC-P-001.

## Abertos, baixos, agrupar na próxima rodada (junto do retorno visual do usuário)
- PRIV-022 (média): sem barreira técnica no .gitignore para legacy/*.fbx e modelo/*.fbx (Medea, licença não resolvida). Hoje o projeto não é repositório git.
- PRIV-023 / QA-028 (baixa): banner e rodapé maiores consomem altura em telas baixas; só medível em navegador.
- PRIV-024 (info): repetir o aviso de dist/ no registro de instalações.
- QA-029 (baixa, não alcançável hoje): startLoad retorna em silêncio se vrmModel existir.
- QA-027 (info): visemas usam as vogais do texto inteiro (estimativa já declarada).
- SEC-014, SEC-015 (info): links externos do rodapé; scripts/ fora do lint (comentário justificando a exceção; mover lógica para módulo testado se crescer).

## Dependem do usuário
1. Teste visual em navegador real (pnpm run dev, Chrome ou Edge): fecha REV-004 (eixos, dois lados, polegar, tronco, punho, interpenetração, todos os 17 sinais, vários quadros) e PRIV-015/023/QA-028 (layout, foco, leitor de tela, Web Speech, dialog).
2. SEC-012: confirmar que o node.exe em [::1]:5173 (vite dev, iniciado em 2026-10-30 11:39:56) é o servidor de desenvolvimento do próprio usuário.
3. REV-002: critério de adoção dos 8 pacotes antigos (dispensar e registrar o desvio, recomendado, ou autorizar consulta de downloads).
4. Antes de publicar: decisão explícita de publicar o .vrm (Redistribution), PRIV-021 [LEGAL-REVIEW] (Avatar Use versus Model Use, uso comercial), PRIV-005 (Medea, só se legacy/ ou modelo/ forem publicados), PRIV-002 (contato do responsável), PRIV-014/016 (validação com pessoas surdas e intérprete).

## Não verificado em navegador real
Carga do VRM sob a CSP do build (medida só pelo autor em Chrome headless), poses e dedos de 12 dos 17 sinais, expressões e visemas, layout do banner e do rodapé em tela estreita, dialog (foco, Esc), leitor de tela, Web Speech, bfcache, aviso do build em CI.
