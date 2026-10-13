import Phaser from 'phaser';
import { buildCeiling, buildGround } from '../game/ground.js';
import { renderProps } from '../game/props.js';
import {
  cloneLayout,
  cssColor,
  defaultLayout,
  loadLayout,
  newPropId,
  saveLayout,
  VEG_ANCHOR_Y,
  type PropLayout,
  type PropSrc,
  type SceneLayout,
  type ZoneLayout,
} from '../game/sceneLayout.js';
import type { Zone } from '../game/zones.js';
import type { ToolId } from './palette.js';

export const EDITOR_ARENA_H = 260;
export const EDITOR_MINE_H = 150;
export const EDITOR_W = 420;
const PARALLAX_MARGIN = 96;

/**
 * Cena do Tile Editor: renderiza a zona selecionada com as MESMAS receitas
 * das views de jogo (ground.ts / props.ts / ancoragem de fundo), de forma que
 * o que você vê aqui é exatamente o que o jogo mostra. Interatividade:
 * pintar/apagar tiles por coluna (chão e teto), colocar/mover/ajustar props e
 * editar fundo (cores, camadas, parallax, ancoragem).
 */
export class EditorScene extends Phaser.Scene {
  private layout: SceneLayout;
  private tab: 'arena' | 'mine' = 'arena';
  private tool: ToolId = 'select';
  private tileFrame = 0;
  private propSrc: PropSrc = { kind: 'image', key: 'node_coal' };
  private grid = true;
  private selectedId: string | null = null;
  private drag: { id: string; dx: number; dy: number } | null = null;
  private propSprites = new Map<string, Phaser.GameObjects.Image>();
  private groundTop = 0;

  onChanged: (() => void) | null = null;
  onSelection: (() => void) | null = null;

  constructor() {
    super('editor');
    this.layout = cloneLayout(loadLayout() ?? defaultLayout());
  }

  create(): void {
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onDown(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onMove(p));
    this.input.on('pointerup', () => this.onUp());
    this.rebuild();
  }

  /* ------------------------------ API pública ----------------------------- */

  setLayout(layout: SceneLayout): void {
    this.layout = cloneLayout(layout);
    this.selectedId = null;
    this.rebuild();
    this.onSelection?.();
  }

  getLayout(): SceneLayout {
    return this.layout;
  }

  getZoneTab(): 'arena' | 'mine' {
    return this.tab;
  }

  getTool(): ToolId {
    return this.tool;
  }

  getTileFrame(): number {
    return this.tileFrame;
  }

  getPropSrc(): PropSrc {
    return this.propSrc;
  }

  getGrid(): boolean {
    return this.grid;
  }

  getSelected(): PropLayout | null {
    return this.zoneLayout().props.find((p) => p.id === this.selectedId) ?? null;
  }

  setZoneTab(tab: 'arena' | 'mine'): void {
    if (this.tab === tab) return;
    this.tab = tab;
    this.selectedId = null;
    this.scale.resize(EDITOR_W, tab === 'arena' ? EDITOR_ARENA_H : EDITOR_MINE_H);
    this.rebuild();
    this.onSelection?.();
  }

  setTool(tool: ToolId): void {
    this.tool = tool;
  }

  setTileFrame(frame: number): void {
    this.tileFrame = frame;
  }

  setPropSrc(src: PropSrc): void {
    this.propSrc = src;
  }

  setGrid(grid: boolean): void {
    this.grid = grid;
    this.rebuild();
  }

  updateSelected(patch: Partial<PropLayout>): void {
    const prop = this.getSelected();
    if (!prop) return;
    Object.assign(prop, patch);
    this.commit();
  }

  removeSelected(): void {
    const lz = this.zoneLayout();
    lz.props = lz.props.filter((p) => p.id !== this.selectedId);
    this.selectedId = null;
    this.commit();
    this.onSelection?.();
  }

  /* ------------------------------- renderização --------------------------- */

