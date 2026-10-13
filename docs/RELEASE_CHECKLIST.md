# RELEASE_CHECKLIST

Usar em qualquer candidatura a release (web ou Android). Itens não atingidos
ficam marcados e bloqueiam o tag.

## Blocantes absolutos

- [ ] `npm test` e `npm run build` verdes no commit candidato.
- [ ] Licenças de **todos** os assets embarcados confirmadas
      (`docs/art/ASSET_LICENSES.md` sem `pending-verification` nos usados).
- [ ] Modo debug/admin desabilitado na build pública (`AKAI_DEBUG` ausente).
- [ ] Nenhum endpoint administrativo público exposto.
- [ ] Ruby/ premium: emissão somente server-side com ledger.
- [ ] Persistência migra estados antigos sem perda (teste de migração).
- [ ] Política de privacidade e declaração de dados (Android) revisadas.
- [ ] Checklist Google Play vigente revisado (Fase 9+).

## Qualidade

- [ ] Fluxo primeiro-minuto jogável em dispositivo de entrada (Android 8+).
- [ ] 30 min de sessão sem vazamento de memória/texturas (medição real).
- [ ] Reconexão WS recupera estado sem duplicar recompensas (teste + manual).
- [ ] Produção offline correta após 12 h fora (teste automatizado).
- [ ] Acessibilidade: navegação por teclado da área 3 e HUD legível.

## Operações

- [ ] Backups e procedimento de restore testados.
- [ ] Monitoramento e alertas de economia (ECONOMY.md §6) ativos.
- [ ] Plano de rollback documentado (OPERATIONS.md).

## Estado atual (2026-10-13)

NÃO há release candidata. MVP local jogável em desenvolvimento; itens de
licença permanecem pendentes e bloqueiam qualquer publicação comercial.
