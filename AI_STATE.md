# AI_STATE — Projeto Akai

> Documento factual de continuidade. Atualizado em **2026-10-13** ao fim da
> primeira execução (Fases 0-3). Nada aqui é marcado como concluído sem
> evidência (teste/build/execução) registrada nesta entrega.

## 1. Objetivo atual

Entregar o MVP jogável do loop principal (Fase 3 do ROADMAP) com cliente e
servidor separados, assets reais auditados e testes dos fluxos críticos —
e então iniciar a Fase 3.5/4 (qualidade de vida + equipamentos).

## 2. Fase atual

**Fase 3 concluída** (loop principal jogável). Fase 4 não iniciada.
Fases 0, 1 e 2 concluídas na mesma execução.

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
- Testes: 43 passando (shared 32, server 7, assets 4) cobrindo a lista
  obrigatória aplicável ao MVP (TEST_PLAN §2).

## 7. Funcionalidades parciais / pendentes

- Velocidade de combate 1x/2x e resumo offline na UI (Fase 3.5).
- Curadoria de build de produção de assets (ADR-0004, Fase 3.5).
- Minas de ouro/jade: regras prontas no domínio/config, sem UI de teste
  dedicada além do painel (desbloqueio já funciona via painel).
- Efeitos `Character effects *` e sheets 640x512/864x672 pendentes de grade.
- Robot/Troll e `Warrior/GandalfHardcore Warrior.png` fora do pipeline.
- Validação visual em navegador real não foi possível neste ambiente (sem
  browser headless); módulos e transforms verificados via HTTP + typecheck.

## 8. Problemas conhecidos

- Bundle do client 1,57 MB (Phaser) — otimização na Fase 10.
- FileStore não protege concorrência entre processos (server dev é
  single-process; documentado em SECURITY §4).
- 24 arquivos `.DS_Store` em `sprites/` (não removidos para preservar o repo).
- Camada 5 dos fundos vazia; typo `Jumlp-All` no pack do herói (mantidos).

## 9. Últimos testes

`npx vitest run` → 8 arquivos, 43 testes, 0 falhas (2026-10-13 15:53).
`tsc -b packages/shared apps/server apps/client` → 0 erros.
`vite build` → ok. Smoke HTTP ponta a ponta → ok (sessão/clique/state/sprites).

## 10. Próxima tarefa concreta

**Fase 3.5-A**: implementar velocidade de combate 1x/2x (intent `setSpeed`,
multiplicador de dt no tick autoritativo, botão na UI) com testes; depois
**Fase 3.5-B**: painel de resumo de produção offline ao reconectar; depois
**Fase 4.1**: equipamentos com raridade e drop de boss (geração no domínio
autoritativo, ícones reais de `sprites/Equipments/`).

## 11. Arquivos relevantes

- Domínio: `packages/shared/src/domain/*`, `config/balance.ts`, `config/enemySets.ts`
- Contratos: `packages/shared/src/contracts/*`
- Server: `apps/server/src/{app,sessions,index}.ts`, `persistence/FileStore.ts`
- Client: `apps/client/src/{main.ts,ui/shell.ts,game/*,net/*,assets/manifest.ts}`
- Testes: `tests/shared/*`, `tests/server/*`, `tests/assets/*`
- Auditoria: `tools/scan_sprites.py`, `tools/build_manifest.py`, `tools/out/*`

## 12. Alterações recentes (esta execução)

Criação de toda a base de código, docs e testes listados nas seções 3 e 6;
nenhum arquivo pré-existente foi removido, renomeado ou sobrescrito
(`docs/master-prompt.md` e `sprites/` intactos).

## 13. Bloqueios

- Licenças de assets para qualquer publicação comercial (RELEASE_CHECKLIST).
- Sem credenciais de Supabase/Google no ambiente → autenticação real e
  Postgres aguardam Fase 5 (integração preparada, não simulada).

## 14. Dívida técnica

- Atlas/otimização de texturas (Fase 10).
- Simulador de progressão (`tools/sim_progression.ts`) para validar BALANCE.
- Testes de concorrência de mercado (Fase 7) e de compra premium (Fase 8).
- CI contínua (GitHub Actions) não configurada neste ambiente.
