import type { ResourceCostId } from '../config/balance.js';

export type Resources = Record<ResourceCostId | 'ruby', number>;

export interface EnemyState {
  id: string;
  defId: string;
  slot: number;
  hp: number;
  hpMax: number;
  atk: number;
  def: number;
  attackSpeedMs: number;
  cooldownMs: number;
  alive: boolean;
  rewarded: boolean;
  isBoss: boolean;
}

export type BattlePhase =
  | 'fighting'
  | 'walking'
  | 'boss_fighting'
  | 'boss_defeated'
  | 'idle';

export interface BattleState {
  floor: number;
  wave: number;
  enemies: EnemyState[];
  heroHp: number;
  heroCooldownMs: number;
  phase: BattlePhase;
  phaseMs: number;
  bossTimerMs: number | null;
  rngSeed: number;
  battleRev: number;
  pendingFloor: number | null;
}

export interface MineState {
  unlocked: boolean;
  level: number;
}

export interface OfflineReport {
  seconds: number;
  gains: Partial<Resources>;
}

export interface PlayerState {
  schemaVersion: 1;
  rev: number;
  resources: Resources;
  clickerLevel: number;
  warriorLevel: number;
  critLevel: number;
  mines: Record<string, MineState>;
  autoProgress: boolean;
  bossRetryAvailable: boolean;
  combatSpeed: 1 | 2;
  battle: BattleState;
  fractional: Record<string, number>;
  createdAtMs: number;
  lastSeenMs: number;
  offlineReport: OfflineReport | null;
}

export type GameEvent =
  | { t: 'hero_attack'; enemySlot: number; amount: number; crit: boolean; floor: number }
  | { t: 'enemy_attack'; amount: number; floor: number }
  | { t: 'enemy_death'; enemySlot: number; coins: number; floor: number }
  | { t: 'wave_clear'; wave: number; bonus: number; floor: number }
  | { t: 'floor_clear'; floor: number; bonus: number }
  | { t: 'boss_defeat'; floor: number; coins: number }
  | { t: 'boss_timeout'; floor: number; fallbackFloor: number }
  | { t: 'hero_down'; floor: number; boss: boolean }
  | { t: 'walk_start'; toFloor: number; wave: number }
  | { t: 'click'; iron: number }
  | { t: 'purchase'; kind: string; id: string; level: number }
  | { t: 'mine_unlock'; mineId: string }
  | { t: 'offline'; seconds: number; gains: Partial<Resources> };

export type IntentError =
  | 'INSUFFICIENT_RESOURCES'
  | 'PREREQUISITE_NOT_MET'
  | 'UNKNOWN_TARGET'
  | 'NOT_AVAILABLE'
  | 'ALREADY_UNLOCKED';

export interface IntentResult {
  events: GameEvent[];
  error?: IntentError;
}
