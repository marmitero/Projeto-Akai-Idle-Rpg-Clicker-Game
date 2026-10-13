# AI_STATE — Projeto Akai

> Documento factual de continuidade. Atualizado em **2026-10-13** ao fim da
> segunda execução (Fases 0-3 + 3.5). Nada aqui é marcado como concluído sem
> evidência (teste/build/execução) registrada nesta entrega.

## 1. Objetivo atual

Entregar o MVP jogável do loop principal (Fase 3 do ROADMAP) com cliente e
servidor separados, assets reais auditados e testes dos fluxos críticos —
e então iniciar a Fase 3.5/4 (qualidade de vida + equipamentos).

## 2. Fase atual

**Fase 3.5 concluída** (loop principal + velocidade de combate + resumo
offline). Fase 4 não iniciada. Fases 0-3 concluídas na primeira execução.

## 3. Estado real do repositório

- Branch: `arena/b129a2d4-projeto-akai-idle-rpg-clicker` (base `23f39ca`).
- Antes: apenas `docs/master-prompt.md` + `sprites/` (1,2 GB, 7.493 arquivos).
- Agora: monorepo `apps/client`, `apps/server`, `packages/shared`, `tests/`,
  `tools/`, `docs/` completo, `AI_STATE.md`, `README.md`, `.gitignore`.
- `npm install` ok (Node 22). `npm test` = **43/43 testes passando**.
  `tsc -b` (shared/server/client) sem erros. `vite build` ok.
- Dev server verificado via HTTP: `/healthz`, `POST /api/session`,
  `POST /api/intent` (click → iron=1), `GET /api/state`, `/sprites/*` (200
  image/png) — tudo através do proxy do Vite em :5173.

## 4. Decisões aprovadas (ADRs)

1. ADR-0001 monorepo npm workspaces + Phaser 3 + Fastify + TS estrito + Vitest.
2. ADR-0002 domínio de gameplay em `packages/shared`; servidor autoritativo no
   modo online; modo local rotulado como não confiável.
3. ADR-0003 persistência em duas etapas (FileStore/localStorage agora,
   Postgres com migrações na Fase 5).
4. ADR-0004 assets servidos da raiz no dev; bundle curado na release.

## 5. Decisões pendentes

- Pack licenciado para ícone de **coins** (lacuna; HUD usa moeda CSS).
- Sprites de **mascotes** (lacuna do master-prompt §14).
- Confirmação de licenças de todos os packs (bloqueia release comercial).
- Escolha da ferramenta de migração Postgres (Fase 5).
- Curadoria de produção (`tools/copy_curated_assets.ts`) — Fase 3.5.

## 6. Funcionalidades concluídas (com evidência)

- Auditoria de assets: inventário 7.493 arquivos + SHA-1 + grades verificadas
  (`tools/out/sprite_inventory.json`, `docs/art/assets.json`, manifesto).
- Documentação oficial completa (Constituição, GDD, ARCHITECTURE, ROADMAP,
  BALANCE, ECONOMY, DROP_TABLES, SECURITY, API, DATA_MODEL, UI_UX, TEST_PLAN,
  RELEASE_CHECKLIST, OPERATIONS, ART_BIBLE, ASSET_LICENSES, 4 ADRs,
  AUDIT_REPORT).
- Domínio: combate determinístico (3 ondas × 3 inimigos; boss de dezena com
  timer 60 s; derrota → andar-1 + auto pausado + retomada manual), clicker,
  upgrades (click/warrior/crit), mina de carvão (desbloqueio/upgrade/produção),
  produção offline com cap 8 h e eficiência 60%.
- Server: sessões, tick 250 ms, rate limit 10/s (rajada 12), idempotência por
  actionId, rotas REST + gateway WS, debug protegido, FileStore atômico com
  quarentena de saves corrompidos.
