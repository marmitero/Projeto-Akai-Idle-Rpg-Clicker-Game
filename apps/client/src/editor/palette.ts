/**
 * Paleta do Tile Editor: SOMENTE assets reais já curados no manifesto
 * (docs/art/assets.json). Nenhum placeholder: tiles do tileset 96x96,
 * camadas de fundo do pack GandalfHardcore e sprites de mina/materiais.
 */

export interface TileOption {
  frame: number;
  label: string;
}

/** Grade real do `Floor Tiles1.png`: 3 col x 6 lin de 96x96. */
export const TILE_FRAMES: TileOption[] = [
  { frame: 0, label: 'Sólido verde' },
  { frame: 1, label: 'Poço verde' },
  { frame: 2, label: 'Poço raso verde' },
  { frame: 3, label: 'Cruz verde' },
  { frame: 4, label: 'Borda verde' },
  { frame: 5, label: 'Espinhos verde' },
  { frame: 6, label: 'Sólido laranja' },
  { frame: 7, label: 'Poço laranja' },
  { frame: 8, label: 'Poço raso laranja' },
  { frame: 9, label: 'Cruz laranja' },
  { frame: 10, label: 'Borda laranja' },
  { frame: 11, label: 'Espinhos laranja' },
  { frame: 12, label: 'Sólido neve' },
  { frame: 13, label: 'Poço neve' },
  { frame: 14, label: 'Poço raso neve' },
  { frame: 15, label: 'Cruz neve' },
  { frame: 16, label: 'Borda neve' },
  { frame: 17, label: 'Espinhos neve' },
];

export const TILE_SHEET_URL = '/sprites/Tiles/Floor Tiles1.png';

export interface AssetOption {
  key: string;
  label: string;
  /** url direta para o thumbnail do painel */
  url: string;
}

export const PROP_ASSETS: AssetOption[] = [
  { key: 'node_iron', label: 'Nó de ferro', url: '/sprites/Mine/ironNode.png' },
  { key: 'node_coal', label: 'Veio de carvão', url: '/sprites/Mine/coalNode.png' },
  { key: 'node_gold', label: 'Veio de ouro', url: '/sprites/Mine/goldNode.png' },
  { key: 'node_jade', label: 'Veio de jade', url: '/sprites/Mine/jadeNode.png' },
  { key: 'icon_iron', label: 'Ícone ferro', url: '/sprites/Materials/Icon31_15.png' },
  { key: 'icon_coal', label: 'Ícone carvão', url: '/sprites/Materials/Icon31_13.png' },
  { key: 'icon_gold', label: 'Ícone ouro', url: '/sprites/Materials/Icon31_35.png' },
  { key: 'icon_jade', label: 'Ícone jade', url: '/sprites/Materials/Icon31_40.png' },
];

export const BG_NAMES: Record<string, string> = {
  bg_l1: 'Céu (layer 1)',
  bg_castle: 'Castelo',
  bg_l2: 'Floresta (layer 2)',
  bg_l3: 'Colinas (layer 3)',
  bg_l4: 'Matagal (layer 4)',
};

export type ToolId = 'select' | 'tile' | 'erase' | 'ceil' | 'eraseCeil' | 'prop';

export const TOOLS: { id: ToolId; label: string; mineOnly?: boolean }[] = [
  { id: 'select', label: 'Selecionar/mover' },
  { id: 'tile', label: 'Pintar chão' },
  { id: 'erase', label: 'Buraco no chão' },
  { id: 'ceil', label: 'Pintar teto', mineOnly: true },
  { id: 'eraseCeil', label: 'Buraco no teto', mineOnly: true },
  { id: 'prop', label: 'Colocar asset' },
];
