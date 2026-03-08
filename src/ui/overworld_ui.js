import { OTILE, OTILE_WALKABLE, OTILE_WALL_H, OTILE_COLOR, OTILE_NAME } from '../world/overworld_tile.js';
import { OverworldGenerator, TOWN_DATA, CAVE_DATA, SPECIAL_DATA } from '../world/overworld_generator.js';
import { Enemy } from '../entities/enemy.js';

// Isometric tile dimensions (screen pixels)
const TW   = 64;   // full tile width  (diamond width)
const TH   = 32;   // full tile height (diamond height, before walls)
const HW   = TW / 2;
const HH   = TH / 2;

export class OverworldUI {
  constructor(game) {
    this.game       = game;
    this.animTime   = 0;
    this.moveDelay  = 0;
    this.message    = '';
    this.messageTimer = 0;
    this.stepCounter  = 0;
    this.gen = new OverworldGenerator();
    this.collectedTreasures = new Set();
    this.visitedSpecials    = new Set();
    this._pendingActionKey  = null;
    this.showMinimap        = true;
  }

  onEnter(data) {
    const ow = this.game.overworld;
    if (!ow) return;

    // Restore position if provided (e.g. returning from cave/town)
    if (data && data.restorePos) {
      this.game.overworldX = data.restorePos.x;
      this.game.overworldY = data.restorePos.y;
    }

    this.gen.updateFogOfWar(ow.fog, this.game.overworldX, this.game.overworldY);

    if (data && data.fromCave) {
      this.message = 'You emerge from the depths into the open air.';
      this.messageTimer = 3;
    } else if (data && data.fromTown) {
      this.message = 'You leave town and step into the overworld.';
      this.messageTimer = 2;
    } else {
      this.message = 'Explore the world — find towns, caves, and hidden secrets!';
      this.messageTimer = 4;
    }
  }

  update(dt) {
    this.animTime   += dt;
    this.moveDelay   = Math.max(0, this.moveDelay - dt);
    if (this.messageTimer > 0) this.messageTimer -= dt;

    const input = this.game.input;
    if (input.isKeyJustPressed('KeyI')) { this.game.openInventory('OVERWORLD'); return; }
    if (input.isKeyJustPressed('KeyM')) { this.showMinimap = !this.showMinimap; }

    if (this.moveDelay > 0) return;

    const { dx, dy } = input.getMoveDir();
    if (dx !== 0 || dy !== 0) this._tryMove(dx, dy);

    // Click-to-move (tap nearest reachable adjacent tile)
    if (input.wasClicked()) {
      this._handleClick({ x: input.mouse.x, y: input.mouse.y });
    }
  }

  _tryMove(dx, dy) {
    const ow   = this.game.overworld;
    if (!ow) return;
    const nx = this.game.overworldX + dx;
    const ny = this.game.overworldY + dy;
    if (nx < 0 || ny < 0 || nx >= ow.width || ny >= ow.height) return;
    const tile = ow.grid[ny][nx];
    if (!OTILE_WALKABLE[tile]) { this.moveDelay = 0.08; return; }

    this.game.overworldX = nx;
    this.game.overworldY = ny;
    this.moveDelay = 0.14;
    this.stepCounter++;

    this.gen.updateFogOfWar(ow.fog, nx, ny);
    this._checkTile(nx, ny, tile);

    // Random overworld encounter — roughly 1 per 20-30 steps
    if (this.stepCounter % (20 + Math.floor(Math.random() * 11)) === 0 &&
        (tile === OTILE.GRASS || tile === OTILE.DEEP_GRASS || tile === OTILE.FOREST || tile === OTILE.SAND)) {
      this._triggerEncounter(1);  // low-level overworld monsters
    }
  }

