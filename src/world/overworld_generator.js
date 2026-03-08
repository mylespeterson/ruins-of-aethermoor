import { OTILE } from './overworld_tile.js';

// Town data for the multiple towns on the overworld
export const TOWN_DATA = [
  { name: 'Aethermoor',   desc: 'The ancient capital of the realm.',    color: '#9880b8' },
  { name: 'Stonehaven',   desc: 'A dwarven fortress carved from rock.', color: '#887868' },
  { name: 'Mistwood',     desc: 'A secretive village in the forest.',   color: '#4a8840' },
  { name: 'Saltport',     desc: 'A bustling harbor trading town.',      color: '#4a7890' },
];

// Cave / dungeon entrance data
export const CAVE_DATA = [
  { name: 'Goblin Warrens',   desc: 'Shallow tunnels teeming with goblins.' },
  { name: 'Shadow Crypts',    desc: 'Ancient burial halls of a forgotten king.' },
  { name: 'Ember Depths',     desc: 'Volcanic caverns filled with fire elementals.' },
  { name: 'Frost Hollows',    desc: 'Ice-laced caves beneath the snow peaks.' },
  { name: 'Abyssal Pit',      desc: 'A bottomless chasm of pure darkness.' },
];

// Special location data
export const SPECIAL_DATA = [
  { name: 'Fallen Temple',    desc: 'Ruins of an ancient deity\'s shrine.' },
  { name: 'Arcane Monolith',  desc: 'A crackling obelisk of raw magic.' },
  { name: 'Dragon Graveyard', desc: 'Bones of titanic dragons litter the ground.' },
];

export class OverworldGenerator {
  constructor(width = 60, height = 60) {
    this.width  = width;
    this.height = height;
  }

  generate(seed = 42) {
    const W = this.width, H = this.height;
    const heightMap = this._buildHeightMap(W, H, seed);
    const grid = this._heightToTiles(heightMap, W, H);

    // Points of interest placed in valid (walkable, non-edge) locations
    const towns    = this._placePOIs(grid, W, H, TOWN_DATA.length,  OTILE.TOWN,     t => t === OTILE.GRASS || t === OTILE.DEEP_GRASS, 10);
    const caves    = this._placePOIs(grid, W, H, CAVE_DATA.length,   OTILE.CAVE,     t => t === OTILE.DEEP_GRASS || t === OTILE.FOREST || t === OTILE.GRASS, 6);
    const specials = this._placePOIs(grid, W, H, SPECIAL_DATA.length, OTILE.SPECIAL, t => t === OTILE.SAND || t === OTILE.GRASS || t === OTILE.DEEP_GRASS, 8);
    const treasures = this._placeTreasures(grid, W, H, 6);

    // Roads connecting every town to every cave (gives traveller purpose)
    towns.forEach(t => caves.forEach(c => this._carveRoad(grid, t.x, t.y, c.x, c.y)));
    towns.forEach((t, i) => { if (i > 0) this._carveRoad(grid, towns[0].x, towns[0].y, t.x, t.y); });

    // Fog of war: 0=unexplored, 1=explored, 2=visible
    const fog = Array.from({ length: H }, () => new Array(W).fill(0));

    const startX = towns[0] ? towns[0].x : Math.floor(W / 2);
    const startY = towns[0] ? towns[0].y + 2 : Math.floor(H / 2);

    return {
      grid, fog,
      width: W, height: H,
      towns, caves, specials, treasures,
      startPos: { x: startX, y: startY },
    };
  }

  // ── Internal helpers ───────────────────────────────────────────────────────

