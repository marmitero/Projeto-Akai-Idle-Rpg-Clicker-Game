# API — contratos cliente/servidor (v1)

Versionamento: campo `v: 1` em todas as mensagens. Incompatibilidade gera erro
`CONTRACT_VERSION` e o client cai para modo local com aviso.

## 1. HTTP (Fastify)

| método | rota | auth | descrição |
|---|---|---|---|
| POST | `/api/session` | - | cria sessão local-dev; retorna `{sessionId, state}` |
| GET | `/api/state` | Bearer sessionId | snapshot completo (`StateSnapshot`) |
| POST | `/api/debug/grant` | debug+admin | concede recursos de teste (só `AKAI_DEBUG=true`) |
| POST | `/api/debug/floor` | debug+admin | define andar de teste |
| GET | `/healthz` | - | liveness |

Erros HTTP: `400 VALIDATION`, `401 UNAUTHENTICATED`, `403 FORBIDDEN`,
`409 CONFLICT` (rev/estado), `429 RATE_LIMITED` com `retryAfterMs`,
`423 LOCKED` (ação idempotente em andamento). Corpo: `{error:{code,message,details?}}`.

## 2. WebSocket `/ws` (gateway de jogo)

Mensagens client→server (intenções; schemas zod em
`packages/shared/src/contracts/messages.ts`):

```
{v:1, t:"hello",   sessionId}
{v:1, t:"click",   actionId, clientTs}
{v:1, t:"buy",     actionId, upgradeId}
{v:1, t:"unlockMine",  actionId, mineId}
{v:1, t:"upgradeMine", actionId, mineId}
{v:1, t:"bossRetry",   actionId}
{v:1, t:"setAuto", on:boolean}
{v:1, t:"setSpeed", mult:1|2}
{v:1, t:"ackOffline"}
```

Server→client:

```
{v:1, t:"state", rev, state, events:[BattleEvent|EconomyEvent]}
{v:1, t:"error", code, message, actionId?}
{v:1, t:"pong", serverTs}
```

Regras:
- Snapshot difuso a cada tick de 250 ms **somente se houver mudança** (evita
  tráfego por frame).
- Eventos de batalha carregam apenas identificadores e valores calculados no
  servidor; o client os usa para animar, nunca para decidir.
- `setSpeed` escala somente o tick de batalha (minas permanecem em tempo real).
- `ackOffline` confirma o resumo de produção offline exibido ao reconectar.
- Reconexão: `hello` reaplica estado completo; nenhuma ação é reprocessada
  (idempotência por `actionId`).

## 3. Idempotência

`actionId` = UUIDv4 por intenção; janela de 10 min por sessão; resposta de
replay é o resultado original (não re-executa).

## 4. Rate limits

- `click`: 10/s sustentados, rajada 12 (token bucket por sessão).
- demais intenções: 20/s por sessão.
- HTTP público: 60 req/min por IP no dev.

## 5. O que NÃO existe (evitar invenção)

Não há endpoint de "resultado de batalha", "adicionar recurso" público,
"iniciar boss global" público, nem compra premium no MVP. Mercado, PvP,
guildas e rankings terão contratos próprios nas Fases 6-7, versionados como v2.
