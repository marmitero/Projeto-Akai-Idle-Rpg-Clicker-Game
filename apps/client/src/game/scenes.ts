import Phaser from 'phaser';
import type { GameEvent, PlayerState } from '@akai/shared';
import { COMPOSITIONS, IMAGES, SEQUENCES, SHEETS } from '../assets/manifest.js';
import { CombatView, type Zone } from './CombatView.js';
import { MiningView } from './MiningView.js';

export const loadErrors: string[] = [];

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    for (const sheet of SHEETS) {
      this.load.spritesheet(sheet.key, `/${sheet.path}`, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
      });
    }
    for (const image of IMAGES) {
      this.load.image(image.key, `/${image.path}`);
    }
    for (const seq of SEQUENCES) {
      for (const keys of Object.values(seq.anims)) {
        for (const key of keys) this.load.image(key, `/${key}`);
      }
    }
    for (const comp of COMPOSITIONS) {
      for (const part of comp.parts) {
        this.load.spritesheet(`${comp.key}__${part.part}`, `/${part.path}`, { frameWidth: 80, frameHeight: 64 });
      }
    }
    this.load.on('loaderror', (file: { src?: string }) => {
      loadErrors.push(String(file.src ?? 'asset desconhecido'));
    });
    this.load.on('progress', (p: number) => {
      const el = document.getElementById('load-progress');
      if (el) el.style.width = `${Math.round(p * 100)}%`;
    });
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

  playEvents(events: GameEvent[]): void {
    this.combat?.playEvents(events);
    this.mining?.playEvents(events);
  }
}
