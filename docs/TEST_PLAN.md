# TEST_PLAN — estratégia e cobertura obrigatória

Frameworks: **Vitest** (unit/integração, Node) para `packages/shared`,
`apps/server` e `tests/` de contrato. Builds validados com `tsc -b` e
`vite build`. Sem framework de teste de UI no MVP (validação visual manual
registrada em `AI_STATE.md`).

## 1. Camadas

1. **Unit (shared)**: fórmulas de dano/crítico, curvas de custo, produção,
   offline, RNG determinístico, máquinas de estado de batalha/progressão.
2. **Integração (server)**: sessão, rate limit, idempotência, rotas REST/WS
   via `app.inject` e cliente WS em memória.
3. **Contrato**: schemas zod aceitam mensagens válidas e rejeitam inválidas
   (incluindo `v` errado e campos de recurso injetados).
4. **Segurança/abuso**: mensagens repetidas, replay de `actionId`, compra sem
   saldo, duas compras simultâneas (Fase 7), debug sem permissão.
5. **Integridade de assets**: teste que garante que todo asset com
   `intendedUse` no manifesto existe no repositório com as dimensões
   declaradas (impede referência quebrada).

## 2. Cobertura mínima do master-prompt §28 (status)

| requisito | teste | status |
|---|---|---|
| 1 clique credita ferro correto | tests/shared/mining.spec.ts | ✅ |
| cliques acima do limite rejeitados | tests/server/session.spec.ts | ✅ |
| upgrade sem recursos falha | tests/shared/upgrades.spec.ts | ✅ |
| recursos nunca negativos | tests/shared/upgrades.spec.ts + mines | ✅ |
| produção automática respeita config | tests/shared/mines.spec.ts | ✅ |
| produção offline respeita limites | tests/shared/mines.spec.ts | ✅ |
| combate termina em vitória ou derrota | tests/shared/combat.spec.ts | ✅ |
| andar comum não expira | tests/shared/progression.spec.ts | ✅ |
| boss tem limite de tempo | tests/shared/progression.spec.ts | ✅ |
| derrota no boss pausa progressão | tests/shared/progression.spec.ts | ✅ |
| recompensa de inimigo não duplica | tests/shared/combat.spec.ts | ✅ |
| item não vendido 2x / compra atômica | - | ⬜ Fase 7 |
| ofertas não consomem indevidamente | - | ⬜ Fase 7 |
| compra premium não duplica | - | ⬜ Fase 8 |
| anúncio não resgatado repetidamente | - | ⬜ Fase 8 |
| evento global 1x por edição | - | ⬜ Fase 6 |
| último golpe único | - | ⬜ Fase 6 |
| posições PvP consistentes | - | ⬜ Fase 6 |
| troféus server-side | - | ⬜ Fase 6 |
| permissões de guilda | - | ⬜ Fase 6 |
| brasões com limites | - | ⬜ Fase 6 |
| rankings ignoram valores do cliente | - | ⬜ Fase 6 |
| reconexão recupera estado | tests/server/session.spec.ts (hello replay) | ✅ |
| falha de rede sem duplicar transações | idempotência de actionId | ✅ |

## 3. Critério de pronto

Nenhuma tarefa é marcada ✅ no ROADMAP sem: teste relevante passando
(`npm test`), build ok (`npm run build`) e atualização de `AI_STATE.md`.
