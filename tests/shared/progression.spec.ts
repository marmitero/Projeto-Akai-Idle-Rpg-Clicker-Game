import { describe, expect, it } from 'vitest';
import {
  BALANCE,
  applyIntent,
  createInitialState,
  isBossFloor,
  tickWorld,
  type PlayerState,
} from '@akai/shared';

const runUntil = (state: PlayerState, predicate: () => boolean, maxMs = 900_000): boolean => {
  let elapsed = 0;
  while (!predicate() && elapsed < maxMs) {
    tickWorld(state, 250);
    elapsed += 250;
  }
  return predicate();
};

const strong = (state: PlayerState): PlayerState => {
  state.warriorLevel = 200;
  return state;
};

describe('progressão de andares e bosses', () => {
  it('conclui um andar comum e avança automaticamente', () => {
    const state = strong(createInitialState(0));
    const ok = runUntil(state, () => state.battle.floor === 2, 300_000);
    expect(ok).toBe(true);
  });

  it('chega ao andar 10 como andar de boss com temporizador', () => {
    const state = strong(createInitialState(0));
    const ok = runUntil(state, () => isBossFloor(state.battle.floor) && state.battle.phase === 'boss_fighting', 600_000);
    expect(ok).toBe(true);
    expect(state.battle.bossTimerMs).toBeLessThanOrEqual(BALANCE.boss.timerMs);
    expect(state.battle.enemies).toHaveLength(1);
    expect(state.battle.enemies[0]?.isBoss).toBe(true);
  });

  it('boss não derrotado no tempo causa derrota: volta 1 andar e pausa auto-progressão', () => {
    const state = createInitialState(0);
    state.warriorLevel = 1; // não mata o boss
    state.battle.floor = 10;
    state.battle.phase = 'boss_fighting';
    state.battle.bossTimerMs = 1000;
    state.battle.enemies = [
      { ...state.battle.enemies[0]!, id: 'b1', defId: 'boss:10', isBoss: true, hpMax: 10_000_000, hp: 10_000_000, atk: 0 },
    ];
    const events = tickWorld(state, 1500);
    expect(events.some((e) => e.t === 'boss_timeout')).toBe(true);
    expect(state.battle.floor).toBe(9);
    expect(state.autoProgress).toBe(false);
    expect(state.bossRetryAvailable).toBe(true);
  });

  it('o jogo NÃO reinicia o boss automaticamente após derrota', () => {
    const state = createInitialState(0);
    state.autoProgress = false;
    state.bossRetryAvailable = true;
    state.battle.floor = 9;
    state.battle.phase = 'idle';
    for (let i = 0; i < 200; i += 1) tickWorld(state, 250);
    expect(state.battle.floor).toBe(9);
    expect(state.battle.phase).toBe('idle');
  });

  it('retomada do boss é manual e leva ao andar de boss', () => {
    const state = createInitialState(0);
    state.autoProgress = false;
    state.bossRetryAvailable = true;
    state.battle.floor = 9;
    state.battle.phase = 'idle';
    const result = applyIntent(state, { t: 'bossRetry' });
    expect(result.error).toBeUndefined();
    expect(state.bossRetryAvailable).toBe(false);
    // após a caminhada, o boss fight começa
    const ok = runUntil(state, () => state.battle.phase === 'boss_fighting' && state.battle.floor === 10, 30_000);
    expect(ok).toBe(true);
  });

  it('bossRetry sem derrota prévia é recusado', () => {
    const state = createInitialState(0);
    expect(applyIntent(state, { t: 'bossRetry' }).error).toBe('NOT_AVAILABLE');
  });

  it('setAuto pausa e retoma a progressão', () => {
    const state = strong(createInitialState(0));
    applyIntent(state, { t: 'setAuto', on: false });
    expect(state.autoProgress).toBe(false);
    runUntil(state, () => state.battle.phase === 'idle', 300_000);
    expect(state.battle.phase).toBe('idle');
    applyIntent(state, { t: 'setAuto', on: true });
    const ok = runUntil(state, () => state.battle.floor > 1, 120_000);
    expect(ok).toBe(true);
  });
});
