import { TILE } from './tile.js';

export class DungeonGenerator {
  constructor() {
    this.width = 50;
    this.height = 50;
  }

  generate(floor) {
    const grid = this._makeGrid();
    const rooms = this._bspSplit({ x:1, y:1, w:this.width-2, h:this.height-2 }, 0, 5);
    rooms.forEach(room => this._carveRoom(grid, room));
    this._connectRooms(grid, rooms);
    this._placeTiles(grid, rooms, floor);

    // Fog of war: 0=unexplored, 1=explored, 2=visible
    const fog = Array.from({ length: this.height }, () => new Array(this.width).fill(0));

    return {
      grid, fog, rooms,
      width: this.width, height: this.height,
      startPos: { x: rooms[0].cx, y: rooms[0].cy },
      endPos: { x: rooms[rooms.length-1].cx, y: rooms[rooms.length-1].cy },
      floor
    };
  }

  _makeGrid() {
    return Array.from({ length: this.height }, () => new Array(this.width).fill(TILE.WALL));
  }

  _bspSplit(rect, depth, maxDepth) {
    if (depth >= maxDepth || rect.w < 10 || rect.h < 10) {
      // Leaf node - create room
      const margin = 2;
      const rw = Math.max(4, Math.floor(Math.random() * (rect.w - margin*2 - 3)) + 3);
      const rh = Math.max(4, Math.floor(Math.random() * (rect.h - margin*2 - 3)) + 3);
      const rx = rect.x + margin + Math.floor(Math.random() * (rect.w - rw - margin*2 + 1));
      const ry = rect.y + margin + Math.floor(Math.random() * (rect.h - rh - margin*2 + 1));
      return [{ x: rx, y: ry, w: rw, h: rh, cx: Math.floor(rx + rw/2), cy: Math.floor(ry + rh/2) }];
    }

    const horizontal = rect.w > rect.h ? false : rect.h > rect.w ? true : Math.random() > 0.5;
    let left, right;
    if (horizontal) {
      const split = Math.floor(rect.h * 0.3 + Math.random() * rect.h * 0.4);
      left  = { x: rect.x, y: rect.y, w: rect.w, h: split };
      right = { x: rect.x, y: rect.y + split, w: rect.w, h: rect.h - split };
    } else {
      const split = Math.floor(rect.w * 0.3 + Math.random() * rect.w * 0.4);
      left  = { x: rect.x, y: rect.y, w: split, h: rect.h };
      right = { x: rect.x + split, y: rect.y, w: rect.w - split, h: rect.h };
    }
    return [...this._bspSplit(left, depth+1, maxDepth), ...this._bspSplit(right, depth+1, maxDepth)];
  }

  _carveRoom(grid, room) {
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
          grid[y][x] = TILE.FLOOR;
        }
      }
    }
  }

  _connectRooms(grid, rooms) {
    for (let i = 0; i < rooms.length - 1; i++) {
      const a = rooms[i], b = rooms[i+1];
      this._carveCorridor(grid, a.cx, a.cy, b.cx, b.cy);
    }
  }

  _carveCorridor(grid, x1, y1, x2, y2) {
    // L-shaped corridor
    let x = x1, y = y1;
    while (x !== x2) {
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        grid[y][x] = TILE.FLOOR;
      }
      x += x < x2 ? 1 : -1;
    }
    while (y !== y2) {
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        grid[y][x] = TILE.FLOOR;
      }
      y += y < y2 ? 1 : -1;
    }
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      grid[y][x] = TILE.FLOOR;
    }
  }

  _placeTiles(grid, rooms, floor) {
    const numRooms = rooms.length;
    // Stairs down in last room
    const lastRoom = rooms[numRooms - 1];
    grid[lastRoom.cy][lastRoom.cx] = TILE.STAIRS_DOWN;
    // Stairs up in first room (to town on floor 1)
    const firstRoom = rooms[0];
    grid[firstRoom.cy][firstRoom.cx] = TILE.STAIRS_UP;

    // Scatter special tiles in middle rooms
    const midRooms = rooms.slice(1, -1);
    const shuffle = arr => { for (let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];} return arr; };
    shuffle(midRooms);

    let idx = 0;
    // Treasure chests
    const chestCount = Math.min(3, midRooms.length);
    for (let i = 0; i < chestCount && idx < midRooms.length; i++, idx++) {
      const r = midRooms[idx];
      const cx = r.x + 1 + Math.floor(Math.random() * (r.w - 2));
      const cy = r.y + 1 + Math.floor(Math.random() * (r.h - 2));
      grid[cy][cx] = TILE.TREASURE_CHEST;
    }
    // Healing fountain
    if (idx < midRooms.length) {
      const r = midRooms[idx++];
      grid[r.cy][r.cx] = TILE.HEALING_FOUNTAIN;
    }
    // Traps
    const trapCount = Math.min(2, midRooms.length - idx);
    for (let i = 0; i < trapCount && idx < midRooms.length; i++, idx++) {
      const r = midRooms[idx];
      const tx = r.x + 1 + Math.floor(Math.random() * (r.w - 2));
      const ty = r.y + 1 + Math.floor(Math.random() * (r.h - 2));
      grid[ty][tx] = TILE.TRAP;
    }
    // Crafting station every 3 floors
    if (floor % 3 === 0 && idx < midRooms.length) {
      const r = midRooms[idx++];
      grid[r.cy][r.cx] = TILE.CRAFTING_STATION;
    }
    // Shop every 5 floors
    if (floor % 5 === 0 && idx < midRooms.length) {
      const r = midRooms[idx++];
      grid[r.cy][r.cx] = TILE.SHOP;
    }
    // Doors at corridor junctions
    this._placeDoors(grid);
  }

  _placeDoors(grid) {
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (grid[y][x] === TILE.FLOOR) {
          const n = grid[y-1][x], s = grid[y+1][x], w = grid[y][x-1], e = grid[y][x+1];
          const wallCount = [n,s,w,e].filter(t => t === TILE.WALL).length;
          if (wallCount === 2 && Math.random() < 0.05) {
            grid[y][x] = TILE.DOOR;
          }
        }
      }
    }
  }

  updateFogOfWar(fog, px, py, radius = 5) {
    // Reset visible to explored
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (fog[y][x] === 2) fog[y][x] = 1;
      }
    }
    // Reveal new area
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = px + dx, ny = py + dy;
        if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;
        if (dx*dx + dy*dy <= radius*radius) {
          fog[ny][nx] = 2;
        }
      }
    }
  }
}
