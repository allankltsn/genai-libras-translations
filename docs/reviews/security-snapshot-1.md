# Revisao de seguranca - snapshot-1

Gate: seguranca de aplicacao front-end e cadeia de suprimentos. Revisor: especialista security (nao e o autor; somente leitura, nada corrigido).
Snapshot: docs/reviews/snapshot-1.sha256. sha256sum -c: todos os arquivos conferem (nenhuma divergencia).
Ambiente: Windows 11, Git Bash. Build de verificacao feito com o binario local do vite (sem npx/instalacao) em diretorio temporario FORA do projeto (scratchpad); nao foi criado dist/ no projeto.

## Veredito: COM RESSALVAS
Nenhum finding Critico/Alto. Nao ha vazamento de dados por codigo da aplicacao, nem requisicao externa, telemetria, XSS, persistencia ou log. Ressalvas: texto do aviso de privacidade sobre o Web Speech API (SEC-001), limites estruturais da CSP por meta (SEC-002) e itens de higiene (SEC-003 a SEC-007). Recomenda-se tratar SEC-001 antes de qualquer publicacao.

## Resultados por item verificado
- CSP: meta em index.html com marcador __CSP__, substituido por plugin do Vite. Build (conferido em dist temporario): default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; media-src 'self'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'. Sem inline, sem eval. Dev difere apenas em style-src 'unsafe-inline' e connect-src + ws://localhost:* ws://127.0.0.1:* (HMR); documentado e aceitavel. meta referrer no-referrer presente.
- Requisicoes externas/CDN/telemetria: grep em src/, index.html, vite.config.ts sem fetch/XHR/WebSocket/sendBeacon/http(s)://. Bundle de build: unicos URLs sao http://www.w3.org/1999/xhtml (namespace) e https://jcgt.org/... (string de referencia do three, nao e requisicao). Unico fetch no bundle e o FileLoader do three, restrito por connect-src 'self'. Sem @import/url() externos no CSS.
- XSS: sem innerHTML/outerHTML/insertAdjacent/eval/new Function/document.write/dangerouslySet*. src/ui/ui.ts usa somente textContent/createElement. Transcricao e texto digitado vao a textContent.
- Persistencia/log do texto: sem localStorage/sessionStorage/IndexedDB/cookie/console/location.hash|search/postMessage. Texto nao entra em URL. textarea com autocomplete=off e spellcheck=false (evita envio do texto a corretor ortografico do navegador).
- Microfone: opt-in. recognizer.start() so e chamado no click do botao; nao ha getUserMedia; estado exposto por aria-pressed e rotulo; pagehide aborta a sessao; start() idempotente; mensagens de erro fixas (nao expoem erro bruto); continuous=false.
- Loader do modelo: MODEL_URL e constante (BASE_URL + models/character.fbx), sem entrada do usuario; setURLModifier bloqueia origens diferentes (exceto data:/blob:).
- .npmrc: save-exact=true, ignore-scripts=true. package.json: exatamente 8 devDependencies com versao exata, zero dependencies (three e empacotado): @eslint/js, @types/three, eslint, three, typescript, typescript-eslint, vite, vitest = os 8 aprovados.
- package-lock: 160 entradas resolved + 160 integrity; nenhuma resolved fora de https://registry.npmjs.org/; sem git+/github:/file:/link. Unica entrada com hasInstallScript: fsevents@2.3.3 (opcional, so darwin; nao instalado no Windows; ignore-scripts=true). Em node_modules, nenhum preinstall/install/postinstall; apenas prepare (build/husky/tshy/patch-package), que o npm nao executa para dependencias do registro e que ignore-scripts bloqueia. Pacotes opcionais de plataforma (@rolldown/binding-*, lightningcss-*) nao estao instalados (so lido no lock).
- npm audit: found 0 vulnerabilities (consulta ao registro; nada instalado).
- .gitignore: node_modules, dist, *.log. Nenhum .env/chave encontrado na raiz.
- FBX (varredura de strings, sem executar): sem URLs http(s), sem executaveis/scripts, sem UNC. Ver SEC-004.

## Findings