  _checkTile(x, y, tile) {
    const key = `${x},${y}`;

    if (tile === OTILE.TOWN) {
      const ow = this.game.overworld;
      const idx = ow.towns.findIndex(t => t.x === x && t.y === y);
      this.game.enterTownAt(idx >= 0 ? idx : 0, x, y);

    } else if (tile === OTILE.CAVE) {
      const ow = this.game.overworld;
      const idx = ow.caves.findIndex(c => c.x === x && c.y === y);
      const caveIdx = idx >= 0 ? idx : 0;
      const data = CAVE_DATA[caveIdx] || CAVE_DATA[0];
      this.message = `Entering ${data.name}…`;
      this.messageTimer = 1;
      setTimeout(() => this.game.enterCave(caveIdx, x, y), 600);

    } else if (tile === OTILE.TREASURE && !this.collectedTreasures.has(key)) {
      this.collectedTreasures.add(key);
      this._collectTreasure(x, y);

    } else if (tile === OTILE.SPECIAL && !this.visitedSpecials.has(key)) {
      this.visitedSpecials.add(key);
      this._triggerSpecial(x, y);
    }
  }

  _handleClick(pos) {
    // Translate screen click to nearest adjacent direction
    const W = this.game.canvas.width, H = this.game.canvas.height;
    const px = this.game.overworldX, py = this.game.overworldY;
    const [sx, sy] = this._tileToScreen(px, py, W, H);
    const relX = pos.x - sx, relY = pos.y - sy;
    // Dominant axis determines movement direction
    if (Math.abs(relX) > Math.abs(relY)) {
      this._tryMove(relX > 0 ? 1 : -1, 0);
    } else {
      this._tryMove(0, relY > 0 ? 1 : -1);
    }
  }

  _collectTreasure(x, y) {
    const party = this.game.party;
    const gold  = 30 + Math.floor(Math.random() * 70);
    party.gold += gold;
    const items = ['health_potion','mana_potion','iron_ingot','fire_ruby','aqua_pearl','volt_shard','terra_stone','scroll_precision'];
    const item  = items[Math.floor(Math.random() * items.length)];
    party.inventory.addItem(item, 1);
    this.message = `Hidden treasure! Found ${gold}g and ${item.replace(/_/g,' ')}!`;
    this.messageTimer = 3;
    // Remove from grid visually
    this.game.overworld.grid[y][x] = OTILE.GRASS;
  }

  _triggerSpecial(x, y) {
    const ow  = this.game.overworld;
    const idx = ow.specials.findIndex(s => s.x === x && s.y === y);
    const data = SPECIAL_DATA[idx >= 0 ? idx : 0] || { name: 'Ancient Ruins', desc: 'Nothing but stones and shadows.' };
    const bonuses = ['atk','def','spd','maxHp','maxMp'];
    const stat = bonuses[Math.floor(Math.random() * bonuses.length)];
    this.game.party.members.forEach(m => { m[stat] = (m[stat] || 0) + 3; });
    const expGain = 100 + Math.floor(Math.random() * 150);
    this.game.party.giveExp(expGain);
    this.message = `${data.name}: ${data.desc}  Party gains +3 ${stat} and ${expGain} EXP!`;
    this.messageTimer = 5;
  }

