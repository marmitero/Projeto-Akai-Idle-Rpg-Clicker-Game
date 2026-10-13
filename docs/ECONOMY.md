# ECONOMY — recursos, fontes, sumidouros e taxas

## 1. Recursos

| recurso | tipo | fontes | sumidouros | estado |
|---|---|---|---|---|
| coin | soft | inimigos, ondas, andares, bosses | upgrades de clicker/crítico, desbloqueios, taxas de mercado | IMPLEMENTADO |
| ferro | soft | clique, (futuro) fabricação | guerreiro, mina de carvão, receitas | IMPLEMENTADO |
| carvão | soft | mina de carvão | upgrades de equipamento (F4), ferro fundido (F4), mina de ouro | IMPLEMENTADO |
| ouro | soft | mina de ouro | equipamento/mascote alto nível (F4+) | especificado |
| jade | soft | mina de jade | receitas avançadas (F4+) | especificado |
| ruby | premium | compra validada, eventos, anúncios | cosméticos, baús, bônus | especificado |

Regras duras:
- Todo crédito de recurso nasce de uma regra de domínio executada onde há
  autoridade (server online; shared-domain no modo local identificado).
- Ruby tem ledger próprio (`PremiumCurrencyLedger`) com origem e motivo.
- Saldo nunca negativo: débitos validam saldo antes de aplicar (testes).

## 2. Circulação esperada no MVP

- Coins entram por combate e saem por `click_power`, `crit` e desbloqueio de
  mina; ferro entra por clique e sai por guerreiro/carvão.
- Não há transferência entre jogadores no MVP (mercado é Fase 7).

## 3. Mercado (Fase 7 — parâmetros iniciais de design)

- Taxa de transação: 10% sobre o valor, no recurso da transação
  (nunca taxa de coins sobre recurso incompatível).
- Custo de anúncio: 100.000 coins.
- Arredondamento: `floor` da taxa, mínimo 1 quando valor > 0; item indivisível
  não gera saldo negativo (validação explícita).
- Duração do anúncio 3 dias; relistagem após remoção antecipada: 24 h.
- Simulação obrigatória antes de ativar (master-prompt §19.1).

## 4. Monetização

- Pacotes de ruby: Punhado, Saco, Pote, Baú — preços **indefinidos** até
  simulação (Constituição §7).
- Anúncios recompensados: concessão idempotente por `rewardId` validado pelo
  provedor; nunca booleano do cliente.

## 5. Produção offline

- Janela elegível: `min(agora - ultimoVisto, 8h)`.
- Eficiência: 60%. Sem bônus não validados. Sem loop por segundo.

## 6. Indicadores de saúde (OPERATIONS.md)

- Emissão de coins/dia por conta, sumidouro/fonte por sistema, saldo mediano,
  taxa de cliques rejeitados, tentativas de boss por conta/dia.