### SEC-001 - Medium - Aviso de privacidade do reconhecimento de fala: honesto, porem incompleto
Local: index.html (#privacy), src/speech/recognizer.ts.
Cenario: o usuario clica em Ativar microfone; no Chrome/Edge o audio e enviado a servidores do fornecedor do navegador (fora do controle da CSP e do app, que nao pode impedir nem verificar). O aviso diz "Em alguns navegadores (como o Chrome)" e que o app nao grava/armazena. E verdadeiro, mas nao nomeia o ator (Google no Chrome; Microsoft no Edge; Apple no Safari), nao diz que o app nao controla o envio, e nao informa que digitar nao envia nada. Dado o requisito "nenhum vazamento", e insuficiente.
Resolucao: (a) reescrever: "Ao usar o microfone, o navegador pode enviar o seu audio a servidores do fornecedor dele (ex.: Google no Chrome) para converter fala em texto; este app nao controla isso. Se preferir, digite: o texto digitado nao sai do seu dispositivo."; (b) opcional: confirmacao explicita na primeira ativacao; (c) registrar em docs que reconhecimento 100% local nao e garantido pela API. Nao e vazamento causado pelo codigo; e risco residual inerente a API escolhida.

### SEC-002 - Low - Limites da CSP via meta e ausencia de cabecalhos de hospedagem
Local: index.html, vite.config.ts.
Cenario: CSP por meta nao suporta frame-ancestors; sem cabecalhos HTTP a pagina pode ser embutida em iframe (clickjacking). Sem Permissions-Policy, X-Content-Type-Options, COOP. Nao testado em navegador se style-src 'self' quebra algum estilo do three/UI (apenas leitura).
Resolucao: na hospedagem, enviar a mesma CSP + frame-ancestors 'none', Permissions-Policy: microphone=(self), camera=(), geolocation=(), X-Content-Type-Options: nosniff, Referrer-Policy: no-referrer. Testar o build real no navegador e checar violacoes de CSP.

### SEC-003 - Low - Bloqueio de URL do loader devolve string vazia
Local: src/avatar/loadAvatar.ts (setURLModifier).
Cenario: URL fora da origem retorna string vazia, que resolve para a propria pagina (same-origin), sem saida para o exterior; connect-src 'self' e a defesa em profundidade. O FBX referencia texturas por caminho relativo, gerando requisicoes same-origin 404 (ver SEC-004). Sem teste unitario do modificador.
Resolucao: nao necessaria para seguranca. Opcional: retornar URL inexistente/lancar erro para bloqueados e testar o modificador.

### SEC-004 - Low - Metadados e caminhos embutidos no FBX; licenca
Local: public/models/character.fbx (6,4 MB; FBX 6.1 binario).
Evidencia (strings): /home/app/mixamo-mini/tmp/output.embedded.fbx; ./working/zipfbx_28739_.../Medea By M. Arrebola/medea_m_arrebola.fbm/*.png (e variantes ../../../../working/...); campos Original|Application*/DocumentUrl. Sao caminhos de ferramenta de exportacao, sem http(s), sem script/executavel, sem nome de usuario desta maquina. Sem executar, nao e possivel excluir conteudo malicioso em dados binarios; o parser do three processa arquivo local confiavel.
Cenario: divulgacao menor de caminhos de build; requisicoes de textura inuteis. Licenca do modelo Medea by M. Arrebola ja registrada em docs/lacunas-conhecidas.md.
Resolucao: aceitar, ou limpar metadados na reexportacao (necessaria de qualquer modo: FBX 6.1 nao carrega); confirmar licenca/origem.

### SEC-005 - Low - .npmrc nao fixa o registro
Local: .npmrc.
Cenario: configuracao de usuario/global ou variavel npm_config_registry pode redirecionar npm install para outro registro em novas resolucoes.
Resolucao: adicionar registry=https://registry.npmjs.org/ (opcional engine-strict=true); usar npm ci para respeitar os integrity hashes.

### SEC-006 - Low - Arquivos legados com CDN no repositorio
Local: legacy/index.html, legacy/app.js, modelo/main.html (unpkg.com/three@0.160.0, cdn.jsdelivr.net, raw.githubusercontent.com).
Cenario: fora do build, mas se alguem servir a raiz do projeto ou abrir esses HTML, o navegador carrega scripts de CDN sem SRI, contrariando o requisito de nenhuma requisicao externa.
Resolucao: remover ou mover para fora da arvore servida; nunca servir a raiz.

### SEC-007 - Info - Contagem na documentacao
docs/operations/registro-instalacoes.md cita 135 pacotes instalados; o lock tem 160 entradas (inclui binarios opcionais de outras plataformas, nao instalados). Sem impacto de seguranca. As 8 instalacoes diretas estao registradas conforme a politica.

## Nao verificado
- Comportamento em navegador (CSP em runtime, violacoes, WebGL, Web Speech, destino real do audio); sem captura de trafego.
- Conteudo binario do FBX alem de strings; robustez do FBXLoader contra FBX malicioso (arquivo confiavel/local).
- Codigo de dependencias transitivas alem de scripts de ciclo de vida e npm audit (so vulnerabilidades conhecidas); npm audit signatures/proveniencia nao executado.
- Dependencias opcionais de outras plataformas (nao instaladas).
- Cabecalhos HTTP de hospedagem (inexistente); src/translation, src/queue e testes lidos apenas por grep de padroes perigosos (nenhum encontrado), sem revisao integral de logica.
