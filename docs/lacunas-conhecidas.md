# Lacunas conhecidas e estado real (atualizado em 2026-10-30, migracao para VRM)

## Modelo atual
- `public/models/Seed-san.vrm` (VRM 1.0, Seed-san, VirtualCast, Inc., VRM Public License 1.0). Origem, hash e `meta` verificados: `docs/licencas-vrm-seed-san.md`; creditos e licenca: `docs/licencas.md`. O arquivo e git-ignorado (nao redistribuido pelo repositorio publico) e NAO foi editado.
- O personagem antigo (FBX 6.1 "Medea", nao carregavel pelo FBXLoader, licenca nao resolvida, PRIV-005) saiu do app: `public/models/character.fbx` foi movido para `legacy/character.fbx`; `modelo/character.fbx` (origem original) foi mantido. Nada no codigo os referencia mais. PRIV-005 continua pendente do usuario enquanto esses arquivos existirem no repositorio/pasta, e eles nao devem ir para repositorio/build publico.

## O que foi VISTO em execucao (2026-10-30, Chrome headless local com WebGL por software, build sob `vite preview`, sem instalar nada)
- O VRM carrega com a CSP do build (`connect-src 'self' blob:`); 0 mensagens de console/violacao de CSP; overlay de carga some; controles habilitam.
- Sem `blob:` em `connect-src`: violacao medida ("Connecting to 'blob:...' violates ... connect-src 'self'") e o modelo nao carregava; por isso so `connect-src` ganhou `blob:` (ver `vite.config.ts`).
- Capturas de tela (descartadas apos a inspecao): pose de repouso com bracos pendentes e levemente a frente; "Oi / ola" levanta o braco direito do personagem com a mao aberta (aceno plausivel); "Letra L" e "Agua" levantam a mao direita perto do rosto com o indicador estendido; "Negacao (nao)" vira a cabeca e franze as sobrancelhas; "Duvida" inclina e gira a cabeca.
- Camera reposicionada (z=2.3) para mostrar cabeca, tronco e maos.

## NAO verificado / limitacoes
- **`dist/` contem o `.vrm`:** publicar `dist/` e Redistribuicao do Seed-san (permitida com credito pela licenca, mas sem decisao do usuario de publicar). O build imprime aviso; ver README.md e docs/licencas.md.
- Os sinais foram vistos por mim em capturas isoladas de um instante (~1 s apos o clique) e so alguns (Oi, Letra L, Agua, Duvida, Negacao). Os demais (Banheiro, Comer, Por favor, Obrigado, Desculpa, Tudo bem, Espaco neutro, Troca de papel, Letras A/Y) nao foram inspecionados; **ninguem validou qualquer sinal como Libras correta**: todos exigem intérprete de Libras / pessoa surda.
- Dedos: o polegar tem eixo incerto e a posicao fina dos dedos nao foi examinada de perto. Nao foi verificado se maos atravessam o corpo/rosto em todos os sinais.
- Sobrancelhas: a franzida (Negacao) e visivel; a levantada (Duvida) fica coberta pela franja do cabelo e nao foi distinguivel nas capturas. Emocoes (happy/sad) e visemas/piscar dirigidos por texto: implementados e testados como logica pura, nao observados em movimento. Os visemas sao estimativa por vogais, NAO lip-sync.
- O modelo tem um acessorio "robo arm" (malha propria) que fica pendurado de forma estranha ao lado do personagem (molas/spring bones): e do modelo, nao foi alterado.
- Browser real do usuario (Chrome/Edge/Firefox/Safari com GPU), mobile, layout responsivo, foco/teclado, contraste medido, leitor de tela, Web Speech real, dialogo de consentimento (foco/Esc), bfcache, `#stop-float` sobre o avatar: NAO verificados.
- Firefox/Safari: o GLTFLoader pode usar TextureLoader em vez de ImageBitmapLoader (usa `img-src blob:`, ja permitido); nao testado.
- Desempenho: bundle ~780 kB (gzip ~196 kB) e VRM de 10,9 MB; sem medicao de FPS.
- Datilologia A-Z completa (2026-10-30): 26 poses estaticas APROXIMADAS (`src/signs/handshapes.ts`, `letters.ts`), NAO validadas por interprete de Libras/surdo e NAO vistas em navegador. Faltam orientacao da palma, contato entre dedos e movimento real; H, J, X e Z usam movimento simples de punho/dedo; P/Q reaproveitam K/G com o punho para baixo; V/K/W usam abertura entre dedos em eixo nao validado; M/N/T/E dependem do polegar (eixo mais incerto). "Ç" vira "C" (sem sinal proprio); digitos continuam sem pose (aviso mantido). A letra "a" isolada continua descartada como artigo.
- Modo IA (API local): so testado com mocks de `fetch` (respostas fixas, malformadas, timeout, API fora, generated hostil). NAO foi feito teste de ponta a ponta com a API real: a API carrega `api/.env` mesmo com `LLM_PROVIDER=fake`, entao nao foi iniciada (regra do pedido). Proxy do Vite, chaves da UI, rotulo de sinal gerado e estado "Modo local (API indisponivel)" nao foram vistos em navegador nesta rodada.
- Sinais gerados por IA (experimentais): nao sao Libras; a validacao do front e estrutural/anatomica conservadora, nao semantica.
- Sem controle de velocidade; `prefers-reduced-motion` afeta so o spinner (a animacao do avatar e o conteudo; use "Parar").
- Avatar Use versus Model Use (VRM Public License) e uso comercial: [LEGAL-REVIEW] antes de publicar. Credito visivel no rodape ja existe.
- Nao ha teste automatizado que leia o VRM (nao ha `@types/node` e nada novo foi instalado); a conferencia dos 42 ossos usados contra o arquivo foi feita com um script temporario e esta registrada na entrega.
