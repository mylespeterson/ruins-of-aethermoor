export const TILE = {
  WALL: 0,
  FLOOR: 1,
  DOOR: 2,
  STAIRS_DOWN: 3,
  STAIRS_UP: 4,
  TREASURE_CHEST: 5,
  TRAP: 6,
  HEALING_FOUNTAIN: 7,
  CRAFTING_STATION: 8,
  SHOP: 9
};

export const TILE_COLORS = {
  [TILE.WALL]: '#0d0d1a',
  [TILE.FLOOR]: '#1e1e2e',
  [TILE.DOOR]: '#5a3a1a',
  [TILE.STAIRS_DOWN]: '#ffaa00',
  [TILE.STAIRS_UP]: '#00aaff',
  [TILE.TREASURE_CHEST]: '#ffdd44',
  [TILE.TRAP]: '#ff2200',
  [TILE.HEALING_FOUNTAIN]: '#44ffaa',
  [TILE.CRAFTING_STATION]: '#cc44ff',
  [TILE.SHOP]: '#44aaff'
};

export const TILE_NAMES = {
  [TILE.WALL]: 'Wall',
  [TILE.FLOOR]: 'Floor',
  [TILE.DOOR]: 'Door',
  [TILE.STAIRS_DOWN]: 'Stairs Down',
  [TILE.STAIRS_UP]: 'Stairs Up (Town)',
  [TILE.TREASURE_CHEST]: 'Treasure Chest',
  [TILE.TRAP]: 'Trap',
  [TILE.HEALING_FOUNTAIN]: 'Healing Fountain',
  [TILE.CRAFTING_STATION]: 'Crafting Station',
  [TILE.SHOP]: 'Shop'
};

export const TILE_WALKABLE = {
  [TILE.WALL]: false,
  [TILE.FLOOR]: true,
  [TILE.DOOR]: true,
  [TILE.STAIRS_DOWN]: true,
  [TILE.STAIRS_UP]: true,
  [TILE.TREASURE_CHEST]: true,
  [TILE.TRAP]: true,
  [TILE.HEALING_FOUNTAIN]: true,
  [TILE.CRAFTING_STATION]: true,
  [TILE.SHOP]: true
};

export const MINIMAP_COLORS = {
  [TILE.WALL]: '#000000',
  [TILE.FLOOR]: '#334455',
  [TILE.DOOR]: '#664422',
  [TILE.STAIRS_DOWN]: '#ffaa00',
  [TILE.STAIRS_UP]: '#00aaff',
  [TILE.TREASURE_CHEST]: '#ffdd44',
  [TILE.TRAP]: '#ff2200',
  [TILE.HEALING_FOUNTAIN]: '#44ffaa',
  [TILE.CRAFTING_STATION]: '#cc44ff',
  [TILE.SHOP]: '#44aaff'
};
