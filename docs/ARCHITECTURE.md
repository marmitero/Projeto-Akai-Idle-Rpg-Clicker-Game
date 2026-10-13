# ARCHITECTURE — Projeto Akai

Decisões registradas como ADRs em `docs/ADR/`. Este documento descreve o que
**existe hoje** e o que está planejado por fase; nada aqui é aspiracional sem
marcação.

## 1. Monorepo

```
apps/
  client/     # Phaser 3 + Vite + TypeScript estrito (jogo e UI)
  server/     # Fastify + @fastify/websocket + TypeScript estrito (autoridade)
packages/
  shared/     # tipos puros, contratos zod, configs de balanceamento,
              # simulador determinístico de combate/minas (usado pelos dois lados)
tools/        # scripts de auditoria de assets (Python stdlib) e geradores
docs/         # documentação oficial (este conjunto)
sprites/      # assets originais, SOMENTE LEITURA
```

Workspaces npm (`package.json` raiz). Build: `tsc -b` para shared/server e
`vite build` para o client. Testes: Vitest (unit + integração de servidor).

## 2. Fronteira de confiança

```
        NAVEGADOR / ANDROID (Capacitor futuramente)
        ┌────────────────────────────────────────────┐
        │ apps/client                                │
        │  UI HTML (HUD, automações)                 │
        │  Phaser: BootScene → MainScene             │
        │    CombatView / MiningView                 │
        │  Drivers:                                  │
        │    LocalDriver  → usa packages/shared      │
        │    OnlineDriver → WebSocket/HTTP p/ server  │
        └───────────────▲────────────────────────────┘
                        │ contratos zod (packages/shared/contracts)
        ┌───────────────┴────────────────────────────┐
        │ apps/server (Fastify)                      │
        │  api/ (rotas REST)  ws/ (gateway WS)       │
        │  domain/ (shared)  sessions/  persistence/ │
        │  security/ (rate limit, idempotência)      │
        └───────────────▲────────────────────────────┘
                        │ PersistenceStore (interface)
                 FileStore (dev/MVP) → PostgresStore (Fase 5)
```

- **Modo local** (§27.1 master-prompt): `LocalDriver` executa o mesmo domínio
  do `packages/shared` no navegador, persistindo em `localStorage`. Identificado
  na UI como "modo local (dados de teste)". Não é prova de segurança.
- **Modo online**: `OnlineDriver` envia **intenções** (`click`, `buy`,
  `unlockMine`, `bossRetry`, `setAuto`); o servidor valida, executa o domínio e
  responde com snapshot de estado + eventos. Cliente nunca envia resultado.

## 3. Domínio compartilhado (`packages/shared/src/domain`)

- `rng.ts`: mulberry32 semeado — determinismo testável.
- `combat.ts`: `createBattle`, `tickBattle(state, dtMs, rng)` → eventos
  (`attack`, `damage`, `death`, `wave_clear`, `floor_clear`, `boss_timeout`,
  `hero_down`). Puro e sem I/O.
- `mining.ts`: `applyClick`, regras de ganho e limites.
- `mines.ts`: produção por segundo e offline (`elapsed` limitado).
- `upgrades.ts`: custos/efeitos de melhorias e guerreiro.
- `progression.ts`: andares, ondas 3x3, bosses de dezena, pausa de
  auto-progressão e retomada manual.
- `state.ts`: `PlayerState` serializável (recursos, níveis, minas, batalha,
  flags, timestamps).

O servidor mantém um loop de tick por sessão (250 ms) e difunde snapshots;
o client reproduz visualmente os eventos e usa o snapshot como verdade.

## 4. Persistência

- Interface `PersistenceStore` (`load(sessionId)`, `save(sessionId, state)`,
  `list()`), escrita atômica (tmp + rename).
- MVP/dev: `FileStore` em `apps/server/data/` (ignorado pelo git).
- Fase 5: `PostgresStore` com migrações versionadas (ver `docs/DATA_MODEL.md`).
- Client local: `localStorage` com versão de schema e migração defensiva.

## 5. Assets em runtime

- Dev: middleware Vite `serveSprites` serve `sprites/` do repositório em
  `/sprites/*` (somente leitura, sem cópia). ADR-0004.
- Build de produção: script `tools/copy_curated_assets.ts` copia **apenas** os
  assets listados em `docs/art/assets.json` com `intendedUse` (curadoria MVP),
  preservando caminhos relativos. Pendente de implementação (Fase 3.5).
- BootScene carrega a lista curada (`apps/client/src/assets/manifest.ts`,
  gerada a partir do manifesto) com fallback e log de falha por asset.
- Nenhum asset é reexportado/recortado destrutivamente; grades são lidas do
  manifesto em runtime (`frameWidth/frameHeight/anims`).

## 6. Observabilidade e erros

- Server: logs estruturados JSON (pino, nativo do Fastify) com `sessionId`,
  `route`, `errorCode`; sem segredos; sem valores de saldo em log de produção
  (apenas deltas agregados em auditoria).
- Client: banner de conexão (online/offline/reconectando) e tela de erro de
  asset com caminho do arquivo.

## 7. Segurança resumida (detalhe em SECURITY.md)

- Rate limit de clique por sessão (10/s sustentados, rajada 12).
- Idempotência por `actionId` para compras e desbloqueios.
- Snapshot de estado com `rev` monotônico; ações contra `rev` antigo são
  revalidadas (não falham cegamente).
- Debug/admin: rotas `/api/debug/*` somente com `AKAI_DEBUG=true` **e** header
  de admin; nunca expostas em build pública.

## 8. Publicação Android (Fase 9)

Camada `platform/` no client abstrai auth, compras, anúncios, ciclo de vida.
Capacitor avaliado após métricas de canvas/áudio/offline. Nada de API Android
no core do jogo.
