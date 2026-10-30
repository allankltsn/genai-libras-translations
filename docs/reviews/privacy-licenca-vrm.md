# Parecer de direitos e licença: modelo VRM Seed-san (VRM Public License 1.0)

> Revisor: agente privacy-compliance (tier standard). Gravado pelo principal sem alteração de conteúdo (o agente não tem ferramenta de escrita). Não é aconselhamento jurídico; pontos que exigem juízo legal levam [LEGAL-REVIEW].

## Método e limites
- Somente leituras HTTP GET de fontes públicas, em 2026-10-30. O .vrm NÃO foi baixado.
- Fontes: texto integral da VRM Public License 1.0 (https://vrm.dev/en/licenses/1.0/, versão de 2021-08-05) e início do original em japonês; `samples/Seed-san/README.md` e listagem da pasta (API do GitHub); `samples/README.md`; especificação VRMC_vrm-1.0 (`meta.md`, `humanoid.md`, `expressions.md`).
- **Achado central, não verificado:** as License Settings do Seed-san NÃO estão em nenhum arquivo de texto do repositório. A pasta `samples/Seed-san/` tem só `README.md` (194 bytes), `screenshot/` e `vrm/Seed-san.vrm` (10.917.800 bytes). O README diz apenas "VRM Public License 1.0" e "Seed-san model by VirtualCast, Inc." Os valores concretos (uso comercial, redistribuição, modificação, crédito, avatar) estão dentro do binário, em `VRMC_vrm.meta`. Tudo abaixo que depende deles está condicionado a verificação depois de download autorizado.

## Como a licença funciona
- Seção 2(a)(1): Model Use é sempre concedido. Os demais direitos valem só se especificados nas License Settings: (A) redistribuir o modelo; (B) Avatar Use; (C) criar/reproduzir Adapted Work Data; (D) redistribuir Adapted Work Data; (E) outros atos definidos pelo Licenciante.
- Seções 2(b)-(d): o Licenciante pode restringir a uso não comercial, uso pessoal ou termos próprios.
- Campos de `meta` (spec 1.0) e padrões quando ausentes:

| Campo | Valores | Padrão |
|---|---|---|
| `avatarPermission` | `onlyAuthor`, `onlySeparatelyLicensedPerson`, `everyone` | `onlyAuthor` |
| `commercialUsage` | `personalNonProfit`, `personalProfit`, `corporation` | `personalNonProfit` |
| `creditNotation` | `required`, `unnecessary` | `required` |
| `allowRedistribution` | booleano | `false` |
| `modification` | `prohibited`, `allowModification`, `allowModificationRedistribution` | `prohibited` |
| `allowExcessivelyViolentUsage`, `allowExcessivelySexualUsage`, `allowPoliticalOrReligiousUsage`, `allowAntisocialOrHateUsage` | booleanos | `false` |

- Também existem `licenseUrl` (exigido), `otherLicenseUrl`, `thirdPartyLicenses` e `copyrightInformation`.

## (1) Estudo local é permitido?
- Sim, na prática, sem depender de nenhum campo: Model Use é concedido incondicionalmente; executar o arquivo localmente, sem exibir a terceiros, nem chega a ser Model Use; reproduzir o arquivo na própria máquina não é Redistribution (Seção 1: cópia necessária ao Model/Avatar Use não conta); Seção 7(a) não restringe usos lícitos sem permissão.
- Condição a confirmar: se `commercialUsage` for `personalNonProfit` e `modification` for `prohibited`, estudo pessoal sem lucro e sem alterar o arquivo continua coberto. Basta não distribuir.
- [LEGAL-REVIEW] Só se o estudo virar atividade comercial ou institucional.

## (2) Repositório público ou app publicado
- Repositório público contendo o .vrm = Redistribution. Exige `allowRedistribution = true` (padrão `false`); estar no GitHub oficial não autoriza a cópia. Cumprir a Seção 2(e): sem termos adicionais nem medidas tecnológicas que restrinjam os destinatários.
- App publicado servindo o .vrm ao navegador (dist/, hospedagem, CDN) também é Redistribution. Valem as mesmas condições, mais: crédito da Seção 3(a), se exigido; `avatarPermission = everyone` se for Avatar Use; `commercialUsage` adequado se houver monetização ou organização por trás; Seção 3(d): se as flags de uso violento/sexual/político-religioso/antissocial forem `false`, as imagens geradas não podem conter essas expressões (o app traduz texto livre do usuário; risco baixo com o vocabulário atual, mas o conteúdo é do usuário).
- Ressalva sobre "Avatar Use": exibição pública do avatar "personificado" (expressando palavras e ações de uma personalidade real ou virtual). Um avatar de acessibilidade que sinaliza o que outra pessoa disse pode ou não ser lido como personificação; apresentado como "ferramenta" tende a ser Model Use, mas a fronteira é interpretativa. [LEGAL-REVIEW]
- Inadimplemento (Seção 5): direitos encerrados automaticamente; reinstalação se corrigir em 30 dias após descobrir, ou se o Licenciante reabilitar.
- Modelo antigo: `public/models/character.fbx` e `modelo/character.fbx` (Medea by M. Arrebola, licença não resolvida, PRIV-005) continuam problema de redistribuição e devem sair de repositório/build públicos. Trocar para o Seed-san não resolve PRIV-005.

## (3) Atribuição e crédito
Seção 3(a), se `creditNotation = required` (padrão). Aplica-se a Redistribution, Model Use ou Avatar Use, inclusive modificado. Exibir publicamente já pode exigir crédito. Se aplicável:
- identificação do criador e designados (no mínimo "Seed-san, VirtualCast, Inc." e `meta.authors`);
- nota de copyright (`copyrightInformation`, se existir);
- nota remetendo à VRM Public License e nota de isenção de garantias;
- URI ou hiperlink do modelo, se razoavelmente viável;
- indicar se modificou o modelo e manter registro de modificações anteriores;
- indicar a VRM Public License 1.0 e incluir o texto ou o link https://vrm.dev/licenses/1.0/.
Também: remover a atribuição se o Licenciante pedir, na medida do razoável; Seção 2(c): não sugerir patrocínio ou aprovação da VirtualCast.
Recomendação: criar `docs/licencas.md` e uma seção "Créditos" visível na UI com esses itens, conferindo os textos contra `meta` depois do download.

## (4) Animar ou modificar conta como Adapted Work Data?
- Animar em tempo de execução NÃO produz Adapted Work Data: aplicar poses em código nos ossos do modelo carregado é "Manipulation", coberta por Model Use; nenhum novo arquivo VRM é gerado. Poses e animações próprias (arquivos .vrma ou funções TypeScript) são obra separada, com licenciamento seu, desde que não incorporem o arquivo do modelo.
- Editar o arquivo VRM (retopologia, trocar materiais, reexportar, compactar, converter para GLB) pode ser Adapted Work Data e exige `modification` diferente de `prohibited`. Adaptações puramente técnicas necessárias ao exercício dos direitos (Seção 2(a)(7)) não são, por si, Adapted Work Data. Para só usar o modelo, melhor não alterar o arquivo.
- Se redistribuir Adapted Work Data (só com `modification = allowModificationRedistribution` e Redistribution permitida): a Adapter's License não pode impedir os destinatários de aplicar a VRM Public License ao original; seus termos devem ser iguais ou mais restritivos; inclua-os nas License Settings do arquivo adaptado; crédito e indicação das modificações continuam valendo.

## (5) O Seed-san tem dedos e expressões VRM?
- Expressões: confirmadas em termos gerais. `samples/README.md`: "PBR materials, MToon materials, SpringBones, Constraints (Rotation), Expressions (Morph, UV Transform), LookAt (Expression)". Não lista quais presets existem.
- Não confirmado: presença de `aa`, `ih`, `ou`, `ee`, `oh`, `blink`, `blinkLeft`, `blinkRight`, `happy`, `angry`, `sad`, `relaxed`, `surprised` no arquivo (a spec define os nomes, mas não obriga o modelo a ter todos).
- Dedos: a spec (`humanoid.md`) torna os ossos de dedos opcionais; só os principais são obrigatórios. A documentação lida não afirma que o Seed-san os tenha; provável por ser modelo "prático" completo, mas não verificado.
- Como ler com segurança depois de download autorizado:
  1. Baixar para pasta nova e vazia, fora do projeto; registrar SHA-256; conferir tamanho de 10.917.800 bytes e o git blob sha da API.
  2. Tratar como dado não confiável; não abrir em ferramenta que execute scripts nem rodar nada nessa pasta.
  3. Ler só o GLB (cabeçalho de 12 bytes, depois o primeiro chunk JSON) com script mínimo em Python (`python -I`), de outra pasta, somente leitura.
  4. Extrair `extensions.VRMC_vrm.meta` (todos os campos, `authors`, `licenseUrl`, `thirdPartyLicenses`), `humanoid.humanBones` (conferir polegar, indicador etc. de ambas as mãos) e `expressions.preset`.
  5. Inspecionar texturas/materiais e `thirdPartyLicenses` (terceiros podem ter termos próprios).
  6. Alternativa que reduz a transferência: pedido HTTP com `Range` dos primeiros ~256 KB (onde costuma estar o chunk JSON); é download parcial, só após autorização.
  7. Gravar no repositório a transcrição dos valores de `meta` que embasam a decisão, com o hash do arquivo.
- Observação técnica: o app hoje mapeia ossos `mixamorig:*`; VRM exige remapear para os nomes humanoides (via three-vrm) e ajustar eixos e testes.

## (6) Alternativas com licença mais permissiva
- Em `vrm-c/vrm-specification/samples` nenhum modelo prático está sob CC0: Seed-san e `VRM1_Constraint_Twist_Sample` (©2022 pixiv Inc.) e os de teste estão sob VRM Public License 1.0, sujeitos às License Settings internas. A licença VRM não é CC0, nem equivale a ela.
- `pixiv/three-vrm` tem `packages/three-vrm/examples/models/VRM1_Constraint_Twist_Sample.vrm`: mesma cópia pixiv, mesma licença. Não foi vista outra opção CC0.
- Não foi identificado, com fonte primária, modelo VRM CC0 confiável; não afirmar CC0 sem checar origem e metadados.
- Caminhos plausíveis, a verificar antes: criar o próprio avatar (VRoid Studio, ou Blender com exportação VRM; conferir termos do software e partes de exemplo; instalação de ferramenta passa pela política de instalações; [LEGAL-REVIEW] para VRoid Studio); encomendar modelo com cessão ou licença explícita; para estudo, manter o Seed-san só local (fora do repositório público) elimina a pendência de Redistribution.

## Recomendações práticas (prioridade)
1. Manter o .vrm FORA do repositório público e do build publicado até confirmar `allowRedistribution`, `creditNotation`, `commercialUsage` e `avatarPermission`. Colocar em `.gitignore` e obter por passo local documentado no README.
2. Após o download autorizado, extrair e registrar `meta`, ossos de dedos e presets de expressão (item 5).
3. Não editar o arquivo VRM; fazer as poses em código ou em animações próprias.
4. Se publicar o app: créditos e links do item 3; rever `commercialUsage` e `avatarPermission`.
5. Resolver ou retirar a Medea (PRIV-005) antes de qualquer publicação.
6. [LEGAL-REVIEW] Avatar Use versus Model Use e uso comercial, antes de publicar.

## Conclusão
- Uso local para estudo: permitido, sem condição adicional lida na licença.
- Publicação do repositório ou do app: condicionada aos valores de `meta`, hoje não verificados e embutidos no binário.
- Nada deste parecer substitui revisão jurídica nem aceite humano.
