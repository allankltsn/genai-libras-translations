# Revisao de seguranca - proposta de instalacao de @pixiv/three-vrm

Revisor: especialista security (independente; somente leitura). Model: standard. Base: policies/installations.md, criterios 1-6.
Metodo: npm view (metadados do registro), npm pack --ignore-scripts dos 7 tarballs @pixiv para um diretorio temporario FORA do projeto (apenas baixados e extraidos para leitura; nada executado, nada instalado, nenhum arquivo do projeto alterado, nenhum modelo VRM baixado) e leitura da API de attestations do registro. Fatos do principal conferidos de forma independente.

## Recomendacao: APROVAR COM CONDICOES
Versao exata: @pixiv/three-vrm@3.5.5 (nada acima; sem latest). Aprovacao humana do usuario e separada. Condicoes obrigatorias na secao Condicoes. Ha tambem um achado de ambiente (SEC-P-001) a resolver ANTES de instalar.

## Arvore transitiva real (npm view; todas 3.5.5, MIT, sem preinstall/install/postinstall/prepare, sem optionalDependencies, todas com provenance SLSA v1, publicadas por GitHub Actions via OIDC)

| # | Pacote | Tamanho descompactado | Dependencias |
|---|---|---|---|
| 1 | @pixiv/three-vrm (direto) | 2.499.824 B | 6 abaixo; peer three>=0.137 (temos 0.186.1) |
| 2 | @pixiv/three-vrm-core | 1.007.474 B | types-vrm-0.0, types-vrmc-vrm-1.0 |
| 3 | @pixiv/three-vrm-materials-mtoon | 680.339 B | types-vrm-0.0, types-vrmc-materials-mtoon-1.0 |
| 4 | @pixiv/three-vrm-materials-v0compat | 126.149 B | types-vrm-0.0, types-vrmc-materials-mtoon-1.0 |
| 5 | @pixiv/three-vrm-materials-hdr-emissive-multiplier | 21.809 B | types-vrmc-materials-hdr-emissive-multiplier-1.0 |
| 6 | @pixiv/three-vrm-node-constraint | 145.256 B | types-vrmc-node-constraint-1.0 |
| 7 | @pixiv/three-vrm-springbone | 424.553 B | types-vrm-0.0, types-vrmc-springbone-1.0, types-vrmc-springbone-extended-collider-1.0 |
| 8-14 | @pixiv/types-vrm-0.0; types-vrmc-vrm-1.0; types-vrmc-materials-mtoon-1.0; types-vrmc-materials-hdr-emissive-multiplier-1.0; types-vrmc-node-constraint-1.0; types-vrmc-springbone-1.0; types-vrmc-springbone-extended-collider-1.0 | 13.465; 13.619; 5.693; 2.992; 4.707; 6.228; 5.373 B | nenhuma (so tipos) |

Total: 14 pacotes novos (1 direto + 13 transitivos), cerca de 4,95 MB descompactados (inclui builds cjs/min duplicados; o bundle so incorpora o importado). Todos no escopo @pixiv; nenhum binario/nativo. Os scripts dos manifestos (build, lint, clean, version, docs) sao de desenvolvimento e nao rodam na instalacao de consumidor; ignore-scripts=true os bloqueia de qualquer forma.

