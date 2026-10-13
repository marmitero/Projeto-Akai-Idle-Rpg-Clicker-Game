import Phaser from 'phaser';
import type { PropLayout } from './sceneLayout.js';
import type { Zone } from './zones.js';

/**
 * Renderiza props decorativos do layout de cenário (veios, nós, tiles soltos
 * etc.) usando SOMENTE assets do manifesto. Props não recebem input: nunca
 * interferem no nó de ferro clicável nem nos combatentes.
 */
export const renderProps = (
  scene: Phaser.Scene,
  zone: Zone,
  groundTop: number,
  props: PropLayout[],
): Phaser.GameObjects.Image[] => {
  const out: Phaser.GameObjects.Image[] = [];
  for (const prop of props) {
    const img =
      prop.src.kind === 'frame'
        ? scene.add.image(0, 0, 'tiles_floor', prop.src.frame)
        : scene.add.image(0, 0, prop.src.key);
    img.setPosition(Math.round(zone.x + prop.fx * zone.w), Math.round(groundTop + prop.dy));
    img.setScale(prop.scale);
    img.setFlip(prop.flipX, prop.flipY);
    img.setAlpha(prop.alpha);
    img.setDepth(prop.depth);
    out.push(img);
  }
  return out;
};
