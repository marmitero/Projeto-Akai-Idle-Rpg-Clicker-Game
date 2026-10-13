import { randomBytes } from 'node:crypto';
import {
  BALANCE,
  applyIntent,
  createInitialState,
  tickWorld,
  touchSession,
  type GameEvent,
  type Intent,
  type PlayerState,
} from '@akai/shared';
import type { PersistenceStore } from './persistence/FileStore.js';

export const TICK_MS = 250;

interface TokenBucket {
  tokens: number;
  updatedAt: number;
}

export interface Session {
  id: string;
  state: PlayerState;
  bucket: TokenBucket;
  actionResults: Map<string, { events: GameEvent[]; error?: string }>;
  dirty: boolean;
  lastSaveMs: number;
  sockets: Set<unknown>;
}

export interface IntentOutcome {
  events: GameEvent[];
  error?: string;
  rateLimited?: { retryAfterMs: number };
}

/**
 * SessionManager: autoridade de estado no modo online (ADR-0002).
 * Tick fixo de 250 ms por sessão; rate limit por token bucket; idempotência
 * por actionId com janela de 10 minutos.
 */
export class SessionManager {
  private sessions = new Map<string, Session>();
  private timer: NodeJS.Timeout | null = null;
  readonly actionWindowMs = 10 * 60 * 1000;

  constructor(
    private readonly store: PersistenceStore,
    private readonly onSnapshot: (sessionId: string, session: Session, events: GameEvent[]) => void,
    private readonly now: () => number = Date.now,
  ) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.tickAll(), TICK_MS);
    this.timer.unref?.();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async create(): Promise<Session> {
    const id = randomBytes(18).toString('base64url');
    const state = createInitialState(this.now());
    const session: Session = {
      id,
      state,
      bucket: { tokens: BALANCE.clickRateLimit.burst, updatedAt: this.now() },
      actionResults: new Map(),
      dirty: true,
      lastSaveMs: 0,
      sockets: new Set(),
    };
    this.sessions.set(id, session);
    await this.persist(session);
    return session;
  }

  async get(sessionId: string): Promise<Session | null> {
    const existing = this.sessions.get(sessionId);
    if (existing) return existing;
    const loaded = await this.store.load(sessionId);
    if (!loaded) return null;
    const session: Session = {
      id: sessionId,
      state: loaded as PlayerState,
      bucket: { tokens: BALANCE.clickRateLimit.burst, updatedAt: this.now() },
      actionResults: new Map(),
      dirty: false,
      lastSaveMs: this.now(),
      sockets: new Set(),
    };
    const events = touchSession(session.state, this.now());
    if (events.length) {
      session.state.rev += 1;
      session.dirty = true;
    }
    this.sessions.set(sessionId, session);
    return session;
  }

  /** Token bucket: 10/s sustentados, rajada 12 (SECURITY.md §3). */
  private consumeClickToken(session: Session): { retryAfterMs: number } | null {
    const now = this.now();
    const elapsed = (now - session.bucket.updatedAt) / 1000;
    session.bucket.updatedAt = now;
    session.bucket.tokens = Math.min(
      BALANCE.clickRateLimit.burst,
      session.bucket.tokens + elapsed * BALANCE.clickRateLimit.sustainedPerSecond,
    );
    if (session.bucket.tokens < 1) {
      return { retryAfterMs: Math.ceil(((1 - session.bucket.tokens) / BALANCE.clickRateLimit.sustainedPerSecond) * 1000) };
    }
    session.bucket.tokens -= 1;
    return null;
  }

  applyIntent(session: Session, intent: Intent, actionId?: string): IntentOutcome {
    if (actionId) {
      const cached = session.actionResults.get(actionId);
      if (cached) return { events: cached.events, error: cached.error };
    }
    if (intent.t === 'click') {
      const limited = this.consumeClickToken(session);
      if (limited) return { events: [], error: 'RATE_LIMITED', rateLimited: limited };
    }
    const before = session.state.rev;
    const result = applyIntent(session.state, intent);
    if (!result.error) {
      session.state.rev = before + 1;
      session.dirty = true;
    }
    if (actionId) {
      session.actionResults.set(actionId, { events: result.events, error: result.error });
      if (session.actionResults.size > 512) {
        const oldest = session.actionResults.keys().next().value;
        if (oldest) session.actionResults.delete(oldest);
      }
    }
    return { events: result.events, error: result.error };
  }

  tickAll(): void {
    const now = this.now();
    for (const session of this.sessions.values()) {
      const events = tickWorld(session.state, TICK_MS);
      const changed = events.length > 0;
      if (changed) {
        session.state.rev += 1;
        session.dirty = true;
      }
      session.state.lastSeenMs = now;
      if (session.dirty && now - session.lastSaveMs > 2000) {
        void this.persist(session);
      }
      if (changed && session.sockets.size > 0) {
        this.onSnapshot(session.id, session, events);
      }
    }
  }

  async persist(session: Session): Promise<void> {
    session.lastSaveMs = this.now();
    session.dirty = false;
    await this.store.save(session.id, session.state);
  }
}