## Criterios 1-6
1. Necessidade: decisao do usuario (estudo pessoal); dedos humanoides e expressoes faciais nao sao atendidos pelo FBX atual (sem blendshapes/jaw, ver docs/lacunas-conhecidas.md). Condicao: registrar a decisao do usuario.
2. Procedencia: ATENDIDO. Organizacao identificavel (pixiv); repositorio publico github.com/pixiv/three-vrm coincide com repository.url do manifesto; MIT; mantenedores incluem a conta org pixiv-npm e contas @pixiv.co.jp (e contas pessoais). Os 14 pacotes tem attestation SLSA provenance v1 e publish attestation Sigstore (presenca lida na API do registro; assinatura nao verificada criptograficamente).
3. Adocao: ATENDIDO (dados do principal, 2026-10-30: 168.945 downloads/semana, 2.247 estrelas, push 2026-10-22, release 2026-07-09). Padrao de fato para VRM em three.js.
4. Revisao de seguranca (tarballs 3.5.5 lidos): ATENDIDO.
 - Sem lifecycle scripts nos 14 pacotes (package.json extraidos).
 - Nos bundles lib (module e cjs), grep: zero fetch, XMLHttpRequest, WebSocket, sendBeacon, eval, new Function, localStorage, sessionStorage, indexedDB, cookie, importScripts, Worker, innerHTML, navigator, createElement. URLs http(s) so em comentarios/documentacao (github.com, vrm.dev, threejs.org, blogspot). Unico import externo nos bundles module: three (nao importam three/addons nem GLTFLoader).
 - Cerca de 64 chamadas console.warn/error do pacote (avisos de spec/expressao desconhecida); sem rede; busca dirigida nao achou URL/conteudo do usuario nas mensagens.
 - Codigo legivel, nao ofuscado.
 - O pacote nao carrega recursos por conta propria: e plugin do GLTFLoader (VRMLoaderPlugin) que atua sobre o glTF ja parseado.
5. Escopo: ATENDIDO, projeto, devDependency (three ja e devDependency empacotada pelo Vite). Sem global, sem credenciais, sem permissoes.
6. Reversibilidade: ATENDIDO (Plano de remocao).

## Compatibilidade com CSP estrita e barreira de URL
- script-src self: OK; sem inline/eval no pacote. MToon usa shaders GLSL via three (nao e eval JS): nao exige unsafe-eval. Nao ha injecao de style no pacote.
- RISCO A VALIDAR (condicao 4): o GLTFLoader do three decodifica texturas embutidas no GLB criando blob: URL e, em Chrome/Edge, carrega com ImageBitmapLoader, que usa fetch(); isso e regido por connect-src, e connect-src com apenas self nao cobre blob:. E provavel que se precise de connect-src self + blob: (same-document, sem saida de dados). Nao testado em navegador. NAO adicionar data: ao connect-src: a barreira urlPolicy (BLOCKED_URL = data:,) depende de data: nao estar permitido.
- Requisicoes externas ao carregar um VRM: o three-vrm nao faz nenhuma. Quem poderia fazer e o GLTFLoader do three se o glTF referenciar images[].uri ou buffers[].uri externos. O three resolve todas por manager.resolveURL, entao a barreira funciona se, e somente se, o GLTFLoader for criado com o mesmo LoadingManager que tem setURLModifier com filterUrl (src/avatar/urlPolicy.ts). Condicao 3 abaixo.
- Metadados do VRM (autores, contato, referencias, licenseUrl) sao texto/URL vindos do arquivo: nunca renderizar como HTML nem como link automatico; se exibir, usar textContent sem href.
- Entrada de VRM de terceiros/upload/URL fora de escopo: exige nova revisao.

## Achados
SEC-P-001 (Medium, ambiente/registro, nao e do pacote): node_modules nao parece ter sido instalado pelo npm como diz docs/operations/registro-instalacoes.md. Evidencia: node_modules/.modules.yaml e node_modules/.pnpm apontam para pnpm 12.11.2 (storeDir %USERPROFILE%\AppData\Local\pnpm\store\v11; node_modules/three e node_modules/vite sao links para .pnpm/...); existe pnpm-lock.yaml (criado 11:36) ao lado do package-lock.json (10:57, sha256 bd772eb6..., inalterado). A palavra pnpm nao aparece em package.json, README nem no registro de instalacoes. Consequencias: (a) duas lockfiles; as revisoes anteriores auditaram o package-lock.json, nao o pnpm-lock.yaml (tem 160 integrity, mas nao foi auditado como fonte de verdade); (b) uso do pnpm sem linha no registro (a menos que ja fosse ferramenta do usuario: registrar o uso); (c) npm install sobre arvore pnpm pode reorganizar node_modules, e a garantia de ignore-scripts depende da configuracao do gerenciador efetivo. Resolucao: principal escolhe e documenta UM gerenciador, remove a lockfile obsoleta, registra versao/origem/escopo/aprovador do pnpm, e so entao instala. Nao e motivo para rejeitar o three-vrm.

