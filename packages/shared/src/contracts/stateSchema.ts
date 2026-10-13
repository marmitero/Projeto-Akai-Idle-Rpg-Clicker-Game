import { z } from 'zod';

/** Schema de persistência (validação de carga; quarentena se inválido). */

const num = z.number().nonnegative();

export const PlayerStateSchema = z.object({
  schemaVersion: z.literal(1),
  rev: z.number().int().nonnegative(),
  resources: z.object({
    coins: num, iron: num, coal: num, gold: num, jade: num, ruby: num,
  }),
  clickerLevel: z.number().int().positive(),
  warriorLevel: z.number().int().positive(),
  critLevel: z.number().int().nonnegative(),
  mines: z.record(z.object({ unlocked: z.boolean(), level: z.number().int().nonnegative() })),
  autoProgress: z.boolean(),
  bossRetryAvailable: z.boolean(),
  combatSpeed: z.union([z.literal(1), z.literal(2)]),
  battle: z.object({
    floor: z.number().int().positive(),
    wave: z.number().int().nonnegative(),
    enemies: z.array(z.object({
      id: z.string(),
      defId: z.string(),
      slot: z.number().int().nonnegative(),
      hp: z.number(),
      hpMax: z.number().positive(),
      atk: z.number().nonnegative(),
      def: z.number().nonnegative(),
      attackSpeedMs: z.number().positive(),
      cooldownMs: z.number(),
      alive: z.boolean(),
      rewarded: z.boolean(),
      isBoss: z.boolean(),
    })),
    heroHp: z.number(),
    heroCooldownMs: z.number(),
    phase: z.enum(['fighting', 'walking', 'boss_fighting', 'boss_defeated', 'idle']),
    phaseMs: z.number(),
    bossTimerMs: z.number().nullable(),
    rngSeed: z.number().int(),
    battleRev: z.number().int().nonnegative(),
    pendingFloor: z.number().int().nullable(),
  }),
  fractional: z.record(z.number().nonnegative()),
  createdAtMs: z.number(),
  lastSeenMs: z.number(),
  offlineReport: z.object({
    seconds: z.number().nonnegative(),
    gains: z.record(z.number().nonnegative()),
  }).nullable(),
});

export type PersistedPlayerState = z.infer<typeof PlayerStateSchema>;
