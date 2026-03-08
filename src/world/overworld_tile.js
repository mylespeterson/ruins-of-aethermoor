// Overworld tile types for the 3D isometric world map
export const OTILE = {
  WATER:         0,
  SAND:          1,
  GRASS:         2,
  DEEP_GRASS:    3,
  FOREST:        4,
  MOUNTAIN:      5,
  SNOW_MOUNTAIN: 6,
  ROAD:          7,
  TOWN:          8,
  CAVE:          9,
  SPECIAL:       10,
  TREASURE:      11,
};

// Can the player walk on this tile?
export const OTILE_WALKABLE = {
  [OTILE.WATER]:         false,
  [OTILE.SAND]:          true,
  [OTILE.GRASS]:         true,
  [OTILE.DEEP_GRASS]:    true,
  [OTILE.FOREST]:        true,
  [OTILE.MOUNTAIN]:      false,
  [OTILE.SNOW_MOUNTAIN]: false,
  [OTILE.ROAD]:          true,
  [OTILE.TOWN]:          true,
  [OTILE.CAVE]:          true,
  [OTILE.SPECIAL]:       true,
  [OTILE.TREASURE]:      true,
};

// Wall / cube height in screen pixels for each tile (used for 3D depth)
export const OTILE_WALL_H = {
  [OTILE.WATER]:         2,
  [OTILE.SAND]:          4,
  [OTILE.GRASS]:         6,
  [OTILE.DEEP_GRASS]:    8,
  [OTILE.FOREST]:        10,
  [OTILE.MOUNTAIN]:      36,
  [OTILE.SNOW_MOUNTAIN]: 50,
  [OTILE.ROAD]:          4,
  [OTILE.TOWN]:          8,
  [OTILE.CAVE]:          10,
  [OTILE.SPECIAL]:       8,
  [OTILE.TREASURE]:      6,
};

// Colour triplet: top face, left wall, right wall
export const OTILE_COLOR = {
  [OTILE.WATER]:         { top: '#1a6ea0', left: '#0d4a6e', right: '#136082' },
  [OTILE.SAND]:          { top: '#c8a84b', left: '#8a7030', right: '#a88838' },
  [OTILE.GRASS]:         { top: '#4a8840', left: '#2a5c25', right: '#3a7030' },
  [OTILE.DEEP_GRASS]:    { top: '#2e6e2a', left: '#1a4a18', right: '#255820' },
  [OTILE.FOREST]:        { top: '#1e5a18', left: '#103812', right: '#184a14' },
  [OTILE.MOUNTAIN]:      { top: '#887868', left: '#504030', right: '#685040' },
  [OTILE.SNOW_MOUNTAIN]: { top: '#e8e0d8', left: '#9088a8', right: '#b0a0c0' },
  [OTILE.ROAD]:          { top: '#887060', left: '#504030', right: '#685040' },
  [OTILE.TOWN]:          { top: '#9880b8', left: '#504080', right: '#685498' },
  [OTILE.CAVE]:          { top: '#383028', left: '#201810', right: '#302018' },
  [OTILE.SPECIAL]:       { top: '#c8a820', left: '#906010', right: '#a87018' },
  [OTILE.TREASURE]:      { top: '#d4c820', left: '#988810', right: '#b0a018' },
};

export const OTILE_NAME = {
  [OTILE.WATER]:         'Water',
  [OTILE.SAND]:          'Sand',
  [OTILE.GRASS]:         'Grasslands',
  [OTILE.DEEP_GRASS]:    'Deep Grass',
  [OTILE.FOREST]:        'Forest',
  [OTILE.MOUNTAIN]:      'Mountain',
  [OTILE.SNOW_MOUNTAIN]: 'Snow Peak',
  [OTILE.ROAD]:          'Road',
  [OTILE.TOWN]:          'Town',
  [OTILE.CAVE]:          'Cave Entrance',
  [OTILE.SPECIAL]:       'Ancient Ruins',
  [OTILE.TREASURE]:      'Hidden Treasure',
};
