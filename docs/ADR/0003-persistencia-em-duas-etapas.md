# ADR-0003 — Persistência: FileStore/localStorage no MVP, Postgres na Fase 5

**Status: aceito (2026-10-13)**

## Contexto
O master-prompt exige PostgreSQL com migrações para o modo online, mas o
ambiente de desenvolvimento atual não possui banco disponível e a Fase 5
(autoridade online completa) depende de autenticação real.

## Decisão
Interface `PersistenceStore` com duas implementações:
1. `FileStore` (server dev): JSON por sessão, escrita atômica tmp+rename,
   validação zod na carga, quarentena de arquivos corrompidos.
2. `LocalStorageStore` (client modo local), chave `akai.save.v1`.
`PostgresStore` entra na Fase 5 com migrações versionadas e testes de
concorrência, sem mudar o domínio.

## Alternativas
- **SQLite agora**: considerada; descartada porque o modelo alvo é Postgres e
  SQLite adicionaria dialeto sem comprar autoridade real.
- **Supabase direto**: adiado; master-prompt §5 permite, mas RLS não substitui
  motor autoritativo e não há credenciais no ambiente (bloqueio registrado).

## Consequências
- Server dev é single-process: concorrência entre processos NÃO é protegida
  pelo FileStore (limitação documentada em SECURITY.md §4).
- Nenhum código de domínio depende do meio de persistência.
