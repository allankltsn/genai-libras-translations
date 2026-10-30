# Modelo VRM Seed-san: origem, licença e capacidades (verificado no arquivo)

Verificação feita em 2026-10-30 pelo principal, com leitura somente do bloco JSON do GLB (`VRMC_vrm.meta`), sem executar o arquivo.

## Origem e integridade
- Fonte: https://github.com/vrm-c/vrm-specification/tree/master/samples/Seed-san (autor: VirtualCast, Inc.)
- Arquivo: `Seed-san.vrm`, 10.917.800 bytes, formato glTF binário, VRM 1.0 (`VRMC_vrm`).
- SHA-256: `624d0d554bc205bbdc33e22a68a2c3c20edebb3e573011ead8878a65e5329b23`
- Git blob SHA-1: `ff4223f9b42c8f22be35dcf23abe477d93101300` (igual ao publicado pela API do GitHub).
- Licença declarada: VRM Public License 1.0 (https://vrm.dev/licenses/1.0/).

## `VRMC_vrm.meta` (transcrição)
| Campo | Valor |
|---|---|
| authors / copyrightInformation | VirtualCast, Inc. |
| licenseUrl | https://vrm.dev/licenses/1.0/ |
| avatarPermission | everyone |
| commercialUsage | corporation |
| creditNotation | **required** |
| allowRedistribution | true |
| modification | allowModificationRedistribution |
| allowExcessivelyViolentUsage / Sexual / PoliticalOrReligious / AntisocialOrHate | true / true / true / true |

Consequência prática (não é aconselhamento jurídico): estudo local, redistribuição e modificação são permitidos; **a atribuição é obrigatória** (ver `privacy-licenca-vrm.md`, item 3, para o conteúdo do crédito). Pendente de revisão jurídica, se o app for publicado: Avatar Use versus Model Use.

## Capacidades confirmadas no arquivo
- Ossos humanoides: 51, dos quais **30 são dedos** (por mão: polegar metacarpo/proximal/distal; indicador, médio, anelar e mindinho proximal/intermediário/distal).
- Expressões VRM (presets): aa, ih, ou, ee, oh, blink, blinkLeft, blinkRight, happy, angry, sad, relaxed, surprised, neutral, lookUp/Down/Left/Right. Nenhuma expressão custom.
- Morph targets na malha (43), incluindo sobrancelhas (`eye_brow_up/down`, L/R), olhos (`eye_close`, `eye_smile`...), boca (`lip_a/e/i/o/u`, `mouth_wide`, `mouth_short`, `mouse_open`) e emoções (`face_happy/sad/angry/surprise/relax`). As sobrancelhas **não** estão expostas como expressão VRM; só dá para usá-las acionando os morph targets diretamente.
- Texturas: 15 imagens embutidas no arquivo; nenhuma URI externa em imagens ou buffers.
- Estrutura: 147 nós, 5 malhas, 5 skins. Extensões: springBone, MToon, node_constraint, KHR_materials_unlit, KHR_texture_transform, KHR_materials_emissive_strength.

## Pendências
- Revisão jurídica antes de publicar (Avatar Use). Atribuição obrigatória na UI e em `docs/` ao publicar.
- Não editar o arquivo VRM; poses em código.
- O `.vrm` fica fora do repositório público (`.gitignore`) até decisão de publicação.
- Sem teste visual: capacidades acima são do arquivo, não da renderização no app.
