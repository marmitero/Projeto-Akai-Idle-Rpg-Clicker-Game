import { z } from 'zod';

/**
 * Contratos v1 entre client e server (docs/API.md).
 * Intenções NUNCA carregam valores de recurso/dano/drop (master-prompt §6.1).
 */

export const CONTRACT_VERSION = 1;

const base = { v: z.literal(CONTRACT_VERSION) };

export const ClickIntent = z.object({
  ...base,
  t: z.literal('click'),
  actionId: z.string().uuid(),
  clientTs: z.number().int().nonnegative(),
});

export const BuyIntent = z.object({
  ...base,
  t: z.literal('buy'),
  actionId: z.string().uuid(),
  upgradeId: z.string().min(1).max(64),
});

export const UnlockMineIntent = z.object({
  ...base,
  t: z.literal('unlockMine'),
  actionId: z.string().uuid(),
  mineId: z.enum(['coal', 'gold', 'jade']),
});

export const UpgradeMineIntent = z.object({
  ...base,
  t: z.literal('upgradeMine'),
  actionId: z.string().uuid(),
  mineId: z.enum(['coal', 'gold', 'jade']),
});

export const BossRetryIntent = z.object({
  ...base,
  t: z.literal('bossRetry'),
  actionId: z.string().uuid(),
});

export const SetAutoIntent = z.object({
  ...base,
  t: z.literal('setAuto'),
  on: z.boolean(),
});

export const HelloMessage = z.object({
  ...base,
  t: z.literal('hello'),
  sessionId: z.string().min(8).max(128),
});

export const ClientMessage = z.discriminatedUnion('t', [
  HelloMessage,
  ClickIntent,
  BuyIntent,
  UnlockMineIntent,
  UpgradeMineIntent,
  BossRetryIntent,
  SetAutoIntent,
]);

export type ClientMessage = z.infer<typeof ClientMessage>;

export const StateSnapshotMessage = z.object({
  v: z.literal(CONTRACT_VERSION),
  t: z.literal('state'),
  rev: z.number().int().nonnegative(),
  state: z.unknown(),
  events: z.array(z.unknown()),
});

export const ErrorMessage = z.object({
  v: z.literal(CONTRACT_VERSION),
  t: z.literal('error'),
  code: z.string(),
  message: z.string(),
  actionId: z.string().optional(),
});

export const ErrorCode = {
  VALIDATION: 'VALIDATION',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  CONTRACT_VERSION: 'CONTRACT_VERSION',
  INSUFFICIENT_RESOURCES: 'INSUFFICIENT_RESOURCES',
  PREREQUISITE_NOT_MET: 'PREREQUISITE_NOT_MET',
  UNKNOWN_TARGET: 'UNKNOWN_TARGET',
  NOT_AVAILABLE: 'NOT_AVAILABLE',
  ALREADY_UNLOCKED: 'ALREADY_UNLOCKED',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
