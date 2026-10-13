import {
  BALANCE,
  enemyAtk,
  enemyCoins,
  heroAtk,
  heroCritChance,
  heroHpMax,
  isBossFloor,
} from '../config/balance.js';
import { nextRandom, randomInRange } from './rng.js';
import type { BattleState, EnemyState, GameEvent, PlayerState } from './types.js';

let enemyCounter = 0;
const newEnemyId = (): string => `e${(++enemyCounter).toString(36)}${Date.now().toString(36)}`;

export const makeEnemy = (floor: number, slot: number, isBoss: boolean): EnemyState => {
  const hpMax = isBoss
    ? Math.ceil(
        BALANCE.enemy.hp.base *
          Math.pow(BALANCE.enemy.hp.growth, floor - 1) *
          BALANCE.boss.hpMult,
      )
    : Math.ceil(BALANCE.enemy.hp.base * Math.pow(BALANCE.enemy.hp.growth, floor - 1));
  const atk = isBoss
    ? Math.ceil(enemyAtk(floor) * BALANCE.boss.atkMult)
    : enemyAtk(floor);
  return {
    id: newEnemyId(),
    defId: isBoss ? `boss:${floor}` : `mob:${floor}`,
    slot,
    hp: hpMax,
    hpMax,
    atk,
    def: BALANCE.enemy.def,
    attackSpeedMs: isBoss ? BALANCE.boss.attackSpeedMs : BALANCE.enemy.attackSpeedMs,
    cooldownMs: 400 + slot * 250,
    alive: true,
    rewarded: false,
    isBoss,
  };
};

export const spawnWave = (floor: number, wave: number): EnemyState[] => {
  if (isBossFloor(floor)) {
    return [makeEnemy(floor, 0, true)];
  }
  return Array.from({ length: BALANCE.floor.enemiesPerWave }, (_, i) =>
    makeEnemy(floor, i, false),
  );
};

export const createBattle = (floor: number, seed: number): BattleState => ({
  floor,
  wave: 0,
  enemies: spawnWave(floor, 0),
  heroHp: heroHpMax(1),
  heroCooldownMs: 300,
  phase: isBossFloor(floor) ? 'boss_fighting' : 'fighting',
  phaseMs: 0,
  bossTimerMs: isBossFloor(floor) ? BALANCE.boss.timerMs : null,
  rngSeed: seed,
  battleRev: 1,
  pendingFloor: null,
});

const computeDamage = (
  atk: number,
  def: number,
  critChance: number,
  critMult: number,
  seedHolder: { rngSeed: number },
): { amount: number; crit: boolean } => {
  const variance = randomInRange(seedHolder, BALANCE.damageVariance.min, BALANCE.damageVariance.max);
  const crit = nextRandom(seedHolder) < critChance;
  let amount = Math.max(1, Math.round(atk * variance) - def);
  if (crit) amount = Math.round(amount * critMult);
  return { amount, crit };
};

const startWalk = (state: PlayerState, toFloor: number, wave: number, events: GameEvent[]): void => {
  const b = state.battle;
  b.phase = 'walking';
  b.phaseMs = BALANCE.floor.walkTransitionMs;
  b.pendingFloor = toFloor;
  b.wave = wave;
  b.enemies = [];
  events.push({ t: 'walk_start', toFloor, wave });
};

const enterFloor = (state: PlayerState, floor: number): void => {
  const b = state.battle;
  b.floor = floor;
  b.wave = 0;
  b.enemies = spawnWave(floor, 0);
  b.phase = isBossFloor(floor) ? 'boss_fighting' : 'fighting';
  b.bossTimerMs = isBossFloor(floor) ? BALANCE.boss.timerMs : null;
  b.battleRev += 1;
};

/** Derrota em boss: volta um andar, pausa auto-progressão, exige retomada manual. */
const applyBossDefeat = (state: PlayerState, events: GameEvent[]): void => {
  const b = state.battle;
  const from = b.floor;
  const fallback = Math.max(1, from - 1);
  events.push({ t: 'boss_timeout', floor: from, fallbackFloor: fallback });
  state.autoProgress = false;
  state.bossRetryAvailable = true;
  enterFloor(state, fallback);
  b.phase = 'idle';
  b.enemies = [];
  b.pendingFloor = fallback;
};

/**
 * Avança a batalha de forma determinística. Puro em relação ao estado passado
 * (muta apenas `state`) e retorna eventos para renderização/auditoria.
 */
