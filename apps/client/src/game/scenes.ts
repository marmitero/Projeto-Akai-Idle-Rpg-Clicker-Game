import Phaser from 'phaser';
import type { GameEvent, PlayerState } from '@akai/shared';
import { COMPOSITIONS, IMAGES, SEQUENCES, SHEETS } from '../assets/manifest.js';
import { CombatView } from './CombatView.js';
import type { Zone } from './zones.js';
import { MiningView } from './MiningView.js';

export const loadErrors: string[] = [];

/** Carrega todos os assets curados do manifesto (jogo e Tile Editor). */
export const preloadAssets = (scene: Phaser.Scene): void => {
    for (const sheet of SHEETS) {
      scene.load.spritesheet(sheet.key, `/${sheet.path}`, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
      });
    }
    for (const image of IMAGES) {
      scene.load.image(image.key, `/${image.path}`);
    }
    for (const seq of SEQUENCES) {
      for (const keys of Object.values(seq.anims)) {
        for (const key of keys) scene.load.image(key, `/${key}`);
      }
    }
    for (const comp of COMPOSITIONS) {
      for (const part of comp.parts) {
        scene.load.spritesheet(`${comp.key}__${part.part}`, `/${part.path}`, { frameWidth: 80, frameHeight: 64 });
      }
    }
    scene.load.on('loaderror', (file: { src?: string }) => {
      loadErrors.push(String(file.src ?? 'asset desconhecido'));
    });
    const progressEl = document.getElementById('load-progress');
    if (progressEl) {
      scene.load.on('progress', (p: number) => {
        progressEl.style.width = `${Math.round(p * 100)}%`;
      });
    }
};

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    preloadAssets(this);
  }

  create(): void {
    const errList = document.getElementById('load-errors');
    if (errList && loadErrors.length) {
      errList.innerHTML = loadErrors.map((e) => `<li>${e}</li>`).join('');
    }
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
    this.scene.start('main');
  }
}

export class MainScene extends Phaser.Scene {
  private combat: CombatView | null = null;
  private mining: MiningView | null = null;
  private state: PlayerState | null = null;
  onMiningClick: (() => void) | null = null;

  constructor() {
    super('main');
  }

  create(): void {
    this.buildViews();
    window.dispatchEvent(new Event('akai-main-ready'));
    this.scale.on('resize', () => {
      this.buildViews();
      if (this.state) this.combat?.setState(this.state);
    });
  }

  private buildViews(): void {
    this.children.removeAll(true);
    const w = this.scale.width;
    const h = this.scale.height;
    const combatZone: Zone = { x: 0, y: 0, w, h: Math.floor(h * 0.62) };
    const miningZone: Zone = { x: 0, y: combatZone.h, w, h: h - combatZone.h };
    this.combat = new CombatView(this, combatZone);
    this.mining = new MiningView(this, miningZone);
    this.mining.setClickHandler(() => this.onMiningClick?.());
  }

  setState(state: PlayerState): void {
    this.state = state;
    this.combat?.setState(state);
    this.mining?.setClickerLevel(state.clickerLevel);
  }

  override update(_time: number, delta: number): void {
    this.combat?.update(Math.min(delta, 250));
  }

  playEvents(events: GameEvent[]): void {
    this.combat?.playEvents(events);
    this.mining?.playEvents(events);
  }
}