  private zoneLayout(): ZoneLayout {
    return this.tab === 'arena' ? this.layout.arena : this.layout.mine;
  }

  private zone(): Zone {
    return { x: 0, y: 0, w: EDITOR_W, h: this.tab === 'arena' ? EDITOR_ARENA_H : EDITOR_MINE_H };
  }

  rebuild(): void {
    // cliques durante o carregamento de assets: o layout é editado, mas a
    // renderização só roda com a cena ativa (create() redesenha tudo)
    if (!this.sys.settings.active) {
      saveLayout(this.layout);
      return;
    }
    this.children.removeAll(true);
    this.propSprites.clear();
    const zone = this.zone();
    const lz = this.zoneLayout();
    const { w, h } = zone;
    const isMine = this.tab === 'mine';

    const sky = this.add.rectangle(w / 2, isMine ? h * 0.35 : h / 2, w, isMine ? h * 0.7 : h, cssColor(lz.sky, isMine ? 0x140e08 : 0x9fd0dc));
    sky.setDepth(-10);
    if (isMine && lz.sky2) {
      const bottom = this.add.rectangle(w / 2, h * 0.85, w, h * 0.3, cssColor(lz.sky2, 0x1d1409));
      bottom.setDepth(-10);
    }

    const zoneBottom = isMine ? h + 6 : h;
    this.groundTop = zoneBottom - lz.ground.cropH;

    if (!isMine) {
      // mesma composição/ancoragem do CombatView (mockup mock_combat3.png)
      const scale = (w + PARALLAX_MARGIN) / 1024;
      let depth = -9;
      for (const layer of lz.bg) {
        if (!layer.visible || !this.textures.exists(layer.key)) continue;
        const img = this.add.image(-PARALLAX_MARGIN, 0, layer.key);
        img.setOrigin(0, 0);
        img.setScale(scale);
        const y =
          layer.anchor === 'veg'
            ? this.groundTop - VEG_ANCHOR_Y * scale + layer.dy
            : this.groundTop - 346 * scale;
        img.setY(Math.round(y));
        img.setDepth(depth);
        depth += 1;
      }
    } else {
      const sep = this.add.rectangle(w / 2, 2, w, 4, 0x000000, 0.85);
      sep.setDepth(5);
      if (lz.ceiling) {
        buildCeiling(this, 0, 4, w, { frame: 6, cells: lz.ceiling.cells, cropH: lz.ceiling.cropH }).setDepth(1);
      }
      if (lz.posts) {
        for (const px of [10, w - 10]) {
          const post = this.add.rectangle(px, h / 2, 7, h - 24, 0x4a3520);
          post.setDepth(1);
        }
      }
    }

    buildGround(this, 0, zoneBottom, w, {
      frame: isMine ? 6 : 0,
      cells: lz.ground.cells,
      cropH: lz.ground.cropH,
      dirtColor: cssColor(lz.ground.fill, isMine ? 0x2a1c10 : 0x241a12),
    }).container.setDepth(1);

    // props na mesma ordem do layout => zip id->sprite para hit-test
    renderProps(this, zone, this.groundTop, lz.props).forEach((sprite, i) => {
      const prop = lz.props[i];
      if (prop) this.propSprites.set(prop.id, sprite);
    });

    if (this.grid) this.drawGrid(zone);
    this.drawSelection();

    const label = this.add.text(6, 6, isMine ? 'MINA (clique)' : 'ARENA (combate)', {
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#00000088',
    });
    label.setDepth(100);
  }

  private drawGrid(zone: Zone): void {
    const g = this.add.graphics();
    g.lineStyle(1, 0xffffff, 0.14);
    for (let x = 0; x <= zone.w; x += 96) g.lineBetween(x, 0, x, zone.h);
    g.lineStyle(1, 0xf0b429, 0.5);
    g.lineBetween(0, this.groundTop, zone.w, this.groundTop);
    g.setDepth(90);
  }

