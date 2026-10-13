import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@akai/shared': path.resolve(here, 'packages/shared/src/index.ts'),
    },
  },
  test: {
    include: ['tests/**/*.spec.ts'],
    environment: 'node',
    testTimeout: 20000,
  },
});
