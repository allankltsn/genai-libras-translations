# Parecer de privacidade: API própria com agente Gemini (consulta)

> Autor: agente privacy-compliance (tier standard), consulta sem escrita, fontes verificadas em 2026-10-30. Registro CONDENSADO pelo principal (mantém conclusões, IDs e o checklist de aceite; o texto integral não foi gravado). Não é aconselhamento jurídico; [LEGAL-REVIEW] marca o que exige advogado(a).
> Limites do agente: leu só https://ai.google.dev/gemini-api/terms (não leu usage-policies, zdr, available-regions, o DPA nem regulamentos da ANPD); não revisou código novo (não existe); nada executado em navegador.

## Recomendação
NÃO adotar "texto vai ao Gemini" como padrão nem em piloto aberto agora. Caminho aceitável, com condições: modo local continua padrão e único que funciona sem consentimento adicional; conversão pela API é opcional, desligada por padrão; só plano PAGO da Gemini API (nunca a cota gratuita); piloto fechado com adultos informados, sem público infantil.

## Fatos verificados (Termos da Gemini API, 2026-10-30; reconfirmar antes do piloto)
- Serviços não pagos (AI Studio e cota gratuita): o Google usa conteúdo e respostas para melhorar produtos e treinar modelos; revisores humanos podem ler e anotar; o texto diz para não enviar informação sensível, confidencial ou pessoal.
- Serviços pagos: o Google não usa prompts e respostas para melhorar produtos; trata conforme o DPA de "Data Processor" (operador); registra prompts e respostas por período limitado para detectar violações, segurança e obrigações legais.
- Os termos proíbem uso em aplicativo "directed towards or is likely to be accessed by individuals under the age of 18".
- Não lidos (lacunas): prazo exato de retenção do log pago, regiões de processamento, DPA completo, cláusulas de transferência internacional, modo ZDR.

## Achados
| ID | Sev. | Achado | Conformidade |
|---|---|---|---|
| PRIV-API-01 | Alta | Termos do Google proíbem apps dirigidos ou prováveis de acesso por menores de 18; público plausível inclui crianças; LGPD art. 14. | IA só para 18+ com mecanismo e aviso; modo local para todos; [LEGAL-REVIEW]. |
| PRIV-API-02 | Alta | Cota gratuita: treino e revisão humana. | Só plano pago; cota gratuita não atende usuário real. |
| PRIV-API-03 | Alta | A frase atual "texto digitado não é enviado a nenhum serviço" (MIC_CONSENT_TEXT/#privacy) passa a ser falsa com a API. | Reescrever por modo; mostrar o estado local/IA o tempo todo. |
| PRIV-API-04 | Alta | Saída de LLM pode inventar sinais; risco de comunicação errada (médico, jurídico, emergência). | Rótulo por sinal, aviso persistente, bloqueio de temas, queda ao modo local. |
| PRIV-API-05 | Alta | Transferência internacional (art. 33) e papéis sem definição; DPA, regiões e retenção não lidos. | Ler e arquivar termos; definir fundamento; [LEGAL-REVIEW]. |
| PRIV-API-06 | Média | Fala transcrita enviada automaticamente (PRIV-009) levaria texto não revisado a dois destinos. | Com IA ligada, exigir ação explícita ("Converter com IA"). |
| PRIV-API-07 | Média | Logs, traces do LangChain/LangSmith, IP e cache são vetores de vazamento. | Seção de minimização e checklist. |
| PRIV-API-08 | Média | Endpoint com chave paga sem autenticação é alvo de abuso. | Limite de taxa anônimo, orçamento, CORS restrito. |
| PRIV-API-09 | Média | Texto livre pode ser dado sensível; a própria condição de uso sugere deficiência. | Consentimento destacado, minimização, filtro parcial de PII, RIPD; [LEGAL-REVIEW]. |
| PRIV-API-10 | Baixa | Não há política de privacidade nem canal do encarregado. | Publicar antes do piloto. |

## Consentimento (requisitos)
Separado do microfone (outro `<dialog>` e outro `ConsentGate`), opt-in desligado por padrão, antes do primeiro envio e a cada sessão (só em memória), aceitar e recusar com mesmo peso, Esc = recusar; nomear a API própria e o Google (Gemini), processamento possivelmente fora do Brasil, o que não controlamos (retenção do Google), alerta contra dados sensíveis e de terceiros, aviso de que a IA pode inventar sinais; revogação tão fácil quanto o aceite (chave sempre visível, aborta envios em curso); estado local/IA visível o tempo todo.

## Minimização e retenção (requisitos)
Enviar só o texto (`credentials: 'omit'`, POST, nunca em URL); limite de 500 caracteres no cliente e no servidor (413) e limite de taxa; sem logs de conteúdo (desligar e testar tracing do LangChain/LangSmith); IP não persistido ou truncado/hasheado com retenção curta documentada; sem banco nem disco; cache inexistente ou HMAC com sal, TTL curto, em memória; prompt fixo, saída em schema validado, sem ferramentas, sem grounding, sem memória entre requisições; filtro de PII no cliente (parcial, com aviso); erros genéricos sem eco; HTTPS/HSTS, CORS restrito, `connect-src` ampliado só ao domínio exato da API (ou mesma origem, sem mudar a CSP).

## Risco ao usuário surdo (requisitos)
Rótulo por sinal em texto ("Gerado por IA, não verificado" x "Léxico aproximado, não validado"); aviso persistente fora de painel recolhível; nunca chamar de "tradução de Libras"; bloquear conteúdo de emergência, saúde, medicação, violência, crime, documentos, dinheiro e decisão legal, com orientação humana e, em emergência, SAMU 192 [LEGAL-REVIEW na redação]; falha segura para o modo local; validação da saída contra limites do rig; nenhum uso fora de piloto sem validação por intérprete e pessoas surdas.

## Segredos
Chave Gemini só em variável de ambiente do servidor (nunca em `VITE_*`, bundle, repositório, logs, docs); rotação exige autorização; projeto dedicado com limite de orçamento e alertas; decidir e registrar quem contrata o plano pago, paga e responde (controlador/encarregado) [LEGAL-REVIEW].

## Antes de qualquer piloto (bloqueantes)
Decisão do público (18+ ou não); política de privacidade com contato do encarregado; RIPD (art. 38); termos e DPA do Google lidos e arquivados com data, plano pago comprovado e cota gratuita desativada; registro das operações (art. 37) e suboperadores; base legal e fundamento da transferência definidos; contrato da hospedagem da API; teste de que não há log de conteúdo em toda a cadeia; teste com intérprete e pessoas surdas; pessoa responsável nomeada por custo, chave e incidentes.

## Alternativas que reduzem risco (ordem de preferência)
1) Modo local primeiro (recomendado como padrão) e ampliar o léxico com validação humana; 2) modelo local/on-device (exige instalação e avaliação); 3) LLM só para escolher entre sinais verificados (classificação sobre léxico fechado); 4) filtro de PII antes do envio (parcial); 5) provedor com região e contrato mais fortes (ex.: Vertex AI com ZDR; não avaliado); 6) restringir a entrada na API a frases/palavras do léxico.

