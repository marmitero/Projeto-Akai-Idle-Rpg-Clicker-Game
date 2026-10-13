# ASSET_MANIFEST — Projeto Akai

Manifesto oficial dos assets de `sprites/`. Gerado por `tools/build_manifest.py`
a partir do scan real (`tools/scan_sprites.py` → `tools/out/sprite_inventory.json`).
O índice completo legível por máquina está em `docs/art/assets.json`.

- Arquivos inventariados (sem `.DS_Store`): **7493**
- Entradas com grade de quadros verificada (visual ou aritmética): **631**
- Entradas pendentes de inspeção humana: **6701**
- Licenças: **nenhuma confirmada** — ver `docs/art/ASSET_LICENSES.md`

## Metodologia

1. `tools/scan_sprites.py` lê cabeçalhos PNG/GIF/PSD com a stdlib do Python
   (Pillow indisponível no ambiente; ImageMagick usado apenas para conferência
   e prévias). Registra dimensões, modo de cor, alfa, bytes e SHA-1.
2. Duplicatas exatas detectadas por SHA-1 em `tools/out/sprite_duplicates.json`.
3. Grades de quadros foram confirmadas por (a) inspeção visual das linhas da
   sheet, (b) análise de colunas/linhas totalmente transparentes e (c) comparação
   com os `.gif` de quadro único do pack do protagonista.
4. Nenhuma sheet foi deduzida automaticamente: sem confirmação, a entrada fica
   `needsHumanInspection: true`.

## Status de inspeção

| status | quantidade |
|---|---|
| pending | 659 |
| verified-grid | 288 |
| verified-header | 6203 |
| verified-visual | 343 |

## Famílias e usos

### Protagonista (`sprites/Character/`)

22 arquivos raster.

| sheet | frame | animação | quadros | uso |
|---|---|---|---|---|
| `sprites/Character/Attack-01/Attack-01-Sheet.png` | 96x80 | attack | 8 | heroi: ataque automatico |
| `sprites/Character/Dead/Dead-Sheet.png` | 80x64 | death | 8 | heroi: derrota |
| `sprites/Character/Idle/Idle-Sheet.png` | 64x80 | idle | 4 | heroi: animacao idle na cena de combate |
| `sprites/Character/Jumlp-All/Jump-All-Sheet.png` | 64x64 | jump | 15 | - |
| `sprites/Character/Jump-End/Jump-End-Sheet.png` | 64x64 | jump_end | 3 | - |
| `sprites/Character/Jump-Start/Jump-Start-Sheet.png` | 64x64 | jump_start | 4 | - |
| `sprites/Character/Run/Run-Sheet.png` | 80x80 | run | 8 | heroi: caminhada/transicao entre ondas e andares |

### Inimigos (`sprites/Enemies/`)

762 arquivos raster.

- **Archer**: 44 arquivos; 0 sheets verificadas; 16 frames de sequência; 0 camadas de composição.
- **Bat**: 8 arquivos; 5 sheets verificadas; 0 frames de sequência; 0 camadas de composição.
- **Dude_Monster**: 17 arquivos; 7 sheets verificadas; 0 frames de sequência; 0 camadas de composição.
- **Female Base**: 167 arquivos; 167 sheets verificadas; 0 frames de sequência; 167 camadas de composição.
  - Sistema de composição: grade 80x64, 10 colunas x 7 linhas (orelhas: 9 colunas). Linhas: idle(5), walk(8), run(8), jump(4), cast(4), attack(6), death(10). Camadas: Skin, Clothing, Hair, Hat, Mask, Ears, Arm Layers, Hand — todas alinhadas no mesmo canvas, permitindo composição por empilhamento na mesma origem.
  - Peças: Female Arm Layers=7, Female Clothing=68, Female Ears=5, Female Hair=35, Female Hand=20, Female Hat=19, Female Mask=3, Female Skin=10
- **Inquisitor**: 156 arquivos; 0 sheets verificadas; 64 frames de sequência; 0 camadas de composição.
- **Lancer Skeleton**: 40 arquivos; 0 sheets verificadas; 20 frames de sequência; 0 camadas de composição.
- **Male Base**: 124 arquivos; 124 sheets verificadas; 0 frames de sequência; 124 camadas de composição.
  - Sistema de composição: grade 80x64, 10 colunas x 7 linhas (orelhas: 9 colunas). Linhas: idle(5), walk(8), run(8), jump(4), cast(4), attack(6), death(10). Camadas: Skin, Clothing, Hair, Hat, Mask, Ears, Arm Layers, Hand — todas alinhadas no mesmo canvas, permitindo composição por empilhamento na mesma origem.
  - Peças: Male Arm Layers=7, Male Clothing=26, Male Ears=5, Male Hair=33, Male Hand=18, Male Hat=22, Male Mask=3, Male Skin=10
