# Gate de privacidade, proteção do usuário e acessibilidade, snapshot-1

> Autor do parecer: agente privacy-compliance (tier standard). Gravado pelo principal, sem alteração de conteúdo, porque o agente não tinha ferramenta de escrita. Não é aconselhamento jurídico. Itens que exigem juízo legal levam LEGAL-REVIEW.
> Limites declarados pelo agente: nada foi executado em navegador; metadados internos do FBX não inspecionados.

## Mapa de dados
- Áudio de voz: dado pessoal, potencialmente sensível (saúde, identidade, terceiros ao redor) e biométrico em potencial.
  - Vai para o fornecedor do navegador (por exemplo o Google no Chrome), fora do controle do app.
  - O app não persiste nada. Não há storage, fetch nem log em recognizer.ts e main.ts. A CSP tem connect-src 'self' e há `referrer no-referrer`.
- Transcrição: fica só em memória e é mostrada na UI. Não é persistida.
- Base e finalidade: o usuário pede a função por ação explícita, e a única finalidade é traduzir para sinais. O envio ao fornecedor é feito pelo navegador.
- [LEGAL-REVIEW] Qualificar os papéis (controlador, operador, terceiro) e a base legal se o app for publicado por uma pessoa jurídica.

## Pontos positivos
- O microfone só inicia por clique (`start()` é chamado do clique) e `continuous=false`.
- Não há telemetria nem gravação.
- A UI usa textContent, sem innerHTML. As mensagens de erro não vazam texto bruto.
- A alternativa por texto existe e há fallback quando a API está ausente ou a permissão é negada.
- Existe aviso de que os sinais são aproximações e precisam de validação por intérprete ou pessoa surda (rodapé do painel).
- Não há dark patterns: sem conta, sem pagamento, sem urgência, sem opt-out escondido.
- Acessibilidade: skip link, foco visível, aria-live e prefers-reduced-motion estão presentes.

## Findings

PRIV-001 (ALTA) Aviso de privacidade vago e sem confirmação no ponto da captura
- Local: index.html #privacy; src/ui/ui.ts; src/main.ts onMicClick.
- Problema:
  - Não há confirmação antes da primeira captura nem identificação do destinatário.
  - "Em alguns navegadores (como o Chrome)" é vago. Não diz que o app não controla a retenção pelo fornecedor.
  - "Este aplicativo não grava" pode ser lido como "ninguém grava".
  - No mobile o painel é recolhido por padrão (ui.ts, `matchMedia(max-width:800px)` chama `toggle.click()`), então o aviso fica oculto.
- Resolução:
  - Pedir confirmação explícita acessível na primeira ativação, antes de `recognizer.start()`. Opções: "Entendi, usar microfone" e "Usar texto".
  - Texto sugerido: "Seu áudio pode ser enviado ao serviço de reconhecimento de fala do seu navegador (ex.: Google, no Chrome). Não controlamos como esse fornecedor o trata. O app não grava nem guarda áudio ou texto."
  - Incluir a dica de não falar dados sensíveis ou de terceiros.
  - Manter o indicador "Ouvindo".
- [LEGAL-REVIEW] Adequação à informação e ao consentimento (LGPD art. 9 e 11; GDPR arts. 7 e 13) se for distribuído.

PRIV-002 (MÉDIA) Direitos do titular e revogação não declarados
- Local: index.html.
- Problema:
  - Não há seção de privacidade com a ausência de coleta, como revogar a permissão do microfone no navegador ou contato do responsável.
  - O status não diz que o envio cessa ao parar.
- Resolução: acrescentar seção ou link "Privacidade" com essas informações. Os direitos de acesso e eliminação se resolvem por design (nada é guardado), mas isso precisa estar dito.
- [LEGAL-REVIEW] Registro de tratamento ou RIPD, se publicado.

PRIV-003 (ALTA) Risco ao usuário surdo: alegação implícita de precisão, com aviso distante
- Local: index.html (botão "Traduzir para Libras", rótulo "Sinais", aria-label do canvas), src/main.ts `say()`.
- Problema:
  - O aviso de validação existe, mas fica no fim do painel em `notice small`, longe do resultado. Some quando o painel está recolhido, que é o padrão no mobile.
  - O vocabulário é mínimo. A datilologia cobre só A, L e Y. A frase é truncada. A glosa é uma simplificação do português.
  - Há sinais de uso sensível ("Banheiro", "Dúvida"). Nenhum sinal foi validado por intérprete nem visualmente.
  - Como o modelo 3D hoje não carrega, o usuário vê só glosas rotuladas "Sinais".
  - Sinais errados ou parciais podem causar erro de comunicação, inclusive em contexto de saúde ou emergência.
