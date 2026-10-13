/**
 * Curadoria de assets do MVP, derivada de docs/art/assets.json (somente
 * entradas com grade verificada). O teste tests/assets/manifest.spec.ts
 * garante que cada caminho existe no repositório com as dimensões declaradas.
 */

export interface AnimRow {
  row: number;
  frames: number;
  fps: number;
  loop: boolean;
}

export interface SheetSpec {
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
  anims: Record<string, AnimRow>;
}

export interface ImageSpec {
  key: string;
  path: string;
}

export interface SequenceSpec {
  key: string;
  anims: Record<string, string[]>;
}

const S = 'sprites';

export const SHEETS: SheetSpec[] = [
  { key: 'hero_idle', path: `${S}/Character/Idle/Idle-Sheet.png`, frameWidth: 64, frameHeight: 80, anims: { idle: { row: 0, frames: 4, fps: 6, loop: true } } },
  { key: 'hero_run', path: `${S}/Character/Run/Run-Sheet.png`, frameWidth: 80, frameHeight: 80, anims: { run: { row: 0, frames: 8, fps: 10, loop: true } } },
  { key: 'hero_attack', path: `${S}/Character/Attack-01/Attack-01-Sheet.png`, frameWidth: 96, frameHeight: 80, anims: { attack: { row: 0, frames: 8, fps: 12, loop: false } } },
  { key: 'hero_dead', path: `${S}/Character/Dead/Dead-Sheet.png`, frameWidth: 80, frameHeight: 64, anims: { death: { row: 0, frames: 8, fps: 8, loop: false } } },
  { key: 'fx_impact', path: `${S}/Effects/Red Effect Bullet Impact Explosion 32x32.png`, frameWidth: 32, frameHeight: 32, anims: {} },
  { key: 'tiles_floor', path: `${S}/Tiles/Floor Tiles1.png`, frameWidth: 48, frameHeight: 48, anims: {} },
  { key: 'boss_idle', path: `${S}/Boss/Chief Goblin/PNG/Spritesheets/Left - Idle.png`, frameWidth: 480, frameHeight: 480, anims: { idle: { row: 0, frames: 0, fps: 8, loop: true } } },
  { key: 'boss_walk', path: `${S}/Boss/Chief Goblin/PNG/Spritesheets/Left - Walking.png`, frameWidth: 480, frameHeight: 480, anims: { walk: { row: 0, frames: 0, fps: 8, loop: true } } },
  { key: 'boss_attack', path: `${S}/Boss/Chief Goblin/PNG/Spritesheets/Left - Attacking.png`, frameWidth: 480, frameHeight: 480, anims: { attack: { row: 0, frames: 0, fps: 10, loop: false } } },
  { key: 'boss_hurt', path: `${S}/Boss/Chief Goblin/PNG/Spritesheets/Left - Hurt.png`, frameWidth: 480, frameHeight: 480, anims: { hurt: { row: 0, frames: 0, fps: 10, loop: false } } },
  { key: 'boss_die', path: `${S}/Boss/Chief Goblin/PNG/Spritesheets/Dying.png`, frameWidth: 480, frameHeight: 480, anims: { death: { row: 0, frames: 0, fps: 10, loop: false } } },
];

export const IMAGES: ImageSpec[] = [
  { key: 'bg_l1', path: `${S}/Backgrounds/Normal BG/GandalfHardcore Background layers_layer 1.png` },
  { key: 'bg_l2', path: `${S}/Backgrounds/Normal BG/GandalfHardcore Background layers_layer 2.png` },
  { key: 'bg_l3', path: `${S}/Backgrounds/Normal BG/GandalfHardcore Background layers_layer 3.png` },
  { key: 'bg_l4', path: `${S}/Backgrounds/Normal BG/GandalfHardcore Background layers_layer 4.png` },
  { key: 'bg_castle', path: `${S}/Backgrounds/Normal BG/Background Castle .png` },
  { key: 'node_iron', path: `${S}/Mine/ironNode.png` },
  { key: 'node_coal', path: `${S}/Mine/coalNode.png` },
  { key: 'node_gold', path: `${S}/Mine/goldNode.png` },
  { key: 'node_jade', path: `${S}/Mine/jadeNode.png` },
  { key: 'icon_iron', path: `${S}/Materials/Icon31_15.png` },
  { key: 'icon_coal', path: `${S}/Materials/Icon31_13.png` },
  { key: 'icon_gold', path: `${S}/Materials/Icon31_35.png` },
  { key: 'icon_jade', path: `${S}/Materials/Icon31_40.png` },
];

const skeleton = (anim: string, n: number, sep = '-'): string[] =>
  Array.from({ length: n }, (_, i) => `${S}/Enemies/Skeleton/PNG/${anim}${sep}${i + 1}.png`);

