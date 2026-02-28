// Fixed town map layout
export class Town {
  constructor() {
    this.width = 30;
    this.height = 20;
    this.tileSize = 32;
    this.grid = this._buildGrid();
    this.buildings = this._defineBuildings();
    this.playerStart = { x: 14, y: 10 };
  }

  _buildGrid() {
    const W = this.width, H = this.height;
    const grid = Array.from({ length: H }, () => new Array(W).fill(0)); // 0=grass
    // Roads
    for (let x = 0; x < W; x++) {
      grid[9][x] = 2; // horizontal road
      grid[10][x] = 2;
    }
    for (let y = 0; y < H; y++) {
      grid[y][13] = 2; // vertical road
      grid[y][14] = 2;
    }
    // Town square
    for (let y = 8; y <= 11; y++)
      for (let x = 12; x <= 15; x++)
        grid[y][x] = 3; // cobblestone
    return grid;
  }

  _defineBuildings() {
    return [
      { id:'inn',        name:'Inn',            x:1,  y:1,  w:5, h:5, color:'#7a5533', roofColor:'#553311', icon:'🏨' },
      { id:'weapon',     name:'Weapon Shop',    x:7,  y:1,  w:5, h:5, color:'#553333', roofColor:'#331111', icon:'⚔️' },
      { id:'armor',      name:'Armor Shop',     x:13, y:1,  w:5, h:5, color:'#335533', roofColor:'#113311', icon:'🛡️' },
      { id:'potion',     name:'Potion Shop',    x:19, y:1,  w:5, h:5, color:'#336655', roofColor:'#114433', icon:'🧪' },
      { id:'magic',      name:'Magic Shop',     x:25, y:1,  w:4, h:5, color:'#443366', roofColor:'#221144', icon:'✨' },
      { id:'material',   name:'Material Shop',  x:1,  y:12, w:5, h:6, color:'#664433', roofColor:'#442211', icon:'💎' },
      { id:'crafting',   name:'Crafting',       x:7,  y:12, w:5, h:6, color:'#665533', roofColor:'#443311', icon:'🔨' },
      { id:'dungeon',    name:'Dungeon',        x:20, y:12, w:9, h:7, color:'#222233', roofColor:'#111122', icon:'🗡️' },
      { id:'party_mgmt', name:'Party',          x:13, y:13, w:5, h:5, color:'#334455', roofColor:'#112233', icon:'👥' },
    ];
  }

  getBuildingAt(tx, ty) {
    return this.buildings.find(b =>
      tx >= b.x && tx < b.x + b.w && ty >= b.y && ty < b.y + b.h
    );
  }

  isWalkable(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return false;
    // Check if inside a building
    for (const b of this.buildings) {
      if (b.id === 'dungeon') continue; // dungeon entrance is walkable to trigger
      if (tx >= b.x && tx < b.x + b.w && ty >= b.y && ty < b.y + b.h) return false;
    }
    return true;
  }
}
