# Tile Editor de Cenário (`#/editor`)

Ferramenta de arte/dev entregue em 2026-10-13 para editar **manualmente** o
cenário da **arena (combate)** e da **mina (clique)** usando somente os
sprites reais curados em `docs/art/assets.json` (manifesto
`apps/client/src/assets/manifest.ts`). Não há placeholders: tiles do tileset
96×96, camadas de fundo do pack GandalfHardcore e sprites de mina/materiais.

## Como abrir

- No jogo: botão **"Cenário"** (canto inferior direito da área de jogo), ou
- Direto: `…/index.html#/editor` (ex.: preview
  `https://5173-<sandbox>.e2b.app/#/editor`).

O editor abre por cima do jogo (`#app` é ocultado). "Voltar ao jogo" /
"Testar no jogo" recarregam o jogo com o layout salvo.

## O que é editável

| Área | Controles |
|---|---|
| Zona | abas Arena / Mina (canvas 420×260 e 420×150, zoom 2× pixelado) |
| Chão | ferramenta "Pintar chão" com qualquer um dos 18 frames do `Floor Tiles1` (grade real 3×6 de 96×96); "Buraco no chão" abre vãos por coluna; altura do topo (`cropH`) e cor de preenchimento |
| Teto (mina) | pintar/apagar por coluna + altura do crop |
| Assets | "Colocar asset": nós de ferro/carvão/ouro/jade, ícones de materiais ou o tile atual como peça solta; arrastar com "Selecionar/mover"; escala, espelhos X/Y, profundidade, opacidade, posição fina e remoção no painel |
| Fundo (arena) | cor do céu; por camada (céu, castelo, floresta, colinas, matagal): visibilidade, fator de parallax (0–1), ancoragem (`céu` = canvas inteiro ao chão, `vegetação` = linha y≈175 ao chão) e `dy` |
| Caverna (mina) | dois tons de fundo, escoras de madeira on/off |
| Geral | grade de 96 px on/off, Salvar, Exportar JSON, Importar JSON, Reset |

## Modelo de dados (`apps/client/src/game/sceneLayout.ts`)

```ts
SceneLayout { version: 1, arena: ZoneLayout, mine: ZoneLayout }
ZoneLayout {
  sky, sky2,                      // cores hex
  bg: [{ key, visible, factor, anchor: 'full'|'veg', dy }],
  ground: { cells: (frame|null)[], cropH, fill },   // null = buraco; coluna ausente = frame padrão (arena 0, mina 6)
  ceiling: { cells, cropH } | null,
  posts: boolean,
  props: [{ id, src: {kind:'image',key}|{kind:'frame',frame}, fx (0..1), dy (px vs chão), scale, flipX, flipY, depth, alpha }]
}
```

- Persistência: `localStorage["akai.scene-layout.v1"]` (salvo a cada
  alteração) + export/import de `akai-scene-layout.json`.
- Validação estrita na importação (`parseLayout`): payload inválido é
  recusado com aviso; sem layout salvo o jogo usa `defaultLayout()`, que
  reproduz exatamente o cenário procedural anterior.
- Coordenadas resilientes a resize: `fx` é fração da largura da zona e `dy`
  é relativo ao topo do chão; colunas de tile contam da esquerda (colunas
  além do layout usam o frame padrão).

## Integração com o jogo

- `CombatView` e `MiningView` leem `loadLayout()` no construtor e aplicam
  cores, camadas/parallax/ancoragem, células de chão/teto e props
  (`renderProps` em `game/props.ts`). O nó de ferro clicável e os
  combatentes continuam 100% gameplay — props de editor nunca recebem input.
- A `EditorScene` renderiza com as **mesmas receitas** (`game/ground.ts`,
  `game/props.ts`, ancoragem de fundo validada por mockup), então o que se
  vê no editor é o que o jogo mostra.
- Boot: `main.ts` roteia `#/editor` para `editor/main.ts` (import dinâmico);
  o jogo nem inicializa nesse modo. Assets carregados pelo mesmo
  `preloadAssets()` das cenas de jogo.

## Testes

`tests/client/scene-layout.spec.ts`: defaults idênticos ao cenário
procedural, round-trip JSON, recusa de payloads inválidos, tolerância a
campos extras, save/load/clear com storage stub, isolamento de `cloneLayout`
e conversão de cores. Suite completa: `npx vitest run` (57 testes).

## Limitações conhecidas

- O layout é por navegador (localStorage); para compartilhar, exporte o JSON
  e importe no outro dispositivo (ou versione-o fora do repo).
- Reordenar/remover camadas de fundo além de ligar/desligar não é suportado
  (conjunto fixo do pack); novos assets entram pela curadoria do manifesto.
- Editar com o jogo aberto em outra aba não atualiza a aba aberta (recarregue).
