# Revalidacao de seguranca - snapshot-2

Revisor: especialista security (independente do autor; somente leitura, nada corrigido). Model: standard.
Snapshot: docs/reviews/snapshot-2.sha256. sha256sum -c: todos os arquivos conferem (sem divergencia).
Build limpo de verificacao: binario local do vite, saida em diretorio temporario fora do projeto (scratchpad); confirmado que dist/ nao existe no projeto. Nada instalado.

## Veredito: APROVADO (com riscos residuais aceitos e documentados, listados abaixo)
Nenhum finding aberto de severidade Critica/Alta/Media. SEC-001 fechado; ressalvas residuais sao estruturais (Web Speech do fornecedor, CSP por meta) e estao documentadas. Aprovacao humana e separada.

## Tabela de status

| ID | Status | Evidencia propria |
|---|---|---|
| SEC-001 (aviso de privacidade Web Speech) | FECHADO | Ver secao "Dialogo de consentimento". Texto nomeia fornecedores (Google/Chrome, Microsoft/Edge, Apple/Safari), diz que o app nao controla envio nem retencao, diz que o app nao grava, aconselha evitar dados sensiveis e oferece alternativa de digitar. Consentimento explicito antes da primeira captura. |
| SEC-002 (CSP por meta, sem cabecalhos) | ACEITO-COM-DOCUMENTACAO | README.md secao "Cabecalhos HTTP exigidos na hospedagem": CSP + frame-ancestors 'none', Permissions-Policy microphone=(self) camera=() geolocation=(), X-Content-Type-Options nosniff, Referrer-Policy no-referrer. CSP do build reconferida (abaixo), inalterada. Segue dependente do host aplicar os cabecalhos; sem teste em navegador. |
| SEC-003 (URL bloqueada devolvia string vazia) | FECHADO | src/avatar/urlPolicy.ts: filterUrl devolve BLOCKED_URL = 'data:,' para origem diferente ou URL invalida; loadAvatar.ts usa filterUrl; ha urlPolicy.test.ts. Nao gera requisicao same-origin nem externa. |
| SEC-004 (metadados/caminhos no FBX; licenca) | ACEITO-COM-DOCUMENTACAO | FBX inalterado (sha256 d9ce58c8... igual ao snapshot-1): caminhos de ferramenta de exportacao continuam embutidos, sem URLs/scripts. README e docs/lacunas-conhecidas.md registram licenca pendente (LEGAL-REVIEW) e a necessidade de reexportar. |
| SEC-005 (.npmrc sem registry) | FECHADO | .npmrc: registry=https://registry.npmjs.org/, save-exact=true, ignore-scripts=true, engine-strict=true. package.json: engines node ^20.19.0 || >=22.12.0. README orienta npm ci. |
| SEC-006 (legacy/ e modelo/main.html com CDN) | ACEITO-COM-DOCUMENTACAO | Arquivos mantidos (so historico); adicionados legacy/LEIA-ME.md e modelo/LEIA-ME.md (NAO SERVIR) e secao "O que NAO servir" no README. Nao entram no build (grep de URLs no bundle limpo: so namespace xhtml e string jcgt.org do three). Risco remanescente se alguem servir a raiz; remover os arquivos o eliminaria. |
| SEC-007 (contagem 135 vs 160) | FECHADO | docs/operations/dependencias-instaladas.md: 135 instalados (8 diretos + 127), lock com 160 (25 opcionais de outras plataformas, nao instalados). |

## Pontos novos auditados

