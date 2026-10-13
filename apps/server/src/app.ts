import Fastify, { type FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import {
  ClientMessage,
  CONTRACT_VERSION,
  type ClientMessage as ClientMessageType,
  type GameEvent,
  type Intent,
} from '@akai/shared';
import { FileStore } from './persistence/FileStore.js';
import { SessionManager, type Session } from './sessions.js';

export interface AppOptions {
  dataDir: string;
  debugEnabled: boolean;
  adminKey?: string;
  logger?: boolean;
}

export interface BuiltApp {
  app: FastifyInstance;
  sessions: SessionManager;
}

const intentFromMessage = (msg: ClientMessageType): Intent | null => {
  switch (msg.t) {
    case 'click': return { t: 'click' };
    case 'buy': return { t: 'buy', upgradeId: msg.upgradeId };
    case 'unlockMine': return { t: 'unlockMine', mineId: msg.mineId };
    case 'upgradeMine': return { t: 'upgradeMine', mineId: msg.mineId };
    case 'bossRetry': return { t: 'bossRetry' };
    case 'setAuto': return { t: 'setAuto', on: msg.on };
    case 'setSpeed': return { t: 'setSpeed', mult: msg.mult };
    case 'ackOffline': return { t: 'ackOffline' };
    default: return null;
  }
};

export const buildApp = async (opts: AppOptions): Promise<BuiltApp> => {
  const app = Fastify({ logger: opts.logger ?? false });
  await app.register(websocket);

  const sessions = new SessionManager(new FileStore(opts.dataDir), (id, session, events) => {
    const payload = JSON.stringify({ v: CONTRACT_VERSION, t: 'state', rev: session.state.rev, state: session.state, events });
    for (const socket of session.sockets as Set<{ send: (d: string) => void }>) {
      try {
        socket.send(payload);
      } catch {
        session.sockets.delete(socket);
      }
    }
    void id;
  });
  sessions.start();

  app.get('/healthz', async () => ({ ok: true, tickMs: 250 }));

  app.post('/api/session', async (_req, reply) => {
    const session = await sessions.create();
    reply.code(201);
    return { sessionId: session.id, state: session.state, rev: session.state.rev };
  });

  const authSession = async (req: { headers: Record<string, string | string[] | undefined> }): Promise<Session | null> => {
    const header = req.headers.authorization;
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null;
    return sessions.get(header.slice('Bearer '.length));
  };

  app.get('/api/state', async (req, reply) => {
    const session = await authSession(req);
    if (!session) return reply.code(401).send({ error: { code: 'UNAUTHENTICATED', message: 'Bearer sessionId obrigatório' } });
    return { rev: session.state.rev, state: session.state };
  });

  app.post('/api/intent', async (req, reply) => {
    const session = await authSession(req);
    if (!session) return reply.code(401).send({ error: { code: 'UNAUTHENTICATED', message: 'Bearer sessionId obrigatório' } });
    const parsed = ClientMessage.safeParse(req.body);
    if (!parsed.success) {
      const isVersion = req.body && typeof req.body === 'object' && (req.body as { v?: unknown }).v !== CONTRACT_VERSION;
      return reply.code(isVersion ? 409 : 400).send({
        error: { code: isVersion ? 'CONTRACT_VERSION' : 'VALIDATION', message: parsed.error.message },
      });
    }
    if (parsed.data.t === 'hello') {
      return { rev: session.state.rev, state: session.state, events: [] as GameEvent[] };
    }
    const intent = intentFromMessage(parsed.data);
    if (!intent) return reply.code(400).send({ error: { code: 'VALIDATION', message: 'intent desconhecida' } });
    const actionId = 'actionId' in parsed.data ? parsed.data.actionId : undefined;
    const outcome = sessions.applyIntent(session, intent, actionId);
    if (outcome.rateLimited) {
      return reply.code(429).send({
        error: { code: 'RATE_LIMITED', message: 'limite de cliques excedido', retryAfterMs: outcome.rateLimited.retryAfterMs },
        actionId,
      });
    }
    if (outcome.error) {
      return reply.code(409).send({ error: { code: outcome.error, message: 'ação recusada' }, actionId });
    }
    await sessions.persist(session);
    return { rev: session.state.rev, state: session.state, events: outcome.events, actionId };
  });

  const assertDebug = (req: { headers: Record<string, string | string[] | undefined> }, reply: { code: (c: number) => { send: (b: unknown) => unknown } }): boolean => {
    if (!opts.debugEnabled) {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'rota inexistente neste ambiente' } });
      return false;
    }
    const key = req.headers['x-akai-admin'];
    if (!opts.adminKey || key !== opts.adminKey) {
      reply.code(403).send({ error: { code: 'FORBIDDEN', message: 'admin key inválida' } });
      return false;
    }
    return true;
  };

  app.post('/api/debug/grant', async (req, reply) => {
    if (!assertDebug(req, reply)) return;
    const session = await authSession(req);
    if (!session) return reply.code(401).send({ error: { code: 'UNAUTHENTICATED', message: 'sessão inválida' } });
    const body = req.body as { resources?: Partial<Record<string, number>> };
    for (const [key, value] of Object.entries(body.resources ?? {})) {
      if (key in session.state.resources && typeof value === 'number' && value >= 0) {
        const bag = session.state.resources as Record<string, number>;
        bag[key] = (bag[key] ?? 0) + value;
      }
    }
    session.state.rev += 1;
    await sessions.persist(session);
    return { ok: true, rev: session.state.rev };
  });

  app.post('/api/debug/floor', async (req, reply) => {
    if (!assertDebug(req, reply)) return;
    const session = await authSession(req);
    if (!session) return reply.code(401).send({ error: { code: 'UNAUTHENTICATED', message: 'sessão inválida' } });
    const body = req.body as { floor?: number };
    if (typeof body.floor === 'number' && body.floor >= 1 && body.floor <= 1000) {
      const { createBattle } = await import('@akai/shared');
      session.state.battle = createBattle(Math.floor(body.floor), session.state.battle.rngSeed);
      session.state.bossRetryAvailable = false;
      session.state.rev += 1;
      await sessions.persist(session);
    }
    return { ok: true, floor: session.state.battle.floor };
  });

  app.register(async (instance) => {
    instance.get('/ws', { websocket: true }, (socket, req) => {
      let bound: Session | null = null;
      socket.on('message', async (raw: Buffer) => {
        let data: unknown;
        try {
          data = JSON.parse(raw.toString('utf8'));
        } catch {
          socket.send(JSON.stringify({ v: CONTRACT_VERSION, t: 'error', code: 'VALIDATION', message: 'json inválido' }));
          return;
        }
        const parsed = ClientMessage.safeParse(data);
        if (!parsed.success) {
          socket.send(JSON.stringify({ v: CONTRACT_VERSION, t: 'error', code: 'VALIDATION', message: parsed.error.message }));
          return;
        }
        const msg = parsed.data;
        if (msg.t === 'hello') {
          bound = await sessions.get(msg.sessionId);
          if (!bound) {
            socket.send(JSON.stringify({ v: CONTRACT_VERSION, t: 'error', code: 'UNAUTHENTICATED', message: 'sessão inexistente' }));
            return;
          }
          bound.sockets.add(socket);
          socket.send(JSON.stringify({ v: CONTRACT_VERSION, t: 'state', rev: bound.state.rev, state: bound.state, events: [] }));
          return;
        }
        if (!bound) {
          socket.send(JSON.stringify({ v: CONTRACT_VERSION, t: 'error', code: 'UNAUTHENTICATED', message: 'envie hello antes' }));
          return;
        }
        const intent = intentFromMessage(msg);
        if (!intent) return;
        const actionId = 'actionId' in msg ? msg.actionId : undefined;
        const outcome = sessions.applyIntent(bound, intent, actionId);
        if (outcome.rateLimited) {
          socket.send(JSON.stringify({ v: CONTRACT_VERSION, t: 'error', code: 'RATE_LIMITED', message: 'limite de cliques', actionId, retryAfterMs: outcome.rateLimited.retryAfterMs }));
          return;
        }
        if (outcome.error) {
          socket.send(JSON.stringify({ v: CONTRACT_VERSION, t: 'error', code: outcome.error, message: 'ação recusada', actionId }));
          return;
        }
        socket.send(JSON.stringify({ v: CONTRACT_VERSION, t: 'state', rev: bound.state.rev, state: bound.state, events: outcome.events }));
        void sessions.persist(bound);
        void req;
      });
      socket.on('close', () => {
        bound?.sockets.delete(socket);
      });
    });
  });

  app.addHook('onClose', async () => {
    sessions.stop();
  });

  return { app, sessions };
};