- Resolução:
  - Aviso persistente junto ao resultado e ao canvas, fora do painel recolhível. Texto sugerido: "Protótipo: sinais aproximados, não validados por intérprete de Libras. Não use para comunicação importante, médica, jurídica ou de emergência."
  - Renomear "Sinais" para "Glosas (aproximação)". Renomear o botão para algo como "Mostrar em sinais (protótipo)".
  - Avisar claramente que a mensagem NÃO foi transmitida por inteiro quando houver palavra sem sinal, letra ausente ou truncamento.
  - Não distribuir como ferramenta de comunicação antes da validação com intérprete ou comunidade surda.

PRIV-004 (MÉDIA) Falha do modelo 3D pode parecer funcionamento
- Local: src/main.ts `say()`; docs/lacunas-conhecidas.md.
- Problema: com o avatar indisponível, as glosas ainda aparecem e "Modelo 3D não carregado" é só uma nota. O usuário pode achar que a tradução ocorreu.
- Resolução: desabilitar ou destacar o fluxo de tradução até o avatar carregar, e manter o erro permanente no overlay com a instrução de não usar para comunicação.

PRIV-005 (ALTA para distribuição) [LEGAL-REVIEW] Licença e direitos do modelo "Medea by M. Arrebola" e das texturas
- Local: public/models/character.fbx (6,4 MB; cópia em modelo/); docs/lacunas-conhecidas.md linha 18.
- Problema:
  - Não há arquivo de licença, atribuição nem registro de procedência, e a UI não traz créditos. Se o modelo veio do Mixamo ou do autor, os termos de redistribuição são desconhecidos.
  - As texturas (`medea_m_arrebola.fbm/*.png`) estão ausentes e seus direitos também são indeterminados.
- Resolução:
  - Documentar fonte, autor, licença e permissão (por exemplo docs/licencas.md) e dar atribuição na UI se exigida.
  - Ou substituir por um asset de licença clara (CC0 ou próprio).
  - Não publicar repositório nem build antes disso.
  - Parecer jurídico sobre redistribuição e uso comercial: LEGAL-REVIEW.

PRIV-006 (MÉDIA) Acessibilidade não verificada empiricamente
- Local: index.html; src/styles.css; docs/lacunas-conhecidas.md linha 26.
- Problema:
  - Contraste, foco, leitor de tela e responsividade não foram testados.
  - O painel recolhido por padrão no mobile esconde a entrada e os avisos.
  - O produto é para comunicação com surdos, então o feedback visual importa.
- Resolução: testar teclado, leitor de tela e contraste (medir). Não recolher o painel por padrão, ou manter a entrada e os avisos acessíveis. Incluir isso no QA.

PRIV-007 (MÉDIA) Transcrição propagada sem revisão
- Local: src/main.ts `onTranscript` chama `say()` direto quando o resultado é final.
- Problema: erros de reconhecimento viram sinais errados sem passo de confirmação.
- Resolução: permitir revisar ou editar o texto reconhecido antes de traduzir, ou ao menos destacá-lo. O texto já aparece em "Texto reconhecido".

PRIV-008 (BAIXA, informativo) Saúde e consumo
- Não há nudges de saúde, linguagem sobre corpo, notificações de culpa nem cobrança. Nada a corrigir.

## Resumo
| ID | Severidade | Bloqueia uso real ou publicação |
|---|---|---|
| PRIV-001 | ALTA | sim |
| PRIV-002 | MÉDIA | não |
| PRIV-003 | ALTA | sim |
| PRIV-004 | MÉDIA | não |
| PRIV-005 | ALTA, LEGAL-REVIEW | sim, antes de distribuir |
| PRIV-006 | MÉDIA | não |
| PRIV-007 | MÉDIA | não |
| PRIV-008 | BAIXA | não |

## VEREDITO: COM RESSALVAS
A arquitetura de privacidade é boa: sem persistência, sem rede própria, microfone por clique e alternativa em texto. O protótipo local é aceitável.
Não aprovado para distribuição nem para uso por usuários reais até resolver PRIV-001, PRIV-003 e PRIV-005.
As correções voltam ao autor e exigem confirmação independente. O parecer vale só para o snapshot-1. Não substitui revisão jurídica nem aceite humano.
