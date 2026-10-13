import {
  BALANCE,
  applyIntent,
  createInitialState,
  tickWorld,
  touchSession,
  type GameEvent,
  type PlayerState,
} from '@akai/shared';
import type { Driver, DriverHandlers, UiIntent } from './driver.js';

const SAVE_KEY = 'akai.save.v1';
const STEP_MS = 250;

/**
 * Modo local (master-prompt §27.1): executa o domínio compartilhado no
 * navegador com persistência em localStorage. Rotulado na UI como dados de
 * teste; NÃO é autoridade confiável (SECURITY.md §1).
 */
export class LocalDriver implements Driver {
  readonly mode = 'local' as const;
  private state: PlayerState | null = null;
  private handlers: DriverHandlers | null = null;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private lastSave = 0;
  private bucket: { tokens: number; at: number } = { tokens: BALANCE.clickRateLimit.burst, at: Date.now() };

  async start(handlers: DriverHandlers): Promise<void> {
    this.handlers = handlers;
    const now = Date.now();
    let loaded: PlayerState | null = null;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PlayerState;
        if (parsed.schemaVersion === 1 && parsed.resources && parsed.battle) {
          // migração defensiva de saves anteriores à Fase 3.5
          if (parsed.combatSpeed !== 1 && parsed.combatSpeed !== 2) parsed.combatSpeed = 1;
          loaded = parsed;
        }
      }
    } catch {
      loaded = null;
    }
    this.state = loaded ?? createInitialState(now);
    const events = touchSession(this.state, now);
    if (events.length) handlers.onEvents(events);
    handlers.onState(this.state);
    handlers.onMode('local', 'modo local: dados de teste no navegador');
    this.last = performance.now();
    const loop = (t: number): void => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(1000, t - this.last);
      this.last = t;
      this.acc += dt;
      let stepped = false;
      while (this.acc >= STEP_MS) {
        this.acc -= STEP_MS;
        stepped = true;
        const evs = this.step(STEP_MS);
        if (evs.length) this.handlers?.onEvents(evs);
      }
      if (stepped && this.state) this.handlers?.onState(this.state);
      if (this.state && now0(this.lastSave) > 2000) {
        this.lastSave = Date.now();
        this.persist();
      }
    };
    this.raf = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  private onVisibility = (): void => {
    if (document.visibilityState === 'hidden') this.persist();
  };

  private step(dt: number): GameEvent[] {
    if (!this.state) return [];
    return tickWorld(this.state, dt);
  }

  intent(intent: UiIntent): void {
    if (!this.state) return;
    if (intent.t === 'click') {
      const now = Date.now();
      const elapsed = (now - this.bucket.at) / 1000;
      this.bucket.at = now;
      this.bucket.tokens = Math.min(BALANCE.clickRateLimit.burst, this.bucket.tokens + elapsed * BALANCE.clickRateLimit.sustainedPerSecond);
      if (this.bucket.tokens < 1) {
        this.handlers?.onError('RATE_LIMITED', 'cliques rápidos demais');
        return;
      }
      this.bucket.tokens -= 1;
    }
    const result = applyIntent(this.state, intent);
    if (result.error) {
      this.handlers?.onError(result.error, 'ação recusada');
      return;
    }
    this.handlers?.onEvents(result.events);
    this.handlers?.onState(this.state);
  }

  private persist(): void {
    if (!this.state) return;
    this.state.lastSeenMs = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
    } catch {
      // cota cheia: mantém em memória e registra
      this.handlers?.onError('STORAGE', 'não foi possível salvar localmente');
    }
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.persist();
  }
}

const now0 = (lastSave: number): number => Date.now() - lastSave;
