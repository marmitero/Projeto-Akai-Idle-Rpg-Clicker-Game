import { BALANCE } from '../config/balance.js';
import { createBattle, retryBoss, tickBattle } from './combat.js';
import {
  applyClick,
  applyOfflineProduction,
  buyUpgrade,
  tickMines,
  unlockMine,
  upgradeMine,
} from './economy.js';
import { initialSeed } from './rng.js';
import type { GameEvent, IntentResult, PlayerState } from './types.js';

export const createInitialState = (nowMs: number, floor = 1): PlayerState => ({
  schemaVersion: 1,
  rev: 1,
  resources: { coins: 0, iron: 0, coal: 0, gold: 0, jade: 0, ruby: 0 },
  clickerLevel: 1,
  warriorLevel: 1,
  critLevel: 0,
  mines: {
    coal: { unlocked: false, level: 0 },
    gold: { unlocked: false, level: 0 },
    jade: { unlocked: false, level: 0 },
  },
  autoProgress: true,
  bossRetryAvailable: false,
  combatSpeed: 1,
  battle: createBattle(floor, initialSeed()),
  fractional: {},
  createdAtMs: nowMs,
  lastSeenMs: nowMs,
  offlineReport: null,
});

/**
 * Tick de mundo: batalha + minas. Usado pelo server (autoridade) e pelo modo
 * local. A velocidade de combate (1x/2x) escala SOMENTE o dt da batalha;
 * minas e produção offline permanecem em tempo real (docs/BALANCE.md).
 */
export const tickWorld = (state: PlayerState, dtMs: number): GameEvent[] => {
  const events = tickBattle(state, dtMs * state.combatSpeed);
  events.push(...tickMines(state, dtMs));
  return events;
};

export type Intent =
  | { t: 'click' }
  | { t: 'buy'; upgradeId: string }
  | { t: 'unlockMine'; mineId: string }
  | { t: 'upgradeMine'; mineId: string }
  | { t: 'bossRetry' }
  | { t: 'setAuto'; on: boolean }
  | { t: 'setSpeed'; mult: 1 | 2 }
  | { t: 'ackOffline' };

export const applyIntent = (state: PlayerState, intent: Intent): IntentResult => {
  let result: IntentResult;
  switch (intent.t) {
    case 'click':
      result = { events: applyClick(state) };
      break;
    case 'buy':
      result = buyUpgrade(state, intent.upgradeId);
      break;
    case 'unlockMine':
      result = unlockMine(state, intent.mineId);
      break;
    case 'upgradeMine':
      result = upgradeMine(state, intent.mineId);
      break;
    case 'bossRetry':
      if (!state.bossRetryAvailable) result = { events: [], error: 'NOT_AVAILABLE' };
      else result = { events: retryBoss(state) };
      break;
    case 'setSpeed':
      state.combatSpeed = intent.mult;
      result = { events: [] };
      break;
    case 'ackOffline':
      state.offlineReport = null;
      result = { events: [] };
      break;
    case 'setAuto':
      state.autoProgress = intent.on;
      // retomar combate parado quando o jogador religa a progressão
      if (intent.on && state.battle.phase === 'idle' && state.battle.pendingFloor !== null) {
        const target = state.battle.pendingFloor;
        state.battle.pendingFloor = null;
        state.battle.phase = 'walking';
        state.battle.phaseMs = BALANCE.floor.walkTransitionMs;
        state.battle.pendingFloor = target;
      }
      result = { events: [] };
      break;
  }
  return result;
};

/** Marca presença e calcula produção offline elegível (uma vez por reconexão). */
export const touchSession = (state: PlayerState, nowMs: number): GameEvent[] =>
  applyOfflineProduction(state, nowMs);
