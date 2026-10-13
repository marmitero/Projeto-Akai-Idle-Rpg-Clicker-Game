/**
 * Layout de cenário editável — contrato entre o Tile Editor (`#/editor`) e as
 * views de jogo (CombatView/MiningView/EditorScene).
 *
 * O layout é 100% derivado de assets REAIS já auditados (manifest.ts): tiles
 * do tileset 96x96, camadas de fundo do pack GandalfHardcore e sprites de
 * mina/materiais. Nada de placeholders: o editor apenas rearranja o que o
 * repositório já contém.
 *
 * Persistência: localStorage (`akai.scene-layout.v1`) + export/import JSON.
 * Ausência de layout => `defaultLayout()`, que reproduz EXATAMENTE o cenário
 * procedural anterior (mesmas cores, camadas, ancoragens e veios).
 */

export type PropSrc =
  | { kind: 'image'; key: string }
  | { kind: 'frame'; frame: number };

export interface PropLayout {
  id: string;
  src: PropSrc;
  /** posição horizontal como fração da largura da zona (0..1) */
  fx: number;
  /** deslocamento vertical em px a partir do topo do chão (negativo = acima) */
  dy: number;
  scale: number;
  flipX: boolean;
  flipY: boolean;
  depth: number;
  alpha: number;
}

export interface BgLayerLayout {
  key: string;
  visible: boolean;
  /** fator de parallax (0 = fixo, 1 = acompanha a câmera) */
  factor: number;
  /** 'full' ancora o canvas 1024x346 inteiro ao chão; 'veg' ancora a linha de vegetação */
  anchor: 'full' | 'veg';
  dy: number;
}

export interface GroundLayout {
  /**
   * Frame do tileset 96x96 por coluna (índice = coluna a partir da esquerda).
   * `null` = buraco (sem tile e sem preenchimento); coluna ausente = frame
   * padrão da zona (arena 0, mina 6).
   */
  cells: (number | null)[];
  cropH: number;
  fill: string;
}

export interface CeilingLayout {
  cells: (number | null)[];
  cropH: number;
}

export interface ZoneLayout {
  /** cor do céu (arena) / tom superior da caverna (mina) */
  sky: string;
  /** segundo tom da caverna (mina); null = sem segunda faixa */
  sky2: string | null;
  bg: BgLayerLayout[];
  ground: GroundLayout;
  ceiling: CeilingLayout | null;
  posts: boolean;
  props: PropLayout[];
}

export interface SceneLayout {
  version: 1;
  arena: ZoneLayout;
  mine: ZoneLayout;
}

export const STORAGE_KEY = 'akai.scene-layout.v1';

/** Linha de vegetação do canvas 1024x346 (validada por mockup em 2026-10-13). */
export const VEG_ANCHOR_Y = 175;

export const BG_LAYER_DEFAULTS: BgLayerLayout[] = [
  { key: 'bg_l1', visible: true, factor: 0.1, anchor: 'full', dy: 0 },
  { key: 'bg_castle', visible: true, factor: 0.2, anchor: 'veg', dy: -14 },
  { key: 'bg_l2', visible: true, factor: 0.32, anchor: 'veg', dy: 0 },
  { key: 'bg_l3', visible: true, factor: 0.5, anchor: 'veg', dy: 0 },
  { key: 'bg_l4', visible: true, factor: 0.72, anchor: 'veg', dy: 0 },
];

export const defaultLayout = (): SceneLayout => ({
  version: 1,
  arena: {
    sky: '#9fd0dc',
    sky2: null,
    bg: BG_LAYER_DEFAULTS.map((l) => ({ ...l })),
    ground: { cells: [], cropH: 40, fill: '#241a12' },
    ceiling: null,
    posts: false,
    props: [],
  },
  mine: {
    sky: '#140e08',
    sky2: '#1d1409',
    bg: [],
    ground: { cells: [], cropH: 40, fill: '#2a1c10' },
    ceiling: { cells: [], cropH: 26 },
    posts: true,
    props: [
      { id: 'vein-coal', src: { kind: 'image', key: 'node_coal' }, fx: 0.18, dy: 6, scale: 2.2, flipX: false, flipY: false, depth: 2, alpha: 0.85 },
      { id: 'vein-gold', src: { kind: 'image', key: 'node_gold' }, fx: 0.82, dy: 6, scale: 2.2, flipX: false, flipY: false, depth: 2, alpha: 0.85 },
      { id: 'vein-jade', src: { kind: 'image', key: 'node_jade' }, fx: 0.93, dy: 6, scale: 1.8, flipX: false, flipY: false, depth: 2, alpha: 0.85 },
    ],
  },
});

