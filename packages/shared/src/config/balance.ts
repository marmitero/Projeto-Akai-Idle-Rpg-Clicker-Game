/**
 * Balanceamento PROVISÓRIO do Projeto Akai.
 * ÚNICA fonte de verdade executável dos números de jogo (docs/BALANCE.md).
 * Proibido duplicar estes valores em client/server/UI.
 */

export interface MineDef {
  id: 'coal' | 'gold' | 'jade';
  /** recursos exigidos para desbloquear */
  unlockCost: Partial<Record<ResourceCostId, number>>;
  /** requisito de outra mina: [mineId, nivel] */
  requiresMine?: readonly [mineId: string, level: number];
  /** produção por segundo por nível */
  ratePerLevel: number;
  produces: ResourceCostId;
  upgradeCost: { base: number; growth: number; resource: ResourceCostId; baseCoins: number; coinGrowth: number };
}

export type ResourceCostId = 'coins' | 'iron' | 'coal' | 'gold' | 'jade';

export const BALANCE = {
  schemaVersion: 1,

  hero: {
    hpBase: 60,
    hpPerLevel: 12,
    atkBase: 6,
    atkPerLevel: 2,
    def: 1,
    attackSpeedMs: 1000,
    critChanceBase: 0.05,
    critChancePerLevel: 0.01,
    critChanceMax: 0.3,
    critMult: 1.5,
    warriorCost: { base: 25, growth: 1.35, resource: 'iron' as ResourceCostId },
    critCost: { base: 100, growth: 1.5, resource: 'coins' as ResourceCostId },
  },

  clicker: {
    ironPerClickBase: 1,
    ironPerClickPerLevel: 1,
    cost: { base: 15, growth: 1.4, resource: 'coins' as ResourceCostId },
  },

  clickRateLimit: { sustainedPerSecond: 10, burst: 12 },

  enemy: {
    hp: { base: 10, growth: 1.12 },
    atk: { base: 2.2, growth: 1.09 },
    coins: { base: 3, growth: 1.11 },
    attackSpeedMs: 1200,
    def: 0,
  },

  floor: {
    waves: 3,
    enemiesPerWave: 3,
    walkTransitionMs: 3000,
    bossEvery: 10,
  },

  boss: {
    hpMult: 14,
    atkMult: 1.6,
    attackSpeedMs: 1400,
    timerMs: 60_000,
    coinsMult: 25,
    dropChance: (floor: number): number => Math.min(0.75, 0.25 + floor / 400),
  },

  rewards: {
    waveBonusMult: 1.5,
    floorBonusMult: 3,
  },

  mines: {
    coal: {
      id: 'coal',
      unlockCost: { iron: 100, coins: 50 },
      ratePerLevel: 0.4,
      produces: 'coal',
      upgradeCost: { base: 60, growth: 1.25, resource: 'iron', baseCoins: 30, coinGrowth: 1.25 },
    },
    gold: {
      id: 'gold',
      unlockCost: { iron: 2500, coal: 400, coins: 1200 },
      requiresMine: ['coal', 50] as const,
      ratePerLevel: 0.15,
      produces: 'gold',
      upgradeCost: { base: 200, growth: 1.25, resource: 'iron', baseCoins: 120, coinGrowth: 1.25 },
    },
    jade: {
      id: 'jade',
      unlockCost: { iron: 20000, gold: 300, coal: 1500, coins: 9000 },
      requiresMine: ['gold', 25] as const,
      ratePerLevel: 0.05,
      produces: 'jade',
      upgradeCost: { base: 400, growth: 1.25, resource: 'iron', baseCoins: 400, coinGrowth: 1.25 },
    },
  } as Record<'coal' | 'gold' | 'jade', MineDef>,

  offline: {
    capSeconds: 8 * 3600,
    efficiency: 0.6,
  },

  damageVariance: { min: 0.9, max: 1.1 },
} as const;

export type BalanceConfig = typeof BALANCE;

export const curveCost = (base: number, growth: number, level: number): number =>
  Math.ceil(base * Math.pow(growth, level - 1));

export const enemyHp = (floor: number): number =>
  Math.ceil(BALANCE.enemy.hp.base * Math.pow(BALANCE.enemy.hp.growth, floor - 1));

export const enemyAtk = (floor: number): number =>
  Math.ceil(BALANCE.enemy.atk.base * Math.pow(BALANCE.enemy.atk.growth, floor - 1));

export const enemyCoins = (floor: number): number =>
  Math.ceil(BALANCE.enemy.coins.base * Math.pow(BALANCE.enemy.coins.growth, floor - 1));

export const isBossFloor = (floor: number): boolean =>
  floor % BALANCE.floor.bossEvery === 0;

export const heroHpMax = (warriorLevel: number): number =>
  BALANCE.hero.hpBase + BALANCE.hero.hpPerLevel * (warriorLevel - 1);

export const heroAtk = (warriorLevel: number): number =>
  BALANCE.hero.atkBase + BALANCE.hero.atkPerLevel * (warriorLevel - 1);

export const heroCritChance = (critLevel: number): number =>
  Math.min(
    BALANCE.hero.critChanceMax,
    BALANCE.hero.critChanceBase + BALANCE.hero.critChancePerLevel * critLevel,
  );

export const ironPerClick = (clickerLevel: number): number =>
  BALANCE.clicker.ironPerClickBase + BALANCE.clicker.ironPerClickPerLevel * (clickerLevel - 1);
