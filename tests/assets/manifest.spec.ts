import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ALL_PATHS, COMPOSITIONS, SHEETS } from '../../apps/client/src/assets/manifest.js';

const ROOT = path.resolve(__dirname, '../..');

const pngSize = (file: string): { w: number; h: number } => {
  const buf = readFileSync(file);
  expect(buf.subarray(1, 4).toString('ascii')).toBe('PNG');
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
};

describe('integridade dos assets curados do MVP', () => {
  it('todos os caminhos curados existem no repositório', () => {
    const missing = ALL_PATHS.filter((p) => !existsSync(path.join(ROOT, p)));
    expect(missing).toEqual([]);
  });

  it('grades declaradas das sheets dividem as dimensões reais', () => {
    for (const sheet of SHEETS) {
      const { w, h } = pngSize(path.join(ROOT, sheet.path));
      expect(w % sheet.frameWidth, sheet.key).toBe(0);
      expect(h % sheet.frameHeight, sheet.key).toBe(0);
    }
  });

  it('camadas de composição são 800x448 (ou 720x448 p/ orelhas) e alinhadas', () => {
    for (const comp of COMPOSITIONS) {
      for (const part of comp.parts) {
        const { w, h } = pngSize(path.join(ROOT, part.path));
        expect(h, part.path).toBe(448);
        expect([800, 720], part.path).toContain(w);
        expect(w % 80, part.path).toBe(0);
      }
    }
  });

  it('ícones de recursos e nós de mineração têm os tamanhos esperados', () => {
    expect(pngSize(path.join(ROOT, 'sprites/Materials/Icon31_15.png'))).toEqual({ w: 32, h: 32 });
    expect(pngSize(path.join(ROOT, 'sprites/Materials/Icon31_13.png'))).toEqual({ w: 32, h: 32 });
    expect(pngSize(path.join(ROOT, 'sprites/Materials/Icon31_35.png'))).toEqual({ w: 32, h: 32 });
    expect(pngSize(path.join(ROOT, 'sprites/Materials/Icon31_40.png'))).toEqual({ w: 32, h: 32 });
    expect(pngSize(path.join(ROOT, 'sprites/Mine/ironNode.png'))).toEqual({ w: 16, h: 16 });
  });
});
