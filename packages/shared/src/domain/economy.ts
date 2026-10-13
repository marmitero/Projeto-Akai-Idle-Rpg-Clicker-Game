import { BALANCE, curveCost, ironPerClick } from '../config/balance.js';
import type { GameEvent, IntentResult, PlayerState, Resources } from './types.js';
import type { ResourceCostId } from '../config/balance.js';

export const canAfford = (state: PlayerState, cost: Partial<Record<ResourceCostId, number>>): boolean =>
  Object.entries(cost).every(([res, amount]) => state.resources[res as ResourceCostId] >= (amount ?? 0));

/** Debita recursos; retorna false e não muta nada se o saldo for insuficiente. */
export const spend = (state: PlayerState, cost: Partial<Record<ResourceCostId, number>>): boolean => {
  if (!canAfford(state, cost)) return false;
  for (const [res, amount] of Object.entries(cost)) {
    state.resources[res as ResourceCostId] -= amount ?? 0;
  }
  return true;
};

export const applyClick = (state: PlayerState): GameEvent[] => {
  const iron = ironPerClick(state.clickerLevel);
  state.resources.iron += iron;
  return [{ t: 'click', iron }];
};

export type UpgradeId = 'click_power' | 'warrior' | 'crit';

export const upgradeCost = (state: PlayerState, id: UpgradeId): Partial<Record<ResourceCostId, number>> => {
  switch (id) {
    case 'click_power':
      return { coins: curveCost(BALANCE.clicker.cost.base, BALANCE.clicker.cost.growth, state.clickerLevel) };
    case 'warrior':
      return { iron: curveCost(BALANCE.hero.warriorCost.base, BALANCE.hero.warriorCost.growth, state.warriorLevel) };
    case 'crit':
      return { coins: curveCost(BALANCE.hero.critCost.base, BALANCE.hero.critCost.growth, state.critLevel + 1) };
  }
};

export const buyUpgrade = (state: PlayerState, id: string): IntentResult => {
  if (id !== 'click_power' && id !== 'warrior' && id !== 'crit') {
    return { events: [], error: 'UNKNOWN_TARGET' };
  }
  const cost = upgradeCost(state, id);
  if (!spend(state, cost)) return { events: [], error: 'INSUFFICIENT_RESOURCES' };
  let level = 0;
  if (id === 'click_power') level = ++state.clickerLevel;
  if (id === 'warrior') level = ++state.warriorLevel;
  if (id === 'crit') level = ++state.critLevel;
  return { events: [{ t: 'purchase', kind: 'upgrade', id, level }] };
};

export const mineUpgradeCost = (mineId: string, level: number): Partial<Record<ResourceCostId, number>> => {
  const def = BALANCE.mines[mineId as 'coal' | 'gold' | 'jade'];
  if (!def) return {};
  return {
    [def.upgradeCost.resource]: curveCost(def.upgradeCost.base, def.upgradeCost.growth, level),
    coins: curveCost(def.upgradeCost.baseCoins, def.upgradeCost.coinGrowth, level),
  } as Partial<Record<ResourceCostId, number>>;
};

export const unlockMine = (state: PlayerState, mineId: string): IntentResult => {
  const def = BALANCE.mines[mineId as 'coal' | 'gold' | 'jade'];
  if (!def) return { events: [], error: 'UNKNOWN_TARGET' };
  const current = state.mines[mineId];
  if (current?.unlocked) return { events: [], error: 'ALREADY_UNLOCKED' };
  if (def.requiresMine) {
    const [reqId, reqLevel] = def.requiresMine;
    const req = state.mines[reqId];
    if (!req?.unlocked || req.level < reqLevel) {
      return { events: [], error: 'PREREQUISITE_NOT_MET' };
    }
  }
  if (!spend(state, def.unlockCost)) return { events: [], error: 'INSUFFICIENT_RESOURCES' };
  state.mines[mineId] = { unlocked: true, level: 1 };
  return { events: [{ t: 'mine_unlock', mineId }] };
};

export const upgradeMine = (state: PlayerState, mineId: string): IntentResult => {
  const def = BALANCE.mines[mineId as 'coal' | 'gold' | 'jade'];
  if (!def) return { events: [], error: 'UNKNOWN_TARGET' };
  const mine = state.mines[mineId];
  if (!mine?.unlocked) return { events: [], error: 'NOT_AVAILABLE' };
  const cost = mineUpgradeCost(mineId, mine.level);
  if (!spend(state, cost)) return { events: [], error: 'INSUFFICIENT_RESOURCES' };
  mine.level += 1;
  return { events: [{ t: 'purchase', kind: 'mine_upgrade', id: mineId, level: mine.level }] };
};

/** Produção por segundo de uma mina no nível atual. */
export const mineRatePerSecond = (mineId: string, level: number): number => {
  const def = BALANCE.mines[mineId as 'coal' | 'gold' | 'jade'];
  if (!def || level <= 0) return 0;
  return def.ratePerLevel * level;
};

/**
 * Produção contínua (tick). Frações ficam em `state.fractional` para não
 * perder restos entre ticks (nunca arredondar para cima por tick).
 */
export const tickMines = (state: PlayerState, dtMs: number): GameEvent[] => {
  const seconds = dtMs / 1000;
  for (const [mineId, mine] of Object.entries(state.mines)) {
    if (!mine.unlocked) continue;
    const def = BALANCE.mines[mineId as 'coal' | 'gold' | 'jade'];
    if (!def) continue;
    const gained = mineRatePerSecond(mineId, mine.level) * seconds;
    const key = def.produces;
    const frac = (state.fractional[key] ?? 0) + gained;
    const whole = Math.floor(frac + 1e-9);
    state.fractional[key] = frac - whole;
    if (whole > 0) state.resources[key] += whole;
  }
  return [];
};

/**
 * Produção offline por diferença de timestamps, com cap e eficiência
 * (master-prompt §12.4): nenhum loop por segundo ausente.
 */
export const applyOfflineProduction = (state: PlayerState, nowMs: number): GameEvent[] => {
  const elapsedRaw = Math.max(0, Math.floor((nowMs - state.lastSeenMs) / 1000));
  const seconds = Math.min(elapsedRaw, BALANCE.offline.capSeconds);
  state.lastSeenMs = nowMs;
  if (seconds < 60) return [];
  const gains: Partial<Resources> = {};
  for (const [mineId, mine] of Object.entries(state.mines)) {
    if (!mine.unlocked) continue;
    const def = BALANCE.mines[mineId as 'coal' | 'gold' | 'jade'];
    if (!def) continue;
    const amount = Math.floor(mineRatePerSecond(mineId, mine.level) * seconds * BALANCE.offline.efficiency);
    if (amount > 0) {
      state.resources[def.produces] += amount;
      gains[def.produces] = (gains[def.produces] ?? 0) + amount;
    }
  }
  if (Object.keys(gains).length === 0) return [];
  state.offlineReport = { seconds, gains };
  return [{ t: 'offline', seconds, gains }];
};
