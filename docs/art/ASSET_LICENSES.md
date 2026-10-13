# ASSET_LICENSES — situação legal dos packs

**Status global: NENHUMA LICENÇA CONFIRMADA.** Nenhum arquivo de licença,
README, atribuição ou contrato acompanha os packs dentro de `sprites/`
(verificação feita por varredura completa de nomes de arquivo em 2026-10-13:
0 arquivos `.txt/.md/.pdf/LICENSE/README` encontrados).

Consequência normativa (Constituição §4.10 e master-prompt §3.8):
todo asset permanece `licenseStatus: pending-verification` em
`docs/art/assets.json` e **não pode** ser tratado como liberado para
lançamento comercial até confirmação humana com fonte primária.

## 1. Proveniência provável (HIPÓTESE, não confirmação)

Estilos/estruturas de pasta sugerem origem em packs públicos conhecidos;
a confirmação exige consultar as páginas originais e guardar evidência
(url, data, termos):

| família | indícios | hipótese de origem | uso comercial provável |
|---|---|---|---|
| `Character/` (+ `.aseprite`, `.gif`) | estrutura de pastas de animação única | pack de herói pixel art de itch.io | a confirmar |
| `Enemies/Dude_Monster, Mushroom, Slime, Bat, Owlet, Pink Monster, Zombie_*` | nomes e grids 32/64/128 | packs "monsters" de itch.io (estilo Ansimuz) | a confirmar |
| `Enemies/Skeleton, Lancer/Shield Skeleton, Archer, Shadow, Inquisitor` | frames 128x96 nomeados | packs de esqueletos/humanoides itch.io | a confirmar |
| `Enemies/Male Base, Female Base` | grade 80x64, camadas LPC-like | gerador de personagens LPC-like | a confirmar (LPC é GPL/CC-BY-SA em parte!) |
| `Boss/*` (AI/EPS/PNG Sequences/Spritesheets/`.scml`) | estrutura de pack vetorial | packs comerciais/"free" de loja de assets | a confirmar |
| `Backgrounds/` ("GandalfHardcore layers") | nome de autor no arquivo | itch.io / OpenGameArt | a confirmar |
| `Materials/Equipments/Acessories/Misc` (Icon31/Icon1xx…) | séries numeradas de ícones | packs de ícones RPG | a confirmar |
| `Mine/*Node.png`, `Tiles/Floor Tiles*` | tilesets 16/48 px | packs de tileset | a confirmar |

**Atenção especial**: famílias LPC-like podem carregar cláusulas copyleft
(GPL/CC-BY-SA). Se confirmado, a composição de personagens herdaria obrigações
de atribuição/compartilhamento — decisão registrada como pendência crítica.

## 2. Procedimento de confirmação (obrigatório antes da Fase 10)

1. Localizar a página original de cada pack (busca reversa por nome/estrutura).
2. Registrar em `docs/art/assets.json`: `licenseStatus` = `confirmed-<spdx>`,
   `attribution` = texto exigido, `sourceUrl`, `verifiedAt`, `verifiedBy`.
3. Arquivar captura dos termos em `docs/art/licenses/` (fora do bundle).
4. Packs não confirmados são **removidos do bundle de release** (não do repo,
   até decisão), nunca mantidos por conveniência.

## 3. Regras de uso interim (dev interno)

- Uso em desenvolvimento e testes internos: permitido como referência.
- Builds públicas/comerciais: bloqueadas pelo RELEASE_CHECKLIST enquanto
  houver `pending-verification` em asset embarcado.
- Atribuições que vierem a ser exigidas serão exibidas em tela de créditos
  dentro do jogo e na página da loja.
