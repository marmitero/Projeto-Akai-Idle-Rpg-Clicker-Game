# AUDIT_REPORT — Etapa 1 (inspeção real do repositório)

Data: 2026-10-13 · Branch: `arena/b129a2d4-projeto-akai-idle-rpg-clicker`
Base: commit `23f39ca` ("Create master-prompt.md") · working tree limpo no início.

## 1. Estado atual do projeto

- Repositório continha **apenas** `docs/master-prompt.md` (1.914 linhas) e
  `sprites/` (1,2 GB). Nenhum código, dependência, build, teste ou CI.
- Sem backend, banco, autenticação ou infraestrutura prévia.
- Sem segredos versionados; sem `.gitignore` (criado nesta entrega).
- 24 arquivos `.DS_Store` presentes em `sprites/` (ignorados no inventário;
  recomenda-se removê-los em commit próprio com aprovação do dono do repo —
  não removidos agora para preservar trabalho alheio).

## 2. Tecnologias encontradas / disponíveis

- Node v22.22.3, npm 10.9.8, Python 3.11.2 (sem Pillow; PEP 668), ImageMagick
  (`identify`/`convert`) no ambiente de desenvolvimento.
- Registry npm acessível (verificado com `npm ping`).

## 3. Assets encontrados (resumo; detalhe no manifesto)

| família | arquivos | achado principal |
|---|---|---|
| Character | 22 | sheets do herói com frame confirmado via `.gif`: idle 64x80x4, run 80x80x8, attack 96x80x8, dead 80x64x8, jump 64x64 |
| Enemies | 762 | bases Male/Female (291 camadas 800x448, grade 80x64 10x7 verificada visualmente); esqueletos 128x96 em sequências; pequenos 32/64/80/128 |
| Boss | 6.184 | 12 famílias com sheets 4 direções (frame 480x480 ou 840x720) + Robot1-3/Troll1-3 irregulares |
| Equipments/Acessories/Misc/Materials | 438 | ícones 32x32 por slot; Icon31 = recursos |
| Mine | 4 | nós 16x16 de carvão/ferro/ouro/jade — **todos os caminhos do §3.6 existem** |
| Tiles | 3 | `Floor Tiles1.png` 288x576 (tileset 48x48, 3 variantes) |
| Backgrounds | 18 | 3 biomas x 5 camadas 1024x346 (camada 5 vazia) + castelo distante |
| Effects | 70 | biblioteca 32x32 verificada (640x512, 20x16 células) + tiras pendentes |
| Assets | 16 | árvores, nuvens, sol, tocha, decoração |

Duplicatas exatas (SHA-1): 751 grupos / 1.991 arquivos
(`tools/out/sprite_duplicates.json`).

## 4. Componentes reaproveitáveis

Nenhum código prévio. Tudo que é reaproveitável são **assets** (acima) e o
`master-prompt.md` como especificação.

## 5. Problemas identificados

1. Zero licenças/atribuições nos packs → bloqueio de release comercial
   (ASSET_LICENSES.md).
2. Packs LPC-like podem ser copyleft → pendência crítica de licenciamento.
3. Robot/Troll: sequências sem grade → fora do pipeline do MVP.
4. `Warrior/GandalfHardcore Warrior.png` (800x1088) sem grade confirmada.
5. Camada 5 dos fundos vazia; typo `Jumlp-All` no pack do herói (mantido).
6. Efeitos em tiras (`Character effects *`, `01..35`) sem grade verificada.
7. Sem sprites de mascote (lacuna §14 do master-prompt).

## 6. Riscos técnicos

- 1,2 GB de assets no repo → build de release precisa de curadoria (ADR-0004).
- Frames grandes de boss (840x720) em mobile → escala + atlas na Fase 10.
- Modo local no navegador expõe regras (aceito e documentado, ADR-0002).

## 7. Documentos existentes antes desta entrega

`docs/master-prompt.md` (único).

## 8. Próximas etapas recomendadas (executadas nesta entrega)

Fase 0 docs → Fase 1 fundação → Fase 2 protótipo visual → Fase 3 loop
principal, com testes; detalhe em `docs/ROADMAP.md` e `AI_STATE.md`.
