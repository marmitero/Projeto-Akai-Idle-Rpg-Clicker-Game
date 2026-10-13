# OPERATIONS — execução, observabilidade e recuperação

## 1. Execução hoje (dev/MVP)

```bash
npm install
npm run dev            # sobe server (Fastify :8787) + client (Vite :5173)
npm test               # vitest workspace
npm run build          # tsc -b + vite build
```

- Server dev persiste em `apps/server/data/` (fora do git).
- Client local persiste em `localStorage` (chave versionada `akai.save.v1`).
- Assets servidos em `/sprites/*` pelo middleware do Vite a partir da raiz do
  repositório (ADR-0004). Em produção: bundle curado (Fase 3.5).

## 2. Variáveis de ambiente (sem segredos no repo)

| var | uso | padrão dev |
|---|---|---|
| `PORT` | HTTP/WS do server | 8787 |
| `AKAI_DEBUG` | habilita `/api/debug/*` | `true` apenas em dev |
| `AKAI_ADMIN_KEY` | header admin p/ debug | ausente |
| `AKAI_DATA_DIR` | diretório do FileStore | `apps/server/data` |
| `DATABASE_URL` | Fase 5 | ausente |

## 3. Observabilidade

- Logs JSON (pino): `reqId`, `sessionId`, `route`, `errorCode`, duração.
- Métricas mínimas (Fase 5): sessões ativas, ticks/s, ações rejeitadas por
  código, emissão de coins/h, latência WS.
- Health: `/healthz`; readiness considera FileStore acessível.

## 4. Jobs agendados (Fase 5+)

- Boss global diário 22:00 `America/Sao_Paulo` com trava de execução única
  (linha de lease no banco), tolerante a reinício.
- Fechamento semanal de rankings/estações idempotente.
- Expiração de anúncios de mercado e ofertas pendentes.

## 5. Recuperação

- Snapshot de estado por sessão a cada mudança relevante + debounce 2 s.
- Corrupção de arquivo: carga valida schema zod; inválido → quarentena
  (`*.corrupt-<ts>`) e sessão nova, com log de incidente (nunca silencioso).
- Rollback de release: deploy imutável por versão; migrações de banco com
  plano de reversão testado em staging (Fase 5+).

## 6. Segurança operacional

- Rotação de chaves de sessão; tokens com TTL.
- Rate limit por IP na borda (Fase 5) além do limite por sessão.
- Backups diários do banco + ledger exportado (WORM quando disponível).