export const SEQUENCES: SequenceSpec[] = [
  {
    key: 'mob_skeleton',
    anims: {
      idle: skeleton('idle', 4),
      walk: skeleton('walk', 6),
      attack: skeleton('attack-A', 8, ''),
      hurt: skeleton('hit', 3),
      death: skeleton('dead', 4),
    },
  },
];

/** Camadas de composição (bases 80x64, linhas verificadas no manifesto). */
export const BASE_ROWS: Record<string, { row: number; frames: number; fps: number; loop: boolean }> = {
  idle: { row: 0, frames: 5, fps: 6, loop: true },
  walk: { row: 1, frames: 8, fps: 10, loop: true },
  run: { row: 2, frames: 8, fps: 12, loop: true },
  attack: { row: 5, frames: 6, fps: 10, loop: false },
  death: { row: 6, frames: 10, fps: 10, loop: false },
};

export interface RecipePart {
  part: string;
  path: string;
}

export interface CompositionSpec {
  key: string;
  family: 'Male Base' | 'Female Base';
  parts: RecipePart[];
}

const base = (family: 'Male Base' | 'Female Base', file: string): string =>
  `${S}/Enemies/${family}/${file}`;

export const COMPOSITIONS: CompositionSpec[] = [
  {
    key: 'mob_male_brute',
    family: 'Male Base',
    parts: [
      { part: 'skin', path: base('Male Base', 'Male Skin/Male Skin1.png') },
      { part: 'clothing', path: base('Male Base', 'Male Clothing/Chainmail.png') },
      { part: 'hair', path: base('Male Base', 'Male Hair/Male Hair3.png') },
      { part: 'hand', path: base('Male Base', 'Male Hand/Iron Sword.png') },
    ],
  },
  {
    key: 'mob_male_raider',
    family: 'Male Base',
    parts: [
      { part: 'skin', path: base('Male Base', 'Male Skin/Male Orc skin.png') },
      { part: 'clothing', path: base('Male Base', 'Male Clothing/Green Pants.png') },
      { part: 'hair', path: base('Male Base', 'Male Hair/Male Hair7.png') },
      { part: 'hat', path: base('Male Base', 'Male Hat/Guard Helmet.png') },
      { part: 'hand', path: base('Male Base', 'Male Hand/Iron Axe.png') },
    ],
  },
  {
    key: 'mob_male_shade',
    family: 'Male Base',
    parts: [
      { part: 'skin', path: base('Male Base', 'Male Skin/Male Zombie skin.png') },
      { part: 'clothing', path: base('Male Base', 'Male Clothing/Split hose.png') },
      { part: 'hair', path: base('Male Base', 'Male Hair/Male Hair12.png') },
      { part: 'hand', path: base('Male Base', 'Male Hand/Bronze Pickaxe.png') },
    ],
  },
  {
    key: 'mob_female_brute',
    family: 'Female Base',
    parts: [
      { part: 'skin', path: base('Female Base', 'Female Skin/Female Orc skin.png') },
      { part: 'clothing', path: base('Female Base', 'Female Clothing/Skirt.png') },
      { part: 'hair', path: base('Female Base', 'Female Hair/Female Hair5.png') },
      { part: 'hand', path: base('Female Base', 'Female Hand/Iron Sword.png') },
    ],
  },
  {
    key: 'mob_female_raider',
    family: 'Female Base',
    parts: [
      { part: 'skin', path: base('Female Base', 'Female Skin/Female Skin2.png') },
      { part: 'clothing', path: base('Female Base', 'Female Clothing/Skyblue Socks.png') },
      { part: 'hair', path: base('Female Base', 'Female Hair/Female Hair11.png') },
      { part: 'hat', path: base('Female Base', 'Female Hat/Female Mining Helmet.png') },
      { part: 'hand', path: base('Female Base', 'Female Hand/Iron Pickaxe.png') },
    ],
  },
  {
    key: 'mob_female_shade',
    family: 'Female Base',
    parts: [
      { part: 'skin', path: base('Female Base', 'Female Skin/Female Ghost skin.png') },
      { part: 'clothing', path: base('Female Base', 'Female Clothing/Socks.png') },
      { part: 'hair', path: base('Female Base', 'Female Hair/Female Hair20.png') },
      { part: 'hand', path: base('Female Base', 'Female Hand/Flower.png') },
    ],
  },
];

export const ALL_PATHS: string[] = [
  ...SHEETS.map((s) => s.path),
  ...IMAGES.map((i) => i.path),
  ...SEQUENCES.flatMap((s) => Object.values(s.anims).flat()),
  ...COMPOSITIONS.flatMap((c) => c.parts.map((p) => p.path)),
];
