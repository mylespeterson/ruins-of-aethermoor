// Town map – unique layout per town type (0-3)
export class Town {
  /**
   * @param {number} townType  0=Aethermoor, 1=Stonehaven, 2=Mistwood, 3=Saltport
   */
  constructor(townType = 0) {
    this.townType = townType;
    this.width = 36;
    this.height = 28;
    this.tileSize = 32;
    // Dispatch to the correct layout builder
    const layouts = [this._layoutAethermoor, this._layoutStonehaven, this._layoutMistwood, this._layoutSaltport];
    const builder = (layouts[townType] || layouts[0]).bind(this);
    const result = builder();
    this.grid      = result.grid;
    this.buildings = result.buildings;
    this.trees     = result.trees;
    this.stream    = result.stream    || [];
    this.bridge    = result.bridge    || [];
    this.playerStart = result.playerStart;
  }

  // ── Helper: empty grid ──────────────────────────────────────────────────

  _emptyGrid() {
    return Array.from({ length: this.height }, () => new Array(this.width).fill(0));
  }

  _addGrassVariation(grid) {
    const W = this.width, H = this.height;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (grid[y][x] === 0 && Math.sin(x * 7.3 + y * 3.1) > 0.6) grid[y][x] = 1;
    return grid;
  }

  _road(grid, x1, y1, x2, y2) {
    if (x1 === x2) { for (let y = Math.min(y1,y2); y <= Math.max(y1,y2); y++) { if (y >= 0 && y < this.height) grid[y][x1] = 2; } }
    else           { for (let x = Math.min(x1,x2); x <= Math.max(x1,x2); x++) { if (x >= 0 && x < this.width) grid[y1][x] = 2; } }
  }

  _square(grid, x1, y1, x2, y2) {
    for (let y = y1; y <= y2; y++)
      for (let x = x1; x <= x2; x++)
        if (y >= 0 && y < this.height && x >= 0 && x < this.width) grid[y][x] = 3;
  }

