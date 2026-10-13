# ADR-0002 — Domínio de gameplay em `packages/shared`, autoridade no server

**Status: aceito (2026-10-13)**

## Contexto
Precisamos de um simulador determinístico usado pelo client (modo local e
previsão visual) e pelo server (autoridade online) sem duplicar regras
(master-prompt §6.1, §9.1, §33).

## Decisão
Todo regra de gameplay vive em funções puras em `packages/shared/src/domain`,
alimentadas por `config/balance.ts`. O server executa o tick autoritativo e
emite snapshots+eventos; o client apenas anima e envia intenções. No modo
local, o client executa o mesmo domínio com persistência em localStorage,
rotulado como dados de teste.

## Alternativas
- **Duplicar regras no client p/ "responsividade"**: rejeitado; cria divergência.
- **Server-only com render por snapshot**: rejeitado no MVP; latência visual
  inaceitável para o clique de mineração (pilar 1 da Constituição).

## Consequências
- Testes de regras rodam uma única vez e valem para os dois lados.
- Risco: client pode ler o domínio e trapacear no modo local — aceito e
  documentado (modo local não é segurança; SECURITY.md §1).
- Determinismo garantido por RNG semeado; snapshots com `rev`.
