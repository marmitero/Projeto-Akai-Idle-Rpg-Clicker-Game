import { describe, expect, it } from 'vitest';
import {
  applyOfflineProduction,
  createInitialState,
  mineRatePerSecond,
  tickMines,
  unlockMine,
  upgradeMine,
  BALANCE,
} from '@akai/shared';

describe('minas automatizadas', () => {
  it('desbloqueio exige os custos configurados', () => {
    const state = createInitialState(0);
    expect(unlockMine(state, 'coal').error).toBe('INSUFFICIENT_RESOURCES');
    state.resources.iron = 100;
    state.resources.coins = 50;
    const result = unlockMine(state, 'coal');
    expect(result.error).toBeUndefined();
    expect(state.resources.iron).toBe(0);
    expect(state.resources.coins).toBe(0);
    expect(state.mines.coal).toEqual({ unlocked: true, level: 1 });
    expect(result.events).toEqual([{ t: 'mine_unlock', mineId: 'coal' }]);
  });

  it('desbloquear duas vezes é recusado', () => {
    const state = createInitialState(0);
    state.resources.iron = 500;
    state.resources.coins = 500;
    unlockMine(state, 'coal');
    expect(unlockMine(state, 'coal').error).toBe('ALREADY_UNLOCKED');
  });

  it('mina de ouro exige mina de carvão nível 50', () => {
    const state = createInitialState(0);
    state.resources = { coins: 1e6, iron: 1e6, coal: 1e6, gold: 1e6, jade: 1e6, ruby: 0 };
    expect(unlockMine(state, 'gold').error).toBe('PREREQUISITE_NOT_MET');
    state.mines.coal = { unlocked: true, level: 50 };
    expect(unlockMine(state, 'gold').error).toBeUndefined();
  });

  it('produção por segundo respeita a configuração (sem arredondar por tick)', () => {
    const state = createInitialState(0);
    state.mines.coal = { unlocked: true, level: 1 };
    expect(mineRatePerSecond('coal', 1)).toBeCloseTo(BALANCE.mines.coal.ratePerLevel);
    for (let i = 0; i < 10; i += 1) tickMines(state, 250); // 2,5 s
    expect(state.resources.coal).toBe(1); // 0.4*2.5 = 1.0
    expect(state.fractional.coal).toBeCloseTo(0, 5);
  });

  it('upgrade de mina aumenta nível e produção', () => {
    const state = createInitialState(0);
    state.mines.coal = { unlocked: true, level: 1 };
    state.resources.iron = 10_000;
    state.resources.coins = 10_000;
    const result = upgradeMine(state, 'coal');
    expect(result.error).toBeUndefined();
    expect(state.mines.coal.level).toBe(2);
    expect(mineRatePerSecond('coal', 2)).toBeCloseTo(0.8);
  });

  it('produção offline usa timestamps, cap e eficiência (sem loop por segundo)', () => {
    const state = createInitialState(0);
    state.mines.coal = { unlocked: true, level: 10 }; // 4/s
    state.lastSeenMs = 0;
    const events = applyOfflineProduction(state, 100_000_000); // > cap de 8h
    const expected = Math.floor(4 * BALANCE.offline.capSeconds * BALANCE.offline.efficiency);
    expect(state.resources.coal).toBe(expected);
    expect(events[0]).toMatchObject({ t: 'offline', seconds: BALANCE.offline.capSeconds });
  });

  it('ausência curta não gera relatório offline', () => {
    const state = createInitialState(0);
    state.mines.coal = { unlocked: true, level: 10 };
    state.lastSeenMs = 0;
    const events = applyOfflineProduction(state, 30_000);
    expect(events).toEqual([]);
  });
});
