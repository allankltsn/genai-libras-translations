# Gate de privacidade, revalidação do delta snapshot-6 → snapshot-7

> Autor do parecer: agente privacy-compliance (tier standard). Registro gravado pelo principal a partir do resumo devolvido pelo agente, sem alteração de conteúdo. O agente não tem ferramenta de escrita e o texto integral não chegou ao principal. Não é aconselhamento jurídico.
> Snapshot: docs/reviews/snapshot-7.sha256 (hashes conferem). O agente não releu o diálogo de consentimento nem `messages.ts`.

## Status
| ID | Status | Evidência declarada pelo agente |
|---|---|---|
| PRIV-018 | FECHADO (para dist/ e Seed-san) | Aviso claro e consistente em README.md, docs/licencas.md, docs/lacunas-conhecidas.md e no build (`scripts/build-notice.mjs` imprime `[AVISO]` quando há .vrm em `dist/models/`). O resíduo da Medea passou ao PRIV-022. |
| PRIV-019 | FECHADO | `#banner` cobre expressão facial, emoção, sobrancelhas e boca e diz que a boca não é sincronia labial real; curto, factual, permanente, fora da sidebar. |
| PRIV-020 | FECHADO | Crédito maior em tela estreita (0,9 rem, borda de aviso), Seção 4 citada na isenção; mantém criador, copyright, licença com link, não modificação, sem endosso e link de origem. |

Regressões: nenhuma. Nada persistido ou logado (a busca em `src/` só acha o texto de privacidade em ui.ts; o script de build só lê o diretório e escreve em stdout). Consentimento e avisos de tradução incompleta intactos.

## Novos achados
- PRIV-022 (MÉDIA): `legacy/*.fbx` e `modelo/*.fbx` (Medea, licença não resolvida) não têm barreira técnica no `.gitignore`, só aviso em texto.
- PRIV-023 (BAIXA): banner e rodapé maiores consomem altura fixa em viewports baixas e podem reduzir o canvas; não verificado em navegador.
- PRIV-024 (informativo): o registro de instalações não repete o aviso de `dist/`.

## VEREDITO: COM RESSALVAS
Como protótipo local é aceitável. Não aprovado para publicação até PRIV-022 e PRIV-005 (Medea), a decisão explícita de publicar o .vrm com o [LEGAL-REVIEW] de Avatar Use e uso comercial (PRIV-021), a validação com pessoas surdas e intérprete (PRIV-014), a verificação em navegador real (PRIV-015 e PRIV-023) e o contato do responsável (PRIV-002). Vale só para o snapshot-7; não substitui revisão jurídica nem aceite humano.
