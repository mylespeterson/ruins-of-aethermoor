import { OTILE, OTILE_WALKABLE, OTILE_COLOR, OTILE_NAME } from '../world/overworld_tile.js';
import { OverworldGenerator, TOWN_DATA, CAVE_DATA, SPECIAL_DATA } from '../world/overworld_generator.js';
import { Enemy } from '../entities/enemy.js';

// Top-down tile size (matches town view)
const TS = 32;

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
    this.facing = 'down';
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

    // Click-to-move
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

    // Update facing direction
    if (dy < 0) this.facing = 'up';
    else if (dy > 0) this.facing = 'down';
    else if (dx < 0) this.facing = 'left';
    else if (dx > 0) this.facing = 'right';

    this.game.overworldX = nx;
    this.game.overworldY = ny;
    this.moveDelay = 0.14;
    this.stepCounter++;

    this.gen.updateFogOfWar(ow.fog, nx, ny);
    this._checkTile(nx, ny, tile);

    // Random overworld encounter — roughly 1 per 20-30 steps, tile-based enemy selection
    if (this.stepCounter % (20 + Math.floor(Math.random() * 11)) === 0 &&
        (tile === OTILE.GRASS || tile === OTILE.DEEP_GRASS || tile === OTILE.FOREST || tile === OTILE.SAND)) {
      this._triggerEncounter(tile);
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
      this.message = `Entering ${data.name}...`;
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
    const W = this.game.canvas.width, H = this.game.canvas.height;
    const px = this.game.overworldX, py = this.game.overworldY;
    const camX = px * TS - W / 2 + TS / 2;
    const camY = py * TS - H / 2 + TS / 2;
    const tx = Math.floor((pos.x + camX) / TS);
    const ty = Math.floor((pos.y + camY) / TS);
    const ddx = Math.sign(tx - px);
    const ddy = Math.sign(ty - py);
    if (Math.abs(tx - px) > Math.abs(ty - py)) {
      if (ddx !== 0) this._tryMove(ddx, 0);
    } else {
      if (ddy !== 0) this._tryMove(0, ddy);
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

  _triggerEncounter(tileType) {
    // Pick enemies based on overworld tile type for variety
    const AREA_ENEMIES = {
      [OTILE.GRASS]:      ['giant_rat','goblin_scout','green_slime','cave_bat'],
      [OTILE.DEEP_GRASS]: ['goblin_scout','green_slime','shadow_wolf','giant_rat'],
      [OTILE.FOREST]:     ['shadow_wolf','cave_bat','green_slime','goblin_scout'],
      [OTILE.SAND]:       ['giant_rat','red_slime','blue_slime','cave_bat'],
    };
    const ENEMY_IDS = AREA_ENEMIES[tileType] || AREA_ENEMIES[OTILE.GRASS];
    const count = 1 + Math.floor(Math.random() * 3);
    const enemies = [];
    for (let i = 0; i < count; i++) {
      const id = ENEMY_IDS[Math.floor(Math.random() * ENEMY_IDS.length)];
      try { enemies.push(new Enemy(id, 1)); } catch(e) { /* skip unknown id */ }
    }
    if (enemies.length > 0) {
      this.game.startBattle(enemies, false);
    }
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  render(r) {
    const W = r.width, H = r.height;
    const ow = this.game.overworld;
    if (!ow) {
      r.drawTextCentered('Generating world...', W / 2, H / 2, '#fff', 24);
      return;
    }

    const px = this.game.overworldX, py = this.game.overworldY;
    const camX = px * TS - W / 2 + TS / 2;
    const camY = py * TS - H / 2 + TS / 2;
    const ctx = r.ctx;

    // Background
    r.drawRect(0, 0, W, H, '#1a2a10');

    // Draw terrain tiles (top-down, same as town view)
    for (let ty = 0; ty < ow.height; ty++) {
      for (let tx = 0; tx < ow.width; tx++) {
        const sx = tx * TS - camX;
        const sy = ty * TS - camY;
        if (sx < -TS || sx > W || sy < -TS || sy > H) continue;

        const fog = ow.fog[ty]?.[tx] ?? 0;
        if (fog === 0) {
          // Completely unexplored: dark
          r.drawRect(sx, sy, TS, TS, '#050a05');
          continue;
        }

        const tile = ow.grid[ty][tx];
        ctx.save();
        if (fog === 1) ctx.globalAlpha = 0.5;
        this._drawTopDownTile(r, ctx, sx, sy, tx, ty, tile);
        ctx.restore();
      }
    }

    // Player sprite
    this._renderTopDownPlayer(r, ctx, W, H, camX, camY);

    this._renderMinimap(r, W, H, ow);
    this._renderHUD(r, W, H, ow);
  }

  _drawTopDownTile(r, ctx, sx, sy, tx, ty, tileType) {
    const col = OTILE_COLOR[tileType] || OTILE_COLOR[OTILE.GRASS];
    r.drawRect(sx, sy, TS, TS, col.top || '#2d5a1a');

    // Subtle tile border
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(sx, sy, TS, TS);

    // Decorative overlays
    this._drawTopDownDecal(r, ctx, sx, sy, tileType);
  }

  _drawTopDownDecal(r, ctx, sx, sy, tileType) {
    const t = this.animTime;
    const cx = sx + TS / 2, cy = sy + TS / 2;

    if (tileType === OTILE.FOREST) {
      // Tree canopy (top-down circle)
      ctx.fillStyle = '#1a5c14';
      ctx.beginPath(); ctx.arc(cx, cy, TS * 0.38, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#205c1a';
      ctx.beginPath(); ctx.arc(cx - 4, cy - 4, TS * 0.22, 0, Math.PI * 2); ctx.fill();
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath(); ctx.arc(cx - 5, cy - 6, TS * 0.10, 0, Math.PI * 2); ctx.fill();

    } else if (tileType === OTILE.MOUNTAIN || tileType === OTILE.SNOW_MOUNTAIN) {
      const snowColor = tileType === OTILE.SNOW_MOUNTAIN ? '#e8eeff' : '#a09080';
      const darkColor = tileType === OTILE.SNOW_MOUNTAIN ? '#c0c8e8' : '#706060';
      ctx.fillStyle = darkColor;
      ctx.beginPath();
      ctx.moveTo(cx, sy + 3); ctx.lineTo(sx + TS - 4, sy + TS - 4); ctx.lineTo(sx + 4, sy + TS - 4);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = snowColor;
      ctx.beginPath();
      ctx.moveTo(cx, sy + 3); ctx.lineTo(cx + 7, sy + 14); ctx.lineTo(cx - 7, sy + 14);
      ctx.closePath(); ctx.fill();

    } else if (tileType === OTILE.TOWN) {
      // Mini building (top-down)
      ctx.fillStyle = '#3a2860';
      ctx.fillRect(sx + 5, sy + 5, TS - 10, TS - 10);
      ctx.fillStyle = '#553388';
      ctx.fillRect(sx + 7, sy + 7, TS - 14, TS - 14);
      const glow = 0.5 + 0.5 * Math.sin(t * 1.5 + sx * 0.1);
      ctx.globalAlpha *= (0.8 + glow * 0.2);
      ctx.fillStyle = '#ffe880';
      ctx.fillRect(sx + 10, sy + 10, 5, 5);
      ctx.fillRect(sx + 17, sy + 10, 5, 5);

    } else if (tileType === OTILE.CAVE) {
      ctx.fillStyle = '#0d0a08';
      ctx.beginPath(); ctx.arc(cx, cy, TS * 0.35, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a120e';
      ctx.beginPath(); ctx.arc(cx, cy, TS * 0.22, 0, Math.PI * 2); ctx.fill();

    } else if (tileType === OTILE.WATER) {
      const wave = 0.3 + 0.1 * Math.sin(t * 1.8 + sx * 0.05);
      ctx.strokeStyle = `rgba(100,200,255,${wave})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, TS * 0.3, 0, Math.PI * 2); ctx.stroke();

    } else if (tileType === OTILE.SPECIAL) {
      const pulse = 0.6 + 0.4 * Math.abs(Math.sin(t * 0.8));
      ctx.fillStyle = `rgba(200,168,32,${pulse})`;
      ctx.fillRect(cx - 3, cy - 10, 6, 10);
      ctx.fillRect(cx + 3, cy - 7, 4, 7);
      ctx.fillStyle = '#c8a820';
      ctx.beginPath(); ctx.arc(cx, cy - 12, 4, 0, Math.PI * 2); ctx.fill();

    } else if (tileType === OTILE.TREASURE) {
      const shine = 0.7 + 0.3 * Math.sin(t * 2.5);
      ctx.fillStyle = '#8b6000';
      ctx.fillRect(sx + 8, sy + 10, TS - 16, TS - 20);
      ctx.fillStyle = `rgba(255,220,30,${shine})`;
      ctx.fillRect(sx + 9, sy + 10, TS - 18, 5);

    } else if (tileType === OTILE.SAND) {
      ctx.fillStyle = 'rgba(220,190,100,0.3)';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.arc(sx + 8 + i * 9, sy + 14, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(sx + 12 + i * 9, sy + 22, 2, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  _renderTopDownPlayer(r, ctx, W, H, camX, camY) {
    const px = this.game.overworldX, py = this.game.overworldY;
    const sx = px * TS - camX;
    const sy = py * TS - camY;
    const bob = Math.sin(this.animTime * 6) * 1.5;

    // Shadow
    ctx.save(); ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.ellipse(sx + TS/2, sy + TS - 5, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Body (tunic)
    ctx.fillStyle = '#4488ff';
    ctx.fillRect(sx + 9, sy + 14 + bob, TS - 18, TS - 24);
    // Belt
    ctx.fillStyle = '#aa8833';
    ctx.fillRect(sx + 9, sy + 22 + bob, TS - 18, 3);
    // Arms
    ctx.fillStyle = '#3355bb';
    ctx.fillRect(sx + 4, sy + 14 + bob, 5, TS - 27);
    ctx.fillRect(sx + TS - 9, sy + 14 + bob, 5, TS - 27);
    // Neck
    ctx.fillStyle = '#ffcc99';
    ctx.fillRect(sx + TS/2 - 3, sy + 9 + bob, 6, 5);
    // Head
    ctx.fillStyle = '#ffcc99';
    ctx.beginPath(); ctx.ellipse(sx + TS/2, sy + 7 + bob, 7, 8, 0, 0, Math.PI * 2); ctx.fill();
    // Hair
    ctx.fillStyle = '#553322';
    ctx.fillRect(sx + TS/2 - 7, sy + 1 + bob, 14, 5);
    // Eyes
    ctx.fillStyle = '#222222';
    ctx.fillRect(sx + TS/2 - 4, sy + 6 + bob, 2, 2);
    ctx.fillRect(sx + TS/2 + 2, sy + 6 + bob, 2, 2);
    // Direction arrow
    ctx.fillStyle = '#aabbff';
    ctx.beginPath();
    if (this.facing === 'down') {
      ctx.moveTo(sx + 10, sy + TS - 4 + bob); ctx.lineTo(sx + TS/2, sy + TS + 3 + bob); ctx.lineTo(sx + TS - 10, sy + TS - 4 + bob);
    } else if (this.facing === 'up') {
      ctx.moveTo(sx + 10, sy + 4 + bob); ctx.lineTo(sx + TS/2, sy - 3 + bob); ctx.lineTo(sx + TS - 10, sy + 4 + bob);
    } else if (this.facing === 'left') {
      ctx.moveTo(sx + 4, sy + 10 + bob); ctx.lineTo(sx - 3, sy + TS/2 + bob); ctx.lineTo(sx + 4, sy + TS - 10 + bob);
    } else {
      ctx.moveTo(sx + TS - 4, sy + 10 + bob); ctx.lineTo(sx + TS + 3, sy + TS/2 + bob); ctx.lineTo(sx + TS - 4, sy + TS - 10 + bob);
    }
    ctx.closePath(); ctx.fill();
  }

  _renderMinimap(r, W, H, ow) {
    if (!this.showMinimap) return;
    const mmSize = 140, mmTileSize = 2.5;
    const mmX = W - mmSize - 10, mmY = 10;
    r.drawRoundRect(mmX - 2, mmY - 2, mmSize + 4, mmSize + 4, 3, 'rgba(0,0,0,0.8)', '#445566', 1);

    const px = this.game.overworldX, py = this.game.overworldY;
    const startTX = px - Math.floor(mmSize / mmTileSize / 2);
    const startTY = py - Math.floor(mmSize / mmTileSize / 2);

    for (let ty = 0; ty < mmSize / mmTileSize; ty++) {
      for (let tx = 0; tx < mmSize / mmTileSize; tx++) {
        const gx = startTX + tx, gy = startTY + ty;
        if (gx < 0 || gy < 0 || gx >= ow.width || gy >= ow.height) continue;
        const fog = ow.fog[gy]?.[gx] ?? 0;
        if (fog === 0) continue;
        const tile = ow.grid[gy][gx];
        const col  = OTILE_COLOR[tile]?.top || '#334455';
        const alpha = fog === 1 ? 0.5 : 1;
        r.ctx.save(); r.ctx.globalAlpha = alpha;
        r.drawRect(mmX + tx * mmTileSize, mmY + ty * mmTileSize, mmTileSize, mmTileSize, col);
        r.ctx.restore();
      }
    }
    const pdx = (px - startTX) * mmTileSize + mmX;
    const pdy = (py - startTY) * mmTileSize + mmY;
    r.drawRect(pdx - 1, pdy - 1, mmTileSize + 2, mmTileSize + 2, '#ffffff');
    r.drawText('Map', mmX + 4, mmY + 4, '#8899bb', 10);
  }

  _renderHUD(r, W, H, ow) {
    r.drawRoundRect(0, H - 72, W, 72, 0, 'rgba(0,0,10,0.88)', '#223', 1);
    const party = this.game.party;
    if (party) {
      party.members.forEach((m, i) => {
        const bx = 10 + i * 195;
        r.drawText(`${m.name} Lv${m.level}`, bx, H - 68, m.alive ? '#ffffff' : '#664444', 12, 'left', 'monospace', true);
        r.drawBar(bx, H - 52, 175, 9, m.hp, m.maxHp, m.hp / m.maxHp < 0.3 ? '#ff4444' : '#44aa44');
        r.drawBar(bx, H - 40, 175, 9, m.mp, m.maxMp, '#4488cc');
      });
      r.drawText(`\uD83D\uDCB0 ${party.gold}g`, W - 150, H - 68, '#ffdd44', 14, 'left', 'monospace', true);
    }

    const tile = ow.grid[this.game.overworldY]?.[this.game.overworldX];
    const tileName = OTILE_NAME[tile] || '';
    r.drawText(tileName, W / 2, H - 68, '#aabbcc', 13, 'center', 'monospace', true);
    r.drawText('WASD/Arrows: Move  I: Inventory  M: Minimap', W / 2, H - 22, '#445566', 12, 'center');

    if (this.messageTimer > 0) {
      const alpha = Math.min(1, this.messageTimer * 2);
      r.ctx.save(); r.ctx.globalAlpha = alpha;
      r.drawRoundRect(W / 2 - 320, 18, 640, 36, 6, '#0a0a2a', '#5566aa', 1);
      r.drawTextCentered(this.message, W / 2, 28, '#ffffff', 14);
      r.ctx.restore();
    }
  }
}
