# Achados consolidados, snapshot-6 (migração VRM, rodada 6)

Vereditos sobre o snapshot-6: segurança APROVADO; QA APROVADO COM RESSALVAS; revisão técnica APROVADO e conformidade COM RESSALVAS; privacidade COM RESSALVAS.
Fechados: condições 3, 4, 6, 7 da proposta do three-vrm; REV-012 (origem do pnpm, por security-snapshot-5).

## Corrigir na rodada 6
| ID | Sev. | Resumo | Quem confirma |
|---|---|---|---|
| PRIV-018 = SEC-013 | Média | Publicar `dist/` com o .vrm é Redistribution; nenhum documento avisa de forma explícita (README, licencas.md). Considere também um passo/aviso de build que alerte. | privacy-compliance, security |
| PRIV-019 | Média | Aviso visível na UI não cobre expressão facial, emoção e boca (aproximações não validadas). | privacy-compliance |
| PRIV-020 | Baixa | Crédito pouco evidente em tela estreita e em fonte pequena; citar Seção 4 na isenção. | privacy-compliance, qa |
| REV-013 | Baixa | Registro: seção do download diz "NÃO copiado" e a da migração registra a cópia; registrar a decisão do usuário de trocar o boneco (usuário escolheu VRM + three-vrm e disse "inicie" em 2026-10-30; o Seed-san substitui a Medea no app). | reviewer |
| QA-025 | Baixa | Se algo lançar após `v.add(vrm.scene)` em main.ts, o modelo fica na cena e "Tentar novamente" adiciona um segundo. | qa |
| QA-026 | Baixa | `ExpressionAnimator.update` fica em NaN se receber tempo não finito; `faceTargets` não limita NaN. | qa |

## Sem ação (informativo) ou do usuário
- QA-027 (visemas usam vogais do texto inteiro, já declarado como estimativa), SEC-014, PRIV-021 (LEGAL-REVIEW), PRIV-002, PRIV-014/015/016.
- SEC-012: node.exe em [::1]:5173 fora do registro; provavelmente o dev server do usuário (usuário confirma).
- REV-002 para os 8 pacotes antigos: decisão do usuário.
- REV-004: só fecha com inspeção visual de todos os sinais (dois lados, polegar, vários quadros) em navegador real.
- PRIV-005: Medea (legacy/ e modelo/), pendente do usuário.