- **Mushroom**: 7 arquivos; 5 sheets verificadas; 0 frames de sequência; 0 camadas de composição.
- **Owlet Monster**: 17 arquivos; 0 sheets verificadas; 0 frames de sequência; 0 camadas de composição.
- **Pink Monster**: 17 arquivos; 0 sheets verificadas; 0 frames de sequência; 0 camadas de composição.
- **Shadow**: 46 arquivos; 0 sheets verificadas; 16 frames de sequência; 0 camadas de composição.
- **Shield Skeleton**: 47 arquivos; 0 sheets verificadas; 22 frames de sequência; 0 camadas de composição.
- **Skeleton**: 46 arquivos; 0 sheets verificadas; 23 frames de sequência; 0 camadas de composição.
- **Slime**: 5 arquivos; 3 sheets verificadas; 0 frames de sequência; 0 camadas de composição.
- **Warrior**: 1 arquivos; 0 sheets verificadas; 0 frames de sequência; 0 camadas de composição.
- **Zombie_1**: 5 arquivos; 5 sheets verificadas; 0 frames de sequência; 0 camadas de composição.
- **Zombie_2**: 5 arquivos; 5 sheets verificadas; 0 frames de sequência; 0 camadas de composição.
- **Zombie_3**: 5 arquivos; 5 sheets verificadas; 0 frames de sequência; 0 camadas de composição.
- **Zombie_4**: 5 arquivos; 5 sheets verificadas; 0 frames de sequência; 0 camadas de composição.

### Bosses (`sprites/Boss/`)

6160 arquivos raster.

| família | frame | direções na sheet | animações | observação |
|---|---|---|---|---|
| Assassin | 480x480 | 4 | 7 | usar apenas Left/Right no combate lateral (§3.5) |
| Caveman Boss | 840x720 | 4 | 7 | usar apenas Left/Right no combate lateral (§3.5) |
| Chief Goblin | 480x480 | 4 | 7 | usar apenas Left/Right no combate lateral (§3.5) |
| Female Goblin | 480x480 | 4 | 7 | usar apenas Left/Right no combate lateral (§3.5) |
| Giant Goblin | 840x720 | 4 | 7 | usar apenas Left/Right no combate lateral (§3.5) |
| Male Goblin | 480x480 | 4 | 7 | usar apenas Left/Right no combate lateral (§3.5) |
| Pirate Leader | 840x720 | 4 | 7 | usar apenas Left/Right no combate lateral (§3.5) |
| Pirate Zombie | 840x720 | 4 | 7 | usar apenas Left/Right no combate lateral (§3.5) |
| Robber | 480x480 | 4 | 7 | usar apenas Left/Right no combate lateral (§3.5) |
| Robot1 | 0x0 | 0 | 0 | sem grade regular — inspeção humana |
| Robot2 | 0x0 | 0 | 0 | sem grade regular — inspeção humana |
| Robot3 | 0x0 | 0 | 0 | sem grade regular — inspeção humana |
| Squidman | 840x720 | 4 | 7 | usar apenas Left/Right no combate lateral (§3.5) |
| Thug | 480x480 | 4 | 7 | usar apenas Left/Right no combate lateral (§3.5) |
| Troll1 | 0x0 | 0 | 0 | sem grade regular — inspeção humana |
| Troll2 | 0x0 | 0 | 0 | sem grade regular — inspeção humana |
| Troll3 | 0x0 | 0 | 0 | sem grade regular — inspeção humana |
| Viking Leader | 840x720 | 4 | 7 | usar apenas Left/Right no combate lateral (§3.5) |

Robot1-3 e Troll1-3 possuem sequências PNG de dimensões irregulares (renderização vetorial): **não** são grades utilizáveis sem recorte assistido; ficam pendentes e fora do MVP.

### Mineração (`sprites/Mine/`)

4 arquivos raster.

