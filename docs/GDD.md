# GDD — Projeto Akai (Game Design Document)

Estado: **vivo e incremental**. O que está implementado hoje é marcado
`[IMPLEMENTADO]`; o resto é especificação. Fonte de regras numéricas:
`docs/BALANCE.md` e `packages/shared/src/config/balance.ts` (única fonte de
verdade executável).

## 1. Loop principal

1. Assistir/acompanhar a batalha automática no andar atual. `[IMPLEMENTADO]`
2. Derrotar inimigos → ganhar coins. `[IMPLEMENTADO]`
3. Minerar ferro por clique no nó central. `[IMPLEMENTADO]`
4. Comprar melhorias (clicker, guerreiro, crítico) e desbloquear minas.
   `[IMPLEMENTADO: clicker/guerreiro/crítico + mina de carvão]`
5. Minas produzem por segundo, inclusive offline (limitado). `[IMPLEMENTADO]`
6. Recursos fortalecem o herói para subir andares. `[IMPLEMENTADO]`
7. Boss a cada 10 andares impõe verificação de força com temporizador.
   `[IMPLEMENTADO]`
8. Derrota no boss → volta um andar, auto-progressão pausada, retomada manual.
   `[IMPLEMENTADO]`
9. Equipamentos, mascotes, eventos, mercado, PvP, guildas: Fases 4-7.

## 2. Tela principal (três áreas)

- **Topo — Combate**: cenário em camadas, herói à esquerda, inimigos à direita,
  barras de vida, dano flutuante, efeitos de impacto, identificação do andar,
  onda atual (1/3, 2/3, 3/3), temporizador apenas em boss. `[IMPLEMENTADO]`
- **Meio — Mineração**: piso de tileset, nó de minério central, contador de
  ferro com ícone real, ganho por clique, partículas/impacto ao tocar,
  feedback imediato antes da confirmação online. `[IMPLEMENTADO]`
- **Base — Automações**: painel HTML com abas (Minas / Melhorias), produção por
  segundo, nível, custo com ícone do recurso, estado de compra
  (comprável/insuficiente/bloqueado). `[IMPLEMENTADO]`

## 3. Combate

- Atributos: hpMax, atk, def, attackSpeed (s), critChance, critMult.
- Dano: `max(1, round(atk * var) - def)`, `var ∈ [0.9, 1.1]` (RNG semeado);
  crítico multiplica o dano final por `critMult`.
- Herói ataca o inimigo vivo mais à frente; inimigos atacam o herói.
- Morte remove o inimigo da onda; onda limpa → próxima onda; 3 ondas de 3
  inimigos por andar comum (regra oficial, master-prompt §9.1).
- Entre ondas/andares: transição de caminhada de ~3 s (`walkTransitionMs`).
- Andares comuns **não têm limite de tempo**.
- Derrota do herói em andar comum: recupera no mesmo andar com vida cheia,
  sem perder progresso de onda já concluída (auto-progressão continua).
- Velocidade de combate configurável (1x/2x): `[IMPLEMENTADO]` botão `1x/2x`
  na área de combate; escala apenas o tick de batalha, nunca as minas.

### 3.1 Bosses de dezena `[IMPLEMENTADO]`

- Andares 10, 20, 30…: uma onda, um boss elite.
- Vida e dano escalados (`bossHpMult`, `bossAtkMult`), temporizador
  `bossTimerSeconds` (60 s no balanceamento provisório).
- Vitória: coins multiplicados + chance de drop de equipamento (Fase 4).
- Derrota por tempo ou morte: jogador retorna ao andar anterior
  (`floor-1`), auto-progressão **pausada**, e o jogo **não** reinicia o boss
  sozinho; exige botão "Tentar novamente". Recompensas não são duplicadas.

## 4. Clicker e mineração `[IMPLEMENTADO]`