## Critérios de aceite de privacidade (checklist para a implementação)
**Consentimento e interface**
- IA desligada por padrão; sem consentimento específico, ZERO requisições à API (teste automatizado de rede).
- Diálogo nomeia API própria e Google (Gemini), processamento fora do Brasil, o que não controlamos, dados sensíveis/de terceiros, IA pode inventar sinais.
- Aceitar e recusar com mesmo peso; Esc = recusar; foco e teclado funcionam (verificar em navegador real).
- Revogação em chave sempre visível, interrompe envios em curso; modo local funciona sem API e sem consentimento.
- Estado "local" ou "IA" sempre visível; MIC_CONSENT_TEXT e painel de privacidade deixam de afirmar que o texto nunca sai quando a IA está ligada.
- Com IA ligada, fala transcrita NÃO é enviada automaticamente.
- Re-consentimento quando texto ou provedores mudarem (versão do texto).
- Restrição de idade conforme decisão, ou IA indisponível ao público infantil.

**Minimização e retenção**
- Corpo só com o texto; `credentials: 'omit'`; sem identificadores; POST, nunca URL.
- Limite 500 caracteres no cliente e no servidor; limite de taxa.
- Filtro de PII no cliente com aviso do que foi mascarado e ressalva de que é parcial.
- Sem log de corpo, prompt, resposta ou traces; teste com texto marcador provando ausência em todos os logs.
- Sem banco/disco/fila persistente; cache inexistente ou HMAC com TTL curto em memória.
- IP não persistido (ou truncado, retenção curta documentada).
- Prompt fixo, schema validado, sem ferramentas/grounding/memória; saída inválida rejeitada.
- Erros genéricos sem eco de conteúdo.

**Segurança e segredos**
- Chave só no ambiente do servidor; varredura prova ausência em bundle, repositório, logs, imagens, docs; nenhuma `VITE_*` com segredo.
- HTTPS com HSTS; CORS restrito; `connect-src` só ao domínio exato da API (ou mesma origem); `Referrer-Policy: no-referrer`.
- Limites de gasto e alertas; projeto dedicado; plano pago comprovado; cota gratuita não usada.
- Proteção contra abuso do endpoint sem criar contas nem identificadores.
- Texto do usuário tratado como dado, nunca instrução.

**Usuário surdo**
- Cada sinal gerado por IA rotulado em texto, distinto do léxico.
- Aviso persistente fora do painel recolhível enquanto a IA estiver ligada; sem a expressão "tradução de Libras".
- Conteúdo sensível bloqueado com orientação humana; falha ou saída inválida cai para o local com mensagem clara.
- Nenhum uso fora de piloto sem validação por intérprete e pessoas surdas.

**Governança**
- Política de privacidade com canal do encarregado funcional; RIPD; registro e suboperadores; termos e DPA arquivados com data; contrato da hospedagem.
- Fundamento da transferência e base legal aprovados por advogado(a); responsável nomeado.
- `docs/lacunas-conhecidas.md` atualizado com o que não foi verificado.
