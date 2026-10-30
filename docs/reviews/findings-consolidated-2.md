# Achados consolidados, snapshot-2 (rodada 2)

Fontes: qa-snapshot-2.md, review-snapshot-2.md, security-snapshot-2.md, privacy-snapshot-2.md.
Vereditos sobre o snapshot-2: QA APROVADO COM RESSALVAS; revisão conformidade e técnica COM RESSALVAS; segurança APROVADO; privacidade COM RESSALVAS.
Fechados na rodada 1: QA-001..016, REV-001 (retirado pelo revisor), REV-003, 005..010, SEC-001, 003, 005, 007, PRIV-001, 003, 004, 008.

## Corrigir na rodada 2 (independe do modelo)
| ID | Sev. | Resumo | Quem confirma |
|---|---|---|---|
| QA-017 | Média | Status "Ouvindo. Fale em português." permanece depois que o microfone para (setListening(false) só limpa #mic-state; inclui o timeout de 3 s). | qa |
| QA-018 | Baixa | Com falha de WebGL o botão "Tentar novamente" não faz nada (startLoad retorna com viewer null). | qa |
| QA-019 | Baixa | Botão Parar some com o painel recolhido em tela estreita. | qa |
| QA-020 | Baixa | Skip link aponta para #text-input, não focável com o painel oculto. | qa |
| PRIV-009 | Média | Rótulo "confira antes de usar" contradiz a tradução automática. Ajustar rótulo ou exigir confirmação antes de animar. | privacy-compliance |
| PRIV-010 | Baixa | setInputText sobrescreve rascunho digitado sem aviso. | privacy-compliance |
| PRIV-011 | Baixa | Glosser remove palavras de ligação sem marcar incomplete; aviso só no rodapé recolhível. | privacy-compliance |

## Pendentes de decisão do usuário (não tocar)
- Modelo carregável (FBX 6100): opção A/B/C.
- PRIV-005 licença e origem do modelo (LEGAL-REVIEW).
- REV-002: dispensar critério de adoção e reconhecer desvio de ordem, ou autorizar consulta de downloads.
- REV-004: eixos locais Mixamo, só com modelo carregável.
- PRIV-002 contato do responsável, SEC-008/009, SEC-002/004/006 (documentados): aceitos até haver publicação.

## Sem verificação por falta de navegador (para o aceite humano)
Renderização, resize, foco e Esc do dialog, leitor de tela, Web Speech real, bfcache, visual das poses.
