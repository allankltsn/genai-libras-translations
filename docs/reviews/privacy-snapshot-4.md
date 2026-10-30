# Gate de privacidade, revalidação do snapshot-4

> Autor do parecer: agente privacy-compliance (tier standard). Registro gravado pelo principal a partir do resumo devolvido pelo agente, sem alteração de conteúdo. O agente não tem ferramenta de escrita e o texto integral não chegou ao principal. Não é aconselhamento jurídico.
> Snapshot: docs/reviews/snapshot-4.sha256 (hashes conferem). Nada foi executado em navegador.

## Status
| ID | Status | Evidência declarada pelo agente |
|---|---|---|
| PRIV-013 | FECHADO, com ressalva (PRIV-016) | Aviso forte (`warn`, "ATENÇÃO… NÃO transmitida por inteiro") cobre sempre a perda de conteúdo: `incomplete = missingLetters || truncated || inputTruncated`, mais o caso "nada para mostrar". Omissões de artigos, preposições e cópulas ficam em `info`, só quando `!incomplete`. A lista (até 10) aparece em todos os ramos, na região de status fora do painel recolhível. As stopwords omitidas não incluem negação nem palavras de conteúdo. |
| QA-023 (mensagem) | Clara | "Nenhum sinal pôde ser mostrado… A mensagem NÃO foi transmitida". Refinamento opcional: "soletradas/letras" é vocabulário técnico. |

DraftKeeper: só em memória, sem storage, console, fetch, beacon ou cookie; preserva o rascunho realmente digitado mesmo com falas encadeadas.
Regressões: nenhuma. Consentimento (`consent.ensure()` antes de `recognizer.start()`), banner e ausência de persistência/log intactos. PRIV-014 permanece como ressalva de produto.

## Novos achados
- PRIV-016 (BAIXA): as omissões em `info` dependem de leitura de português escrito e do contraste muted. Palavras como "com", "para" e "até" podem mudar o sentido. Sugestão: medir o contraste, usar prefixo não só por cor e validar com pessoas surdas.
- PRIV-017 (informativo): em `translate.ts`, `if (!sign) continue` descarta em silêncio um sinal do léxico sem entrada em SIGNS, sem marcar `incomplete`. O agente não achou teste de consistência LEXICON x SIGNS nos testes da tradução (não verificou os demais). Sugestão: um teste, ou tratar o caso como perda de conteúdo.

## Estado consolidado
FECHADOS: PRIV-001, 003, 004, 008, 009, 010, 011, 013. PARCIAIS: PRIV-002, 006, 007. PENDENTE-DO-USUÁRIO (LEGAL-REVIEW): PRIV-005. Informativos abertos: PRIV-012, 015. Ressalva de produto: PRIV-014.

## VEREDITO: COM RESSALVAS
Não aprovado para publicação ou uso real até PRIV-005, a verificação em navegador, o contato do responsável (PRIV-002) e a validação com pessoas surdas (PRIV-014 e PRIV-016). Como protótipo local é aceitável. Vale só para o snapshot-4; não substitui revisão jurídica nem aceite humano.
