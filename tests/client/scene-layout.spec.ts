import { describe, expect, it, beforeEach } from 'vitest';
import {
  clearLayout,
  cloneLayout,
  cssColor,
  defaultLayout,
  loadLayout,
  parseLayout,
  saveLayout,
  STORAGE_KEY,
} from '../../apps/client/src/game/sceneLayout.js';

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
});

describe('sceneLayout (Tile Editor)', () => {
  it('default reproduz o cenário procedural (arena e mina)', () => {
    const l = defaultLayout();
    expect(l.version).toBe(1);
    expect(l.arena.bg.map((b) => b.key)).toEqual(['bg_l1', 'bg_castle', 'bg_l2', 'bg_l3', 'bg_l4']);
    expect(l.arena.bg.map((b) => b.factor)).toEqual([0.1, 0.2, 0.32, 0.5, 0.72]);
    expect(l.arena.ground).toEqual({ cells: [], cropH: 40, fill: '#241a12' });
    expect(l.mine.ceiling).toEqual({ cells: [], cropH: 26 });
    expect(l.mine.posts).toBe(true);
    expect(l.mine.props.map((p) => p.id)).toEqual(['vein-coal', 'vein-gold', 'vein-jade']);
  });

  it('round-trip JSON -> parse preserva tudo', () => {
    const l = defaultLayout();
    l.arena.ground.cells = [0, null, 6, 12];
    l.arena.sky = '#123456';
    l.mine.props.push({
      id: 'x1',
      src: { kind: 'frame', frame: 3 },
      fx: 0.5,
      dy: -12,
      scale: 2,
      flipX: true,
      flipY: false,
      depth: 7,
      alpha: 0.5,
    });
    const parsed = parseLayout(JSON.parse(JSON.stringify(l)) as unknown);
    expect(parsed).toEqual(l);
  });

  it('recusa payloads inválidos', () => {
    const bad: unknown[] = [
      null,
      42,
      { version: 2, arena: {}, mine: {} },
      { version: 1, arena: null, mine: null },
      { version: 1, arena: { sky: 1 }, mine: defaultLayout().mine },
      {
        version: 1,
        arena: { ...defaultLayout().arena, ground: { cells: ['x'], cropH: 40, fill: '#fff' } },
        mine: defaultLayout().mine,
      },
      {
        version: 1,
        arena: { ...defaultLayout().arena, props: [{ id: 'a', src: { kind: 'nope' } }] },
        mine: defaultLayout().mine,
      },
      {
        version: 1,
        arena: { ...defaultLayout().arena, bg: [{ key: 'bg_l1', visible: 1, factor: 0.1, anchor: 'full', dy: 0 }] },
        mine: defaultLayout().mine,
      },
    ];
    for (const raw of bad) expect(parseLayout(raw)).toBeNull();
  });

  it('tolera campos extras desconhecidos (forward-compat)', () => {
    const l = defaultLayout() as Record<string, unknown>;
    l.extra = 1;
    expect(parseLayout(l)?.version).toBe(1);
  });

  it('save/load/clear usam localStorage com a chave versionada', () => {
    expect(loadLayout()).toBeNull();
    const l = defaultLayout();
    l.arena.sky = '#00ff00';
    saveLayout(l);
    expect(store.has(STORAGE_KEY)).toBe(true);
    expect(loadLayout()?.arena.sky).toBe('#00ff00');
    clearLayout();
    expect(loadLayout()).toBeNull();
  });

  it('loadLayout ignora storage corrompido', () => {
    store.set(STORAGE_KEY, '{não é json');
    expect(loadLayout()).toBeNull();
    store.set(STORAGE_KEY, JSON.stringify({ version: 9 }));
    expect(loadLayout()).toBeNull();
  });

  it('cloneLayout isola mutações', () => {
    const l = defaultLayout();
    const c = cloneLayout(l);
    c.arena.ground.cells.push(7);
    c.mine.props[0]!.fx = 0.99;
    expect(l.arena.ground.cells).toEqual([]);
    expect(l.mine.props[0]!.fx).toBe(0.18);
  });

  it('cssColor converte e tem fallback', () => {
    expect(cssColor('#9fd0dc', 0)).toBe(0x9fd0dc);
    expect(cssColor('nada', 0x123456)).toBe(0x123456);
    expect(cssColor('#12345', 7)).toBe(7);
  });
});