let idSeq = 0;
export const newPropId = (): string => {
  idSeq += 1;
  return `p${Date.now().toString(36)}${idSeq.toString(36)}`;
};

export const cssColor = (hex: string, fallback: number): number => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  return m ? Number.parseInt(m[1]!, 16) : fallback;
};

/* ------------------------------ validação ------------------------------ */

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const isStr = (v: unknown): v is string => typeof v === 'string';

const parseSrc = (raw: unknown): PropSrc | null => {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (r.kind === 'image' && isStr(r.key)) return { kind: 'image', key: r.key };
  if (r.kind === 'frame' && isNum(r.frame)) return { kind: 'frame', frame: Math.trunc(r.frame) };
  return null;
};

const parseCells = (raw: unknown): (number | null)[] | null => {
  if (!Array.isArray(raw)) return null;
  const out: (number | null)[] = [];
  for (const c of raw) {
    if (c === null) out.push(null);
    else if (isNum(c)) out.push(Math.trunc(c));
    else return null;
  }
  return out;
};

const parseZone = (raw: unknown): ZoneLayout | null => {
  if (typeof raw !== 'object' || raw === null) return null;
  const z = raw as Record<string, unknown>;
  if (!isStr(z.sky)) return null;
  const sky2 = z.sky2 === null ? null : isStr(z.sky2) ? z.sky2 : undefined;
  if (sky2 === undefined) return null;
  const groundRaw = z.ground as Record<string, unknown> | undefined;
  if (!groundRaw || !isNum(groundRaw.cropH) || !isStr(groundRaw.fill)) return null;
  const cells = parseCells(groundRaw.cells);
  if (!cells) return null;
  let ceiling: CeilingLayout | null = null;
  if (z.ceiling !== null && z.ceiling !== undefined) {
    const c = z.ceiling as Record<string, unknown>;
    const cCells = parseCells(c.cells);
    if (!c || !isNum(c.cropH) || !cCells) return null;
    ceiling = { cells: cCells, cropH: c.cropH };
  }
  const bg: BgLayerLayout[] = [];
  if (Array.isArray(z.bg)) {
    for (const item of z.bg) {
      const b = item as Record<string, unknown>;
      if (!b || !isStr(b.key) || !isBool(b.visible) || !isNum(b.factor)) return null;
      if (b.anchor !== 'full' && b.anchor !== 'veg') return null;
      if (!isNum(b.dy)) return null;
      bg.push({ key: b.key, visible: b.visible, factor: b.factor, anchor: b.anchor, dy: b.dy });
    }
  }
  const props: PropLayout[] = [];
  if (Array.isArray(z.props)) {
    for (const item of z.props) {
      const p = item as Record<string, unknown>;
      if (!p || !isStr(p.id)) return null;
      const src = parseSrc(p.src);
      if (!src) return null;
      if (!isNum(p.fx) || !isNum(p.dy) || !isNum(p.scale) || !isNum(p.depth) || !isNum(p.alpha)) return null;
      if (!isBool(p.flipX) || !isBool(p.flipY)) return null;
      props.push({
        id: p.id,
        src,
        fx: p.fx,
        dy: p.dy,
        scale: p.scale,
        flipX: p.flipX,
        flipY: p.flipY,
        depth: p.depth,
        alpha: p.alpha,
      });
    }
  }
  return {
    sky: z.sky,
    sky2,
    bg,
    ground: { cells, cropH: groundRaw.cropH, fill: groundRaw.fill },
    ceiling,
    posts: isBool(z.posts) ? z.posts : false,
    props,
  };
};

/** Valida um JSON desconhecido; retorna null se não for um layout válido. */
export const parseLayout = (raw: unknown): SceneLayout | null => {
  if (typeof raw !== 'object' || raw === null) return null;
  const l = raw as Record<string, unknown>;
  if (l.version !== 1) return null;
  const arena = parseZone(l.arena);
  const mine = parseZone(l.mine);
  if (!arena || !mine) return null;
  return { version: 1, arena, mine };
};

export const loadLayout = (): SceneLayout | null => {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseLayout(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
};

export const saveLayout = (layout: SceneLayout): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
};

export const clearLayout = (): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
};

export const cloneLayout = (layout: SceneLayout): SceneLayout =>
  JSON.parse(JSON.stringify(layout)) as SceneLayout;
