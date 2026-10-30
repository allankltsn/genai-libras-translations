# Gate de privacidade, revalidação do snapshot-6 (migração VRM)

> Autor do parecer: agente privacy-compliance (tier standard). Registro gravado pelo principal a partir do resumo devolvido pelo agente, sem alteração de conteúdo. O agente não tem ferramenta de escrita e o texto integral (tabela por ponto, PRIV-001 a 021) não chegou ao principal. Não é aconselhamento jurídico.
> Snapshot: docs/reviews/snapshot-6.sha256 (hashes conferem). O agente não reabriu `messages.ts` nem o trecho de consentimento de `main.ts`.

## Pontos avaliados
1. **Crédito VRM: ATENDE, com 2 ressalvas BAIXAS.** O rodapé `#credits` fica fora do painel recolhível e traz criador, copyright, licença com link, indicação de não modificação, "sem endosso", link da origem e "Sem garantias". Visível com o painel recolhido; em tela estreita só no fim da rolagem. Sugestões: citar a Seção 4 na isenção e medir o contraste.
2. **PRIV-005:** a Medea saiu do app e do build (`public/` só tem Seed-san.vrm; o código só referencia esse arquivo). A licença da Medea segue PENDENTE-DO-USUÁRIO [LEGAL-REVIEW]. O `.gitignore` protege o repositório, mas o Vite copia `public/` para `dist/`; nenhum documento avisa de forma explícita que publicar `dist/` com o .vrm é Redistribution. `legacy/` e `modelo/` seguem na árvore, sem `.gitignore`.
3. PRIV-014, PRIV-016 e avisos de tradução incompleta seguem intactos (banner e rótulos inalterados).
4. **Expressões e visemas:** código e lacunas dizem "aproximação não validada" e "não é lip-sync", mas o aviso visível na UI não cobre expressão facial, emoção nem boca. Alegre leve em Oi/Obrigado/Tudo bem e triste em Desculpa: baixo risco de ofensa. Dúvida (sobrancelhas levantadas) e Negação (franzidas) generalizam convenções de Libras e não estão validadas.
5. **Regressões: nenhuma.** Nada persistido ou logado; nenhum metadado do VRM é exibido (só `meta.metaVersion`, interno); `blob:` no `connect-src` é do próprio documento; consentimento e banner intactos.

## Achados novos
- PRIV-018 (MÉDIA): publicar `dist/` com o .vrm presente é Redistribution e nenhum documento avisa de forma explícita.
- PRIV-019 (MÉDIA, ressalva de produto): o aviso visível na UI não cobre expressão facial, emoção nem boca.
- PRIV-020 (BAIXA): crédito pouco evidente em tela estreita e em fonte pequena.
- PRIV-021 (informativo, [LEGAL-REVIEW]): Avatar Use versus Model Use e uso comercial; os valores de `meta` são permissivos.

## VEREDITO: COM RESSALVAS
Como protótipo local é aceitável. Não aprovado para publicação até PRIV-018, PRIV-005, PRIV-019 e a validação com pessoas surdas (PRIV-014), o [LEGAL-REVIEW] (PRIV-021) e a verificação em navegador real (PRIV-015). Vale só para o snapshot-6; não substitui revisão jurídica nem aceite humano.
