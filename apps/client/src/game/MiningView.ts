import Phaser from 'phaser';
import { ironPerClick, type GameEvent } from '@akai/shared';
import { buildCeiling, buildGround } from './ground.js';
import { renderProps } from './props.js';
import { cssColor, defaultLayout, loadLayout, type ZoneLayout } from './sceneLayout.js';
import type { Zone } from './zones.js';

/**
 * Área central: o "caminho da mina" — uma cena PRÓPRIA e separada do combate
 * (correção de 2026-10-13: antes era apenas um nó solto sobre uma faixa de
 * tiles fatiada errada). Composição: caverna escura com teto de tileset
 * espelhado, escoras de madeira, chão de tileset variante laranja (trilha
 * própria), nó de ferro semi-enterrado no centro e veios decorativos de
 * carvão/ouro/jade (assets reais, reservados como identidade das minas
 * futuras — GDD §5).
 */
export class MiningView {
  private node: Phaser.GameObjects.Image;
  private gainLabel: Phaser.GameObjects.Text;
  private onClick: (() => void) | null = null;
  private groundTop: number;

  constructor(private readonly scene: Phaser.Scene, private readonly zone: Zone) {
    const { x, y, w, h } = zone;
    // cenário vem do layout editável (Tile Editor); sem layout salvo, o
    // default reproduz exatamente a composição procedural anterior
    const lz: ZoneLayout = loadLayout()?.mine ?? defaultLayout().mine;
    // fundo de caverna em dois tons (sem disputar atenção com o combate)
    const top = scene.add.rectangle(x + w / 2, y + h * 0.35, w, h * 0.7, cssColor(lz.sky, 0x140e08));
    top.setDepth(-5);
    if (lz.sky2) {
      const bottom = scene.add.rectangle(x + w / 2, y + h * 0.85, w, h * 0.3, cssColor(lz.sky2, 0x1d1409));
      bottom.setDepth(-5);
    }

    // separador físico entre combate e mina: vigas + teto de caverna
    const sep = scene.add.rectangle(x + w / 2, y + 2, w, 4, 0x000000, 0.85);
    sep.setDepth(5);
    if (lz.ceiling) {
      buildCeiling(scene, x, y + 4, w, { frame: 6, cells: lz.ceiling.cells, cropH: lz.ceiling.cropH }).setDepth(1);
    }

    // escoras de madeira laterais
    if (lz.posts) {
      for (const px of [x + 10, x + w - 10]) {
        const post = scene.add.rectangle(px, y + h / 2, 7, h - 24, 0x4a3520);
        post.setDepth(1);
      }
    }

    // trilha própria da mina (variante laranja do tileset, editável por coluna)
    const zoneBottom = y + h + 6;
    this.groundTop = zoneBottom - lz.ground.cropH;
    buildGround(scene, x, zoneBottom, w, {
      frame: 6,
      cells: lz.ground.cells,
      cropH: lz.ground.cropH,
      dirtColor: cssColor(lz.ground.fill, 0x2a1c10),
    }).container.setDepth(1);

    // props decorativos do layout (veios de minério etc., assets reais)
    renderProps(scene, zone, this.groundTop, lz.props);

    // nó de ferro clicável, semi-enterrado na trilha
    this.node = scene.add.image(x + w / 2, this.groundTop + 2, 'node_iron');
    this.node.setScale(5);
    this.node.setDepth(3);
    this.node.setInteractive({ useHandCursor: true });
    this.node.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.fx(pointer.x, pointer.y);
      this.onClick?.();
    });

    const title = scene.add.text(x + 8, y + 10, 'CAMINHO DA MINA', {
      fontSize: '10px',
      color: '#8d8aa0',
      fontStyle: 'bold',
    });
    title.setDepth(6);
    this.gainLabel = scene.add.text(x + w / 2, y + 26, '', {
      fontSize: '13px',
      color: '#e8e6da',
      fontStyle: 'bold',
    });
    this.gainLabel.setOrigin(0.5, 0).setDepth(6);
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
      scaleY: 4.6,
      duration: 60,
      yoyo: true,
      onComplete: () => this.node.setScale(5),
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
        const t = this.scene.add.text(this.node.x, this.node.y - 56, `+${ev.iron}`, {
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