  /** Cheap value noise for height generation */
  _noise(x, y, seed) {
    const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.1) * 43758.5453;
    return n - Math.floor(n);
  }

  /** Bilinear smooth noise at a given scale */
  _smoothNoise(x, y, scale, seed) {
    const ix = Math.floor(x / scale), iy = Math.floor(y / scale);
    const fx = (x / scale) - ix,      fy = (y / scale) - iy;
    const n00 = this._noise(ix,     iy,     seed);
    const n10 = this._noise(ix + 1, iy,     seed);
    const n01 = this._noise(ix,     iy + 1, seed);
    const n11 = this._noise(ix + 1, iy + 1, seed);
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    return n00 + (n10 - n00) * ux + (n01 - n00) * uy + (n00 + n11 - n10 - n01) * ux * uy;
  }

  /** Fractal Brownian Motion — layered octaves of smooth noise */
  _fbm(x, y, seed) {
    let v = 0, amp = 0.5, freq = 1, max = 0;
    for (let i = 0; i < 5; i++) {
      v   += this._smoothNoise(x, y, 10 / freq, seed + i * 31) * amp;
      max += amp;
      amp  *= 0.5;
      freq *= 2;
    }
    return v / max;
  }

  _buildHeightMap(W, H, seed) {
    const map = [];
    for (let y = 0; y < H; y++) {
      map.push([]);
      for (let x = 0; x < W; x++) {
        // Distance from centre pushes edges towards water (island effect)
        const dx = (x - W / 2) / (W / 2);
        const dy = (y - H / 2) / (H / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const islandMask = Math.max(0, 1 - dist * 1.3);
        map[y].push(this._fbm(x, y, seed) * islandMask);
      }
    }
    return map;
  }

  _heightToTiles(hm, W, H) {
    const grid = [];
    for (let y = 0; y < H; y++) {
      grid.push([]);
      for (let x = 0; x < W; x++) {
        const h = hm[y][x];
        let tile;
        if      (h < 0.18) tile = OTILE.WATER;
        else if (h < 0.22) tile = OTILE.SAND;
        else if (h < 0.42) tile = OTILE.GRASS;
        else if (h < 0.56) tile = OTILE.DEEP_GRASS;
        else if (h < 0.68) tile = OTILE.FOREST;
        else if (h < 0.80) tile = OTILE.MOUNTAIN;
        else               tile = OTILE.SNOW_MOUNTAIN;
        grid[y].push(tile);
      }
    }
    return grid;
  }

  /** Place `count` POIs of type `tileType` in cells matching `predicate`, min `minDist` apart */
  _placePOIs(grid, W, H, count, tileType, predicate, minDist) {
    const placed = [];
    let attempts = 0;
    while (placed.length < count && attempts < 5000) {
      attempts++;
      const x = 4 + Math.floor(Math.random() * (W - 8));
      const y = 4 + Math.floor(Math.random() * (H - 8));
      if (!predicate(grid[y][x])) continue;
      // Enforce minimum distance from already-placed POIs
      if (placed.some(p => Math.hypot(p.x - x, p.y - y) < minDist)) continue;
      // Also keep distance from other tile types that are already overworld features
      placed.push({ x, y });
      grid[y][x] = tileType;
    }
    return placed;
  }

  _placeTreasures(grid, W, H, count) {
    const placed = [];
    let attempts = 0;
    while (placed.length < count && attempts < 3000) {
      attempts++;
      const x = 2 + Math.floor(Math.random() * (W - 4));
      const y = 2 + Math.floor(Math.random() * (H - 4));
      const t = grid[y][x];
      if (t !== OTILE.FOREST && t !== OTILE.DEEP_GRASS && t !== OTILE.GRASS) continue;
      placed.push({ x, y });
      grid[y][x] = OTILE.TREASURE;
    }
    return placed;
  }

  /** L-shaped road between two points */
  _carveRoad(grid, x1, y1, x2, y2) {
    let x = x1, y = y1;
    while (x !== x2) {
      if (grid[y][x] === OTILE.GRASS || grid[y][x] === OTILE.DEEP_GRASS || grid[y][x] === OTILE.SAND) {
        grid[y][x] = OTILE.ROAD;
      }
      x += x < x2 ? 1 : -1;
    }
    while (y !== y2) {
      if (grid[y][x] === OTILE.GRASS || grid[y][x] === OTILE.DEEP_GRASS || grid[y][x] === OTILE.SAND) {
        grid[y][x] = OTILE.ROAD;
      }
      y += y < y2 ? 1 : -1;
    }
  }

  /** Reveal tiles within radius around (px, py) */
  updateFogOfWar(fog, px, py, radius = 6) {
    const H = fog.length, W = fog[0].length;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (fog[y][x] === 2) fog[y][x] = 1;
      }
    }
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = px + dx, ny = py + dy;
        if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
        if (dx * dx + dy * dy <= radius * radius) fog[ny][nx] = 2;
      }
    }
  }
}
