import { describe, expect, it } from 'vitest';
import {
  BALANCE,
  createInitialState,
  enemyCoins,
  tickWorld,
  type GameEvent,
  type PlayerState,
} from '@akai/shared';

const collect = (state: PlayerState, predicate: (ev: GameEvent) => boolean, maxMs = 120_000): GameEvent[] => {
  const all: GameEvent[] = [];
  let elapsed = 0;
  while (elapsed < maxMs && !all.some(predicate)) {
    all.push(...tickWorld(state, 250));
    elapsed += 250;
  }
  return all;
};

const runUntil = (state: PlayerState, predicate: () => boolean, maxMs = 120_000): boolean => {
  let elapsed = 0;
  while (!predicate() && elapsed < maxMs) {
    tickWorld(state, 250);
    elapsed += 250;
  }
  return predicate();
};

describe('combate automático', () => {
  it('andar comum tem 3 ondas de 3 inimigos (regra oficial §9.1)', () => {
    const state = createInitialState(0);
    expect(state.battle.enemies).toHaveLength(BALANCE.floor.enemiesPerWave);
    state.warriorLevel = 50;
    const ok = runUntil(state, () => state.battle.wave === 1 && state.battle.enemies.length === 3);
    expect(ok).toBe(true);
  });

  it('vitória de onda paga 3 inimigos + bônus, uma única vez', () => {
    const state = createInitialState(0);
    state.warriorLevel = 40;
    const coinsBefore = state.resources.coins;
    const ok = runUntil(state, () => state.battle.wave === 1);
    expect(ok).toBe(true);
    const gained = state.resources.coins - coinsBefore;
    expect(gained).toBe(enemyCoins(1) * 3 + Math.ceil(enemyCoins(1) * BALANCE.rewards.waveBonusMult));
    // congela o combate e garante que nenhum crédito extra surge nos ticks seguintes
    state.battle.enemies = [];
    state.battle.phase = 'idle';
    const frozen = state.resources.coins;
    for (let i = 0; i < 20; i += 1) tickWorld(state, 250);
    expect(state.resources.coins).toBe(frozen);
  });

  it('a recompensa de um inimigo não é concedida duas vezes (guard de rewarded)', () => {
    const state = createInitialState(0);
    state.warriorLevel = 30;
    const deaths = collect(state, (ev) => ev.t === 'enemy_death');
    const death = deaths.find((ev): ev is Extract<GameEvent, { t: 'enemy_death' }> => ev.t === 'enemy_death');
    expect(death).toBeDefined();
    const coinsAfterFirst = state.resources.coins;
    // isola o alvo: demais inimigos não podem gerar créditos durante o replay
    for (const other of state.battle.enemies) {
      if (other.slot !== death!.enemySlot) {
        other.alive = false;
        other.rewarded = true;
      }
    }
    // simula replay do mesmo inimigo: vivo de novo, mas já recompensado
    const enemy = state.battle.enemies[death!.enemySlot];
    expect(enemy).toBeDefined();
    enemy!.alive = true;
    enemy!.hp = 1;
    enemy!.rewarded = true;
    enemy!.atk = 0;
    const replay: GameEvent[] = [];
    let elapsed = 0;
    while (enemy!.alive && elapsed < 5000) {
      replay.push(...tickWorld(state, 250));
      elapsed += 250;
    }
    expect(enemy!.alive).toBe(false);
    expect(replay.some((ev) => ev.t === 'hero_attack')).toBe(true);
    // nenhum enemy_death (e portanto nenhum crédito) para o inimigo já pago
    expect(replay.filter((ev) => ev.t === 'enemy_death')).toEqual([]);
    void coinsAfterFirst;
  });

  it('dano respeita a faixa de variância e o mínimo de 1', () => {
    const state = createInitialState(0);
    const events = collect(state, (ev) => ev.t === 'hero_attack', 20_000);
    const attack = events.find((ev): ev is Extract<GameEvent, { t: 'hero_attack' }> => ev.t === 'hero_attack');
    expect(attack).toBeDefined();
    expect(attack!.amount).toBeGreaterThanOrEqual(1);
    expect(attack!.amount).toBeLessThanOrEqual(Math.round(6 * BALANCE.damageVariance.max));
  });

  it('andar comum não possui limite de tempo', () => {
    const state = createInitialState(0);
    expect(state.battle.bossTimerMs).toBeNull();
    for (let i = 0; i < 400; i += 1) tickWorld(state, 250);
    expect(state.battle.bossTimerMs).toBeNull();
  });

  it('herói que cai em andar comum recupera vida e mantém a onda', () => {
    const state = createInitialState(0);
    state.battle.enemies = state.battle.enemies.map((e) => ({ ...e, atk: 999 }));
    const events = collect(state, (ev) => ev.t === 'hero_down', 10_000);
    expect(events.some((ev) => ev.t === 'hero_down' && ev.boss === false)).toBe(true);
    expect(state.battle.heroHp).toBeGreaterThan(0);
    expect(state.battle.wave).toBe(0);
  });
});
