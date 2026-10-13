import { buildApp } from './app.js';

const port = Number(process.env.PORT ?? 8787);
const dataDir = process.env.AKAI_DATA_DIR ?? new URL('../data', import.meta.url).pathname;
const debugEnabled = process.env.AKAI_DEBUG === 'true';

const { app } = await buildApp({
  dataDir,
  debugEnabled,
  adminKey: process.env.AKAI_ADMIN_KEY,
  logger: true,
});

await app.listen({ port, host: '0.0.0.0' });
console.log(JSON.stringify({ msg: 'akai-server listening', port, debugEnabled }));
