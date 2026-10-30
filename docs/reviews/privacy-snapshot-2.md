# Gate de privacidade, revalidação do snapshot-2

> Autor do parecer: agente privacy-compliance (tier standard). Registro gravado pelo principal a partir do resumo que o agente devolveu, sem alteração de conteúdo e sem acréscimos. O agente não tem ferramenta de escrita e o texto integral do parecer não chegou ao principal; só o resumo abaixo. Não é aconselhamento jurídico.
> Snapshot: docs/reviews/snapshot-2.sha256 (hashes conferem). Nada foi executado em navegador.

## Status por finding (snapshot-1)
| ID | Status | Evidência declarada pelo agente |
|---|---|---|
| PRIV-001 | FECHADO | Diálogo modal antes da 1ª captura, nomeando Google, Microsoft e Apple; diz que o app não controla envio nem retenção, que não grava e que o texto digitado não é enviado. Esc é tratado como não aceite. |
| PRIV-002 | PARCIAL | `<details>` de privacidade existe e cobre revogação da permissão. Falta contato do responsável (deixado a quem publicar). |
| PRIV-003 | FECHADO | Banner fora da sidebar, nenhum código o oculta. Rótulos de glosas corrigidos. Aviso "NÃO transmitida por inteiro" para letras sem sinal e truncamentos. |
| PRIV-004 | FECHADO | Tradução, mic, Parar e testes desabilitados até o avatar carregar; `say()` recusa sem avatar. Com o FBX 6100, nada é traduzido no navegador hoje. |
| PRIV-005 | PENDENTE-DO-USUÁRIO (LEGAL-REVIEW) | Sem licença, atribuição e texturas. Não publicar o modelo. |
| PRIV-006 | PARCIAL | Painel não recolhe por padrão no celular; sem teste empírico de contraste, leitor de tela ou layout. |
| PRIV-007 | PARCIAL (ressalva aceitável) | Transcrição vai ao campo editável, mas a tradução automática foi mantida; gerou PRIV-009. |
| PRIV-008 | FECHADO (informativo) | |

## Perguntas específicas
- Banner e aviso podem sumir? O banner não. Só se perderia em viewport muito baixo no desktop (`body` com overflow hidden), não confirmado sem navegador. Os avisos da sidebar podem ser recolhidos pelo usuário; o consentimento obrigatório e o banner não dependem dela.
- O aceite é só em memória? Sim: `ConsentGate.accepted` é campo de instância, sem web storage nem cookies. Cada recarga pergunta de novo.

## Novos achados
- PRIV-009 (MÉDIA, não bloqueante): o rótulo "confira antes de usar" contradiz a tradução automática, que já começou. Sugestão: ajustar o rótulo ou exigir confirmação antes de animar.
- PRIV-010 (BAIXA): `setInputText` sobrescreve o rascunho digitado sem aviso.
- PRIV-011 (BAIXA): palavras de ligação são removidas pelo glosser sem marcar `incomplete`; o aviso "pode omitir palavras" fica só no rodapé recolhível.
- PRIV-012 (informativo): Permissions-Policy e frame-ancestors dependem do host. Falta teste em navegador do diálogo e da Web Speech.

## VEREDITO: COM RESSALVAS
Os dois itens altos de código (PRIV-001, PRIV-003) estão fechados. Não aprovado para publicação ou uso real até resolver PRIV-005, a verificação em navegador e o contato do responsável. Como protótipo local é aceitável. Vale só para o snapshot-2; não substitui revisão jurídica nem aceite humano.
