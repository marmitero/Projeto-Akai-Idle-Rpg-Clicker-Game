# UI_UX — interface vertical mobile-first

## 1. Composição da tela (regra da Constituição §4.2)

```
┌─────────────────────────────┐
│ HUD de recursos (HTML)      │  ~48 dp: ícones reais 32x32 + números
├─────────────────────────────┤
│ ÁREA 1 — COMBATE (Phaser)   │  ~46% da altura: cenário lateral, herói vs
│  fundo em camadas + chão    │  inimigos, HP bars, andar/onda, timer de boss
├─────────────────────────────┤
│ ÁREA 2 — MINERAÇÃO (Phaser) │  ~26%: piso de tileset, nó de ferro clicável,
│  ganho/clique + partículas  │  contador local, feedback imediato
├─────────────────────────────┤
│ ÁREA 3 — AUTOMAÇÕES (HTML)  │  ~28%: abas Minas | Melhorias; listas com
│  produção/s, custos, botões │  ícone do recurso, estados de compra
└─────────────────────────────┘
```

- Um único canvas Phaser cobre as áreas 1 e 2 (desempenho e coerência visual);
  HUD e área 3 são HTML/CSS para acessibilidade e toque confiável.
- Desktop: coluna central com proporção 9:16 limitada pela altura; laterais
  com fundo escuro discreto, nunca dashboard.

## 2. Regras de interação

- Toque no nó: feedback visual em <100 ms mesmo antes da confirmação online.
- Botões de compra: estado visual `comprável / insuficiente / bloqueado` com
  motivo (requisito) visível; ícone do recurso no custo.
- Progressão: botão de pausa/retomada sempre visível na área 1; após derrota de
  boss, banner "Tentar novamente" (ação explícita, master-prompt §9.3).
- Velocidade: botão `1x/2x` na área 1 alterna `setSpeed` (somente batalha).
- Reconexão com produção offline: banner de resumo (tempo fora + ganhos),
  confirmado uma única vez por relatório (`ackOffline`).
- Safe areas: `env(safe-area-inset-*)` no shell HTML; canvas respeita o container.
- Sem menus cobrindo controles; abas da área 3 com altura mínima de toque 44 dp.

## 3. Legibilidade

- Números com sombra/outline para contraste sobre pixel art.
- Ícones de recurso nunca abaixo de 20 dp exibidos; sprites de combate nunca
  abaixo de 48 px de altura em tela.
- Pixel art com `image-rendering: pixelated` e scale inteiro quando possível.

## 4. Estados de sistema

- Carregando assets: tela com progresso e lista de falhas se houver.
- Offline/reconectando: banner no topo; modo local identificado por selo
  "LOCAL (dados de teste)".
- Erro de asset: cartão com caminho do arquivo e instrução (não silencioso).

## 5. Acessibilidade

- HTML semântico na área 3 e HUD (`<button>`, `aria-live` para totais).
- Contraste mínimo WCAG AA nos textos de UI.
- Alternativa: redução de partículas via setting (Fase 3.5).
