# Achados consolidados, snapshot-1 (rodada 1)

Fontes: qa-snapshot-1.md (QA-xxx), review-snapshot-1.md (REV-xxx), security-snapshot-1.md (SEC-xxx), privacy-snapshot-1.md (PRIV-xxx).
Vereditos: QA REPROVADO; revisão conformidade e técnica COM RESSALVAS; segurança COM RESSALVAS; privacidade COM RESSALVAS.
Regra: o autor corrige e entrega novo snapshot com evidência; quem abriu o achado confirma o fechamento. O autor não fecha achados sozinho.

## Duplicados (tratar como um só)
- PRIV-001 = SEC-001 (aviso e consentimento do Web Speech)
- PRIV-003 + PRIV-004 + QA-004 (risco de parecer tradução completa/correta)
- SEC-003 = REV-006 (loader devolve string vazia)
- SEC-002 = REV-007 (CSP por meta, sem frame-ancestors)
- REV-003 = SEC-007 (160 entradas no lock vs 135 instalados)
- PRIV-006 + QA-001 (painel recolhido/inacessível)

## Corrigir agora (independe do modelo)
Bloqueantes: QA-001, QA-002, PRIV-001/SEC-001, PRIV-003/004, QA-004.
Demais: QA-003, QA-006, QA-013, QA-005, QA-007..012, QA-014..016, PRIV-002, PRIV-007, SEC-005, SEC-006, REV-001, REV-002, REV-003, REV-005, REV-006/SEC-003, REV-007/SEC-002, REV-008, REV-009, REV-010.

## Bloqueados por decisão ou artefato externo
- Modelo carregável (FBX 6100 não abre): decisão do usuário pendente.
- REV-004 (eixos/bind rotacionado): validar só com o modelo real; pode-se adicionar já teste unitário com bind rotacionado.
- PRIV-005 (licença do modelo e texturas): LEGAL-REVIEW, depende do usuário.
- SEC-004 (caminhos de exportação no FBX): informativo, reavaliar com o modelo novo.