## Condicoes (todas obrigatorias)
1. Resolver SEC-P-001 antes: um gerenciador, uma lockfile, registro corrigido, ignore-scripts efetivo confirmado nele.
2. Comando em escopo de projeto com versao exata e sem scripts: npm install --save-exact --save-dev --ignore-scripts @pixiv/three-vrm@3.5.5. Atencao: sem --save-dev o pacote iria para dependencies (o projeto tem zero dependencies hoje); a escolha deve ser consciente. Se o gerenciador for pnpm: pnpm add -D -E --ignore-scripts @pixiv/three-vrm@3.5.5. Nao instalar nada alem disso (types ja vem no pacote); nenhuma ferramenta de conversao.
3. urlPolicy: GLTFLoader criado com o LoadingManager que usa setURLModifier com filterUrl, registro via loader.register com VRMLoaderPlugin, sem setCrossOrigin/setPath externos, com teste provando que URI http(s) externa vira BLOCKED_URL.
4. Testar o build limpo em navegador; se preciso, relaxar so connect-src para self + blob: (nunca data:, nunca http(s)), alterando vite.config.ts, e reconferir a CSP no dist temporario fora do projeto. Sem unsafe-eval/unsafe-inline no build.
5. Pos-instalacao: o lock deve ganhar exatamente os 14 pacotes acima e nenhum outro, todos com integrity e resolved em registry.npmjs.org, sem novo hasInstallScript; audit = 0; comparar a arvore (ls --all) com esta lista; registrar o sha256 do lock.
6. Nada de metadados do VRM no console, URL ou armazenamento; so os console.warn do proprio pacote. Se algum warn incluir conteudo do arquivo, tratar como achado.
7. Esta aprovacao NAO cobre nenhum arquivo de modelo VRM: fonte, licenca, tamanho e strings/URIs embutidas exigem revisao propria antes de baixar/copiar.

## Plano de remocao
npm uninstall @pixiv/three-vrm (ou pnpm remove) remove os 14 pacotes e atualiza package.json e lockfile; reverter o loader em src/avatar para o anterior; reverter connect-src em vite.config.ts se alterado; apagar o .vrm de public/models/ se copiado; rodar build limpo e audit; conferir que o lock volta ao estado anterior; registrar a remocao.

## O que o registro de instalacoes deve conter
Data; @pixiv/three-vrm mais 13 transitivos (nomes listados); fonte registry.npmjs.org; versao 3.5.5 (publicado 2026-07-09); escopo projeto (devDependency); aprovador = usuario (aprovacao explicita, separada desta revisao); arquivos alterados (package.json, lockfile unica, node_modules, vite.config.ts se mudar CSP); comando de remocao; verificacao (provenance presente nos 14, 0 lifecycle scripts, audit = 0, build, teste de CSP/carga); adocao com data (168.945 downloads/semana em 2026-10-23 a 29; 2.247 estrelas; push 2026-10-22). Registrar tambem o gerenciador efetivo (SEC-P-001), os tarballs temporarios baixados por esta revisao (scratchpad/vrmtar, 7 .tgz publicos e extracoes, seguros de apagar) e que nenhum modelo foi baixado.

## Nao verificado
- Assinatura Sigstore/SLSA nao verificada criptograficamente (so presenca e metadados; npm audit signatures exige instalacao).
- Repositorio GitHub alem dos metadados (historico de commits e mantenedores, issues de seguranca); idoneidade das contas pessoais mantenedoras.
- Revisao linha a linha dos ~2,5 MB (so padroes perigosos e imports).
- Comportamento real de GLTFLoader/ImageBitmapLoader vs CSP em navegador; nenhum VRM carregado.
- npm audit da arvore nova (so possivel apos instalar; baseline atual: 0 vulnerabilidades).
- Qual modelo VRM sera usado, sua licenca e conteudo.
