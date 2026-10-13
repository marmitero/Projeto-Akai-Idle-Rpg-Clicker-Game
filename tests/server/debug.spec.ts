import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildApp, type BuiltApp } from '../../apps/server/src/app.js';

let built: BuiltApp;
let dataDir: string;
let sessionId: string;
const ADMIN = 'chave-de-teste';

beforeAll(async () => {
  dataDir = mkdtempSync(path.join(tmpdir(), 'akai-debug-'));
  built = await buildApp({ dataDir, debugEnabled: true, adminKey: ADMIN, logger: false });
  await built.app.ready();
  const created = await built.app.inject({ method: 'POST', url: '/api/session' });
  sessionId = (created.json() as { sessionId: string }).sessionId;
});

afterAll(async () => {
  await built.app.close();
  rmSync(dataDir, { recursive: true, force: true });
});

describe('rotas de debug', () => {
  it('sem header admin é 403', async () => {
    const res = await built.app.inject({
      method: 'POST',
      url: '/api/debug/grant',
      headers: { authorization: `Bearer ${sessionId}` },
      payload: { resources: { iron: 100 } },
    });
    expect(res.statusCode).toBe(403);
  });

  it('com header admin concede recurso de teste', async () => {
    const res = await built.app.inject({
      method: 'POST',
      url: '/api/debug/grant',
      headers: { authorization: `Bearer ${sessionId}`, 'x-akai-admin': ADMIN },
      payload: { resources: { iron: 100 } },
    });
    expect(res.statusCode).toBe(200);
    const state = await built.app.inject({
      method: 'GET',
      url: '/api/state',
      headers: { authorization: `Bearer ${sessionId}` },
    });
    expect((state.json() as { state: { resources: { iron: number } } }).state.resources.iron).toBe(100);
  });

  it('com debug desabilitado a rota some (404)', async () => {
    const dir2 = mkdtempSync(path.join(tmpdir(), 'akai-nodebug-'));
    const app2 = await buildApp({ dataDir: dir2, debugEnabled: false, logger: false });
    await app2.app.ready();
    const res = await app2.app.inject({ method: 'POST', url: '/api/debug/grant', payload: {} });
    expect(res.statusCode).toBe(404);
    await app2.app.close();
    rmSync(dir2, { recursive: true, force: true });
  });
});
