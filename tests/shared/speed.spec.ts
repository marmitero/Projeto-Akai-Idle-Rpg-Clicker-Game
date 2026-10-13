import { describe, expect, it } from 'vitest';
import {
  applyIntent,
  applyOfflineProduction,
  createInitialState,
  tickWorld,
  type PlayerState,
} from '@akai/shared';

const ticksUntilFloorClear = (state: PlayerState, max = 4000): number => {
  let ticks = 0;
  while (ticks < max) {
    const events = tickWorld(state, 250);
    ticks += 1;
    if (events.some((e) => e.t === 'floor_clear')) return ticks;
  }
  return -1;
};

const seeded = (speed: 1 | 2): PlayerState => {
  const state = createInitialState(0);
  state.warriorLevel = 120;
  state.combatSpeed = speed;
  state.battle.rngSeed = 123456789;
  return state;
};

describe('velocidade de combate 1x/2x', () => {
  it('intent setSpeed alterna o multiplicador persistido', () => {
    const state = createInitialState(0);
    expect(state.combatSpeed).toBe(1);
    applyIntent(state, { t: 'setSpeed', mult: 2 });
    expect(state.combatSpeed).toBe(2);
    applyIntent(state, { t: 'setSpeed', mult: 1 });
    expect(state.combatSpeed).toBe(1);
  });

  it('2x conclui o mesmo combate em aproximadamente metade dos ticks', () => {
    const a = ticksUntilFloorClear(seeded(1));
    const b = ticksUntilFloorClear(seeded(2));
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(0);
    expect(b).toBeLessThanOrEqual(Math.ceil(a * 0.6));
    expect(b).toBeGreaterThanOrEqual(Math.floor(a * 0.4));
  });

  it('a velocidade NÃO acelera minas (produção em tempo real)', () => {
    const slow = createInitialState(0);
    const fast = structuredClone(slow);
    fast.combatSpeed = 2;
    for (const s of [slow, fast]) {
      s.mines.coal = { unlocked: true, level: 4 };
    }
    for (let i = 0; i < 100; i += 1) {
      tickWorld(slow, 250);
      tickWorld(fast, 250);
    }
    expect(fast.resources.coal).toBe(slow.resources.coal);
  });

  it('ackOffline limpa o relatório de produção offline', () => {
    const state = createInitialState(0);
    state.mines.coal = { unlocked: true, level: 10 };
    state.lastSeenMs = 0;
    const events = applyOfflineProduction(state, 7_200_000);
    expect(events).toHaveLength(1);
    expect(state.offlineReport).not.toBeNull();
    applyIntent(state, { t: 'ackOffline' });
    expect(state.offlineReport).toBeNull();
  });
});