| arquivo | dimensão | uso |
|---|---|---|
| `sprites/Mine/coalNode.png` | 16x16 | no/visual da mina de carvao |
| `sprites/Mine/goldNode.png` | 16x16 | no/visual da mina de ouro |
| `sprites/Mine/ironNode.png` | 16x16 | no de ferro clicavel (area central) |
| `sprites/Mine/jadeNode.png` | 16x16 | no/visual da mina de jade |

### Ícones de recursos (`sprites/Materials/`)

38 arquivos raster.

38 ícones 32x32 (série Icon31). Mapeamento oficial de recursos:

| recurso | arquivo |
|---|---|
| ferro | `sprites/Materials/Icon31_15.png` |
| carvão | `sprites/Materials/Icon31_13.png` |
| ouro | `sprites/Materials/Icon31_35.png` |
| jade | `sprites/Materials/Icon31_40.png` |

### Tiles (`sprites/Tiles/`)

3 arquivos raster.

| arquivo | dimensão | observação |
|---|---|---|
| `sprites/Tiles/Floor Tiles1.png` | 288x576 | tileset **96x96** (3 col x 6 lin): linhas 0/2/4 = blocos sólidos com topo verde/laranja/neve; linhas 1/3/5 = peças de autotile (cruz, bordas, espinhos). Correção de auditoria de 2026-10-13: a grade anterior de 48x48 estava errada e fatiava bordas transparentes |
| `sprites/Tiles/Floor Tiles2.png` | 288x576 | variante alternativa (mesma grade 96x96) |
| `sprites/Tiles/Tall Grass.png` | 96x32 | grama alta decorativa |

### Fundos em camadas (`sprites/Backgrounds/`)

18 arquivos raster.

Três biomas (Normal, Autumn, Winter), cada um com 5 camadas 1024x346 (camada 5 vazia nos três) + um elemento distante de castelo. No jogo as camadas são desenhadas em ordem 1→4 + castelo, com parallax. A camada 5 vazia fica registrada como lacuna do pack.

### Efeitos (`sprites/Effects/`)

70 arquivos raster.

70 arquivos: tiras de impacto/explosão (`* Bullet Impact Explosion 32x32.png`, 192x64 = 6 quadros de 32x32), tiras de status sobre o personagem (400x64, grades individuais pendentes de verificação) e gifs de explosão colorida. No MVP usam-se `Red Effect Bullet Impact Explosion 32x32.png` (impacto) e `Character effects curved lines.png` (slash). As sheets 640x512/864x672 (blood/buff) permanecem pendentes.

### Equipamentos (`sprites/Equipments/`)

240 arquivos raster.

Dimensões predominantes: 32x32 x240
Ícones 32x32 organizados por slot: 2 hands, Armors, Arrows, Axes, Boots, Daggers, Gloves, Hats, Maces, Shields, Spears, Swords. Cada slot tem 10-20 variantes para raridades/progressão.

### Acessórios (`sprites/Acessories/`)

20 arquivos raster.

Dimensões predominantes: 32x32 x20

### Miscelânea (`sprites/Misc/`)

140 arquivos raster.

Dimensões predominantes: 32x32 x140

### Decoração (`sprites/Assets/`)

16 arquivos raster.

Dimensões predominantes: 256x208 x4, 224x192 x3, 416x544 x1, 192x128 x1

## Lacunas e incompatibilidades registradas

1. **Nenhum arquivo de licença ou atribuição** acompanha qualquer pack.
2. `sprites/Enemies/Warrior/GandalfHardcore Warrior.png` (800x1088) é uma folha irregular sem grade confirmada — pendente.
3. `sprites/Boss/Robot1..3` e `Troll1..3`: sequências de dimensões irregulares, sem grade; inadequados para o pipeline de sheets do MVP.
4. Camada 5 dos fundos é totalmente transparente nos três biomas.
5. `sprites/Character/Jumlp-All/` contém typo no nome da pasta (mantido; não renomear assets sem justificativa).
6. 751 grupos de duplicatas exatas (SHA-1), majoritariamente frames repetidos entre direções de bosses; ver `tools/out/sprite_duplicates.json`.
7. Não há sprites de mascote adequados (lacuna documentada para a Fase 4, conforme master-prompt §14).
8. Não existe ícone de moeda (coins) nos packs: `Misc/Loots` contém ervas/frutas, não moedas. A HUD desenha uma moeda em CSS e a lacuna fica registrada aqui; substituir por sprite real quando um pack licenciado for aprovado.
