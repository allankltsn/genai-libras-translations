# Achados consolidados, snapshot-3 (rodada 3)

Vereditos sobre o snapshot-3: segurança APROVADO (delta); QA APROVADO COM RESSALVAS; conformidade APROVADO e técnica COM RESSALVAS (delta); privacidade COM RESSALVAS.
Fechados nesta rodada: QA-017..020, PRIV-009..011.

## Corrigir na rodada 3 (baixa gravidade, independe do modelo)
| ID | Resumo | Quem confirma |
|---|---|---|
| REV-011 = QA-022 | "Restaurar" pode restaurar a fala anterior em vez do texto digitado; perde o desfazer se a fala for igual ao campo. | qa, reviewer |
| QA-021 = PRIV-013 | Omissão de artigo/cópula tem o mesmo alerta que perda de conteúdo; risco de fadiga. Diferenciar nível sem esconder omissão. | qa, privacy-compliance |
| QA-023 | "Nenhum sinal encontrado" junto com glosas "soletrar (parcial)" visíveis. | qa |
| (comentário) | Repetição "e e um prototipo" no glosser. | reviewer |

Decisão: diferenciar a gravidade (recomendação do principal, dentro da delegação do usuário "pode seguir as recomendações").

## Aceitos / pendentes do usuário
- PRIV-014 (média, não bloqueante): tradução automática sem confirmação para público surdo; validar com pessoas surdas e intérpretes antes de piloto e considerar modo de revisão.
- PRIV-005 licença do modelo; REV-002 critério de adoção e desvio de ordem; REV-004 eixos Mixamo (precisa modelo); PRIV-002 contato do responsável; PRIV-012/015 e SEC-002/004/006/008/009 documentados.
- Modelo carregável (FBX 6100): opção A/B/C.
- Sem verificação por falta de navegador: renderização, sobreposição do #stop-float no mobile, foco/Esc do dialog, leitor de tela, Web Speech real, bfcache, visual das poses.