- Client: layout vertical 3 áreas reais; cena de combate lateral com fundo em
  camadas + tileset + herói (sheets verificadas) + inimigos (sequências de
  esqueleto e composições das bases Male/Female) + boss (sheets Left 480x480);
  cena de mineração com `ironNode.png` 16x16 (scale 4) e ícone `Icon31_15`;
  HUD com ícones reais; painel HTML de minas/melhorias com custos e estados;
  drivers online (WS) e local (localStorage) com fallback automático.
- Testes: 49 passando (shared 36, server 9, assets 4) cobrindo a lista
  obrigatória aplicável ao MVP (TEST_PLAN §2).
- Fase 3.5: velocidade de combate 1x/2x (intent `setSpeed`, botão na área de
  combate, escala só o tick de batalha — minas em tempo real, testado) e
  resumo de produção offline em banner com `ackOffline` idempotente por
  relatório; migração defensiva de saves locais anteriores.
- **Tile Editor de cenário** (`#/editor`, botão "Cenário" no jogo;
  docs/tools/scene-editor.md): edição manual de tiles por coluna (chão/teto,
  18 frames reais do tileset 96x96), assets colocáveis (nós de minério,
  ícones, tiles soltos) com arraste/escala/espelho/profundidade/opacidade, e
  fundo da arena (cores, visibilidade/parallax/ancoragem das 5 camadas) e da
  caverna (tons, escoras, teto). Layout versionado em localStorage com
  export/import JSON validado; `CombatView`/`MiningView` consomem o mesmo
  layout (`game/sceneLayout.ts`), e a EditorScene renderiza com as mesmas
  receitas das views (o visto = o jogado). Sem layout salvo, o default
  reproduz exatamente o cenário procedural anterior.

## 7. Funcionalidades parciais / pendentes

- Curadoria de build de produção de assets (`tools/copy_curated_assets.ts`,
  ADR-0004) — necessária antes de qualquer release.
- Minas de ouro/jade: regras prontas no domínio/config, sem UI de teste
  dedicada além do painel (desbloqueio já funciona via painel).
- Efeitos `Character effects *` e sheets 640x512/864x672 pendentes de grade.
- Robot/Troll e `Warrior/GandalfHardcore Warrior.png` fora do pipeline.
- Validação visual em navegador real não foi possível neste ambiente (sem
  browser headless); módulos e transforms verificados via HTTP + typecheck.

## 8. Correções visuais de 2026-10-13 (reportadas pelo usuário, auditadas e resolvidas)

1. **"Inimigos batendo de costas"** → causa: bases Male/Female Base olham à
   direita no asset e eram usadas sem flip à direita da tela. Correção:
   `needsFlip()` no CombatView (flip X para composições); regra de orientação
   documentada em ART_BIBLE §7.1. Evidência: mockup `mock_combat3.png`.
2. **"Não se aproximam, batem de longe"** → causa: posições estáticas
   (herói 28%, inimigos 62%+). Correção: `CombatView.update(dt)` com formação
   de engajamento (inimigos caminham até `heroX + engage`, fila por slot,
   boss mais lento), animação walk durante aproximação e lunge no ataque.
3. **"Tiles desunidos com espaços"** → causa: tileset tratado como grade
   48x48 quando a grade real é **96x96 (3x6)**; o fatiamento errado produzia
   fatias com bordas transparentes. Correção: `game/ground.ts` com tiles
   inteiros + `setCrop` inteiro (topo 40 px) e pitch 96 alinhado; manifesto e
   ART_BIBLE corrigidos.
4. **"Background parcial e sem parallax"** → causa: camadas ancoradas cada uma
   pelo próprio rodapé (composição errada do pack) e nenhum deslocamento.
   Correção: composição com mesma origem/escala, ancoragem céu-canvas +
   linha de vegetação (mockup validado), parallax de câmera (sway + deriva de
   caminhada + offset por andar, fatores 0.1-0.72).
5. **"Meio mal interpretado (pedra solta em tile bugado)"** → causa: MiningView
   era faixa única com nó solto. Correção: cena-própria "Caminho da Mina":
   caverna em dois tons, teto de tileset espelhado, escoras de madeira, trilha
   com variante laranja do tileset, nó de ferro semi-enterrado clicável e
   veios decorativos reais de carvão/ouro/jade (mockup `mock_mine.png`).