  _addTrees(grid, positions) {
    const trees = [];
    positions.forEach(([x, y]) => {
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        const tile = grid[y][x];
        if (tile === 0 || tile === 1) trees.push({ x, y });
      }
    });
    return trees;
  }

  // ── Layout 0: Aethermoor – classic cross-roads town ─────────────────────

  _layoutAethermoor() {
    const W = this.width, H = this.height;
    const grid = this._emptyGrid();

    // Main horizontal road (y=13..14)
    this._road(grid, 0, 13, W-1, 13);
    this._road(grid, 0, 14, W-1, 14);
    // Main vertical road (x=17..18)
    this._road(grid, 17, 0, 17, H-1);
    this._road(grid, 18, 0, 18, H-1);
    // Town square
    this._square(grid, 15, 11, 20, 16);
    // Upper side path
    this._road(grid, 0, 6,  16, 6);
    this._road(grid, 8, 6,  8,  13);
    // Lower side path
    this._road(grid, 0, 21, 16, 21);
    this._road(grid, 8, 14, 8,  21);
    // Stream (x=23..24)
    for (let y = 0; y < H; y++) { grid[y][23] = 4; grid[y][24] = 4; }
    // Bridge over stream
    grid[13][23] = 5; grid[13][24] = 5;
    grid[14][23] = 5; grid[14][24] = 5;
    this._addGrassVariation(grid);

    const buildings = [
      { id:'inn',        name:'Inn',           x:1,  y:1,  w:5, h:4, color:'#7a5533', roofColor:'#553311', icon:'🏨', desc:'Rest & Save' },
      { id:'weapon',     name:'Weapon Shop',   x:9,  y:1,  w:5, h:4, color:'#663333', roofColor:'#441111', icon:'⚔️', desc:'Buy Weapons' },
      { id:'armor',      name:'Armor Shop',    x:1,  y:16, w:5, h:4, color:'#335533', roofColor:'#113311', icon:'🛡️', desc:'Buy Armor' },
      { id:'potion',     name:'Potion Shop',   x:9,  y:16, w:5, h:4, color:'#336655', roofColor:'#114433', icon:'🧪', desc:'Buy Potions' },
      { id:'magic',      name:'Magic Shop',    x:20, y:1,  w:5, h:4, color:'#443366', roofColor:'#221144', icon:'✨', desc:'Buy Spells' },
      { id:'material',   name:'Material Shop', x:20, y:8,  w:5, h:4, color:'#664433', roofColor:'#442211', icon:'💎', desc:'Buy Materials' },
      { id:'crafting',   name:'Crafting',      x:1,  y:9,  w:5, h:4, color:'#665533', roofColor:'#443311', icon:'🔨', desc:'Forge Items' },
      { id:'party_mgmt', name:'Party',         x:25, y:15, w:5, h:4, color:'#334455', roofColor:'#112233', icon:'👥', desc:'Manage Party' },
    ];

    const stream = [];
    for (let y = 0; y < H; y++) { stream.push({ x:23, y }); stream.push({ x:24, y }); }

    const bridge = [
      { x:23, y:13 },{ x:24, y:13 },
      { x:23, y:14 },{ x:24, y:14 },
    ];

    const treePosns = [
      [7,0],[14,0],[15,0],[25,0],[26,0],[27,0],[30,0],[31,0],
      [7,3],[14,3],[14,4],
      [0,7],[0,11],[0,12],[0,15],[0,19],[0,20],
      [25,3],[25,4],[25,7],[25,8],[25,11],[25,12],
      [25,18],[25,19],[25,22],[25,23],
      [13,11],[13,12],[21,11],[21,12],[13,15],[13,16],[21,15],[21,16],
      [0,23],[1,23],[2,23],[3,23],[6,24],[9,24],[12,24],[16,24],
      [19,24],[20,24],[21,24],[22,23],
      [34,0],[35,0],[34,1],[35,1],[34,2],[35,2],[34,3],[35,4],
    ];
    const trees = this._addTrees(grid, treePosns);

    return { grid, buildings, trees, stream, bridge, playerStart: { x: 18, y: 14 } };
  }

  // ── Layout 1: Stonehaven – compact stone town, diagonal paths ───────────

  _layoutStonehaven() {
    const W = this.width, H = this.height;
    const grid = this._emptyGrid();

    // Wide central plaza
    this._square(grid, 12, 10, 23, 18);
    // Main roads from plaza
    this._road(grid, 0, 13, 11, 13);   this._road(grid, 0, 14, 11, 14);
    this._road(grid, 24, 13, W-1, 13); this._road(grid, 24, 14, W-1, 14);
    this._road(grid, 17, 0, 17, 9);    this._road(grid, 18, 0, 18, 9);
    this._road(grid, 17, 19, 17, H-1); this._road(grid, 18, 19, 18, H-1);
    // Diagonal-style side connectors
    this._road(grid, 0, 7, 16, 7);   this._road(grid, 7, 7, 7, 13);
    this._road(grid, 0, 20, 16, 20); this._road(grid, 7, 14, 7, 20);
    this._road(grid, 19, 7, W-1, 7); this._road(grid, 27, 7, 27, 13);
    this._road(grid, 19, 20, W-1, 20); this._road(grid, 27, 14, 27, 20);
    this._addGrassVariation(grid);

    const buildings = [
      { id:'inn',        name:'Inn',           x:1,  y:1,  w:5, h:4, color:'#8a6644', roofColor:'#664422', icon:'🏨', desc:'Rest & Save' },
      { id:'weapon',     name:'Weapon Shop',   x:9,  y:1,  w:4, h:4, color:'#664444', roofColor:'#442222', icon:'⚔️', desc:'Buy Weapons' },
      { id:'armor',      name:'Armor Shop',    x:1,  y:15, w:5, h:4, color:'#3a6644', roofColor:'#224422', icon:'🛡️', desc:'Buy Armor' },
      { id:'potion',     name:'Potion Shop',   x:8,  y:15, w:4, h:4, color:'#336655', roofColor:'#114433', icon:'🧪', desc:'Buy Potions' },
      { id:'magic',      name:'Magic Shop',    x:21, y:1,  w:5, h:4, color:'#443366', roofColor:'#221144', icon:'✨', desc:'Buy Spells' },
      { id:'material',   name:'Material Shop', x:28, y:1,  w:4, h:4, color:'#664433', roofColor:'#442211', icon:'💎', desc:'Buy Materials' },
      { id:'crafting',   name:'Crafting',      x:21, y:15, w:5, h:4, color:'#665533', roofColor:'#443311', icon:'🔨', desc:'Forge Items' },
      { id:'party_mgmt', name:'Party',         x:28, y:15, w:4, h:4, color:'#334455', roofColor:'#112233', icon:'👥', desc:'Manage Party' },
    ];

    const treePosns = [
      [0,0],[0,1],[0,2],[35,0],[35,1],[35,2],
      [0,8],[0,12],[0,21],[0,25],
      [35,8],[35,12],[35,21],[35,25],
      [6,0],[7,0],[15,0],[16,0],[19,0],[20,0],[28,0],[29,0],
      [0,27],[1,27],[2,27],[3,27],[33,27],[34,27],[35,27],
      [13,0],[13,8],[13,21],[22,0],[22,8],[22,21],
    ];
    const trees = this._addTrees(grid, treePosns);

    return { grid, buildings, trees, stream: [], bridge: [], playerStart: { x: 17, y: 13 } };
  }

  // ── Layout 2: Mistwood – forest clearing town, winding paths ────────────

  _layoutMistwood() {
    const W = this.width, H = this.height;
    const grid = this._emptyGrid();

    // Winding main path (horizontal, slight jog)
    this._road(grid, 0,  13, 10, 13); this._road(grid, 0,  14, 10, 14);
    this._road(grid, 10, 13, 10, 12);
    this._road(grid, 10, 12, 20, 12); this._road(grid, 10, 13, 20, 13);
    this._road(grid, 20, 12, 20, 13);
    this._road(grid, 20, 12, W-1, 12); this._road(grid, 20, 13, W-1, 13);
    // Clearing center
    this._square(grid, 15, 9, 20, 16);
    // Side branches
    this._road(grid, 16, 0, 16, 8);  this._road(grid, 17, 0, 17, 8);
    this._road(grid, 6, 13, 6, 22);  this._road(grid, 7, 13, 7, 22);
    this._road(grid, 6, 22, 15, 22); this._road(grid, 6, 23, 15, 23);
    this._road(grid, 23, 14, 23, 22); this._road(grid, 24, 14, 24, 22);
    this._road(grid, 24, 22, 35, 22); this._road(grid, 24, 23, 35, 23);
    // Stream on right side
    for (let y = 0; y < H; y++) { grid[y][30] = 4; }
    grid[12][30] = 5; grid[13][30] = 5;
    this._addGrassVariation(grid);

    const buildings = [
      { id:'inn',        name:'Inn',           x:1,  y:8,  w:4, h:4, color:'#7a6633', roofColor:'#553322', icon:'🏨', desc:'Rest & Save' },
      { id:'weapon',     name:'Weapon Shop',   x:8,  y:8,  w:4, h:4, color:'#553333', roofColor:'#331111', icon:'⚔️', desc:'Buy Weapons' },
      { id:'armor',      name:'Armor Shop',    x:1,  y:17, w:4, h:4, color:'#335533', roofColor:'#113311', icon:'🛡️', desc:'Buy Armor' },
      { id:'potion',     name:'Potion Shop',   x:8,  y:17, w:4, h:4, color:'#336655', roofColor:'#114433', icon:'🧪', desc:'Buy Potions' },
      { id:'magic',      name:'Magic Shop',    x:20, y:2,  w:4, h:4, color:'#443366', roofColor:'#221144', icon:'✨', desc:'Buy Spells' },
      { id:'material',   name:'Material Shop', x:25, y:2,  w:4, h:4, color:'#664433', roofColor:'#442211', icon:'💎', desc:'Buy Materials' },
      { id:'crafting',   name:'Crafting',      x:20, y:17, w:4, h:4, color:'#665533', roofColor:'#443311', icon:'🔨', desc:'Forge Items' },
      { id:'party_mgmt', name:'Party',         x:25, y:17, w:4, h:4, color:'#334455', roofColor:'#112233', icon:'👥', desc:'Manage Party' },
    ];

    const stream = [];
    for (let y = 0; y < H; y++) stream.push({ x:30, y });
    const bridge = [{ x:30, y:12 },{ x:30, y:13 }];

    // Dense forest around perimeter
    const treePosns = [];
    for (let x = 0; x < W; x++) { treePosns.push([x, 0]); treePosns.push([x, 1]); }
    for (let y = 0; y < H; y++) { treePosns.push([0, y]); treePosns.push([1, y]); treePosns.push([W-1, y]); treePosns.push([W-2, y]); }
    treePosns.push(...[
      [4,6],[5,6],[6,6],[10,4],[11,4],[12,4],[13,4],[14,4],
      [18,4],[19,4],[20,8],[21,8],[22,8],[23,8],[24,8],
      [4,22],[5,22],[13,25],[14,25],[15,25],[16,25],[17,25],[18,25],
      [25,10],[26,10],[27,10],[28,10],[31,5],[32,5],[31,10],[32,10],
      [31,16],[32,16],[31,20],[32,20],
    ]);
    const trees = this._addTrees(grid, treePosns);

    return { grid, buildings, trees, stream, bridge, playerStart: { x: 16, y: 12 } };
  }

  // ── Layout 3: Saltport – coastal town, water on south edge ──────────────

  _layoutSaltport() {
    const W = this.width, H = this.height;
    const grid = this._emptyGrid();

    // Harbor (water) across bottom
    for (let x = 0; x < W; x++) {
      grid[H-1][x] = 4; grid[H-2][x] = 4; grid[H-3][x] = 4;
      grid[H-4][x] = 4;
    }
    // Docks (bridge tiles)
    for (let x = 6; x <= 8; x++) { grid[H-4][x] = 5; grid[H-3][x] = 5; }
    for (let x = 16; x <= 18; x++) { grid[H-4][x] = 5; grid[H-3][x] = 5; }
    for (let x = 26; x <= 28; x++) { grid[H-4][x] = 5; grid[H-3][x] = 5; }

    // Main road parallel to harbor
    this._road(grid, 0, H-6, W-1, H-6);
    this._road(grid, 0, H-7, W-1, H-7);

    // Streets going up
    this._road(grid, 7, 0, 7, H-7);
    this._road(grid, 8, 0, 8, H-7);
    this._road(grid, 17, 0, 17, H-7);
    this._road(grid, 18, 0, 18, H-7);
    this._road(grid, 27, 0, 27, H-7);
    this._road(grid, 28, 0, 28, H-7);

    // Cross streets
    this._road(grid, 0, 5, W-1, 5);
    this._road(grid, 0, 12, W-1, 12);
    // Central plaza
    this._square(grid, 15, 10, 21, 15);
    this._addGrassVariation(grid);

    const buildings = [
      { id:'inn',        name:'Inn',           x:1,  y:1,  w:4, h:4, color:'#7a6644', roofColor:'#553322', icon:'🏨', desc:'Rest & Save' },
      { id:'weapon',     name:'Weapon Shop',   x:10, y:1,  w:4, h:4, color:'#663333', roofColor:'#441111', icon:'⚔️', desc:'Buy Weapons' },
      { id:'armor',      name:'Armor Shop',    x:1,  y:7,  w:4, h:4, color:'#335533', roofColor:'#113311', icon:'🛡️', desc:'Buy Armor' },
      { id:'potion',     name:'Potion Shop',   x:10, y:7,  w:4, h:4, color:'#336655', roofColor:'#114433', icon:'🧪', desc:'Buy Potions' },
      { id:'magic',      name:'Magic Shop',    x:20, y:1,  w:4, h:4, color:'#443366', roofColor:'#221144', icon:'✨', desc:'Buy Spells' },
      { id:'material',   name:'Material Shop', x:29, y:1,  w:4, h:4, color:'#664433', roofColor:'#442211', icon:'💎', desc:'Buy Materials' },
      { id:'crafting',   name:'Crafting',      x:20, y:7,  w:4, h:4, color:'#665533', roofColor:'#443311', icon:'🔨', desc:'Forge Items' },
      { id:'party_mgmt', name:'Party',         x:29, y:7,  w:4, h:4, color:'#334455', roofColor:'#112233', icon:'👥', desc:'Manage Party' },
    ];

    // Harbor water
    const stream = [];
    for (let x = 0; x < W; x++)
      for (let row = H-4; row < H; row++)
        stream.push({ x, y: row });

    const treePosns = [
      [0,13],[0,14],[0,15],[0,16],[0,17],[0,18],[0,19],
      [W-1,13],[W-1,14],[W-1,15],[W-1,16],[W-1,17],[W-1,18],[W-1,19],
      [1,14],[2,14],[1,16],[2,16],[1,18],[2,18],
      [33,14],[34,14],[33,16],[34,16],[33,18],[34,18],
      [4,0],[5,0],[12,0],[13,0],[22,0],[23,0],[31,0],[32,0],
      [4,6],[5,6],[12,6],[13,6],[22,6],[23,6],[31,6],[32,6],
      [13,13],[14,13],[22,13],[23,13],[13,16],[14,16],[22,16],[23,16],
    ];
    const trees = this._addTrees(grid, treePosns);

    return { grid, buildings, trees, stream, bridge: [], playerStart: { x: 17, y: 11 } };
  }

  // ── Common API ──────────────────────────────────────────────────────────

  getBuildingAt(tx, ty) {
    return this.buildings.find(b =>
      tx >= b.x && tx < b.x + b.w && ty >= b.y && ty < b.y + b.h
    );
  }

  isWalkable(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return false;
    const tile = this.grid[ty][tx];
    // Water is not walkable unless it's a bridge/dock tile
    if (tile === 4) return false;
    // Check if inside a building
    for (const b of this.buildings) {
      if (tx >= b.x && tx < b.x + b.w && ty >= b.y && ty < b.y + b.h) return false;
    }
    // Trees block movement
    if (this.trees && this.trees.some(t => t.x === tx && t.y === ty)) return false;
    return true;
  }
}
