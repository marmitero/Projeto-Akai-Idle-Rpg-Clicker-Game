/**
 * Conjuntos visuais de inimigos por faixa de andares (ART_BIBLE §8).
 * Cada conjunto combina família de sprite real do repositório; repetição entre
 * faixas é permitida (master-prompt §9.4) com modificadores mecânicos.
 * `kind` determina o pipeline de render no client:
 *  - 'sequence': frames individuais (Skeleton family)
 *  - 'sheet': spritesheet com grade verificada
 *  - 'composed': composição de camadas Male/Female Base
 */

export interface EnemyVisualSet {
  id: string;
  kind: 'sequence' | 'sheet' | 'composed';
  family: string;
  /** prefixo de caminho dentro de sprites/ */
  basePath: string;
  /** para sequence: mapa animacao -> arquivos (gerado no client via manifesto) */
  note: string;
}

export const ENEMY_SETS: readonly EnemyVisualSet[] = [
  {
    id: 'crypt',
    kind: 'sequence',
    family: 'Skeleton',
    basePath: 'sprites/Enemies/Skeleton/PNG',
    note: 'andares 1-9: esqueletos (sequências 128x96 verificadas)',
  },
  {
    id: 'warcamp',
    kind: 'composed',
    family: 'Male Base',
    basePath: 'sprites/Enemies/Male Base',
    note: 'andares 11-19: humanoides compostos (camadas 80x64)',
  },
  {
    id: 'coven',
    kind: 'composed',
    family: 'Female Base',
    basePath: 'sprites/Enemies/Female Base',
    note: 'andares 21-29: humanoides compostos (camadas 80x64)',
  },
] as const;

export const enemySetForFloor = (floor: number): EnemyVisualSet => {
  const band = Math.floor((floor - 1) / 10) % ENEMY_SETS.length;
  return ENEMY_SETS[band] ?? ENEMY_SETS[0]!;
};

/** Composições aprovadas visualmente (ART_BIBLE §8): peças por papel de combate. */
export interface CompositionRecipe {
  roleId: 'brute' | 'raider' | 'shade';
  skin: string;
  clothing: string;
  hair: string;
  hat?: string;
  hand?: string;
}

export const MALE_RECIPES: readonly CompositionRecipe[] = [
  { roleId: 'brute', skin: 'Male Skin/Male Skin1.png', clothing: 'Male Clothing/Chainmail.png', hair: 'Male Hair/Male Hair3.png', hand: 'Male Hand/Iron Sword.png' },
  { roleId: 'raider', skin: 'Male Skin/Male Orc skin.png', clothing: 'Male Clothing/Green Pants.png', hair: 'Male Hair/Male Hair7.png', hat: 'Male Hat/Guard Helmet.png', hand: 'Male Hand/Iron Axe.png' },
  { roleId: 'shade', skin: 'Male Skin/Male Zombie skin.png', clothing: 'Male Clothing/Split hose.png', hair: 'Male Hair/Male Hair12.png', hand: 'Male Hand/Bronze Pickaxe.png' },
] as const;

export const FEMALE_RECIPES: readonly CompositionRecipe[] = [
  { roleId: 'brute', skin: 'Female Skin/Female Orc skin.png', clothing: 'Female Clothing/Skirt.png', hair: 'Female Hair/Female Hair5.png', hand: 'Female Hand/Iron Sword.png' },
  { roleId: 'raider', skin: 'Female Skin/Female Skin2.png', clothing: 'Female Clothing/Skyblue Socks.png', hair: 'Female Hair/Female Hair11.png', hat: 'Female Hat/Female Mining Helmet.png', hand: 'Female Hand/Iron Pickaxe.png' },
  { roleId: 'shade', skin: 'Female Skin/Female Ghost skin.png', clothing: 'Female Clothing/Socks.png', hair: 'Female Hair/Female Hair20.png', hand: 'Female Hand/Flower.png' },
] as const;
