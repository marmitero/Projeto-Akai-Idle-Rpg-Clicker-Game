#!/usr/bin/env node
/* Sobe server + client em dev (server primeiro, pois o client faz proxy). */
import { spawn } from 'node:child_process';
import path from 'node:path';

const dataDir = process.env.AKAI_DATA_DIR ?? path.join(process.cwd(), 'apps/server/data');

const server = spawn('npm', ['run', 'dev', '-w', '@akai/server'], {
  stdio: 'inherit',
  env: { ...process.env, AKAI_DEBUG: process.env.AKAI_DEBUG ?? 'true', AKAI_DATA_DIR: dataDir },
});
const client = spawn('npm', ['run', 'dev', '-w', '@akai/client'], {
  stdio: 'inherit',
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    server.kill(sig);
    client.kill(sig);
    process.exit(0);
  });
}