## 9. Problemas conhecidos

- Bundle do client 1,57 MB (Phaser) — otimização na Fase 10.
- FileStore não protege concorrência entre processos (server dev é
  single-process; documentado em SECURITY §4).
- 24 arquivos `.DS_Store` em `sprites/` (não removidos para preservar o repo).
- Camada 5 dos fundos vazia; typo `Jumlp-All` no pack do herói (mantidos).

## 10. Últimos testes

`npx vitest run` → 10 arquivos, 57 testes, 0 falhas (2026-10-13 16:42; +8 do
contrato de layout do Tile Editor).
`tsc -b packages/shared apps/server apps/client` → 0 erros.
`vite build` → ok. Smoke HTTP ponta a ponta → ok (sessão/clique/state/sprites).

## 11. Próxima tarefa concreta

**Fase 4.1 — equipamentos com raridade e drop de boss**: definições
configuráveis em `packages/shared/src/config/equipment.ts` (categorias reais
dos ícones de `sprites/Equipments/`), geração SOMENTE no domínio autoritativo,
roll de raridade por boss conforme DROP_TABLES §2, instâncias em
`PlayerState.inventory`, UI de inventário/equipar na aba de melhorias, e testes
estatísticos (100k rolls semeados, ±2 p.p.) + teste de não-duplicação de drop.
Dependências: nenhuma bloqueante. Critério de aceite: drop de boss gera item
persistido, equipável, com atributos aplicados ao combate.

## 12. Arquivos relevantes

- Domínio: `packages/shared/src/domain/*`, `config/balance.ts`, `config/enemySets.ts`
- Contratos: `packages/shared/src/contracts/*`
- Server: `apps/server/src/{app,sessions,index}.ts`, `persistence/FileStore.ts`
- Client: `apps/client/src/{main.ts,ui/shell.ts,game/*,net/*,assets/manifest.ts}`
- Tile Editor: `apps/client/src/editor/{main,panel,EditorScene,palette}.ts`,
  `apps/client/src/game/{sceneLayout,props}.ts`, `docs/tools/scene-editor.md`
- Testes: `tests/shared/*`, `tests/server/*`, `tests/assets/*`, `tests/client/*`
- Auditoria: `tools/scan_sprites.py`, `tools/build_manifest.py`, `tools/out/*`

## 13. Alterações recentes (esta execução)

Primeira execução: criação de toda a base de código, docs e testes das seções
3 e 6 (commit `14343d2`). Segunda execução: Fase 3.5 (setSpeed/ackOffline, botões de UI, migração de
saves). Terceira execução: correções visuais 1-5 da seção 8 (orientações,
aproximação, tiles 96x96, fundo+parallax, cena da mina), novas views
game/ground.ts e game/zones.ts, mockups de validação em tools/out/previews/.
Quarta execução: Tile Editor de cenário (Fase 3.6 do ROADMAP): rota `#/editor`
com cena Phaser própria + painel DOM, contrato de layout persistido
(game/sceneLayout.ts), props decorativos (game/props.ts), ground.ts com
células por coluna (buracos inclusos), CombatView/MiningView consumindo o
layout, 8 testes novos e docs/tools/scene-editor.md. Nenhum arquivo
pré-existente foi removido, renomeado ou sobrescrito (`docs/master-prompt.md`
e `sprites/` intactos).

## 14. Bloqueios

- Licenças de assets para qualquer publicação comercial (RELEASE_CHECKLIST).
- Sem credenciais de Supabase/Google no ambiente → autenticação real e
  Postgres aguardam Fase 5 (integração preparada, não simulada).

## 15. Dívida técnica

- Atlas/otimização de texturas (Fase 10).
- Simulador de progressão (`tools/sim_progression.ts`) para validar BALANCE.
- Testes de concorrência de mercado (Fase 7) e de compra premium (Fase 8).
- CI contínua (GitHub Actions) não configurada neste ambiente.
