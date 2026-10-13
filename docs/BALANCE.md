# BALANCE — balanceamento inicial PROVISÓRIO

> Status: **provisório** (master-prompt §26). Válidos até simulação e playtest.
> Fonte executável única: `packages/shared/src/config/balance.ts`.
> Nenhum número de balanceamento pode viver na UI ou em cenas.

## 1. Convenções

- Todas as curvas são `base * growth^(nivel-1)` arredondadas com `ceil`.
- RNG de combate: mulberry32 semeado por sessão/batalha; variação de dano
  uniforme em `[0.9, 1.1]`.
- Tempos em ms no código, segundos na documentação.

## 2. Herói

| atributo | fórmula |
|---|---|
| hpMax | `60 + 12 * (warriorLevel - 1)` |
| atk | `6 + 2 * (warriorLevel - 1)` |
| def | `1` |
| attackSpeed | `1.0 s` |
| critChance | `0.05 + 0.01 * critLevel` (máx 0.30) |
| critMult | `1.5` |

Custo do guerreiro (ferro): `ceil(25 * 1.35^(lvl-1))`.
Custo do crítico (coins): `ceil(100 * 1.5^(lvl-1))`.

## 3. Clicker

| melhoria | efeito | custo |
|---|---|---|
| click_power | +1 ferro/clique por nível | `ceil(15 * 1.4^(lvl-1))` coins |

Limite de cliques: 10/s sustentados, rajada de 12 (servidor).

## 4. Inimigos de andar comum (andar f)

| atributo | fórmula |
|---|---|
| hp | `ceil(10 * 1.12^(f-1))` |
| atk | `ceil(2.2 * 1.09^(f-1))` |
| coins por inimigo | `ceil(3 * 1.11^(f-1))` |
| ondas | 3 · inimigos por onda: 3 |
| tempo limite | **nenhum** |
| transição entre ondas/andares | 3 s |

## 5. Boss de dezena (andar f, f % 10 == 0)

| atributo | fórmula |
|---|---|
| hp | `enemyHp(f) * 14` |
| atk | `enemyAtk(f) * 1.6` |
| timer | 60 s |
| coins | `enemyCoins(f) * 25` |
| chance de drop de equipamento | `min(0.75, 0.25 + f/400)` (Fase 4) |

Derrota (timer ou morte do herói): retorna a `f-1`, auto-progressão pausada,
retomada manual obrigatória. Sem nova tentativa automática.

## 6. Minas

| mina | desbloqueio | produção/s | upgrade |
|---|---|---|---|
| carvão | 100 ferro + 50 coins | `0.4 * nível` | `ceil(60 * 1.25^(lvl-1))` ferro + `ceil(30 * 1.25^(lvl-1))` coins |
| ouro | carvão nv 50 + 2.500 ferro + 400 carvão + 1.200 coins | `0.15 * nível` | curva idêntica em ouro/ferro (Fase 4) |
| jade | 20.000 ferro + 300 ouro + 1.500 carvão + 9.000 coins | `0.05 * nível` | Fase 4 |

Produção offline: `rate * min(elapsed, 28800s) * 0.60`.

## 7. Sanity checks esperados (simulação futura)

- Andar 10 alcançável em ~10-15 min de jogo ativo no MVP.
- Mina de carvão desbloqueável em ~5-8 min.
- Inflação de coins controlada pelos sumidouros de upgrade (ECONOMY.md).
- Curvas serão ajustadas após `tools/sim_progression.ts` (pendente).
