# ART_BIBLE — direção e regras visuais

Base factual: `docs/art/ASSET_MANIFEST.md` (dims, grades, alfa verificados).

## 1. Direção de arte

Fantasia medieval em pixel art de alta densidade (personagens 32-128 px de
altura, ícones 32x32). O conjunto dominante (bases LPC-like 80x64, inimigos
Ansimuz-like, ícones Icon31) compartilha paleta saturada e contorno escuro —
essa é a **família núcleo** do MVP. Packs vetoriais renderizados (Robot, Troll)
ficam fora do núcleo até decisão registrada.

## 2. Paleta principal

- Céu/fundo: gradientes frios das camadas GandalfHardcore (azul-esverdeado).
- Chão/rocha: marrons escuros do tileset `Floor Tiles1` com topo verde.
- UI: painéis escuros `#141420`→`#1d1d2e`, bordas `#3a3a55`, texto `#e8e6da`.
- Acentos de raridade: comum `#cfd2d6`, incomum `#7fd47f`, raro `#5aa7f0`,
  épico `#b06df0`, lendário `#f0b429`.

## 3. Escalas

| elemento | altura em jogo | nota |
|---|---|---|
| herói (Character) | 64-80 px nativo, scale 1.5 | pixel-perfect quando inteiro |
| inimigos pequenos (32x32) | scale 2 | Dude/Mushroom/Slime/Bat |
| esqueletos (128x96) | scale 0.9 | altura visual compatível com herói |
| bases compostas (80x64) | scale 1.5 | inimigos humanoides variados |
| bosses (480/840) | scale 0.35-0.5 | destaque sem cobrir a tela |
| ícones | 32 nativo, 20-28 dp em UI | nunca stretch não inteiro |

## 4. Fundos

- Sempre em camadas 1→4 + castelo, com parallax 0.1/0.2/0.35/0.5/0.15.
- Bioma por faixa de andares: Normal 1-33, Autumn 34-66, Winter 67-99
  (configurável); boss mantém o bioma da faixa.
- Fundo nunca recebe efeito de brilho/pulsar; quem pulsa é o combatente/efeito.

## 5. Contraste e legibilidade

- Combatentes sempre sobre faixa de chão escura; HP bar com outline preto.
- Dano flutuante: branco (normal), amarelo (crítico), vermelho (recebido).
- Nenhum texto sobre área de partículas sem outline.

## 6. Política de filtros

- Proibido: recoloração automática em massa, blur, contornos gerados.
- Permitido: flip horizontal para direção (padrão do combate lateral),
  scale inteiro, tint discreto de elite (≤20% de saturação) combinado com
  modificador mecânico — nunca como única diferença (master-prompt §9.4).
- Suavização: `pixelated` em pixel art; sprites vetoriais renderizados podem
  usar smoothing (bosses), documentado por família.

## 7. Efeitos e partículas

- Orçamento: ≤40 partículas vivas por cena em mobile.
- Impacto: células 32x32 da biblioteca verificada (`* Bullet Impact Explosion`),
  1 célula por golpe, vida ≤300 ms.
- Buffs/debuffs: tiras `Character effects *` quando a grade for verificada
  (pendente); até lá, indicadores numéricos/ícones.

## 8. Composição de personagens (bases)

- Empilhamento na mesma origem (0,0) da grade 80x64: Skin → Clothing →
  Arm Layers → Hair → Hat → Mask → Ears → Hand.
- Famílias visuais por faixa de andares definidas em
  `packages/shared/src/config/enemySets.ts` (MVP: 3 conjuntos com skin+roupa+
  cabelo+arma distintos, não apenas cor).
- Prévia de combinações gerada por `tools/` antes de uso em escala
  (criterio §3.4); composições aprovadas ficam versionadas em config.

## 9. Nomenclatura e versionamento

- IDs de asset = slug do caminho (ver `assets.json`).
- Derivados (se necessários) vão para `apps/client/public/derived/` com
  entrada no manifesto marcando transformação; originais intocados.
