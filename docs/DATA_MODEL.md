# DATA_MODEL — entidades, persistência e migrações

## 1. Estratégia em duas etapas

- **MVP/dev (IMPLEMENTADO)**: `PlayerState` serializado como JSON por sessão.
  Server: `FileStore` (arquivo por sessão, escrita atômica). Client local:
  `localStorage` com `schemaVersion`.
- **Fase 5**: PostgreSQL com migrações versionadas (`apps/server/migrations/`),
  mantendo os mesmos nomes de entidade abaixo. RLS como camada extra, nunca
  como motor de regras.

## 2. Entidades do estado atual (JSON, versionado)

```
PlayerState {
  schemaVersion: number
  rev: number                      // monotônico, detecta estado antigo
  resources: { coins, iron, coal, gold, jade, ruby }
  clicker: { level }
  warrior: { level, critLevel }
  mines: { [mineId]: { unlocked, level } }
  progression: { floor, autoProgress, bossRetryAvailable }
  battle: BattleState | null       // floor, wave, enemies[], heroHp, phase, timers
  timestamps: { createdAt, lastSeen, offlineComputedUntil }
  ledger?: EconomyEntry[]          // dev: últimos 200 movimentos p/ auditoria
}
```

`BattleState` inclui `rngSeed`, `battleRev` e `rewardedEnemyIds` para impedir
crédito duplicado.

## 3. Tabelas alvo (Fase 5) — resumo

| tabela | chave | notas |
|---|---|---|
| account | id uuid | auth Google/convidado |
| player_profile | account_id | apelido único normalizado, retrato |
| player_progress | account_id | floor, autoProgress |
| resource_balance | account_id, resource | saldo atual + `updated_rev` |
| resource_ledger | id bigint | imutável: delta, origem, motivo, action_id único |
| hero / upgrade_state | account_id | níveis |
| mine_state | account_id, mine_id | unlocked, level |
| battle_session | id | seed, floor, phase, started_at |
| battle_event | id | append-only p/ auditoria de recompensas |
| equipment_definition | code | imutável, versionada por dataset |
| equipment_instance | id uuid | owner, rarity, attrs, `locked_by_listing` |
| market_listing / market_offer / market_transaction | id | estados explícitos |
| global_boss_event / contribution | edition_date | último golpe único (unique) |
| purchase / premium_currency_ledger | id | recibo único, idempotente |
| guild / guild_member / guild_emblem / guild_war | id | capacidades configuráveis |
| pvp_match / pvp_rating / trophy_ledger | id | resultado server-side |
| ranking_snapshot | season, kind | permanentes vs semanais |
| audit_log | id | ações admin com autor/motivo |

Constraints obrigatórias: saldos `>= 0`; `action_id` UNIQUE em ledger;
`last_hit_account_id` UNIQUE por edição de boss global; listing com
`item_id` UNIQUE enquanto ativo.

## 4. Retenção

- Ledger econômico: permanente (auditoria).
- Eventos de batalha: 90 dias online, agregados depois.
- Logs de aplicação: 30 dias.

## 5. Migrações

Ferramenta escolhida na Fase 5 (node-pg-migrate ou equivalente mantido).
Regra: toda mudança de schema é migração versionada; nunca editar migração
publicada; rollback testado em staging.