  private drawSelection(): void {
    const prop = this.getSelected();
    if (!prop) return;
    const sprite = this.propSprites.get(prop.id);
    if (!sprite) return;
    const r = this.add.rectangle(sprite.x, sprite.y, sprite.displayWidth + 4, sprite.displayHeight + 4);
    r.setStrokeStyle(1, 0xf0b429, 0.9);
    r.setDepth(95);
  }

  /* -------------------------------- interação ----------------------------- */

  private onDown(p: Phaser.Input.Pointer): void {
    const x = p.x;
    const y = p.y;
    const lz = this.zoneLayout();
    const colOf = (px: number): number => Math.floor(px / 96);
    const extend = (cells: (number | null)[], col: number): void => {
      while (cells.length <= col) cells.push(undefined as unknown as number | null);
    };
    switch (this.tool) {
      case 'tile': {
        const col = colOf(x);
        extend(lz.ground.cells, col);
        lz.ground.cells[col] = this.tileFrame;
        this.commit();
        return;
      }
      case 'erase': {
        const col = colOf(x);
        extend(lz.ground.cells, col);
        lz.ground.cells[col] = null;
        this.commit();
        return;
      }
      case 'ceil': {
        if (this.tab !== 'mine') return;
        if (!lz.ceiling) lz.ceiling = { cells: [], cropH: 26 };
        const col = colOf(x);
        extend(lz.ceiling.cells, col);
        lz.ceiling.cells[col] = this.tileFrame;
        this.commit();
        return;
      }
      case 'eraseCeil': {
        if (this.tab !== 'mine' || !lz.ceiling) return;
        const col = colOf(x);
        extend(lz.ceiling.cells, col);
        lz.ceiling.cells[col] = null;
        this.commit();
        return;
      }
      case 'prop': {
        const zone = this.zone();
        const prop: PropLayout = {
          id: newPropId(),
          src: this.propSrc,
          fx: Number((x / zone.w).toFixed(4)),
          dy: Math.round(y - this.groundTop),
          scale: 1,
          flipX: false,
          flipY: false,
          depth: 4,
          alpha: 1,
        };
        lz.props.push(prop);
        this.selectedId = prop.id;
        this.commit();
        this.onSelection?.();
        return;
      }
      case 'select': {
        const hit = this.hitProp(x, y);
        this.selectedId = hit?.id ?? null;
        if (hit) {
          const sprite = this.propSprites.get(hit.id);
          this.drag = sprite ? { id: hit.id, dx: x - sprite.x, dy: y - sprite.y } : null;
        } else {
          this.drag = null;
        }
        this.rebuild();
        this.onSelection?.();
        return;
      }
    }
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (!this.drag) return;
    const drag = this.drag;
    const prop = this.zoneLayout().props.find((q) => q.id === drag.id);
    if (!prop) return;
    const zone = this.zone();
    prop.fx = Number(Phaser.Math.Clamp((p.x - drag.dx) / zone.w, -0.25, 1.25).toFixed(4));
    prop.dy = Math.round(p.y - drag.dy - this.groundTop);
    this.rebuild();
  }

  private onUp(): void {
    if (this.drag) {
      this.drag = null;
      this.commit();
    }
  }

  private hitProp(x: number, y: number): PropLayout | null {
    const list = [...this.zoneLayout().props].reverse();
    for (const prop of list) {
      const sprite = this.propSprites.get(prop.id);
      if (!sprite) continue;
      const hw = sprite.displayWidth / 2 + 4;
      const hh = sprite.displayHeight / 2 + 4;
      if (x >= sprite.x - hw && x <= sprite.x + hw && y >= sprite.y - hh && y <= sprite.y + hh) return prop;
    }
    return null;
  }

  private commit(): void {
    saveLayout(this.layout);
    this.rebuild();
    this.onChanged?.();
  }

  /** Commit público: o painel edita o layout via `getLayout()` e confirma aqui. */
  commitChange(): void {
    this.commit();
  }

  /** Salva sem rebuild (usado pelo botão Salvar do painel). */
  persist(): void {
    saveLayout(this.layout);
  }
}
