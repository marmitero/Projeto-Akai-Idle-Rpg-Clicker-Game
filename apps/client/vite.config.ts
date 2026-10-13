import { defineConfig, type Plugin } from 'vite';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const spritesRoot = path.resolve(here, '../../sprites');

/**
 * ADR-0004: serve os assets originais do repositório em /sprites/* sem copiar.
 * Somente leitura; caminhos fora da raiz de sprites são recusados.
 */
const serveSprites = (): Plugin => ({
  name: 'akai-serve-sprites',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url ?? '';
      if (!url.startsWith('/sprites/')) return next();
      const rel = decodeURIComponent(url.replace('/sprites/', '').split('?')[0] ?? '');
      const full = path.resolve(spritesRoot, rel);
      if (!full.startsWith(spritesRoot + path.sep) || !existsSync(full) || !statSync(full).isFile()) {
        res.statusCode = 404;
        res.end('asset não encontrado');
        return;
      }
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      createReadStream(full).pipe(res);
    });
  },
});

export default defineConfig({
  plugins: [serveSprites()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // o preview da Arena usa host dinâmico *.e2b.app; dev apenas
    allowedHosts: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8787', changeOrigin: false },
      '/ws': { target: 'ws://127.0.0.1:8787', ws: true },
      '/healthz': { target: 'http://127.0.0.1:8787' },
    },
  },
  build: {
    outDir: 'dist',
    target: 'es2022',
  },
});
