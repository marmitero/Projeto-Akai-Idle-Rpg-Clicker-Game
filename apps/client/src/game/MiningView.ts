import Phaser from 'phaser';
import { ironPerClick, type GameEvent } from '@akai/shared';
import type { Zone } from './CombatView.js';

/**
 * Área central: clicker de ferro (GDD §2). Piso de tileset real, nó de ferro
 * 16x16 ampliado, feedback imediato de impacto + número flutuante.
 * A recompensa em si vem do driver (local ou servidor), nunca daqui.
 */
export class MiningView {
  private node: Phaser.GameObjects.Image;
  private ground: Phaser.GameObjects.TileSprite;
  private gainLabel: Phaser.GameObjects.Text;
  private onClick: (() => void) | null = null;

  constructor(private readonly scene: Phaser.Scene, private readonly zone: Zone) {
    scene.add.rectangle(zone.x + zone.w / 2, zone.y + zone.h / 2, zone.w, zone.h, 0x1a1410);
    this.ground = scene.add.tileSprite(zone.x + zone.w / 2, zone.y + zone.h - 10, zone.w, 24, 'tiles_floor', 6);
    this.node = scene.add.image(zone.x + zone.w / 2, zone.y + zone.h - 34, 'node_iron');
    this.node.setScale(4);
    this.node.setInteractive({ useHandCursor: true });
    this.node.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.fx(pointer.x, pointer.y);
      this.onClick?.();
    });
    this.gainLabel = scene.add.text(zone.x + zone.w / 2, zone.y + 10, '', {
      fontSize: '13px',
      color: '#e8e6da',
      fontStyle: 'bold',
    });
    this.gainLabel.setOrigin(0.5, 0);
  }

  setClickHandler(handler: () => void): void {
    this.onClick = handler;
  }

  setClickerLevel(level: number): void {
    this.gainLabel.setText(`+${ironPerClick(level)} ferro por clique`);
  }

  private fx(x: number, y: number): void {
    const fx = this.scene.add.sprite(x, y, 'fx_impact', 0);
    fx.setScale(1.6);
    fx.setDepth(20);
    this.scene.tweens.add({ targets: fx, scale: 2.2, alpha: 0, duration: 220, onComplete: () => fx.destroy() });
    this.scene.tweens.add({
      targets: this.node,
      scaleY: 3.7,
      duration: 60,
      yoyo: true,
      onComplete: () => this.node.setScale(4),
    });
    for (let i = 0; i < 5; i += 1) {
      const p = this.scene.add.image(x, y, 'icon_iron');
      p.setScale(0.6);
      p.setDepth(21);
      this.scene.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-40, 40),
        y: y - Phaser.Math.Between(20, 60),
        alpha: 0,
        duration: 500,
        onComplete: () => p.destroy(),
      });
    }
  }

  playEvents(events: GameEvent[]): void {
    for (const ev of events) {
      if (ev.t === 'click') {
        const t = this.scene.add.text(this.node.x, this.node.y - 50, `+${ev.iron}`, {
          fontSize: '16px',
          color: '#cfd2d6',
          fontStyle: 'bold',
        });
        t.setOrigin(0.5).setDepth(25);
        this.scene.tweens.add({ targets: t, y: t.y - 30, alpha: 0, duration: 600, onComplete: () => t.destroy() });
      }
    }
  }
}