  _triggerEncounter(floorHint) {
    const floor = Math.max(1, Math.min(5, floorHint)); // overworld = low-level
    const enemies = Enemy.generateEncounter(floor, false);
    if (enemies.length > 0) {
      this.game.startBattle(enemies, false);
    }
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  render(r) {
    const W = r.width, H = r.height;
    const ow = this.game.overworld;
    if (!ow) {
      r.drawTextCentered('Generating world…', W / 2, H / 2, '#fff', 24);
      return;
    }

    // Sky gradient background
    r.ctx.save();
    const sky = r.ctx.createLinearGradient(0, 0, 0, H * 0.6);
    sky.addColorStop(0, '#1a1040');
    sky.addColorStop(1, '#2a3060');
    r.ctx.fillStyle = sky;
    r.ctx.fillRect(0, 0, W, H);
    r.ctx.restore();

    // Distant horizon fog strip
    r.ctx.save();
    r.ctx.globalAlpha = 0.3;
    r.drawRect(0, H * 0.35, W, H * 0.15, '#6688aa');
    r.ctx.restore();

    this._renderIsoWorld(r, W, H, ow);
    this._renderMinimap(r, W, H, ow);
    this._renderHUD(r, W, H, ow);
  }

  /** Convert tile grid position → screen pixel position (isometric) */
  _tileToScreen(tx, ty, W, H) {
    const px = this.game.overworldX, py = this.game.overworldY;
    // Camera follows player; player always appears near centre
    const camOffX = (px - py) * HW;
    const camOffY = (px + py) * HH;
    const sx = (tx - ty) * HW + W / 2 - camOffX;
    const sy = (tx + ty) * HH + H * 0.45 - camOffY;
    return [sx, sy];
  }

  _renderIsoWorld(r, W, H, ow) {
    const ctx = r.ctx;

    // Painter's algorithm: render from farthest (smallest tx+ty) to nearest
    for (let d = 0; d < ow.width + ow.height - 1; d++) {
      for (let tx = Math.max(0, d - ow.height + 1); tx <= Math.min(d, ow.width - 1); tx++) {
        const ty = d - tx;
        if (ty < 0 || ty >= ow.height) continue;

        const fog = ow.fog[ty]?.[tx] ?? 0;
        if (fog === 0) continue;     // unexplored: invisible

        const [sx, sy] = this._tileToScreen(tx, ty, W, H);

        // Coarse frustum cull
        if (sx < -TW - 60 || sx > W + TW || sy < -TH - 60 || sy > H + 80) continue;

        const tile = ow.grid[ty][tx];
        const col  = OTILE_COLOR[tile] || OTILE_COLOR[OTILE.GRASS];
        const wallH = OTILE_WALL_H[tile] || 6;
        const alpha = fog === 1 ? 0.45 : 1.0;

        ctx.save();
        ctx.globalAlpha = alpha;
        this._drawIsoTile(ctx, sx, sy, wallH, col.top, col.left, col.right, tile);
        ctx.restore();
      }
    }

    // Draw player sprite on top
    this._renderPlayer(r, W, H);
  }

  /** Draw one isometric tile as a 3-faced cube */
  _drawIsoTile(ctx, sx, sy, wallH, topCol, leftCol, rightCol, tileType) {
    // Top face — diamond shape
    ctx.beginPath();
    ctx.moveTo(sx,       sy);           // north
    ctx.lineTo(sx + HW,  sy + HH);      // east
    ctx.lineTo(sx,       sy + TH);      // south
    ctx.lineTo(sx - HW,  sy + HH);      // west
    ctx.closePath();
    ctx.fillStyle = topCol;
    ctx.fill();

    if (wallH > 0) {
      // Left face (south-west wall)
      ctx.beginPath();
      ctx.moveTo(sx - HW, sy + HH);
      ctx.lineTo(sx,      sy + TH);
      ctx.lineTo(sx,      sy + TH + wallH);
      ctx.lineTo(sx - HW, sy + HH + wallH);
      ctx.closePath();
      ctx.fillStyle = leftCol;
      ctx.fill();

      // Right face (south-east wall)
      ctx.beginPath();
      ctx.moveTo(sx + HW, sy + HH);
      ctx.lineTo(sx,      sy + TH);
      ctx.lineTo(sx,      sy + TH + wallH);
      ctx.lineTo(sx + HW, sy + HH + wallH);
      ctx.closePath();
      ctx.fillStyle = rightCol;
      ctx.fill();
    }

    // Outline for visual separation
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(sx,       sy);
    ctx.lineTo(sx + HW,  sy + HH);
    ctx.lineTo(sx,       sy + TH);
    ctx.lineTo(sx - HW,  sy + HH);
    ctx.closePath();
    ctx.stroke();

    // Decorative overlays for special tiles
    this._drawTileDecal(ctx, sx, sy, tileType);
  }

  /** Extra decorations drawn on top of the base tile */
  _drawTileDecal(ctx, sx, sy, tileType) {
    const cy = sy + HH;      // vertical centre of top face
    const t  = this.animTime;

    if (tileType === OTILE.FOREST) {
      // Tree canopy
      ctx.beginPath();
      ctx.moveTo(sx, sy - 22);
      ctx.lineTo(sx - 14, sy + HH - 2);
      ctx.lineTo(sx + 14, sy + HH - 2);
      ctx.closePath();
      ctx.fillStyle = '#1a5c14';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx, sy - 32);
      ctx.lineTo(sx - 10, sy - 8);
      ctx.lineTo(sx + 10, sy - 8);
      ctx.closePath();
      ctx.fillStyle = '#205c1a';
      ctx.fill();

    } else if (tileType === OTILE.TOWN) {
      // Mini building silhouette
      ctx.fillStyle = '#3a2860';
      ctx.fillRect(sx - 10, sy - 18, 20, 20);
      ctx.fillStyle = '#553388';
      ctx.fillRect(sx - 8,  sy - 16, 16, 14);
      // Roof triangle
      ctx.beginPath();
      ctx.moveTo(sx, sy - 22);
      ctx.lineTo(sx - 12, sy - 18);
      ctx.lineTo(sx + 12, sy - 18);
      ctx.closePath();
      ctx.fillStyle = '#aa66ff';
      ctx.fill();
      // Animated window glow
      const glow = 0.5 + 0.5 * Math.sin(t * 1.5 + sx * 0.1);
      ctx.globalAlpha *= (0.7 + glow * 0.3);
      ctx.fillStyle = '#ffe880';
      ctx.fillRect(sx - 4,  sy - 12, 5, 5);
      ctx.fillRect(sx + 1,  sy - 12, 5, 5);
      ctx.globalAlpha = ctx.globalAlpha; // unchanged (just for clarity)

    } else if (tileType === OTILE.CAVE) {
      // Cave arch
      ctx.fillStyle = '#0d0a08';
      ctx.beginPath();
      ctx.ellipse(sx, sy + 2, 14, 10, 0, Math.PI, 0, true);
      ctx.fill();
      ctx.fillStyle = '#1a120e';
      ctx.beginPath();
      ctx.ellipse(sx, sy + 2, 10, 7, 0, Math.PI, 0, true);
      ctx.fill();
      // Stalactites
      [sx - 6, sx, sx + 6].forEach(cx => {
        ctx.fillStyle = '#403028';
        ctx.beginPath();
        ctx.moveTo(cx - 2, sy - 8);
        ctx.lineTo(cx + 2, sy - 8);
        ctx.lineTo(cx,     sy - 2);
        ctx.closePath();
        ctx.fill();
      });

    } else if (tileType === OTILE.MOUNTAIN || tileType === OTILE.SNOW_MOUNTAIN) {
      // Mountain peak
      ctx.beginPath();
      ctx.moveTo(sx, sy - 38);
      ctx.lineTo(sx - 18, sy + HH);
      ctx.lineTo(sx + 18, sy + HH);
      ctx.closePath();
      ctx.fillStyle = tileType === OTILE.SNOW_MOUNTAIN ? '#d8d0e8' : '#706060';
      ctx.fill();
      if (tileType === OTILE.SNOW_MOUNTAIN) {
        ctx.beginPath();
        ctx.moveTo(sx, sy - 38);
        ctx.lineTo(sx - 8, sy - 22);
        ctx.lineTo(sx + 8, sy - 22);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }

    } else if (tileType === OTILE.SPECIAL) {
      // Ancient pillar ruins
      const pulse = 0.6 + 0.4 * Math.abs(Math.sin(t * 0.8));
      ctx.fillStyle = `rgba(200,168,32,${pulse})`;
      ctx.fillRect(sx - 6,  sy - 20, 6, 20);
      ctx.fillRect(sx + 2,  sy - 14, 5, 14);
      ctx.fillRect(sx - 8,  sy - 22, 10, 4);
      ctx.fillStyle = '#c8a820';
      ctx.beginPath();
      ctx.arc(sx, sy - 24, 4, 0, Math.PI * 2);
      ctx.fill();

    } else if (tileType === OTILE.TREASURE) {
      // Glowing chest
      const shine = 0.7 + 0.3 * Math.sin(t * 2.5);
      ctx.fillStyle = '#8b6000';
      ctx.fillRect(sx - 8, sy - 10, 16, 10);
      ctx.fillStyle = `rgba(255,220,30,${shine})`;
      ctx.fillRect(sx - 7, sy - 10, 14, 4);
      ctx.fillStyle = '#ffdd22';
      ctx.beginPath();
      ctx.arc(sx, sy - 6, 2, 0, Math.PI * 2);
      ctx.fill();

    } else if (tileType === OTILE.WATER) {
      // Animated ripples
      const wave = 0.3 + 0.1 * Math.sin(t * 1.8 + sx * 0.05);
      ctx.strokeStyle = `rgba(100,200,255,${wave})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(sx, cy, HW * 0.5, HH * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  _renderPlayer(r, W, H) {
    const ctx = r.ctx;
    const px = this.game.overworldX, py = this.game.overworldY;
    const [sx, sy] = this._tileToScreen(px, py, W, H);
    const bob = Math.sin(this.animTime * 3) * 2;

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(sx, sy + TH * 0.85, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Body
    ctx.fillStyle = '#4488ff';
    ctx.fillRect(sx - 8,  sy - 10 + bob, 16, 20);
    // Head
    ctx.fillStyle = '#ffcc99';
    ctx.beginPath();
    ctx.arc(sx, sy - 16 + bob, 8, 0, Math.PI * 2);
    ctx.fill();
    // Glow aura
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#4488ff';
    ctx.beginPath();
    ctx.arc(sx, sy - 8 + bob, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _renderMinimap(r, W, H, ow) {
    const mmSize = 140, ts = 2.5;
    const mmX = W - mmSize - 10, mmY = 10;
    r.drawRoundRect(mmX - 2, mmY - 2, mmSize + 4, mmSize + 4, 3, 'rgba(0,0,0,0.8)', '#445566', 1);

    const px = this.game.overworldX, py = this.game.overworldY;
    const startTX = px - Math.floor(mmSize / ts / 2);
    const startTY = py - Math.floor(mmSize / ts / 2);

    for (let ty = 0; ty < mmSize / ts; ty++) {
      for (let tx = 0; tx < mmSize / ts; tx++) {
        const gx = startTX + tx, gy = startTY + ty;
        if (gx < 0 || gy < 0 || gx >= ow.width || gy >= ow.height) continue;
        const fog = ow.fog[gy]?.[gx] ?? 0;
        if (fog === 0) continue;
        const tile = ow.grid[gy][gx];
        const col  = OTILE_COLOR[tile]?.top || '#334455';
        const alpha = fog === 1 ? 0.5 : 1;
        r.ctx.save(); r.ctx.globalAlpha = alpha;
        r.drawRect(mmX + tx * ts, mmY + ty * ts, ts, ts, col);
        r.ctx.restore();
      }
    }
    // Player dot
    const pdx = (px - startTX) * ts + mmX;
    const pdy = (py - startTY) * ts + mmY;
    r.drawRect(pdx - 1, pdy - 1, ts + 2, ts + 2, '#ffffff');
    r.drawText('Map', mmX + 4, mmY + 4, '#8899bb', 10);
  }

  _renderHUD(r, W, H, ow) {
    // Bottom bar
    r.drawRoundRect(0, H - 72, W, 72, 0, 'rgba(0,0,10,0.88)', '#223', 1);
    const party = this.game.party;
    if (party) {
      party.members.forEach((m, i) => {
        const bx = 10 + i * 195;
        r.drawText(`${m.name} Lv${m.level}`, bx, H - 68, m.alive ? '#ffffff' : '#664444', 12, 'left', 'monospace', true);
        r.drawBar(bx, H - 52, 175, 9, m.hp, m.maxHp, m.hp / m.maxHp < 0.3 ? '#ff4444' : '#44aa44');
        r.drawBar(bx, H - 40, 175, 9, m.mp, m.maxMp, '#4488cc');
      });
      r.drawText(`💰 ${party.gold}g`, W - 150, H - 68, '#ffdd44', 14, 'left', 'monospace', true);
    }

    // Tile label under cursor / current position
    const tile = ow.grid[this.game.overworldY]?.[this.game.overworldX];
    const tileName = OTILE_NAME[tile] || '';
    r.drawText(tileName, W / 2, H - 68, '#aabbcc', 13, 'center', 'monospace', true);
    r.drawText('WASD:Move  I:Inventory  M:Minimap', W / 2, H - 22, '#445566', 12, 'center');

    // Message overlay
    if (this.messageTimer > 0) {
      const alpha = Math.min(1, this.messageTimer * 2);
      r.ctx.save(); r.ctx.globalAlpha = alpha;
      r.drawRoundRect(W / 2 - 320, 18, 640, 36, 6, '#0a0a2a', '#5566aa', 1);
      r.drawTextCentered(this.message, W / 2, 28, '#ffffff', 14);
      r.ctx.restore();
    }
  }
}
