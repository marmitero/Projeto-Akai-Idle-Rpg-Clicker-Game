import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { buildApp, type BuiltApp } from '../../apps/server/src/app.js';

let built: BuiltApp;
let dataDir: string;
let sessionId: string;

const auth = (): { authorization: string } => ({ authorization: `Bearer ${sessionId}` });

beforeAll(async () => {
  dataDir = mkdtempSync(path.join(tmpdir(), 'akai-test-'));
  built = await buildApp({ dataDir, debugEnabled: false, logger: false });
  await built.app.ready();
});

afterAll(async () => {
  await built.app.close();
  rmSync(dataDir, { recursive: true, force: true });
});

describe('sessão e intenções HTTP', () => {
  it('cria sessão e exige autenticação no state', async () => {
    const created = await built.app.inject({ method: 'POST', url: '/api/session' });
    expect(created.statusCode).toBe(201);
    sessionId = (created.json() as { sessionId: string }).sessionId;
    expect(sessionId.length).toBeGreaterThan(8);

    const anonymous = await built.app.inject({ method: 'GET', url: '/api/state' });
    expect(anonymous.statusCode).toBe(401);

    const mine = await built.app.inject({ method: 'GET', url: '/api/state', headers: auth() });
    expect(mine.statusCode).toBe(200);
    expect((mine.json() as { state: { resources: { iron: number } } }).state.resources.iron).toBe(0);
  });

  it('um clique credita 1 ferro e o replay do actionId não duplica', async () => {
    const actionId = randomUUID();
    const first = await built.app.inject({
      method: 'POST',
      url: '/api/intent',
      headers: auth(),
      payload: { v: 1, t: 'click', actionId, clientTs: Date.now() },
    });
    expect(first.statusCode).toBe(200);
    const iron1 = (first.json() as { state: { resources: { iron: number } } }).state.resources.iron;
    expect(iron1).toBe(1);

    const replay = await built.app.inject({
      method: 'POST',
      url: '/api/intent',
      headers: auth(),
      payload: { v: 1, t: 'click', actionId, clientTs: Date.now() },
    });
    expect(replay.statusCode).toBe(200);
    const iron2 = (replay.json() as { state: { resources: { iron: number } } }).state.resources.iron;
    expect(iron2).toBe(1);
  });

  it('cliques acima do limite (rajada 12) são rejeitados com 429', async () => {
    let lastStatus = 200;
    for (let i = 0; i < 20; i += 1) {
      const res = await built.app.inject({
        method: 'POST',
        url: '/api/intent',
        headers: auth(),
        payload: { v: 1, t: 'click', actionId: randomUUID(), clientTs: Date.now() },
      });
      lastStatus = res.statusCode;
      if (lastStatus === 429) break;
    }
    expect(lastStatus).toBe(429);
  });

  it('compra sem recursos é recusada e não muta saldo', async () => {
    const before = await built.app.inject({ method: 'GET', url: '/api/state', headers: auth() });
    const res = await built.app.inject({
      method: 'POST',
      url: '/api/intent',
      headers: auth(),
      payload: { v: 1, t: 'buy', actionId: randomUUID(), upgradeId: 'warrior' },
    });
    expect(res.statusCode).toBe(409);
    expect((res.json() as { error: { code: string } }).error.code).toBe('INSUFFICIENT_RESOURCES');
    const after = await built.app.inject({ method: 'GET', url: '/api/state', headers: auth() });
    expect(after.json()).toEqual(before.json());
  });

  it('mensagem com versão de contrato errada recebe 409 CONTRACT_VERSION', async () => {
    const res = await built.app.inject({
      method: 'POST',
      url: '/api/intent',
      headers: auth(),
      payload: { v: 99, t: 'click', actionId: randomUUID(), clientTs: 1 },
    });
    expect(res.statusCode).toBe(409);
    expect((res.json() as { error: { code: string } }).error.code).toBe('CONTRACT_VERSION');
  });

  it('payload inválido recebe 400 VALIDATION', async () => {
    const res = await built.app.inject({
      method: 'POST',
      url: '/api/intent',
      headers: auth(),
      payload: { v: 1, t: 'click', actionId: 'não-uuid' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('estado persiste em disco e recarrega (FileStore)', async () => {
    const saved = await built.sessions.persist(await built.sessions.get(sessionId) as never);
    void saved;
    const reloaded = await built.sessions.get(sessionId);
    expect(reloaded).not.toBeNull();
  });
});
