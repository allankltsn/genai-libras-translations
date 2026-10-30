# Licencas e creditos

Nao e aconselhamento juridico. Itens que pedem juizo legal: [LEGAL-REVIEW].

## Modelo 3D: Seed-san (obrigatorio creditar)
- Modelo: **Seed-san**, por **VirtualCast, Inc.** (copyright: VirtualCast, Inc.).
- Licenca: **VRM Public License 1.0**, https://vrm.dev/licenses/1.0/ (campo `licenseUrl` do arquivo).
- Origem: https://github.com/vrm-c/vrm-specification/tree/master/samples/Seed-san
- Arquivo: `public/models/Seed-san.vrm`, 10.917.800 bytes, SHA-256 `624d0d554bc205bbdc33e22a68a2c3c20edebb3e573011ead8878a65e5329b23`.
- `meta` (transcricao): creditNotation = required; avatarPermission = everyone; commercialUsage = corporation; allowRedistribution = true; modification = allowModificationRedistribution; flags de uso violento/sexual/politico-religioso/antissocial = true. Detalhes: `docs/licencas-vrm-seed-san.md`.
- **Modificacao: nenhuma.** O arquivo e usado como esta; as poses e expressoes sao feitas em codigo, em tempo de execucao (nao geram novo arquivo VRM). Se isso mudar, registrar a modificacao aqui.
- **Sem endosso:** este app nao e patrocinado nem aprovado pela VirtualCast. Sem garantias (ver o texto da licenca).
- Onde o credito aparece: rodape sempre visivel da interface (`index.html`, `#credits`), fora do painel recolhivel. Os dados do credito sao texto fixo do app (nao lidos de `meta` em tempo de execucao: nenhum metadado do VRM vai para console, URL, armazenamento ou HTML).
- **AVISO `dist/`:** `pnpm run build` copia `public/` para `dist/`, entao `dist/models/Seed-san.vrm` vai junto; **publicar `dist/` e Redistribuicao** do modelo. A licenca permite (com credito), mas o usuario ainda nao decidiu publicar; o build imprime um [AVISO] (`scripts/build-notice.mjs`).
- Redistribuicao: o `.vrm` esta em `.gitignore` e NAO e publicado pelo repositorio ate decisao do usuario. Obter: copiar de novo da origem acima e conferir o SHA-256 (comando no README).
- [LEGAL-REVIEW] "Avatar Use" versus "Model Use" e uso comercial, antes de publicar o app.

## Codigo e dependencias
- `@pixiv/three-vrm` 3.5.5 e sub-pacotes: MIT (pixiv Inc.). `three`: MIT. Demais devDependencies: ver `docs/operations/dependencias-instaladas.md` (licencas por pacote). O bundle de producao inclui three e three-vrm.
- Nao ha fontes, CDNs nem scripts externos em tempo de execucao.

## Modelo antigo (fora do app)
`legacy/character.fbx` e `modelo/character.fbx` (Medea by M. Arrebola): licenca NAO resolvida (PRIV-005, [LEGAL-REVIEW] do usuario). Nao redistribuir.
