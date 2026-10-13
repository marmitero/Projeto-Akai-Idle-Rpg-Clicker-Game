# ADR-0001 — Monorepo npm workspaces com Phaser 3 + Fastify + TypeScript estrito

**Status: aceito (2026-10-13)**

## Contexto
O repositório chegou sem código (apenas `docs/master-prompt.md` e `sprites/`).
O master-prompt §5 define stack padrão: TS estrito, Phaser 3 + Vite no cliente,
Fastify + WebSocket no servidor, contratos compartilhados, Vitest.

## Decisão
Monorepo com workspaces npm: `apps/client`, `apps/server`, `packages/shared`.
Sem Lerna/Nx/Turborepo no MVP (superfície menor; scripts npm bastam).
Vitest como runner único; `tsc -b` com project references para build.

## Alternativas consideradas
- **Capacitor já no início**: rejeitado; master-prompt §24 exige validar
  desempenho do canvas antes.
- **PixiJS em vez de Phaser**: rejeitado; Phaser traz cenas/input/camera e
  sheets com menos código próprio; risco de bundle maior aceito e mensurável.
- **Repo separado p/ server**: rejeitado; contratos compartilhados exigem
  versão única e CI única no MVP.

## Consequências
- Install único; CI simples (`npm test`, `npm run build`).
- Shared não pode importar nada de client/server (regra de lint manual +
  teste de contrato de imports pendente).
- Node LTS 22 no ambiente verificado; engines declarados.