### Dialogo de consentimento (index.html, src/ui/ui.ts, src/speech/consent.ts, src/ui/messages.ts)
- Texto (MIC_CONSENT_TEXT, usado no aviso permanente e no dialog) nomeia o fornecedor (Google no Chrome, Microsoft no Edge, Apple no Safari), usa "pode enviar" (nao afirma certeza que nao possui), declara que o app nao controla o envio nem o tempo de guarda, e limita a afirmacao de nao gravacao ao proprio aplicativo ("O aplicativo em si nao grava nem guarda"). Nao encontrei afirmacao falsa: o codigo nao grava nem persiste (grep abaixo). A frase "o texto digitado nao e enviado a nenhum servico pelo aplicativo" e verdadeira e escopada ao app (recursos do navegador/extensoes nao sao cobertos; textarea tem spellcheck=false e autocomplete=off). PRIVACY_DETAILS: "nao coleta, nao grava, nao armazena" e verdadeiro para o app; reconhece que a politica do fornecedor esta fora do controle do app e que o contato do publicador deve ser informado por quem publicar (pendencia operacional, nao do codigo).
- Mecanica: ConsentGate exige confirmacao antes da primeira captura; decisao so em memoria (nao persiste, volta a perguntar ao recarregar); chamadas concorrentes compartilham a mesma pergunta; fechar com Esc ou "Usar texto" resulta em recusa (so "Entendi" aceita); foco inicial no botao seguro ("Usar texto"); sem showModal, falha para recusa. main.ts: recognizer.start() so apos consent.ensure() resolvido true, dentro de clique.
- Conteudo do dialog preenchido via textContent (sem innerHTML).

### urlPolicy 'data:,' e CSP
Build limpo, CSP no dist temporario: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; media-src 'self'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'. connect-src 'self' NAO inclui data:, logo um fetch de 'data:,' (FileLoader) e bloqueado pela CSP e nao gera trafego de rede de qualquer forma (data: e local); a falha vira erro de carga explicito. img-src permite data:/blob: (texturas embutidas via Image/blob), sem risco de saida de rede. Nao testado em navegador real.

### Cadeia de suprimentos
- package-lock.json: sha256 bd772eb6... identico ao snapshot-1 (lock inalterado, portanto nenhuma dependencia nova). 160 integrity; 0 resolved fora de https://registry.npmjs.org/; unico hasInstallScript continua sendo fsevents (opcional darwin). package.json: mesmas 8 devDependencies exatas, 0 dependencies; so foi adicionado "engines".
- npm audit: found 0 vulnerabilities.

### recognizer.ts (stop timeout, onIncomplete)
- stop(): temporizador de 3000 ms aborta a sessao se onend nao ocorrer; handlers anulados e timer limpo em onend/dispose; evita UI presa em "Ouvindo" (o microfone e efetivamente liberado via abort). 
- onIncomplete: so chama o handler com o texto parcial; main.ts o coloca no campo editavel via setInputText (truncado ao maxlength) e avisa o usuario para conferir; nao traduz automaticamente e nao persiste, loga ou envia o texto (nenhum storage/console/URL; resultado so em memoria e DOM).
- Grep de padroes perigosos em src/index.html/vite.config.ts: unicas ocorrencias sao texto de documentacao/aviso ("localStorage" em string de UI, comentarios). Sem innerHTML/eval/fetch/WebSocket/storage/console/cookie/getUserMedia.

## Findings novos
Nenhum de severidade acima de Info.
- SEC-008 (Info): o contato do responsavel pela publicacao (exigencia tipica de aviso de privacidade) nao existe no app; o texto delega a quem publicar. Resolucao: preencher antes de publicar.
- SEC-009 (Info): como o consentimento nao persiste, o dialogo reaparece a cada recarga; e comportamento intencional e coerente com "nada persistido".

## Nao verificado
- Qualquer comportamento em navegador real (CSP em runtime, dialog, Web Speech, destino do audio, bloqueio do data: pela CSP); sem captura de trafego.
- Cabecalhos reais de hospedagem (nao existe host ainda).
- Conteudo binario do FBX alem de strings (FBX inalterado desde snapshot-1); robustez do FBXLoader contra arquivo malicioso.
- Codigo-fonte de dependencias transitivas; npm audit signatures/proveniencia nao executado. Logica de traducao/fila lida so por padroes perigosos.