export const tickBattle = (state: PlayerState, dtMs: number): GameEvent[] => {
  const events: GameEvent[] = [];
  const b = state.battle;
  const cfg = BALANCE;

  if (b.phase === 'idle') return events;

  if (b.phase === 'walking') {
    b.phaseMs -= dtMs;
    if (b.phaseMs <= 0) {
      const target = b.pendingFloor ?? b.floor;
      if (target !== b.floor) {
        enterFloor(state, target);
      } else {
        b.enemies = spawnWave(b.floor, b.wave);
        b.phase = isBossFloor(b.floor) ? 'boss_fighting' : 'fighting';
        b.bossTimerMs = isBossFloor(b.floor) ? cfg.boss.timerMs : null;
        b.battleRev += 1;
      }
      b.pendingFloor = null;
    }
    return events;
  }

  const fighting = b.phase === 'fighting' || b.phase === 'boss_fighting';
  if (!fighting) return events;

  if (b.bossTimerMs !== null) {
    b.bossTimerMs -= dtMs;
    if (b.bossTimerMs <= 0) {
      applyBossDefeat(state, events);
      return events;
    }
  }

  // herói ataca
  b.heroCooldownMs -= dtMs;
  if (b.heroCooldownMs <= 0) {
    b.heroCooldownMs = cfg.hero.attackSpeedMs;
    const target = b.enemies.find((e) => e.alive);
    if (target) {
      const { amount, crit } = computeDamage(
        heroAtk(state.warriorLevel),
        target.def,
        heroCritChance(state.critLevel),
        cfg.hero.critMult,
        b,
      );
      target.hp -= amount;
      events.push({ t: 'hero_attack', enemySlot: target.slot, amount, crit, floor: b.floor });
      if (target.hp <= 0) {
        target.alive = false;
        if (!target.rewarded) {
          target.rewarded = true;
          const coins = target.isBoss
            ? enemyCoins(b.floor) * cfg.boss.coinsMult
            : enemyCoins(b.floor);
          state.resources.coins += coins;
          events.push({ t: 'enemy_death', enemySlot: target.slot, coins, floor: b.floor });
        }
      }
    }
  }

  // inimigos atacam
  for (const enemy of b.enemies) {
    if (!enemy.alive) continue;
    enemy.cooldownMs -= dtMs;
    if (enemy.cooldownMs <= 0) {
      enemy.cooldownMs = enemy.attackSpeedMs;
      const { amount } = computeDamage(enemy.atk, cfg.hero.def, 0, 1, b);
      state.battle.heroHp -= amount;
      events.push({ t: 'enemy_attack', amount, floor: b.floor });
    }
  }

  // herói caiu
  if (b.heroHp <= 0) {
    events.push({ t: 'hero_down', floor: b.floor, boss: b.phase === 'boss_fighting' });
    if (b.phase === 'boss_fighting') {
      applyBossDefeat(state, events);
      state.battle.heroHp = heroHpMax(state.warriorLevel);
      return events;
    }
    state.battle.heroHp = heroHpMax(state.warriorLevel);
    return events;
  }

  // onda / andar concluídos
  if (b.enemies.length > 0 && b.enemies.every((e) => !e.alive)) {
    if (b.phase === 'boss_fighting') {
      const coins = enemyCoins(b.floor) * cfg.boss.coinsMult;
      state.resources.coins += coins;
      events.push({ t: 'boss_defeat', floor: b.floor, coins });
      state.bossRetryAvailable = false;
      const next = b.floor + 1;
      if (state.autoProgress) {
        startWalk(state, next, 0, events);
      } else {
        b.phase = 'idle';
        b.enemies = [];
        b.pendingFloor = next;
      }
      return events;
    }
    const waveBonus = Math.ceil(enemyCoins(b.floor) * cfg.rewards.waveBonusMult);
    state.resources.coins += waveBonus;
    events.push({ t: 'wave_clear', wave: b.wave, bonus: waveBonus, floor: b.floor });
    if (b.wave < cfg.floor.waves - 1) {
      startWalk(state, b.floor, b.wave + 1, events);
    } else {
      const floorBonus = Math.ceil(enemyCoins(b.floor) * cfg.rewards.floorBonusMult);
      state.resources.coins += floorBonus;
      events.push({ t: 'floor_clear', floor: b.floor, bonus: floorBonus });
      const next = b.floor + 1;
      if (state.autoProgress) {
        startWalk(state, next, 0, events);
      } else {
        b.phase = 'idle';
        b.enemies = [];
        b.pendingFloor = next;
      }
    }
  }

  return events;
};

/** Retomada manual do boss após derrota (master-prompt §9.3). */
export const retryBoss = (state: PlayerState): GameEvent[] => {
  const events: GameEvent[] = [];
  if (!state.bossRetryAvailable) return events;
  state.bossRetryAvailable = false;
  const bossFloor = state.battle.floor + 1;
  startWalk(state, bossFloor, 0, events);
  return events;
};
