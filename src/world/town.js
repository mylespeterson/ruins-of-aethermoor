// Fixed town map layout
export class Town {
  constructor() {
    this.width = 40;
    this.height = 30;
    this.tileSize = 32;
    this.grid = this._buildGrid();
    this.buildings = this._defineBuildings();
    this.trees = this._placeTrees();
    this.stream = this._defineStream();
    this.bridge = this._defineBridge();
    this.playerStart = { x: 19, y: 15 };
  }

  _buildGrid() {
    const W = this.width, H = this.height;
    const grid = Array.from({ length: H }, () => new Array(W).fill(0)); // 0=grass

    // Main horizontal road
    for (let x = 0; x < W; x++) {
      grid[14][x] = 2;
      grid[15][x] = 2;
    }
    // Main vertical road
    for (let y = 0; y < H; y++) {
      grid[y][18] = 2;
      grid[y][19] = 2;
    }
    // Town square (cobblestone)
    for (let y = 12; y <= 17; y++)
      for (let x = 16; x <= 21; x++)
        grid[y][x] = 3;

    // Side path — upper district
    for (let x = 0; x < 18; x++) grid[7][x] = 2;
    for (let y = 7; y <= 14; y++) grid[y][9] = 2;

    // Side path — lower district
    for (let x = 0; x < 18; x++) grid[22][x] = 2;
    for (let y = 15; y <= 22; y++) grid[y][9] = 2;

    // Path to dungeon (far right)
    for (let x = 19; x < W; x++) grid[22][x] = 2;
    for (let y = 15; y <= 22; y++) grid[y][30] = 2;
    for (let y = 15; y <= 22; y++) grid[y][31] = 2;

    // Grass patches (varied)
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (grid[y][x] === 0 && Math.sin(x * 7.3 + y * 3.1) > 0.6) grid[y][x] = 1; // light grass

    // Stream column (x=24..26)
    for (let y = 0; y < H; y++) {
      grid[y][24] = 4; // water
      grid[y][25] = 4;
    }
    // Bridge over stream on main road
    grid[14][24] = 5; // bridge
    grid[14][25] = 5;
    grid[15][24] = 5;
    grid[15][25] = 5;

    return grid;
  }

  _defineBuildings() {
    return [
      // Upper-left district
      { id:'inn',        name:'Inn',           x:1,  y:1,  w:6, h:5, color:'#7a5533', roofColor:'#553311', icon:'🏨', desc:'Rest & Save' },
      { id:'weapon',     name:'Weapon Shop',   x:9,  y:1,  w:6, h:5, color:'#553333', roofColor:'#331111', icon:'⚔️', desc:'Buy Weapons' },
      // Lower-left district
      { id:'armor',      name:'Armor Shop',    x:1,  y:17, w:6, h:5, color:'#335533', roofColor:'#113311', icon:'🛡️', desc:'Buy Armor' },
      { id:'potion',     name:'Potion Shop',   x:9,  y:17, w:6, h:5, color:'#336655', roofColor:'#114433', icon:'🧪', desc:'Buy Potions' },
      // Upper-right of center
      { id:'magic',      name:'Magic Shop',    x:21, y:1,  w:6, h:5, color:'#443366', roofColor:'#221144', icon:'✨', desc:'Buy Spells' },
      { id:'material',   name:'Material Shop', x:21, y:9,  w:5, h:5, color:'#664433', roofColor:'#442211', icon:'💎', desc:'Buy Materials' },
      // Center
      { id:'crafting',   name:'Crafting',      x:1,  y:9,  w:6, h:5, color:'#665533', roofColor:'#443311', icon:'🔨', desc:'Forge Items' },
      { id:'party_mgmt', name:'Party',         x:17, y:17, w:5, h:5, color:'#334455', roofColor:'#112233', icon:'👥', desc:'Manage Party' },
      // Dungeon far away (bottom-right)
      { id:'dungeon',    name:'Dungeon',       x:32, y:18, w:7, h:8, color:'#222233', roofColor:'#111122', icon:'🗡️', desc:'Enter Dungeon' },
    ];
  }

  _placeTrees() {
    const trees = [];
    // Tree clusters around the edges and between buildings
    const positions = [
      // Top row trees
      [7,0],[8,0],[15,0],[16,0],[17,0],[26,0],[27,0],[28,0],[29,0],[30,0],
      // Between upper buildings
      [7,3],[8,3],[8,4],[15,3],[15,4],
      // Left side trees
      [0,8],[0,12],[0,13],[0,16],[0,20],[0,21],
      // Right of stream
      [26,3],[27,3],[26,4],[26,7],[26,8],[27,7],[26,10],[27,10],
      [26,18],[27,18],[26,20],[27,20],[26,23],[27,23],
      // Center park trees (around town square)
      [14,12],[14,13],[22,12],[22,13],[14,16],[14,17],[22,16],[22,17],
      // Bottom trees
      [0,24],[1,24],[2,24],[3,24],[5,25],[8,25],[10,25],[15,25],
      [20,25],[20,26],[21,25],[22,26],[23,25],
      // Path to dungeon trees
      [29,16],[29,17],[29,18],[28,16],[28,17],
      [31,16],[32,15],[33,15],[34,15],[35,15],
      [31,23],[32,24],[33,24],[34,24],[35,23],[36,22],
      // Far right forest
      [37,0],[37,1],[38,0],[38,1],[38,2],[39,0],[39,1],[39,2],
      [37,3],[37,4],[38,3],[38,4],[39,3],
      [37,5],[37,6],[38,5],[39,5],[39,6],
    ];
    positions.forEach(([x,y]) => {
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        const tile = this.grid[y] && this.grid[y][x];
        if (tile === 0 || tile === 1) trees.push({ x, y });
      }
    });
    return trees;
  }

  _defineStream() {
    // Stream flows from top to bottom at x=24..25
    const points = [];
    for (let y = 0; y < this.height; y++) {
      points.push({ x: 24, y });
      points.push({ x: 25, y });
    }
    return points;
  }

  _defineBridge() {
    return [
      { x: 24, y: 14 }, { x: 25, y: 14 },
      { x: 24, y: 15 }, { x: 25, y: 15 },
    ];
  }

  getBuildingAt(tx, ty) {
    return this.buildings.find(b =>
      tx >= b.x && tx < b.x + b.w && ty >= b.y && ty < b.y + b.h
    );
  }

  isWalkable(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return false;
    // Stream is not walkable except on bridge
    if ((tx === 24 || tx === 25) && this.grid[ty][tx] === 4) return false;
    // Check if inside a building
    for (const b of this.buildings) {
      if (b.id === 'dungeon') continue; // dungeon entrance is walkable to trigger
      if (tx >= b.x && tx < b.x + b.w && ty >= b.y && ty < b.y + b.h) return false;
    }
    // Trees block movement
    if (this.trees && this.trees.some(t => t.x === tx && t.y === ty)) return false;
    return true;
  }
}
