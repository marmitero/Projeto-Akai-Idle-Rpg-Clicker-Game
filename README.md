# Projeto Akai — Idle RPG Clicker Game

Jogo 2D mobile-first (vertical) de fantasia medieval: combate RPG automático
em torre de 1.000 andares, mineração de ferro por clique e automação
progressiva de recursos. Especificação oficial: `docs/master-prompt.md`.

## Executar

```bash
npm install
npm run dev        # server Fastify :8787 + client Vite :5173 (proxy /api e /ws)
npm test           # Vitest (shared, server, integridade de assets)
npm run build      # tsc -b (shared/server) + vite build (client)
```

Abra `http://localhost:5173` (mobile-first; no desktop, coluna central 9:16).
O client tenta o modo **online** (servidor autoritativo) e cai para
**local** (dados de teste no navegador) se o servidor não responder; o selo no
HUD indica o modo e clique nele alterna.

## Estrutura

- `apps/client` — Phaser 3 + Vite (combate, mineração, UI HTML de automações)
- `apps/server` — Fastify + WebSocket (autoridade de estado, rate limit, idempotência)
- `packages/shared` — domínio determinístico, contratos zod, balanceamento
- `docs/` — documentação oficial (Constituição, GDD, ARCHITECTURE, ROADMAP, …)
- `docs/art/` — manifesto de assets, licenças e bíblia artística
- `tools/` — auditoria de assets (`scan_sprites.py`, `build_manifest.py`)
- `sprites/` — assets originais, somente leitura (1,2 GB; ver manifesto)
- `AI_STATE.md` — estado real do desenvolvimento para continuidade entre sessões

## Avisos

- Nenhum asset tem licença confirmada: uso comercial bloqueado até a
  verificação descrita em `docs/art/ASSET_LICENSES.md`.
- Modo local NÃO é ambiente seguro: regras rodam no navegador por design
  (ADR-0002); a autoridade real é o servidor no modo online.
