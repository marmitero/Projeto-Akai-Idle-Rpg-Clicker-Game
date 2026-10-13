# ROADMAP — Projeto Akai

Fases do master-prompt §29 com estado real em 2026-10-13.
Legenda: ✅ concluído com evidência · 🟡 parcial · ⬜ pendente · ⛔ bloqueado.

## Fase 0 — Auditoria ✅

- [x] Inspeção do repositório (1 commit base, apenas `docs/` e `sprites/`).
- [x] Inventário técnico: 7.493 arquivos, SHA-1, dimensões, alfa
      (`tools/out/sprite_inventory.json`).
- [x] Prévia visual das famílias principais (`tools/out/previews/*`).
- [x] Manifesto `docs/art/ASSET_MANIFEST.md` + `docs/art/assets.json`.
- [x] Relatório de licenças e lacunas `docs/art/ASSET_LICENSES.md`.
- [x] Documentos oficiais criados (Constituição, GDD, ARCHITECTURE, API,
      DATA_MODEL, SECURITY, BALANCE, ECONOMY, DROP_TABLES, UI_UX, TEST_PLAN,
      RELEASE_CHECKLIST, OPERATIONS, ADRs, ART_BIBLE).
- [x] `AI_STATE.md` na raiz.

## Fase 1 — Fundação técnica ✅

- [x] Monorepo npm workspaces: `apps/client`, `apps/server`, `packages/shared`.
- [x] TypeScript estrito + `tsc -b` + Vitest configurados e passando.
- [x] Contratos compartilhados com zod (`packages/shared/contracts`).
- [x] Servidor Fastify executável independente (`npm run dev -w apps/server`).
- [x] Client Vite executável independente (`npm run dev -w apps/client`).
- [x] Persistência: `FileStore` (server dev) + `localStorage` (client local).
- [x] Logs estruturados e tratamento de erros no servidor.

## Fase 2 — Protótipo visual jogável ✅

- [x] Layout vertical mobile-first com safe areas e 3 áreas reais.
- [x] Protagonista integrado (sheets Idle/Run/Attack/Dead verificadas).
- [x] Inimigos integrados (Skeleton sequências + bases compostas pendentes).
- [x] Cena de combate lateral com fundo em camadas e tileset de chão.
- [x] Cena de mineração com `ironNode.png` e ícone `Icon31_15.png`.
- [x] Feedback de clique (impacto + número flutuante + partícula).
- [x] Redimensionamento sem distorção (scale adaptativo do canvas).

## Fase 3 — Loop principal ✅ (MVP jogável)

- [x] Combate automático com eventos determinísticos.
- [x] 3 ondas × 3 inimigos por andar comum.
- [x] Recompensas de coins por inimigo/onda/andar.
- [x] Progressão automática de andares com pausa/retomada.
- [x] Boss de dezena com temporizador, derrota, retorno e retomada manual.
- [x] Clicker de ferro + upgrades (click_power, warrior, crit).
- [x] Mina de carvão (desbloqueio, produção/s, upgrade).
- [x] Produção offline limitada por timestamps.
- [x] Persistência local de teste + testes dos fluxos críticos.
- [ ] Velocidade de combate 1x/2x (pendente 3.5).
- [ ] Resumo de ganhos offline na UI (pendente 3.5).

## Fase 4 — Progressão RPG ⬜

Equipamentos + raridades + drops · mascotes (⛔ lacuna de asset documentada) ·
evolução do guerreiro além do MVP · minas de ouro e jade · fabricação
(ferro fundido) · bônus temporários · balanceamento validado por simulação.

## Fase 5 — Servidor autoritativo 🟡

- [x] Contratos de intenção/estado e domínio compartilhado autoritativo.
- [x] Sessões com rate limit e idempotência no servidor dev.
- [ ] Autenticação Google + conta convidado com vínculo.
- [ ] PostgresStore + migrações versionadas.
- [ ] Testes de concorrência e abuso em CI.

## Fase 6 — Comunidade ⬜

Chat global · guildas (20 membros, +2/nível até 10) · brasões em grade de
pixels · rankings · PvP de posição · temporadas · boss global 22h BRT ·
eventos relâmpago.

## Fase 7 — Economia compartilhada ⬜

Mercado com anúncios 3 dias, taxas 10% + 100k coins (provisório), ofertas,
transação atômica em 9 passos, relistagem 24h, histórico e moderação.

## Fase 8 — Monetização ⬜

Catálogo ruby, adaptador de compras, validação de recibos, anúncios
recompensados verificados, recuperação/reembolso, sandbox.

## Fase 9 — Android ⬜

Empacotamento, ciclo de vida, desempenho em aparelho, privacidade,
conformidade Play (pagamentos/anúncios/menores).

## Fase 10 — Polimento e lançamento ⬜

Balanceamento final, otimização de sprites, carga, rede, recuperação,
auditoria de segurança, licenças confirmadas, monitoramento, rollback.

---

## Próxima tarefa concreta (após esta entrega)

Fase 3.5 → **velocidade de combate 1x/2x + resumo offline na UI**, e em seguida
Fase 4.1 → **equipamentos com raridade e drop de boss**, usando os ícones reais
de `sprites/Equipments/` (geração no servidor/shared, nunca no client).
