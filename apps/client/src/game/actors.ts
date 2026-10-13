import Phaser from 'phaser';
import { BASE_ROWS, type CompositionSpec, type SequenceSpec, type SheetSpec } from '../assets/manifest.js';

export interface MultiSheetSpec {
  key: string;
  firstTexture: string;
  anims: Record<string, { key: string; frameWidth: number; frameHeight: number; row: number; frames: number; fps: number; loop: boolean }>;
}

export type ActorSource =
  | { kind: 'sheet'; spec: SheetSpec }
  | { kind: 'sequence'; spec: SequenceSpec }
  | { kind: 'layered'; spec: CompositionSpec }
  | { kind: 'multisheet'; spec: MultiSheetSpec };

export const sheetCols = (scene: Phaser.Scene, key: string, frameWidth: number): number => {
  const tex = scene.textures.get(key);
  return Math.max(1, Math.floor(tex.source[0]?.width ?? frameWidth / frameWidth));
};

/** Registra animações no registry global da cena (idempotente). */
export const registerActorAnims = (scene: Phaser.Scene, source: ActorSource): string[] => {
  const anims = scene.anims;
  if (source.kind === 'sheet') {
    const { spec } = source;
    const cols = sheetCols(scene, spec.key, spec.frameWidth);
    const rows = Math.max(1, Math.floor((scene.textures.get(spec.key).source[0]?.height ?? spec.frameHeight) / spec.frameHeight));
    for (const [name, row] of Object.entries(spec.anims)) {
      const key = `${spec.key}::${name}`;
      if (anims.exists(key)) continue;
      const frames = row.frames > 0 ? row.frames : cols * rows;
      anims.create({
        key,
        frames: anims.generateFrameNumbers(spec.key, { start: row.row * cols, end: row.row * cols + frames - 1 }),
        frameRate: row.fps,
        repeat: row.loop ? -1 : 0,
      });
    }
    return [spec.key];
  }
  if (source.kind === 'multisheet') {
    const { spec } = source;
    for (const [name, a] of Object.entries(spec.anims)) {
      const key = `${spec.key}::${name}`;
      if (anims.exists(key)) continue;
      const tex = scene.textures.get(a.key);
      const cols = Math.max(1, Math.floor((tex.source[0]?.width ?? a.frameWidth) / a.frameWidth));
      const rows = Math.max(1, Math.floor((tex.source[0]?.height ?? a.frameHeight) / a.frameHeight));
      const start = a.row * cols;
      const frames = a.frames > 0 ? a.frames : cols * rows;
      anims.create({
        key,
        frames: anims.generateFrameNumbers(a.key, { start, end: start + frames - 1 }),
        frameRate: a.fps,
        repeat: a.loop ? -1 : 0,
      });
    }
    return [spec.firstTexture];
  }
  if (source.kind === 'sequence') {
    const { spec } = source;
    for (const [name, keys] of Object.entries(spec.anims)) {
      const key = `${spec.key}::${name}`;
      if (anims.exists(key)) continue;
      anims.create({
        key,
        frames: keys.map((k) => ({ key: k })),
        frameRate: 10,
        repeat: name === 'death' || name === 'attack' || name === 'hurt' ? 0 : -1,
      });
    }
    return [spec.key];
  }
  const { spec } = source;
  const textureKeys: string[] = [];
  for (const part of spec.parts) {
    const texKey = `${spec.key}__${part.part}`;
    textureKeys.push(texKey);
    const cols = sheetCols(scene, texKey, 80);
    for (const [name, row] of Object.entries(BASE_ROWS)) {
      const key = `${texKey}::${name}`;
      if (anims.exists(key)) continue;
      anims.create({
        key,
        frames: anims.generateFrameNumbers(texKey, { start: row.row * cols, end: row.row * cols + row.frames - 1 }),
        frameRate: row.fps,
        repeat: row.loop ? -1 : 0,
      });
    }
  }
  return textureKeys;
};

/**
 * Actor visual: 1..N sprites sincronizados (camadas de composição, sheets ou
 * sequências). Todas as peças de uma composição compartilham a mesma origem,
 * conforme verificado no manifesto (grades alinhadas 80x64).
 */
export class Actor {
  readonly container: Phaser.GameObjects.Container;
  private sprites: Phaser.GameObjects.Sprite[] = [];
  private spriteAnimKeys: string[][] = [];
  private currentAnim = '';

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly source: ActorSource,
    x: number,
    y: number,
    scale: number,
  ) {
    this.container = scene.add.container(x, y);
    this.container.setScale(scale);
    const keys = registerActorAnims(scene, source);
    if (source.kind === 'layered') {
      source.spec.parts.forEach((part, i) => {
        const texKey = keys[i] ?? `${source.spec.key}__${part.part}`;
        const sprite = scene.add.sprite(0, 0, texKey);
        sprite.setOrigin(0.5, 0.85);
        this.container.add(sprite);
        this.sprites.push(sprite);
        this.spriteAnimKeys.push(Object.keys(BASE_ROWS).map((n) => `${texKey}::${n}`));
      });
    } else if (source.kind === 'multisheet') {
      const key = source.spec.firstTexture;
      const sprite = scene.add.sprite(0, 0, key);
      sprite.setOrigin(0.5, 0.85);
      this.container.add(sprite);
      this.sprites.push(sprite);
      this.spriteAnimKeys.push(Object.keys(source.spec.anims).map((n) => `${source.spec.key}::${n}`));
    } else {
      const key = keys[0] ?? source.spec.key;
      const sprite = scene.add.sprite(0, 0, key);
      sprite.setOrigin(0.5, 0.85);
      this.container.add(sprite);
      this.sprites.push(sprite);
      const names = source.kind === 'sheet' ? Object.keys(source.spec.anims) : Object.keys(source.spec.anims);
      this.spriteAnimKeys.push(names.map((n) => `${key}::${n}`));
    }
  }

  play(name: string, force = false): void {
    if (!force && this.currentAnim === name) return;
    this.currentAnim = name;
    this.sprites.forEach((sprite, i) => {
      const animKey = this.spriteAnimKeys[i]?.find((k) => k.endsWith(`::${name}`));
      if (!animKey) return;
      if (this.scene.anims.exists(animKey)) sprite.play(animKey);
      else sprite.stop();
    });
  }

  currentAnimName(): string {
    return this.currentAnim;
  }

  get root(): Phaser.GameObjects.Sprite | undefined {
    return this.sprites[0];
  }

  setFlipX(flip: boolean): void {
    for (const s of this.sprites) s.setFlipX(flip);
  }

  setTint(color: number | null): void {
    for (const s of this.sprites) {
      if (color === null) s.clearTint();
      else s.setTint(color);
    }
  }

  setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  setDepth(d: number): void {
    this.container.setDepth(d);
  }

  setAlpha(a: number): void {
    this.container.setAlpha(a);
  }

  setScale(s: number): void {
    this.container.setScale(s);
  }

  destroy(): void {
    this.container.destroy();
    this.sprites = [];
  }
}
