# Gate de privacidade, revalidação do snapshot-3

> Autor do parecer: agente privacy-compliance (tier standard). Registro gravado pelo principal a partir do resumo devolvido pelo agente, sem alteração de conteúdo. O agente não tem ferramenta de escrita e o texto integral não chegou ao principal. Não é aconselhamento jurídico.
> Snapshot: docs/reviews/snapshot-3.sha256 (hashes conferem). Nada foi executado em navegador.

## Status
| ID | Status | Evidência declarada pelo agente |
|---|---|---|
| PRIV-009 | FECHADO, risco residual aceito | Rótulo honesto ("a tradução começa sozinha… corrija no campo… ou use Parar"). Texto reconhecido visível e editável; "Parar" no painel e flutuante sobre o avatar; banner permanente. |
| PRIV-010 | FECHADO | `DraftKeeper` só em memória; busca por storage, console, fetch, beacon e cookie em src e index.html não achou nada. "Restaurar" nasce oculto e some ao editar, enviar ou restaurar; restaurar não dispara tradução. |
| PRIV-011 | FECHADO | Palavras omitidas entram em `incomplete` e na mensagem de status (única região aria-live, fora do painel recolhível), até 10 palavras listadas. |

Regressões: nenhuma. Nada persistido nem logado; consentimento intacto (`consent.ensure()` antes de `recognizer.start()`, aceite só em memória); banner intacto, fora da sidebar.

## Novos achados
- PRIV-013 (BAIXA): o aviso "ATENÇÃO / NÃO transmitida por inteiro" aparece em quase toda frase por causa das stopwords. Risco de fadiga de alerta; sugestão: diferenciar a gravidade.
- PRIV-014 (MÉDIA, não bloqueante): tradução automática sem confirmação para um público surdo, que não consegue avaliar a transcrição feita pela voz de outra pessoa. Validar com pessoas surdas e intérpretes antes de qualquer piloto e considerar um "modo de revisão".
- PRIV-015 (informativo): falta teste em navegador do diálogo, foco, contraste, leitor de tela e Web Speech real; já registrado em docs/lacunas-conhecidas.md.

## Estado consolidado
FECHADOS: PRIV-001, 003, 004, 008, 009, 010, 011. PARCIAIS: PRIV-002, 006, 007. PENDENTE-DO-USUÁRIO (LEGAL-REVIEW): PRIV-005. Informativo e aberto: PRIV-012.

## VEREDITO: COM RESSALVAS
Não aprovado para publicação ou uso real até PRIV-005, a verificação em navegador, o contato do responsável (PRIV-002) e a validação com usuários surdos (PRIV-014). Como protótipo local é aceitável. Vale só para o snapshot-3; não substitui revisão jurídica nem aceite humano.
