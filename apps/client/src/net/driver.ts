import type { GameEvent, PlayerState } from '@akai/shared';

export type UiIntent =
  | { t: 'click' }
  | { t: 'buy'; upgradeId: string }
  | { t: 'unlockMine'; mineId: 'coal' | 'gold' | 'jade' }
  | { t: 'upgradeMine'; mineId: 'coal' | 'gold' | 'jade' }
  | { t: 'bossRetry' }
  | { t: 'setAuto'; on: boolean };

export interface DriverHandlers {
  onState: (state: PlayerState) => void;
  onEvents: (events: GameEvent[]) => void;
  onMode: (mode: 'local' | 'online', note?: string) => void;
  onError: (code: string, message: string) => void;
}

export interface Driver {
  readonly mode: 'local' | 'online';
  start(handlers: DriverHandlers): Promise<void>;
  intent(intent: UiIntent): void;
  stop(): void;
}

export const newActionId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
