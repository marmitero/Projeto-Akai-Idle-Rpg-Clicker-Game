# ADR-0004 — Assets: leitura direta de `sprites/` no dev, bundle curado na release

**Status: aceito (2026-10-13)**

## Contexto
`sprites/` tem 1,2 GB e 7.493 arquivos versionados. Copiar tudo para
`public/` inflaria o repo/build; mover/recortar originais é proibido
(master-prompt §3.2).

## Decisão
- Dev: middleware do Vite serve `/sprites/*` direto da raiz do repositório
  (somente leitura, cache-control curto).
- Release: script `tools/copy_curated_assets.ts` copia apenas entradas com
  `intendedUse` no manifesto para `apps/client/public/sprites/`, mantendo
  caminhos relativos. (Implementação pendente — Fase 3.5; até lá, builds de
  produção não embarcam assets e o RELEASE_CHECKLIST bloqueia release.)
- Grades/frames lidos em runtime de `docs/art/assets.json` via
  `apps/client/src/assets/manifest.ts` (subset gerada).

## Alternativas
- **Git submodule/LFS externo**: rejeitado agora; assets já estão no repo.
- **Atlas único gerado**: adiado para Fase 10 (otimização), exigiria
  reexportação de derivados documentados.

## Consequências
- Dev server depende da presença de `sprites/` na raiz (verificado em teste de
  integridade de assets).
- Bundle de release será pequeno e auditável por construção.
