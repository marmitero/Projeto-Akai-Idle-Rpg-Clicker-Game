import Phaser from 'phaser';

/**
 * Chão/teto construídos com o tileset REAL `sprites/Tiles/Floor Tiles1.png`.
 *
 * Auditoria (2026-10-13): o tileset é uma grade 3 colunas x 6 linhas de
 * tiles de 96x96 (NÃO 48x48): linha 0/2/4 = blocos sólidos com topo
 * verde/laranja/neve; linha 1/3/5 = peças de autotile (cruz, bordas,
 * espinhos). Usar pitch errado fatia bordas transparentes e produz os
 * "espaços entre tiles" reportados.
 *
 * Estratégia sem recorte destrutivo: imagens inteiras do tile com
 * `setCrop` em espaço de textura (inteiro, sem distorção) e passo de
 * 96 px alinhado a inteiros. Desde o Tile Editor (2026-10-13), cada coluna
 * pode ter um frame próprio (`cells`) ou ser um buraco (`null`).
 */
export interface GroundPieces {
  container: Phaser.GameObjects.Container;
  topY: number;
}

export const GROUND_TILE = 96;
export const GROUND_CROP_H = 40;

export interface GroundOpts {
  /** frame padrão do tileset para colunas sem override */
  frame: number;
  /** frame por coluna; `null` = buraco; índice ausente = `frame` */
  cells?: (number | null)[];
  cropH?: number;
  dirtColor?: number;
}

export const buildGround = (
  scene: Phaser.Scene,
  x: number,
  zoneBottom: number,
  width: number,
  opts: GroundOpts,
): GroundPieces => {
  const cropH = opts.cropH ?? GROUND_CROP_H;
  const dirtColor = opts.dirtColor ?? 0x241a12;
  const container = scene.add.container(0, 0);
  const topY = zoneBottom - cropH;
  const count = Math.ceil(width / GROUND_TILE) + 1;
  const fillH = Math.max(0, Math.round(zoneBottom - topY - cropH));
  for (let i = 0; i < count; i += 1) {
    const cell = opts.cells?.[i];
    if (cell === null) continue; // buraco editado
    const frame = cell ?? opts.frame;
    const tile = scene.add.image(Math.round(x) + i * GROUND_TILE, topY, 'tiles_floor', frame);
    tile.setOrigin(0, 0);
    tile.setCrop(0, 0, GROUND_TILE, cropH);
    container.add(tile);
    if (fillH > 0) {
      const fill = scene.add.rectangle(
        Math.round(x) + i * GROUND_TILE + GROUND_TILE / 2,
        topY + cropH + fillH / 2,
        GROUND_TILE,
        fillH,
        dirtColor,
      );
      container.addAt(fill, 0);
    }
  }
  return { container, topY };
};

export interface CeilingOpts {
  frame: number;
  cells?: (number | null)[];
  cropH?: number;
}

/** Teto de caverna: mesmo tile sólido, crop inferior, espelhado verticalmente. */
export const buildCeiling = (
  scene: Phaser.Scene,
  x: number,
  zoneTop: number,
  width: number,
  opts: CeilingOpts,
): Phaser.GameObjects.Container => {
  const cropH = opts.cropH ?? 28;
  const container = scene.add.container(0, 0);
  const count = Math.ceil(width / GROUND_TILE) + 1;
  for (let i = 0; i < count; i += 1) {
    const cell = opts.cells?.[i];
    if (cell === null) continue;
    const frame = cell ?? opts.frame;
    const tile = scene.add.image(Math.round(x) + i * GROUND_TILE, zoneTop, 'tiles_floor', frame);
    tile.setOrigin(0, 0);
    tile.setCrop(0, GROUND_TILE - cropH, GROUND_TILE, cropH);
    tile.setFlipY(true);
    container.add(tile);
  }
  return container;
};