- Nível 1 = 1 ferro/clique. Upgrade `click_power`: +1 ferro/clique por nível.
- Feedback visual imediato; no modo online a confirmação é do servidor.
- Limite de toques: 10 cliques/s sustentados (servidor), rejeição previsível.
- Nó de ferro usa `sprites/Mine/ironNode.png`; ícone do contador usa
  `sprites/Materials/Icon31_15.png`.

## 5. Minas e automações `[IMPLEMENTADO: carvão]`

- **Carvão**: desbloqueio por ferro+coins; produz `0.4 * nível` /s; upgrade
  aumenta nível e produção.
- **Ouro**: exige mina de carvão nível 50; desbloqueio ferro+carvão+coins.
  `[ESPECIFICADO, não implementado]`
- **Jade**: desbloqueio ferro+ouro+carvão+coins. `[ESPECIFICADO]`
- Produção offline: `rate * min(elapsed, offlineCapSeconds) * offlineEfficiency`,
  calculada por diferença de timestamps, nunca por loop por segundo.

## 6. Recursos

| recurso | fonte principal | ícone | estado |
|---|---|---|---|
| coin | batalhas | (HUD numérico + ícone de moeda pendente) | IMPLEMENTADO |
| ferro | clique + (futuro) mina | Icon31_15 | IMPLEMENTADO |
| carvão | mina de carvão | Icon31_13 | IMPLEMENTADO |
| ouro | mina de ouro | Icon31_35 | especificado |
| jade | mina de jade | Icon31_40 | especificado |
| ruby | compra/evento/anúncio | pendente de asset | especificado |

## 7. Equipamentos e raridades (Fase 4)

Categorias: espadas, adagas, machados, maças, 2 mãos, lanças, escudos, arcos,
peitorais, chapéus, luvas, botas, colares, anéis. Ícones reais já existem em
`sprites/Equipments/*` e `sprites/Acessories/*` (32x32). Raridades: comum,
incomum, raro, épico, lendário — influenciam atributos e nº de propriedades.
Geração **somente no servidor**. Drop raro em comuns; bosses com chance maior.

## 8. Mascotes (Fase 4)

Entidades de progressão com raridade, nível, bônus passivo e custo. **Lacuna de
asset registrada**: não há sprites de mascote adequados no repositório
(manifesto, seção Lacunas). Decisão pendente: usar composições das bases
Male/Female Base em escala reduzida ou aguardar pack licenciado.

## 9. Eventos

- **Boss global diário** 22h `America/Sao_Paulo`, agendado no servidor, vida
  global, ranking de contribuição, último golpe único (Fase 6).
- **Eventos relâmpago**: XP +30% 6h; loteria de 100 rubies; raid surpresa com
  baú de equipamento (Fase 6).
- Debug local para iniciar eventos: somente build de desenvolvimento.

## 10. Mercado, PvP, Guildas, Rankings (Fases 6-7)

Especificados no master-prompt §19-§22 e resumidos em `docs/ECONOMY.md` e
`docs/SECURITY.md`. Nenhum deles entra no MVP jogável.

## 11. Monetização

Ruby premium; anúncios recompensados voluntários (2 min de autoclick 3/s,
2 min de recompensas em dobro, 2 min de dano em dobro, coins balanceados);
loja com pacotes Punhado/Saco/Pote/Baú. Tudo validado no servidor; nada de
booleano do cliente como prova.

## 12. Retenção e experiência offline

- Produção offline limitada (8 h, eficiência 60% no balanceamento provisório).
- Retorno mostra resumo de ganhos offline em banner com duração e
  recursos ganhos, confirmado por `ackOffline`. `[IMPLEMENTADO]`
- Boss diário como âncora de horário fixo.

## 13. Critérios de vitória/derrota/desbloqueio

- Vitória de andar: 3 ondas limpas. Vitória de boss: hp 0 dentro do tempo.
- Derrota de boss: tempo esgotado ou herói morto → regras da §3.1.
- Desbloqueios por prerequisitos configurados (minas, upgrades, andares).
