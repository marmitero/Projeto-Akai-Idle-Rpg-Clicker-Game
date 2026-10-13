# DROP_TABLES — recompensas e probabilidades

> Provisório. Geração de itens **somente no servidor** (ou domínio
> autoritativo equivalente). Nada de rolagem no cliente.

## 1. Recompensas de combate (IMPLEMENTADO)

| evento | recompensa |
|---|---|
| inimigo comum derrotado | `enemyCoins(floor)` coins |
| onda concluída | bônus `ceil(enemyCoins(floor) * 1.5)` coins |
| andar comum concluído | bônus `ceil(enemyCoins(floor) * 3)` coins |
| boss derrotado | `enemyCoins(floor) * 25` coins + rolagem de equipamento |

Recompensa de inimigo é creditada **uma única vez** por instância
(`enemyId` + `battleRev`), com teste de não-duplicidade.

## 2. Drop de equipamento (Fase 4)

Rolagem por boss derrotado: `chance = min(0.75, 0.25 + floor/400)`.

Tabela de raridade ao dropar (pesos iniciais):

| raridade | peso | multiplicador de atributos | propriedades |
|---|---|---|---|
| comum | 55 | 1.00 | 0 |
| incomum | 25 | 1.15 | 1 |
| raro | 12 | 1.35 | 2 |
| épico | 6 | 1.60 | 3 |
| lendário | 2 | 2.00 | 4 |

Inimigos comuns: **sem drop de equipamento** no MVP (decisão de design;
master-prompt §13 exige drops raros).

## 3. Baús e eventos (Fase 6+)

- Raid surpresa: baú de equipamento com tabela deslocada (+10 pontos de peso
  nas raridades ≥ raro).
- Boss global: faixas de contribuição + recompensa de último golpe única.
- Loteria relâmpago: 100 rubies, sorteio server-side, elegíveis online.

## 4. Validação estatística

- `tests/economy/drop.spec.ts` (Fase 4): 100k rolagens semeadas; frequência
  dentro de ±2 p.p. dos pesos; último golpe exatamente 1 vez em N execuções.
