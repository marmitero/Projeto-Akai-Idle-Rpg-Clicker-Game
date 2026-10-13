# SECURITY — fronteiras de confiança e proteções

## 1. Princípio

O cliente é um renderer de intenções. Todo valor econômico ou competitivo é
calculado onde há autoridade: `apps/server` no modo online; no modo local o
domínio roda no navegador e é **explicitamente rotulado como não confiável**.

## 2. O que o cliente nunca envia como verdade

Dano, vida restante, coins ganhos, resultado de batalha, chance/raridade de
drop, saldos, posição de ranking, resultado de PvP, recompensa de anúncio,
resultado de compra, duração de bônus (master-prompt §6.1).

Contratos de intenção aceitos hoje (zod, `packages/shared/contracts`):
`click{clientTs,actionId}`, `buy{upgradeId,actionId}`, `unlockMine{mineId,
actionId}`, `upgradeMine{mineId,actionId}`, `bossRetry{actionId}`,
`setAuto{on}`. Nenhum carrega valor de recurso.

## 3. Proteções implementadas (server dev / modo online MVP)

| ameaça | proteção | evidência |
|---|---|---|
| autoclicker | rate limit 10/s sustentados, rajada 12; excedente rejeitado com erro previsível `CLICK_RATE_LIMITED` | `tests/server/session.spec.ts` |
| replay de ação | `actionId` idempotente por sessão (janela 10 min) | idem |
| compra sem saldo | débito valida saldo no domínio; saldo nunca negativo | `tests/shared/upgrades.spec.ts` |
| recompensa dupla | crédito por `enemyId`/`waveIdx`/`floor` ligado a `battleRev` | `tests/shared/combat.spec.ts` |
| boss infinito após derrota | flag `autoProgress=false` + retomada só por `bossRetry` | `tests/shared/progression.spec.ts` |
| produção offline infinita | cap 8 h + eficiência 60% por timestamps server-side | `tests/shared/mines.spec.ts` |
| estado forjado | snapshot com `rev` monotônico; ações aplicadas sobre estado server-side | contrato `StateSnapshot` |
| debug em produção | `/api/debug/*` exige `AKAI_DEBUG=true` + header admin | `tests/server/debug.spec.ts` |

## 4. Pendências conhecidas (registradas, não ocultadas)

- Autenticação real (Google/convidado) — Fase 5; hoje há apenas perfil local
  de desenvolvimento com `sessionId` aleatório server-side.
- Postgres com transações/constraints — Fase 5; FileStore não protege contra
  concorrência entre processos (documentado; server dev é single-process).
- WAF/DDoS, rotação de chaves, TLS terminação — OPERATIONS.md (Fase 5+).
- Validação de recibos de compra e S2S de anúncios — Fase 8.

## 5. Auditoria

- Ledger de ruby e de ações administrativas com autor/data/motivo/valores.
- Logs estruturados sem segredos; erros de validação agregados por código.

## 6. Concorrência (Fase 5/7)

Mercado e saldos usarão transações SQL com `SELECT ... FOR UPDATE`, constraints
de não-negatividade e chave de idempotência por operação; testes de duas
compras simultâneas do mesmo item são critério de aceite da Fase 7.
